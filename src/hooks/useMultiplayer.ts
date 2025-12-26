import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Vector2D } from '@/types/game';

// Get WebSocket URL based on environment
const getServerUrl = () => {
  // Production: Use VITE_SERVER_URL environment variable
  if (import.meta.env.VITE_SERVER_URL) {
    const url = import.meta.env.VITE_SERVER_URL;
    // Convert http(s) to ws(s)
    return url.replace(/^http/, 'ws');
  }

  // Development: Auto-detect based on hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // If accessing via IP (not localhost), use same IP for server
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:3001`;
  }

  return 'ws://localhost:3001';
};

export interface RoomInfo {
  roomCode: string;
  playerIndex: number;
  hostName?: string;
  opponentName?: string;
  isHost: boolean;
}

export interface MultiplayerState {
  isConnected: boolean;
  isInRoom: boolean;
  roomInfo: RoomInfo | null;
  opponentReady: boolean;
  isReady: boolean;
  gameStarted: boolean;
  error: string | null;
}

interface UseMultiplayerReturn extends MultiplayerState {
  createRoom: (playerName: string) => Promise<RoomInfo>;
  joinRoom: (roomCode: string, playerName: string) => Promise<RoomInfo>;
  setReady: () => void;
  sendShoot: (direction: Vector2D, power: number) => void;
  sendGameState: (gameState: GameState) => void;
  sendRestart: (gameState: GameState) => void;
  initGameState: (gameState: GameState) => void;
  requestGameState: () => void;
  onOpponentShoot: (callback: (data: { direction: Vector2D; power: number }) => void) => void;
  onGameStateSync: (callback: (gameState: GameState, timestamp?: number) => void) => void;
  onGameRestart: (callback: (gameState: GameState) => void) => void;
  onSendGameStateRequest: (callback: () => void) => void;
  disconnect: () => void;
}

interface Message {
  type: string;
  [key: string]: unknown;
}

export function useMultiplayer(): UseMultiplayerReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (data: unknown) => void>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [state, setState] = useState<MultiplayerState>({
    isConnected: false,
    isInRoom: false,
    roomInfo: null,
    opponentReady: false,
    isReady: false,
    gameStarted: false,
    error: null,
  });

  const callbacksRef = useRef<{
    onOpponentShoot?: (data: { direction: Vector2D; power: number }) => void;
    onGameStateSync?: (gameState: GameState, timestamp?: number) => void;
    onGameRestart?: (gameState: GameState) => void;
    onSendGameStateRequest?: () => void;
  }>({});

  const send = useCallback((message: Message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleMessage = useCallback((data: string) => {
    let message: Message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }

    switch (message.type) {
      case 'connected':
        playerIdRef.current = message.playerId as string;
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        reconnectAttemptsRef.current = 0;
        break;

      case 'room-created': {
        const callback = pendingCallbacksRef.current.get('create-room');
        if (callback) {
          callback(message);
          pendingCallbacksRef.current.delete('create-room');
        }
        break;
      }

      case 'room-joined': {
        const callback = pendingCallbacksRef.current.get('join-room');
        if (callback) {
          callback(message);
          pendingCallbacksRef.current.delete('join-room');
        }
        break;
      }

      case 'join-error': {
        const callback = pendingCallbacksRef.current.get('join-room');
        if (callback) {
          callback(message);
          pendingCallbacksRef.current.delete('join-room');
        }
        break;
      }

      case 'player-joined':
        setState(prev => ({
          ...prev,
          roomInfo: prev.roomInfo ? {
            ...prev.roomInfo,
            opponentName: message.playerName as string,
          } : null,
        }));
        break;

      case 'player-ready-update':
        setState(prev => {
          if (prev.roomInfo && message.playerIndex !== prev.roomInfo.playerIndex) {
            return { ...prev, opponentReady: message.ready as boolean };
          }
          return prev;
        });
        break;

      case 'game-start':
        setState(prev => ({ ...prev, gameStarted: true }));
        break;

      case 'opponent-shoot':
        if (callbacksRef.current.onOpponentShoot) {
          callbacksRef.current.onOpponentShoot({
            direction: message.direction as Vector2D,
            power: message.power as number,
          });
        }
        break;

      case 'game-state-sync':
      case 'game-state-init':
        if (callbacksRef.current.onGameStateSync) {
          callbacksRef.current.onGameStateSync(
            message.gameState as GameState,
            message.timestamp as number | undefined
          );
        }
        break;

      case 'game-restarted':
        if (callbacksRef.current.onGameRestart) {
          callbacksRef.current.onGameRestart(message.gameState as GameState);
        }
        break;

      case 'player-disconnected':
        setState(prev => ({
          ...prev,
          error: 'Đối thủ đã ngắt kết nối',
          opponentReady: false,
        }));
        break;

      case 'send-game-state':
        if (callbacksRef.current.onSendGameStateRequest) {
          callbacksRef.current.onSendGameStateRequest();
        }
        break;

      case 'became-host':
        setState(prev => ({
          ...prev,
          roomInfo: prev.roomInfo ? { ...prev.roomInfo, isHost: true } : null,
        }));
        break;
    }
  }, []);

  const connect = useCallback((roomCode?: string, action?: 'create' | 'join') => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const baseUrl = getServerUrl();
    let wsUrl = `${baseUrl}/ws`;

    if (roomCode) {
      wsUrl += `?room=${roomCode}`;
      if (action) {
        wsUrl += `&action=${action}`;
      }
    } else if (action === 'create') {
      wsUrl += '?action=create';
    }

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      handleMessage(event.data);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setState(prev => ({ ...prev, isConnected: false }));

      // Attempt reconnection if in a room
      if (state.isInRoom && reconnectAttemptsRef.current < 5) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (state.roomInfo) {
            connect(state.roomInfo.roomCode, 'join');
          }
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setState(prev => ({ ...prev, error: 'Failed to connect to server' }));
    };

    wsRef.current = ws;
  }, [handleMessage, state.isInRoom, state.roomInfo]);

  // Initial connection (no room)
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const createRoom = useCallback((playerName: string): Promise<RoomInfo> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        // Reconnect with create action
        connect(undefined, 'create');

        // Wait for connection
        const checkConnection = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            doCreate();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error('Failed to connect to server'));
        }, 5000);

        return;
      }

      doCreate();

      function doCreate() {
        pendingCallbacksRef.current.set('create-room', (response: unknown) => {
          const msg = response as Message;
          if (msg.success) {
            const roomInfo: RoomInfo = {
              roomCode: msg.roomCode as string,
              playerIndex: msg.playerIndex as number,
              isHost: true,
            };
            setState(prev => ({
              ...prev,
              isInRoom: true,
              roomInfo,
              error: null,
              isReady: false,
              opponentReady: false,
              gameStarted: false,
            }));
            resolve(roomInfo);
          } else {
            reject(new Error((msg.error as string) || 'Failed to create room'));
          }
        });

        send({ type: 'create-room', playerName });
      }
    });
  }, [connect, send]);

  const joinRoom = useCallback((roomCode: string, playerName: string): Promise<RoomInfo> => {
    return new Promise((resolve, reject) => {
      const normalizedCode = roomCode.toUpperCase();

      // Connect to the specific room
      connect(normalizedCode, 'join');

      // Wait for connection and set up callback
      const checkConnection = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && playerIdRef.current) {
          clearInterval(checkConnection);

          pendingCallbacksRef.current.set('join-room', (response: unknown) => {
            const msg = response as Message;
            if (msg.type === 'room-joined' && msg.success) {
              const roomInfo: RoomInfo = {
                roomCode: msg.roomCode as string,
                playerIndex: msg.playerIndex as number,
                hostName: msg.hostName as string,
                isHost: false,
              };
              setState(prev => ({
                ...prev,
                isInRoom: true,
                roomInfo,
                opponentReady: false,
                isReady: false,
                gameStarted: false,
                error: null,
              }));
              resolve(roomInfo);
            } else {
              reject(new Error((msg.error as string) || 'Failed to join room'));
            }
          });

          send({ type: 'join-room', roomCode: normalizedCode, playerName });
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkConnection);
        reject(new Error('Failed to connect to server'));
      }, 5000);
    });
  }, [connect, send]);

  const setReady = useCallback(() => {
    send({ type: 'player-ready' });
    setState(prev => ({ ...prev, isReady: true }));
  }, [send]);

  const sendShoot = useCallback((direction: Vector2D, power: number) => {
    send({ type: 'player-shoot', direction, power });
  }, [send]);

  const sendGameState = useCallback((gameState: GameState) => {
    send({ type: 'game-state-update', gameState, timestamp: Date.now() });
  }, [send]);

  const sendRestart = useCallback((gameState: GameState) => {
    send({ type: 'restart-game', gameState });
  }, [send]);

  const initGameState = useCallback((gameState: GameState) => {
    send({ type: 'init-game-state', gameState });
  }, [send]);

  const requestGameState = useCallback(() => {
    send({ type: 'request-game-state' });
  }, [send]);

  const onOpponentShoot = useCallback((callback: (data: { direction: Vector2D; power: number }) => void) => {
    callbacksRef.current.onOpponentShoot = callback;
  }, []);

  const onGameStateSync = useCallback((callback: (gameState: GameState, timestamp?: number) => void) => {
    callbacksRef.current.onGameStateSync = callback;
  }, []);

  const onGameRestart = useCallback((callback: (gameState: GameState) => void) => {
    callbacksRef.current.onGameRestart = callback;
  }, []);

  const onSendGameStateRequest = useCallback((callback: () => void) => {
    callbacksRef.current.onSendGameStateRequest = callback;
  }, []);

  const disconnect = useCallback(() => {
    // Reset state
    setState(prev => ({
      ...prev,
      isInRoom: false,
      roomInfo: null,
      opponentReady: false,
      isReady: false,
      gameStarted: false,
      error: null,
    }));

    // Clear callbacks
    callbacksRef.current = {};
    pendingCallbacksRef.current.clear();

    // Reconnect fresh
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return {
    ...state,
    createRoom,
    joinRoom,
    setReady,
    sendShoot,
    sendGameState,
    sendRestart,
    initGameState,
    requestGameState,
    onOpponentShoot,
    onGameStateSync,
    onGameRestart,
    onSendGameStateRequest,
    disconnect,
  };
}

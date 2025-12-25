import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Vector2D } from '@/types/game';

// Auto-detect server URL based on current hostname
// This allows mobile devices on the same network to connect
const getServerUrl = () => {
  const hostname = window.location.hostname;
  // If accessing via IP (not localhost), use same IP for server
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
};

const SERVER_URL = getServerUrl();

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
  onGameStateSync: (callback: (gameState: GameState) => void) => void;
  onGameRestart: (callback: (gameState: GameState) => void) => void;
  onSendGameStateRequest: (callback: () => void) => void;
  disconnect: () => void;
}

export function useMultiplayer(): UseMultiplayerReturn {
  const socketRef = useRef<Socket | null>(null);
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
    onGameStateSync?: (gameState: GameState) => void;
    onGameRestart?: (gameState: GameState) => void;
    onSendGameStateRequest?: () => void;
  }>({});

  // Initialize socket connection
  useEffect(() => {
    console.log('Connecting to server:', SERVER_URL);

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to game server, socket id:', socket.id);
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from game server:', reason);
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setState(prev => ({ ...prev, error: 'Không thể kết nối server' }));
    });

    socket.on('player-joined', (data: { playerName: string; playerIndex: number }) => {
      console.log('Player joined:', data);
      setState(prev => ({
        ...prev,
        roomInfo: prev.roomInfo ? {
          ...prev.roomInfo,
          opponentName: data.playerName
        } : null
      }));
    });

    socket.on('player-ready-update', (data: { playerIndex: number; ready: boolean }) => {
      console.log('Player ready update:', data);
      setState(prev => {
        if (prev.roomInfo && data.playerIndex !== prev.roomInfo.playerIndex) {
          return { ...prev, opponentReady: data.ready };
        }
        return prev;
      });
    });

    socket.on('game-start', () => {
      console.log('Game starting!');
      setState(prev => ({ ...prev, gameStarted: true }));
    });

    socket.on('opponent-shoot', (data: { direction: Vector2D; power: number }) => {
      console.log('Opponent shoot:', data);
      if (callbacksRef.current.onOpponentShoot) {
        callbacksRef.current.onOpponentShoot(data);
      }
    });

    socket.on('game-state-sync', (gameState: GameState) => {
      console.log('Game state sync received');
      if (callbacksRef.current.onGameStateSync) {
        callbacksRef.current.onGameStateSync(gameState);
      }
    });

    socket.on('game-state-init', (gameState: GameState) => {
      console.log('Game state init received');
      if (callbacksRef.current.onGameStateSync) {
        callbacksRef.current.onGameStateSync(gameState);
      }
    });

    socket.on('game-restarted', (gameState: GameState) => {
      console.log('Game restarted');
      if (callbacksRef.current.onGameRestart) {
        callbacksRef.current.onGameRestart(gameState);
      }
    });

    socket.on('player-disconnected', () => {
      console.log('Opponent disconnected');
      setState(prev => ({
        ...prev,
        error: 'Đối thủ đã ngắt kết nối',
        opponentReady: false
      }));
    });

    // Host receives request to send game state
    socket.on('send-game-state', () => {
      console.log('Received request to send game state');
      if (callbacksRef.current.onSendGameStateRequest) {
        callbacksRef.current.onSendGameStateRequest();
      }
    });

    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((playerName: string): Promise<RoomInfo> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        reject(new Error('Chưa kết nối server'));
        return;
      }

      console.log('Creating room for:', playerName);
      socketRef.current.emit('create-room', playerName, (response: any) => {
        console.log('Create room response:', response);
        if (response.success) {
          const roomInfo: RoomInfo = {
            roomCode: response.roomCode,
            playerIndex: response.playerIndex,
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
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string): Promise<RoomInfo> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        reject(new Error('Chưa kết nối server'));
        return;
      }

      console.log('Joining room:', roomCode, 'as:', playerName);
      socketRef.current.emit('join-room', roomCode, playerName, (response: any) => {
        console.log('Join room response:', response);
        if (response.success) {
          const roomInfo: RoomInfo = {
            roomCode: response.roomCode,
            playerIndex: response.playerIndex,
            hostName: response.hostName,
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
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const setReady = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Setting ready');
      socketRef.current.emit('player-ready');
      setState(prev => ({ ...prev, isReady: true }));
    }
  }, []);

  const sendShoot = useCallback((direction: Vector2D, power: number) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Sending shoot:', { direction, power });
      socketRef.current.emit('player-shoot', { direction, power });
    }
  }, []);

  const sendGameState = useCallback((gameState: GameState) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('game-state-update', gameState);
    }
  }, []);

  const sendRestart = useCallback((gameState: GameState) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Sending restart');
      socketRef.current.emit('restart-game', gameState);
    }
  }, []);

  const initGameState = useCallback((gameState: GameState) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Sending init game state');
      socketRef.current.emit('init-game-state', gameState);
    }
  }, []);

  const requestGameState = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Requesting game state from server');
      socketRef.current.emit('request-game-state');
    }
  }, []);

  const onOpponentShoot = useCallback((callback: (data: { direction: Vector2D; power: number }) => void) => {
    callbacksRef.current.onOpponentShoot = callback;
  }, []);

  const onGameStateSync = useCallback((callback: (gameState: GameState) => void) => {
    callbacksRef.current.onGameStateSync = callback;
  }, []);

  const onGameRestart = useCallback((callback: (gameState: GameState) => void) => {
    callbacksRef.current.onGameRestart = callback;
  }, []);

  const onSendGameStateRequest = useCallback((callback: () => void) => {
    callbacksRef.current.onSendGameStateRequest = callback;
  }, []);

  const disconnect = useCallback(() => {
    console.log('Disconnecting from room');
    // Just reset state, keep socket connected for new games
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

    // Reconnect socket to get fresh state
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

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

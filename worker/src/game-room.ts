// GameRoom Durable Object - Manages a single game room
// Each room is identified by a 6-character code

interface Player {
  id: string;
  name: string;
  playerIndex: number;
  ready: boolean;
  webSocket: WebSocket;
}

interface GameState {
  players: unknown[];
  obstacles: unknown[];
  holes: unknown[];
  currentPlayer: number;
  winner: number | null;
  isPaused: boolean;
}

interface Message {
  type: string;
  [key: string]: unknown;
}

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

export class GameRoom {
  private state: DurableObjectState;
  private env: Env;
  private players: Map<string, Player> = new Map();
  private hostId: string | null = null;
  private gameState: GameState | null = null;
  private gameStarted: boolean = false;
  private roomCode: string = '';

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Extract room code from URL
    this.roomCode = url.searchParams.get('room') || 'unknown';

    // Handle WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    server.accept();

    // Generate unique player ID
    const playerId = crypto.randomUUID();

    // Set up message handler
    server.addEventListener('message', (event) => {
      this.handleMessage(server, playerId, event.data as string);
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(playerId);
    });

    server.addEventListener('error', () => {
      this.handleDisconnect(playerId);
    });

    // Send connection confirmation
    server.send(JSON.stringify({
      type: 'connected',
      playerId,
    }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleMessage(ws: WebSocket, playerId: string, data: string): void {
    let message: Message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }

    switch (message.type) {
      case 'create-room':
        this.handleCreateRoom(ws, playerId, message);
        break;
      case 'join-room':
        this.handleJoinRoom(ws, playerId, message);
        break;
      case 'player-ready':
        this.handlePlayerReady(playerId);
        break;
      case 'init-game-state':
        this.handleInitGameState(playerId, message);
        break;
      case 'request-game-state':
        this.handleRequestGameState(ws, playerId);
        break;
      case 'player-shoot':
        this.handlePlayerShoot(playerId, message);
        break;
      case 'game-state-update':
        this.handleGameStateUpdate(playerId, message);
        break;
      case 'restart-game':
        this.handleRestartGame(playerId, message);
        break;
    }
  }

  private handleCreateRoom(ws: WebSocket, playerId: string, message: Message): void {
    const playerName = (message.playerName as string) || 'Người chơi 1';

    const player: Player = {
      id: playerId,
      name: playerName,
      playerIndex: 0,
      ready: false,
      webSocket: ws,
    };

    this.players.set(playerId, player);
    this.hostId = playerId;

    ws.send(JSON.stringify({
      type: 'room-created',
      success: true,
      roomCode: this.roomCode,
      playerIndex: 0,
    }));
  }

  private handleJoinRoom(ws: WebSocket, playerId: string, message: Message): void {
    const playerName = (message.playerName as string) || 'Người chơi 2';

    // Check if room has a host
    if (!this.hostId || !this.players.has(this.hostId)) {
      ws.send(JSON.stringify({
        type: 'join-error',
        error: 'Không tìm thấy phòng',
      }));
      return;
    }

    // Check if room is full
    if (this.players.size >= 2) {
      ws.send(JSON.stringify({
        type: 'join-error',
        error: 'Phòng đã đầy',
      }));
      return;
    }

    // Check if game already started
    if (this.gameStarted) {
      ws.send(JSON.stringify({
        type: 'join-error',
        error: 'Game đã bắt đầu',
      }));
      return;
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      playerIndex: 1,
      ready: false,
      webSocket: ws,
    };

    this.players.set(playerId, player);

    // Get host info
    const host = this.players.get(this.hostId);

    // Notify the guest
    ws.send(JSON.stringify({
      type: 'room-joined',
      success: true,
      roomCode: this.roomCode,
      playerIndex: 1,
      hostName: host?.name,
    }));

    // Notify host that player joined
    if (host) {
      this.sendTo(host.webSocket, {
        type: 'player-joined',
        playerName: playerName,
        playerIndex: 1,
      });
    }
  }

  private handlePlayerReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.ready = true;

    // Broadcast ready status to all players
    this.broadcast({
      type: 'player-ready-update',
      playerIndex: player.playerIndex,
      ready: true,
    });

    // Check if both players are ready
    if (this.players.size === 2) {
      const allReady = Array.from(this.players.values()).every(p => p.ready);
      if (allReady) {
        this.gameStarted = true;
        this.broadcast({ type: 'game-start' });
      }
    }
  }

  private handleInitGameState(playerId: string, message: Message): void {
    // Only host can init game state
    if (playerId !== this.hostId) return;

    this.gameState = message.gameState as GameState;

    // Send to all non-host players
    this.players.forEach((player) => {
      if (player.id !== this.hostId) {
        this.sendTo(player.webSocket, {
          type: 'game-state-init',
          gameState: this.gameState,
        });
      }
    });
  }

  private handleRequestGameState(ws: WebSocket, playerId: string): void {
    if (this.gameState) {
      this.sendTo(ws, {
        type: 'game-state-init',
        gameState: this.gameState,
      });
    } else if (this.hostId) {
      // Ask host to send game state
      const host = this.players.get(this.hostId);
      if (host) {
        this.sendTo(host.webSocket, {
          type: 'send-game-state',
        });
      }
    }
  }

  private handlePlayerShoot(playerId: string, message: Message): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Forward to other players
    this.players.forEach((p) => {
      if (p.id !== playerId) {
        this.sendTo(p.webSocket, {
          type: 'opponent-shoot',
          direction: message.direction,
          power: message.power,
        });
      }
    });
  }

  private handleGameStateUpdate(playerId: string, message: Message): void {
    this.gameState = message.gameState as GameState;

    // Forward to other players
    this.players.forEach((p) => {
      if (p.id !== playerId) {
        this.sendTo(p.webSocket, {
          type: 'game-state-sync',
          gameState: this.gameState,
        });
      }
    });
  }

  private handleRestartGame(playerId: string, message: Message): void {
    this.gameState = message.gameState as GameState;

    // Broadcast to all players
    this.broadcast({
      type: 'game-restarted',
      gameState: this.gameState,
    });
  }

  private handleDisconnect(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Notify other players
    this.players.forEach((p) => {
      if (p.id !== playerId) {
        this.sendTo(p.webSocket, {
          type: 'player-disconnected',
          playerIndex: player.playerIndex,
        });
      }
    });

    this.players.delete(playerId);

    // If host disconnected, transfer to remaining player
    if (playerId === this.hostId) {
      const remaining = Array.from(this.players.values())[0];
      if (remaining) {
        this.hostId = remaining.id;
        this.sendTo(remaining.webSocket, { type: 'became-host' });
      } else {
        this.hostId = null;
      }
    }

    // Reset game state if no players
    if (this.players.size === 0) {
      this.gameState = null;
      this.gameStarted = false;
    }
  }

  private sendTo(ws: WebSocket, message: object): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Socket might be closed
    }
  }

  private broadcast(message: object): void {
    const data = JSON.stringify(message);
    this.players.forEach((player) => {
      try {
        player.webSocket.send(data);
      } catch {
        // Socket might be closed
      }
    });
  }
}

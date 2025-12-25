import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active rooms
const rooms = new Map();

// Generate 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', (playerName, callback) => {
    const roomCode = generateRoomCode();

    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        name: playerName || 'Người chơi 1',
        playerIndex: 0,
        ready: false
      }],
      gameState: null,
      gameStarted: false
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 0;

    console.log(`Room ${roomCode} created by ${playerName}`);
    callback({ success: true, roomCode, playerIndex: 0 });
  });

  // Join existing room
  socket.on('join-room', (roomCode, playerName, callback) => {
    const room = rooms.get(roomCode.toUpperCase());

    if (!room) {
      callback({ success: false, error: 'Không tìm thấy phòng' });
      return;
    }

    if (room.players.length >= 2) {
      callback({ success: false, error: 'Phòng đã đầy' });
      return;
    }

    if (room.gameStarted) {
      callback({ success: false, error: 'Game đã bắt đầu' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || 'Người chơi 2',
      playerIndex: 1,
      ready: false
    };

    room.players.push(player);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 1;

    console.log(`${playerName} joined room ${roomCode}`);

    // Notify host
    io.to(room.host).emit('player-joined', {
      playerName: player.name,
      playerIndex: 1
    });

    callback({
      success: true,
      roomCode,
      playerIndex: 1,
      hostName: room.players[0].name
    });
  });

  // Player ready
  socket.on('player-ready', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      io.to(socket.roomCode).emit('player-ready-update', {
        playerIndex: player.playerIndex,
        ready: true
      });

      // Check if both players are ready
      if (room.players.length === 2 && room.players.every(p => p.ready)) {
        room.gameStarted = true;
        io.to(socket.roomCode).emit('game-start');
        console.log(`Game started in room ${socket.roomCode}`);
      }
    }
  });

  // Host sends initial game state
  socket.on('init-game-state', (gameState) => {
    const room = rooms.get(socket.roomCode);
    if (!room || socket.id !== room.host) return;

    room.gameState = gameState;
    console.log(`Game state saved for room ${socket.roomCode}`);
    socket.to(socket.roomCode).emit('game-state-init', gameState);
  });

  // Guest requests game state (in case they missed init)
  socket.on('request-game-state', () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    console.log(`Player ${socket.id} requesting game state for room ${socket.roomCode}`);
    if (room.gameState) {
      socket.emit('game-state-init', room.gameState);
      console.log(`Sent saved game state to player ${socket.id}`);
    } else {
      // Ask host to send game state
      io.to(room.host).emit('send-game-state');
      console.log(`Asked host to send game state`);
    }
  });

  // Player shoots (send to host for processing if not host)
  socket.on('player-shoot', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    // Forward to other player
    socket.to(socket.roomCode).emit('opponent-shoot', data);
  });

  // Game state update (from host to guest)
  socket.on('game-state-update', (gameState) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    room.gameState = gameState;
    socket.to(socket.roomCode).emit('game-state-sync', gameState);
  });

  // Restart game
  socket.on('restart-game', (gameState) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;

    room.gameState = gameState;
    io.to(socket.roomCode).emit('game-restarted', gameState);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    if (socket.roomCode) {
      const room = rooms.get(socket.roomCode);
      if (room) {
        // Notify other player
        socket.to(socket.roomCode).emit('player-disconnected', {
          playerIndex: socket.playerIndex
        });

        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);

        // If room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(socket.roomCode);
          console.log(`Room ${socket.roomCode} deleted`);
        } else if (socket.id === room.host && room.players.length > 0) {
          // Transfer host to remaining player
          room.host = room.players[0].id;
          io.to(room.host).emit('became-host');
        }
      }
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Neon Marble Game Server',
    activeRooms: rooms.size
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
  console.log(`🎮 Game server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT} (accessible from other devices)`);
});

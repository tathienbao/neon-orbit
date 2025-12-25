// Cloudflare Worker entry point for Neon Marble Game API
// Handles WebSocket connections and routes to Durable Objects

export { GameRoom } from './game-room';

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

// Generate 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// CORS headers for cross-origin requests
function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'Neon Marble Game Server (Cloudflare Workers)',
          version: '2.0.0',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        }
      );
    }

    // WebSocket connection endpoint
    if (url.pathname === '/ws' || url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket upgrade', {
          status: 426,
          headers: corsHeaders(origin),
        });
      }

      // Get or generate room code
      let roomCode = url.searchParams.get('room');
      const action = url.searchParams.get('action'); // 'create' or 'join'

      if (action === 'create' || !roomCode) {
        // Generate new room code for creation
        roomCode = generateRoomCode();
      }

      roomCode = roomCode.toUpperCase();

      // Get Durable Object for this room
      const id = env.GAME_ROOM.idFromName(roomCode);
      const room = env.GAME_ROOM.get(id);

      // Forward the request to the Durable Object
      const wsUrl = new URL(request.url);
      wsUrl.searchParams.set('room', roomCode);

      return room.fetch(new Request(wsUrl.toString(), request));
    }

    // API to create room (returns room code without WebSocket)
    if (url.pathname === '/api/create-room') {
      const roomCode = generateRoomCode();
      return new Response(
        JSON.stringify({ roomCode }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
          },
        }
      );
    }

    // 404 for unknown routes
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders(origin),
    });
  },
};

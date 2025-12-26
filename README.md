# Neon Marble

A 2-player marble shooting game with neon cyberpunk aesthetics. Supports local play (same device) and online multiplayer (different devices via LAN/WiFi or internet).

## Features

- **2 Game Modes:**
  - **Local**: 2 players take turns on the same device
  - **Online**: 2 different devices via network

- **Gameplay:**
  - Joystick control (drag to aim, release to shoot)
  - Realistic physics: collisions, friction, bouncing
  - Random map with obstacles
  - First player to get their marble in the goal wins

- **Mobile Optimized:**
  - Responsive layout with 5:3 joystick area
  - PWA installable (Add to Home Screen)
  - Touch-friendly controls

- **Smart Camera:**
  - Boundary zone detection for smooth tracking
  - Fast follow when marble approaches viewport edge
  - Hysteresis to prevent jitter

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend (Production):** Cloudflare Workers + Durable Objects
- **Backend (Local Dev):** Wrangler (local Cloudflare simulator)
- **Rendering:** HTML5 Canvas

## Installation

```bash
# Clone repo
git clone https://github.com/tathienbao/neon-orbit.git
cd neon-orbit

# Install dependencies (frontend + worker)
npm install
npm run worker:install

# Run development
npm run dev          # Frontend only (local mode)
npm run server       # Backend with Wrangler (online mode)
npm run dev:all      # Both frontend + backend
```

## Playing Online (2 different devices)

1. Run server: `npm run server`
2. Run frontend: `npm run dev`
3. **Device 1**: Open `http://localhost:8080` → Create room → Copy room code
4. **Device 2**: Open `http://<host-ip>:8080` → Join room → Enter code
5. Both click "Ready" → Game starts!

**Note:** Both devices must be on the same WiFi/LAN network for local development.

## Production

- **Frontend**: https://neon-marble.pages.dev
- **Backend**: https://neon-marble-api.tathienbao-ttb.workers.dev

## Project Structure

```
neon-orbit/
├── worker/                   # Backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts         # Worker entry point
│   │   └── game-room.ts     # Durable Object
│   ├── wrangler.toml        # Cloudflare config
│   └── package.json
├── src/
│   ├── components/          # React components
│   │   ├── GameCanvas.tsx   # Canvas rendering + physics
│   │   ├── Joystick.tsx     # Touch/mouse input
│   │   ├── LobbyScreen.tsx  # Room creation/joining
│   │   └── ...
│   ├── config/
│   │   └── gameConfig.ts    # Centralized game config
│   ├── hooks/
│   │   └── useMultiplayer.ts
│   ├── types/
│   │   └── game.ts
│   └── utils/
│       ├── physics.ts       # Physics engine
│       └── mapGenerator.ts
├── public/
│   ├── logo.svg            # PWA logo
│   ├── favicon.svg         # Browser favicon
│   └── manifest.json       # PWA manifest
├── docs/
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── CAMERA-BOUNDARY-ZONE.md
│   └── ...
├── DEVLOG.md               # Development log
└── package.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run frontend dev server |
| `npm run server` | Run Wrangler dev server |
| `npm run dev:all` | Run both frontend + backend |
| `npm run build` | Build for production |
| `npm run worker:install` | Install worker dependencies |
| `npm run worker:deploy` | Deploy worker to Cloudflare |

## Keyboard Shortcuts

- **ESC** or **P**: Pause/Resume game
- **C**: Toggle camera debug visualization (boundary zones)

## License

MIT

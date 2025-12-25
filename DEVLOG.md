# Development Log - Neon Marble

Nhật ký phát triển dự án game Neon Marble.

---

## 2025-12-25 (Tối)

### Cloudflare Workers Backend

**Backend mới (Cloudflare Workers + Durable Objects):**
- Tạo `worker/` folder với cấu trúc Cloudflare Workers
- Implement `GameRoom` Durable Object để quản lý phòng chơi
- Migrate từ Socket.io sang native WebSocket API
- Mỗi room là một Durable Object instance riêng biệt

**Thay đổi Frontend:**
- Rewrite `useMultiplayer.ts` để dùng native WebSocket
- Xóa dependency socket.io-client
- Hỗ trợ auto-detect server URL cho cả local và production

**Files mới:**
- `worker/package.json` - Worker dependencies
- `worker/wrangler.toml` - Cloudflare Workers config
- `worker/src/index.ts` - Worker entry point
- `worker/src/game-room.ts` - Durable Object class

**Scripts mới:**
- `npm run server` → Chạy Wrangler dev (thay vì Socket.io)
- `npm run server:legacy` → Chạy Socket.io server cũ
- `npm run worker:deploy` → Deploy lên Cloudflare

**Trạng thái:**
- ✅ Worker chạy local với Wrangler dev
- ✅ Frontend dùng native WebSocket
- ⏳ Chưa deploy lên production

---

## 2025-12-25 (Chiều)

### Chuẩn bị Deployment

**Documentation:**
- Viết docs/DEPLOYMENT.md - Hướng dẫn triển khai lên Cloudflare
- Cập nhật README.md với đầy đủ thông tin dự án

**Quyết định kiến trúc production:**
- Frontend → Cloudflare Pages (free, global CDN)
- Backend → Cloudflare Workers + Durable Objects (free tier đủ dùng)
- Không dùng Render/Vercel/Railway vì muốn tất cả trên 1 platform

---

## 2025-12-25 (Sáng)

### Online Multiplayer & Code Refactoring

**Tính năng mới:**
- Thêm WebSocket server với Socket.io để hỗ trợ chơi online
- Hệ thống phòng chơi: tạo phòng, join bằng mã 6 ký tự
- Lobby screen với hiển thị trạng thái kết nối
- Hỗ trợ 2 người chơi trên 2 thiết bị khác nhau qua mạng LAN/WiFi
- Tự động detect IP server khi truy cập từ thiết bị khác
- Sync game state real-time giữa host và guest

**Cải thiện code:**
- Tạo `gameConfig.ts` để tập trung tất cả magic numbers
- Fix performance issue trong game loop (dùng refs thay vì recreate mỗi frame)
- Fix memory leak trong Joystick component (stable event handlers)
- Thêm tính năng Pause/Resume (phím ESC hoặc P)
- Thêm ErrorBoundary để xử lý lỗi gracefully
- Fix camera auto-scroll khi đổi lượt giữa 2 người chơi
- Refactor `physics.ts` để hỗ trợ N players (không còn hardcode 2)
- Dọn dẹp unused types trong `game.ts`

**Files mới:**
- `server/index.js` - WebSocket game server
- `src/config/gameConfig.ts` - Cấu hình tập trung
- `src/hooks/useMultiplayer.ts` - Hook quản lý multiplayer
- `src/components/LobbyScreen.tsx` - UI lobby
- `src/components/OnlineMarbleGame.tsx` - Game component online
- `src/components/ErrorBoundary.tsx` - Error handling

**Bug fixes:**
- Camera không scroll đến người chơi tiếp theo khi đổi lượt
- Guest không nhận được game state khi host ready trước

---

## 2025-12-24

### Initial Game Implementation

**Tính năng:**
- Scaffold game Neon Marble với React + TypeScript + Canvas
- Physics engine: va chạm marble-marble, marble-obstacle, wall bouncing
- Joystick control với touch/mouse support
- Map generator với random obstacles
- UI neon cyberpunk với hiệu ứng glow
- 2 người chơi local, luân phiên

**Components:**
- `NeonMarbleGame` - Main game orchestrator
- `GameCanvas` - Canvas rendering + physics loop
- `Joystick` - Input control
- `GameUI` - Status display
- `WinnerModal` - Victory screen

**Utils:**
- `physics.ts` - Vector math, collision detection/resolution
- `mapGenerator.ts` - Random map generation

---

## 2025-01-01

### Project Setup

- Khởi tạo project từ template Vite + React + shadcn/ui + Tailwind CSS
- Cấu hình TypeScript, ESLint, PostCSS

# Development Log - Neon Marble

Nhật ký phát triển dự án game Neon Marble.

---

## 2025-12-25

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

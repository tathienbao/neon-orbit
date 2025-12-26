# Development Log - Neon Marble

Nhật ký phát triển dự án game Neon Marble.

---

## 2025-12-26

### Camera Panning - Boundary Zone + Hysteresis

**Vấn đề ban đầu:**
- Camera dùng easing-only → chậm lại khi gần target
- Bi bay nhanh ra khỏi viewport → camera không theo kịp
- Thử approach phức tạp (directional offset, delayed turn end) → gây bugs về logic đổi lượt

**Ý tưởng của user (sáng tạo!):**

> "Ước chừng viewport thành 4 phần theo chiều dọc, 2 phần giữa là khung giới hạn (safe zone).
> Camera pan như cũ, nhưng nếu bi chạm vào boundary thì camera phải chạy theo với tốc độ cao nhất."

**Implementation:**

1. **Boundary Zone Detection:**
   - Viewport chia 4 phần: `[boundary 25%][safe 25%][safe 25%][boundary 25%]`
   - Bi ở safe zone → camera pan smooth (easing 0.1)
   - Bi chạm boundary → camera follow nhanh (easing 0.5)

2. **Debug Visualization:**
   - Nhấn phím **C** để toggle khung cam màu cam
   - Hiển thị boundary lines để kiểm chứng

3. **Jitter Fix với Hysteresis:**
   - Vấn đề: Camera nhảy nhanh → bi "về" safe → camera chậm → bi "ra" boundary → oscillation
   - Giải pháp: Khi vào fast mode, **giữ fast mode** cho đến khi camera bắt kịp (distance < 50px)

**Config (`CAMERA_CONFIG`):**
```typescript
BOUNDARY_RATIO: 0.25,        // 25% top/bottom là boundary
NORMAL_EASING: 0.1,          // Smooth pan trong safe zone
FAST_EASING: 0.5,            // Fast follow trong boundary
FAST_FOLLOW_MIN_VELOCITY: 5, // Chỉ fast follow khi bi chạy nhanh
```

**Files thay đổi:**
- `src/config/gameConfig.ts` - Thêm CAMERA_CONFIG
- `src/components/GameCanvas.tsx` - Boundary detection, hysteresis, debug frame

**Kết quả:**
- ✅ Camera theo kịp bi khi bay nhanh
- ✅ Smooth pan khi bi di chuyển chậm trong safe zone
- ✅ Không còn jitter nhờ hysteresis
- ✅ Logic đổi lượt không bị ảnh hưởng (giữ nguyên code cũ)

**Docs:** `docs/CAMERA-BOUNDARY-ZONE.md` - Chi tiết implementation

---

## 2025-12-25 (Đêm)

### Buffered Playback - Fix Ghost Effect

**Vấn đề:**
- Player 2 (Guest) thấy bi "nhảy lùi" khi opponent bắn (Ghost Effect)
- Nguyên nhân: Guest chạy physics độc lập, nhận state cũ từ Host (do network latency)
- Khi ghi đè state → bi nhảy từ vị trí mới về vị trí cũ

**Thử nghiệm Entity Interpolation:**
- Thử dùng timestamp-based interpolation như các game FPS
- Quá phức tạp, nhiều edge cases, vẫn bị bugs

**Giải pháp cuối cùng: Buffered Playback (Custom)**

Ý tưởng sáng tạo: Vì đây là game turn-based, chấp nhận delay để đổi lấy smoothness.

- Player đang chơi: chạy physics locally, gửi states liên tục
- Player đang đợi: buffer tất cả states vào queue, phát lại theo thứ tự
- Buffer absorbs network jitter → animation luôn mượt mà
- Symmetric: cả Host và Guest đều gửi/nhận states khi đến lượt

**Kiến trúc:**
```
Active player:  Physics → displayState → sendGameState()
Passive player: receiveState → buffer.push() → playback loop → displayState
```

**Files thay đổi:**
- `src/components/OnlineMarbleGame.tsx` - Buffered playback logic
- `src/components/GameCanvas.tsx` - Skip physics khi opponent's turn
- `docs/PLAN-GHOST-EFFECT-FIX.md` - Document giải pháp

**Kết quả:**
- P2 thấy animation mượt mà (delay ~0.5s nhưng liền mạch)
- P1 cũng thấy mượt khi P2 chơi
- Không còn ghost effect, không còn freeze

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
- ✅ Deployed lên production

**Production URLs:**
- Frontend: https://neon-marble.pages.dev
- Backend: https://neon-marble-api.tathienbao-ttb.workers.dev

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

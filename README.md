# Neon Marble

Game bắn bi 2 người chơi với phong cách neon cyberpunk. Hỗ trợ chơi local (cùng máy) và online (khác thiết bị qua mạng LAN/WiFi).

## Screenshots

![Game Screenshot](docs/screenshot.png)

## Tính năng

- **2 chế độ chơi:**
  - **Local**: 2 người chơi luân phiên trên cùng 1 thiết bị
  - **Online**: 2 thiết bị khác nhau qua mạng LAN/WiFi

- **Gameplay:**
  - Điều khiển bằng joystick (kéo để ngắm, thả để bắn)
  - Vật lý thực tế: va chạm, ma sát, phản xạ
  - Map ngẫu nhiên với obstacles
  - Ai đưa bi vào lỗ xanh trước thắng

- **Tính năng khác:**
  - Pause/Resume (nhấn ESC hoặc P)
  - Camera tự động theo dõi bi
  - Hiệu ứng neon đẹp mắt
  - Responsive trên mobile và desktop

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, Socket.io
- **Rendering:** HTML5 Canvas

## Cài đặt

```bash
# Clone repo
git clone https://github.com/tathienbao/neon-orbit.git
cd neon-orbit

# Cài dependencies
npm install

# Chạy development
npm run dev          # Chỉ frontend (local mode)
npm run server       # Chỉ backend (online mode)
npm run dev:all      # Cả frontend + backend
```

## Chơi Online (2 thiết bị khác nhau)

1. Chạy server: `npm run server`
2. Chạy frontend: `npm run dev`
3. **Thiết bị 1**: Mở `http://localhost:8080` → Tạo phòng → Copy mã phòng
4. **Thiết bị 2**: Mở `http://<IP-máy-chủ>:8080` → Vào phòng → Nhập mã
5. Cả 2 nhấn "Sẵn sàng" → Game bắt đầu!

**Lưu ý:** Cả 2 thiết bị phải cùng mạng WiFi/LAN.

## Cấu trúc dự án

```
neon-orbit/
├── server/
│   └── index.js          # WebSocket server
├── src/
│   ├── components/       # React components
│   │   ├── GameCanvas.tsx
│   │   ├── Joystick.tsx
│   │   ├── LobbyScreen.tsx
│   │   └── ...
│   ├── config/
│   │   └── gameConfig.ts # Cấu hình game tập trung
│   ├── hooks/
│   │   └── useMultiplayer.ts
│   ├── types/
│   │   └── game.ts
│   └── utils/
│       ├── physics.ts    # Engine vật lý
│       └── mapGenerator.ts
└── package.json
```

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy frontend dev server |
| `npm run server` | Chạy WebSocket server |
| `npm run dev:all` | Chạy cả 2 |
| `npm run build` | Build production |
| `npm run preview` | Preview build |

## License

MIT

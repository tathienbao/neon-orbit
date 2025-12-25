# Hướng dẫn Triển khai Production

## Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                              │
├─────────────────────────┬───────────────────────────────────┤
│   Cloudflare Pages      │   Cloudflare Workers              │
│   (Frontend)            │   + Durable Objects (Backend)     │
│                         │                                   │
│   - React SPA           │   - WebSocket server              │
│   - Static files        │   - Room management               │
│   - Global CDN          │   - Game state sync               │
│                         │                                   │
│   neon-marble.pages.dev │   game-api.workers.dev            │
└─────────────────────────┴───────────────────────────────────┘
```

## Cấu trúc Dự án

```
neon-orbit/
├── src/                      # Frontend (Cloudflare Pages)
│   ├── components/
│   ├── hooks/
│   ├── config/
│   └── ...
├── worker/                   # Backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts         # Worker entry point
│   │   └── game-room.ts     # Durable Object cho room
│   ├── wrangler.toml        # Cloudflare Workers config
│   └── package.json
├── package.json              # Frontend dependencies
├── vite.config.ts
└── docs/
    └── DEPLOYMENT.md
```

---

## Phần 1: Chuẩn bị

### 1.1 Cài đặt Wrangler CLI

```bash
npm install -g wrangler

# Đăng nhập Cloudflare
wrangler login
```

### 1.2 Tạo tài khoản Cloudflare

1. Đăng ký tại https://cloudflare.com
2. Vào dashboard → Workers & Pages

---

## Phần 2: Deploy Backend (Cloudflare Workers)

### 2.1 Cấu trúc Worker

**worker/wrangler.toml:**
```toml
name = "neon-marble-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [
  { name = "GAME_ROOM", class_name = "GameRoom" }
]

[[migrations]]
tag = "v1"
new_classes = ["GameRoom"]
```

**worker/src/index.ts:**
```typescript
export { GameRoom } from './game-room';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const roomId = url.searchParams.get('room') || 'lobby';
      const id = env.GAME_ROOM.idFromName(roomId);
      const room = env.GAME_ROOM.get(id);
      return room.fetch(request);
    }

    return new Response('Neon Marble API', { status: 200 });
  }
};
```

### 2.2 Deploy Worker

```bash
cd worker
npm install
wrangler deploy
```

Output: `https://neon-marble-api.<your-subdomain>.workers.dev`

---

## Phần 3: Deploy Frontend (Cloudflare Pages)

### 3.1 Cấu hình Environment Variables

Tạo file `.env.production`:
```
VITE_SERVER_URL=https://neon-marble-api.<your-subdomain>.workers.dev
```

### 3.2 Build Frontend

```bash
npm run build
```

### 3.3 Deploy với Wrangler

```bash
wrangler pages deploy dist --project-name=neon-marble
```

Hoặc kết nối GitHub:
1. Cloudflare Dashboard → Pages → Create project
2. Connect GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
4. Environment variables:
   - `VITE_SERVER_URL` = Worker URL từ bước 2

---

## Phần 4: Quản lý Environments

### 4.1 Local Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (local)
npm run server

# Hoặc chạy cả hai
npm run dev:all
```

**Environment:** `.env.local`
```
VITE_SERVER_URL=http://localhost:3001
```

### 4.2 Production

**Environment variables trên Cloudflare Dashboard:**
- `VITE_SERVER_URL` = `https://neon-marble-api.workers.dev`

---

## Phần 5: Git Workflow

### Branch Strategy

```
main (production)
  │
  └── Mọi commit trên main sẽ auto-deploy
```

### Commit Convention

```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
refactor: Refactor code
deploy: Thay đổi liên quan deployment
```

### Deploy Flow

```
1. Code locally
2. Test: npm run dev:all
3. Commit: git add . && git commit -m "feat: ..."
4. Push: git push origin main
5. Cloudflare auto-deploys (nếu đã kết nối GitHub)
```

---

## Phần 6: Monitoring & Debugging

### 6.1 Xem Logs

```bash
# Worker logs
wrangler tail neon-marble-api

# Pages logs
# Xem trong Cloudflare Dashboard → Pages → Deployments
```

### 6.2 Rollback

```bash
# Pages: Chọn deployment cũ trong Dashboard → Rollback

# Workers:
wrangler rollback neon-marble-api
```

---

## Phần 7: Custom Domain (Optional)

### 7.1 Thêm Domain cho Pages

1. Dashboard → Pages → neon-marble → Custom domains
2. Add domain: `game.yourdomain.com`
3. Cấu hình DNS theo hướng dẫn

### 7.2 Thêm Domain cho Workers

1. Dashboard → Workers → neon-marble-api → Triggers
2. Add Custom Domain: `api.yourdomain.com`

---

## Phần 8: Chi phí

### Free Tier Limits

| Service | Free Tier | Đủ cho |
|---------|-----------|--------|
| Pages | Unlimited bandwidth | ✅ Prototype + Production |
| Workers | 100k requests/ngày | ✅ ~1000 games/ngày |
| Durable Objects | 1M requests/tháng | ✅ Prototype |
| KV | 100k reads/ngày | ✅ Nếu cần cache |

### Khi nào cần trả tiền?

- Traffic > 100k requests/ngày
- Cần WebSocket connections > giới hạn free
- Cần analytics nâng cao

**Workers Paid:** $5/tháng (10M requests included)

---

## Phần 9: Checklist Deploy

### Pre-deploy

- [ ] Test local hoạt động tốt
- [ ] Commit tất cả changes
- [ ] Update environment variables
- [ ] Check CORS configuration

### Deploy

- [ ] Deploy Worker: `wrangler deploy` (trong folder worker/)
- [ ] Lấy Worker URL
- [ ] Set VITE_SERVER_URL trên Pages
- [ ] Deploy Pages: `wrangler pages deploy dist`

### Post-deploy

- [ ] Test tạo phòng
- [ ] Test join phòng từ thiết bị khác
- [ ] Test chơi game online
- [ ] Check logs nếu có lỗi

---

## Troubleshooting

### WebSocket không kết nối được

1. Kiểm tra Worker đã deploy chưa
2. Kiểm tra VITE_SERVER_URL đúng chưa
3. Kiểm tra CORS trong Worker

### Game không sync

1. Kiểm tra Durable Object bindings trong wrangler.toml
2. Xem logs: `wrangler tail`

### Build lỗi

1. Xóa node_modules và reinstall
2. Kiểm tra TypeScript errors: `npm run lint`

# Camera Panning: Boundary Zone + Hysteresis

## Trạng thái: ✅ HOÀN THÀNH

---

## Vấn đề ban đầu

Camera trong game dùng easing-only approach:
- Khi bi bay nhanh ra khỏi viewport → camera không theo kịp
- Bi có thể biến mất khỏi màn hình trong vài giây
- Trải nghiệm người chơi bị gián đoạn

### Approach phức tạp (đã thử và bỏ)

Thử implement:
- Camera có tốc độ tối thiểu khi xa target
- Bi nằm ở 1/3 viewport theo hướng đi (directional offset)
- Turn chỉ đổi sau khi camera settle

**Kết quả:** Gây bugs nghiêm trọng về logic đổi lượt, phức tạp không cần thiết.

---

## Giải pháp: Boundary Zone

### Ý tưởng cốt lõi (từ user)

> "Ước chừng viewport thành 4 phần theo chiều dọc, 2 phần giữa là khung giới hạn (safe zone).
> Camera pan như cũ, nhưng nếu bi chạm vào boundary thì camera phải chạy theo với tốc độ cao nhất."

### Cách hoạt động

```
┌─────────────────────────┐
│     BOUNDARY (25%)      │  ← Fast follow zone
├─────────────────────────┤
│                         │
│      SAFE (50%)         │  ← Normal smooth panning
│                         │
├─────────────────────────┤
│     BOUNDARY (25%)      │  ← Fast follow zone
└─────────────────────────┘
```

- **Safe zone (giữa 50%)**: Camera pan smooth với easing 0.1
- **Boundary zone (trên/dưới 25%)**: Camera follow nhanh với easing 0.5

---

## Vấn đề Jitter và Hysteresis

### Jitter là gì?

Khi bi ở ranh giới safe/boundary:
1. Bi vào boundary → camera nhảy nhanh
2. Camera bắt kịp → bi "về" safe zone
3. Camera chậm lại → bi lại "ra" boundary
4. **Lặp lại** → oscillation → jitter

### Giải pháp: Hysteresis

Hysteresis = "trễ có chủ đích" để tránh oscillation.

```
Vào fast mode:
  - Bi ở boundary zone
  - AND bi đang chạy nhanh (speed > 5)

Giữ fast mode:
  - Cho đến khi distance < 50px
  - Không quan tâm bi đang ở zone nào

Thoát fast mode:
  - Camera đã bắt kịp (distance < 50px)
  - Chuyển về normal easing
```

---

## Debug Visualization

Nhấn phím **C** để toggle khung cam debug:
- Hiển thị 2 đường nét đứt màu cam
- Đánh dấu ranh giới boundary zone
- Label "BOUNDARY ZONE (fast camera)"

---

## Implementation

### Config (`src/config/gameConfig.ts`)

```typescript
export const CAMERA_CONFIG = {
  // Viewport chia 4 phần, 25% trên và dưới là boundary
  BOUNDARY_RATIO: 0.25,

  // Easing trong safe zone (smooth)
  NORMAL_EASING: 0.1,

  // Easing trong boundary (fast, nhưng không instant để tránh giật)
  FAST_EASING: 0.5,

  // Chỉ fast follow khi bi đang chạy nhanh
  FAST_FOLLOW_MIN_VELOCITY: 5,
} as const;
```

### Camera tracking loop (`src/components/GameCanvas.tsx`)

```typescript
// 1. Tính vị trí bi trên màn hình
const marbleScreenY = movingMarble.position.y - currentScroll;

// 2. Xác định boundary zones
const boundarySize = containerHeight * CAMERA_CONFIG.BOUNDARY_RATIO;
const topBoundary = boundarySize;
const bottomBoundary = containerHeight - boundarySize;

// 3. Check bi có ở boundary không
const inBoundaryZone = marbleScreenY < topBoundary || marbleScreenY > bottomBoundary;

// 4. Check bi có đang chạy nhanh không
const marbleSpeed = Math.sqrt(velocity.x² + velocity.y²);
const isMovingFast = marbleSpeed > CAMERA_CONFIG.FAST_FOLLOW_MIN_VELOCITY;

// 5. Hysteresis logic
if (inBoundaryZone && isMovingFast) {
  fastModeRef.current = true;
} else if (distance < 50) {
  fastModeRef.current = false;
}

// 6. Chọn easing
const easing = fastModeRef.current
  ? CAMERA_CONFIG.FAST_EASING
  : CAMERA_CONFIG.NORMAL_EASING;
```

---

## Kết quả

| Trước | Sau |
|-------|-----|
| Bi bay nhanh → mất khỏi viewport | Camera theo kịp với fast follow |
| Easing cố định → chậm khi xa | Adaptive easing theo zone |
| N/A | Debug visualization với phím C |
| N/A | Không jitter nhờ hysteresis |

---

## Files đã sửa

- `src/config/gameConfig.ts` - Thêm CAMERA_CONFIG
- `src/components/GameCanvas.tsx`:
  - Import CAMERA_CONFIG
  - Thêm state `showDebugBoundary`
  - Thêm ref `fastModeRef` (hysteresis)
  - Thêm ref `showDebugBoundaryRef`
  - Keyboard listener cho phím C
  - Boundary zone detection trong camera loop
  - Hysteresis logic
  - Debug frame drawing trong render

---

## Lưu ý

- Logic đổi lượt **không bị ảnh hưởng** - giữ nguyên code cũ
- Chỉ thay đổi cách camera pan, không thay đổi game logic
- Approach đơn giản, dễ debug, dễ điều chỉnh parameters

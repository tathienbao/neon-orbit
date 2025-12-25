# Plan: Camera Panning & Mobile UI Overhaul

## Tổng quan

Hai cải tiến chính:
1. **Camera Panning** - Camera theo bi với tốc độ tối thiểu, offset theo hướng đi, đổi lượt sau khi camera settle
2. **Mobile UI** - Full-screen game với joystick overlay, responsive sizing

---

## Part 1: Camera Panning Improvements

### Vấn đề hiện tại
- Camera dùng easing-only → chậm lại khi gần target
- Bi luôn ở giữa viewport, không theo hướng đi
- Turn đổi ngay khi bi dừng, không đợi camera

### Yêu cầu
1. Camera có **tốc độ tối thiểu** khi xa target
2. Bi nằm ở **1/3 viewport theo hướng đi** (bay xuống → 1/3 dưới)
3. Turn chỉ đổi **sau khi camera settle**

### Implementation

#### 1.1 Thêm config (`src/config/gameConfig.ts`)

```typescript
export const CAMERA_CONFIG = {
  MIN_SPEED: 8,              // pixels/frame (~480px/s)
  MIN_SPEED_THRESHOLD: 100,  // Áp dụng min speed khi > 100px
  SETTLE_THRESHOLD: 3,       // Camera "settled" khi < 3px từ target
  DIRECTION_THRESHOLD: 0.5,  // Velocity threshold để detect hướng
} as const;
```

#### 1.2 Thêm refs (`src/components/GameCanvas.tsx`)

```typescript
const marbleDirectionRef = useRef<'up' | 'down' | 'none'>('none');
const marbleStoppedRef = useRef(false);
const turnEndPendingRef = useRef(false);
```

#### 1.3 Helper function - Directional offset

```typescript
const calculateDirectionalOffset = (
  direction: 'up' | 'down' | 'none',
  containerHeight: number
): number => {
  switch (direction) {
    case 'down': return containerHeight * (2/3);  // 1/3 từ dưới
    case 'up': return containerHeight * (1/3);     // 1/3 từ trên
    default: return containerHeight / 2;           // Giữa
  }
};
```

#### 1.4 Sửa game loop - Delay turn end

```typescript
// Thay vì gọi onTurnEnd() ngay:
if (wasMovingRef.current && !anyMoving && !gameOver) {
  marbleStoppedRef.current = true;
  turnEndPendingRef.current = true;  // Đợi camera settle
}
```

#### 1.5 Sửa camera tracking loop

```typescript
// 1. Detect direction từ velocity
if (movingMarble.velocity.y > CAMERA_CONFIG.DIRECTION_THRESHOLD) {
  marbleDirectionRef.current = 'down';
} else if (movingMarble.velocity.y < -CAMERA_CONFIG.DIRECTION_THRESHOLD) {
  marbleDirectionRef.current = 'up';
}

// 2. Calculate target với directional offset
const offset = calculateDirectionalOffset(marbleDirectionRef.current, containerHeight);
const targetScroll = movingMarble.position.y - offset;

// 3. Apply minimum speed khi xa
const distance = Math.abs(targetScroll - currentScroll);
let delta = (targetScroll - currentScroll) * easing;

if (distance > CAMERA_CONFIG.MIN_SPEED_THRESHOLD) {
  const minDelta = CAMERA_CONFIG.MIN_SPEED * Math.sign(targetScroll - currentScroll);
  if (Math.abs(delta) < Math.abs(minDelta)) {
    delta = minDelta;
  }
}

// 4. Check camera settled khi marble stopped
if (turnEndPendingRef.current && !movingMarble) {
  if (distanceToTarget < CAMERA_CONFIG.SETTLE_THRESHOLD) {
    turnEndPendingRef.current = false;
    onTurnEndRef.current();  // Giờ mới đổi lượt
  }
}
```

---

## Part 2: Mobile UI Overhaul

### Vấn đề hiện tại
- Container `max-w-md` (448px) có thể nhỏ hơn map width
- Canvas bị clip trên mobile
- Joystick chiếm không gian dưới canvas

### Yêu cầu
1. Map width: **Responsive với max 500px**
2. Mobile: **Full-screen game + joystick overlay**
3. Container **không bao giờ nhỏ hơn** map width

### Implementation

#### 2.1 Update config (`src/config/gameConfig.ts`)

```typescript
export const MAP_CONFIG = {
  MAX_WIDTH: 500,       // Tăng từ 400
  MIN_WIDTH: 300,       // Mới
  PADDING: 20,          // Giảm từ 40 cho mobile
  PADDING_DESKTOP: 40,
  // ... rest unchanged
} as const;

export const LAYOUT_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  JOYSTICK_BOTTOM: 24,
  JOYSTICK_RIGHT: 24,
} as const;
```

#### 2.2 Update mapGenerator.ts

```typescript
const isMobile = screenWidth < 768;
const padding = isMobile ? MAP_CONFIG.PADDING : MAP_CONFIG.PADDING_DESKTOP;
const mapWidth = Math.max(
  MAP_CONFIG.MIN_WIDTH,
  Math.min(screenWidth - padding, MAP_CONFIG.MAX_WIDTH)
);
```

#### 2.3 Mobile layout pattern

```tsx
// Mobile: Full-screen với joystick overlay
{isMobile ? (
  <div className="fixed inset-0">
    <GameCanvas ... className="w-full h-full" />
    <div className="fixed bottom-6 right-6 z-10">
      <Joystick compact />
    </div>
  </div>
) : (
  // Desktop: Side-by-side layout
  <div className="flex flex-row gap-4">
    <GameCanvas ... />
    <Joystick />
  </div>
)}
```

#### 2.4 Joystick compact mode

```typescript
interface JoystickProps {
  compact?: boolean;  // Nhỏ hơn cho mobile overlay
}

const containerSize = compact ? 'w-28 h-28' : 'w-36 h-36';
```

#### 2.5 GameCanvas container

```typescript
<div
  ref={containerRef}
  style={{
    height: '100dvh',  // Dynamic viewport height cho mobile
    minWidth: gameState.mapWidth,
    maxWidth: gameState.mapWidth,
  }}
>
```

#### 2.6 CSS safe-area

```css
.joystick-overlay {
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: calc(24px + env(safe-area-inset-right));
}
```

---

## Files cần sửa

| File | Thay đổi |
|------|----------|
| `src/config/gameConfig.ts` | Thêm CAMERA_CONFIG, LAYOUT_CONFIG, update MAP_CONFIG |
| `src/components/GameCanvas.tsx` | Camera logic mới, container responsive |
| `src/components/NeonMarbleGame.tsx` | Mobile layout pattern |
| `src/components/OnlineMarbleGame.tsx` | Mobile layout pattern |
| `src/components/Joystick.tsx` | Thêm compact prop |
| `src/utils/mapGenerator.ts` | Responsive map width |
| `src/index.css` | Safe-area utilities |

---

## Thứ tự implementation

### Phase 1: Camera (ít rủi ro hơn)
1. Thêm CAMERA_CONFIG
2. Thêm refs mới vào GameCanvas
3. Tạo helper function calculateDirectionalOffset
4. Sửa game loop - delay turn end
5. Sửa camera tracking loop
6. Test kỹ

### Phase 2: Mobile UI
7. Update MAP_CONFIG, LAYOUT_CONFIG
8. Update mapGenerator.ts
9. Thêm compact prop vào Joystick
10. Refactor NeonMarbleGame layout
11. Refactor OnlineMarbleGame layout
12. Update GameCanvas container
13. Thêm CSS utilities
14. Test trên mobile

---

## Edge cases

### Camera
- Bi bounce đổi hướng nhanh → Chỉ update direction khi velocity > threshold
- Bi dừng ở edge của map → Check bounds trước khi settle
- Pause khi camera đang settle → Giữ turnEndPending, resume sau

### Mobile UI
- Notched phones → Dùng env(safe-area-inset-*)
- Landscape mode → Layout có thể cần điều chỉnh
- Touch conflicts → Joystick capture riêng, canvas view-only

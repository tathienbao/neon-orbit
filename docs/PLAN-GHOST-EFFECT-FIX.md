# Plan: Fix Network Latency "Ghost Effect" in Multiplayer

## Vấn đề hiện tại

**Hiện tượng "Ghost Effect" trên Player 2 (Guest):**
- Bi lăn đi → biến mất → xuất hiện lại ở vị trí cũ → lăn tiếp
- Chỉ xảy ra khi chơi 2 thiết bị khác nhau (latency 100-200ms)
- Không xảy ra khi chơi 2 browser trên cùng máy (latency ~0ms)

## Nguyên nhân gốc

```
Timeline với 100ms latency:

HOST (Player 1)                    GUEST (Player 2)

T0: Bắn bi                         T0: Nhận "shoot" event
    pos=(100,100)                      Áp dụng velocity
                                       Chạy physics cục bộ

T16ms: pos=(102,101)               T16ms: pos=(102,101) ← cục bộ
T32ms: pos=(104,102)               T32ms: pos=(104,102) ← cục bộ
...                                ...
T100ms: pos=(112,106)              T100ms: pos=(112,106) ← cục bộ

T100ms: Gửi state ──────────────→  T100ms: Nhận state từ Host
        {pos: (106,103)}                  {pos: (106,103)} ← CŨ HƠN!

                                   Guest overwrite state
                                   Bi NHẢY LÙI từ (112,106) → (106,103)
                                   = GHOST EFFECT!
```

**Root causes:**
1. Guest chạy physics loop ĐỘC LẬP
2. Host gửi state liên tục (60fps)
3. Guest nhận state và GHI ĐÈ ngay lập tức
4. Không có interpolation/smoothing

---

## Các giải pháp từ ngành Game

### 1. Entity Interpolation (Recommended cho game này)
- **Nguyên lý:** Buffer các state, render "trong quá khứ" 100-200ms
- **Ưu điểm:** Rất mượt, không jitter
- **Nhược điểm:** Thêm latency cố định nhưng không đáng kể cho turn-based
- **Dùng bởi:** Quake, Counter-Strike, 8 Ball Pool

### 2. Client-Side Prediction + Reconciliation
- **Nguyên lý:** Client dự đoán, server xác nhận, client điều chỉnh
- **Ưu điểm:** Responsive nhất
- **Nhược điểm:** Phức tạp, có thể "snap" khi prediction sai
- **Dùng bởi:** FPS games (Call of Duty, Fortnite)

### 3. Deterministic Lockstep
- **Nguyên lý:** Cả 2 client chạy physics giống hệt từ cùng input
- **Ưu điểm:** Perfect sync
- **Nhược điểm:** Cần physics deterministic, delay = latency
- **Dùng bởi:** StarCraft, fighting games

### 4. Server-Only Physics (Simplest)
- **Nguyên lý:** Chỉ Host chạy physics, Guest chỉ render
- **Ưu điểm:** Đơn giản nhất, không conflict
- **Nhược điểm:** Guest thấy delay = network latency
- **Dùng bởi:** Simple casual games

---

## Giải pháp đề xuất: Entity Interpolation

**Lý do chọn:**
- Game turn-based → thêm 100ms latency không ảnh hưởng gameplay
- Đảm bảo animation mượt mà 100%
- Không cần physics deterministic
- Đơn giản hơn Client-Side Prediction

### Cách hoạt động

```
Guest nhận state updates:
  T0:    state1 {pos: (100, 100)}
  T50ms: state2 {pos: (105, 102)}
  T100ms: state3 {pos: (110, 104)}

Guest render với 100ms buffer:
  T100ms: render state1 → pos=(100, 100)
  T116ms: interpolate 32% từ state1 → state2
  T133ms: interpolate 66% từ state1 → state2
  T150ms: render state2 → pos=(105, 102)
  ...
```

**Kết quả:** Animation luôn mượt mà, không có ghost effect

---

## Implementation Plan (Full Interpolation)

### Phase 1: State Buffer

**File:** `src/hooks/useMultiplayer.ts`

Thêm state buffer để lưu các state gần đây:

```typescript
interface BufferedState {
  state: GameState;
  timestamp: number;
}

// Buffer giữ 10 states gần nhất
const stateBufferRef = useRef<BufferedState[]>([]);
const INTERPOLATION_DELAY = 100; // ms
```

### Phase 2: Interpolation Logic

**File mới:** `src/utils/interpolation.ts`

```typescript
export function interpolateGameState(
  fromState: GameState,
  toState: GameState,
  t: number // 0-1
): GameState {
  return {
    ...toState,
    marbles: toState.marbles.map((marble, i) => ({
      ...marble,
      position: {
        x: lerp(fromState.marbles[i].position.x, marble.position.x, t),
        y: lerp(fromState.marbles[i].position.y, marble.position.y, t),
      },
    })),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

### Phase 3: Guest Rendering with Interpolation

**File:** `src/components/OnlineMarbleGame.tsx`

Guest không chạy physics khi đến lượt opponent:
- Khi `currentPlayer !== myPlayerIndex`: Dùng interpolated state từ buffer
- Khi `currentPlayer === myPlayerIndex`: Chạy physics cục bộ

### Phase 4: Host Sends Timestamped States

**File:** `src/hooks/useMultiplayer.ts`

```typescript
const sendGameState = useCallback((gameState: GameState) => {
  send({
    type: 'game-state-update',
    gameState,
    timestamp: Date.now() // Thêm timestamp
  });
}, [send]);
```

---

## Alternative: Simple Fix (Nhanh hơn, ít mượt hơn)

Nếu interpolation quá phức tạp, có thể dùng giải pháp đơn giản hơn:

**Guest không chạy physics khi opponent's turn:**
- Chỉ nhận và render state từ Host
- Không có conflict → không có ghost
- Nhược điểm: Animation có thể hơi giật do network jitter

---

## Quyết định: Entity Interpolation

User đã chọn: **Entity Interpolation** - Giải pháp mượt mà nhất, không cần thử Simple Fix trước.

---

## Implementation: Simple Fix

### Bước 1: Truyền context isHost và myPlayerIndex vào GameCanvas

**File:** `src/components/OnlineMarbleGame.tsx`

```typescript
<GameCanvas
  gameState={gameState}
  onGameStateChange={handleGameStateChange}
  onTurnEnd={handleTurnEnd}
  isHost={isHost}                    // ← Thêm
  myPlayerIndex={myPlayerIndex}      // ← Thêm
/>
```

### Bước 2: GameCanvas nhận props mới

**File:** `src/components/GameCanvas.tsx`

```typescript
interface GameCanvasProps {
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
  onTurnEnd: () => void;
  isHost?: boolean;           // ← Thêm (optional cho local mode)
  myPlayerIndex?: number;     // ← Thêm (optional cho local mode)
}
```

### Bước 3: Guest skip physics khi opponent's turn

**File:** `src/components/GameCanvas.tsx` - Game loop

```typescript
const gameLoop = () => {
  const state = gameStateRef.current;

  // Skip if paused or game over
  if (state.isPaused || state.gameOver) {
    animationRef.current = requestAnimationFrame(gameLoop);
    return;
  }

  // Guest skip physics when opponent is playing (online mode only)
  // In local mode (isHost === undefined), always run physics
  if (isHostRef.current === false && state.currentPlayer !== myPlayerIndexRef.current) {
    // Just schedule next frame, don't run physics
    animationRef.current = requestAnimationFrame(gameLoop);
    return;
  }

  // ... existing physics code continues
};
```

### Bước 4: Update refs cho isHost và myPlayerIndex

**File:** `src/components/GameCanvas.tsx`

```typescript
const isHostRef = useRef(isHost);
const myPlayerIndexRef = useRef(myPlayerIndex);

useEffect(() => {
  isHostRef.current = isHost;
}, [isHost]);

useEffect(() => {
  myPlayerIndexRef.current = myPlayerIndex;
}, [myPlayerIndex]);
```

Dùng refs trong game loop thay vì props trực tiếp.

---

## Files cần sửa (Simple Fix)

| File | Thay đổi |
|------|----------|
| `src/components/GameCanvas.tsx` | Thêm props, skip physics cho Guest |
| `src/components/OnlineMarbleGame.tsx` | Truyền isHost và myPlayerIndex |

---

## Test sau khi implement

1. Chơi 2 thiết bị khác nhau
2. Quan sát Player 2 có còn ghost effect không
3. Nếu animation vẫn jittery → upgrade lên Interpolation

---

## Sources

- [Gabriel Gambetta - Entity Interpolation](https://www.gabrielgambetta.com/entity-interpolation.html)
- [Gabriel Gambetta - Client-Side Prediction](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [SnapNet - Snapshot Interpolation](https://snapnet.dev/blog/netcode-architectures-part-3-snapshot-interpolation/)
- [Unity - Dealing with Latency](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.7/manual/learn/dealing-with-latency.html)

# Plan: Mobile UI Overhaul

## Trạng thái: Chưa implement

---

## Vấn đề hiện tại

### Layout
- Container `max-w-md` (448px) có thể nhỏ hơn map width
- Canvas bị clip trên mobile
- Joystick chiếm không gian dưới canvas

### Branding
- Cần thiết kế logo/icon cho game
- Favicon, app icon cho PWA
- Splash screen

---

## Yêu cầu

1. **Map width**: Responsive với max 500px
2. **Mobile**: Full-screen game + joystick overlay
3. **Container**: Không bao giờ nhỏ hơn map width
4. **Branding**: Logo, favicon, app icons

---

## Implementation Plan

### Phase 1: Responsive Layout

#### 1.1 Update config
```typescript
export const MAP_CONFIG = {
  MAX_WIDTH: 500,       // Tăng từ 400
  MIN_WIDTH: 300,       // Mới
  PADDING: 20,          // Giảm từ 40 cho mobile
  PADDING_DESKTOP: 40,
} as const;

export const LAYOUT_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  JOYSTICK_BOTTOM: 24,
  JOYSTICK_RIGHT: 24,
} as const;
```

#### 1.2 Mobile layout pattern
```tsx
{isMobile ? (
  <div className="fixed inset-0">
    <GameCanvas ... className="w-full h-full" />
    <div className="fixed bottom-6 right-6 z-10">
      <Joystick compact />
    </div>
  </div>
) : (
  <div className="flex flex-row gap-4">
    <GameCanvas ... />
    <Joystick />
  </div>
)}
```

#### 1.3 Joystick compact mode
```typescript
interface JoystickProps {
  compact?: boolean;  // Nhỏ hơn cho mobile overlay
}

const containerSize = compact ? 'w-28 h-28' : 'w-36 h-36';
```

#### 1.4 CSS safe-area (notched phones)
```css
.joystick-overlay {
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: calc(24px + env(safe-area-inset-right));
}
```

### Phase 2: Branding & Icons

#### 2.1 Logo design
- Style: Neon cyberpunk
- Colors: Cyan (#00FFFF), Magenta (#FF00FF)
- Elements: Marble + orbit/ring

#### 2.2 Required assets
- `favicon.ico` - 32x32
- `apple-touch-icon.png` - 180x180
- `icon-192.png` - PWA icon
- `icon-512.png` - PWA splash
- `og-image.png` - Social sharing (1200x630)

#### 2.3 PWA manifest updates
```json
{
  "name": "Neon Marble",
  "short_name": "NeonMarble",
  "icons": [...],
  "theme_color": "#00FFFF",
  "background_color": "#0a0a0f"
}
```

---

## Files cần sửa

| File | Thay đổi |
|------|----------|
| `src/config/gameConfig.ts` | Update MAP_CONFIG, thêm LAYOUT_CONFIG |
| `src/components/NeonMarbleGame.tsx` | Mobile layout pattern |
| `src/components/OnlineMarbleGame.tsx` | Mobile layout pattern |
| `src/components/Joystick.tsx` | Thêm compact prop |
| `src/utils/mapGenerator.ts` | Responsive map width |
| `src/index.css` | Safe-area utilities |
| `public/` | Icons, manifest |
| `index.html` | Meta tags, favicons |

---

## Edge cases

- Notched phones → Dùng `env(safe-area-inset-*)`
- Landscape mode → Layout có thể cần điều chỉnh
- Touch conflicts → Joystick capture riêng, canvas view-only
- Small screens (<300px) → Minimum viable layout

# Mobile UI Implementation

## Status: Completed ✅

---

## What Was Implemented

### 1. Responsive Layout

**Mobile Layout (< 768px):**
- Screen divided into **map area** (top) and **joystick area** (bottom)
- Joystick area uses **5:3 aspect ratio** (width:height = 5:3)
- Map area fills remaining vertical space
- Joystick centered in its area

**Desktop Layout (>= 768px):**
- Side-by-side layout: map on left, controls on right
- Standard joystick size

### 2. Responsive Scaling (Online Mode)

When guest joins from mobile with smaller screen than host:
- Map is scaled down to fit available width
- Accounts for padding (16px total)
- Height calculation adjusted for scaled content

```typescript
// Scale calculation
const padding = 16; // p-2 = 8px each side
const availableWidth = screenWidth - padding;
const needsScale = mapWidth > availableWidth;
const scaleFactor = needsScale ? availableWidth / mapWidth : 1;
```

### 3. Joystick Compact Mode

Added `compact` prop to Joystick component:
- Normal: `w-36 h-36` (144px)
- Compact: `w-28 h-28` (112px)

### 4. GameCanvas fillHeight Prop

Added `fillHeight` prop to GameCanvas:
- `false` (default): Uses `calc(100vh - 280px)` for desktop
- `true`: Uses `100%` to fill parent container (mobile)

---

## Configuration

```typescript
// src/config/gameConfig.ts

export const MAP_CONFIG = {
  MAX_WIDTH: 500,
  MIN_WIDTH: 300,
  PADDING: 20,          // Mobile padding
  PADDING_DESKTOP: 40,
  // ...
} as const;

export const LAYOUT_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  JOYSTICK_BOTTOM: 24,
  JOYSTICK_RIGHT: 24,
} as const;
```

---

## Mobile Layout Code Pattern

```tsx
// Calculate joystick area with 5:3 ratio
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const joystickAreaHeight = screenWidth * (3 / 5);
const mapAreaHeight = screenHeight - joystickAreaHeight;

if (isMobile) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Map area */}
      <div
        className="relative overflow-hidden p-2"
        style={{ height: mapAreaHeight }}
      >
        <GameCanvas ... fillHeight />
        {/* Overlay UI */}
      </div>

      {/* Joystick area - 5:3 ratio */}
      <div
        className="flex items-center justify-center"
        style={{ height: joystickAreaHeight }}
      >
        <Joystick ... compact />
      </div>
    </div>
  );
}
```

---

## PWA & Branding

### Assets Created
- `public/logo.svg` - Neon-style logo (marble + orbit rings)
- `public/favicon.svg` - Browser favicon
- `public/og-image.png` - Social sharing image (512x512)
- `public/manifest.json` - PWA manifest

### Meta Tags (index.html)
```html
<!-- Open Graph -->
<meta property="og:title" content="Neon Marble" />
<meta property="og:description" content="A 2-player marble shooting game..." />
<meta property="og:image" content="https://neon-marble.pages.dev/og-image.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:image" content="https://neon-marble.pages.dev/og-image.png" />

<!-- PWA -->
<link rel="manifest" href="/manifest.json" />
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/config/gameConfig.ts` | Added LAYOUT_CONFIG |
| `src/components/NeonMarbleGame.tsx` | Mobile layout with 5:3 joystick |
| `src/components/OnlineMarbleGame.tsx` | Mobile layout + responsive scaling |
| `src/components/Joystick.tsx` | Added `compact` prop |
| `src/components/GameCanvas.tsx` | Added `fillHeight` prop |
| `public/logo.svg` | New logo |
| `public/favicon.svg` | New favicon |
| `public/og-image.png` | Social sharing image |
| `public/manifest.json` | PWA manifest |
| `index.html` | Updated meta tags, lang="en" |

---

## UI Language

All UI text has been translated to English:
- Toasts (success, error, info messages)
- Labels and hints
- Buttons
- Status indicators
- Winner modal
- Lobby screen

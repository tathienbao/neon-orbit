# Plan: Module-Based Obstacle System

## Problems with Current System

1. **Random sizing** → Skins get stretched/squashed inappropriately
2. **Random rotation** → Rectangular skins don't match hitbox orientation
3. **No aspect ratio matching** → A bench could be square, a crate could be elongated
4. **Random placement** → Obstacles can overlap or cluster awkwardly

---

## New System Design

### 1. Fixed Module Sizes

Replace random sizes with predefined modules:

| Module | Type | Size | Use Case |
|--------|------|------|----------|
| `square-s` | rectangle | 50x50 | Crate, small objects |
| `square-m` | rectangle | 70x70 | House, shed |
| `wide-s` | rectangle | 80x35 | Bench, log, fence |
| `wide-m` | rectangle | 100x45 | Picnic table |
| `tall-s` | rectangle | 35x80 | Car |
| `tall-m` | rectangle | 45x100 | Truck |
| `circle-s` | circle | r=25 | Bush, flower, barrel |
| `circle-m` | circle | r=35 | Tree, rock, pond |
| `circle-l` | circle | r=45 | Large tree |

### 2. Skin-to-Module Mapping

Each skin specifies which modules it fits:

```typescript
const SKIN_MODULES = {
  // Circle skins
  'nature/tree-round': ['circle-m', 'circle-l'],
  'nature/bush': ['circle-s', 'circle-m'],
  'nature/rock': ['circle-s', 'circle-m'],
  'nature/pond': ['circle-m', 'circle-l'],
  'nature/flower': ['circle-s'],
  'nature/mushroom': ['circle-s'],
  'street/barrel': ['circle-s'],
  'street/manhole': ['circle-s', 'circle-m'],
  'vehicles/tire': ['circle-s'],
  'sports/ball-soccer': ['circle-s'],

  // Rectangle skins
  'buildings/house': ['square-m'],
  'buildings/shed': ['square-s', 'square-m'],
  'vehicles/car': ['tall-s'],
  'vehicles/truck': ['tall-m'],
  'street/fence': ['wide-s', 'wide-m'],
  'street/bench': ['wide-s'],
  'street/crate': ['square-s'],
  'street/dumpster': ['square-s', 'square-m'],
  'street/picnic-table': ['wide-m'],
  'nature/log': ['wide-s'],
};
```

### 3. Module Selection Logic

```typescript
function selectObstacle(): { module: Module, skin: string } {
  // 1. Pick random module type
  const moduleKey = randomFrom(Object.keys(MODULES));
  const module = MODULES[moduleKey];

  // 2. Find skins that fit this module
  const compatibleSkins = Object.entries(SKIN_MODULES)
    .filter(([skin, modules]) => modules.includes(moduleKey))
    .map(([skin]) => skin);

  // 3. Pick random compatible skin
  const skin = randomFrom(compatibleSkins);

  return { module, skin };
}
```

### 4. Grid-Based Placement

```
Map divided into grid cells:
┌───┬───┬───┬───┬───┐
│   │ X │   │   │ X │  X = obstacle
├───┼───┼───┼───┼───┤
│   │   │ X │   │   │
├───┼───┼───┼───┼───┤
│ X │   │   │ X │   │
└───┴───┴───┴───┴───┘

Grid cell size: ~100px
Obstacle placed at cell center
No two obstacles in adjacent cells (optional)
```

### 5. Rotation Rules

**Rectangles:**
- `wide` modules: 0° or 180° only (horizontal)
- `tall` modules: 90° or 270° only (vertical)
- `square` modules: 0°, 90°, 180°, 270° (any)

**Circles:**
- Any rotation (doesn't matter visually)

---

## Implementation Steps

### Step 1: Define Module Config
```typescript
// src/config/gameConfig.ts
export const MODULE_CONFIG = {
  MODULES: {
    'square-s': { type: 'rectangle', width: 50, height: 50 },
    'square-m': { type: 'rectangle', width: 70, height: 70 },
    'wide-s': { type: 'rectangle', width: 80, height: 35 },
    'wide-m': { type: 'rectangle', width: 100, height: 45 },
    'tall-s': { type: 'rectangle', width: 35, height: 80 },
    'tall-m': { type: 'rectangle', width: 45, height: 100 },
    'circle-s': { type: 'circle', radius: 25 },
    'circle-m': { type: 'circle', radius: 35 },
    'circle-l': { type: 'circle', radius: 45 },
  },
  SKIN_MODULES: { ... },
  GRID_CELL_SIZE: 120,
  MIN_SPACING: 20,
};
```

### Step 2: Update mapGenerator.ts
- Remove random sizing
- Use grid-based placement
- Select module first, then compatible skin
- Apply rotation rules

### Step 3: Update Obstacle type
- Add `module` field for debugging
- Remove random width/height logic

---

## Benefits

1. **Visual consistency** - Skins always fit their hitboxes
2. **No stretching** - Fixed aspect ratios
3. **Proper spacing** - Grid prevents overlaps
4. **Predictable gameplay** - Known obstacle sizes
5. **Easier balancing** - Adjust module sizes globally

---

## File Changes

| File | Changes |
|------|---------|
| `src/config/gameConfig.ts` | Add MODULE_CONFIG, update SKIN_CONFIG |
| `src/utils/mapGenerator.ts` | Rewrite obstacle generation |
| `src/types/game.ts` | Add module field to Obstacle |

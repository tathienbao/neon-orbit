# Plan: Obstacle SVG Skins System

## Overview

Replace simple geometric obstacles with themed SVG skins representing real-world objects from a **top-down perspective**. Later, these objects will have movement and interaction behaviors.

---

## Phase 1: Static Skins (Current Scope)

### Object Categories

#### 1. Nature (8 objects)
| Object | Shape Base | Size | Notes |
|--------|------------|------|-------|
| Tree (round) | circle | S/M/L | Canopy from above |
| Tree (pine) | circle | S/M | Pointed shadow |
| Bush | circle | S | Small green blob |
| Rock | circle | S/M/L | Gray with cracks |
| Pond | circle | M/L | Blue with ripples |
| Flower bed | circle | S | Colorful dots |
| Log | rectangle | S | Brown cylinder |
| Grass patch | rectangle | S | Green texture |

#### 2. Buildings (6 objects)
| Object | Shape Base | Size | Notes |
|--------|------------|------|-------|
| House | rectangle | M/L | Roof visible from top |
| Shed | rectangle | S/M | Small building |
| Pool | rectangle | M/L | Blue rectangle |
| Parking lot | rectangle | M | Gray with lines |
| Tent | rectangle | S/M | Triangular shape |
| Gazebo | circle | M | Octagonal roof |

#### 3. Vehicles (4 objects)
| Object | Shape Base | Size | Notes |
|--------|------------|------|-------|
| Car | rectangle | S/M | Top-down car shape |
| Truck | rectangle | M | Longer vehicle |
| Bicycle | rectangle | S | Two wheels visible |
| Boat | rectangle | S/M | On pond/water |

#### 4. Street Objects (6 objects)
| Object | Shape Base | Size | Notes |
|--------|------------|------|-------|
| Fence (wood) | rectangle | S | Horizontal planks |
| Fence (metal) | rectangle | S | Grid pattern |
| Barrel | circle | S | Top view of cylinder |
| Trash can | circle | S | Lid from above |
| Bench | rectangle | S | Park bench |
| Street lamp | circle | S | Light glow effect |

#### 5. Sports/Play (4 objects)
| Object | Shape Base | Size | Notes |
|--------|------------|------|-------|
| Ball (soccer) | circle | S | Pentagon pattern |
| Ball (basketball) | circle | S | Orange with lines |
| Trampoline | circle | M | Circular with springs |
| Sandbox | rectangle | M | Tan with toys |

**Total: 28 static objects**

---

## Phase 2: Moving Objects (Future)

### Movement Types

| Type | Behavior | Objects |
|------|----------|---------|
| **Patrol** | Move back and forth | Car, Dog, Person |
| **Orbit** | Circle around point | Bird, Drone |
| **Random** | Wander randomly | Cat, Butterfly |
| **Triggered** | Move when marble near | Gate, Door |

### Planned Moving Objects (8)
1. **Car** - Patrol horizontally
2. **Dog** - Chase nearest marble briefly
3. **Cat** - Random wander, avoid marbles
4. **Person** - Patrol vertically
5. **Bird** - Orbit in circles
6. **Drone** - Orbit, faster
7. **Gate** - Opens when marble approaches
8. **Windmill** - Rotate in place (blades push marble)

---

## Phase 3: Interactive Objects (Future)

### Rotating Hazards

| Object | Visual | Behavior | Collision Effect |
|--------|--------|----------|------------------|
| **Circular Saw** | Spinning blade (circle) | Rotates continuously | Bounce + knockback |
| **Chainsaw Bar** | Long rotating bar | Rotates around center | Strong bounce |
| **Windmill** | 4-blade propeller | Slow rotation | Push marble away |
| **Laser Beam** | Neon line | Rotates 360° | Instant bounce |

### Moving Obstacles

| Object | Visual | Movement | Speed |
|--------|--------|----------|-------|
| **Sliding Wall** | Rectangle barrier | Left-right oscillation | Slow |
| **Piston** | Extendable bar | In-out from wall | Medium |
| **Pendulum** | Swinging bar | Arc motion | Variable |
| **Patrol Car** | Vehicle skin | Horizontal patrol | Slow |

### Zone Effects

| Object | Interaction | Effect |
|--------|-------------|--------|
| **Bumper** | Collision | Bounce marble with extra force |
| **Teleporter** | Enter | Warp to paired teleporter |
| **Speed pad** | Pass over | Boost marble velocity |
| **Mud/Sticky** | Pass over | Slow marble down |
| **Ice patch** | Pass over | Reduce friction |
| **Fan** | Nearby | Push marble in direction |
| **Spring** | Collision | Launch marble upward (bounce) |
| **Magnet** | Nearby | Pull/push marble |

### Technical: Rotating Bar Implementation

```typescript
interface RotatingObstacle extends Obstacle {
  behavior: {
    type: 'rotating';
    rpm: number;           // Rotations per minute
    currentAngle: number;  // Current rotation angle
    pivotOffset?: Vector2D; // Offset from center (default: center)
  };
}

interface MovingObstacle extends Obstacle {
  behavior: {
    type: 'oscillating';
    axis: 'x' | 'y';       // Movement axis
    range: number;         // Distance to travel
    speed: number;         // Pixels per second
    currentOffset: number; // Current position offset
    direction: 1 | -1;     // Current direction
  };
}

// Update loop
function updateRotatingObstacle(obs: RotatingObstacle, deltaTime: number) {
  const degreesPerFrame = (obs.behavior.rpm / 60) * 360 * deltaTime;
  obs.behavior.currentAngle = (obs.behavior.currentAngle + degreesPerFrame) % 360;
}

function updateMovingObstacle(obs: MovingObstacle, deltaTime: number) {
  obs.behavior.currentOffset += obs.behavior.speed * obs.behavior.direction * deltaTime;

  // Reverse at boundaries
  if (Math.abs(obs.behavior.currentOffset) >= obs.behavior.range) {
    obs.behavior.direction *= -1;
  }
}
```

### Visual: Rotating Bar Concept

```
    Circular Saw (top-down):

         ╱ ╲
        ╱   ╲
       │  ●  │  ← pivot point
        ╲   ╱
         ╲ ╱

    Chainsaw Bar (top-down):

    ════════●════════
         pivot

    Rotating at 30-60 RPM
```

---

## Technical Implementation

### SVG Structure

```
public/
└── obstacles/
    ├── nature/
    │   ├── tree-round.svg
    │   ├── tree-pine.svg
    │   ├── bush.svg
    │   ├── rock.svg
    │   ├── pond.svg
    │   └── ...
    ├── buildings/
    │   ├── house.svg
    │   ├── shed.svg
    │   └── ...
    ├── vehicles/
    │   ├── car.svg
    │   ├── truck.svg
    │   └── ...
    ├── street/
    │   ├── fence-wood.svg
    │   ├── barrel.svg
    │   └── ...
    └── sports/
        ├── ball-soccer.svg
        └── ...
```

### SVG Design Guidelines

1. **Viewbox**: `0 0 100 100` (square, scalable)
2. **Style**: Minimalist, flat design with subtle shadows
3. **Colors**: Use CSS variables for theme compatibility
4. **Stroke**: 2-3px for visibility at small sizes
5. **Glow**: Optional neon glow effect via filter

### Example SVG (Tree - Top Down)

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Shadow -->
  <ellipse cx="55" cy="55" rx="35" ry="30" fill="rgba(0,0,0,0.3)"/>
  <!-- Canopy -->
  <circle cx="50" cy="50" r="40" fill="currentColor"/>
  <!-- Trunk visible through gap -->
  <circle cx="50" cy="50" r="8" fill="#4a3728"/>
  <!-- Leaf texture -->
  <circle cx="35" cy="40" r="12" fill="rgba(255,255,255,0.1)"/>
  <circle cx="60" cy="35" r="10" fill="rgba(255,255,255,0.1)"/>
</svg>
```

### Obstacle Type Extension

```typescript
// src/types/game.ts
interface Obstacle {
  id: number;
  type: 'rectangle' | 'circle';
  position: Position;
  width?: number;
  height?: number;
  radius?: number;
  color: string;

  // New fields
  skin?: string;           // e.g., "nature/tree-round"
  rotation?: number;       // 0-360 degrees
  behavior?: ObstacleBehavior;
}

interface ObstacleBehavior {
  type: 'static' | 'patrol' | 'orbit' | 'random' | 'triggered';
  speed?: number;
  range?: number;
  direction?: 'horizontal' | 'vertical' | 'circular';
}
```

### Rendering Approach

**Option A: Preload SVGs as Images**
```typescript
// Load SVG as image, draw to canvas
const img = new Image();
img.src = '/obstacles/nature/tree-round.svg';
ctx.drawImage(img, x, y, width, height);
```

**Option B: Inline SVG Paths**
```typescript
// Store SVG path data, draw with canvas paths
const TREE_PATH = "M50,10 C20,10 10,40 10,50...";
ctx.fill(new Path2D(TREE_PATH));
```

**Recommendation**: Option A for simplicity, with preloading for performance.

### Skin Selection Logic

```typescript
function selectSkin(obstacle: Obstacle, theme: string): string {
  const category = getCategory(obstacle);
  const skins = SKIN_REGISTRY[category];

  // Weight by theme (forest = more trees, etc.)
  const weights = getThemeWeights(theme, category);
  return weightedRandom(skins, weights);
}

const THEME_WEIGHTS = {
  forest: { nature: 0.7, buildings: 0.1, vehicles: 0.1, street: 0.1 },
  city: { nature: 0.1, buildings: 0.4, vehicles: 0.3, street: 0.2 },
  park: { nature: 0.4, buildings: 0.1, vehicles: 0.1, street: 0.2, sports: 0.2 },
};
```

---

## Implementation Priority

### Milestone 1: Basic Skins (12 objects)
1. Tree (round) - circle
2. Rock - circle
3. Bush - circle
4. House - rectangle
5. Car - rectangle
6. Fence (wood) - rectangle
7. Pond - circle
8. Barrel - circle
9. Bench - rectangle
10. Ball (soccer) - circle
11. Shed - rectangle
12. Log - rectangle

### Milestone 2: Full Static Set (+16 objects)
- Remaining nature objects
- Remaining buildings
- Remaining street objects

### Milestone 3: Movement System
- Patrol behavior
- Collision detection with moving objects

### Milestone 4: Interactive Objects
- Bumpers, teleporters, speed pads
- Special effects and particles

---

## Visual Theme Integration

| Theme | Dominant Objects | Accent Color |
|-------|------------------|--------------|
| Forest | Trees, rocks, bushes, logs | Green |
| City | Buildings, cars, fences | Gray/Blue |
| Park | Mix of nature + benches, lamps | Green/Brown |
| Beach | Pond (ocean), boats, umbrellas | Blue/Yellow |
| Space | Rocks (asteroids), drones | Purple |

---

## Decisions Made

- **Collision**: All objects have collision (no decorative-only)
- **Art style**: Flat minimal - simple shapes, no shadows, clean lines
- **Priority**: Complete 28 static objects before adding movement system

## Status: Ready for Implementation

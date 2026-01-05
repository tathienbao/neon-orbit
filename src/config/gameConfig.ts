// Centralized game configuration
// All magic numbers and tunable parameters in one place

export const PHYSICS_CONFIG = {
  // Friction applied each frame (0-1, higher = less friction)
  FRICTION: 0.985,
  // Minimum velocity before marble stops
  MIN_VELOCITY: 0.1,
  // Bounce coefficient (0-1, higher = more bouncy)
  RESTITUTION: 0.8,
  // Multiplier for shoot power
  SHOOT_POWER_MULTIPLIER: 25,
} as const;

export const MARBLE_CONFIG = {
  RADIUS: 15,
  COLORS: {
    PLAYER_1: {
      color: 'hsl(180, 100%, 50%)',
      glowColor: 'rgba(0, 255, 255, 0.8)',
    },
    PLAYER_2: {
      color: 'hsl(300, 100%, 60%)',
      glowColor: 'rgba(255, 0, 255, 0.8)',
    },
  },
} as const;

export const MAP_CONFIG = {
  // Map height multiplier relative to screen height
  HEIGHT_MULTIPLIER: 5,
  // Maximum map width
  MAX_WIDTH: 500,
  // Minimum map width
  MIN_WIDTH: 300,
  // Padding from screen edges (mobile)
  PADDING: 20,
  // Padding from screen edges (desktop)
  PADDING_DESKTOP: 40,
  // Safe zone at start (no obstacles)
  SAFE_ZONE_START: 150,
  // Safe zone at goal (no obstacles)
  SAFE_ZONE_END: 150,
  // Starting Y position for marbles
  MARBLE_START_Y: 80,
  // Goal Y offset from bottom
  GOAL_OFFSET_Y: 80,
  // Goal radius
  GOAL_RADIUS: 35,
  // Obstacles per map height unit
  OBSTACLES_PER_HEIGHT: 80,
} as const;

export const LAYOUT_CONFIG = {
  // Mobile breakpoint in pixels
  MOBILE_BREAKPOINT: 768,
  // Joystick position (mobile overlay)
  JOYSTICK_BOTTOM: 24,
  JOYSTICK_RIGHT: 24,
} as const;

export const OBSTACLE_CONFIG = {
  // Reduced glow for obstacles
  GLOW_BLUR: 8,
  // Color themes - MUTED palettes (don't compete with marbles)
  THEMES: {
    ice: ['hsl(200, 30%, 32%)', 'hsl(220, 30%, 35%)', 'hsl(190, 25%, 30%)'],
    lava: ['hsl(0, 30%, 32%)', 'hsl(20, 30%, 35%)', 'hsl(350, 25%, 28%)'],
    forest: ['hsl(120, 28%, 30%)', 'hsl(100, 25%, 32%)', 'hsl(140, 25%, 28%)'],
    space: ['hsl(260, 30%, 32%)', 'hsl(240, 28%, 35%)', 'hsl(280, 25%, 30%)'],
    gold: ['hsl(40, 30%, 32%)', 'hsl(25, 30%, 35%)', 'hsl(45, 25%, 30%)'],
  },
} as const;

// Module-based obstacle system
export const MODULE_CONFIG = {
  // Fixed obstacle sizes (no random sizing)
  MODULES: {
    // Square modules
    'square-s': { type: 'rectangle' as const, width: 50, height: 50 },
    'square-m': { type: 'rectangle' as const, width: 70, height: 70 },
    // Wide modules (horizontal)
    'wide-s': { type: 'rectangle' as const, width: 80, height: 35 },
    'wide-m': { type: 'rectangle' as const, width: 100, height: 45 },
    // Tall modules (vertical)
    'tall-s': { type: 'rectangle' as const, width: 35, height: 80 },
    'tall-m': { type: 'rectangle' as const, width: 45, height: 100 },
    // Circle modules
    'circle-s': { type: 'circle' as const, radius: 25 },
    'circle-m': { type: 'circle' as const, radius: 35 },
    'circle-l': { type: 'circle' as const, radius: 45 },
  },

  // Which modules each skin fits
  SKIN_MODULES: {
    // Circle skins
    'nature/tree-round': ['circle-m', 'circle-l'],
    'nature/bush': ['circle-s', 'circle-m'],
    'nature/rock': ['circle-s', 'circle-m'],
    'nature/pond': ['circle-m', 'circle-l'],
    'nature/flower': ['circle-s'],
    'nature/mushroom': ['circle-s', 'circle-m'],
    'street/barrel': ['circle-s'],
    'street/manhole': ['circle-s', 'circle-m'],
    'vehicles/tire': ['circle-s'],
    'sports/ball-soccer': ['circle-s'],
    // Rectangle skins - square
    'buildings/house': ['square-m'],
    'buildings/shed': ['square-s', 'square-m'],
    'street/crate': ['square-s'],
    'street/dumpster': ['square-s', 'square-m'],
    // Rectangle skins - wide (horizontal)
    'street/fence': ['wide-s', 'wide-m'],
    'street/bench': ['wide-s'],
    'street/picnic-table': ['wide-m'],
    'nature/log': ['wide-s'],
    // Rectangle skins - tall (vertical)
    'vehicles/car': ['tall-s'],
    'vehicles/truck': ['tall-m'],
  } as Record<string, string[]>,

  // Rotation rules per module type
  ROTATIONS: {
    'square-s': [0, 90, 180, 270],
    'square-m': [0, 90, 180, 270],
    'wide-s': [0, 180],      // Horizontal only
    'wide-m': [0, 180],
    'tall-s': [0, 180],      // Keep vertical (skin is drawn vertical)
    'tall-m': [0, 180],
    'circle-s': [0],         // No rotation needed
    'circle-m': [0],
    'circle-l': [0],
  } as Record<string, number[]>,

  // Grid placement settings
  GRID: {
    CELL_SIZE: 120,          // Grid cell size in pixels
    MIN_SPACING: 30,         // Minimum space between obstacles
    FILL_RATIO: 0.35,        // ~35% of cells have obstacles
  },
} as const;

export const GOAL_CONFIG = {
  RADIUS: 35,
  COLOR: 'hsl(120, 100%, 50%)',           // Green
  GLOW_COLOR: 'hsla(120, 100%, 50%, 0.8)',
  INNER_COLOR: 'hsl(120, 100%, 20%)',     // Dark green center
  CENTER_COLOR: 'hsl(240, 20%, 8%)',      // Near-black center (the "hole")
  GRID_COLOR: 'hsla(120, 100%, 50%, 0.4)', // Green grid lines
} as const;

export const JOYSTICK_CONFIG = {
  // Maximum drag distance in pixels
  MAX_DISTANCE: 60,
  // Minimum drag distance to trigger shoot
  MIN_SHOOT_DISTANCE: 10,
  // Joystick size
  SIZE: 144, // 36 * 4 (w-36 in tailwind)
  KNOB_SIZE: 56, // 14 * 4 (w-14 in tailwind)
} as const;

export const CANVAS_CONFIG = {
  // Grid size in pixels
  GRID_SIZE: 50,
  // Scroll easing factor (0-1, lower = smoother)
  SCROLL_EASING: 0.1,
  // Background color
  BACKGROUND_COLOR: 'hsl(240, 15%, 6%)',
  // Grid line color
  GRID_COLOR: 'hsla(180, 100%, 50%, 0.1)',
} as const;

export const UI_CONFIG = {
  // Toast duration in ms
  TOAST_DURATION: 2000,
} as const;

export const SKIN_CONFIG = {
  // All available skins (derived from MODULE_CONFIG.SKIN_MODULES)
  ALL_SKINS: Object.keys(MODULE_CONFIG.SKIN_MODULES),
  // Base path for SVG files
  BASE_PATH: '/obstacles/',
} as const;

export const CAMERA_CONFIG = {
  // Boundary zone: middle 50% of viewport is safe, outer 25% triggers fast follow
  // Viewport divided into 4 parts: [boundary][safe][safe][boundary]
  BOUNDARY_RATIO: 0.25, // Top/bottom 25% is boundary zone
  // Normal easing for smooth camera
  NORMAL_EASING: 0.1,
  // Fast follow: camera matches marble speed when in boundary zone
  FAST_EASING: 0.5, // Fast but not instant to reduce jitter
  // Minimum velocity to trigger fast follow (prevents jitter when marble slows down)
  FAST_FOLLOW_MIN_VELOCITY: 5,
} as const;

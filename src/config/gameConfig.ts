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
  // Probability of rectangle (vs circle)
  RECTANGLE_PROBABILITY: 0.6,
  // Rectangle size ranges
  RECTANGLE_WIDTH_MIN: 40,
  RECTANGLE_WIDTH_MAX: 120,
  RECTANGLE_HEIGHT_MIN: 20,
  RECTANGLE_HEIGHT_MAX: 80,
  // Circle size ranges
  CIRCLE_RADIUS_MIN: 20,
  CIRCLE_RADIUS_MAX: 50,
  // Obstacle color themes - MUTED palettes (don't compete with marbles)
  // Each game randomly picks one theme
  THEMES: {
    ice: [
      'hsl(200, 40%, 35%)',   // ice blue
      'hsl(220, 35%, 40%)',   // steel blue
      'hsl(180, 30%, 30%)',   // dark cyan
    ],
    lava: [
      'hsl(0, 35%, 30%)',     // dark red
      'hsl(20, 40%, 35%)',    // burnt orange
      'hsl(350, 30%, 25%)',   // maroon
    ],
    forest: [
      'hsl(140, 30%, 28%)',   // dark green
      'hsl(80, 25%, 32%)',    // olive
      'hsl(160, 25%, 25%)',   // teal dark
    ],
    space: [
      'hsl(260, 35%, 30%)',   // deep purple
      'hsl(240, 30%, 35%)',   // navy
      'hsl(280, 25%, 28%)',   // dark violet
    ],
    gold: [
      'hsl(40, 35%, 35%)',    // bronze
      'hsl(25, 40%, 30%)',    // copper
      'hsl(45, 30%, 28%)',    // dark gold
    ],
  },
  // Fallback colors (randomly selected theme)
  COLORS: [
    'hsl(220, 30%, 35%)',
    'hsl(240, 25%, 30%)',
    'hsl(200, 35%, 40%)',
  ],
  // Reduced glow for obstacles
  GLOW_BLUR: 8,
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

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
  MAX_WIDTH: 400,
  // Padding from screen edges
  PADDING: 40,
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
  // Obstacle colors (neon palette)
  COLORS: [
    'hsl(180, 100%, 50%)',  // cyan
    'hsl(300, 100%, 60%)',  // magenta
    'hsl(120, 100%, 50%)',  // green
    'hsl(60, 100%, 50%)',   // yellow
    'hsl(30, 100%, 55%)',   // orange
  ],
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

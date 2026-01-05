import { Obstacle, Goal, Marble, GameState } from '@/types/game';
import { MAP_CONFIG, OBSTACLE_CONFIG, MARBLE_CONFIG, MODULE_CONFIG } from '@/config/gameConfig';

// Get random theme colors for this game
function getRandomThemeColors(): string[] {
  const themes = Object.values(OBSTACLE_CONFIG.THEMES);
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  return randomTheme as string[];
}

// Get random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Find all skins that fit a given module
function getSkinsForModule(moduleKey: string): string[] {
  return Object.entries(MODULE_CONFIG.SKIN_MODULES)
    .filter(([_, modules]) => modules.includes(moduleKey))
    .map(([skin]) => skin);
}

// Generate obstacles using module-based grid system
function generateObstacles(mapWidth: number, mapHeight: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const safeZoneStart = MAP_CONFIG.SAFE_ZONE_START;
  const safeZoneEnd = mapHeight - MAP_CONFIG.SAFE_ZONE_END;
  const playableHeight = safeZoneEnd - safeZoneStart;

  // Grid settings
  const cellSize = MODULE_CONFIG.GRID.CELL_SIZE;
  const fillRatio = MODULE_CONFIG.GRID.FILL_RATIO;

  // Calculate grid dimensions
  const cols = Math.floor(mapWidth / cellSize);
  const rows = Math.floor(playableHeight / cellSize);

  // Create grid and mark cells for obstacles
  const grid: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));

  // Randomly mark cells for obstacles
  const totalCells = rows * cols;
  const targetObstacles = Math.floor(totalCells * fillRatio);

  // Get theme colors
  const themeColors = getRandomThemeColors();

  // Get all available modules
  const moduleKeys = Object.keys(MODULE_CONFIG.MODULES);

  let obstacleId = 0;
  let attempts = 0;
  const maxAttempts = targetObstacles * 3;

  while (obstacles.length < targetObstacles && attempts < maxAttempts) {
    attempts++;

    // Pick random cell
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // Skip if cell already occupied
    if (grid[row][col]) continue;

    // Pick random module
    const moduleKey = randomFrom(moduleKeys);
    const module = MODULE_CONFIG.MODULES[moduleKey as keyof typeof MODULE_CONFIG.MODULES];

    // Find compatible skins
    const compatibleSkins = getSkinsForModule(moduleKey);
    if (compatibleSkins.length === 0) continue;

    // Pick random skin
    const skin = randomFrom(compatibleSkins);

    // Get allowed rotations for this module
    const allowedRotations = MODULE_CONFIG.ROTATIONS[moduleKey] || [0];
    const rotation = randomFrom(allowedRotations);

    // Calculate position (center of cell)
    const cellX = col * cellSize + cellSize / 2;
    const cellY = safeZoneStart + row * cellSize + cellSize / 2;

    // Ensure obstacle fits within map bounds
    let width = 0, height = 0, radius = 0;
    if (module.type === 'rectangle') {
      width = (module as { width: number; height: number }).width;
      height = (module as { width: number; height: number }).height;

      // Check bounds
      if (cellX - width / 2 < 20 || cellX + width / 2 > mapWidth - 20) continue;
    } else {
      radius = (module as { radius: number }).radius;

      // Check bounds
      if (cellX - radius < 20 || cellX + radius > mapWidth - 20) continue;
    }

    // Mark cell as occupied
    grid[row][col] = true;

    // Pick random color from theme
    const color = randomFrom(themeColors);

    // Create obstacle
    const obstacle: Obstacle = {
      id: obstacleId++,
      type: module.type,
      position: { x: cellX, y: cellY },
      color,
      skin,
      rotation,
      module: moduleKey,
    };

    if (module.type === 'rectangle') {
      obstacle.width = width;
      obstacle.height = height;
    } else {
      obstacle.radius = radius;
    }

    obstacles.push(obstacle);
  }

  return obstacles;
}

export function generateMap(screenWidth: number, screenHeight: number): GameState {
  // Validate input
  const validWidth = Math.max(screenWidth, 320);
  const validHeight = Math.max(screenHeight, 480);

  const mapWidth = Math.min(validWidth - MAP_CONFIG.PADDING, MAP_CONFIG.MAX_WIDTH);
  const mapHeight = validHeight * MAP_CONFIG.HEIGHT_MULTIPLIER;

  const marbles: Marble[] = [
    {
      id: 0,
      position: { x: mapWidth / 3, y: MAP_CONFIG.MARBLE_START_Y },
      velocity: { x: 0, y: 0 },
      radius: MARBLE_CONFIG.RADIUS,
      color: MARBLE_CONFIG.COLORS.PLAYER_1.color,
      glowColor: MARBLE_CONFIG.COLORS.PLAYER_1.glowColor,
      isMoving: false,
      hasFinished: false,
    },
    {
      id: 1,
      position: { x: (mapWidth * 2) / 3, y: MAP_CONFIG.MARBLE_START_Y },
      velocity: { x: 0, y: 0 },
      radius: MARBLE_CONFIG.RADIUS,
      color: MARBLE_CONFIG.COLORS.PLAYER_2.color,
      glowColor: MARBLE_CONFIG.COLORS.PLAYER_2.glowColor,
      isMoving: false,
      hasFinished: false,
    },
  ];

  const goal: Goal = {
    position: { x: mapWidth / 2, y: mapHeight - MAP_CONFIG.GOAL_OFFSET_Y },
    radius: MAP_CONFIG.GOAL_RADIUS,
  };

  const obstacles = generateObstacles(mapWidth, mapHeight);

  return {
    marbles,
    obstacles,
    goal,
    currentPlayer: 0,
    mapHeight,
    mapWidth,
    gameOver: false,
    winner: null,
    turnCount: 0,
    isPaused: false,
  };
}

import { Obstacle, Goal, Marble, GameState } from '@/types/game';
import { MAP_CONFIG, OBSTACLE_CONFIG, MARBLE_CONFIG } from '@/config/gameConfig';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Get random theme colors for this game
function getRandomThemeColors(): string[] {
  const themes = Object.values(OBSTACLE_CONFIG.THEMES);
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  return randomTheme as string[];
}

function generateObstacles(mapWidth: number, mapHeight: number, count: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const safeZoneStart = MAP_CONFIG.SAFE_ZONE_START;
  const safeZoneEnd = mapHeight - MAP_CONFIG.SAFE_ZONE_END;

  // Pick a random theme for this game
  const themeColors = getRandomThemeColors();

  for (let i = 0; i < count; i++) {
    const type = Math.random() < OBSTACLE_CONFIG.RECTANGLE_PROBABILITY ? 'rectangle' : 'circle';
    const color = themeColors[Math.floor(Math.random() * themeColors.length)];

    let obstacle: Obstacle;

    if (type === 'rectangle') {
      const width = randomInRange(OBSTACLE_CONFIG.RECTANGLE_WIDTH_MIN, OBSTACLE_CONFIG.RECTANGLE_WIDTH_MAX);
      const height = randomInRange(OBSTACLE_CONFIG.RECTANGLE_HEIGHT_MIN, OBSTACLE_CONFIG.RECTANGLE_HEIGHT_MAX);
      obstacle = {
        id: i,
        type: 'rectangle',
        position: {
          x: randomInRange(width / 2 + 20, mapWidth - width / 2 - 20),
          y: randomInRange(safeZoneStart, safeZoneEnd),
        },
        width,
        height,
        color,
      };
    } else {
      const radius = randomInRange(OBSTACLE_CONFIG.CIRCLE_RADIUS_MIN, OBSTACLE_CONFIG.CIRCLE_RADIUS_MAX);
      obstacle = {
        id: i,
        type: 'circle',
        position: {
          x: randomInRange(radius + 20, mapWidth - radius - 20),
          y: randomInRange(safeZoneStart, safeZoneEnd),
        },
        radius,
        color,
      };
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

  const obstacleCount = Math.floor(mapHeight / MAP_CONFIG.OBSTACLES_PER_HEIGHT);
  const obstacles = generateObstacles(mapWidth, mapHeight, obstacleCount);

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

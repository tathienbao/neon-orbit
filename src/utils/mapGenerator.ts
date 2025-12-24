import { Obstacle, Goal, Marble, GameState } from '@/types/game';

const OBSTACLE_COLORS = [
  'hsl(180, 100%, 50%)',  // cyan
  'hsl(300, 100%, 60%)',  // magenta
  'hsl(120, 100%, 50%)',  // green
  'hsl(60, 100%, 50%)',   // yellow
  'hsl(30, 100%, 55%)',   // orange
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateObstacles(mapWidth: number, mapHeight: number, count: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const safeZoneStart = 150; // Keep start area clear
  const safeZoneEnd = mapHeight - 150; // Keep goal area clear
  
  for (let i = 0; i < count; i++) {
    const type = Math.random() < 0.6 ? 'rectangle' : 'circle';
    const color = OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)];
    
    let obstacle: Obstacle;
    
    if (type === 'rectangle') {
      const width = randomInRange(40, 120);
      const height = randomInRange(20, 80);
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
      const radius = randomInRange(20, 50);
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
  const mapWidth = Math.min(screenWidth - 40, 400);
  const mapHeight = screenHeight * 5;
  
  const marbles: Marble[] = [
    {
      id: 0,
      position: { x: mapWidth / 3, y: 80 },
      velocity: { x: 0, y: 0 },
      radius: 15,
      color: 'hsl(180, 100%, 50%)',
      glowColor: 'rgba(0, 255, 255, 0.8)',
      isMoving: false,
      hasFinished: false,
    },
    {
      id: 1,
      position: { x: (mapWidth * 2) / 3, y: 80 },
      velocity: { x: 0, y: 0 },
      radius: 15,
      color: 'hsl(300, 100%, 60%)',
      glowColor: 'rgba(255, 0, 255, 0.8)',
      isMoving: false,
      hasFinished: false,
    },
  ];
  
  const goal: Goal = {
    position: { x: mapWidth / 2, y: mapHeight - 80 },
    radius: 35,
  };
  
  const obstacleCount = Math.floor(mapHeight / 80);
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
  };
}

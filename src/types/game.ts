export interface Vector2D {
  x: number;
  y: number;
}

export interface Marble {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  glowColor: string;
  isMoving: boolean;
  hasFinished: boolean;
}

// Only rectangle and circle are implemented
export interface Obstacle {
  id: number;
  type: 'rectangle' | 'circle';
  position: Vector2D;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  skin?: string;      // SVG skin path, e.g., "nature/tree-round"
  rotation?: number;  // Rotation in degrees (0-360)
  module?: string;    // Module key, e.g., "square-s", "wide-m", "circle-l"
}

export interface Goal {
  position: Vector2D;
  radius: number;
}

export interface GameState {
  marbles: Marble[];
  obstacles: Obstacle[];
  goal: Goal;
  currentPlayer: number;
  mapHeight: number;
  mapWidth: number;
  gameOver: boolean;
  winner: number | null;
  turnCount: number;
  isPaused: boolean;
}

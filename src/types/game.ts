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

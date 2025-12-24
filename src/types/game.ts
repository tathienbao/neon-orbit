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

export interface Obstacle {
  id: number;
  type: 'rectangle' | 'circle' | 'triangle';
  position: Vector2D;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  color: string;
  vertices?: Vector2D[];
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
}

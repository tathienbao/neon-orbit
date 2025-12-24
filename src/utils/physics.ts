import { Vector2D, Marble, Obstacle, Goal } from '@/types/game';

const FRICTION = 0.985;
const MIN_VELOCITY = 0.1;
const RESTITUTION = 0.8;

export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

export function updateMarblePhysics(marble: Marble, mapWidth: number, mapHeight: number): Marble {
  if (!marble.isMoving) return marble;

  let newVelocity = { ...marble.velocity };
  let newPosition = add(marble.position, newVelocity);

  // Apply friction
  newVelocity = scale(newVelocity, FRICTION);

  // Wall collisions
  if (newPosition.x - marble.radius < 0) {
    newPosition.x = marble.radius;
    newVelocity.x = -newVelocity.x * RESTITUTION;
  }
  if (newPosition.x + marble.radius > mapWidth) {
    newPosition.x = mapWidth - marble.radius;
    newVelocity.x = -newVelocity.x * RESTITUTION;
  }
  if (newPosition.y - marble.radius < 0) {
    newPosition.y = marble.radius;
    newVelocity.y = -newVelocity.y * RESTITUTION;
  }
  if (newPosition.y + marble.radius > mapHeight) {
    newPosition.y = mapHeight - marble.radius;
    newVelocity.y = -newVelocity.y * RESTITUTION;
  }

  // Check if stopped
  const speed = magnitude(newVelocity);
  const isMoving = speed > MIN_VELOCITY;

  if (!isMoving) {
    newVelocity = { x: 0, y: 0 };
  }

  return {
    ...marble,
    position: newPosition,
    velocity: newVelocity,
    isMoving,
  };
}

export function checkMarbleCollision(m1: Marble, m2: Marble): boolean {
  const dist = magnitude(subtract(m1.position, m2.position));
  return dist < m1.radius + m2.radius;
}

export function resolveMarbleCollision(m1: Marble, m2: Marble): [Marble, Marble] {
  const delta = subtract(m1.position, m2.position);
  const dist = magnitude(delta);
  const overlap = m1.radius + m2.radius - dist;

  if (overlap <= 0) return [m1, m2];

  const normal = normalize(delta);
  
  // Separate marbles
  const separation = scale(normal, overlap / 2);
  const newPos1 = add(m1.position, separation);
  const newPos2 = subtract(m2.position, separation);

  // Calculate new velocities
  const relVel = subtract(m1.velocity, m2.velocity);
  const velAlongNormal = dot(relVel, normal);

  if (velAlongNormal > 0) return [m1, m2];

  const impulse = scale(normal, velAlongNormal * RESTITUTION);

  return [
    { ...m1, position: newPos1, velocity: subtract(m1.velocity, impulse), isMoving: true },
    { ...m2, position: newPos2, velocity: add(m2.velocity, impulse), isMoving: true },
  ];
}

export function checkCircleObstacleCollision(marble: Marble, obstacle: Obstacle): boolean {
  if (obstacle.type !== 'circle' || !obstacle.radius) return false;
  const dist = magnitude(subtract(marble.position, obstacle.position));
  return dist < marble.radius + obstacle.radius;
}

export function resolveCircleObstacleCollision(marble: Marble, obstacle: Obstacle): Marble {
  if (!obstacle.radius) return marble;
  
  const delta = subtract(marble.position, obstacle.position);
  const dist = magnitude(delta);
  const overlap = marble.radius + obstacle.radius - dist;

  if (overlap <= 0) return marble;

  const normal = normalize(delta);
  const newPos = add(marble.position, scale(normal, overlap));
  
  const velAlongNormal = dot(marble.velocity, normal);
  const newVel = subtract(marble.velocity, scale(normal, 2 * velAlongNormal * RESTITUTION));

  return { ...marble, position: newPos, velocity: newVel, isMoving: true };
}

export function checkRectObstacleCollision(marble: Marble, obstacle: Obstacle): boolean {
  if (obstacle.type !== 'rectangle' || !obstacle.width || !obstacle.height) return false;

  const halfW = obstacle.width / 2;
  const halfH = obstacle.height / 2;

  const closestX = Math.max(obstacle.position.x - halfW, Math.min(marble.position.x, obstacle.position.x + halfW));
  const closestY = Math.max(obstacle.position.y - halfH, Math.min(marble.position.y, obstacle.position.y + halfH));

  const dist = magnitude({ x: marble.position.x - closestX, y: marble.position.y - closestY });
  return dist < marble.radius;
}

export function resolveRectObstacleCollision(marble: Marble, obstacle: Obstacle): Marble {
  if (!obstacle.width || !obstacle.height) return marble;

  const halfW = obstacle.width / 2;
  const halfH = obstacle.height / 2;

  const closestX = Math.max(obstacle.position.x - halfW, Math.min(marble.position.x, obstacle.position.x + halfW));
  const closestY = Math.max(obstacle.position.y - halfH, Math.min(marble.position.y, obstacle.position.y + halfH));

  const delta = { x: marble.position.x - closestX, y: marble.position.y - closestY };
  const dist = magnitude(delta);

  if (dist === 0) {
    // Marble center inside rectangle
    const dx = marble.position.x - obstacle.position.x;
    const dy = marble.position.y - obstacle.position.y;
    
    if (Math.abs(dx / halfW) > Math.abs(dy / halfH)) {
      const newX = dx > 0 ? obstacle.position.x + halfW + marble.radius : obstacle.position.x - halfW - marble.radius;
      return { ...marble, position: { ...marble.position, x: newX }, velocity: { x: -marble.velocity.x * RESTITUTION, y: marble.velocity.y }, isMoving: true };
    } else {
      const newY = dy > 0 ? obstacle.position.y + halfH + marble.radius : obstacle.position.y - halfH - marble.radius;
      return { ...marble, position: { ...marble.position, y: newY }, velocity: { x: marble.velocity.x, y: -marble.velocity.y * RESTITUTION }, isMoving: true };
    }
  }

  const overlap = marble.radius - dist;
  if (overlap <= 0) return marble;

  const normal = normalize(delta);
  const newPos = add(marble.position, scale(normal, overlap));
  
  const velAlongNormal = dot(marble.velocity, normal);
  const newVel = subtract(marble.velocity, scale(normal, 2 * velAlongNormal * RESTITUTION));

  return { ...marble, position: newPos, velocity: newVel, isMoving: true };
}

export function checkGoalCollision(marble: Marble, goal: Goal): boolean {
  const dist = magnitude(subtract(marble.position, goal.position));
  return dist < goal.radius - marble.radius / 2;
}

export function processCollisions(marbles: Marble[], obstacles: Obstacle[], goal: Goal): Marble[] {
  let result = [...marbles];

  // Marble-marble collisions
  if (checkMarbleCollision(result[0], result[1])) {
    [result[0], result[1]] = resolveMarbleCollision(result[0], result[1]);
  }

  // Marble-obstacle collisions
  for (let i = 0; i < result.length; i++) {
    for (const obstacle of obstacles) {
      if (obstacle.type === 'circle' && checkCircleObstacleCollision(result[i], obstacle)) {
        result[i] = resolveCircleObstacleCollision(result[i], obstacle);
      } else if (obstacle.type === 'rectangle' && checkRectObstacleCollision(result[i], obstacle)) {
        result[i] = resolveRectObstacleCollision(result[i], obstacle);
      }
    }
  }

  // Goal collision
  for (let i = 0; i < result.length; i++) {
    if (!result[i].hasFinished && checkGoalCollision(result[i], goal)) {
      result[i] = { ...result[i], hasFinished: true, isMoving: false, velocity: { x: 0, y: 0 } };
    }
  }

  return result;
}

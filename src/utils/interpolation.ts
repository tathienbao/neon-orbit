import { GameState } from '@/types/game';

export interface BufferedState {
  state: GameState;
  timestamp: number;
}

// Interpolation delay in ms - render "in the past" for smooth animation
export const INTERPOLATION_DELAY = 100;

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp t between 0 and 1
function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Interpolate between two game states
 * @param fromState Starting state
 * @param toState Target state
 * @param t Interpolation factor (0-1)
 */
export function interpolateGameState(
  fromState: GameState,
  toState: GameState,
  t: number
): GameState {
  const clampedT = clamp01(t);

  return {
    ...toState,
    marbles: toState.marbles.map((marble, i) => {
      const fromMarble = fromState.marbles[i];
      if (!fromMarble) return marble;

      return {
        ...marble,
        position: {
          x: lerp(fromMarble.position.x, marble.position.x, clampedT),
          y: lerp(fromMarble.position.y, marble.position.y, clampedT),
        },
        // Interpolate velocity for smoother motion
        velocity: {
          x: lerp(fromMarble.velocity.x, marble.velocity.x, clampedT),
          y: lerp(fromMarble.velocity.y, marble.velocity.y, clampedT),
        },
      };
    }),
  };
}

/**
 * Find two states to interpolate between based on render time
 * @param buffer Array of buffered states (sorted by timestamp, oldest first)
 * @param renderTime The target render time (current time - INTERPOLATION_DELAY)
 * @returns Object with fromState, toState, and interpolation factor t
 */
export function findInterpolationStates(
  buffer: BufferedState[],
  renderTime: number
): { fromState: GameState; toState: GameState; t: number } | null {
  if (buffer.length < 2) {
    // Not enough states to interpolate
    return null;
  }

  // Find the two states that bracket renderTime
  let fromIdx = -1;
  let toIdx = -1;

  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i].timestamp <= renderTime && buffer[i + 1].timestamp >= renderTime) {
      fromIdx = i;
      toIdx = i + 1;
      break;
    }
  }

  // If renderTime is before all states, use the first two
  if (fromIdx === -1 && renderTime < buffer[0].timestamp) {
    fromIdx = 0;
    toIdx = 1;
  }

  // If renderTime is after all states, use the last two (extrapolate slightly)
  if (fromIdx === -1 && renderTime > buffer[buffer.length - 1].timestamp) {
    fromIdx = buffer.length - 2;
    toIdx = buffer.length - 1;
  }

  if (fromIdx === -1 || toIdx === -1) {
    return null;
  }

  const fromState = buffer[fromIdx];
  const toState = buffer[toIdx];

  // Calculate interpolation factor
  const timeDiff = toState.timestamp - fromState.timestamp;
  const t = timeDiff > 0 ? (renderTime - fromState.timestamp) / timeDiff : 1;

  return {
    fromState: fromState.state,
    toState: toState.state,
    t,
  };
}

/**
 * Add a new state to the buffer and clean old states
 * @param buffer Current buffer
 * @param newState New state to add
 * @param maxAge Maximum age of states to keep (in ms)
 * @param maxSize Maximum buffer size
 */
export function addToBuffer(
  buffer: BufferedState[],
  newState: GameState,
  timestamp: number,
  maxAge: number = 500,
  maxSize: number = 20
): BufferedState[] {
  const now = timestamp;

  // Add new state
  const newBuffer = [...buffer, { state: newState, timestamp }];

  // Remove old states
  const minTime = now - maxAge;
  const filtered = newBuffer.filter(s => s.timestamp >= minTime);

  // Keep only last maxSize states
  if (filtered.length > maxSize) {
    return filtered.slice(-maxSize);
  }

  return filtered;
}

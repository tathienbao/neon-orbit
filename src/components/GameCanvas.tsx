import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState } from '@/types/game';
import { updateMarblePhysics, processCollisions } from '@/utils/physics';
import { CANVAS_CONFIG, CAMERA_CONFIG, OBSTACLE_CONFIG, GOAL_CONFIG } from '@/config/gameConfig';

interface GameCanvasProps {
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
  onTurnEnd: () => void;
  isHost?: boolean;        // For online mode - undefined means local mode
  myPlayerIndex?: number;  // For online mode
  fillHeight?: boolean;    // Use 100% height instead of fixed calc
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onGameStateChange,
  onTurnEnd,
  isHost,
  myPlayerIndex,
  fillHeight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showDebugBoundary, setShowDebugBoundary] = useState(false);
  const [showGoalIndicator, setShowGoalIndicator] = useState(true);
  const [indicatorTick, setIndicatorTick] = useState(0);
  const goalIndicatorTimeRef = useRef(Date.now());

  // Use refs to avoid recreating game loop on every state change
  const gameStateRef = useRef(gameState);
  const onGameStateChangeRef = useRef(onGameStateChange);
  const onTurnEndRef = useRef(onTurnEnd);
  const isHostRef = useRef(isHost);
  const myPlayerIndexRef = useRef(myPlayerIndex);
  const animationRef = useRef<number | null>(null);
  const wasMovingRef = useRef(false);
  const scrollAnimationRef = useRef<number | null>(null);
  const targetScrollRef = useRef(0);
  const prevPlayerRef = useRef(gameState.currentPlayer);

  // Keep refs in sync with props
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    onGameStateChangeRef.current = onGameStateChange;
  }, [onGameStateChange]);

  useEffect(() => {
    onTurnEndRef.current = onTurnEnd;
  }, [onTurnEnd]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    myPlayerIndexRef.current = myPlayerIndex;
  }, [myPlayerIndex]);

  // Smooth scroll animation function
  const animateScrollTo = useCallback((target: number) => {
    targetScrollRef.current = target;

    const animate = () => {
      setScrollY(prev => {
        const diff = targetScrollRef.current - prev;
        // Use faster easing (0.15) and stop when close enough
        if (Math.abs(diff) < 1) {
          return targetScrollRef.current;
        }
        return prev + diff * 0.15;
      });
      scrollAnimationRef.current = requestAnimationFrame(animate);
    };

    // Cancel previous animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  // Auto-scroll when player changes (turn switch)
  useEffect(() => {
    if (prevPlayerRef.current !== gameState.currentPlayer) {
      prevPlayerRef.current = gameState.currentPlayer;
      const activeMarble = gameState.marbles[gameState.currentPlayer];
      if (activeMarble && containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const targetScroll = Math.max(0, Math.min(
          activeMarble.position.y - containerHeight / 2,
          gameState.mapHeight - containerHeight
        ));
        animateScrollTo(targetScroll);
      }
    }
  }, [gameState.currentPlayer, gameState.marbles, gameState.mapHeight, animateScrollTo]);

  // Use ref for smooth camera tracking (avoids re-render jitter)
  const scrollYRef = useRef(scrollY);
  const cameraAnimationRef = useRef<number | null>(null);
  const showDebugBoundaryRef = useRef(showDebugBoundary);
  const fastModeRef = useRef(false); // Hysteresis: stay in fast mode until caught up

  // Sync refs with state
  useEffect(() => {
    scrollYRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    showDebugBoundaryRef.current = showDebugBoundary;
  }, [showDebugBoundary]);

  // Goal indicator animation: blink for 3 seconds
  useEffect(() => {
    if (!showGoalIndicator) return;

    // Force re-render every 100ms for blinking effect
    const blinkInterval = setInterval(() => {
      setIndicatorTick(t => t + 1);
    }, 100);

    // Hide after 3 seconds
    const hideTimer = setTimeout(() => {
      setShowGoalIndicator(false);
      clearInterval(blinkInterval);
    }, 3000);

    return () => {
      clearInterval(blinkInterval);
      clearTimeout(hideTimer);
    };
  }, [showGoalIndicator]);

  // Camera tracking loop - runs independently at 60fps
  useEffect(() => {
    const trackCamera = () => {
      const container = containerRef.current;
      if (!container) {
        cameraAnimationRef.current = requestAnimationFrame(trackCamera);
        return;
      }

      // Find any moving marble
      const movingMarble = gameStateRef.current.marbles.find(m => m.isMoving);

      if (movingMarble) {
        const containerHeight = container.clientHeight;
        const currentScroll = scrollYRef.current;

        // Calculate marble's position relative to viewport
        const marbleScreenY = movingMarble.position.y - currentScroll;

        // Boundary zones: top 25% and bottom 25% of viewport
        const boundarySize = containerHeight * CAMERA_CONFIG.BOUNDARY_RATIO;
        const topBoundary = boundarySize;
        const bottomBoundary = containerHeight - boundarySize;

        // Check if marble is in boundary zone (outside safe middle area)
        const inBoundaryZone = marbleScreenY < topBoundary || marbleScreenY > bottomBoundary;

        // Calculate marble's speed (velocity magnitude)
        const marbleSpeed = Math.sqrt(
          movingMarble.velocity.x ** 2 + movingMarble.velocity.y ** 2
        );
        const isMovingFast = marbleSpeed > CAMERA_CONFIG.FAST_FOLLOW_MIN_VELOCITY;

        // Calculate target scroll to center marble
        const targetScroll = Math.max(0, Math.min(
          movingMarble.position.y - containerHeight / 2,
          gameStateRef.current.mapHeight - containerHeight
        ));

        const distance = Math.abs(targetScroll - currentScroll);

        // Hysteresis logic to prevent oscillation:
        // - Enter fast mode when in boundary AND moving fast
        // - Stay in fast mode until camera catches up (distance < 50px)
        if (inBoundaryZone && isMovingFast) {
          fastModeRef.current = true;
        } else if (distance < 50) {
          // Camera caught up, exit fast mode
          fastModeRef.current = false;
        }

        // Use fast easing if in fast mode, otherwise normal
        let easing: number;
        if (fastModeRef.current) {
          easing = CAMERA_CONFIG.FAST_EASING;
        } else {
          easing = Math.min(0.4, CAMERA_CONFIG.NORMAL_EASING + distance / containerHeight * 0.2);
        }

        const newScroll = currentScroll + (targetScroll - currentScroll) * easing;
        const delta = newScroll - currentScroll;

        // Debug log when boundary debug is enabled
        if (showDebugBoundaryRef.current && Math.abs(delta) > 0.1) {
          console.log(
            `[Camera] speed:${marbleSpeed.toFixed(1)} | ` +
            `zone:${inBoundaryZone ? 'BOUNDARY' : 'safe'} | ` +
            `mode:${fastModeRef.current ? 'FAST' : 'normal'} | ` +
            `dist:${distance.toFixed(0)} | ` +
            `delta:${delta.toFixed(1)}`
          );
        }

        // Only update state if change is significant (reduces re-renders)
        if (Math.abs(delta) > 0.5) {
          setScrollY(newScroll);
        }
      }

      cameraAnimationRef.current = requestAnimationFrame(trackCamera);
    };

    cameraAnimationRef.current = requestAnimationFrame(trackCamera);

    return () => {
      if (cameraAnimationRef.current) {
        cancelAnimationFrame(cameraAnimationRef.current);
      }
    };
  }, []); // Empty deps - runs once, uses refs for current values

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  // Toggle debug boundary with 'C' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setShowDebugBoundary(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game loop - only set up once
  useEffect(() => {
    const gameLoop = () => {
      const state = gameStateRef.current;

      // Skip if paused or game over
      if (state.isPaused || state.gameOver) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Online mode: Skip physics when opponent is playing
      // In local mode (isHost === undefined), always run physics
      // The player whose turn it is runs physics; the other receives state updates
      if (isHostRef.current !== undefined && state.currentPlayer !== myPlayerIndexRef.current) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      let anyMoving = false;
      let newMarbles = state.marbles.map(marble => {
        if (marble.isMoving) {
          const updated = updateMarblePhysics(marble, state.mapWidth, state.mapHeight);
          if (updated.isMoving) anyMoving = true;
          return updated;
        }
        return marble;
      });

      // Process collisions
      newMarbles = processCollisions(newMarbles, state.obstacles, state.goal);

      // Check if any marble is still moving after collision
      anyMoving = newMarbles.some(m => m.isMoving);

      // Check win condition
      let winner: number | null = null;
      let gameOver = false;
      for (const marble of newMarbles) {
        if (marble.hasFinished) {
          winner = marble.id;
          gameOver = true;
          break;
        }
      }

      // Only update state if something changed
      const hasChanged =
        anyMoving !== state.marbles.some(m => m.isMoving) ||
        newMarbles.some((m, i) =>
          m.position.x !== state.marbles[i].position.x ||
          m.position.y !== state.marbles[i].position.y ||
          m.hasFinished !== state.marbles[i].hasFinished
        );

      if (hasChanged) {
        onGameStateChangeRef.current({
          ...state,
          marbles: newMarbles,
          winner,
          gameOver,
        });
      }

      // Check if turn ended
      if (wasMovingRef.current && !anyMoving && !gameOver) {
        onTurnEndRef.current();
      }
      wasMovingRef.current = anyMoving;

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = gameState.mapWidth;
    const displayHeight = container.clientHeight;

    // Only resize if needed
    const targetWidth = displayWidth * dpr;
    const targetHeight = displayHeight * dpr;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw grid
    ctx.strokeStyle = CANVAS_CONFIG.GRID_COLOR;
    ctx.lineWidth = 1;
    const gridSize = CANVAS_CONFIG.GRID_SIZE;
    const offsetY = scrollY % gridSize;

    for (let x = 0; x <= displayWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let y = -offsetY; y <= displayHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(0, -scrollY);

    // Draw goal - Black Hole Effect
    const goal = gameState.goal;
    const gx = goal.position.x;
    const gy = goal.position.y;
    const gr = goal.radius;

    // Outer glow
    ctx.shadowColor = GOAL_CONFIG.GLOW_COLOR;
    ctx.shadowBlur = 30;

    // Draw curved grid lines (gravity well effect)
    ctx.save();
    ctx.beginPath();
    ctx.arc(gx, gy, gr + 5, 0, Math.PI * 2);
    ctx.clip();

    // Concentric circles getting smaller toward center
    const ringCount = 5;
    for (let i = ringCount; i > 0; i--) {
      const ratio = i / ringCount;
      const ringRadius = gr * ratio;
      ctx.strokeStyle = GOAL_CONFIG.GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(gx, gy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial lines curving inward
    const lineCount = 12;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      ctx.strokeStyle = GOAL_CONFIG.GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Start from outer edge
      const startX = gx + Math.cos(angle) * gr;
      const startY = gy + Math.sin(angle) * gr;
      ctx.moveTo(startX, startY);
      // Curve toward center with bezier
      const midAngle = angle + 0.3; // Slight rotation for curve effect
      const midX = gx + Math.cos(midAngle) * gr * 0.5;
      const midY = gy + Math.sin(midAngle) * gr * 0.5;
      ctx.quadraticCurveTo(midX, midY, gx, gy);
      ctx.stroke();
    }
    ctx.restore();

    // Dark center (the "hole")
    const holeGradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr * 0.4);
    holeGradient.addColorStop(0, GOAL_CONFIG.CENTER_COLOR);
    holeGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = holeGradient;
    ctx.beginPath();
    ctx.arc(gx, gy, gr * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring with glow
    ctx.strokeStyle = GOAL_CONFIG.COLOR;
    ctx.lineWidth = 3;
    ctx.shadowColor = GOAL_CONFIG.GLOW_COLOR;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw obstacles (muted colors, reduced glow)
    for (const obstacle of gameState.obstacles) {
      ctx.fillStyle = obstacle.color;
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = OBSTACLE_CONFIG.GLOW_BLUR;

      if (obstacle.type === 'rectangle' && obstacle.width && obstacle.height) {
        ctx.fillRect(
          obstacle.position.x - obstacle.width / 2,
          obstacle.position.y - obstacle.height / 2,
          obstacle.width,
          obstacle.height
        );
        ctx.strokeStyle = obstacle.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          obstacle.position.x - obstacle.width / 2,
          obstacle.position.y - obstacle.height / 2,
          obstacle.width,
          obstacle.height
        );
      } else if (obstacle.type === 'circle' && obstacle.radius) {
        ctx.beginPath();
        ctx.arc(obstacle.position.x, obstacle.position.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = obstacle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // Draw marbles
    for (const marble of gameState.marbles) {
      if (marble.hasFinished) continue;

      // Glow
      ctx.shadowColor = marble.glowColor;
      ctx.shadowBlur = 25;

      // Marble body
      const gradient = ctx.createRadialGradient(
        marble.position.x - marble.radius * 0.3,
        marble.position.y - marble.radius * 0.3,
        0,
        marble.position.x,
        marble.position.y,
        marble.radius
      );
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(0.3, marble.color);
      gradient.addColorStop(1, marble.color.replace('50%', '30%'));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(marble.position.x, marble.position.y, marble.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = marble.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Player number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${marble.id + 1}`, marble.position.x, marble.position.y);
    }

    ctx.restore();

    // Draw pause overlay
    if (gameState.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      ctx.fillStyle = 'hsl(180, 100%, 50%)';
      ctx.font = 'bold 24px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TẠM DỪNG', displayWidth / 2, displayHeight / 2);
    }

    // Draw scroll indicator
    const indicatorHeight = (displayHeight / gameState.mapHeight) * displayHeight;
    const indicatorY = (scrollY / gameState.mapHeight) * displayHeight;
    ctx.fillStyle = 'hsla(180, 100%, 50%, 0.3)';
    ctx.fillRect(displayWidth - 6, indicatorY, 4, indicatorHeight);

    // Draw blinking goal arrow indicator (first 3 seconds)
    const goalScreenY = gameState.goal.position.y - scrollY;
    if (showGoalIndicator && goalScreenY > displayHeight) {
      // Blink effect: visible for 500ms, hidden for 300ms
      const elapsed = Date.now() - goalIndicatorTimeRef.current;
      const blinkCycle = elapsed % 800;
      const isVisible = blinkCycle < 500;

      if (isVisible) {
        const arrowX = displayWidth / 2;
        const arrowY = displayHeight - 50;

        // Arrow glow
        ctx.shadowColor = GOAL_CONFIG.GLOW_COLOR;
        ctx.shadowBlur = 20;

        // Draw down arrow (larger)
        ctx.fillStyle = GOAL_CONFIG.COLOR;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY + 30);      // Bottom point
        ctx.lineTo(arrowX - 25, arrowY);      // Left
        ctx.lineTo(arrowX - 10, arrowY);      // Left inner
        ctx.lineTo(arrowX - 10, arrowY - 20); // Top left
        ctx.lineTo(arrowX + 10, arrowY - 20); // Top right
        ctx.lineTo(arrowX + 10, arrowY);      // Right inner
        ctx.lineTo(arrowX + 25, arrowY);      // Right
        ctx.closePath();
        ctx.fill();

        // "GOAL" text (larger)
        ctx.fillStyle = GOAL_CONFIG.COLOR;
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('GOAL', arrowX, arrowY - 25);

        ctx.shadowBlur = 0;
      }
    }

    // Draw debug boundary frame (toggle with C key)
    if (showDebugBoundary) {
      const boundarySize = displayHeight * CAMERA_CONFIG.BOUNDARY_RATIO;

      ctx.strokeStyle = 'hsla(30, 100%, 50%, 0.8)'; // Orange
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);

      // Top boundary line
      ctx.beginPath();
      ctx.moveTo(0, boundarySize);
      ctx.lineTo(displayWidth, boundarySize);
      ctx.stroke();

      // Bottom boundary line
      ctx.beginPath();
      ctx.moveTo(0, displayHeight - boundarySize);
      ctx.lineTo(displayWidth, displayHeight - boundarySize);
      ctx.stroke();

      ctx.setLineDash([]); // Reset

      // Label
      ctx.fillStyle = 'hsla(30, 100%, 50%, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('BOUNDARY ZONE', 5, 5);
      ctx.fillText('(fast camera)', 5, 17);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, scrollY, showDebugBoundary, showGoalIndicator, indicatorTick]);

  // Render on state change
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border-2 border-primary/50"
      style={{
        height: fillHeight ? '100%' : 'calc(100vh - 280px)',
        minHeight: fillHeight ? undefined : '400px',
        boxShadow: '0 0 40px hsla(180, 100%, 50%, 0.2), inset 0 0 60px hsla(180, 100%, 50%, 0.05)'
      }}
    >
      <canvas
        ref={canvasRef}
        className="block mx-auto"
      />
    </div>
  );
};

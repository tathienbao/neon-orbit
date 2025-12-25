import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState } from '@/types/game';
import { updateMarblePhysics, processCollisions } from '@/utils/physics';
import { CANVAS_CONFIG } from '@/config/gameConfig';

interface GameCanvasProps {
  gameState: GameState;
  onGameStateChange: (state: GameState) => void;
  onTurnEnd: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onGameStateChange,
  onTurnEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Use refs to avoid recreating game loop on every state change
  const gameStateRef = useRef(gameState);
  const onGameStateChangeRef = useRef(onGameStateChange);
  const onTurnEndRef = useRef(onTurnEnd);
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

  // Auto-scroll to follow ANY moving marble
  useEffect(() => {
    if (!containerRef.current) return;

    // Find any moving marble
    const movingMarble = gameState.marbles.find(m => m.isMoving);
    if (!movingMarble) return;

    const containerHeight = containerRef.current.clientHeight;
    const marbleScreenY = movingMarble.position.y - scrollY;

    // Calculate how far marble is from center of screen
    const centerY = containerHeight / 2;
    const distanceFromCenter = Math.abs(marbleScreenY - centerY);

    // Use faster easing when marble is far from center
    // Normal: 0.1, Fast: up to 0.5 when far off screen
    const baseEasing = 0.1;
    const maxEasing = 0.5;
    const threshold = containerHeight * 0.3; // 30% from center
    const easing = distanceFromCenter > threshold
      ? Math.min(maxEasing, baseEasing + (distanceFromCenter - threshold) / containerHeight * 0.8)
      : baseEasing;

    const targetScroll = Math.max(0, Math.min(
      movingMarble.position.y - containerHeight / 2,
      gameState.mapHeight - containerHeight
    ));

    setScrollY(prev => prev + (targetScroll - prev) * easing);
  }, [gameState.marbles, gameState.mapHeight, scrollY]);

  // Cleanup scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
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

    // Draw goal
    const goal = gameState.goal;
    const goalGradient = ctx.createRadialGradient(
      goal.position.x, goal.position.y, 0,
      goal.position.x, goal.position.y, goal.radius
    );
    goalGradient.addColorStop(0, 'hsl(120, 100%, 30%)');
    goalGradient.addColorStop(0.5, 'hsl(120, 100%, 20%)');
    goalGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = goalGradient;
    ctx.beginPath();
    ctx.arc(goal.position.x, goal.position.y, goal.radius, 0, Math.PI * 2);
    ctx.fill();

    // Goal ring
    ctx.strokeStyle = 'hsl(120, 100%, 50%)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'hsl(120, 100%, 50%)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(goal.position.x, goal.position.y, goal.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
      ctx.fillStyle = obstacle.color;
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 15;

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
  }, [gameState, scrollY]);

  // Render on state change
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border-2 border-primary/50"
      style={{
        height: 'calc(100vh - 280px)',
        minHeight: '400px',
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

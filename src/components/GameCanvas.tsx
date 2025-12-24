import React, { useRef, useEffect, useState } from 'react';
import { GameState, Vector2D } from '@/types/game';
import { updateMarblePhysics, processCollisions } from '@/utils/physics';

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
  const animationRef = useRef<number>();
  const wasMovingRef = useRef(false);

  // Auto-scroll to follow active marble
  useEffect(() => {
    const activeMarble = gameState.marbles[gameState.currentPlayer];
    if (activeMarble && containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const targetScroll = Math.max(0, Math.min(
        activeMarble.position.y - containerHeight / 2,
        gameState.mapHeight - containerHeight
      ));
      setScrollY(prev => prev + (targetScroll - prev) * 0.1);
    }
  }, [gameState.marbles, gameState.currentPlayer, gameState.mapHeight]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      let anyMoving = false;
      let newMarbles = [...gameState.marbles];

      for (let i = 0; i < newMarbles.length; i++) {
        if (newMarbles[i].isMoving) {
          newMarbles[i] = updateMarblePhysics(newMarbles[i], gameState.mapWidth, gameState.mapHeight);
          if (newMarbles[i].isMoving) anyMoving = true;
        }
      }

      // Process collisions
      newMarbles = processCollisions(newMarbles, gameState.obstacles, gameState.goal);

      // Check if any marble is still moving after collision
      anyMoving = newMarbles.some(m => m.isMoving);

      // Check win condition
      let winner = null;
      let gameOver = false;
      for (const marble of newMarbles) {
        if (marble.hasFinished) {
          winner = marble.id;
          gameOver = true;
          break;
        }
      }

      onGameStateChange({
        ...gameState,
        marbles: newMarbles,
        winner,
        gameOver,
      });

      // Check if turn ended
      if (wasMovingRef.current && !anyMoving && !gameOver) {
        onTurnEnd();
      }
      wasMovingRef.current = anyMoving;

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, onGameStateChange, onTurnEnd]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = gameState.mapWidth;
    const displayHeight = containerRef.current?.clientHeight || 600;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'hsl(240, 15%, 6%)';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw grid
    ctx.strokeStyle = 'hsla(180, 100%, 50%, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
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

    // Draw scroll indicator
    const indicatorHeight = (displayHeight / gameState.mapHeight) * displayHeight;
    const indicatorY = (scrollY / gameState.mapHeight) * displayHeight;
    ctx.fillStyle = 'hsla(180, 100%, 50%, 0.3)';
    ctx.fillRect(displayWidth - 6, indicatorY, 4, indicatorHeight);

  }, [gameState, scrollY]);

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

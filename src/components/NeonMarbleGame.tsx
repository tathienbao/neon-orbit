import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Vector2D } from '@/types/game';
import { generateMap } from '@/utils/mapGenerator';
import { GameCanvas } from './GameCanvas';
import { Joystick } from './Joystick';
import { GameUI } from './GameUI';
import { WinnerModal } from './WinnerModal';
import { toast } from 'sonner';

const SHOOT_POWER_MULTIPLIER = 25;

export const NeonMarbleGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initGame = useCallback(() => {
    const newState = generateMap(window.innerWidth, window.innerHeight);
    setGameState(newState);
    toast.success('Map mới đã được tạo!', {
      description: 'Người chơi 1 bắt đầu trước',
    });
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleShoot = useCallback((direction: Vector2D, power: number) => {
    if (!gameState || gameState.gameOver) return;

    const currentMarble = gameState.marbles[gameState.currentPlayer];
    if (currentMarble.isMoving || currentMarble.hasFinished) return;

    const velocity = {
      x: direction.x * power * SHOOT_POWER_MULTIPLIER,
      y: direction.y * power * SHOOT_POWER_MULTIPLIER,
    };

    const newMarbles = [...gameState.marbles];
    newMarbles[gameState.currentPlayer] = {
      ...currentMarble,
      velocity,
      isMoving: true,
    };

    setGameState({
      ...gameState,
      marbles: newMarbles,
      turnCount: gameState.turnCount + 1,
    });
  }, [gameState]);

  const handleTurnEnd = useCallback(() => {
    if (!gameState || gameState.gameOver) return;

    const nextPlayer = (gameState.currentPlayer + 1) % 2;
    
    // Skip if next player already finished
    if (gameState.marbles[nextPlayer].hasFinished) {
      return;
    }

    setGameState(prev => prev ? {
      ...prev,
      currentPlayer: nextPlayer,
    } : null);

    toast.info(`Lượt của Người chơi ${nextPlayer + 1}`, {
      duration: 2000,
    });
  }, [gameState]);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-primary neon-text animate-pulse">
          Đang tải...
        </div>
      </div>
    );
  }

  const currentMarble = gameState.marbles[gameState.currentPlayer];
  const isAnyMoving = gameState.marbles.some(m => m.isMoving);
  const canShoot = !isAnyMoving && !gameState.gameOver && !currentMarble.hasFinished;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4">
      {/* Header */}
      <header className="text-center">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary neon-text tracking-wider">
          NEON MARBLE
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Bắn bi vào lỗ để chiến thắng!
        </p>
      </header>

      {/* Game UI */}
      <GameUI gameState={gameState} onRestart={initGame} />

      {/* Game area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-center">
        {/* Canvas */}
        <div className="flex-1 w-full max-w-md">
          <GameCanvas 
            gameState={gameState}
            onGameStateChange={handleGameStateChange}
            onTurnEnd={handleTurnEnd}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {isAnyMoving ? 'Đang di chuyển...' : 'Kéo để bắn'}
            </div>
            <div 
              className="font-display text-lg font-bold"
              style={{ 
                color: currentMarble.color,
                textShadow: `0 0 10px ${currentMarble.glowColor}`,
              }}
            >
              Người chơi {gameState.currentPlayer + 1}
            </div>
          </div>
          
          <Joystick 
            onShoot={handleShoot}
            disabled={!canShoot}
            playerColor={currentMarble.color}
          />
          
          <p className="text-xs text-muted-foreground text-center max-w-[150px]">
            Kéo núm theo hướng muốn bắn. Kéo xa = mạnh hơn
          </p>
        </div>
      </div>

      {/* Winner Modal */}
      <WinnerModal gameState={gameState} onRestart={initGame} />
    </div>
  );
};

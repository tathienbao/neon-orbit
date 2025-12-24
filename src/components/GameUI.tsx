import React from 'react';
import { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ gameState, onRestart }) => {
  const currentMarble = gameState.marbles[gameState.currentPlayer];
  const isMoving = gameState.marbles.some(m => m.isMoving);

  return (
    <div className="flex items-center justify-between gap-4 px-2">
      {/* Player indicators */}
      <div className="flex gap-3">
        {gameState.marbles.map((marble, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
              gameState.currentPlayer === idx && !isMoving
                ? 'scale-105'
                : 'opacity-60'
            }`}
            style={{
              borderColor: marble.color,
              boxShadow: gameState.currentPlayer === idx && !isMoving
                ? `0 0 20px ${marble.glowColor}`
                : 'none',
              background: `linear-gradient(135deg, ${marble.color}20, transparent)`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: marble.color }}
            />
            <span className="font-display text-sm font-bold" style={{ color: marble.color }}>
              P{idx + 1}
            </span>
            {marble.hasFinished && (
              <Trophy className="w-4 h-4 text-accent" />
            )}
          </div>
        ))}
      </div>

      {/* Game info */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Lượt</div>
          <div className="font-display text-xl font-bold text-primary neon-text">
            {gameState.turnCount}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          className="border-primary/50 hover:border-primary hover:bg-primary/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Chơi lại
        </Button>
      </div>
    </div>
  );
};

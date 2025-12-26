import React from 'react';
import { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw } from 'lucide-react';

interface WinnerModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ gameState, onRestart }) => {
  if (!gameState.gameOver || gameState.winner === null) return null;

  const winnerMarble = gameState.marbles[gameState.winner];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className="glass-panel rounded-2xl p-8 text-center max-w-sm mx-4 animate-scale-in"
        style={{
          boxShadow: `0 0 60px ${winnerMarble.glowColor}, 0 0 120px ${winnerMarble.glowColor}40`,
        }}
      >
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse-glow"
          style={{
            background: `radial-gradient(circle, ${winnerMarble.color}, ${winnerMarble.color}80)`,
            boxShadow: `0 0 40px ${winnerMarble.glowColor}`,
          }}
        >
          <Trophy className="w-10 h-10 text-background" />
        </div>

        <h2
          className="font-display text-3xl font-bold mb-2"
          style={{
            color: winnerMarble.color,
            textShadow: `0 0 20px ${winnerMarble.glowColor}`,
          }}
        >
          PLAYER {gameState.winner + 1}
        </h2>

        <p className="text-2xl font-display font-bold text-foreground mb-2">
          WINS!
        </p>

        <p className="text-muted-foreground mb-6">
          Completed in {gameState.turnCount} turns
        </p>

        <Button
          onClick={onRestart}
          className="w-full font-display font-bold"
          style={{
            background: `linear-gradient(135deg, ${winnerMarble.color}, ${winnerMarble.color}80)`,
            boxShadow: `0 0 20px ${winnerMarble.glowColor}60`,
          }}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  );
};

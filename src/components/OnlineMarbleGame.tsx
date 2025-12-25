import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Vector2D } from '@/types/game';
import { generateMap } from '@/utils/mapGenerator';
import { GameCanvas } from './GameCanvas';
import { Joystick } from './Joystick';
import { GameUI } from './GameUI';
import { WinnerModal } from './WinnerModal';
import { ErrorBoundary } from './ErrorBoundary';
import { toast } from 'sonner';
import { PHYSICS_CONFIG, UI_CONFIG } from '@/config/gameConfig';
import { RoomInfo, useMultiplayer } from '@/hooks/useMultiplayer';
import { ArrowLeft, Wifi } from 'lucide-react';
import { Button } from './ui/button';

const { SHOOT_POWER_MULTIPLIER } = PHYSICS_CONFIG;

interface OnlineMarbleGameProps {
  roomInfo: RoomInfo;
  multiplayer: ReturnType<typeof useMultiplayer>;
  onLeave: () => void;
}

const OnlineMarbleGameInner: React.FC<OnlineMarbleGameProps> = ({
  roomInfo,
  multiplayer,
  onLeave,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const isHost = roomInfo.isHost;
  const myPlayerIndex = roomInfo.playerIndex;
  const initRef = useRef(false);

  const initGame = useCallback(() => {
    const newState = generateMap(window.innerWidth, window.innerHeight);
    setGameState(newState);

    if (isHost) {
      // Host sends initial game state to guest
      multiplayer.initGameState(newState);
      toast.success('Game bắt đầu!', {
        description: 'Bạn là Người chơi 1 (Xanh)',
      });
    }
  }, [isHost, multiplayer]);

  // Initialize game (host creates, guest requests)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (isHost) {
      initGame();
    } else {
      toast.info('Đang đợi host khởi tạo game...');
      // Request game state after a short delay to ensure listeners are set up
      setTimeout(() => {
        if (!gameState) {
          console.log('Guest requesting game state...');
          multiplayer.requestGameState();
        }
      }, 500);
    }
  }, [isHost, initGame, multiplayer, gameState]);

  // Listen for game state sync from host
  useEffect(() => {
    multiplayer.onGameStateSync((newGameState) => {
      console.log('Received game state sync');
      setGameState(newGameState);
      if (!gameState) {
        toast.success('Game bắt đầu!', {
          description: 'Bạn là Người chơi 2 (Hồng)',
        });
      }
    });
  }, [multiplayer, gameState]);

  // Host: listen for request to send game state
  useEffect(() => {
    if (!isHost) return;

    multiplayer.onSendGameStateRequest(() => {
      console.log('Host received request to send game state');
      if (gameState) {
        multiplayer.initGameState(gameState);
      }
    });
  }, [isHost, multiplayer, gameState]);

  // Listen for opponent shoot
  useEffect(() => {
    multiplayer.onOpponentShoot((data) => {
      if (!gameState || gameState.gameOver || gameState.isPaused) return;

      const opponentIndex = myPlayerIndex === 0 ? 1 : 0;
      const opponentMarble = gameState.marbles[opponentIndex];

      if (opponentMarble.isMoving || opponentMarble.hasFinished) return;

      const velocity = {
        x: data.direction.x * data.power * SHOOT_POWER_MULTIPLIER,
        y: data.direction.y * data.power * SHOOT_POWER_MULTIPLIER,
      };

      const newMarbles = gameState.marbles.map((marble, index) => {
        if (index === opponentIndex) {
          return { ...marble, velocity, isMoving: true };
        }
        return marble;
      });

      const newState = {
        ...gameState,
        marbles: newMarbles,
        turnCount: gameState.turnCount + 1,
      };

      setGameState(newState);

      // Host syncs to guest
      if (isHost) {
        multiplayer.sendGameState(newState);
      }
    });
  }, [gameState, multiplayer, myPlayerIndex, isHost]);

  // Listen for game restart
  useEffect(() => {
    multiplayer.onGameRestart((newGameState) => {
      setGameState(newGameState);
      toast.success('Game mới!');
    });
  }, [multiplayer]);

  // Keyboard shortcuts for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver) return prev;
      const newPaused = !prev.isPaused;
      toast.info(newPaused ? 'Game tạm dừng' : 'Tiếp tục chơi', {
        duration: UI_CONFIG.TOAST_DURATION,
      });
      return { ...prev, isPaused: newPaused };
    });
  }, []);

  const handleShoot = useCallback((direction: Vector2D, power: number) => {
    if (!gameState || gameState.gameOver || gameState.isPaused) return;

    // Can only shoot on my turn
    if (gameState.currentPlayer !== myPlayerIndex) {
      toast.warning('Chưa đến lượt của bạn!');
      return;
    }

    const currentMarble = gameState.marbles[myPlayerIndex];
    if (currentMarble.isMoving || currentMarble.hasFinished) return;

    const velocity = {
      x: direction.x * power * SHOOT_POWER_MULTIPLIER,
      y: direction.y * power * SHOOT_POWER_MULTIPLIER,
    };

    const newMarbles = gameState.marbles.map((marble, index) => {
      if (index === myPlayerIndex) {
        return { ...marble, velocity, isMoving: true };
      }
      return marble;
    });

    const newState = {
      ...gameState,
      marbles: newMarbles,
      turnCount: gameState.turnCount + 1,
    };

    setGameState(newState);

    // Send shoot to opponent
    multiplayer.sendShoot(direction, power);

    // Host syncs state
    if (isHost) {
      multiplayer.sendGameState(newState);
    }
  }, [gameState, myPlayerIndex, multiplayer, isHost]);

  const handleTurnEnd = useCallback(() => {
    if (!gameState || gameState.gameOver) return;

    const nextPlayer = (gameState.currentPlayer + 1) % gameState.marbles.length;

    if (gameState.marbles[nextPlayer].hasFinished) {
      return;
    }

    // Create final state with updated marble positions
    const newState: GameState = {
      ...gameState,
      currentPlayer: nextPlayer,
    };

    setGameState(newState);

    if (nextPlayer === myPlayerIndex) {
      toast.info('Đến lượt của bạn!', {
        duration: UI_CONFIG.TOAST_DURATION,
      });
    } else {
      toast.info('Lượt của đối thủ', {
        duration: UI_CONFIG.TOAST_DURATION,
      });
    }

    // Host syncs final state after turn ends
    if (isHost) {
      multiplayer.sendGameState(newState);
    }
  }, [gameState, myPlayerIndex, multiplayer, isHost]);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
    // Don't sync every frame - only sync on turn end and significant events
    // This prevents jitter on guest's screen
  }, []);

  const handleRestart = useCallback(() => {
    const newState = generateMap(window.innerWidth, window.innerHeight);
    setGameState(newState);

    // Sync restart to opponent
    multiplayer.sendRestart(newState);
    toast.success('Game mới!');
  }, [multiplayer]);

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
  const myMarble = gameState.marbles[myPlayerIndex];
  const isAnyMoving = gameState.marbles.some(m => m.isMoving);
  const isMyTurn = gameState.currentPlayer === myPlayerIndex;
  const canShoot = !isAnyMoving && !gameState.gameOver && !myMarble.hasFinished && !gameState.isPaused && isMyTurn;

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4">
      {/* Header */}
      <header className="text-center relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className="absolute left-0 top-0"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Rời game
        </Button>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary neon-text tracking-wider">
          NEON MARBLE
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>Online - Phòng {roomInfo.roomCode}</span>
        </div>
      </header>

      {/* Game UI */}
      <GameUI
        gameState={gameState}
        onRestart={handleRestart}
        onTogglePause={handleTogglePause}
      />

      {/* Turn indicator */}
      <div className="text-center">
        <div
          className={`inline-block px-4 py-2 rounded-full font-display text-sm ${
            isMyTurn ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isMyTurn ? 'Lượt của bạn!' : 'Lượt của đối thủ...'}
        </div>
      </div>

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
              {gameState.isPaused ? 'Tạm dừng' : isAnyMoving ? 'Đang di chuyển...' : isMyTurn ? 'Kéo để bắn' : 'Chờ đối thủ'}
            </div>
            <div
              className="font-display text-lg font-bold"
              style={{
                color: myMarble.color,
                textShadow: `0 0 10px ${myMarble.glowColor}`,
              }}
            >
              Bạn: Người chơi {myPlayerIndex + 1}
            </div>
          </div>

          <Joystick
            onShoot={handleShoot}
            disabled={!canShoot}
            playerColor={myMarble.color}
          />

          <p className="text-xs text-muted-foreground text-center max-w-[150px]">
            {isMyTurn ? 'Kéo núm theo hướng muốn bắn' : 'Đợi đối thủ bắn...'}
          </p>
        </div>
      </div>

      {/* Winner Modal */}
      <WinnerModal gameState={gameState} onRestart={handleRestart} />
    </div>
  );
};

export const OnlineMarbleGame: React.FC<OnlineMarbleGameProps> = (props) => {
  return (
    <ErrorBoundary>
      <OnlineMarbleGameInner {...props} />
    </ErrorBoundary>
  );
};

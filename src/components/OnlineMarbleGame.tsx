import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Vector2D } from '@/types/game';
import { generateMap } from '@/utils/mapGenerator';
import { GameCanvas } from './GameCanvas';
import { Joystick } from './Joystick';
import { GameUI } from './GameUI';
import { WinnerModal } from './WinnerModal';
import { ErrorBoundary } from './ErrorBoundary';
import { toast } from 'sonner';
import { PHYSICS_CONFIG, UI_CONFIG, LAYOUT_CONFIG } from '@/config/gameConfig';
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
  const [displayState, setDisplayState] = useState<GameState | null>(null); // What Guest actually renders
  const [isMobile, setIsMobile] = useState(window.innerWidth < LAYOUT_CONFIG.MOBILE_BREAKPOINT);
  const isHost = roomInfo.isHost;
  const myPlayerIndex = roomInfo.playerIndex;
  const initRef = useRef(false);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < LAYOUT_CONFIG.MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Buffered playback for Guest - smooth animation even with network jitter
  const stateBufferRef = useRef<GameState[]>([]);
  const playbackFrameRef = useRef<number | null>(null);
  const lastPlaybackTimeRef = useRef<number>(0);
  const PLAYBACK_INTERVAL = 16; // ~60fps playback rate

  const initGame = useCallback(() => {
    const newState = generateMap(window.innerWidth, window.innerHeight);
    setGameState(newState);
    setDisplayState(newState);
    stateBufferRef.current = []; // Clear buffer on new game

    if (isHost) {
      // Host sends initial game state to guest
      multiplayer.initGameState(newState);
      toast.success('Game started!', {
        description: 'You are Player 1 (Cyan)',
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
      toast.info('Waiting for host to start game...');
      // Request game state after a short delay to ensure listeners are set up
      setTimeout(() => {
        if (!gameState) {
          console.log('Guest requesting game state...');
          multiplayer.requestGameState();
        }
      }, 500);
    }
  }, [isHost, initGame, multiplayer, gameState]);

  // Listen for game state sync from host - buffered playback for Guest
  useEffect(() => {
    multiplayer.onGameStateSync((newGameState) => {
      // Always update authoritative gameState (for game logic)
      setGameState(newGameState);

      if (isHost) {
        // Host: apply directly to display
        setDisplayState(newGameState);
      } else {
        // Guest: buffer for smooth playback
        // Only buffer when it's opponent's turn (my marble being controlled by Host)
        if (newGameState.currentPlayer !== myPlayerIndex) {
          stateBufferRef.current.push(newGameState);
        } else {
          // My turn - apply directly, clear buffer
          setDisplayState(newGameState);
          stateBufferRef.current = [];
        }
      }

      if (!gameState) {
        toast.success('Game started!', {
          description: isHost ? 'You are Player 1 (Cyan)' : 'You are Player 2 (Pink)',
        });
      }
    });
  }, [multiplayer, gameState, isHost, myPlayerIndex]);

  // Guest playback loop - plays buffered states at steady rate
  useEffect(() => {
    if (isHost) return;

    const playback = (timestamp: number) => {
      const buffer = stateBufferRef.current;

      // Throttle playback to PLAYBACK_INTERVAL
      if (timestamp - lastPlaybackTimeRef.current >= PLAYBACK_INTERVAL) {
        lastPlaybackTimeRef.current = timestamp;

        if (buffer.length > 0) {
          // Take oldest state from buffer
          const state = buffer.shift()!;
          setDisplayState(state);

          // If buffer is getting too large (network burst), catch up
          if (buffer.length > 10) {
            // Skip some frames to catch up
            buffer.splice(0, buffer.length - 5);
          }
        }
      }

      playbackFrameRef.current = requestAnimationFrame(playback);
    };

    playbackFrameRef.current = requestAnimationFrame(playback);

    return () => {
      if (playbackFrameRef.current) {
        cancelAnimationFrame(playbackFrameRef.current);
      }
    };
  }, [isHost]);

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
      setDisplayState(newState); // Must update display so physics sees isMoving=true
      if (isHost) {
        multiplayer.sendGameState(newState);
      }
    });
  }, [gameState, multiplayer, myPlayerIndex, isHost]);

  // Listen for game restart
  useEffect(() => {
    multiplayer.onGameRestart((newGameState) => {
      setGameState(newGameState);
      setDisplayState(newGameState);
      stateBufferRef.current = [];
      toast.success('New game!');
    });
  }, [multiplayer]);

  // Keyboard shortcuts for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => {
          if (!prev) return null;
          const newState = { ...prev, isPaused: !prev.isPaused };
          setDisplayState(newState);
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.gameOver) return prev;
      const newPaused = !prev.isPaused;
      const newState = { ...prev, isPaused: newPaused };
      setDisplayState(newState);
      toast.info(newPaused ? 'Game paused' : 'Game resumed', {
        duration: UI_CONFIG.TOAST_DURATION,
      });
      return newState;
    });
  }, []);

  const handleShoot = useCallback((direction: Vector2D, power: number) => {
    if (!gameState || gameState.gameOver || gameState.isPaused) return;

    // Can only shoot on my turn
    if (gameState.currentPlayer !== myPlayerIndex) {
      toast.warning('Not your turn!');
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
    setDisplayState(newState); // My turn, update display immediately

    // Send shoot to opponent
    multiplayer.sendShoot(direction, power);

    // Both Host and Guest sync initial shoot state
    multiplayer.sendGameState(newState);
  }, [gameState, myPlayerIndex, multiplayer]);

  const handleTurnEnd = useCallback(() => {
    if (!gameState || gameState.gameOver) return;

    const nextPlayer = (gameState.currentPlayer + 1) % gameState.marbles.length;

    if (gameState.marbles[nextPlayer].hasFinished) {
      return;
    }

    const newState = {
      ...gameState,
      currentPlayer: nextPlayer,
    };

    setGameState(newState);
    setDisplayState(newState);

    if (nextPlayer === myPlayerIndex) {
      toast.info('Your turn!', {
        duration: UI_CONFIG.TOAST_DURATION,
      });
    } else {
      toast.info("Opponent's turn", {
        duration: UI_CONFIG.TOAST_DURATION,
      });
    }

    // Both Host and Guest send turn change
    multiplayer.sendGameState(newState);
  }, [gameState, myPlayerIndex, multiplayer]);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
    setDisplayState(newState); // From physics loop, update display

    // Whoever is playing sends state updates to the other player
    if (newState.currentPlayer === myPlayerIndex) {
      multiplayer.sendGameState(newState);
    }
  }, [multiplayer, myPlayerIndex]);

  const handleRestart = useCallback(() => {
    const newState = generateMap(window.innerWidth, window.innerHeight);
    setGameState(newState);
    setDisplayState(newState);
    stateBufferRef.current = [];

    // Sync restart to opponent
    multiplayer.sendRestart(newState);
    toast.success('Game mới!');
  }, [multiplayer]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl text-primary neon-text animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  const currentMarble = gameState.marbles[gameState.currentPlayer];
  const myMarble = gameState.marbles[myPlayerIndex];
  const isAnyMoving = gameState.marbles.some(m => m.isMoving);
  const isMyTurn = gameState.currentPlayer === myPlayerIndex;
  const canShoot = !isAnyMoving && !gameState.gameOver && !myMarble.hasFinished && !gameState.isPaused && isMyTurn;

  // Mobile layout: map area + joystick area (5:3 ratio)
  // Joystick area: width = screen width, height = width * 3/5
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const joystickAreaHeight = screenWidth * (3 / 5);
  const mapAreaHeight = screenHeight - joystickAreaHeight;

  // Scale factor if map is larger than available width (screen minus padding)
  const mapWidth = gameState.mapWidth;
  const padding = 16; // p-2 = 8px each side
  const availableWidth = screenWidth - padding;
  const needsScale = mapWidth > availableWidth;
  const scaleFactor = needsScale ? availableWidth / mapWidth : 1;

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col">
        {/* Map area - takes remaining height after joystick */}
        <div
          className="relative overflow-hidden p-2"
          style={{ height: mapAreaHeight }}
        >
          {/* Scale wrapper if needed */}
          <div
            style={needsScale ? {
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top left',
              width: mapWidth,
              height: (mapAreaHeight - padding) / scaleFactor,
            } : { height: '100%' }}
          >
            <GameCanvas
              gameState={displayState || gameState}
              onGameStateChange={handleGameStateChange}
              onTurnEnd={handleTurnEnd}
              isHost={isHost}
              myPlayerIndex={myPlayerIndex}
              fillHeight
            />
          </div>

          {/* Top overlay - minimal UI */}
          <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-10 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <GameUI
                gameState={gameState}
                onRestart={handleRestart}
                onTogglePause={handleTogglePause}
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs bg-background/80 px-2 py-1 rounded">
                <Wifi className="w-3 h-3 text-green-500" />
                <span>{roomInfo.roomCode}</span>
              </div>
              <div
                className={`font-display text-xs font-bold px-2 py-1 rounded ${
                  isMyTurn ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}
              >
                {isMyTurn ? 'Your turn' : 'Wait...'}
              </div>
            </div>
          </div>
        </div>

        {/* Joystick area - fixed 4:3 ratio */}
        <div
          className="flex items-center justify-center"
          style={{ height: joystickAreaHeight }}
        >
          <Joystick
            onShoot={handleShoot}
            disabled={!canShoot}
            playerColor={myMarble.color}
            compact
          />
        </div>

        {/* Winner Modal */}
        <WinnerModal gameState={gameState} onRestart={handleRestart} />
      </div>
    );
  }

  // Desktop layout
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
          Leave
        </Button>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary neon-text tracking-wider">
          NEON MARBLE
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>Online - Room {roomInfo.roomCode}</span>
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
          {isMyTurn ? 'Your turn!' : "Opponent's turn..."}
        </div>
      </div>

      {/* Game area - desktop */}
      <div className="flex-1 flex flex-row gap-4 items-center justify-center">
        {/* Canvas */}
        <div className="flex-1 max-w-lg">
          <GameCanvas
            gameState={displayState || gameState}
            onGameStateChange={handleGameStateChange}
            onTurnEnd={handleTurnEnd}
            isHost={isHost}
            myPlayerIndex={myPlayerIndex}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center mb-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {gameState.isPaused ? 'Paused' : isAnyMoving ? 'Moving...' : isMyTurn ? 'Drag to shoot' : 'Wait for opponent'}
            </div>
            <div
              className="font-display text-lg font-bold"
              style={{
                color: myMarble.color,
                textShadow: `0 0 10px ${myMarble.glowColor}`,
              }}
            >
              You: Player {myPlayerIndex + 1}
            </div>
          </div>

          <Joystick
            onShoot={handleShoot}
            disabled={!canShoot}
            playerColor={myMarble.color}
          />

          <p className="text-xs text-muted-foreground text-center max-w-[150px]">
            {isMyTurn ? 'Drag to aim and shoot' : 'Waiting for opponent...'}
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

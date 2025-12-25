import { useState, useCallback, useEffect } from 'react';
import { NeonMarbleGame } from '@/components/NeonMarbleGame';
import { OnlineMarbleGame } from '@/components/OnlineMarbleGame';
import { LobbyScreen } from '@/components/LobbyScreen';
import { useMultiplayer, RoomInfo } from '@/hooks/useMultiplayer';

type GameMode = 'lobby' | 'local' | 'online';

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode>('lobby');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  // Create multiplayer instance at top level so it persists across screens
  const multiplayer = useMultiplayer();

  const handlePlayLocal = useCallback(() => {
    setGameMode('local');
  }, []);

  const handleGameStart = useCallback((info: RoomInfo) => {
    setRoomInfo(info);
    setGameMode('online');
  }, []);

  const handleLeave = useCallback(() => {
    multiplayer.disconnect();
    setRoomInfo(null);
    setGameMode('lobby');
  }, [multiplayer]);

  // Listen for game start event
  useEffect(() => {
    if (multiplayer.gameStarted && multiplayer.roomInfo) {
      setRoomInfo(multiplayer.roomInfo);
      setGameMode('online');
    }
  }, [multiplayer.gameStarted, multiplayer.roomInfo]);

  if (gameMode === 'local') {
    return <NeonMarbleGame />;
  }

  if (gameMode === 'online' && roomInfo) {
    return (
      <OnlineMarbleGame
        roomInfo={roomInfo}
        multiplayer={multiplayer}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <LobbyScreen
      multiplayer={multiplayer}
      onPlayLocal={handlePlayLocal}
      onGameStart={handleGameStart}
    />
  );
};

export default Index;

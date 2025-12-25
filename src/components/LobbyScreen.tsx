import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RoomInfo } from '@/hooks/useMultiplayer';
import { Users, Copy, Check, Loader2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface MultiplayerType {
  isConnected: boolean;
  isInRoom: boolean;
  roomInfo: RoomInfo | null;
  opponentReady: boolean;
  isReady: boolean;
  gameStarted: boolean;
  error: string | null;
  createRoom: (playerName: string) => Promise<RoomInfo>;
  joinRoom: (roomCode: string, playerName: string) => Promise<RoomInfo>;
  setReady: () => void;
  disconnect: () => void;
}

interface LobbyScreenProps {
  multiplayer: MultiplayerType;
  onGameStart: (roomInfo: RoomInfo) => void;
  onPlayLocal: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ multiplayer, onGameStart, onPlayLocal }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'waiting'>('menu');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }

    setIsLoading(true);
    try {
      await multiplayer.createRoom(playerName.trim());
      setMode('waiting');
      toast.success('Đã tạo phòng!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo phòng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Vui lòng nhập tên của bạn');
      return;
    }
    if (!roomCode.trim()) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }

    setIsLoading(true);
    try {
      await multiplayer.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      setMode('waiting');
      toast.success('Đã vào phòng!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể vào phòng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (multiplayer.roomInfo?.roomCode) {
      navigator.clipboard.writeText(multiplayer.roomInfo.roomCode);
      setCopied(true);
      toast.success('Đã copy mã phòng!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReady = () => {
    multiplayer.setReady();
    toast.info('Đã sẵn sàng!');
  };

  // Game starts automatically when both ready (handled by parent via useEffect)
  React.useEffect(() => {
    if (multiplayer.gameStarted && multiplayer.roomInfo) {
      onGameStart(multiplayer.roomInfo);
    }
  }, [multiplayer.gameStarted, multiplayer.roomInfo, onGameStart]);

  // Reset mode when leaving room
  React.useEffect(() => {
    if (!multiplayer.isInRoom && mode === 'waiting') {
      setMode('menu');
    }
  }, [multiplayer.isInRoom, mode]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary neon-text tracking-wider mb-2">
          NEON MARBLE
        </h1>
        <p className="text-muted-foreground">
          Game bắn bi 2 người chơi
        </p>
      </header>

      {/* Connection status */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {multiplayer.isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Đã kết nối server</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-red-500">Đang kết nối...</span>
          </>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6 w-full max-w-md">
        {/* Main Menu */}
        {mode === 'menu' && (
          <div className="space-y-4">
            <Button
              onClick={onPlayLocal}
              className="w-full h-14 text-lg font-display"
              variant="outline"
            >
              <Users className="w-5 h-5 mr-2" />
              Chơi Local (Cùng máy)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>

            <Button
              onClick={() => setMode('create')}
              className="w-full h-14 text-lg font-display bg-primary hover:bg-primary/90"
              disabled={!multiplayer.isConnected}
            >
              Tạo phòng Online
            </Button>

            <Button
              onClick={() => setMode('join')}
              className="w-full h-14 text-lg font-display bg-secondary hover:bg-secondary/90"
              disabled={!multiplayer.isConnected}
            >
              Vào phòng Online
            </Button>
          </div>
        )}

        {/* Create Room */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-center mb-4">Tạo phòng mới</h2>

            <div>
              <label className="text-sm text-muted-foreground">Tên của bạn</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nhập tên..."
                className="mt-1"
                maxLength={20}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('menu')}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleCreateRoom}
                className="flex-1 bg-primary"
                disabled={isLoading || !multiplayer.isConnected}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo phòng'}
              </Button>
            </div>
          </div>
        )}

        {/* Join Room */}
        {mode === 'join' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-center mb-4">Vào phòng</h2>

            <div>
              <label className="text-sm text-muted-foreground">Tên của bạn</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nhập tên..."
                className="mt-1"
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Mã phòng</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="VD: ABC123"
                className="mt-1 font-mono text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode('menu')}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleJoinRoom}
                className="flex-1 bg-secondary"
                disabled={isLoading || !multiplayer.isConnected}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vào phòng'}
              </Button>
            </div>
          </div>
        )}

        {/* Waiting Room */}
        {mode === 'waiting' && multiplayer.roomInfo && (
          <div className="space-y-6 text-center">
            <h2 className="font-display text-xl">Phòng chờ</h2>

            {/* Room Code */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground mb-1">Mã phòng</div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-3xl font-bold text-primary tracking-widest">
                  {multiplayer.roomInfo.roomCode}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Players */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>{multiplayer.roomInfo.isHost ? playerName : multiplayer.roomInfo.hostName}</span>
                  {multiplayer.roomInfo.isHost && <span className="text-xs text-muted-foreground">(Bạn)</span>}
                </div>
                {(multiplayer.roomInfo.isHost ? multiplayer.isReady : multiplayer.opponentReady) && (
                  <span className="text-xs text-green-500">Sẵn sàng</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-secondary/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  {multiplayer.roomInfo.isHost ? (
                    multiplayer.roomInfo.opponentName ? (
                      <span>{multiplayer.roomInfo.opponentName}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Đang chờ...</span>
                    )
                  ) : (
                    <>
                      <span>{playerName}</span>
                      <span className="text-xs text-muted-foreground">(Bạn)</span>
                    </>
                  )}
                </div>
                {(multiplayer.roomInfo.isHost ? multiplayer.opponentReady : multiplayer.isReady) && (
                  <span className="text-xs text-green-500">Sẵn sàng</span>
                )}
              </div>
            </div>

            {/* Ready Button */}
            {!multiplayer.isReady ? (
              <Button
                onClick={handleReady}
                className="w-full h-12 text-lg font-display bg-accent hover:bg-accent/90"
                disabled={multiplayer.roomInfo.isHost && !multiplayer.roomInfo.opponentName}
              >
                Sẵn sàng
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang chờ đối thủ...</span>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => {
                multiplayer.disconnect();
                setMode('menu');
              }}
              className="text-destructive"
            >
              Rời phòng
            </Button>
          </div>
        )}

        {/* Error display */}
        {multiplayer.error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/20 text-destructive text-sm text-center">
            {multiplayer.error}
          </div>
        )}
      </div>
    </div>
  );
};

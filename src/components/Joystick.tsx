import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Vector2D } from '@/types/game';

interface JoystickProps {
  onShoot: (direction: Vector2D, power: number) => void;
  disabled: boolean;
  playerColor: string;
}

export const Joystick: React.FC<JoystickProps> = ({ onShoot, disabled, playerColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState<Vector2D>({ x: 0, y: 0 });

  const maxDistance = 60;

  const getEventPos = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent): Vector2D => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  };

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getEventPos(e);
    setStartPos(pos);
    setIsDragging(true);
    setPosition({ x: 0, y: 0 });
  }, [disabled]);

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const pos = getEventPos(e);
    let dx = pos.x - startPos.x;
    let dy = pos.y - startPos.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDistance) {
      dx = (dx / dist) * maxDistance;
      dy = (dy / dist) * maxDistance;
    }
    
    setPosition({ x: dx, y: dy });
  }, [isDragging, startPos]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    const dist = Math.sqrt(position.x * position.x + position.y * position.y);
    if (dist > 10) {
      const power = dist / maxDistance;
      const direction = { 
        x: position.x / dist, 
        y: position.y / dist 
      };
      onShoot(direction, power);
    }
    
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
  }, [isDragging, position, onShoot]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const power = Math.sqrt(position.x * position.x + position.y * position.y) / maxDistance;

  return (
    <div 
      ref={containerRef}
      className={`relative w-36 h-36 rounded-full border-2 flex items-center justify-center select-none touch-none transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ 
        borderColor: playerColor,
        boxShadow: `0 0 20px ${playerColor}40, inset 0 0 30px ${playerColor}20`,
        background: `radial-gradient(circle, ${playerColor}10 0%, transparent 70%)`,
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {/* Direction guide lines */}
      <div className="absolute inset-4 rounded-full border border-muted-foreground/20" />
      <div className="absolute inset-8 rounded-full border border-muted-foreground/10" />
      
      {/* Power indicator */}
      {isDragging && power > 0.1 && (
        <div 
          className="absolute inset-0 rounded-full transition-all"
          style={{
            background: `conic-gradient(${playerColor} ${power * 360}deg, transparent 0deg)`,
            opacity: 0.3,
          }}
        />
      )}
      
      {/* Joystick knob */}
      <div
        className="absolute w-14 h-14 rounded-full transition-transform"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          background: `radial-gradient(circle at 30% 30%, ${playerColor}, ${playerColor}80)`,
          boxShadow: `0 0 30px ${playerColor}, 0 4px 15px rgba(0,0,0,0.5)`,
        }}
      />
      
      {/* Center dot */}
      <div 
        className="absolute w-3 h-3 rounded-full"
        style={{ backgroundColor: playerColor, opacity: 0.5 }}
      />
    </div>
  );
};

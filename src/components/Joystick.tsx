import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Vector2D } from '@/types/game';
import { JOYSTICK_CONFIG } from '@/config/gameConfig';

interface JoystickProps {
  onShoot: (direction: Vector2D, power: number) => void;
  disabled: boolean;
  playerColor: string;
  compact?: boolean; // Smaller size for mobile overlay
}

const { MAX_DISTANCE, MIN_SHOOT_DISTANCE } = JOYSTICK_CONFIG;

export const Joystick: React.FC<JoystickProps> = ({ onShoot, disabled, playerColor, compact = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Vector2D>({ x: 0, y: 0 });

  // Use refs to store values needed in event handlers to avoid stale closures
  const startPosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const positionRef = useRef<Vector2D>({ x: 0, y: 0 });
  const onShootRef = useRef(onShoot);

  // Keep ref in sync with prop
  useEffect(() => {
    onShootRef.current = onShoot;
  }, [onShoot]);

  // Keep position ref in sync
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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
    startPosRef.current = pos;
    setIsDragging(true);
    setPosition({ x: 0, y: 0 });
  }, [disabled]);

  // Stable event handlers using refs
  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    e.preventDefault();

    const pos = getEventPos(e);
    let dx = pos.x - startPosRef.current.x;
    let dy = pos.y - startPosRef.current.y;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_DISTANCE) {
      dx = (dx / dist) * MAX_DISTANCE;
      dy = (dy / dist) * MAX_DISTANCE;
    }

    setPosition({ x: dx, y: dy });
    positionRef.current = { x: dx, y: dy };
  }, []);

  const handleEnd = useCallback(() => {
    const pos = positionRef.current;
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);

    if (dist > MIN_SHOOT_DISTANCE) {
      const power = dist / MAX_DISTANCE;
      const direction = {
        x: pos.x / dist,
        y: pos.y / dist
      };
      onShootRef.current(direction, power);
    }

    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  }, []);

  // Set up and tear down event listeners
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const power = Math.sqrt(position.x * position.x + position.y * position.y) / MAX_DISTANCE;

  // Size classes based on compact mode
  const containerSize = compact ? 'w-28 h-28' : 'w-36 h-36';
  const knobSize = compact ? 'w-11 h-11' : 'w-14 h-14';
  const centerDotSize = compact ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div
      ref={containerRef}
      className={`relative ${containerSize} rounded-full border-2 flex items-center justify-center select-none touch-none transition-opacity ${
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
        className={`absolute ${knobSize} rounded-full transition-transform`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          background: `radial-gradient(circle at 30% 30%, ${playerColor}, ${playerColor}80)`,
          boxShadow: `0 0 30px ${playerColor}, 0 4px 15px rgba(0,0,0,0.5)`,
        }}
      />

      {/* Center dot */}
      <div
        className={`absolute ${centerDotSize} rounded-full`}
        style={{ backgroundColor: playerColor, opacity: 0.5 }}
      />
    </div>
  );
};

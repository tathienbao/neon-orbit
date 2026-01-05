import { Vector2D } from '@/types/game';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
}

export interface EmitOptions {
  count?: number;
  color?: string;
  spread?: number;
  speed?: number;
  size?: number;
  life?: number;
  gravity?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 500;

  emit(x: number, y: number, options: EmitOptions = {}) {
    const {
      count = 10,
      color = '#00ffff',
      spread = 360,
      speed = 5,
      size = 4,
      life = 60,
    } = options;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = ((Math.random() * spread - spread / 2) * Math.PI) / 180;
      const velocity = speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color,
        size: size * (0.5 + Math.random() * 0.5),
        decay: 0.98,
      });
    }
  }

  // Collision burst effect
  collision(x: number, y: number, color: string, velocity: number) {
    const intensity = Math.min(velocity / 5, 3);
    this.emit(x, y, {
      count: Math.floor(5 + intensity * 5),
      color,
      spread: 360,
      speed: 2 + intensity * 2,
      size: 2 + intensity,
      life: 20 + intensity * 10,
    });
  }

  // Wall hit sparks
  wallHit(x: number, y: number, color: string, velocity: number) {
    const intensity = Math.min(velocity / 8, 2);
    this.emit(x, y, {
      count: Math.floor(3 + intensity * 4),
      color,
      spread: 120,
      speed: 1 + intensity * 2,
      size: 2,
      life: 15 + intensity * 5,
    });
  }

  // Goal explosion - celebratory burst
  goalExplosion(x: number, y: number, color: string) {
    // Main burst
    this.emit(x, y, {
      count: 40,
      color,
      spread: 360,
      speed: 8,
      size: 5,
      life: 60,
    });
    // Sparkles
    this.emit(x, y, {
      count: 20,
      color: '#ffffff',
      spread: 360,
      speed: 4,
      size: 2,
      life: 80,
    });
    // Secondary color burst
    this.emit(x, y, {
      count: 25,
      color: '#ffff00',
      spread: 360,
      speed: 6,
      size: 4,
      life: 50,
    });
  }

  // Marble trail (call each frame when moving)
  trail(x: number, y: number, color: string, velocity: number) {
    if (velocity < 2) return;
    const intensity = Math.min(velocity / 10, 1);
    if (Math.random() > intensity) return;

    this.emit(x, y, {
      count: 1,
      color,
      spread: 0,
      speed: 0.5,
      size: 2 * intensity,
      life: 15,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.decay;
      p.vy *= p.decay;
      p.vy += 0.08; // Slight gravity
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, offsetY: number = 0) {
    ctx.save();

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const screenY = p.y - offsetY;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8 * alpha;

      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear() {
    this.particles = [];
  }
}

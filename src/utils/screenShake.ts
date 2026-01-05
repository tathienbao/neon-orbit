import { Vector2D } from '@/types/game';

export class ScreenShake {
  private intensity: number = 0;
  private decay: number = 0.9;
  private offset: Vector2D = { x: 0, y: 0 };

  shake(intensity: number) {
    this.intensity = Math.max(this.intensity, intensity);
  }

  update(): Vector2D {
    if (this.intensity < 0.5) {
      this.intensity = 0;
      this.offset = { x: 0, y: 0 };
      return this.offset;
    }

    this.offset = {
      x: (Math.random() - 0.5) * this.intensity * 2,
      y: (Math.random() - 0.5) * this.intensity * 2,
    };

    this.intensity *= this.decay;
    return this.offset;
  }

  getOffset(): Vector2D {
    return this.offset;
  }

  isShaking(): boolean {
    return this.intensity > 0.5;
  }
}

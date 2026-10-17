import { COLS, ROWS } from '../core/config';
import { COLORS, type View } from './grid';

interface Star {
  x: number;
  y: number;
  speed: number;
  bright: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

const STAR_COUNT = 70;

/**
 * Purely cosmetic layer: starfield, particles, screen shake, CRT overlay.
 * Positions are in grid cells; speeds in cells per second.
 */
export class Effects {
  stars: Star[] = [];
  particles: Particle[] = [];
  private shakeLeft = 0;
  private shakeMag = 0;

  constructor(
    readonly reducedMotion: boolean,
    private random: () => number = Math.random,
  ) {
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = i % 3;
      this.stars.push({
        x: random() * COLS,
        y: random() * ROWS,
        speed: [1.5, 4, 9][layer]!,
        bright: [0.25, 0.5, 0.9][layer]!,
      });
    }
  }

  burst(col: number, row: number, color: string, count = 14): void {
    const n = this.reducedMotion ? Math.ceil(count / 3) : count;
    for (let i = 0; i < n; i++) {
      const angle = this.random() * Math.PI * 2;
      const speed = 4 + this.random() * 10;
      const max = 300 + this.random() * 400;
      this.particles.push({
        x: col,
        y: row,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.6,
        life: max,
        max,
        color,
      });
    }
  }

  shake(magnitude: number, ms: number): void {
    if (this.reducedMotion) return;
    this.shakeMag = Math.max(this.shakeMag, magnitude);
    this.shakeLeft = Math.max(this.shakeLeft, ms);
  }

  shakeOffset(): { x: number; y: number } {
    if (this.shakeLeft <= 0) return { x: 0, y: 0 };
    return {
      x: (this.random() * 2 - 1) * this.shakeMag,
      y: (this.random() * 2 - 1) * this.shakeMag,
    };
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    const drift = this.reducedMotion ? 0.3 : 1;
    for (const s of this.stars) {
      s.y += s.speed * dt * drift;
      if (s.y >= ROWS) {
        s.y -= ROWS;
        s.x = this.random() * COLS;
      }
    }
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dtMs;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs);
    if (this.shakeLeft === 0) this.shakeMag = 0;
  }

  drawStars(view: View): void {
    const { ctx, layout } = view;
    for (const s of this.stars) {
      ctx.globalAlpha = s.bright;
      ctx.fillStyle = COLORS.white;
      const size = Math.max(1, layout.cellW * 0.12 * (s.speed / 4));
      ctx.fillRect(view.x(s.x), view.y(s.y), size, size);
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(view: View): void {
    const { ctx, layout } = view;
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.max;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      const size = layout.cellW * 0.25;
      ctx.fillRect(view.x(p.x + 0.5), view.y(p.y + 0.5), size, size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /** Scanlines + vignette over everything. */
  drawCrt(view: View): void {
    const { ctx, width, height } = view;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}

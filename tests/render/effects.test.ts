import { ROWS } from '../../src/core/config';
import { Effects } from '../../src/render/effects';

/** Deterministic stand-in for Math.random. */
function seq(): () => number {
  let i = 0;
  return () => (i++ * 0.618034) % 1;
}

describe('Effects', () => {
  it('particles fade out and are removed', () => {
    const fx = new Effects(false, seq());
    fx.burst(10, 10, '#fff', 20);
    expect(fx.particles).toHaveLength(20);
    fx.update(800);
    expect(fx.particles).toHaveLength(0);
  });

  it('shake wears off', () => {
    const fx = new Effects(false, seq());
    fx.shake(10, 300);
    expect(fx.shakeOffset()).not.toEqual({ x: 0, y: 0 });
    fx.update(300);
    expect(fx.shakeOffset()).toEqual({ x: 0, y: 0 });
  });

  it('reduced motion: no shake, fewer particles', () => {
    const fx = new Effects(true, seq());
    fx.shake(10, 300);
    expect(fx.shakeOffset()).toEqual({ x: 0, y: 0 });
    fx.burst(10, 10, '#fff', 30);
    expect(fx.particles).toHaveLength(10);
  });

  it('stars wrap around and stay on the grid', () => {
    const fx = new Effects(false, seq());
    for (let i = 0; i < 100; i++) fx.update(250);
    expect(fx.stars.every((s) => s.y >= 0 && s.y < ROWS)).toBe(true);
  });
});

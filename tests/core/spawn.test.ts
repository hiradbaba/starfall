import { COLS, ENEMY_WIDTH } from '../../src/core/config';
import { placeWave } from '../../src/core/spawn';
import type { Enemy } from '../../src/core/state';

describe('placeWave', () => {
  it('places count enemies above the screen in a 2*count band', () => {
    const wave = placeWave('green', 6, [], 1, 1);
    expect(wave.enemies).toHaveLength(6);
    expect(wave.height).toBe(12);
    for (const e of wave.enemies) {
      expect(e.y).toBeGreaterThanOrEqual(-12);
      expect(e.y).toBeLessThanOrEqual(-1);
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.x).toBeLessThanOrEqual(COLS - ENEMY_WIDTH);
    }
  });

  it('keeps same-kind enemies at least 3 cells apart', () => {
    const { enemies } = placeWave('green', 30, [], 9, 1);
    for (const a of enemies)
      for (const b of enemies)
        if (a !== b) expect(Math.abs(a.x - b.x) >= 3 || Math.abs(a.y - b.y) >= 3).toBe(true);
  });

  it('keeps specials 6 columns / 4 rows away from greens', () => {
    const greens: Enemy[] = [{ id: 1, kind: 'green', x: 20, y: -3 }];
    const { enemies } = placeWave('special', 4, greens, 5, 2);
    for (const s of enemies) expect(Math.abs(s.x - 20) >= 6 || Math.abs(s.y + 3) >= 4).toBe(true);
  });

  it('is deterministic per seed and differs across seeds (2019 bug #11)', () => {
    expect(placeWave('green', 6, [], 1, 1)).toEqual(placeWave('green', 6, [], 1, 1));
    expect(placeWave('green', 6, [], 1, 1).enemies).not.toEqual(
      placeWave('green', 6, [], 2, 1).enemies,
    );
  });

  it('finishes quickly even for huge waves', () => {
    const t = performance.now();
    const wave = placeWave('green', 200, [], 4, 1);
    expect(wave.enemies.length).toBeGreaterThan(0);
    expect(performance.now() - t).toBeLessThan(2000);
  });

  it('assigns fresh ids and returns the next free id', () => {
    const wave = placeWave('green', 3, [], 1, 50);
    expect(wave.enemies.map((e) => e.id)).toEqual([50, 51, 52]);
    expect(wave.nextId).toBe(53);
  });
});

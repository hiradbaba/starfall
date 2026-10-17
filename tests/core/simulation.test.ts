import { COLS, MIN_TICK_MS, ROWS } from '../../src/core/config';
import { nextInt } from '../../src/core/rng';
import { levelFor } from '../../src/core/progression';
import { createGame, type InputFrame } from '../../src/core/state';
import { step } from '../../src/core/step';

/** Plays random inputs for many ticks and checks invariants after every tick. */
describe('simulation invariants', () => {
  it.each([1, 2, 3])('holds for seed %i over 10,000 ticks', (seed) => {
    let g = createGame('Bot', seed);
    let rng = seed * 7919;
    const roll = (n: number) => {
      const r = nextInt(rng, n);
      rng = r.rng;
      return r.value;
    };
    let restarts = 0;

    for (let t = 0; t < 10_000; t++) {
      const frame: InputFrame = {
        dx: (roll(3) - 1) as -1 | 0 | 1,
        dy: (roll(3) - 1) as -1 | 0 | 1,
        fire: roll(2) === 0,
        special: roll(3) === 0,
        rpg: roll(50) === 0,
        pause: false,
      };
      g = step(g, frame).state;

      expect(g.player.x).toBeGreaterThanOrEqual(0);
      expect(g.player.x).toBeLessThanOrEqual(COLS - 5);
      expect(g.player.y).toBeGreaterThanOrEqual(0);
      expect(g.player.y).toBeLessThan(ROWS);
      expect(g.shots.every((b) => b.y >= 0 && b.y < ROWS)).toBe(true);
      expect(g.enemies.every((e) => e.y < ROWS)).toBe(true);
      expect(g.shots.length).toBeLessThanOrEqual(2 * ROWS);
      expect(new Set(g.enemies.map((e) => e.id)).size).toBe(g.enemies.length);
      expect(g.level).toBe(levelFor(g.score));
      expect(g.tickMs).toBeGreaterThanOrEqual(MIN_TICK_MS);

      if (g.over) {
        restarts += 1;
        g = createGame('Bot', seed + restarts);
      }
    }
  });
});

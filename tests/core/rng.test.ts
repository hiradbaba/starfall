import { nextFloat, nextInt } from '../../src/core/rng';

describe('rng', () => {
  it('is deterministic for a given state', () => {
    expect(nextFloat(42)).toEqual(nextFloat(42));
  });

  it('advances its state and stays in [0, 1)', () => {
    let rng = 7;
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const roll = nextFloat(rng);
      expect(roll.value).toBeGreaterThanOrEqual(0);
      expect(roll.value).toBeLessThan(1);
      seen.add(roll.value);
      rng = roll.rng;
    }
    expect(seen.size).toBe(1000);
  });

  it('nextInt covers [0, max) and nothing else', () => {
    let rng = 3;
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const roll = nextInt(rng, 5);
      seen.add(roll.value);
      rng = roll.rng;
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});

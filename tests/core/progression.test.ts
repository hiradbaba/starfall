import { applyLevelUps, levelFor } from '../../src/core/progression';

const start = { level: 0, greenCount: 6, specialCount: 2, tickMs: 100 };

describe('progression', () => {
  it('levels up every 10 kills', () => {
    expect(levelFor(9)).toBe(0);
    expect(levelFor(10)).toBe(1);
    expect(levelFor(35)).toBe(3);
  });

  it('applies each level gained in a jump (2019 bug #8)', () => {
    const { progress, gained } = applyLevelUps(start, 35);
    expect(gained).toEqual([1, 2, 3]);
    expect(progress).toEqual({ level: 3, greenCount: 12, specialCount: 4, tickMs: 90 });
  });

  it('never drops the tick below 40 ms (2019 bug #9)', () => {
    const { progress } = applyLevelUps(start, 10_000);
    expect(progress.level).toBe(1000);
    expect(progress.tickMs).toBe(40);
  });

  it('does nothing when no level is gained', () => {
    expect(applyLevelUps(start, 9)).toEqual({ progress: start, gained: [] });
  });
});

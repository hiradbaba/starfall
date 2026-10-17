import { noteFreq, THEME } from '../../src/audio/theme';

describe('noteFreq', () => {
  it.each([
    ['A4', 440],
    ['A5', 880],
    ['C4', 261.63],
    ['C#5', 554.37],
    ['Bb3', 233.08],
  ])('%s ≈ %f Hz', (note, hz) => {
    expect(noteFreq(note)).toBeCloseTo(hz, 1);
  });

  it('rejects nonsense', () => {
    expect(() => noteFreq('H2')).toThrow();
  });
});

describe('THEME', () => {
  it('uses only valid notes and positive lengths', () => {
    for (const [note, beats] of THEME) {
      if (note) expect(() => noteFreq(note)).not.toThrow();
      expect(beats).toBeGreaterThan(0);
    }
  });
});

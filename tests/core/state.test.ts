import { createGame, normalizePilot } from '../../src/core/state';

describe('createGame', () => {
  it('starts with the 2019 opening numbers', () => {
    const g = createGame('Ace', 123);
    expect(g).toMatchObject({
      pilot: 'Ace',
      score: 0,
      level: 0,
      greenCount: 6,
      specialCount: 2,
      rpgCharges: 3,
      tickMs: 100,
      over: false,
      enemies: [],
      shots: [],
      rpg: null,
    });
  });
});

describe('normalizePilot (2019 bug #14)', () => {
  it('keeps spaces inside names', () => {
    expect(normalizePilot('  Han   Solo ')).toBe('Han Solo');
  });
  it('caps names at 16 characters', () => {
    expect(normalizePilot('A'.repeat(40))).toBe('A'.repeat(16));
  });
  it('rejects blank names', () => {
    expect(normalizePilot('   ')).toBeNull();
  });
});

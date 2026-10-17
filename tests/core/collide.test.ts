import { canKill, crossedY, overlapsX } from '../../src/core/collide';

describe('overlapsX', () => {
  it('uses the same [x, x+width) rule for every pair', () => {
    expect(overlapsX(12, 1, 10, 3)).toBe(true);
    expect(overlapsX(13, 1, 10, 3)).toBe(false);
    expect(overlapsX(9, 1, 10, 3)).toBe(false);
    expect(overlapsX(6, 5, 10, 3)).toBe(true);
    expect(overlapsX(5, 5, 10, 3)).toBe(false);
  });
});

describe('crossedY (2019 bugs #2/#3)', () => {
  it('detects ending on the same row', () => {
    expect(crossedY(10, 9, 8, 9)).toBe(true);
  });
  it('detects two things swapping rows', () => {
    expect(crossedY(10, 9, 9, 10)).toBe(true);
  });
  it('ignores things that stay apart', () => {
    expect(crossedY(20, 19, 5, 6)).toBe(false);
  });
});

describe('canKill', () => {
  it('pairs each shot with its enemy type', () => {
    expect(canKill('normal', 'green')).toBe(true);
    expect(canKill('special', 'special')).toBe(true);
    expect(canKill('normal', 'special')).toBe(false);
    expect(canKill('special', 'green')).toBe(false);
  });
});

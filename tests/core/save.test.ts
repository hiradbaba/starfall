import { deserialise, SAVE_VERSION, serialise } from '../../src/core/save';
import { createGame } from '../../src/core/state';
import { step } from '../../src/core/step';
import { input } from '../helpers';

describe('save', () => {
  it('is version 2 (adds weapon cooldowns)', () => {
    expect(SAVE_VERSION).toBe(2);
  });

  it('round-trips a full mid-game state (2019 bug #13)', () => {
    let g = createGame('Han Solo', 77);
    for (let i = 0; i < 30; i++) g = step(g, input({ fire: i % 2 === 0, dx: 1 })).state;
    expect(deserialise(serialise(g))).toEqual(g);
  });

  it.each([
    ['missing', null],
    ['not JSON', '{nope'],
    ['old version 1', JSON.stringify({ version: 1, state: createGame('A', 1) })],
    ['wrong shape', JSON.stringify({ version: SAVE_VERSION, state: { score: 'lots' } })],
    [
      'finished game',
      JSON.stringify({ version: SAVE_VERSION, state: { ...createGame('A', 1), over: true } }),
    ],
    [
      'overlong name',
      JSON.stringify({ version: SAVE_VERSION, state: createGame('A'.repeat(17), 1) }),
    ],
    [
      'missing cooldowns',
      JSON.stringify({ version: SAVE_VERSION, state: { ...createGame('A', 1), nextShot: null } }),
    ],
  ])('rejects %s data (2019 bug #14)', (_label, raw) => {
    expect(deserialise(raw)).toBeNull();
  });
});

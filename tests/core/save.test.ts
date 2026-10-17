import { deserialise, serialise } from '../../src/core/save';
import { createGame } from '../../src/core/state';
import { step } from '../../src/core/step';
import { input } from '../helpers';

describe('save', () => {
  it('round-trips a full mid-game state (2019 bug #13)', () => {
    let g = createGame('Han Solo', 77);
    for (let i = 0; i < 30; i++) g = step(g, input({ fire: i % 2 === 0, dx: 1 })).state;
    expect(deserialise(serialise(g))).toEqual(g);
  });

  it.each([
    ['missing', null],
    ['not JSON', '{nope'],
    ['wrong version', JSON.stringify({ version: 0, state: createGame('A', 1) })],
    ['wrong shape', JSON.stringify({ version: 1, state: { score: 'lots' } })],
    ['finished game', JSON.stringify({ version: 1, state: { ...createGame('A', 1), over: true } })],
    ['overlong name', JSON.stringify({ version: 1, state: createGame('A'.repeat(17), 1) })],
  ])('rejects %s data (2019 bug #14)', (_label, raw) => {
    expect(deserialise(raw)).toBeNull();
  });
});

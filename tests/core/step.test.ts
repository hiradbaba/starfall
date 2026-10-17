import { ROWS } from '../../src/core/config';
import { createGame, type Enemy } from '../../src/core/state';
import { step } from '../../src/core/step';
import { input, quietGame } from '../helpers';

const green = (id: number, x: number, y: number): Enemy => ({ id, kind: 'green', x, y });
const special = (id: number, x: number, y: number): Enemy => ({ id, kind: 'special', x, y });

describe('step: basics', () => {
  it('does not mutate its input', () => {
    const g = quietGame({ enemies: [green(1, 5, 5)] });
    const copy = structuredClone(g);
    step(g, input({ dx: 1, fire: true }));
    expect(g).toEqual(copy);
  });

  it('moves the player and clamps to the grid', () => {
    const g = quietGame({ player: { x: 0, y: 0 } });
    const { state } = step(g, input({ dx: -1, dy: -1 }));
    expect(state.player).toEqual({ x: 0, y: 0 });
  });

  it('advances the world while a key is held (2019 bug #1)', () => {
    const g = quietGame({ enemies: [green(1, 0, 3)] });
    const { state } = step(g, input({ dx: 1 }));
    expect(state.enemies[0]!.y).toBe(4);
    expect(state.tick).toBe(1);
  });

  it('returns finished games unchanged', () => {
    const g = quietGame({ over: true });
    expect(step(g, input({ fire: true })).state).toBe(g);
  });
});

describe('step: shooting', () => {
  it('fires a normal shot from the ship nose', () => {
    const g = quietGame({ player: { x: 10, y: 20 } });
    const { state, events } = step(g, input({ fire: true }));
    expect(state.shots).toEqual([{ id: 1, kind: 'normal', x: 12, y: 19 }]);
    expect(events).toContainEqual({ type: 'shot', kind: 'normal' });
  });

  it('kills an enemy the shot passes through (2019 bug #3)', () => {
    const g = quietGame({
      enemies: [green(1, 10, 9)],
      shots: [{ id: 2, kind: 'normal', x: 11, y: 10 }],
      nextId: 3,
    });
    const { state, events } = step(g, input());
    expect(state.enemies).toEqual([]);
    expect(state.shots).toEqual([]);
    expect(state.score).toBe(1);
    expect(events).toContainEqual({ type: 'enemyKilled', kind: 'green', x: 10, y: 10 });
  });

  it('special shots pass through green enemies and kill specials', () => {
    const g = quietGame({
      enemies: [green(1, 10, 9), special(2, 20, 9)],
      shots: [
        { id: 3, kind: 'special', x: 11, y: 10 },
        { id: 4, kind: 'special', x: 22, y: 10 },
      ],
      nextId: 5,
    });
    const { state } = step(g, input());
    expect(state.enemies.map((e) => e.id)).toEqual([1]);
    expect(state.shots.map((b) => b.id)).toEqual([3]);
  });

  it('scores every kill in the same tick (2019 bug #6)', () => {
    const g = quietGame({
      enemies: [green(1, 0, 9), green(2, 10, 9), green(3, 20, 9)],
      shots: [
        { id: 4, kind: 'normal', x: 1, y: 10 },
        { id: 5, kind: 'normal', x: 11, y: 10 },
        { id: 6, kind: 'normal', x: 21, y: 10 },
      ],
      nextId: 7,
    });
    expect(step(g, input()).state.score).toBe(3);
  });

  it('removes shots that leave the screen (2019 bug #16)', () => {
    let g = quietGame({ player: { x: 10, y: 5 } });
    for (let i = 0; i < 50; i++) g = step(g, input({ fire: true })).state;
    for (let i = 0; i < 10; i++) g = step(g, input()).state;
    expect(g.shots).toEqual([]);
  });
});

describe('step: RPG (2019 bug #7)', () => {
  it('launches once, uses a charge, and travels before detonating', () => {
    const g = quietGame({ player: { x: 10, y: 8 } });
    const { state, events } = step(g, input({ rpg: true }));
    expect(state.rpgCharges).toBe(2);
    expect(state.rpg).toEqual({ x: 12, y: 7, travelled: 1 });
    expect(events).toContainEqual({ type: 'rpgLaunched' });
  });

  it('kills only on-screen enemies and scores them', () => {
    const g = quietGame({
      enemies: [green(1, 0, 5), special(2, 20, 6), green(3, 30, -5)],
      rpg: { x: 12, y: 15, travelled: 9 },
    });
    const { state, events } = step(g, input());
    expect(state.enemies.map((e) => e.id)).toEqual([3]);
    expect(state.score).toBe(2);
    expect(state.rpg).toBeNull();
    expect(events).toContainEqual({ type: 'rpgDetonated', x: 12, y: 14, kills: 2 });
  });

  it('does nothing without charges', () => {
    const g = quietGame({ rpgCharges: 0 });
    expect(step(g, input({ rpg: true })).state.rpg).toBeNull();
  });

  it('allows one RPG in flight at a time', () => {
    const g = quietGame({ rpg: { x: 5, y: 20, travelled: 1 } });
    expect(step(g, input({ rpg: true })).state.rpgCharges).toBe(3);
  });
});

describe('step: getting hit', () => {
  it('ends the game when an enemy reaches the ship', () => {
    const g = quietGame({ player: { x: 10, y: 10 }, enemies: [green(1, 12, 9)] });
    const { state, events } = step(g, input());
    expect(state.over).toBe(true);
    expect(events).toContainEqual({ type: 'playerHit', x: 10, y: 10 });
  });

  it('catches an enemy and ship swapping rows (2019 bug #2)', () => {
    const g = quietGame({ player: { x: 10, y: 10 }, enemies: [green(1, 10, 9)] });
    expect(step(g, input({ dy: -1 })).state.over).toBe(true);
  });

  it('a killed enemy can never hit the ship (2019 bug #4)', () => {
    let g = quietGame({
      player: { x: 0, y: 12 },
      enemies: [green(1, 0, 9)],
      shots: [{ id: 2, kind: 'normal', x: 1, y: 10 }],
      nextId: 3,
    });
    g = step(g, input()).state;
    expect(g.enemies).toEqual([]);
    for (let i = 0; i < 5; i++) g = step(g, input()).state;
    expect(g.over).toBe(false);
  });

  it('enemies that fall off the bottom are removed', () => {
    const g = quietGame({ player: { x: 30, y: 0 }, enemies: [green(1, 0, ROWS - 1)] });
    expect(step(g, input()).state.enemies).toEqual([]);
  });
});

describe('step: waves and levels', () => {
  it('spawns the first green wave on the first tick and schedules the next (2019 bug #10)', () => {
    const { state } = step(createGame('Ace', 5), input());
    expect(state.enemies.filter((e) => e.kind === 'green')).toHaveLength(6);
    expect(state.nextWave.green).toBe(1 + 12);
  });

  it('spawns the next wave on schedule even if the last one was wiped out', () => {
    let g = step(createGame('Ace', 5), input()).state;
    g = { ...g, enemies: [] };
    while (g.tick < 13) g = step(g, input()).state;
    expect(g.enemies.filter((e) => e.kind === 'green')).toHaveLength(6);
  });

  it('spawns exactly specialCount specials, and only from level 2 (2019 bug #5)', () => {
    const early = step(createGame('Ace', 5), input()).state;
    expect(early.enemies.some((e) => e.kind === 'special')).toBe(false);

    const g = { ...createGame('Ace', 5), level: 2, score: 20, specialCount: 4 };
    const { state } = step(g, input());
    expect(state.enemies.filter((e) => e.kind === 'special')).toHaveLength(4);
  });

  it('levels up from kills and reports it', () => {
    const g = quietGame({
      score: 9,
      enemies: [green(1, 10, 9)],
      shots: [{ id: 2, kind: 'normal', x: 11, y: 10 }],
      nextId: 3,
    });
    const { state, events } = step(g, input());
    expect(state.level).toBe(1);
    expect(state.greenCount).toBe(8);
    expect(events).toContainEqual({ type: 'levelUp', level: 1 });
  });
});

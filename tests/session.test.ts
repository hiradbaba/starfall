import { createGame } from '../src/core/state';
import { finishGame, KEYS, loadSave, loadScores, saveAndQuit } from '../src/session';
import { memoryStore } from '../src/storage';

describe('session', () => {
  it('save & quit stores the run and records its score (2019 bug #15)', () => {
    const store = memoryStore();
    const g = { ...createGame('Ace', 9), score: 12, level: 1 };
    expect(saveAndQuit(store, g)).toBe(0);
    expect(loadSave(store)).toEqual(g);
    expect(loadScores(store)).toEqual([{ runId: 9, name: 'Ace', score: 12, level: 1 }]);
  });

  it('game over clears the save so it cannot be continued (2019 bug #12)', () => {
    const store = memoryStore();
    const g = { ...createGame('Ace', 9), score: 12 };
    saveAndQuit(store, g);
    finishGame(store, { ...g, score: 20, over: true });
    expect(loadSave(store)).toBeNull();
    expect(loadScores(store)).toHaveLength(1);
    expect(loadScores(store)[0]!.score).toBe(20);
  });

  it('losing a different run keeps the saved run (review fix)', () => {
    const store = memoryStore();
    const saved = { ...createGame('Ace', 1), score: 12 };
    saveAndQuit(store, saved);
    finishGame(store, { ...createGame('Ace', 2), score: 3, over: true });
    expect(loadSave(store)).toEqual(saved);
  });

  it('discards a corrupt save', () => {
    const store = memoryStore();
    store.set(KEYS.save, 'corrupt');
    expect(loadSave(store)).toBeNull();
    expect(store.get(KEYS.save)).toBeNull();
  });
});

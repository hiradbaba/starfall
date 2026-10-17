import { recordScore, deserialiseScores, serialiseScores, type HighScore } from './core/highscores';
import { deserialise, serialise } from './core/save';
import type { GameState } from './core/state';
import type { KeyValueStore } from './storage';

export const KEYS = {
  save: 'starfall.save',
  scores: 'starfall.highscores',
  muted: 'starfall.muted',
} as const;

export function loadSave(store: KeyValueStore): GameState | null {
  const state = deserialise(store.get(KEYS.save));
  if (state === null) store.remove(KEYS.save);
  return state;
}

export function loadScores(store: KeyValueStore): HighScore[] {
  return deserialiseScores(store.get(KEYS.scores));
}

function record(store: KeyValueStore, state: GameState): number | null {
  const { list, rank } = recordScore(loadScores(store), {
    runId: state.runId,
    name: state.pilot,
    score: state.score,
    level: state.level,
  });
  store.set(KEYS.scores, serialiseScores(list));
  return rank;
}

/** Save & Quit: persist the full run and count its score so far (2019 bugs #13/#15). */
export function saveAndQuit(store: KeyValueStore, state: GameState): number | null {
  store.set(KEYS.save, serialise(state));
  return record(store, state);
}

/** Game over: the run can no longer be continued (2019 bug #12). */
export function finishGame(store: KeyValueStore, state: GameState): number | null {
  store.remove(KEYS.save);
  return record(store, state);
}

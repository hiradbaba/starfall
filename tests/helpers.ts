import { createGame, NO_INPUT, type GameState, type InputFrame } from '../src/core/state';

/** A game with wave spawning switched off, so tests control every enemy. */
export function quietGame(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createGame('Ace', 1),
    nextWave: { green: 1e9, special: 1e9 },
    ...overrides,
  };
}

export function input(partial: Partial<InputFrame> = {}): InputFrame {
  return { ...NO_INPUT, ...partial };
}

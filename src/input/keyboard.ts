import type { InputFrame } from '../core/state';

type Action = 'fire' | 'special' | 'rpg' | 'pause';

const MOVES: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

const ACTIONS: Record<string, Action> = {
  Space: 'fire',
  KeyC: 'special',
  KeyX: 'rpg',
  Escape: 'pause',
  KeyP: 'pause',
};

/** Actions that keep firing every tick while held. RPG and pause need a fresh press. */
const REPEATING: ReadonlySet<Action> = new Set(['fire', 'special']);

export function isGameKey(code: string): boolean {
  return code in MOVES || code in ACTIONS;
}

/**
 * Turns key (or virtual touch-button) presses into one InputFrame per tick.
 * Presses that start and end between two ticks are latched so they're never lost.
 */
export class KeyState {
  private held = new Set<string>();
  private pressed = new Set<Action>();

  down(code: string): void {
    if (!isGameKey(code)) return;
    const action = ACTIONS[code];
    if (action && !this.held.has(code)) this.pressed.add(action);
    this.held.add(code);
  }

  up(code: string): void {
    this.held.delete(code);
  }

  clear(): void {
    this.held.clear();
    this.pressed.clear();
  }

  poll(): InputFrame {
    let dx = 0;
    let dy = 0;
    const heldActions = new Set<Action>();
    for (const code of this.held) {
      const move = MOVES[code];
      if (move) {
        dx += move[0];
        dy += move[1];
      }
      const action = ACTIONS[code];
      if (action && REPEATING.has(action)) heldActions.add(action);
    }
    const active = (a: Action) => this.pressed.has(a) || heldActions.has(a);
    const frame: InputFrame = {
      dx: Math.sign(dx) as InputFrame['dx'],
      dy: Math.sign(dy) as InputFrame['dy'],
      fire: active('fire'),
      special: active('special'),
      rpg: active('rpg'),
      pause: active('pause'),
    };
    this.pressed.clear();
    return frame;
  }
}

import type { AudioEngine } from '../audio/sfx';
import type { KeyState } from '../input/keyboard';
import type { Effects } from '../render/effects';
import type { View } from '../render/grid';
import type { KeyValueStore } from '../storage';

export interface KeyPress {
  code: string;
  repeat: boolean;
}

export interface Screen {
  /** Shown as `data-screen` on <body>; used by the smoke test. */
  readonly name: string;
  update(dtMs: number): void;
  draw(view: View): void;
  keyDown(key: KeyPress): void;
  keyUp?(code: string): void;
  /** A tap or click on a grid cell. */
  tap?(col: number, row: number): void;
  /** The tab lost focus. */
  blur?(): void;
  leave?(): void;
}

export interface App {
  go(screen: Screen): void;
  store: KeyValueStore;
  audio: AudioEngine;
  keys: KeyState;
  fx: Effects;
  /** Coarse pointer (phone/tablet): show touch button names instead of keys. */
  touch: boolean;
  /** Screen-reader announcement (aria-live). */
  announce(text: string): void;
  /** Text mirror of the HUD (score, level, RPG) for assistive tech and tests. */
  hud(text: string): void;
}

export const isConfirm = (code: string) =>
  code === 'Enter' || code === 'Space' || code === 'NumpadEnter';
export const isUp = (code: string) => code === 'ArrowUp' || code === 'KeyW';
export const isDown = (code: string) => code === 'ArrowDown' || code === 'KeyS';

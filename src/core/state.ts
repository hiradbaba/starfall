import {
  COLS,
  PILOT_MAX,
  PLAYER_WIDTH,
  ROWS,
  START_GREEN,
  START_RPG,
  START_SPECIAL,
  START_TICK_MS,
} from './config';

export type EnemyKind = 'green' | 'special';
export type ShotKind = 'normal' | 'special';

export interface Point {
  x: number;
  y: number;
}

export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
}

export interface Shot extends Point {
  id: number;
  kind: ShotKind;
}

export interface Rpg extends Point {
  travelled: number;
}

export interface GameState {
  runId: number;
  pilot: string;
  player: Point;
  enemies: Enemy[];
  shots: Shot[];
  rpg: Rpg | null;
  rpgCharges: number;
  score: number;
  level: number;
  greenCount: number;
  specialCount: number;
  tickMs: number;
  tick: number;
  nextId: number;
  rng: number;
  /** Tick at which the next wave of each kind spawns. */
  nextWave: Record<EnemyKind, number>;
  /** Tick at which each weapon can fire again. */
  nextShot: Record<ShotKind, number>;
  over: boolean;
}

export interface InputFrame {
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  fire: boolean;
  special: boolean;
  rpg: boolean;
  pause: boolean;
}

export const NO_INPUT: InputFrame = {
  dx: 0,
  dy: 0,
  fire: false,
  special: false,
  rpg: false,
  pause: false,
};

/** Trims and bounds a pilot name; returns null when nothing usable is left. */
export function normalizePilot(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ').slice(0, PILOT_MAX).trim();
  return name.length > 0 ? name : null;
}

export function createGame(pilot: string, seed: number): GameState {
  return {
    runId: seed >>> 0,
    pilot,
    player: { x: Math.floor((COLS - PLAYER_WIDTH) / 2), y: ROWS - 6 },
    enemies: [],
    shots: [],
    rpg: null,
    rpgCharges: START_RPG,
    score: 0,
    level: 0,
    greenCount: START_GREEN,
    specialCount: START_SPECIAL,
    tickMs: START_TICK_MS,
    tick: 0,
    nextId: 1,
    rng: seed >>> 0,
    nextWave: { green: 0, special: 0 },
    nextShot: { normal: 0, special: 0 },
    over: false,
  };
}

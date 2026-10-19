import { COLS, PILOT_MAX, ROWS } from './config';
import type { Enemy, GameState, Point, Rpg, Shot } from './state';

/** 2: adds `nextShot` weapon cooldowns. */
export const SAVE_VERSION = 2;

export function serialise(state: GameState): string {
  return JSON.stringify({ version: SAVE_VERSION, state });
}

/** Returns null for anything that isn't a valid, unfinished, current-version save. */
export function deserialise(raw: string | null): GameState | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return null;
  return isGameState(parsed.state) ? parsed.state : null;
}

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
const isNat = (v: unknown): v is number => isInt(v) && v >= 0;

function isPoint(v: unknown): v is Point {
  return isRecord(v) && isInt(v.x) && isInt(v.y);
}
function isEnemy(v: unknown): v is Enemy {
  return isRecord(v) && isPoint(v) && isNat(v.id) && (v.kind === 'green' || v.kind === 'special');
}
function isShot(v: unknown): v is Shot {
  return isRecord(v) && isPoint(v) && isNat(v.id) && (v.kind === 'normal' || v.kind === 'special');
}
function isRpg(v: unknown): v is Rpg {
  return isRecord(v) && isPoint(v) && isNat(v.travelled);
}

function isGameState(v: unknown): v is GameState {
  if (!isRecord(v)) return false;
  const { player, pilot, nextWave, nextShot } = v;
  return (
    isNat(v.runId) &&
    typeof pilot === 'string' &&
    pilot.length >= 1 &&
    pilot.length <= PILOT_MAX &&
    isPoint(player) &&
    player.x >= 0 &&
    player.x < COLS &&
    player.y >= 0 &&
    player.y < ROWS &&
    Array.isArray(v.enemies) &&
    v.enemies.every(isEnemy) &&
    Array.isArray(v.shots) &&
    v.shots.every(isShot) &&
    (v.rpg === null || isRpg(v.rpg)) &&
    isNat(v.rpgCharges) &&
    isNat(v.score) &&
    isNat(v.level) &&
    isNat(v.greenCount) &&
    isNat(v.specialCount) &&
    isNat(v.tickMs) &&
    v.tickMs > 0 &&
    isNat(v.tick) &&
    isNat(v.nextId) &&
    isNat(v.rng) &&
    isRecord(nextWave) &&
    isNat(nextWave.green) &&
    isNat(nextWave.special) &&
    isRecord(nextShot) &&
    isNat(nextShot.normal) &&
    isNat(nextShot.special) &&
    v.over === false
  );
}

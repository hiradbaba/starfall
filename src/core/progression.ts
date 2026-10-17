import { KILLS_PER_LEVEL, MIN_TICK_MS, TICK_STEP_MS } from './config';

export interface Progress {
  level: number;
  greenCount: number;
  specialCount: number;
  tickMs: number;
}

export function levelFor(score: number): number {
  return Math.floor(score / KILLS_PER_LEVEL);
}

/**
 * Applies every level gained since `progress.level`, one at a time, so a
 * multi-level jump gets the full difficulty increase (2019 bug #8).
 */
export function applyLevelUps(
  progress: Progress,
  score: number,
): { progress: Progress; gained: number[] } {
  const p = { ...progress };
  const gained: number[] = [];
  const target = levelFor(score);
  while (p.level < target) {
    p.level += 1;
    p.greenCount += 2;
    if (p.level % 2 === 0) p.specialCount += 2;
    if (p.level % 3 === 0) p.tickMs = Math.max(MIN_TICK_MS, p.tickMs - TICK_STEP_MS);
    gained.push(p.level);
  }
  return { progress: p, gained };
}

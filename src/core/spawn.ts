import { COLS, ENEMY_WIDTH } from './config';
import { nextInt } from './rng';
import type { Enemy, EnemyKind } from './state';

const SAME_KIND_GAP = { x: 3, y: 3 };
const OTHER_KIND_GAP = { x: 6, y: 4 };

export interface Wave {
  enemies: Enemy[];
  rng: number;
  nextId: number;
  /** Rows the wave occupies above the screen; the next wave is due after this many ticks. */
  height: number;
}

function tooClose(a: { x: number; y: number }, b: Enemy, kind: EnemyKind): boolean {
  const gap = b.kind === kind ? SAME_KIND_GAP : OTHER_KIND_GAP;
  return Math.abs(a.x - b.x) < gap.x && Math.abs(a.y - b.y) < gap.y;
}

/**
 * Places `count` enemies in a band of 2*count rows directly above the screen.
 * Samples only from cells that are still free, so it never retries or spins
 * (2019 bug #11). Places fewer if the band fills up.
 */
export function placeWave(
  kind: EnemyKind,
  count: number,
  existing: readonly Enemy[],
  rng: number,
  nextId: number,
): Wave {
  const height = count * 2;
  let free: { x: number; y: number }[] = [];
  for (let y = -height; y <= -1; y++) {
    for (let x = 0; x <= COLS - ENEMY_WIDTH; x++) {
      const cell = { x, y };
      if (!existing.some((e) => tooClose(cell, e, kind))) free.push(cell);
    }
  }

  const enemies: Enemy[] = [];
  for (let i = 0; i < count && free.length > 0; i++) {
    const roll = nextInt(rng, free.length);
    rng = roll.rng;
    const cell = free[roll.value]!;
    const enemy: Enemy = { id: nextId++, kind, x: cell.x, y: cell.y };
    enemies.push(enemy);
    free = free.filter((c) => !tooClose(c, enemy, kind));
  }
  return { enemies, rng, nextId, height };
}

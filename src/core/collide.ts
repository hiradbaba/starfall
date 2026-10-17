import type { EnemyKind, ShotKind } from './state';

/** Do horizontal spans [ax, ax+aw) and [bx, bx+bw) share a cell? */
export function overlapsX(ax: number, aw: number, bx: number, bw: number): boolean {
  return ax < bx + bw && bx < ax + aw;
}

/**
 * Swept vertical test for two things that each moved this tick: true when
 * they end on the same row or swapped order (passed through each other).
 */
export function crossedY(prevA: number, nextA: number, prevB: number, nextB: number): boolean {
  return nextA === nextB || Math.sign(prevA - prevB) !== Math.sign(nextA - nextB);
}

export function canKill(shot: ShotKind, enemy: EnemyKind): boolean {
  return (shot === 'normal' && enemy === 'green') || (shot === 'special' && enemy === 'special');
}

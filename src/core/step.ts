import {
  COLS,
  ENEMY_WIDTH,
  PLAYER_WIDTH,
  ROWS,
  RPG_RANGE,
  SHOT_OFFSET,
  SPECIAL_FROM_LEVEL,
} from './config';
import { canKill, crossedY, overlapsX } from './collide';
import { applyLevelUps } from './progression';
import { placeWave } from './spawn';
import type { EnemyKind, GameState, InputFrame, ShotKind } from './state';

export type GameEvent =
  | { type: 'shot'; kind: ShotKind }
  | { type: 'rpgLaunched' }
  | { type: 'rpgDetonated'; x: number; y: number; kills: number }
  | { type: 'enemyKilled'; kind: EnemyKind; x: number; y: number }
  | { type: 'levelUp'; level: number }
  | { type: 'playerHit'; x: number; y: number };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Advances the game by one tick. Pure: never mutates `prev`. */
export function step(prev: GameState, input: InputFrame): StepResult {
  if (prev.over) return { state: prev, events: [] };
  const s = structuredClone(prev);
  const events: GameEvent[] = [];
  s.tick += 1;

  // 1. Player moves (the world always advances too — 2019 bug #1).
  const prevPlayerY = s.player.y;
  s.player.x = clamp(s.player.x + input.dx, 0, COLS - PLAYER_WIDTH);
  s.player.y = clamp(s.player.y + input.dy, 0, ROWS - 1);

  // 2. Weapons spawn at the ship's nose.
  const fire = (kind: ShotKind) => {
    s.shots.push({ id: s.nextId++, kind, x: s.player.x + SHOT_OFFSET, y: s.player.y });
    events.push({ type: 'shot', kind });
  };
  if (input.fire) fire('normal');
  if (input.special) fire('special');
  if (input.rpg && s.rpg === null && s.rpgCharges > 0) {
    s.rpg = { x: s.player.x + SHOT_OFFSET, y: s.player.y, travelled: 0 };
    s.rpgCharges -= 1;
    events.push({ type: 'rpgLaunched' });
  }

  // 3. Everything moves one row.
  const prevShotY = new Map(s.shots.map((b) => [b.id, b.y]));
  const prevEnemyY = new Map(s.enemies.map((e) => [e.id, e.y]));
  for (const b of s.shots) b.y -= 1;
  for (const e of s.enemies) e.y += 1;
  if (s.rpg) {
    s.rpg.y -= 1;
    s.rpg.travelled += 1;
  }

  // 4. Shots vs enemies (swept, one hitbox rule — bugs #2/#3).
  const killed = new Set<number>();
  const spent = new Set<number>();
  for (const b of s.shots) {
    for (const e of s.enemies) {
      if (killed.has(e.id) || !canKill(b.kind, e.kind)) continue;
      if (!overlapsX(b.x, 1, e.x, ENEMY_WIDTH)) continue;
      if (!crossedY(prevShotY.get(b.id)!, b.y, prevEnemyY.get(e.id)!, e.y)) continue;
      killed.add(e.id);
      spent.add(b.id);
      events.push({ type: 'enemyKilled', kind: e.kind, x: e.x, y: e.y });
      break;
    }
  }

  // 5. RPG detonates after RPG_RANGE rows of travel, hitting on-screen enemies only (bug #7).
  if (s.rpg && (s.rpg.travelled >= RPG_RANGE || s.rpg.y <= 0)) {
    let kills = 0;
    for (const e of s.enemies) {
      if (killed.has(e.id) || e.y < 0 || e.y >= ROWS) continue;
      killed.add(e.id);
      kills += 1;
      events.push({ type: 'enemyKilled', kind: e.kind, x: e.x, y: e.y });
    }
    events.push({ type: 'rpgDetonated', x: s.rpg.x, y: s.rpg.y, kills });
    s.rpg = null;
  }

  // 6. Dead things are removed, not flagged (bugs #4/#16).
  s.enemies = s.enemies.filter((e) => !killed.has(e.id) && e.y < ROWS);
  s.shots = s.shots.filter((b) => !spent.has(b.id) && b.y >= 0);

  // 7. Enemy vs player (swept).
  for (const e of s.enemies) {
    if (!overlapsX(s.player.x, PLAYER_WIDTH, e.x, ENEMY_WIDTH)) continue;
    if (!crossedY(prevPlayerY, s.player.y, prevEnemyY.get(e.id)!, e.y)) continue;
    s.over = true;
    events.push({ type: 'playerHit', x: s.player.x, y: s.player.y });
    break;
  }

  // 8. Every kill scores; every level gained applies (bugs #6/#8).
  s.score += killed.size;
  const { progress, gained } = applyLevelUps(
    { level: s.level, greenCount: s.greenCount, specialCount: s.specialCount, tickMs: s.tickMs },
    s.score,
  );
  Object.assign(s, progress);
  for (const level of gained) events.push({ type: 'levelUp', level });

  // 9. Next wave is due as soon as the previous band has fully entered (bug #10).
  if (!s.over) {
    spawnIfDue(s, 'green', s.greenCount);
    if (s.level >= SPECIAL_FROM_LEVEL) spawnIfDue(s, 'special', s.specialCount);
  }

  return { state: s, events };
}

function spawnIfDue(s: GameState, kind: EnemyKind, count: number): void {
  if (s.tick < s.nextWave[kind]) return;
  const wave = placeWave(kind, count, s.enemies, s.rng, s.nextId);
  s.enemies.push(...wave.enemies);
  s.rng = wave.rng;
  s.nextId = wave.nextId;
  s.nextWave[kind] = s.tick + wave.height;
}

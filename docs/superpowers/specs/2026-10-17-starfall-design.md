# STARFALL — Design Spec

**Date:** 2026-10-17
**Status:** Draft, awaiting review
**Origin:** Rebuild of `hiradbaba/Star-Wars` (2019, Windows console C++, single file `PRO.cpp`)

## 1. Goal

Rebuild the 2019 console shooter as a browser-playable portfolio piece that:

- Plays like the original (same weapons, enemy types, level curve, pilot name, save/continue, high score).
- Looks modern while keeping the console/ASCII soul ("neo-retro terminal").
- Has clean, readable, tested code a reviewer can browse on GitHub.
- Tells a clear "2019 → 2026" story in the README, including the original's bugs and how they were fixed.

**Success criteria**

- Playable at a public URL in one click, on desktop (keyboard) and mobile (touch).
- All mechanics in §3 work; all 16 bugs in §5 have regression tests that pass.
- CI green (typecheck, lint, tests, build); deploys automatically to GitHub Pages.

**Non-goals:** online leaderboard, backend, accounts, multiplayer, embedding into the `hiradx` site (separate later task).

## 2. Naming and IP

- Working title **STARFALL** (placeholder; rename is a string change in one constant + README).
- No Lucasfilm IP: no "Star Wars" title, no Vader/Luke/Jedi text, no Star Wars theme melody.
- Game-over story text is original, keeping the tone of the 2019 ending ("Captain <name>… you did well out there, but the galaxy fell…").
- README credits the project as the rebuild of the author's 2019 C++ "Star Wars" class project and shows the original code/screenshot.

## 3. Gameplay (faithful to 2019)

### Grid

- Playfield is a character grid: **44 columns × 32 rows**, plus a 2-row HUD below (score, level, RPG charges, pilot).
- All game logic is in integer grid cells. Rendering scales the grid to fit the window.

### Entities

| Entity | Glyph (approx.) | Width | Colour | Notes |
|---|---|---|---|---|
| Player ship | `[═Ω═]` | 5 | cyan | moves 1 cell per tick per axis; clamped to grid |
| Green enemy | `├☼┤` | 3 | green | falls 1 row per tick; killed by normal shot or RPG |
| Special enemy | `╠╧╣` | 3 | magenta | appears from level 2; killed by special shot or RPG |
| Normal shot | `\|` | 1 | white | Space; rises 1 row per tick; spawns at player x+2 |
| Special shot | `║` | 1 | red | C; rises 1 row per tick; spawns at player x+2 |
| RPG | `■` | 1 | yellow | X; 3 charges per game, no recharge; one in flight at a time |

### Rules

- **Movement:** arrow keys or WASD. Input is read every tick; the world advances every tick regardless of input.
- **Shots:** normal shot kills green enemies only; special shot kills special enemies only. A shot that hits the wrong type passes through it.
- **RPG:** rises from the player; detonates after travelling **10 rows** or on reaching row 0. Detonation kills every enemy currently **on screen** (both types). Score += number of enemies killed. Does nothing if 0 charges.
- **Enemy hits player:** game over.
- **Enemies leaving the bottom** of the grid are removed (no penalty, as in 2019).
- **Hitboxes:** an entity occupies `[x, x+width-1]` on its row. Collisions are checked along each entity's path for the tick (swept), so nothing tunnels through anything else.

### Spawning

- Green waves of `greenCount` enemies; special waves of `specialCount` enemies (only when level ≥ 2).
- A wave is placed in a band above the screen of height `2 × count` rows (as in 2019), with no two enemies closer than 3 cells in both axes, and special enemies at least 6 columns / 4 rows from green ones.
- Placement samples from the set of free cells (no retry loop), using the game's seeded RNG.
- The next wave of a type is queued as soon as the current wave's last enemy **enters** the playfield, so there is no empty gap between waves.

### Progression (2019 curve, with fixes)

- Start: `greenCount = 6`, `specialCount = 2`, `level = 0`, `score = 0`, `rpg = 3`, tick delay `100 ms`.
- `score += 1` per enemy killed (every kill counts, including several in one tick).
- `level = floor(score / 10)`.
- For **each** level gained (applied one at a time, so multi-level jumps apply fully):
  - `greenCount += 2`
  - if `level % 2 == 0`: `specialCount += 2`
  - if `level % 3 == 0`: tick delay `-= 10 ms`, floor **40 ms**
- Rendering runs at display refresh rate (~60 fps) and interpolates between ticks; game speed is governed only by tick delay.

## 4. Screens, storage, platform

### Screens

1. **Menu:** New Game / Continue / High Scores. Continue is disabled when there's no valid save. Arrow keys + Enter, or tap.
2. **Name entry:** pilot name, 1–16 characters, any characters (spaces allowed), trimmed.
3. **Play:** playfield + HUD.
4. **Pause:** Esc or P. Options: Resume / Save & Quit / Quit without saving. Tab blur auto-pauses.
5. **Game over:** original story text with pilot name, theme plays, shows score/level, "new high score" if applicable. Any key → menu.
6. **High scores:** top 5 (name, score, level). Any key → menu.

### Storage (`localStorage`)

- Keys: `starfall.save`, `starfall.highscores`, `starfall.muted`. Each value is JSON with a `version` field.
- Save holds the **complete** game state (player, enemies, bullets, RPG, score, level, counts, tick delay, RNG state, pilot name).
- Save is written on Save & Quit; **cleared on game over**.
- High scores are updated on game over **and** on Save & Quit.
- On read: invalid JSON, wrong version, or failed shape validation → discard and use defaults. If `localStorage` throws/unavailable → game runs without persistence.

### Audio

- Web Audio synthesised sounds only (no audio files): menu move/select, normal shot, special shot, RPG launch, RPG detonation, enemy explosion, game over.
- An **original** short chiptune melody for menu and game over.
- Audio context starts on first user gesture. M toggles mute; persisted.

### Input

- Keyboard: arrows/WASD move, Space fire, C special, X RPG, Esc/P pause, M mute.
- Touch (shown on coarse-pointer devices): virtual d-pad on the left, three weapon buttons on the right, pause button top-right.
- All input is turned into one `InputFrame { dx, dy, fire, special, rpg, pause }` per tick. Held direction keys move the ship every tick.

### Visual effects (render layer only)

- Monospace glyph rendering on canvas with per-entity colour and glow.
- CRT overlay: scanlines, slight vignette, subtle bloom.
- Scrolling parallax starfield behind the grid.
- Particle bursts on kills, larger burst + screen shake on RPG detonation and on game over.
- Respects `prefers-reduced-motion`: disables shake and reduces particles.

## 5. Bugs in the 2019 logic, fixed

Each item has a regression test in `core/`.

1. Holding a key froze the world (`continue` skipped the update). → World advances every tick.
2. Enemy and player could swap rows without colliding (same-row check only). → Swept collision.
3. Bullets could tunnel through enemies; normal and special shots had different hitboxes. → Swept collision, single hitbox rule.
4. Dead enemies (`x = NULL`) kept falling and could kill a player near the left edge. → Dead entities removed.
5. Special-enemy loops iterated `en.n` instead of `spen.n`, reading stale "ghost" enemies. → Separate collections.
6. Several kills in one tick scored 1 (`killed` was a flag). → Count kills.
7. RPG scored every enemy in the wave incl. off-screen and pre-level-2 specials; detonated at absolute row 10. → Score on-screen kills; detonate after 10 rows of travel.
8. Multi-level jumps applied difficulty only once. → Apply per level.
9. Tick delay went negative around level 15 → `Sleep()` hang. → Smaller step, 40 ms floor.
10. Waves only respawned after the whole wave left the screen; gaps after RPG. → Queue next wave when last enemy enters.
11. `srand(time)` reseeded per wave (identical waves within a second); overlap retry loop could spin. → One seeded RNG; sample free cells.
12. Save file survived game over, so Continue resumed a lost game. → Clear save on game over.
13. Continue didn't restore level-derived state or speed. → Save full state.
14. Missing files crashed (`fopen` NULL); names > 19 chars overflowed; names with spaces broke the save format. → Validated JSON storage, bounded names.
15. High score only checked on death. → Also on Save & Quit.
16. Bullet arrays never shrank; overflow after 10,000 shots. → Off-screen bullets removed.

## 6. Architecture

TypeScript, HTML Canvas 2D, Vite. No game engine, no UI framework.

```
src/
  core/              # pure logic, no DOM; all unit-tested
    state.ts         # GameState type + createGame(seed, pilot)
    step.ts          # step(state, input) → { state, events[] }  (one tick, pure)
    spawn.ts         # wave placement
    collide.ts       # swept collision + hit rules
    progression.ts   # score → level, per-level difficulty
    rng.ts           # seeded PRNG (state is serialisable)
    save.ts          # serialise / validate / deserialise GameState
  render/
    grid.ts          # grid → canvas glyphs, scaling
    effects.ts       # CRT overlay, starfield, particles, shake
  audio/
    sfx.ts           # synthesised sound effects
    theme.ts         # original melody
  input/
    keyboard.ts
    touch.ts         # both produce InputFrame
  screens/           # menu, name, play, pause, gameover, highscores
  storage.ts         # localStorage wrapper (safe get/set, versioned)
  main.ts            # fixed-timestep loop + screen state machine
```

**Data flow per frame:** accumulate elapsed time → while ≥ tick delay: read `InputFrame`, `step()` → collect events → render state (interpolated) → effects/audio react to events.

**Events** emitted by `step()`: `shot`, `specialShot`, `rpgLaunched`, `rpgDetonated{kills}`, `enemyKilled{kind,x,y}`, `levelUp{level}`, `playerHit`.

**Boundaries:** `core/` imports nothing from `render/`, `audio/`, `input/`, `screens/` or the DOM. Enforced by an ESLint `no-restricted-imports` rule.

## 7. Testing

- **Unit (Vitest):** `core/` modules, including one regression test per bug in §5.
- **Property/simulation:** 10,000 ticks with fixed seed and random inputs; check invariants every tick: no dead entities in lists, all entities within bounds (or in the spawn band above), bullet count bounded, `level == floor(score/10)`, tick delay ≥ 40 ms.
- **Save round-trip:** `deserialise(serialise(s))` equals `s`; corrupt/old-version input returns `null`.
- **Smoke (Playwright, one spec):** load page → New Game → enter name → play a few seconds with fire held → HUD visible, score element present, no console errors.

## 8. Tooling and delivery

- Node LTS, npm, Vite, TypeScript strict, ESLint, Prettier, Vitest, Playwright.
- GitHub Actions: on push/PR run typecheck, lint, unit tests, build, smoke test. On push to `main`, deploy `dist/` to GitHub Pages.
- Repo: new public repo `starfall` under `hiradbaba`. Creating it and enabling Pages happens only after explicit approval from the owner.
- README: gameplay GIF, play link, controls, "2019 → 2026" section (original code excerpt + screenshot, bug list from §5), local dev instructions.
- The original `Star-Wars` repo is not modified.

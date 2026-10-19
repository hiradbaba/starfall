import { COLS, ROWS } from '../core/config';
import type { GameState, Point } from '../core/state';
import { step, type GameEvent } from '../core/step';
import { isGameKey } from '../input/keyboard';
import { COLORS, type View } from '../render/grid';
import { finishGame, saveAndQuit } from '../session';
import type { App, KeyPress, Screen } from './app';
import { controlRows, drawControls } from './controls';
import { gameOverScreen } from './gameover';
import { menuScreen } from './menu';
import { MenuList } from './menuList';

export const GLYPHS = {
  player: '[═Ω═]',
  green: '├☼┤',
  special: '╠╧╣',
  normal: '|',
  specialShot: '║',
  rpg: '■',
} as const;

/** How long the explosion plays before the game-over screen. */
const DEATH_MS = 1000;
const BANNER_MS = 1500;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Tracked = Point & { id: number };

/** Position between last tick and this one, so motion is smooth at any frame rate. */
function between(before: ReadonlyMap<number, Point>, item: Tracked, t: number): Point {
  const p = before.get(item.id) ?? item;
  return { x: lerp(p.x, item.x, t), y: lerp(p.y, item.y, t) };
}

export function playScreen(app: App, initial: GameState): Screen {
  let state = initial;
  let prev = initial;
  let acc = 0;
  let paused = false;
  /** Every run starts on the controls card and waits for the player. */
  let briefing = true;
  /** The pause menu's CONTROLS card is open. */
  let showControls = false;
  let deathLeft = DEATH_MS;
  let rank: number | null = null;
  let banner = { text: '', left: 0 };
  app.keys.clear();

  const launch = () => {
    briefing = false;
    acc = 0;
    app.keys.clear();
    app.announce(`Launch! Pilot ${state.pilot}.`);
  };
  const resume = () => {
    paused = false;
    app.keys.clear();
  };
  const pause = () => {
    if (paused || state.over || briefing) return;
    paused = true;
    app.keys.clear();
    pauseMenu.index = 0;
    app.announce('Paused');
  };
  const pauseMenu = new MenuList(
    app,
    [
      {
        label: 'RESUME',
        enabled: true,
        run: resume,
      },
      {
        label: 'CONTROLS',
        enabled: true,
        run: () => {
          showControls = true;
          app.announce(
            controlRows(app.touch)
              .map((r) => `${r.key}: ${r.action}`)
              .join('. '),
          );
        },
      },
      {
        label: 'SAVE & QUIT',
        enabled: true,
        run: () => {
          saveAndQuit(app.store, state);
          app.go(menuScreen(app));
        },
      },
      { label: 'QUIT WITHOUT SAVING', enabled: true, run: () => app.go(menuScreen(app)) },
    ],
    14,
  );

  const react = (events: GameEvent[]) => {
    for (const e of events) {
      switch (e.type) {
        case 'shot':
          app.audio.play(e.kind === 'normal' ? 'shot' : 'special');
          break;
        case 'enemyKilled':
          app.fx.burst(e.x + 1, e.y, e.kind === 'green' ? COLORS.green : COLORS.magenta);
          app.audio.play('explode');
          break;
        case 'rpgLaunched':
          app.audio.play('rpgLaunch');
          break;
        case 'rpgDetonated':
          app.fx.burst(e.x, e.y, COLORS.yellow, 60);
          app.fx.shake(8, 450);
          app.audio.play('rpgBoom');
          break;
        case 'levelUp':
          banner = { text: `LEVEL ${e.level}`, left: BANNER_MS };
          app.audio.play('levelUp');
          app.announce(`Level ${e.level}`);
          break;
        case 'playerHit':
          app.fx.burst(e.x + 2, e.y, COLORS.cyan, 50);
          app.fx.shake(12, 800);
          app.audio.play('hit');
          rank = finishGame(app.store, state);
          break;
      }
    }
  };

  const updateHud = () =>
    app.hud(
      `Score ${state.score} · Level ${state.level} · RPG ${state.rpgCharges} · Pilot ${state.pilot}`,
    );
  updateHud();
  app.announce('Briefing. Press any key to launch.');

  return {
    name: 'play',

    update(dt) {
      banner.left = Math.max(0, banner.left - dt);
      if (briefing) {
        // Touch buttons press virtual keys, so any input on the pad launches too.
        const f = app.keys.poll();
        if (f.dx || f.dy || f.fire || f.special || f.rpg || f.pause) launch();
        return;
      }
      if (paused) return;
      if (state.over) {
        deathLeft -= dt;
        if (deathLeft <= 0) app.go(gameOverScreen(app, state, rank));
        return;
      }
      acc += dt;
      while (acc >= state.tickMs && !state.over) {
        acc -= state.tickMs;
        const frame = app.keys.poll();
        if (frame.pause) {
          pause();
          return;
        }
        prev = state;
        const result = step(state, frame);
        state = result.state;
        react(result.events);
        updateHud();
      }
    },

    draw(view: View) {
      const t = state.over ? 1 : Math.min(1, acc / state.tickMs);
      view.frame(COLORS.cyan);
      const { ctx } = view;
      ctx.save();
      ctx.beginPath();
      ctx.rect(view.x(0), view.y(0), view.layout.cellW * COLS, view.layout.cellH * ROWS);
      ctx.clip();

      const prevEnemies = new Map(prev.enemies.map((e) => [e.id, e]));
      for (const e of state.enemies) {
        const p = between(prevEnemies, e, t);
        view.text(
          p.x,
          p.y,
          e.kind === 'green' ? GLYPHS.green : GLYPHS.special,
          e.kind === 'green' ? COLORS.green : COLORS.magenta,
        );
      }
      const prevShots = new Map(prev.shots.map((b) => [b.id, b]));
      for (const b of state.shots) {
        const p = between(prevShots, b, t);
        view.text(
          p.x,
          p.y,
          b.kind === 'normal' ? GLYPHS.normal : GLYPHS.specialShot,
          b.kind === 'normal' ? COLORS.white : COLORS.red,
        );
      }
      if (state.rpg) {
        const from = prev.rpg ?? { ...state.rpg, y: state.rpg.y + 1 };
        view.text(state.rpg.x, lerp(from.y, state.rpg.y, t), GLYPHS.rpg, COLORS.yellow, 16);
      }
      if (!state.over) {
        view.text(
          lerp(prev.player.x, state.player.x, t),
          lerp(prev.player.y, state.player.y, t),
          GLYPHS.player,
          COLORS.cyan,
          14,
        );
      }
      ctx.restore();

      const rpgs = GLYPHS.rpg.repeat(state.rpgCharges).padEnd(3, '·');
      view.text(0, ROWS, `SCORE ${state.score}`, COLORS.yellow, 6);
      view.text(14, ROWS, `LEVEL ${state.level}`, COLORS.yellow, 6);
      view.text(26, ROWS, `RPG ${rpgs}`, COLORS.yellow, 6);
      view.text(0, ROWS + 1, `PILOT ${state.pilot}`, COLORS.dim, 0);
      const hint = app.touch ? 'II pause · controls' : 'P pause · controls';
      view.text(COLS - [...hint].length, ROWS + 1, hint, COLORS.dim, 0);

      if (banner.left > 0) view.centered(10, banner.text, COLORS.yellow, 20);
      if (briefing || paused) {
        ctx.fillStyle = 'rgba(4, 5, 12, 0.8)';
        ctx.fillRect(0, 0, view.width, view.height);
      }
      if (briefing) {
        drawControls(view, 7, app.touch, 'MISSION BRIEFING');
        view.centered(
          21,
          app.touch ? 'tap to launch' : 'press any key to launch',
          COLORS.yellow,
          12,
        );
      } else if (paused && showControls) {
        drawControls(view, 9, app.touch);
        view.centered(22, app.touch ? 'tap to return' : 'any key to return', COLORS.dim, 0);
      } else if (paused) {
        view.centered(10, 'P A U S E D', COLORS.cyan, 16);
        pauseMenu.draw(view);
      }
    },

    keyDown(key: KeyPress) {
      if (briefing) {
        if (!key.repeat) launch();
        return;
      }
      if (paused && showControls) {
        if (!key.repeat) showControls = false;
        return;
      }
      if (paused) {
        // Auto-repeat from the key that opened the menu must not close it again.
        if (key.repeat) return;
        if (key.code === 'Escape' || key.code === 'KeyP') resume();
        else pauseMenu.keyDown(key.code);
        return;
      }
      if (!key.repeat && isGameKey(key.code)) app.keys.down(key.code);
    },

    keyUp(code) {
      app.keys.up(code);
    },

    tap(_col, row) {
      if (briefing) launch();
      else if (showControls) showControls = false;
      else if (paused) pauseMenu.tap(row);
    },

    blur: pause,

    leave() {
      app.keys.clear();
    },
  };
}

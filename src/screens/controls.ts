import { COLORS, VIEW_COLS, type View } from '../render/grid';
import type { App, Screen } from './app';
import { menuScreen } from './menu';
import { GLYPHS } from './play';

export interface ControlRow {
  key: string;
  action: string;
  note: string;
  noteColor: keyof typeof COLORS;
}

const KEY_WIDTH = 14;
const ACTION_WIDTH = 10;

/** What each control does, named for the player's input device. */
export function controlRows(touch: boolean): ControlRow[] {
  return [
    { key: touch ? '◀ ▲ ▶ ▼' : 'ARROWS / WASD', action: 'move', note: '', noteColor: 'white' },
    {
      key: touch ? 'FIRE' : 'SPACE',
      action: 'fire',
      note: `${GLYPHS.green} green ships`,
      noteColor: 'green',
    },
    {
      key: touch ? 'SPEC' : 'C',
      action: 'special',
      note: `${GLYPHS.special} magenta (lv 2+)`,
      noteColor: 'magenta',
    },
    { key: touch ? 'RPG' : 'X', action: 'RPG', note: 'clears screen ×3', noteColor: 'yellow' },
    touch
      ? { key: 'II', action: 'pause', note: '', noteColor: 'white' }
      : { key: 'P / ESC', action: 'pause', note: 'M  mute', noteColor: 'dim' },
  ];
}

export function rowText(row: ControlRow): string {
  return row.key.padEnd(KEY_WIDTH) + row.action.padEnd(ACTION_WIDTH) + row.note;
}

/** Draws the controls card: a heading on `firstRow`, then one row every 2 lines. */
export function drawControls(
  view: View,
  firstRow: number,
  touch: boolean,
  heading = 'CONTROLS',
): void {
  const rows = controlRows(touch);
  const width = Math.max(...rows.map((r) => [...rowText(r)].length));
  const col = Math.floor((VIEW_COLS - width) / 2);
  view.centered(firstRow, heading, COLORS.cyan, 14);
  rows.forEach((r, i) => {
    const row = firstRow + 2 + i * 2;
    view.text(col, row, r.key, COLORS.yellow, 8);
    view.text(col + KEY_WIDTH, row, r.action, COLORS.white, 4);
    view.text(col + KEY_WIDTH + ACTION_WIDTH, row, r.note, COLORS[r.noteColor], 6);
  });
}

/** HOW TO PLAY, from the main menu. */
export function controlsScreen(app: App): Screen {
  const back = () => app.go(menuScreen(app));
  app.announce(
    controlRows(app.touch)
      .map((r) => `${r.key}: ${r.action}`)
      .join('. '),
  );
  return {
    name: 'controls',
    update() {},
    draw(view: View) {
      drawControls(view, 8, app.touch, 'HOW TO PLAY');
      view.centered(22, 'Every 10 kills is a new level.', COLORS.dim, 0);
      view.centered(26, app.touch ? 'tap to return' : 'any key to return', COLORS.dim, 0);
    },
    keyDown: back,
    tap: back,
  };
}

import { COLORS, type View } from '../render/grid';
import { loadSave } from '../session';
import type { App, KeyPress, Screen } from './app';
import { controlsScreen } from './controls';
import { highScoresScreen } from './highscores';
import { MenuList } from './menuList';
import { nameScreen } from './name';
import { playScreen } from './play';

const TITLE = ['╔═╗╔╦╗╔═╗╦═╗╔═╗╔═╗╦  ╦  ', '╚═╗ ║ ╠═╣╠╦╝╠╣ ╠═╣║  ║  ', '╚═╝ ╩ ╩ ╩╩╚═╚  ╩ ╩╩═╝╩═╝'];

export function menuScreen(app: App): Screen {
  const save = loadSave(app.store);
  const menu = new MenuList(
    app,
    [
      { label: 'NEW GAME', enabled: true, run: () => app.go(nameScreen(app)) },
      {
        label: 'CONTINUE',
        enabled: save !== null,
        run: () => save && app.go(playScreen(app, save)),
      },
      { label: 'HOW TO PLAY', enabled: true, run: () => app.go(controlsScreen(app)) },
      { label: 'HIGH SCORES', enabled: true, run: () => app.go(highScoresScreen(app)) },
    ],
    17,
  );
  app.announce('STARFALL. Main menu.');

  return {
    name: 'menu',
    update() {},
    draw(view: View) {
      TITLE.forEach((line, i) => view.centered(8 + i, line, COLORS.yellow, 18));
      view.centered(12, 'rebuilt from a 2019 console shooter', COLORS.dim, 0);
      menu.draw(view);
      view.centered(29, '↑↓ choose · ENTER select · M mute', COLORS.dim, 0);
    },
    keyDown(key: KeyPress) {
      menu.keyDown(key.code);
    },
    tap(_col, row) {
      menu.tap(row);
    },
  };
}

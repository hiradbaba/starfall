import { createGame, normalizePilot } from '../core/state';
import { PILOT_MAX } from '../core/config';
import { COLORS, type View } from '../render/grid';
import type { App, Screen } from './app';
import { menuScreen } from './menu';
import { playScreen } from './play';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

/** Pilot name entry uses a real <input> so mobile keyboards and IMEs work. */
export function nameScreen(app: App): Screen {
  const form = document.getElementById('name-form') as HTMLFormElement;
  const field = document.getElementById('pilot') as HTMLInputElement;
  field.maxLength = PILOT_MAX;
  field.value = '';
  form.hidden = false;
  field.focus();

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const pilot = normalizePilot(field.value);
    if (!pilot) {
      field.focus();
      return;
    }
    app.audio.play('select');
    app.go(playScreen(app, createGame(pilot, randomSeed())));
  };
  form.addEventListener('submit', onSubmit);

  return {
    name: 'name',
    update() {},
    draw(view: View) {
      view.centered(11, "ENTER THE PILOT'S NAME", COLORS.magenta, 12);
      view.centered(22, 'ENTER to launch · ESC back', COLORS.dim, 0);
    },
    keyDown(key) {
      if (key.code === 'Escape') app.go(menuScreen(app));
    },
    leave() {
      form.removeEventListener('submit', onSubmit);
      form.hidden = true;
      field.blur();
    },
  };
}

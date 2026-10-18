import type { GameState } from '../core/state';
import { COLORS, type View } from '../render/grid';
import type { App, Screen } from './app';
import { menuScreen } from './menu';

/** Ignore keys briefly so a held fire key doesn't skip the ending. */
const INPUT_GRACE_MS = 1200;

/** The ending, split so every line fits the grid even with a 16-character name. */
export function storyLines(pilot: string): string[] {
  return [
    `Captain ${pilot} ...`,
    'you did well out there.',
    'But the fleet broke, and the sky fell dark.',
    'Come back, pilot. Take the stars back',
    'before the last light goes out.',
  ];
}

export function gameOverScreen(app: App, state: GameState, rank: number | null): Screen {
  let shown = 0;
  const story = storyLines(state.pilot);
  app.audio.playTheme();
  app.announce(`Game over. Score ${state.score}, level ${state.level}.`);
  const back = () => {
    if (shown >= INPUT_GRACE_MS) app.go(menuScreen(app));
  };

  return {
    name: 'gameover',
    update(dt) {
      shown += dt;
    },
    draw(view: View) {
      view.centered(7, 'G A M E   O V E R', COLORS.red, 20);
      story.forEach((line, i) => view.centered(11 + i * 2, line, COLORS.white, 4));
      view.centered(21, `SCORE ${state.score}   LEVEL ${state.level}`, COLORS.yellow, 10);
      if (rank !== null) view.centered(23, `NEW HIGH SCORE · #${rank + 1}`, COLORS.magenta, 14);
      if (shown >= INPUT_GRACE_MS) view.centered(27, 'any key to continue', COLORS.dim, 0);
    },
    keyDown: back,
    tap: back,
  };
}

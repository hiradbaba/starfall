import { COLORS, type View } from '../render/grid';
import { loadScores } from '../session';
import type { App, Screen } from './app';
import { menuScreen } from './menu';

export function highScoresScreen(app: App): Screen {
  const scores = loadScores(app.store);
  app.announce(
    scores.length === 0
      ? 'No high scores yet.'
      : `High scores: ${scores.map((s, i) => `${i + 1}. ${s.name} ${s.score}`).join(', ')}`,
  );
  const back = () => app.go(menuScreen(app));

  return {
    name: 'highscores',
    update() {},
    draw(view: View) {
      view.centered(8, 'TOP PILOTS', COLORS.cyan, 14);
      if (scores.length === 0) view.centered(13, 'no scores yet — go make history', COLORS.dim, 0);
      scores.forEach((s, i) => {
        const line = `${i + 1}. ${s.name.padEnd(16)} ${String(s.score).padStart(5)}  L${s.level}`;
        view.centered(12 + i * 2, line, i === 0 ? COLORS.yellow : COLORS.white, i === 0 ? 12 : 4);
      });
      view.centered(26, 'any key to return', COLORS.dim, 0);
    },
    keyDown: back,
    tap: back,
  };
}

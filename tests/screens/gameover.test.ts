import { PILOT_MAX } from '../../src/core/config';
import { VIEW_COLS } from '../../src/render/grid';
import { storyLines } from '../../src/screens/gameover';

describe('game-over story (review fix)', () => {
  it('fits the grid for the longest allowed pilot name', () => {
    for (const line of storyLines('W'.repeat(PILOT_MAX))) {
      expect([...line].length).toBeLessThanOrEqual(VIEW_COLS);
    }
  });

  it('names the pilot', () => {
    expect(storyLines('Hirad').join(' ')).toContain('Captain Hirad');
  });
});

import { VIEW_COLS } from '../../src/render/grid';
import { controlRows, rowText } from '../../src/screens/controls';
import { GLYPHS } from '../../src/screens/play';

describe('controls card', () => {
  it.each([false, true])('every row fits the grid (touch=%s)', (touch) => {
    for (const row of controlRows(touch)) {
      expect([...rowText(row)].length).toBeLessThanOrEqual(VIEW_COLS);
    }
  });

  it('names the keyboard keys', () => {
    const text = controlRows(false).map(rowText).join('\n');
    for (const key of ['WASD', 'SPACE', 'C', 'X', 'P / ESC', 'M']) expect(text).toContain(key);
  });

  it('names the touch buttons on touch devices', () => {
    const text = controlRows(true).map(rowText).join('\n');
    for (const key of ['FIRE', 'SPEC', 'RPG', 'II']) expect(text).toContain(key);
    expect(text).not.toContain('SPACE');
  });

  it('says which shot kills which ship, using the in-game glyphs', () => {
    const rows = controlRows(false);
    expect(rows.find((r) => r.action === 'fire')!.note).toContain(GLYPHS.green);
    expect(rows.find((r) => r.action === 'special')!.note).toContain(GLYPHS.special);
  });
});

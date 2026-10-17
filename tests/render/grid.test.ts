import { cellAt, fitGrid, VIEW_COLS, VIEW_ROWS } from '../../src/render/grid';

describe('fitGrid', () => {
  it.each([
    [1280, 720],
    [390, 844],
    [2560, 1440],
  ])('fits the whole grid inside %ix%i, centred', (w, h) => {
    const l = fitGrid(w, h);
    expect(l.offsetX).toBeGreaterThanOrEqual(0);
    expect(l.offsetY).toBeGreaterThanOrEqual(0);
    expect(l.offsetX * 2 + l.cellW * VIEW_COLS).toBeCloseTo(w);
    expect(l.offsetY * 2 + l.cellH * VIEW_ROWS).toBeCloseTo(h);
    expect(l.cellW / l.cellH).toBeCloseTo(0.6);
  });

  it('cellAt inverts the layout', () => {
    const l = fitGrid(1280, 720);
    const px = l.offsetX + l.cellW * 10.5;
    const py = l.offsetY + l.cellH * 3.5;
    expect(cellAt(l, px, py)).toEqual({ col: 10, row: 3 });
  });
});

import { COLS, ROWS } from '../core/config';

export const HUD_ROWS = 2;
export const VIEW_COLS = COLS;
export const VIEW_ROWS = ROWS + HUD_ROWS;
/** Monospace glyphs are roughly 0.6 as wide as they are tall. */
const CHAR_ASPECT = 0.6;

export const COLORS = {
  bg: '#04050c',
  cyan: '#5ef6ff',
  green: '#5dff8a',
  magenta: '#ff5ef1',
  white: '#f4f7ff',
  red: '#ff4d5e',
  yellow: '#ffd84d',
  dim: '#56648a',
} as const;

export interface Layout {
  cellW: number;
  cellH: number;
  offsetX: number;
  offsetY: number;
}

/** Breathing room around the grid, in CSS pixels. */
const MARGIN = 12;

/** Largest grid of VIEW_COLS x VIEW_ROWS cells that fits inside the margin, centred. */
export function fitGrid(width: number, height: number): Layout {
  const w = Math.max(0, width - MARGIN * 2);
  const h = Math.max(0, height - MARGIN * 2);
  const cellH = Math.min(h / VIEW_ROWS, w / (VIEW_COLS * CHAR_ASPECT));
  const cellW = cellH * CHAR_ASPECT;
  return {
    cellW,
    cellH,
    offsetX: (width - cellW * VIEW_COLS) / 2,
    offsetY: (height - cellH * VIEW_ROWS) / 2,
  };
}

/** Converts a pixel position to the grid cell under it. */
export function cellAt(layout: Layout, px: number, py: number): { col: number; row: number } {
  return {
    col: Math.floor((px - layout.offsetX) / layout.cellW),
    row: Math.floor((py - layout.offsetY) / layout.cellH),
  };
}

const FONT = '"SF Mono", Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';

/** Draws text on the character grid. Columns and rows may be fractional (interpolation). */
export class View {
  layout: Layout = { cellW: 1, cellH: 1, offsetX: 0, offsetY: 0 };
  width = 0;
  height = 0;
  shake = { x: 0, y: 0 };

  constructor(readonly ctx: CanvasRenderingContext2D) {}

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    const canvas = this.ctx.canvas;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = cssWidth;
    this.height = cssHeight;
    this.layout = fitGrid(cssWidth, cssHeight);
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  x(col: number): number {
    return this.layout.offsetX + col * this.layout.cellW + this.shake.x;
  }

  y(row: number): number {
    return this.layout.offsetY + row * this.layout.cellH + this.shake.y;
  }

  /** Draws each character in its own cell so box-drawing glyphs line up. */
  text(col: number, row: number, s: string, color: string, glow = 10): void {
    const { ctx, layout } = this;
    ctx.font = `${Math.floor(layout.cellH * 0.9)}px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    const chars = [...s];
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i]!, this.x(col + i) + layout.cellW / 2, this.y(row) + layout.cellH / 2);
    }
    ctx.shadowBlur = 0;
  }

  centered(row: number, s: string, color: string, glow = 10): void {
    this.text(Math.floor((VIEW_COLS - [...s].length) / 2), row, s, color, glow);
  }

  /** Frame around the playfield. */
  frame(color: string): void {
    const { ctx, layout } = this;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x(0), this.y(0), layout.cellW * COLS, layout.cellH * ROWS);
    ctx.globalAlpha = 1;
  }
}

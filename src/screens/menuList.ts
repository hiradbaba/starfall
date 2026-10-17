import { COLORS, type View } from '../render/grid';
import { isConfirm, isDown, isUp, type App } from './app';

export interface MenuItem {
  label: string;
  enabled: boolean;
  run(): void;
}

/** Vertical list of options with a cursor, keyboard and tap support. */
export class MenuList {
  index: number;

  constructor(
    private app: App,
    private items: MenuItem[],
    private firstRow: number,
  ) {
    this.index = Math.max(
      0,
      items.findIndex((i) => i.enabled),
    );
  }

  draw(view: View): void {
    this.items.forEach((item, i) => {
      const selected = i === this.index;
      const label = selected ? `▶ ${item.label} ◀` : item.label;
      const color = !item.enabled ? COLORS.dim : selected ? COLORS.yellow : COLORS.cyan;
      view.centered(this.firstRow + i * 2, label, color, selected ? 14 : 6);
    });
  }

  keyDown(code: string): void {
    if (isUp(code)) this.move(-1);
    else if (isDown(code)) this.move(1);
    else if (isConfirm(code)) this.choose(this.index);
  }

  tap(row: number): void {
    const i = (row - this.firstRow) / 2;
    if (Number.isInteger(i) && i >= 0 && i < this.items.length) this.choose(i);
  }

  private move(delta: number): void {
    const n = this.items.length;
    let i = this.index;
    for (let k = 0; k < n; k++) {
      i = (i + delta + n) % n;
      if (this.items[i]!.enabled) break;
    }
    if (i !== this.index) {
      this.index = i;
      this.app.audio.play('move');
      this.app.announce(this.items[i]!.label);
    }
  }

  private choose(i: number): void {
    const item = this.items[i]!;
    if (!item.enabled) return;
    this.index = i;
    this.app.audio.play('select');
    item.run();
  }
}

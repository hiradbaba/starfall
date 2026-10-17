import type { KeyState } from './keyboard';

const BUTTONS = [
  { code: 'ArrowUp', label: '▲', area: 'up' },
  { code: 'ArrowLeft', label: '◀', area: 'left' },
  { code: 'ArrowRight', label: '▶', area: 'right' },
  { code: 'ArrowDown', label: '▼', area: 'down' },
  { code: 'Space', label: 'FIRE', area: 'fire' },
  { code: 'KeyC', label: 'SPEC', area: 'special' },
  { code: 'KeyX', label: 'RPG', area: 'rpg' },
  { code: 'KeyP', label: 'II', area: 'pause' },
] as const;

/**
 * On-screen controls for touch devices. Each button presses a virtual key on
 * the shared KeyState, so touch and keyboard go through the same input path.
 * CSS only shows `.touch` on coarse pointers.
 */
export function mountTouchControls(root: HTMLElement, keys: KeyState): void {
  const pad = document.createElement('div');
  pad.className = 'touch';
  pad.setAttribute('aria-hidden', 'true');
  for (const b of BUTTONS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = b.label;
    el.style.gridArea = b.area;
    el.className = `touch-btn touch-${b.area}`;
    const release = () => keys.up(b.code);
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      keys.down(b.code);
    });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    pad.append(el);
  }
  root.append(pad);
}

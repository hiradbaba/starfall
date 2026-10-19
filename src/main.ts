import './style.css';
import { AudioEngine } from './audio/sfx';
import { isGameKey, KeyState } from './input/keyboard';
import { mountTouchControls } from './input/touch';
import { Effects } from './render/effects';
import { cellAt, View } from './render/grid';
import type { App, Screen } from './screens/app';
import { menuScreen } from './screens/menu';
import { KEYS } from './session';
import { safeStore } from './storage';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const stage = document.getElementById('stage')!;
const live = document.getElementById('live')!;
const hudText = document.getElementById('hud')!;

const view = new View(canvas.getContext('2d')!);
const store = safeStore(() => window.localStorage);
const fx = new Effects(matchMedia('(prefers-reduced-motion: reduce)').matches);
const audio = new AudioEngine(store.get(KEYS.muted) === '1');
const keys = new KeyState();

let current: Screen | null = null;
const app: App = {
  store,
  audio,
  keys,
  fx,
  touch: matchMedia('(pointer: coarse)').matches,
  go(next) {
    current?.leave?.();
    current = next;
    document.body.dataset.screen = next.name;
  },
  announce(text) {
    live.textContent = text;
  },
  hud(text) {
    hudText.textContent = text;
  },
};
app.go(menuScreen(app));
mountTouchControls(stage, keys);

const fit = () => {
  const r = canvas.getBoundingClientRect();
  view.resize(r.width, r.height, window.devicePixelRatio || 1);
};
new ResizeObserver(fit).observe(canvas);
fit();

window.addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.target instanceof HTMLInputElement) {
    // Typing a name: only Escape reaches the game.
    if (e.code === 'Escape') current?.keyDown({ code: e.code, repeat: e.repeat });
    return;
  }
  if (e.code === 'KeyM' && !e.repeat) {
    audio.setMuted(!audio.muted);
    store.set(KEYS.muted, audio.muted ? '1' : '0');
    app.announce(audio.muted ? 'Sound off' : 'Sound on');
    return;
  }
  if (isGameKey(e.code) || e.code === 'Enter') e.preventDefault();
  current?.keyDown({ code: e.code, repeat: e.repeat });
});
window.addEventListener('keyup', (e) => current?.keyUp?.(e.code));
window.addEventListener('pointerdown', () => audio.unlock());
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const { col, row } = cellAt(view.layout, e.clientX - r.left, e.clientY - r.top);
  current?.tap?.(col, row);
});
window.addEventListener('blur', () => current?.blur?.());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) current?.blur?.();
});

let last = performance.now();
const frame = (now: number) => {
  // Cap the step so returning to a background tab doesn't fast-forward the game.
  const dt = Math.min(250, now - last);
  last = now;
  current?.update(dt);
  fx.update(dt);
  view.shake = fx.shakeOffset();
  view.clear();
  fx.drawStars(view);
  current?.draw(view);
  fx.drawParticles(view);
  fx.drawCrt(view);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

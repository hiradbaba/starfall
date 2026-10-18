// Records a short gameplay GIF for the README: node scripts/capture-gif.mjs
// Needs a running preview server (npm run preview) on port 4173.
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import gifenc from 'gifenc';
import { PNG } from 'pngjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = 'docs/media/gameplay.gif';
const FRAMES = 60;
const FRAME_MS = 80;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 420 } });
await page.goto(URL);
await page.keyboard.press('Enter');
await page.locator('#pilot').fill('Hirad');
await page.keyboard.press('Enter');
await page.waitForTimeout(1500);

const gif = GIFEncoder();
await page.keyboard.down('Space');
const moves = ['ArrowLeft', 'ArrowRight'];
for (let i = 0; i < FRAMES; i++) {
  if (i % 12 === 0) {
    await page.keyboard.up(moves[(i / 12 + 1) % 2]);
    await page.keyboard.down(moves[(i / 12) % 2]);
  }
  if (i === 30) await page.keyboard.press('KeyX');
  const png = PNG.sync.read(await page.screenshot());
  const palette = quantize(png.data, 64);
  gif.writeFrame(applyPalette(png.data, palette), png.width, png.height, {
    palette,
    delay: FRAME_MS,
  });
}
gif.finish();
writeFileSync(OUT, gif.bytes());
await browser.close();
console.log(`Wrote ${OUT}`);

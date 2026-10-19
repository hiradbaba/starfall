import { expect, test, type Page } from '@playwright/test';

const screen = (page: Page) => page.locator('body');

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function startGame(page: Page, pilot: string) {
  await page.goto('/');
  await expect(screen(page)).toHaveAttribute('data-screen', 'menu');
  await page.keyboard.press('Enter');
  await expect(screen(page)).toHaveAttribute('data-screen', 'name');
  await page.locator('#pilot').fill(pilot);
  await page.keyboard.press('Enter');
  await expect(screen(page)).toHaveAttribute('data-screen', 'play');
  await launch(page, pilot);
}

/** Dismisses the pre-run briefing card. */
async function launch(page: Page, pilot: string) {
  await expect(page.locator('#live')).toHaveText('Briefing. Press any key to launch.');
  await page.keyboard.press('Enter');
  await expect(page.locator('#live')).toHaveText(`Launch! Pilot ${pilot}.`);
}

test('menu → name → play → save & quit → reload → continue', async ({ page }) => {
  const errors = trackErrors(page);
  // "m" in the name must not toggle mute while typing.
  await startGame(page, 'Smoke Tester');
  await expect(page.locator('#live')).not.toHaveText('Sound off');

  await page.keyboard.down('Space');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('Space');
  await expect(page.locator('#hud')).toContainText('Pilot Smoke Tester');

  await page.keyboard.press('KeyP');
  await expect(page.locator('#live')).toHaveText('Paused');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#live')).toHaveText('SAVE & QUIT');
  await page.keyboard.press('Enter');
  await expect(screen(page)).toHaveAttribute('data-screen', 'menu');

  await page.reload();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#live')).toHaveText('CONTINUE');
  await page.keyboard.press('Enter');
  await expect(screen(page)).toHaveAttribute('data-screen', 'play');
  await launch(page, 'Smoke Tester');
  await expect(page.locator('#hud')).toContainText('Pilot Smoke Tester');

  expect(errors).toEqual([]);
});

test('holding pause does not immediately resume (review fix)', async ({ page }) => {
  await startGame(page, 'Holder');
  await page.keyboard.press('KeyP');
  await expect(page.locator('#live')).toHaveText('Paused');
  // OS auto-repeat while P is still held down.
  await page.evaluate(() =>
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', repeat: true })),
  );
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#live')).toHaveText('CONTROLS');
});

test('a new run waits on the briefing until a key is pressed', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.locator('#pilot').fill('Rookie');
  await page.keyboard.press('Enter');
  await expect(page.locator('#live')).toHaveText('Briefing. Press any key to launch.');
  await page.waitForTimeout(1500);
  await expect(page.locator('#live')).toHaveText('Briefing. Press any key to launch.');
  await page.keyboard.press('Space');
  await expect(page.locator('#live')).toHaveText('Launch! Pilot Rookie.');
});

test('the menu has a HOW TO PLAY screen', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#live')).toHaveText('HOW TO PLAY');
  await page.keyboard.press('Enter');
  await expect(screen(page)).toHaveAttribute('data-screen', 'controls');
  await page.keyboard.press('Escape');
  await expect(screen(page)).toHaveAttribute('data-screen', 'menu');
});

test('leaving the tab pauses the game', async ({ page }) => {
  await startGame(page, 'Blur');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#live')).toHaveText('Paused');
});

test('dying shows game over, records the score, and clears the save', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  // A save where an enemy is one row above the ship: the next tick is fatal.
  await page.evaluate(() => {
    const state = {
      runId: 1,
      pilot: 'Doomed',
      player: { x: 10, y: 20 },
      enemies: [{ id: 1, kind: 'green', x: 11, y: 19 }],
      shots: [],
      rpg: null,
      rpgCharges: 3,
      score: 7,
      level: 0,
      greenCount: 6,
      specialCount: 2,
      tickMs: 100,
      tick: 50,
      nextId: 2,
      rng: 1,
      nextWave: { green: 1000000, special: 1000000 },
      nextShot: { normal: 0, special: 0 },
      over: false,
    };
    localStorage.setItem('starfall.save', JSON.stringify({ version: 2, state }));
  });
  await page.reload();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await launch(page, 'Doomed');
  await expect(screen(page)).toHaveAttribute('data-screen', 'gameover', { timeout: 5000 });
  await expect(page.locator('#live')).toHaveText('Game over. Score 7, level 0.');

  const stored = await page.evaluate(() => ({
    save: localStorage.getItem('starfall.save'),
    scores: localStorage.getItem('starfall.highscores'),
  }));
  expect(stored.save).toBeNull();
  expect(stored.scores).toContain('Doomed');
  expect(errors).toEqual([]);
});

test.describe('touch devices', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('shows on-screen controls that fire', async ({ page }) => {
    await startGame(page, 'Thumbs');
    await expect(page.locator('.touch-fire')).toBeVisible();
    await page.locator('.touch-fire').dispatchEvent('pointerdown', { pointerId: 1 });
    await page.waitForTimeout(400);
    await page.locator('.touch-fire').dispatchEvent('pointerup', { pointerId: 1 });
    await expect(screen(page)).toHaveAttribute('data-screen', 'play');
  });
});

for (const viewport of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test.describe(`touch layout ${viewport.width}x${viewport.height} (review fix)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport });

    test('every control is on screen and pause is top-right', async ({ page }) => {
      await startGame(page, 'Layout');
      for (const button of await page.locator('.touch-btn').all()) {
        const box = (await button.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      }
      const pause = (await page.locator('.touch-pause').boundingBox())!;
      expect(pause.y + pause.height).toBeLessThan(viewport.height / 4);
      expect(pause.x).toBeGreaterThan(viewport.width / 2);
    });

    if (viewport.height > viewport.width) {
      test('controls sit below the game canvas, not over it', async ({ page }) => {
        await startGame(page, 'Layout');
        const canvas = (await page.locator('#game').boundingBox())!;
        for (const area of ['up', 'left', 'right', 'down', 'fire', 'special', 'rpg']) {
          const box = (await page.locator(`.touch-${area}`).boundingBox())!;
          expect(box.y).toBeGreaterThanOrEqual(canvas.y + canvas.height);
        }
      });
    }
  });
}

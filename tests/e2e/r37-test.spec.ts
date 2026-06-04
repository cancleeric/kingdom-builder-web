/**
 * R37a Visual Verification — Kenney 2.5D Tile Board
 * Navigates to a real game, screenshots the board with Kenney tiles,
 * verifies 0 console errors and hover/zoom interactions.
 */
import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

test('R37a: Kenney tile board renders with 0 console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  const setup = new SetupPage(page);
  await setup.goto();
  await setup.selectBoardSize('small');
  await setup.startGame();

  // Wait for canvas (PixiBoard) to be in the DOM
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 15000 });

  // Give Pixi time to load PNG textures and render tiles
  await page.waitForTimeout(3000);

  // Full board screenshot
  await page.screenshot({ path: 'test-results/r37-board-full.png' });

  const bbox = await canvas.boundingBox();
  expect(bbox).not.toBeNull();
  if (!bbox) return;

  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  // Hover over center to trigger overlay highlight
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/r37-board-hover.png' });

  // Micro-pan (3px — below threshold, should NOT be swallowed as drag)
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 3, cy + 3);
  await page.mouse.up();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-results/r37-board-micro-pan.png' });

  // Zoom in with scroll wheel
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/r37-board-zoomed.png' });

  console.log('Console errors:', errors.length === 0 ? 'NONE' : errors.join('\n'));
  expect(errors.length).toBe(0);
});

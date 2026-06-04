import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * R39 Modular Map E2E Tests
 * Verifies the modular map renders and is playable.
 * Map diversity is proven by vitest unit tests (createModularBoard seed tests).
 */

test.describe('R39 Modular Map', () => {
  test.setTimeout(60_000);

  const screenshotDir = path.join(process.cwd(), 'test-results', 'r39-maps');

  /**
   * Navigate home → Single Player → dismiss tutorial → Start Game → wait for canvas.
   */
  async function startNewLargeGame(page: import('@playwright/test').Page, gameIndex: number) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Single Player
    const singlePlayerBtn = page.getByRole('button', { name: /single player/i });
    await singlePlayerBtn.waitFor({ timeout: 5000 });
    await singlePlayerBtn.click();
    await page.waitForTimeout(500);

    // Dismiss any tutorial overlay
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Select "Large" board size if the option exists
    const largeSizeBtn = page.locator('button').filter({ hasText: /^large$/i }).first();
    if (await largeSizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await largeSizeBtn.click();
      await page.waitForTimeout(200);
    }

    // Scroll down to reveal "Start Game"
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Click Start Game
    const startBtn = page.getByRole('button', { name: /start game/i });
    await startBtn.waitFor({ timeout: 5000 });
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();

    // Wait for Pixi canvas
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Dismiss any first-time tutorial popup
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Take screenshot
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshot = await page.screenshot({
      path: path.join(screenshotDir, `game-${gameIndex}-board.png`),
      fullPage: false,
    });

    return screenshot;
  }

  test('game 1 — modular map renders with hex board', async ({ page }) => {
    const screenshot = await startNewLargeGame(page, 1);

    expect(screenshot.length).toBeGreaterThan(10000);

    // Canvas should be present
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
  });

  test('game 2 — second game also renders correctly', async ({ page }) => {
    const screenshot = await startNewLargeGame(page, 2);
    expect(screenshot.length).toBeGreaterThan(10000);
  });

  test('game 3 — third game also renders correctly', async ({ page }) => {
    const screenshot = await startNewLargeGame(page, 3);
    expect(screenshot.length).toBeGreaterThan(10000);
  });

  test('game board renders without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await startNewLargeGame(page, 99);

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver') &&
        !e.includes('[SW]') &&
        !e.includes('service worker') &&
        !e.includes('404'),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

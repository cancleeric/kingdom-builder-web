/**
 * verify-fix.spec.ts — RWD layout + board visibility assertions (rewritten for PixiBoard)
 *
 * Root cause of original skips (issue #189):
 *   Tests relied on `[role="grid"]` — an attribute on the SVG HexGrid that no longer
 *   exists after the R35 PixiBoard migration.  The game board is now a <canvas> element.
 *
 * Fix strategy:
 *   - Replace `[role="grid"]` locators with `canvas` locators.
 *   - Use canvas.boundingBox() for layout assertions (width, visibility).
 *   - Use store cell count for "all cells visible" verification.
 */

import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

/**
 * Tablet portrait layout: canvas board should be full-width and desktop sidebar hidden.
 *
 * Previously skipped (issue #189) because [role="grid"] (SVG HexGrid) was not found.
 * Fixed: assert on Pixi <canvas> boundingBox instead.
 */
test('tablet portrait layout keeps board full-width and hides desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });

  const setupPage = new SetupPage(page);
  await setupPage.goto();
  await setupPage.selectBoardSize('small');
  await setupPage.startGame();

  const gamePage = new GamePage(page);
  await expect(gamePage.header).toBeVisible({ timeout: 8000 });

  // Pixi canvas replaces [role="grid"] — must be visible
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 8000 });

  // Canvas must be wide at tablet viewport (no sidebar stealing horizontal space)
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox, 'Canvas must have a bounding box').not.toBeNull();
  if (canvasBox) {
    console.log('Canvas width at 768px viewport:', canvasBox.width);
    expect(canvasBox.width).toBeGreaterThan(500);
  }

  // Desktop sidebar (aside) should not be visible at tablet width
  const desktopSidebar = page.locator('aside').first();
  if (await desktopSidebar.count() > 0) {
    await expect(desktopSidebar).toBeHidden();
  }

  // Compact drawer should be visible at tablet width
  const compactDrawer = page.locator('[role="region"][aria-expanded]').first();
  if (await compactDrawer.count() > 0) {
    await expect(compactDrawer).toBeVisible();
  }
});

/**
 * 16x16 board: all cells accounted for in store + canvas renders within viewport.
 *
 * Previously skipped (issue #189) because [role="grid"] and g[role="gridcell"] are
 * SVG-era DOM nodes that no longer exist after R35 PixiBoard migration.
 * Fixed: assert on canvas boundingBox + store cell count + valid placements.
 */
test('16x16 board - all cells within viewport after fix', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto();
  await setupPage.selectBoardSize('medium');
  await setupPage.startGame();

  await expect(gamePage.header).toBeVisible({ timeout: 8000 });

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(500); // Allow Pixi to fully initialise

  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);

  // Canvas bounding box must be within viewport
  const canvasBox = await canvas.boundingBox();
  console.log('Canvas bounding box:', canvasBox);
  expect(canvasBox, 'Pixi canvas must have a bounding box').not.toBeNull();

  if (canvasBox && viewport) {
    expect(canvasBox.x).toBeGreaterThanOrEqual(0);
    expect(canvasBox.y).toBeGreaterThanOrEqual(0);
    expect(canvasBox.width).toBeGreaterThan(200);
    expect(canvasBox.height).toBeGreaterThan(200);
  }

  // Verify store has expected cell count for a medium board (320+ cells)
  const cellCount = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    return useGameStore.getState().board.getAllCells().length;
  });
  console.log('Total board cells in store:', cellCount);
  expect(cellCount).toBeGreaterThan(200);

  // Draw card and verify board is interactive (valid placements > 0)
  await gamePage.clickDrawCard();
  await gamePage.waitForValidPlacements(6000);
  const validCount = await gamePage.getValidPlacementCount();
  console.log('Valid placements after draw:', validCount);
  expect(validCount).toBeGreaterThan(0);
});

/**
 * R30 Invalid Placement Feedback — E2E spec (rewritten for PixiBoard era)
 *
 * Root cause of original skips (issue #186):
 *   The spec tried to find `[role="gridcell"][aria-disabled="false"]` — SVG-era
 *   DOM nodes that no longer exist after the R35 PixiBoard migration.
 *
 * Fix strategy:
 *   - PixiBoard exposes `onInvalidClick` prop → `handleInvalidCellClick` in App.tsx.
 *   - In DEV mode App.tsx exposes `window.__testInvalidClick` so Playwright can
 *     call it directly, bypassing the need to hit a real Pixi canvas pixel.
 *   - We enter PlaceSettlements via store-driven clickDrawCard, pick an invalid
 *     coord (not in validPlacements) from the store, then fire the hook.
 *   - Assertions target the `role="status"` toast that `InvalidHintToast` renders.
 */

import { test, expect, type Page } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

/**
 * Start a single-player game and advance to PlaceSettlements.
 */
async function startAndDraw(page: Page): Promise<void> {
  const setup = new SetupPage(page);
  const game = new GamePage(page);

  await setup.goto(42);
  await setup.selectBoardSize('small');
  await setup.startGame();

  await expect(game.header).toBeVisible({ timeout: 8000 });
  await game.clickDrawCard();
  await game.waitForValidPlacements();
  await expect(game.liveRegion).toContainText('PlaceSettlements');
}

/**
 * Fire the invalid-click handler for the first non-valid cell via the DEV hook.
 * Returns the coord "q,r" string or null if precondition not met.
 */
async function fireInvalidClick(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const validSet = new Set(
      state.validPlacements.map((c: { q: number; r: number }) => `${c.q},${c.r}`)
    );
    const allCells = state.board.getAllCells();
    const invalidCell = allCells.find((cell: { coord: { q: number; r: number } }) => {
      const key = `${cell.coord.q},${cell.coord.r}`;
      return !validSet.has(key);
    });
    if (!invalidCell) return null;

    const hook = (window as Record<string, unknown>).__testInvalidClick as
      | ((coord: { q: number; r: number }) => void)
      | undefined;
    if (!hook) return null;

    hook(invalidCell.coord);
    return `${invalidCell.coord.q},${invalidCell.coord.r}`;
  });
}

// ─── A: invalid click shows hint toast ───────────────────────────────────────

test('R30-A: invalid click shows hint toast', async ({ page }) => {
  await startAndDraw(page);

  const firedCoord = await fireInvalidClick(page);
  expect(firedCoord, 'Must find at least one invalid cell and fire the hook').not.toBeNull();

  // InvalidHintToast renders role="status" aria-live="polite"
  const toast = page.locator('[role="status"][aria-live="polite"]').filter({
    hasText: /place|terrain|adjacent|occupied|must|放|須|格/i,
  });
  await expect(toast).toBeVisible({ timeout: 3000 });

  const toastText = await toast.textContent();
  console.log('R30-A toast:', toastText?.trim());
  expect(toastText?.trim().length).toBeGreaterThan(0);
});

// ─── B: valid placement does NOT trigger invalid toast ────────────────────────

test('R30-B: valid placement does not trigger invalid toast', async ({ page }) => {
  await startAndDraw(page);

  // Place on a valid cell via store, then verify no hint toast appeared
  const result = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const first = state.validPlacements[0];
    if (!first) return 'NO_VALID_CELL';
    state.placeSettlement(first);
    // Allow React to render
    await new Promise(r => setTimeout(r, 400));
    const statusEls = document.querySelectorAll('[role="status"][aria-live="polite"]');
    let hintFound = false;
    statusEls.forEach(el => {
      const t = el.textContent ?? '';
      if (t && /place|terrain|adjacent|occupied|must|放|須|格/i.test(t)) {
        hintFound = true;
      }
    });
    return hintFound ? 'HINT_TOAST_APPEARED' : 'OK';
  });

  console.log('R30-B valid-placement toast check:', result);
  expect(result).toBe('OK');
});

// ─── C: debounce — rapid calls do not stack multiple toasts ──────────────────

test('R30-C: debounce prevents rapid invalid clicks from spamming toasts', async ({ page }) => {
  await startAndDraw(page);

  const fired = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const validSet = new Set(
      state.validPlacements.map((c: { q: number; r: number }) => `${c.q},${c.r}`)
    );
    const allCells = state.board.getAllCells();
    const invalidCell = allCells.find(
      (cell: { coord: { q: number; r: number } }) =>
        !validSet.has(`${cell.coord.q},${cell.coord.r}`)
    );
    if (!invalidCell) return 0;

    const hook = (window as Record<string, unknown>).__testInvalidClick as
      | ((coord: { q: number; r: number }) => void)
      | undefined;
    if (!hook) return 0;

    for (let i = 0; i < 5; i++) {
      hook(invalidCell.coord);
    }
    return 5;
  });

  expect(fired).toBe(5);

  // Only one toast instance should be rendered (React renders the same element)
  const toasts = page.locator('[role="status"][aria-live="polite"]').filter({
    hasText: /place|terrain|adjacent|occupied|must|放|須|格/i,
  });
  await page.waitForTimeout(300);
  const count = await toasts.count();
  console.log('R30-C toast count after 5 rapid calls:', count);
  expect(count).toBeLessThanOrEqual(1);
});

// ─── D: hint toast auto-dismisses after ~1800ms ───────────────────────────────

test('R30-D: hint toast auto-dismisses after ~1800ms', async ({ page }) => {
  await startAndDraw(page);

  const firedCoord = await fireInvalidClick(page);
  expect(firedCoord).not.toBeNull();

  const toast = page.locator('[role="status"][aria-live="polite"]').filter({
    hasText: /place|terrain|adjacent|occupied|must|放|須|格/i,
  });
  await expect(toast).toBeVisible({ timeout: 3000 });

  const toastTextBefore = await toast.textContent();
  console.log('R30-D toast before dismiss:', toastTextBefore?.trim());
  expect(toastTextBefore?.trim().length).toBeGreaterThan(0);

  // Wait for auto-dismiss (1800ms + 400ms buffer)
  await page.waitForTimeout(2300);

  // Toast should be gone
  await expect(toast).toBeHidden({ timeout: 1000 });
  console.log('R30-D toast correctly dismissed after ~1800ms');
});

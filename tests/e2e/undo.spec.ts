import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

/**
 * Undo functionality E2E tests.
 *
 * Verifies that players can undo their last placement during the
 * PlaceSettlements phase and that the board state is correctly restored.
 */

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('i18nextLng', 'en');
        localStorage.setItem('tutorialCompleted', 'true');
    });
    await page.evaluate(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            // ignore storage access errors before first navigation
        }
    });
});

// ─── helper: start a deterministic 2-human game ──────────────────────────────

async function startTwoHumanGame(
    setupPage: SetupPage,
    gamePage: GamePage,
    seed?: number
): Promise<void> {
    await setupPage.goto(seed);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(1, 'human');
    await setupPage.startGame();
    await expect(gamePage.header).toBeVisible();
    await expect(gamePage.liveRegion).toContainText('DrawCard');
}

// ─── Scenario 1: Undo a single placement ─────────────────────────────────────

// Skipped: uses GamePage.clickValidCell() / drawAndPlace() which rely on SVG gridcell
// DOM nodes removed since PixiBoard migration (R35). See issue #190.
test.skip('undo: undoing a single placement restores state', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await startTwoHumanGame(setupPage, gamePage, 42);

    // Draw a terrain card
    await gamePage.clickDrawCard();
    await expect(gamePage.liveRegion).toContainText('PlaceSettlements');
    await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

    // Place one settlement
    await gamePage.clickValidCell();
    await expect(gamePage.liveRegion).toContainText('placements remaining: 2');

    // Undo the placement
    await gamePage.undoButton.click();

    // Placements should be restored to 3
    await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

    // Undo button should now be disabled (no more actions to undo)
    await expect(gamePage.undoButton).toBeDisabled();
});

// ─── Scenario 2: Undo multiple placements ────────────────────────────────────

// Skipped: uses GamePage.clickValidCell() which relies on SVG gridcell DOM nodes
// removed since PixiBoard migration (R35). See issue #190.
test.skip('undo: one undo is allowed per turn', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await startTwoHumanGame(setupPage, gamePage, 42);

    await gamePage.clickDrawCard();
    await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

    // Place one settlement, then consume the one undo allowed this turn.
    await gamePage.clickValidCell();
    await gamePage.undoButton.click();
    await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

    // Further placements in the same turn cannot be undone.
    await gamePage.clickValidCell();
    await expect(gamePage.liveRegion).toContainText('placements remaining: 2');
    await expect(gamePage.undoButton).toBeDisabled();
});

// ─── Scenario 3: Undo is disabled during DrawCard phase ──────────────────────

test('undo: undo button is disabled during DrawCard phase', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await startTwoHumanGame(setupPage, gamePage, 42);

    // Initially in DrawCard phase
    await expect(gamePage.liveRegion).toContainText('DrawCard');

    // Undo button is not shown until a settlement can be undone.
    await expect(gamePage.undoButton).toHaveCount(0);
});

// ─── Scenario 4: Undo is disabled after ending the turn ──────────────────────

// Skipped: uses GamePage.drawAndPlace() which relies on SVG gridcell DOM nodes
// removed since PixiBoard migration (R35). See issue #190.
test.skip('undo: undo button is disabled after ending the turn', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await startTwoHumanGame(setupPage, gamePage, 42);

    // Complete a full turn
    await gamePage.drawAndPlace(3);
    await expect(gamePage.liveRegion).toContainText('EndTurn');

    // Before ending the turn, undo should be available for the last placement
    await expect(gamePage.undoButton).toBeEnabled();

    // Undo one placement
    await gamePage.undoButton.click();
    await expect(gamePage.liveRegion).toContainText('placements remaining: 1');

    // Place again to complete all 3 placements
    await gamePage.clickValidCell();
    await expect(gamePage.liveRegion).toContainText('EndTurn');

    // End the turn
    await gamePage.clickEndTurn();
    await expect(gamePage.liveRegion).toContainText('DrawCard');

    // Undo button is hidden again on the next player's DrawCard phase.
    await expect(gamePage.undoButton).toHaveCount(0);
});

// ─── Scenario 5: Undo after acquiring a location tile ────────────────────────

// Skipped: uses GamePage.clickCellAt() which relies on SVG gridcell DOM nodes
// removed since PixiBoard migration (R35). See issue #190.
test.skip('undo: undoing a placement that acquired a location tile removes the tile', async ({ page }) => {
    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    // Seed 4 → Grass card, Farm at Q7 R7
    await startTwoHumanGame(setupPage, gamePage, 4);

    await gamePage.clickDrawCard();
    await expect(gamePage.liveRegion).toContainText('terrain: Grass');

    // Place adjacent to Farm (Q6 R7) to acquire the Farm tile
    await gamePage.clickCellAt(6, 7);
    await expect(page.locator('text=Farm').first()).toBeAttached();

    // Undo the placement
    await gamePage.undoButton.click();

    // Farm tile should be removed from the player's acquired tiles
    // (The exact selector depends on how the UI displays acquired tiles.
    //  In practice, we'd check that the tile count decreased or the tile is no longer visible.)
    // For now, verify that placements remaining is restored to 3.
    await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

    // Note: Full verification would require inspecting the player's tile list,
    // but that may not be directly accessible in the aria-live region.
    // This test provides a smoke check that undo works after tile acquisition.
});

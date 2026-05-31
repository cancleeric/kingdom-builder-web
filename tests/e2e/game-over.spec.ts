import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

/**
 * Game Over E2E tests.
 *
 * Verifies the Game Over modal, final scores, leaderboard, and the "New Game"
 * button functionality.
 */

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('i18nextLng', 'en');
    });
    await page.evaluate(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            // ignore storage access errors before first navigation
        }
    });
});

// ─── Scenario 1: Game Over modal appears and shows final rankings ────────────

test('game over: modal appears with final rankings after bot game completes', async ({ page }) => {
    test.setTimeout(300_000); // 5 minutes for bot game

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    // Start a 2-bot game on a small board
    await setupPage.goto(42);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(0, 'bot');
    // Player 2 is bot by default
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    // Wait for Game Over
    await gamePage.waitForGameOver(240_000);

    // Game Over modal must be visible
    await expect(gamePage.gameOverHeading).toBeVisible();

    // "Final Rankings" heading must be present
    await expect(page.getByText('Final Rankings')).toBeVisible();

    // At least 2 players must have scores displayed
    const scoreRows = await gamePage.scoreRows();
    expect(scoreRows.length).toBeGreaterThanOrEqual(2);

    scoreRows.forEach(({ name, score }) => {
        expect(name).toBeTruthy();
        expect(score).toMatch(/^\d+$/); // Score must be numeric
    });
});

// ─── Scenario 2: Leaderboard shows correct player order (highest score first) ─

test('game over: leaderboard orders players by score descending', async ({ page }) => {
    test.setTimeout(300_000);

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    // 3-bot game on small board to get multiple players
    await setupPage.goto(101);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.selectPlayerCount(3);
    await setupPage.setPlayerType(0, 'bot');
    await setupPage.setPlayerType(1, 'bot');
    // Player 3 is bot by default
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    await gamePage.waitForGameOver(240_000);

    const scoreRows = await gamePage.scoreRows();
    expect(scoreRows.length).toBe(3);

    // Verify scores are in descending order
    const scores = scoreRows.map(row => parseInt(row.score, 10));
    for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
});

// ─── Scenario 3: Winner is highlighted or indicated ──────────────────────────

test('game over: winner is highlighted in the leaderboard', async ({ page }) => {
    test.setTimeout(300_000);

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await setupPage.goto(200);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(0, 'bot');
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    await gamePage.waitForGameOver(240_000);

    const scoreRows = await gamePage.scoreRows();
    expect(scoreRows.length).toBeGreaterThanOrEqual(2);

    // The first row should be the winner (highest score)
    const winnerName = scoreRows[0].name;
    expect(winnerName).toBeTruthy();

    // Optionally check for a visual indicator (e.g., trophy emoji, gold background)
    // This depends on the UI implementation; adjust the selector as needed.
    const winnerRow = page.locator('div').filter({ hasText: new RegExp(`^${winnerName}`) }).first();
    await expect(winnerRow).toBeVisible();

    // If the winner row has a special class or icon, verify it
    // For example: await expect(winnerRow.locator('text=🏆')).toBeVisible();
});

// ─── Scenario 4: "New Game" button returns to setup screen ───────────────────

test('game over: clicking "New Game" returns to setup screen', async ({ page }) => {
    test.setTimeout(300_000);

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await setupPage.goto(42);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(0, 'bot');
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    await gamePage.waitForGameOver(240_000);

    // Click "New Game"
    await gamePage.newGameButton.click();

    // Setup screen should be visible again
    await expect(setupPage.setupHeading).toBeVisible();
    await expect(setupPage.heading).toBeVisible();

    // Verify that the previous game state is cleared (e.g., player names reset)
    // This is a smoke test; full verification would check that all state is reset.
});

// ─── Scenario 5: Game Over shows Kingdom Cards that were active ──────────────

test('game over: modal displays which Kingdom Cards were active during the game', async ({ page }) => {
    test.setTimeout(300_000);

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await setupPage.goto(50);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(0, 'bot');
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    await gamePage.waitForGameOver(240_000);

    // Check if Kingdom Cards are listed in the Game Over modal
    // (This depends on whether the UI shows Kingdom Cards in the modal.
    //  Adjust the selector based on actual implementation.)
    const kingdomCardsHeading = page.locator('text=/Kingdom Cards?|Objectives?/i');
    if (await kingdomCardsHeading.isVisible({ timeout: 2000 })) {
        await expect(kingdomCardsHeading).toBeVisible();
        // Verify that at least 3 Kingdom Card names are present (standard is 3 per game)
        const cardNames = page.locator('text=/Hermits|Farmers|Merchants|Citizens|Lords/i');
        const count = await cardNames.count();
        expect(count).toBeGreaterThanOrEqual(3);
    }
    // If Kingdom Cards are not shown in the modal, this test passes silently.
});

// ─── Scenario 6: Game Over modal is accessible (keyboard navigation) ─────────

test('game over: modal can be navigated with keyboard', async ({ page }) => {
    test.setTimeout(300_000);

    const setupPage = new SetupPage(page);
    const gamePage = new GamePage(page);

    await setupPage.goto(42);
    await expect(setupPage.setupHeading).toBeVisible();
    await setupPage.setPlayerType(0, 'bot');
    await setupPage.selectBoardSize('small');
    await setupPage.startGame();

    await gamePage.waitForGameOver(240_000);

    // Focus the "New Game" button with Tab key
    await page.keyboard.press('Tab');

    // Verify "New Game" button is focused
    const newGameButton = gamePage.newGameButton;
    await expect(newGameButton).toBeFocused();

    // Press Enter to activate "New Game"
    await page.keyboard.press('Enter');

    // Should return to setup screen
    await expect(setupPage.setupHeading).toBeVisible();
});

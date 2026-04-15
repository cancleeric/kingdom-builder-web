import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
  await page.evaluate(() => localStorage.setItem('i18nextLng', 'en'));
});

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Start a 2-human-player game (optional deterministic seed) and wait for
 * the initial DrawCard phase.
 */
async function startTwoHumanGame(
  setupPage: SetupPage,
  gamePage: GamePage,
  seed?: number
): Promise<void> {
  await setupPage.goto(seed);
  await expect(setupPage.setupHeading).toBeVisible();
  // Default is Player 1=Human, Player 2=Bot — set both to Human so no
  // auto-play interferes with our assertions.
  await setupPage.setPlayerType(1, 'human');
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await expect(gamePage.liveRegion).toContainText('DrawCard');
}

// ─── Scenario 1: Setup flow and game start ───────────────────────────────────

test('setup: shows setup screen and starts a 2-player game', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto();

  await expect(setupPage.heading).toBeVisible();
  await expect(setupPage.setupHeading).toBeVisible();

  // Default is 2 players — use nth(0) to target the player-count "2" button
  // (there may be other buttons with label "2" such as the Objective Cards row)
  await expect(page.getByRole('button', { name: '2', exact: true }).first()).toHaveClass(/bg-blue/);

  // Change a player name and start
  await setupPage.setPlayerName(0, 'Alice');
  await setupPage.setPlayerType(1, 'human');
  await setupPage.startGame();

  // Game board is now visible and live region confirms DrawCard phase
  await expect(gamePage.header).toBeVisible();
  await expect(gamePage.liveRegion).toContainText("DrawCard");
});

// ─── Scenario 2: Draw card and show valid placements ────────────────────────

test('draw card: shows terrain card and highlights valid cells', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await startTwoHumanGame(setupPage, gamePage, 42);

  await expect(gamePage.liveRegion).toContainText('DrawCard');

  // Draw card
  await gamePage.clickDrawCard();

  // Live region reports PlaceSettlements + terrain + 3 placements
  await expect(gamePage.liveRegion).toContainText('PlaceSettlements');
  await expect(gamePage.liveRegion).toContainText('terrain:');
  await expect(gamePage.liveRegion).toContainText('placements remaining: 3');

  // Valid cells exist on the board
  await expect(gamePage.validCells.first()).toBeAttached();

  // Place one settlement — placements drop to 2
  await gamePage.clickValidCell();
  await expect(gamePage.liveRegion).toContainText('placements remaining: 2');
});

// ─── Scenario 3: Illegal placement blocked ───────────────────────────────────

test('illegal placement: cannot place on Mountain or Water', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await startTwoHumanGame(setupPage, gamePage, 42);
  await gamePage.clickDrawCard();
  await expect(gamePage.liveRegion).toContainText('PlaceSettlements');

  // Q0 R5 is a Mountain cell (border, always Mountain per board layout)
  const mountainCell = gamePage.cellAt(0, 5);
  await expect(mountainCell).toBeAttached();
  await expect(mountainCell).toHaveAttribute('aria-disabled', 'true');

  // Clicking a mountain cell must NOT change the placement count
  await gamePage.clickCellAt(0, 5);
  await expect(gamePage.liveRegion).toContainText('placements remaining: 3');
});

// ─── Scenario 4: Turn switch after end turn ──────────────────────────────────

test('turn switch: player changes after ending a turn', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await startTwoHumanGame(setupPage, gamePage, 42);

  const p1name = await gamePage.currentPlayerName();
  expect(p1name).toBeTruthy();

  // Complete a full turn: draw card + 3 placements
  await gamePage.drawAndPlace(3);

  // Phase must be EndTurn before clicking End Turn
  await expect(gamePage.liveRegion).toContainText('EndTurn');
  await gamePage.clickEndTurn();

  // Phase resets to DrawCard for the next player
  await expect(gamePage.liveRegion).toContainText('DrawCard');

  const p2name = await gamePage.currentPlayerName();
  expect(p2name).not.toBe(p1name);
});

// ─── Scenario 5: Location Tile acquisition ───────────────────────────────────

test('location tile: placing adjacent to a location grants the tile', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  // Seed 4 → first terrain card is Grass.
  // Farm is at Q7 R7 (Grass terrain).
  // Q6 R7 is an adjacent Grass cell — placing there acquires the Farm tile.
  await startTwoHumanGame(setupPage, gamePage, 4);

  await gamePage.clickDrawCard();

  // Confirm Grass card was drawn
  await expect(gamePage.liveRegion).toContainText('terrain: Grass');

  // Q6 R7 must be a valid Grass cell
  await expect(gamePage.cellAt(6, 7)).toHaveAttribute('aria-disabled', 'false');

  // Place on the cell adjacent to Farm
  await gamePage.clickCellAt(6, 7);

  // Farm tile must now be in the DOM (BottomDrawer "Your Tiles" section or sidebar)
  await expect(page.locator('text=Farm').first()).toBeAttached();
});

// ─── Scenario 6: Game Over triggers and shows scores ────────────────────────

test('game over: two-bot game completes and shows final scores', async ({ page }) => {
  // Allow up to 5 minutes for two bots to finish on a small board.
  // The board-full game-over condition may take longer than remainingSettlements=0
  // since Medium (Strategic) bots need AI computation time per turn.
  test.setTimeout(300_000);

  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  // 2-bot game auto-plays to completion; use small board to keep runtime short.
  await setupPage.goto(42);
  await expect(setupPage.setupHeading).toBeVisible();
  await setupPage.setPlayerType(0, 'bot');   // Player 1 → Bot
  // Player 2 is already Bot by default
  await setupPage.selectBoardSize('small');
  await setupPage.startGame();

  // Wait for Game Over modal — allow generous timeout since bot AI computation
  // and the board-full condition may take longer on slower machines.
  await gamePage.waitForGameOver(240_000);

  await expect(gamePage.gameOverHeading).toBeVisible();

  // "Final Rankings" sub-heading must be visible
  await expect(page.getByText('Final Rankings')).toBeVisible();

  // At least 2 score values (text-2xl) must be present in the modal
  const scoreEls = page.locator('.fixed.inset-0 p.text-2xl');
  await expect(scoreEls.first()).toBeVisible();
  const scoreCount = await scoreEls.count();
  expect(scoreCount).toBeGreaterThanOrEqual(2);

  // "New Game" returns to setup
  await gamePage.newGameButton.click();
  await expect(setupPage.setupHeading).toBeVisible();
});

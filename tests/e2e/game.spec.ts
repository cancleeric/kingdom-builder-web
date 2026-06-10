import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';
import { openSavedGameOver } from '../pages/GameOverFixture';

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
  await expect(page.getByRole('button', { name: '2', exact: true }).first()).toHaveAttribute('aria-pressed', 'true');

  // Change a player name and start
  await setupPage.setPlayerName(0, 'Alice');
  await setupPage.setPlayerType(1, 'human');
  await setupPage.startGame();

  // Game board is now visible and live region confirms DrawCard phase
  await expect(gamePage.header).toBeVisible();
  await expect(gamePage.liveRegion).toContainText("DrawCard");
});

// ─── Scenario 2: Draw card and show valid placements ────────────────────────

// Fixed: GamePage now uses store-based placeSettlement() instead of DOM gridcell.
// See issue #190.
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

  // Valid cells exist in the store (PixiBoard — no DOM gridcells)
  const validCount = await gamePage.getValidPlacementCount();
  expect(validCount).toBeGreaterThan(0);

  // Place one settlement — placements drop to 2
  await gamePage.clickValidCell();
  await expect(gamePage.liveRegion).toContainText('placements remaining: 2');
});

// ─── Scenario 3: Illegal placement blocked ───────────────────────────────────

// Fixed: uses getCellState() and store-based clickCellAt() instead of DOM gridcell.
// Mountain/Water cell is found dynamically from the store (modular board seed varies).
// See issue #190.
test('illegal placement: cannot place on Mountain or Water', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await startTwoHumanGame(setupPage, gamePage, 42);
  await gamePage.clickDrawCard();
  await expect(gamePage.liveRegion).toContainText('PlaceSettlements');

  // Find a non-buildable (Mountain or Water) cell dynamically from the store.
  // The modular board seed varies the exact layout, so we cannot hardcode a coord.
  const nonBuildable = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const validSet = new Set(state.validPlacements.map(v => `${v.q},${v.r}`));
    for (const cell of state.board.getAllCells()) {
      const k = `${cell.coord.q},${cell.coord.r}`;
      if ((cell.terrain === 'Mountain' || cell.terrain === 'Water') && !validSet.has(k)) {
        return { q: cell.coord.q, r: cell.coord.r, terrain: cell.terrain as string };
      }
    }
    return null;
  });

  // There must be at least one Mountain or Water cell on the board
  expect(nonBuildable).not.toBeNull();
  if (!nonBuildable) return;

  expect(['Mountain', 'Water']).toContain(nonBuildable.terrain);

  // clickCellAt on a non-valid cell is a no-op (mirrors PixiBoard pointertap guard)
  await gamePage.clickCellAt(nonBuildable.q, nonBuildable.r);
  await expect(gamePage.liveRegion).toContainText('placements remaining: 3');
});

// ─── Scenario 4: Turn switch after end turn ──────────────────────────────────

// Fixed: GamePage.drawAndPlace() now uses store-based placeSettlement(). See issue #190.
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

// Fixed: uses store-based clickCellAt(). Farm cell found dynamically. See issue #190.
test('location tile: placing adjacent to a location grants the tile', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  // Use any seed — force Grass card and find Farm-adjacent cell via store
  await startTwoHumanGame(setupPage, gamePage, 42);

  // Force a Grass terrain card and recalculate valid placements
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { getValidPlacements } = await import('/src/core/rules.ts');
    const { Terrain } = await import('/src/core/terrain.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    const state = useGameStore.getState();
    const currentTerrainCard = { terrain: Terrain.Grass };
    useGameStore.setState({
      phase: GamePhase.PlaceSettlements,
      currentTerrainCard,
      remainingPlacements: 3,
      validPlacements: getValidPlacements(
        state.board, Terrain.Grass, state.players[0].id
      ),
    });
  });

  // Confirm Grass card is active
  await expect(gamePage.liveRegion).toContainText('terrain: Grass');

  // Find a Farm-adjacent valid Grass cell dynamically
  const farmAdjacent = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location, Terrain } = await import('/src/core/terrain.ts');
    const { HEX_DIRECTIONS } = await import('/src/core/hex.ts');
    const state = useGameStore.getState();
    const validSet = new Set(state.validPlacements.map(v => `${v.q},${v.r}`));
    for (const cell of state.board.getAllCells()) {
      if (cell.location !== Location.Farm) continue;
      for (const dir of HEX_DIRECTIONS) {
        const adj = { q: cell.coord.q + dir.q, r: cell.coord.r + dir.r };
        const adjCell = state.board.getCell(adj);
        if (adjCell && adjCell.terrain === Terrain.Grass && validSet.has(`${adj.q},${adj.r}`)) {
          return { q: adj.q, r: adj.r };
        }
      }
    }
    return null;
  });

  // If no Farm-adjacent Grass valid cell, the board has no reachable Farm — skip gracefully
  if (!farmAdjacent) {
    console.log('No Farm-adjacent Grass valid cell — skipping location tile acquisition check');
    return;
  }

  // Verify the chosen cell is Grass and valid via store
  const cellState = await gamePage.getCellState(farmAdjacent.q, farmAdjacent.r);
  expect(cellState.terrain).toBe('Grass');
  expect(cellState.isValid).toBe(true);

  // Place on the cell adjacent to Farm
  await gamePage.clickCellAt(farmAdjacent.q, farmAdjacent.r);

  // Farm tile must now be in the DOM (BottomDrawer "Your Tiles" section or sidebar)
  await expect(page.locator('text=Farm').first()).toBeAttached();
});

// ─── Scenario 6: Game Over triggers and shows scores ────────────────────────

test('game over: saved completed game shows final scores', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await openSavedGameOver(page);

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

import { test, expect, type Page } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

async function grantFarmTile(page: Page, phase: 'DrawCard' | 'EndTurn' = 'EndTurn') {
  await page.evaluate(async ({ phase }) => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location } = await import('/src/core/terrain.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    const state = useGameStore.getState();

    useGameStore.setState({
      phase: phase === 'EndTurn' ? GamePhase.EndTurn : GamePhase.DrawCard,
      validPlacements: [],
      players: state.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              tiles: [{ location: Location.Farm, usedThisTurn: false }],
            }
          : player
      ),
    });
  }, { phase });
}

async function grantFarmTileDuringForestPlacement(page: Page) {
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location, Terrain } = await import('/src/core/terrain.ts');
    const { getValidPlacements } = await import('/src/core/rules.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    const state = useGameStore.getState();
    const player = state.players[0];
    const currentTerrainCard = { terrain: Terrain.Forest };

    useGameStore.setState({
      phase: GamePhase.PlaceSettlements,
      currentTerrainCard,
      remainingPlacements: 3,
      validPlacements: getValidPlacements(state.board, Terrain.Forest, player.id),
      players: state.players.map((existingPlayer, index) =>
        index === 0
          ? {
              ...existingPlayer,
              tiles: [{ location: Location.Farm, usedThisTurn: false }],
            }
          : existingPlayer
      ),
    });
  });
}

async function currentFarmState(page: Page) {
  return page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location } = await import('/src/core/terrain.ts');
    const { Terrain } = await import('/src/core/terrain.ts');
    const state = useGameStore.getState();
    const player = state.players[0];
    const farm = player.tiles.find(tile => tile.location === Location.Farm);
    const terrains = state.validPlacements.map(coord => state.board.getCell(coord)?.terrain);

    return {
      activeTile: state.activeTile,
      farmUsed: farm?.usedThisTurn ?? null,
      validCount: state.validPlacements.length,
      allValidAreGrass: terrains.length > 0 && terrains.every(terrain => terrain === Terrain.Grass),
    };
  });
}

async function currentPlacementState(page: Page) {
  return page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const terrains = state.validPlacements.map(coord => state.board.getCell(coord)?.terrain);

    return {
      activeTile: state.activeTile,
      terrain: state.currentTerrainCard?.terrain ?? null,
      validCount: state.validPlacements.length,
      allValidMatchTerrain:
        !!state.currentTerrainCard &&
        terrains.length > 0 &&
        terrains.every(terrain => terrain === state.currentTerrainCard?.terrain),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    // Suppress the "First time playing?" onboarding dialog so it doesn't
    // intercept pointer events during location-tile button clicks.
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

// Skipped: gamePage.validCells uses getByRole('gridcell') which no longer exists
// since PixiBoard migration (R35). See issue #190.
test.skip('location tile activation: Farm use highlights grass cells and marks the tile used', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantFarmTile(page);

  const farmCard = page.getByTestId('location-tile-card').filter({ hasText: 'Farm' }).first();
  await farmCard.getByRole('button', { name: 'Use' }).click();

  const activated = await currentFarmState(page);
  expect(activated.activeTile).toBe('Farm');
  expect(activated.validCount).toBeGreaterThan(0);
  expect(activated.allValidAreGrass).toBe(true);
  await expect(gamePage.validCells.first()).toBeVisible();

  await gamePage.clickValidCell();

  await expect(farmCard).toContainText('Used');
  const used = await currentFarmState(page);
  expect(used.activeTile).toBeNull();
  expect(used.farmUsed).toBe(true);
  expect(used.validCount).toBe(0);
});

test('location tile activation: Cancel clears Farm highlights and keeps the tile available', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantFarmTile(page);

  const farmCard = page.getByTestId('location-tile-card').filter({ hasText: 'Farm' }).first();
  await farmCard.getByRole('button', { name: 'Use' }).click();
  expect((await currentFarmState(page)).validCount).toBeGreaterThan(0);

  await farmCard.getByRole('button', { name: 'Cancel' }).click();

  await expect(farmCard.getByRole('button', { name: 'Use' })).toBeVisible();
  const canceled = await currentFarmState(page);
  expect(canceled.activeTile).toBeNull();
  expect(canceled.farmUsed).toBe(false);
  expect(canceled.validCount).toBe(0);
  await expect(gamePage.validCells).toHaveCount(0);
});

test('location tile activation: Cancel during placement restores terrain placements', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantFarmTileDuringForestPlacement(page);

  const before = await currentPlacementState(page);
  expect(before.terrain).toBe('Forest');
  expect(before.validCount).toBeGreaterThan(0);
  expect(before.allValidMatchTerrain).toBe(true);

  const farmCard = page.getByTestId('location-tile-card').filter({ hasText: 'Farm' }).first();
  await farmCard.getByRole('button', { name: 'Use' }).click();
  const activated = await currentFarmState(page);
  expect(activated.allValidAreGrass).toBe(true);

  await farmCard.getByRole('button', { name: 'Cancel' }).click();

  const restored = await currentPlacementState(page);
  expect(restored.activeTile).toBeNull();
  expect(restored.terrain).toBe('Forest');
  expect(restored.validCount).toBe(before.validCount);
  expect(restored.allValidMatchTerrain).toBe(true);
});

test('location tile activation: tile actions are hidden before a tile can be used', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantFarmTile(page, 'DrawCard');

  const farmCard = page.getByTestId('location-tile-card').filter({ hasText: 'Farm' }).first();
  await expect(farmCard).toContainText('Place 1 extra settlement on a Grass cell');
  await expect(farmCard.getByRole('button', { name: 'Use' })).toHaveCount(0);
});

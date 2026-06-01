import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

async function grantLocationTiles(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location } = await import('/src/core/terrain.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    const state = useGameStore.getState();

    useGameStore.setState({
      phase: GamePhase.EndTurn,
      players: state.players.map((player, index) =>
        index === 0
          ? {
              ...player,
              tiles: [
                { location: Location.Farm, usedThisTurn: false },
                { location: Location.Paddock, usedThisTurn: true },
              ],
            }
          : player
      ),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
});

test('desktop location tiles: cards explain each tile ability', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantLocationTiles(page);

  const tiles = page.getByRole('region', { name: 'Your Location Tiles' }).first();
  await expect(tiles.getByTestId('location-tile-card')).toHaveCount(2);
  await expect(tiles).toContainText('Farm');
  await expect(tiles).toContainText('Place 1 extra settlement on any empty Grass cell.');
  await expect(tiles).toContainText('Paddock');
  await expect(tiles).toContainText('Move 1 of your settlements to an empty buildable cell up to 2 hexes away.');
  await expect(tiles).toContainText('Used');
});

test('mobile location tiles: drawer shows ability descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await grantLocationTiles(page);

  const drawer = page.getByRole('region', { name: 'Game controls' });
  await drawer.getByLabel('Open game panel').click();

  const tiles = drawer.getByRole('region', { name: 'Your Location Tiles' });
  await expect(tiles.getByTestId('location-tile-card')).toHaveCount(2);
  await expect(tiles).toContainText('Place 1 extra settlement on any empty Grass cell.');
  await expect(tiles).toContainText('Move 1 of your settlements to an empty buildable cell up to 2 hexes away.');
});

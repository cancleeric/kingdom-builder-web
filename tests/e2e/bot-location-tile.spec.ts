import { test, expect, type Page } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

async function setupBotFarmTurn(page: Page) {
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { Location, Terrain } = await import('/src/core/terrain.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    const state = useGameStore.getState();
    for (const cell of state.board.getAllCells()) {
      cell.terrain = Terrain.Grass;
      cell.location = undefined;
      cell.settlement = undefined;
    }

    useGameStore.setState({
      currentPlayerIndex: 1,
      phase: GamePhase.DrawCard,
      currentTerrainCard: null,
      deck: [{ terrain: Terrain.Grass }],
      validPlacements: [],
      players: state.players.map((player, index) =>
        index === 1
          ? {
              ...player,
              isBot: true,
              settlements: [],
              remainingSettlements: 40,
              tiles: [{ location: Location.Farm, usedThisTurn: false }],
            }
          : player
      ),
    });
  });
}

async function botTileResult(page: Page) {
  return page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const state = useGameStore.getState();
    const bot = state.players[1];
    const tileAction = state.history.find(action => action.type === 'TILE_PLACEMENT');

    return {
      currentPlayerIndex: state.currentPlayerIndex,
      phase: state.phase,
      botSettlements: bot.settlements.length,
      botRemaining: bot.remainingSettlements,
      tileAction,
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
});

test('bot uses a placement location tile during its automatic turn', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();
  await setupBotFarmTurn(page);

  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    useGameStore.getState().triggerBotTurn();
  });

  await expect.poll(async () => {
    const result = await botTileResult(page);
    return {
      currentPlayerIndex: result.currentPlayerIndex,
      phase: result.phase,
      botSettlements: result.botSettlements,
      hasTileAction: !!result.tileAction,
    };
  }, { timeout: 5000 }).toEqual({
    currentPlayerIndex: 0,
    phase: 'DrawCard',
    botSettlements: 4,
    hasTileAction: true,
  });

  const result = await botTileResult(page);
  expect(result.currentPlayerIndex).toBe(0);
  expect(result.phase).toBe('DrawCard');
  expect(result.botSettlements).toBe(4);
  expect(result.botRemaining).toBe(36);
  expect(result.tileAction).toMatchObject({
    type: 'TILE_PLACEMENT',
    playerId: 2,
    tile: 'Farm',
  });
});
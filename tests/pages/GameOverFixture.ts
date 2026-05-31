import { expect, type Page } from '@playwright/test';
import { ObjectiveCard } from '../../src/core/scoring';
import { GamePhase } from '../../src/types';
import type { Player, PlayerScore } from '../../src/types';

interface GameOverFixtureOptions {
  players?: Player[];
  finalScores?: PlayerScore[];
  objectiveCards?: ObjectiveCard[];
}

const defaultPlayers: Player[] = [
  {
    id: 1,
    name: 'Player 1',
    color: '#FF6B6B',
    settlements: [],
    remainingSettlements: 0,
    tiles: [],
    isBot: false,
  },
  {
    id: 2,
    name: 'Player 2',
    color: '#4ECDC4',
    settlements: [],
    remainingSettlements: 0,
    tiles: [],
    isBot: true,
  },
];

const defaultObjectiveCards = [
  ObjectiveCard.Farmers,
  ObjectiveCard.Hermits,
  ObjectiveCard.Merchants,
];

const defaultFinalScores: PlayerScore[] = [
  {
    playerId: 1,
    castleScore: 6,
    objectiveScores: [
      { card: ObjectiveCard.Farmers, score: 9 },
      { card: ObjectiveCard.Hermits, score: 4 },
      { card: ObjectiveCard.Merchants, score: 8 },
    ],
    totalScore: 27,
  },
  {
    playerId: 2,
    castleScore: 3,
    objectiveScores: [
      { card: ObjectiveCard.Farmers, score: 6 },
      { card: ObjectiveCard.Hermits, score: 3 },
      { card: ObjectiveCard.Merchants, score: 4 },
    ],
    totalScore: 16,
  },
];

export async function openSavedGameOver(
  page: Page,
  options: GameOverFixtureOptions = {}
): Promise<void> {
  const players = options.players ?? defaultPlayers;
  const objectiveCards = options.objectiveCards ?? defaultObjectiveCards;
  const finalScores = options.finalScores ?? defaultFinalScores;

  await page.addInitScript(
    ({ players, objectiveCards, finalScores }) => {
      localStorage.clear();
      localStorage.setItem('i18nextLng', 'en');
      localStorage.setItem(
        'kingdom-builder-save',
        JSON.stringify({
          saveVersion: 1,
          state: {
            board: { width: 12, height: 12, cells: [] },
            players,
            currentPlayerIndex: 0,
            phase: 'GameOver',
            currentTerrainCard: null,
            remainingPlacements: 0,
            deck: [],
            acquiredLocations: [],
            objectiveCards,
            finalScores,
            selectedCell: null,
            validPlacements: [],
            placementsThisTurn: [],
            activeTile: null,
            tileMoveSources: [],
            tileMoveFrom: null,
            tileMoveDestinations: [],
            history: [],
            canUndo: false,
            undoSnapshot: null,
            undoUsedThisTurn: false,
            turnNumber: 12,
            gameOptions: { boardSize: 'small', objectiveCount: 3, enableUndo: true },
          },
        })
      );
    },
    { players, objectiveCards, finalScores }
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Continue/i }).click();
  await expect(page.getByRole('heading', { name: /Game Over/i })).toBeVisible();
}

export { defaultPlayers, defaultObjectiveCards, defaultFinalScores, GamePhase };

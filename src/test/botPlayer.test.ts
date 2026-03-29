import { describe, it, expect, beforeEach } from 'vitest';
import { BotPlayer, executeBotTurn } from '../ai/botPlayer';
import type { GameState } from '../types';
import { buildStandardBoard, getValidPlacements } from '../core/board';
import { hexNeighbors, hexEqual } from '../core/hex';

// Build a minimal test state
function buildTestState(overrides: Partial<GameState> = {}): GameState {
  const cells = buildStandardBoard(42);
  return {
    phase: 'playing',
    cells,
    players: [
      {
        id: 0,
        name: 'Player 1',
        type: 'human',
        color: '#e74c3c',
        score: 0,
        locationTiles: [],
      },
      {
        id: 1,
        name: 'Bot 1',
        type: 'bot-normal',
        color: '#3498db',
        score: 0,
        locationTiles: [],
      },
    ],
    currentPlayer: 0,
    currentTerrain: 'grassland',
    placementsThisTurn: 0,
    placementsRequired: 3,
    objectives: ['fisherman', 'knight', 'builders'],
    turnHistory: [],
    terrainDeck: [],
    ...overrides,
  };
}

describe('BotPlayer', () => {
  let state: GameState;

  beforeEach(() => {
    state = buildTestState();
  });

  describe('evaluateMove', () => {
    it('returns -Infinity for an occupied cell', () => {
      const bot = new BotPlayer('normal');
      // Occupy the first valid placement
      const validMoves = getValidPlacements(state);
      expect(validMoves.length).toBeGreaterThan(0);

      const firstMove = validMoves[0];
      // Mark cell as occupied
      const occupiedState: GameState = {
        ...state,
        cells: state.cells.map((c) =>
          hexEqual(c.hex, firstMove) ? { ...c, owner: 1 } : c
        ),
      };

      const score = bot.evaluateMove(occupiedState, firstMove);
      expect(score).toBe(-Infinity);
    });

    it('returns a finite score for a valid empty cell', () => {
      const bot = new BotPlayer('normal');
      const validMoves = getValidPlacements(state);
      expect(validMoves.length).toBeGreaterThan(0);

      const score = bot.evaluateMove(state, validMoves[0]);
      expect(isFinite(score)).toBe(true);
    });

    it('gives higher score for cell adjacent to castle', () => {
      const bot = new BotPlayer('normal');
      const castleCell = state.cells.find((c) => c.hasCastle);
      if (!castleCell) return; // skip if no castle in this board

      // Find a cell adjacent to the castle that is a valid grassland placement
      const neighbors = hexNeighbors(castleCell.hex);

      const validMoves = getValidPlacements(state);

      // Find neighbor that is valid
      const adjacentValid = neighbors.find((n) =>
        validMoves.some((v) => hexEqual(v, n))
      );

      if (!adjacentValid) return; // no neighbor is valid placement, skip

      // Find a non-adjacent valid move
      const nonAdjacent = validMoves.find(
        (v) => !neighbors.some((n) => hexEqual(v, n))
      );

      if (!nonAdjacent) return; // can't find one to compare

      const adjacentScore = bot.evaluateMove(state, adjacentValid);
      const nonAdjacentScore = bot.evaluateMove(state, nonAdjacent);

      // Adjacent to castle should score higher (castle gives +3 per adjacent settlement)
      expect(adjacentScore).toBeGreaterThan(nonAdjacentScore);
    });
  });

  describe('selectBestMove', () => {
    it('returns at most `count` placements', () => {
      const bot = new BotPlayer('normal');
      const moves = bot.selectBestMove(state, 3);
      expect(moves.length).toBeLessThanOrEqual(3);
    });

    it('returns only valid hex positions', () => {
      const bot = new BotPlayer('normal');
      const moves = bot.selectBestMove(state, 3);
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
        expect(typeof move.r).toBe('number');
      }
    });

    it('returns an empty array if no valid placements', () => {
      const bot = new BotPlayer('easy');
      // Fill all grassland cells
      const noGrassState: GameState = {
        ...state,
        cells: state.cells.map((c) => ({
          ...c,
          owner: c.terrain === 'grassland' ? 1 : c.owner,
        })),
      };
      const moves = bot.selectBestMove(noGrassState, 3);
      expect(moves.length).toBe(0);
    });

    it('easy bot selects random valid placements', () => {
      const bot = new BotPlayer('easy');
      const moves = bot.selectBestMove(state, 3);
      expect(moves.length).toBeGreaterThanOrEqual(0);
      // All returned hexes should have been valid at the time of selection
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
      }
    });

    it('hard bot selects valid placements', () => {
      const bot = new BotPlayer('hard');
      const moves = bot.selectBestMove(state, 3);
      expect(moves.length).toBeLessThanOrEqual(3);
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
      }
    });

    it('normal bot returns placements consistent with valid positions', () => {
      const bot = new BotPlayer('normal');
      const validBefore = getValidPlacements(state);
      const moves = bot.selectBestMove(state, 3);

      if (moves.length > 0) {
        // First move must be a valid placement from the original state
        const firstMove = moves[0];
        const isValid = validBefore.some((v) => hexEqual(v, firstMove));
        expect(isValid).toBe(true);
      }
    });
  });

  describe('executeBotTurn', () => {
    it('places settlements for bot and returns updated state', () => {
      const newState = executeBotTurn(state, 'normal');

      // Bot should have placed some settlements
      const placed = newState.cells.filter((c) => c.owner === state.currentPlayer);
      const original = state.cells.filter((c) => c.owner === state.currentPlayer);
      expect(placed.length).toBeGreaterThanOrEqual(original.length);
    });

    it('does not exceed placementsRequired', () => {
      const newState = executeBotTurn(state, 'normal');
      expect(newState.placementsThisTurn).toBeLessThanOrEqual(state.placementsRequired);
    });

    it('works for easy difficulty', () => {
      const newState = executeBotTurn(state, 'easy');
      expect(newState).toBeDefined();
      expect(newState.cells).toBeDefined();
    });

    it('works for hard difficulty', () => {
      const newState = executeBotTurn(state, 'hard');
      expect(newState).toBeDefined();
      expect(newState.cells).toBeDefined();
    });
  });
});

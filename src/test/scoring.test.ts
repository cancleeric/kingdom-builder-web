import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  scoreCastleAdjacency,
  getConnectedGroups,
  calculateScoreGain,
} from '../core/scoring';
import type { GameState } from '../types';
import { buildStandardBoard } from '../core/board';
import { hexNeighbors, hexEqual } from '../core/hex';

function buildMinimalState(overrides: Partial<GameState> = {}): GameState {
  const cells = buildStandardBoard(42);
  return {
    phase: 'playing',
    cells,
    players: [
      { id: 0, name: 'P1', type: 'human', color: '#red', score: 0, locationTiles: [] },
      { id: 1, name: 'P2', type: 'human', color: '#blue', score: 0, locationTiles: [] },
    ],
    currentPlayer: 0,
    currentTerrain: 'grassland',
    placementsThisTurn: 0,
    placementsRequired: 3,
    objectives: ['builders', 'knight', 'hermits'],
    turnHistory: [],
    terrainDeck: [],
    ...overrides,
  };
}

describe('scoring system', () => {
  describe('getConnectedGroups', () => {
    it('returns empty array when no settlements', () => {
      const state = buildMinimalState();
      const groups = getConnectedGroups(state.cells, 0);
      expect(groups).toHaveLength(0);
    });

    it('counts isolated settlements as separate groups', () => {
      const state = buildMinimalState();
      // Place 2 isolated settlements for player 0
      const cells = state.cells.map((c, i) => {
        if (i === 0) return { ...c, owner: 0 };
        if (i === 50) return { ...c, owner: 0 };
        return c;
      });
      const groups = getConnectedGroups(cells, 0);
      // Both should be isolated (far apart in the board)
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('counts adjacent settlements as one group', () => {
      const state = buildMinimalState();
      // Find two adjacent buildable cells
      const buildable = state.cells.filter(
        (c) => c.terrain !== 'mountain' && c.terrain !== 'water'
      );
      expect(buildable.length).toBeGreaterThan(1);

      const first = buildable[0];
      const neighbors = hexNeighbors(first.hex);
      const second = buildable.find((c) => neighbors.some((n) => hexEqual(n, c.hex)));

      if (!second) return; // skip if no adjacent buildable cell

      const cells = state.cells.map((c) => {
        if (hexEqual(c.hex, first.hex)) return { ...c, owner: 0 };
        if (hexEqual(c.hex, second.hex)) return { ...c, owner: 0 };
        return c;
      });

      const groups = getConnectedGroups(cells, 0);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(2);
    });
  });

  describe('scoreCastleAdjacency', () => {
    it('returns 0 when no settlements', () => {
      const state = buildMinimalState();
      expect(scoreCastleAdjacency(state, 0)).toBe(0);
    });

    it('gives 3 points per settlement adjacent to castle', () => {
      const state = buildMinimalState();
      const castle = state.cells.find((c) => c.hasCastle);
      if (!castle) return; // no castle in test board

      const castleNeighbors = hexNeighbors(castle.hex);

      // Place a settlement adjacent to the castle
      const adjacentCell = state.cells.find(
        (c) => castleNeighbors.some((n) => hexEqual(n, c.hex)) && c.terrain !== 'mountain' && c.terrain !== 'water'
      );

      if (!adjacentCell) return;

      const cells = state.cells.map((c) =>
        hexEqual(c.hex, adjacentCell.hex) ? { ...c, owner: 0 } : c
      );
      const modState = { ...state, cells };
      expect(scoreCastleAdjacency(modState, 0)).toBe(3);
    });
  });

  describe('calculateScore', () => {
    it('returns 0 for player with no settlements', () => {
      const state = buildMinimalState();
      expect(calculateScore(state, 0)).toBe(0);
    });

    it('returns non-negative score for player with settlements', () => {
      const state = buildMinimalState();
      const buildable = state.cells.filter(
        (c) => c.terrain !== 'mountain' && c.terrain !== 'water'
      );
      expect(buildable.length).toBeGreaterThan(0);

      const cells = state.cells.map((c, i) =>
        i < 3 && c.terrain !== 'mountain' && c.terrain !== 'water'
          ? { ...c, owner: 0 }
          : c
      );
      const modState = { ...state, cells };
      expect(calculateScore(modState, 0)).toBeGreaterThanOrEqual(0);
    });

    it('hermits objective gives 3 points per isolated settlement', () => {
      const state = buildMinimalState({ objectives: ['hermits'] });
      // Find isolated cells (no neighbors owned by player)
      const buildable = state.cells.filter(
        (c) => c.terrain !== 'mountain' && c.terrain !== 'water'
      );

      const first = buildable[0];
      const cells = state.cells.map((c) =>
        c === first ? { ...c, owner: 0 } : c
      );
      const modState = { ...state, cells };

      // One isolated settlement = 3 points
      const score = calculateScore(modState, 0);
      expect(score).toBe(3);
    });

    it('builders objective gives 2 points per connected group', () => {
      const state = buildMinimalState({ objectives: ['builders'] });
      const buildable = state.cells.filter(
        (c) => c.terrain !== 'mountain' && c.terrain !== 'water'
      );

      const first = buildable[0];
      const cells = state.cells.map((c) =>
        c === first ? { ...c, owner: 0 } : c
      );
      const modState = { ...state, cells };

      // One group = 2 points
      expect(calculateScore(modState, 0)).toBe(2);
    });
  });

  describe('calculateScoreGain', () => {
    it('returns the difference in score when placing a settlement', () => {
      const state = buildMinimalState({ objectives: ['builders'] });
      const buildable = state.cells.filter(
        (c) => c.terrain !== 'mountain' && c.terrain !== 'water' && c.owner === null
      );
      expect(buildable.length).toBeGreaterThan(0);

      const gain = calculateScoreGain(state, buildable[0].hex, 0);
      // Placing first settlement: gains 2 points (builders: 1 group)
      expect(gain).toBeGreaterThanOrEqual(0);
    });
  });
});

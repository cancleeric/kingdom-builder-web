/**
 * Supplemental unit tests for src/core/rules.ts
 *
 * Targets currently uncovered functions:
 *  - isValidPlacement
 *  - getSettlementNeighbors
 *  - isAdjacentToLocation
 *  - countSettlementsAdjacentToCastles
 *
 * Also adds more edge-case coverage for getValidPlacements branches.
 *
 * ⛔ Does NOT modify any src/core/ behaviour — only adds tests.
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import type { HexCell } from '../types';
import {
  getValidPlacements,
  isValidPlacement,
  getSettlementNeighbors,
  isAdjacentToLocation,
  countSettlementsAdjacentToCastles,
} from '../core/rules';

// ── Board helpers ─────────────────────────────────────────────────────────────

/** Create a small board and populate it with given cells. */
function makeBoard(cells: HexCell[]): Board {
  const board = new Board(20, 20);
  for (const cell of cells) {
    board.setCell(cell);
  }
  return board;
}

function grassCell(q: number, r: number, settlement?: number): HexCell {
  return { coord: { q, r }, terrain: Terrain.Grass, settlement };
}

function forestCell(q: number, r: number, settlement?: number): HexCell {
  return { coord: { q, r }, terrain: Terrain.Forest, settlement };
}

function waterCell(q: number, r: number): HexCell {
  return { coord: { q, r }, terrain: Terrain.Water };
}

function castleCell(q: number, r: number): HexCell {
  return { coord: { q, r }, terrain: Terrain.Grass, location: Location.Castle };
}

function locationCell(q: number, r: number, loc: Location): HexCell {
  return { coord: { q, r }, terrain: Terrain.Grass, location: loc };
}

// ── getValidPlacements — additional branch coverage ───────────────────────────

describe('getValidPlacements — no matching terrain cells', () => {
  it('returns [] when no cells of the given terrain exist', () => {
    const board = makeBoard([forestCell(0, 0), forestCell(1, 0)]);
    const result = getValidPlacements(board, Terrain.Desert, 1, []);
    expect(result).toHaveLength(0);
  });

  it('returns [] when all matching cells are already occupied', () => {
    const board = makeBoard([
      grassCell(0, 0, 1),
      grassCell(1, 0, 2),
    ]);
    const result = getValidPlacements(board, Terrain.Grass, 1, []);
    expect(result).toHaveLength(0);
  });
});

describe('getValidPlacements — adjacency fallback', () => {
  it('falls back to all matching terrain when no adjacent free cells exist', () => {
    // Player placed at (0,0). The board has grass only at remote (10, 10) — no adjacency possible.
    const board = makeBoard([
      grassCell(0, 0, 1),   // occupied by player 1 (already placed this turn)
      grassCell(10, 10),    // far away, free
    ]);
    // Simulate: first placement was at (0,0) this turn.
    // Second placement must be adjacent to (0,0), but there are no adjacent free grass cells.
    // Fallback: return all free grass cells = [(10,10)]
    const result = getValidPlacements(board, Terrain.Grass, 1, [{ q: 0, r: 0 }]);
    expect(result).toContainEqual({ q: 10, r: 10 });
  });
});

// ── isValidPlacement ──────────────────────────────────────────────────────────

describe('isValidPlacement', () => {
  it('returns true for a coord that is in the valid placements list', () => {
    const board = makeBoard([
      grassCell(0, 0),
      grassCell(1, 0),
    ]);
    // First placement (placementsThisTurn=[]) → any grass cell is valid
    const result = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Grass, 1);
    expect(result).toBe(true);
  });

  it('returns false for a coord on the wrong terrain', () => {
    const board = makeBoard([grassCell(0, 0), forestCell(1, 0)]);
    // Forest card but testing a grass coord
    const result = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    expect(result).toBe(false);
  });

  it('returns false for an occupied cell', () => {
    const board = makeBoard([grassCell(0, 0, 1)]);
    const result = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Grass, 1);
    expect(result).toBe(false);
  });

  it('returns false for a non-buildable terrain (Water)', () => {
    const board = makeBoard([waterCell(0, 0)]);
    const result = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Water, 1);
    expect(result).toBe(false);
  });

  it('returns false for a coord that does not exist in the board', () => {
    const board = makeBoard([grassCell(2, 2)]);
    const result = isValidPlacement(board, { q: 99, r: 99 }, Terrain.Grass, 1);
    expect(result).toBe(false);
  });
});

// ── getSettlementNeighbors ────────────────────────────────────────────────────

describe('getSettlementNeighbors', () => {
  it('returns empty array when player has no settlements', () => {
    const board = makeBoard([grassCell(0, 0), grassCell(1, 0)]);
    const result = getSettlementNeighbors(board, 1);
    expect(result).toHaveLength(0);
  });

  it('returns neighboring empty cells of player settlements', () => {
    // Player 1 at (0,0); neighbor (1,0) and (0,1) are free grass
    const board = makeBoard([
      grassCell(0, 0, 1),   // player 1 settlement
      grassCell(1, 0),      // free neighbor
      grassCell(0, 1),      // free neighbor
    ]);
    const result = getSettlementNeighbors(board, 1);
    const coords = result.map(c => c.coord);
    expect(coords).toContainEqual({ q: 1, r: 0 });
    expect(coords).toContainEqual({ q: 0, r: 1 });
  });

  it('excludes cells that are already occupied', () => {
    // Neighbor (1,0) is occupied by another player
    const board = makeBoard([
      grassCell(0, 0, 1),   // player 1
      grassCell(1, 0, 2),   // occupied by player 2
    ]);
    const result = getSettlementNeighbors(board, 1);
    const coords = result.map(c => c.coord);
    expect(coords).not.toContainEqual({ q: 1, r: 0 });
  });

  it('deduplicates neighbors shared by multiple settlements', () => {
    // Two settlements both adjacent to (1,0)
    const board = makeBoard([
      grassCell(0, 0, 1),
      grassCell(2, 0, 1),   // both adjacent to (1,0) on axial grid? depends on hex layout
      grassCell(1, 0),
    ]);
    const result = getSettlementNeighbors(board, 1);
    const coords = result.map(c => c.coord);
    // No duplicate for (1,0)
    const deduped = coords.filter(c => c.q === 1 && c.r === 0);
    expect(deduped.length).toBeLessThanOrEqual(1);
  });
});

// ── isAdjacentToLocation ──────────────────────────────────────────────────────

describe('isAdjacentToLocation', () => {
  it('returns false when player has no settlements', () => {
    const board = makeBoard([locationCell(0, 0, Location.Farm)]);
    expect(isAdjacentToLocation(board, 1, Location.Farm)).toBe(false);
  });

  it('returns true when a settlement is adjacent to the given location', () => {
    // (0,0) has Farm; (1,0) is adjacent (hex neighbor). Player 1 at (1,0).
    const board = makeBoard([
      { coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Farm },
      grassCell(1, 0, 1),
    ]);
    expect(isAdjacentToLocation(board, 1, Location.Farm)).toBe(true);
  });

  it('returns false when no settlement is adjacent to location', () => {
    const board = makeBoard([
      { coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Farm },
      grassCell(10, 10, 1),   // far away
    ]);
    expect(isAdjacentToLocation(board, 1, Location.Farm)).toBe(false);
  });

  it('returns false for a different location type on adjacent cell', () => {
    const board = makeBoard([
      { coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Harbor },
      grassCell(1, 0, 1),
    ]);
    // Checking Farm adjacency but the neighbor has Harbor
    expect(isAdjacentToLocation(board, 1, Location.Farm)).toBe(false);
  });
});

// ── countSettlementsAdjacentToCastles ─────────────────────────────────────────

describe('countSettlementsAdjacentToCastles', () => {
  it('returns 0 when player has no settlements', () => {
    const board = makeBoard([castleCell(0, 0)]);
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(0);
  });

  it('returns 0 when no settlement is adjacent to a castle', () => {
    const board = makeBoard([
      castleCell(0, 0),
      grassCell(10, 10, 1),   // far from castle
    ]);
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(0);
  });

  it('counts 1 when one settlement is adjacent to a castle', () => {
    // Castle at (0,0); settlement at (1,0) which is a hex neighbor
    const board = makeBoard([
      castleCell(0, 0),
      grassCell(1, 0, 1),
    ]);
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(1);
  });

  it('counts multiple settlements adjacent to the same castle', () => {
    // Castle at (0,0); two of its neighbors both have player settlements
    const board = makeBoard([
      castleCell(0, 0),
      grassCell(1, 0, 1),
      grassCell(0, 1, 1),
    ]);
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(2);
  });

  it('only counts the queried player, not other players', () => {
    const board = makeBoard([
      castleCell(0, 0),
      grassCell(1, 0, 1),   // player 1
      grassCell(0, 1, 2),   // player 2
    ]);
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(1);
    expect(countSettlementsAdjacentToCastles(board, 2)).toBe(1);
  });

  it('counts settlement adjacent to multiple castles only once', () => {
    // One settlement between two castles — it's adjacent to both,
    // but countSettlementsAdjacentToCastles counts per-settlement
    const board = makeBoard([
      castleCell(0, 0),
      castleCell(2, 0),
      grassCell(1, 0, 1),   // between both castles
    ]);
    // The settlement at (1,0) is adjacent to both castles;
    // the function counts settlements, not adjacencies,
    // so the settlement is counted once
    expect(countSettlementsAdjacentToCastles(board, 1)).toBe(1);
  });
});

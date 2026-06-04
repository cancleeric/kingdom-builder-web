import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import {
  checkTileAcquisition,
  applyAdjacentIfPossible,
  getFarmPlacements,
  getHarborPlacements,
  getOasisPlacements,
  getTowerPlacements,
  getOraclePlacements,
  getTavernPlacements,
  getExtraPlacementPositions,
  getPaddockDestinations,
  getBarnDestinations,
  getMovementOptions,
  executeMoveTile,
} from './location';
import { hexToKey } from './hex';

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function makeCell(
  q: number,
  r: number,
  terrain: Terrain,
  location?: Location,
  settlement?: number
) {
  return { coord: { q, r }, terrain, location, settlement };
}

// ────────────────────────────────────────────────────
// checkTileAcquisition
// ────────────────────────────────────────────────────

describe('checkTileAcquisition', () => {
  it('returns location when settlement is placed adjacent to a location hex', () => {
    const board = new Board(10, 10);
    // Farm tile at (1, 0)
    board.setCell(makeCell(1, 0, Terrain.Grass, Location.Farm));
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const acquired = new Set<string>();
    const result = checkTileAcquisition(board, { q: 0, r: 0 }, acquired);
    expect(result).toContain(Location.Farm);
  });

  it('does not return Castle location', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(1, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = checkTileAcquisition(board, { q: 0, r: 0 }, new Set());
    expect(result).not.toContain(Location.Castle);
  });

  it('does not return already-acquired locations', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(1, 0, Terrain.Grass, Location.Farm));
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const alreadyAcquired = new Set([hexToKey({ q: 1, r: 0 })]);
    const result = checkTileAcquisition(board, { q: 0, r: 0 }, alreadyAcquired);
    expect(result).toHaveLength(0);
  });

  it('returns multiple locations when adjacent to multiple location hexes', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(1, 0, Terrain.Grass, Location.Farm));
    board.setCell(makeCell(0, 1, Terrain.Desert, Location.Oasis));
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = checkTileAcquisition(board, { q: 0, r: 0 }, new Set());
    expect(result).toContain(Location.Farm);
    expect(result).toContain(Location.Oasis);
  });
});

// ────────────────────────────────────────────────────
// applyAdjacentIfPossible helper
// ────────────────────────────────────────────────────

describe('applyAdjacentIfPossible', () => {
  it('returns only adjacent candidates when player has adjacent settlements', () => {
    const board = new Board(10, 10);
    // Player settlement at (0, 0)
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    // Adjacent grass (1, 0) and far grass (5, 5)
    board.setCell(makeCell(1, 0, Terrain.Grass));
    board.setCell(makeCell(5, 5, Terrain.Grass));

    const candidates = [{ q: 1, r: 0 }, { q: 5, r: 5 }];
    const result = applyAdjacentIfPossible(board, candidates, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ q: 1, r: 0 });
  });

  it('returns all candidates when no candidate is adjacent to player settlements', () => {
    const board = new Board(10, 10);
    // Player settlement at (0, 0)
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    // Far candidates not adjacent to (0, 0)
    board.setCell(makeCell(8, 8, Terrain.Grass));
    board.setCell(makeCell(9, 9, Terrain.Grass));

    const candidates = [{ q: 8, r: 8 }, { q: 9, r: 9 }];
    const result = applyAdjacentIfPossible(board, candidates, 1);
    expect(result).toHaveLength(2);
  });

  it('returns all candidates when player has no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    board.setCell(makeCell(1, 0, Terrain.Grass));

    const candidates = [{ q: 0, r: 0 }, { q: 1, r: 0 }];
    const result = applyAdjacentIfPossible(board, candidates, 1);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when candidates is empty', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));

    const result = applyAdjacentIfPossible(board, [], 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Farm placements
// ────────────────────────────────────────────────────

describe('getFarmPlacements', () => {
  it('returns only adjacent grass cells when player has adjacent settlements', () => {
    const board = new Board(10, 10);
    // Player settlement on non-grass cell
    board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass)); // adjacent to settlement
    board.setCell(makeCell(5, 5, Terrain.Grass)); // far grass, not adjacent

    const result = getFarmPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('1,0');
    expect(keys).not.toContain('5,5');
  });

  it('returns all grass cells when no grass is adjacent to player settlements', () => {
    const board = new Board(10, 10);
    // Player settlement at (0, 0), grass cells far away
    board.setCell(makeCell(0, 0, Terrain.Mountain, undefined, 1)); // not grass; no adjacent grass
    board.setCell(makeCell(8, 8, Terrain.Grass));
    board.setCell(makeCell(9, 8, Terrain.Grass));

    const result = getFarmPlacements(board, 1);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const keys = result.map(hexToKey);
    expect(keys).toContain('8,8');
    expect(keys).toContain('9,8');
  });

  it('returns all grass cells when player has no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // occupied – excluded
    board.setCell(makeCell(2, 0, Terrain.Forest));

    const result = getFarmPlacements(board, 2); // player 2 has no settlements
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ q: 0, r: 0 });
  });
});

// ────────────────────────────────────────────────────
// Harbor placements (Phase 2 territory – minimal smoke test, not changed)
// ────────────────────────────────────────────────────

describe('getHarborPlacements', () => {
  it('returns buildable cells adjacent to water', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Water));
    board.setCell(makeCell(1, 0, Terrain.Grass)); // adjacent to water
    board.setCell(makeCell(5, 5, Terrain.Grass)); // not adjacent to water

    const result = getHarborPlacements(board);
    const keys = result.map(hexToKey);
    expect(keys).toContain('1,0');
    expect(keys).not.toContain('5,5');
  });

  it('excludes occupied cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Water));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // occupied

    const result = getHarborPlacements(board);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Oasis placements
// ────────────────────────────────────────────────────

describe('getOasisPlacements', () => {
  it('returns only adjacent desert cells when player has adjacent settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement
    board.setCell(makeCell(1, 0, Terrain.Desert)); // adjacent desert
    board.setCell(makeCell(7, 7, Terrain.Desert)); // far desert

    const result = getOasisPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('1,0');
    expect(keys).not.toContain('7,7');
  });

  it('returns all desert cells when no desert is adjacent to player settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Mountain, undefined, 1));
    board.setCell(makeCell(8, 8, Terrain.Desert));
    board.setCell(makeCell(9, 8, Terrain.Desert));

    const result = getOasisPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('8,8');
    expect(keys).toContain('9,8');
  });

  it('returns all desert cells when player has no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Desert));
    board.setCell(makeCell(1, 0, Terrain.Desert, undefined, 1)); // occupied
    board.setCell(makeCell(2, 0, Terrain.Grass));

    const result = getOasisPlacements(board, 2);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ q: 0, r: 0 });
  });
});

// ────────────────────────────────────────────────────
// Tower placements
// ────────────────────────────────────────────────────

describe('getTowerPlacements', () => {
  it('returns cells on map border (missing neighbor)', () => {
    const board = new Board(10, 10);
    // Cell at (0,0) has neighbors outside the board
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = getTowerPlacements(board, 1);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(true);
  });

  it('does NOT return cells that are only adjacent to Mountain but not on edge', () => {
    const board = new Board(10, 10);
    // Interior mountain surrounded by other cells – the adjacent cell must NOT
    // appear in Tower results if it is not on the board edge.
    // Cell (6,5) is adjacent to mountain at (5,5).
    // Its 6 neighbours (per HEX_DIRECTIONS):
    //   E=(7,5)  NE=(7,4)  NW=(6,4)  W=(5,5)  SW=(5,6)  SE=(6,6)
    // We must set ALL 6 so that board.getCell returns defined for each,
    // making (6,5) a fully interior (non-edge) cell.
    board.setCell(makeCell(5, 5, Terrain.Mountain));
    board.setCell(makeCell(6, 5, Terrain.Grass)); // adjacent to mountain, interior
    board.setCell(makeCell(7, 5, Terrain.Grass)); // E
    board.setCell(makeCell(7, 4, Terrain.Grass)); // NE
    board.setCell(makeCell(6, 4, Terrain.Grass)); // NW
    // W = (5,5) already set as Mountain above
    board.setCell(makeCell(5, 6, Terrain.Grass)); // SW
    board.setCell(makeCell(6, 6, Terrain.Grass)); // SE

    const result = getTowerPlacements(board, 1);
    // (6,5) should NOT be in result because it has all 6 neighbours defined
    // (not a border cell)
    expect(result.some(c => c.q === 6 && c.r === 5)).toBe(false);
  });

  it('excludes mountain cells themselves', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Mountain));

    const result = getTowerPlacements(board, 1);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(false);
  });

  it('returns only adjacent border cells when player has adjacent settlements', () => {
    const board = new Board(10, 10);
    // Put a settlement at (1, 0) – an interior cell
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    // Border cells adjacent to settlement
    board.setCell(makeCell(0, 0, Terrain.Grass)); // border (missing neighbours)
    // Far border cell
    board.setCell(makeCell(9, 9, Terrain.Grass)); // also border but far

    const candidates = getTowerPlacements(board, 1);
    const keys = candidates.map(hexToKey);
    // If (0,0) is adjacent to settlement and also border, it should appear
    if (keys.includes('9,9') && keys.includes('0,0')) {
      // Both are border – adjacent-if-possible means only adjacent ones returned
      // (0,0) is adjacent to (1,0); (9,9) is not
      expect(keys).toContain('0,0');
      expect(keys).not.toContain('9,9');
    }
  });
});

// ────────────────────────────────────────────────────
// Oracle placements
// ────────────────────────────────────────────────────

describe('getOraclePlacements', () => {
  it('returns cells of currentTerrain type, only adjacent when possible', () => {
    const board = new Board(10, 10);
    // Settlement at (0, 0), forest cell adjacent at (1, 0), far forest at (7, 7)
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Forest)); // adjacent forest
    board.setCell(makeCell(7, 7, Terrain.Forest)); // far forest

    const result = getOraclePlacements(board, 1, Terrain.Forest);
    const keys = result.map(hexToKey);
    // Has adjacent forest → only adjacent forest returned
    expect(keys).toContain('1,0');
    expect(keys).not.toContain('7,7');
  });

  it('returns all terrain-card-terrain cells when none are adjacent to settlements', () => {
    const board = new Board(10, 10);
    // Settlement at (0, 0), no adjacent desert
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(8, 8, Terrain.Desert));
    board.setCell(makeCell(9, 8, Terrain.Desert));

    const result = getOraclePlacements(board, 1, Terrain.Desert);
    const keys = result.map(hexToKey);
    expect(keys).toContain('8,8');
    expect(keys).toContain('9,8');
  });

  it('returns all terrain cells when player has no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    board.setCell(makeCell(1, 0, Terrain.Grass));

    const result = getOraclePlacements(board, 1, Terrain.Grass);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty list when there are no cells of that terrain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));

    const result = getOraclePlacements(board, 1, Terrain.Canyon);
    expect(result).toHaveLength(0);
  });

  it('excludes water cells (not buildable) even if currentTerrain were Water', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Water));

    // Oracle with water terrain → no buildable water cells
    const result = getOraclePlacements(board, 1, Terrain.Water);
    expect(result.some(c => c.q === 1 && c.r === 0)).toBe(false);
  });
});

// ────────────────────────────────────────────────────
// Tavern placements
// ────────────────────────────────────────────────────

describe('getTavernPlacements', () => {
  it('returns NO cells for a single-settlement row (run length 1)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass));
    board.setCell(makeCell(4, 2, Terrain.Grass));

    const result = getTavernPlacements(board, 1);
    // Run length = 1 → does NOT qualify
    expect(result).toHaveLength(0);
  });

  it('returns NO cells for a two-settlement row (run length 2)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(4, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass));
    board.setCell(makeCell(5, 2, Terrain.Grass));

    const result = getTavernPlacements(board, 1);
    // Run length = 2 → does NOT qualify
    expect(result).toHaveLength(0);
  });

  it('returns cells at ends of a 3-settlement consecutive row', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(4, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass)); // left extension
    board.setCell(makeCell(6, 2, Terrain.Grass)); // right extension

    const result = getTavernPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,2');
    expect(keys).toContain('6,2');
  });

  it('returns cells at ends of a multi-settlement run (≥3)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(4, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(6, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass)); // left extension
    board.setCell(makeCell(7, 2, Terrain.Grass)); // right extension

    const result = getTavernPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,2');
    expect(keys).toContain('7,2');
  });

  it('returns empty list if no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = getTavernPlacements(board, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// getExtraPlacementPositions dispatcher
// ────────────────────────────────────────────────────

describe('getExtraPlacementPositions', () => {
  it('returns farm placements for Farm tile', () => {
    const board = new Board(5, 5);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    const result = getExtraPlacementPositions(Location.Farm, board, 1);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(true);
  });

  it('returns oracle placements when currentTerrain is provided', () => {
    const board = new Board(5, 5);
    board.setCell(makeCell(0, 0, Terrain.Forest));
    const result = getExtraPlacementPositions(Location.Oracle, board, 1, Terrain.Forest);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(true);
  });

  it('returns empty for Oracle when currentTerrain is not provided', () => {
    const board = new Board(5, 5);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    const result = getExtraPlacementPositions(Location.Oracle, board, 1);
    expect(result).toHaveLength(0);
  });

  it('returns empty for movement tiles (Paddock)', () => {
    const board = new Board(5, 5);
    const result = getExtraPlacementPositions(Location.Paddock, board, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Paddock destinations (unchanged in Phase 1 – smoke tests)
// ────────────────────────────────────────────────────

describe('getPaddockDestinations', () => {
  it('returns buildable unoccupied cells within 2 hexes', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(1, 0, Terrain.Grass)); // distance 1
    board.setCell(makeCell(2, 0, Terrain.Grass)); // distance 2
    board.setCell(makeCell(3, 0, Terrain.Grass)); // distance 3 – excluded

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    const keys = result.map(hexToKey);
    expect(keys).toContain('1,0');
    expect(keys).toContain('2,0');
    expect(keys).not.toContain('3,0');
  });

  it('excludes occupied cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 2)); // occupied by other player

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    expect(result.some(c => c.q === 1 && c.r === 0)).toBe(false);
  });
});

// ────────────────────────────────────────────────────
// Barn destinations (unchanged in Phase 1 – smoke tests)
// ────────────────────────────────────────────────────

describe('getBarnDestinations', () => {
  it('returns all cells with the same terrain as the source', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(5, 5, Terrain.Grass)); // same terrain, far away
    board.setCell(makeCell(5, 6, Terrain.Forest)); // different terrain

    const result = getBarnDestinations(board, { q: 0, r: 0 });
    const keys = result.map(hexToKey);
    expect(keys).toContain('5,5');
    expect(keys).not.toContain('5,6');
  });
});

// ────────────────────────────────────────────────────
// getMovementOptions
// ────────────────────────────────────────────────────

describe('getMovementOptions', () => {
  it('returns options for Paddock tile', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass));

    const options = getMovementOptions(Location.Paddock, board, 1);
    expect(options).toHaveLength(1);
    expect(options[0].from).toEqual({ q: 0, r: 0 });
    expect(options[0].destinations.some(d => d.q === 1 && d.r === 0)).toBe(true);
  });

  it('returns options for Barn tile', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Desert, undefined, 1));
    board.setCell(makeCell(8, 8, Terrain.Desert));

    const options = getMovementOptions(Location.Barn, board, 1);
    expect(options).toHaveLength(1);
    expect(options[0].destinations.some(d => d.q === 8 && d.r === 8)).toBe(true);
  });

  it('returns empty for non-movement tiles', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    const options = getMovementOptions(Location.Farm, board, 1);
    expect(options).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// executeMoveTile
// ────────────────────────────────────────────────────

describe('executeMoveTile', () => {
  describe('Paddock', () => {
    it('moves settlement within 2 hexes', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(2, 0, Terrain.Grass));

      const success = executeMoveTile(
        Location.Paddock,
        board,
        1,
        { q: 0, r: 0 },
        { q: 2, r: 0 }
      );
      expect(success).toBe(true);
      expect(board.getSettlement({ q: 0, r: 0 })).toBeUndefined();
      expect(board.getSettlement({ q: 2, r: 0 })).toBe(1);
    });

    it('rejects move more than 2 hexes', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(3, 0, Terrain.Grass));

      const success = executeMoveTile(
        Location.Paddock,
        board,
        1,
        { q: 0, r: 0 },
        { q: 3, r: 0 }
      );
      expect(success).toBe(false);
    });
  });

  describe('Barn', () => {
    it('moves settlement to same terrain anywhere', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1));
      board.setCell(makeCell(9, 9, Terrain.Forest));

      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 9, r: 9 }
      );
      expect(success).toBe(true);
      expect(board.getSettlement({ q: 0, r: 0 })).toBeUndefined();
      expect(board.getSettlement({ q: 9, r: 9 })).toBe(1);
    });

    it('rejects move to different terrain', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1));
      board.setCell(makeCell(9, 9, Terrain.Grass));

      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 9, r: 9 }
      );
      expect(success).toBe(false);
    });
  });

  it('rejects move if source cell does not belong to player', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 2)); // different player
    board.setCell(makeCell(1, 0, Terrain.Grass));

    const success = executeMoveTile(
      Location.Paddock,
      board,
      1,
      { q: 0, r: 0 },
      { q: 1, r: 0 }
    );
    expect(success).toBe(false);
  });

  it('rejects move to occupied destination', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 2)); // occupied

    const success = executeMoveTile(
      Location.Paddock,
      board,
      1,
      { q: 0, r: 0 },
      { q: 1, r: 0 }
    );
    expect(success).toBe(false);
  });
});

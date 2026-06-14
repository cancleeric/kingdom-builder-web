import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import {
  checkTileAcquisition,
  applyAdjacentIfPossible,
  getFarmPlacements,
  getHarborPlacements,
  getHarborDestinations,
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
import { scoreFisherman } from './scoring';

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
// getHarborPlacements (deprecated – kept for API backwards-compat)
// Harbor is now a movement tile; getHarborPlacements is no longer called by
// the main code path. These smoke tests verify the function still works as
// documented (old placement behaviour), not the Phase 2 rules.
// ────────────────────────────────────────────────────

describe('getHarborPlacements (deprecated)', () => {
  it('returns buildable cells adjacent to water (old placement behaviour)', () => {
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
    // adjacent-if-possible: (0,0) is a border cell adjacent to the settlement (1,0)
    // → must be returned; (9,9) is a border cell NOT adjacent → must be excluded.
    // Unconditional asserts (a prior `if`-wrapped version could pass vacuously).
    expect(keys).toContain('0,0');
    expect(keys).not.toContain('9,9');
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

  it('returns empty for Harbor (now a movement tile in Phase 2)', () => {
    const board = new Board(5, 5);
    board.setCell(makeCell(0, 0, Terrain.Water));
    board.setCell(makeCell(1, 0, Terrain.Grass)); // was returned by old placement code
    const result = getExtraPlacementPositions(Location.Harbor, board, 1);
    expect(result).toHaveLength(0);
  });

  it('returns empty for Barn (movement tile)', () => {
    const board = new Board(5, 5);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass));
    const result = getExtraPlacementPositions(Location.Barn, board, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Paddock destinations (Phase 2: exactly 2 hexes in a straight hex direction)
// ────────────────────────────────────────────────────

describe('getPaddockDestinations', () => {
  it('returns cells exactly 2 steps in a straight hex direction (East)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(1, 0, Terrain.Grass)); // 1 step East – NOT valid (only 2 steps)
    board.setCell(makeCell(2, 0, Terrain.Grass)); // 2 steps East – valid

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,0');     // straight line 2 steps East ✓
    expect(keys).not.toContain('1,0'); // only 1 step – rejected
  });

  it('returns cells exactly 2 steps in multiple directions', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1)); // source at centre
    // East: (7,5), West: (3,5), SE: (5,7), NW: (5,3), NE: (7,3), SW: (3,7)
    board.setCell(makeCell(7, 5, Terrain.Grass));
    board.setCell(makeCell(3, 5, Terrain.Grass));
    board.setCell(makeCell(5, 7, Terrain.Grass));
    board.setCell(makeCell(5, 3, Terrain.Grass));
    board.setCell(makeCell(7, 3, Terrain.Grass));
    board.setCell(makeCell(3, 7, Terrain.Grass));

    const result = getPaddockDestinations(board, { q: 5, r: 5 });
    const keys = result.map(hexToKey);
    expect(keys).toContain('7,5'); // East
    expect(keys).toContain('3,5'); // West
    expect(keys).toContain('5,7'); // Southeast
    expect(keys).toContain('5,3'); // Northwest
    expect(keys).toContain('7,3'); // Northeast
    expect(keys).toContain('3,7'); // Southwest
  });

  it('does NOT include adjacent cells (distance 1)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass)); // East neighbour – distance 1

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    expect(result.some(c => c.q === 1 && c.r === 0)).toBe(false);
  });

  it('does NOT include distance-2 cells that are not in a straight hex direction', () => {
    // From (0,0), a hex at (1,1) is distance 2 (via cube coords) but NOT a straight direction
    // HEX_DIRECTIONS doubled are: (2,0),(2,-2),(0,-2),(-2,0),(-2,2),(0,2)
    // (1,1) is NOT in this set
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 1, Terrain.Grass)); // distance 2 but non-straight

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    expect(result.some(c => c.q === 1 && c.r === 1)).toBe(false);
  });

  it('excludes occupied cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 2)); // occupied at 2 steps East

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    expect(result.some(c => c.q === 2 && c.r === 0)).toBe(false);
  });

  it('can jump over an intermediate occupied cell', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 2)); // intermediate – occupied
    board.setCell(makeCell(2, 0, Terrain.Grass));               // destination – empty

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,0'); // can jump over (1,0)
  });

  it('excludes Mountain and Water destinations (not buildable)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 0, Terrain.Mountain)); // not buildable
    board.setCell(makeCell(0, 2, Terrain.Water));    // not buildable (Southeast direction: (0,2) = 2*SE(0,1))

    const result = getPaddockDestinations(board, { q: 0, r: 0 });
    const keys = result.map(hexToKey);
    expect(keys).not.toContain('2,0');
    expect(keys).not.toContain('0,2');
  });
});

// ────────────────────────────────────────────────────
// Barn destinations (Phase 2: terrain card terrain, not settlement terrain)
// ────────────────────────────────────────────────────

describe('getBarnDestinations', () => {
  it('returns cells matching currentTerrain (terrain card), not the settlement own terrain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source is Grass
    board.setCell(makeCell(5, 5, Terrain.Forest));               // Forest (terrain card terrain)
    board.setCell(makeCell(5, 6, Terrain.Grass));                // Grass (settlement own terrain, but NOT card)

    // Terrain card is Forest → only Forest cells returned
    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('5,5');    // Forest = card terrain ✓
    expect(keys).not.toContain('5,6'); // Grass = settlement terrain (not card) ✗
    expect(keys).not.toContain('0,0'); // source itself excluded
  });

  it('when settlement terrain matches card terrain, returns matching cells (degenerate case)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source is Grass
    board.setCell(makeCell(5, 5, Terrain.Grass));               // also Grass

    // Terrain card is also Grass → same terrain → returns Grass cells (not source)
    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Grass, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('5,5');
    expect(keys).not.toContain('0,0'); // source itself excluded
  });

  it('applies adjacent-if-possible: prefers destinations adjacent to player settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement being moved
    board.setCell(makeCell(3, 0, Terrain.Forest, undefined, 1)); // another player settlement (adjacent to 4,0)
    board.setCell(makeCell(4, 0, Terrain.Forest));               // Forest adj to settlement at (3,0)
    board.setCell(makeCell(9, 9, Terrain.Forest));               // far Forest

    // Card terrain = Forest. (4,0) is adjacent to player settlement (3,0).
    // adjacent-if-possible → only (4,0) returned
    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('4,0');
    expect(keys).not.toContain('9,9');
  });

  it('returns all card-terrain cells when none are adjacent to player settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(8, 8, Terrain.Desert));
    board.setCell(makeCell(9, 9, Terrain.Desert));

    // Card terrain = Desert. No Desert adjacent to player settlements → all Desert returned
    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Desert, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('8,8');
    expect(keys).toContain('9,9');
  });

  it('excludes occupied cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(5, 5, Terrain.Forest, undefined, 2)); // Forest but occupied

    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    expect(result.some(c => c.q === 5 && c.r === 5)).toBe(false);
  });

  it('from exclusion — only settlement is the one being moved: fallback to all card-terrain cells (no false adjacency from from)', () => {
    // Bug guard: when the player has only ONE settlement (the one being moved),
    // applyAdjacentIfPossible used to include `from` itself in the adjacency base,
    // causing its neighbours to appear in the adjacency set and wrongly filter
    // candidates.  After the fix, no OTHER settlements exist, so we must fall back
    // to returning ALL card-terrain candidates.
    const board = new Board(10, 10);
    // from is the only settlement (Grass at (0,0))
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    // Card terrain is Forest. Two Forest cells — neither is a neighbour of (0,0).
    // East of (0,0) = (1,0), Northeast = (1,-1), Northwest = (0,-1),
    // West = (-1,0), Southwest = (-1,1), Southeast = (0,1).
    // Use (8,8) and (9,9) — clearly not adjacent to (0,0).
    board.setCell(makeCell(8, 8, Terrain.Forest));
    board.setCell(makeCell(9, 9, Terrain.Forest));

    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    const keys = result.map(hexToKey);
    // Fallback: no OTHER settlements → return all Forest candidates
    expect(keys).toContain('8,8');
    expect(keys).toContain('9,9');
  });

  it('from exclusion — OTHER settlement exists: adjacency uses only OTHER, not from', () => {
    // Player has two settlements: from=(0,0) being moved, other=(3,0) staying.
    // Forest cell (4,0) is a neighbour of (3,0) [East].
    // Forest cell (1,0) is a neighbour of (0,0) [East = from's neighbour].
    // After fix, only (4,0) should appear (adjacent to OTHER); (1,0) must NOT
    // appear due to from's adjacency (from is excluded from the base).
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));  // from (being moved)
    board.setCell(makeCell(3, 0, Terrain.Grass, undefined, 1));  // OTHER settlement (stays)
    board.setCell(makeCell(4, 0, Terrain.Forest));               // Forest adj to OTHER ✓
    board.setCell(makeCell(1, 0, Terrain.Forest));               // Forest adj to from only ✗

    // Card terrain = Forest. Expected: only (4,0) returned (adj to OTHER settlement (3,0)).
    // (1,0) must NOT appear — it is adjacent to from, which should be excluded from base.
    const result = getBarnDestinations(board, { q: 0, r: 0 }, Terrain.Forest, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('4,0');
    expect(keys).not.toContain('1,0');
  });
});

// ────────────────────────────────────────────────────
// getMovementOptions
// ────────────────────────────────────────────────────

describe('getMovementOptions', () => {
  it('returns options for Paddock tile (straight 2-step destinations)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // source
    board.setCell(makeCell(2, 0, Terrain.Grass));               // 2 steps East (valid)
    board.setCell(makeCell(1, 0, Terrain.Grass));               // 1 step East (invalid for Paddock)

    const options = getMovementOptions(Location.Paddock, board, 1);
    expect(options).toHaveLength(1);
    expect(options[0].from).toEqual({ q: 0, r: 0 });
    // Must include the 2-step destination, NOT the 1-step neighbour
    expect(options[0].destinations.some(d => d.q === 2 && d.r === 0)).toBe(true);
    expect(options[0].destinations.some(d => d.q === 1 && d.r === 0)).toBe(false);
  });

  it('returns options for Barn tile using terrain card terrain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement on Grass
    board.setCell(makeCell(8, 8, Terrain.Desert));              // Desert = card terrain
    board.setCell(makeCell(7, 7, Terrain.Grass));               // Grass (own terrain, not card)

    // Card terrain = Desert
    const options = getMovementOptions(Location.Barn, board, 1, Terrain.Desert);
    expect(options).toHaveLength(1);
    // Destination is Desert (card terrain), not Grass (settlement terrain)
    expect(options[0].destinations.some(d => d.q === 8 && d.r === 8)).toBe(true);
    expect(options[0].destinations.some(d => d.q === 7 && d.r === 7)).toBe(false);
  });

  it('returns empty for Barn when no currentTerrain provided', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 5, Terrain.Desert));

    const options = getMovementOptions(Location.Barn, board, 1);
    expect(options).toHaveLength(0);
  });

  it('returns options for Harbor tile (Water destinations)', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement
    board.setCell(makeCell(5, 5, Terrain.Water));               // unoccupied Water

    const options = getMovementOptions(Location.Harbor, board, 1);
    expect(options).toHaveLength(1);
    expect(options[0].from).toEqual({ q: 0, r: 0 });
    expect(options[0].destinations.some(d => d.q === 5 && d.r === 5)).toBe(true);
  });

  it('returns empty for non-movement tiles (Farm)', () => {
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
  describe('Paddock (Phase 2: straight 2 steps)', () => {
    it('accepts move exactly 2 steps in a straight hex direction (East)', () => {
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

    it('rejects move of exactly 1 step (not 2)', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
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

    it('rejects move of 3 hexes along a direction', () => {
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

    it('rejects non-straight diagonal move (distance 2 but not a straight direction)', () => {
      // From (0,0) to (1,1): distance=2 but NOT one of the 6 straight direction × 2
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(1, 1, Terrain.Grass));

      const success = executeMoveTile(
        Location.Paddock,
        board,
        1,
        { q: 0, r: 0 },
        { q: 1, r: 1 }
      );
      expect(success).toBe(false);
    });

    it('rejects move to Mountain (not buildable)', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(2, 0, Terrain.Mountain));

      const success = executeMoveTile(
        Location.Paddock,
        board,
        1,
        { q: 0, r: 0 },
        { q: 2, r: 0 }
      );
      expect(success).toBe(false);
    });
  });

  describe('Barn (Phase 2: terrain card terrain, not settlement terrain)', () => {
    it('moves settlement to a cell matching the terrain card terrain', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1)); // settlement is Forest
      board.setCell(makeCell(9, 9, Terrain.Desert));               // destination is Desert (= card terrain)

      // Card terrain = Desert
      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 9, r: 9 },
        Terrain.Desert  // currentTerrain
      );
      expect(success).toBe(true);
      expect(board.getSettlement({ q: 0, r: 0 })).toBeUndefined();
      expect(board.getSettlement({ q: 9, r: 9 })).toBe(1);
    });

    it('rejects move when destination terrain does NOT match terrain card', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1));
      board.setCell(makeCell(9, 9, Terrain.Grass));

      // Card terrain = Desert, destination is Grass → reject
      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 9, r: 9 },
        Terrain.Desert
      );
      expect(success).toBe(false);
    });

    it('rejects move when settlement own terrain matches destination but card does NOT', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1)); // settlement is Forest
      board.setCell(makeCell(5, 5, Terrain.Forest));               // destination is also Forest

      // Card terrain = Desert. Settlement terrain matches destination (Forest),
      // but card terrain (Desert) does NOT match destination → reject.
      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 5, r: 5 },
        Terrain.Desert  // card terrain ≠ Forest destination
      );
      expect(success).toBe(false);
    });

    it('rejects Barn move when currentTerrain is not provided', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Forest, undefined, 1));
      board.setCell(makeCell(9, 9, Terrain.Forest));

      const success = executeMoveTile(
        Location.Barn,
        board,
        1,
        { q: 0, r: 0 },
        { q: 9, r: 9 }
        // no currentTerrain → invalid
      );
      expect(success).toBe(false);
    });
  });

  describe('Harbor (Phase 2: move to Water cell)', () => {
    it('moves settlement onto a Water cell (bypasses isBuildable)', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement
      board.setCell(makeCell(5, 5, Terrain.Water));               // target Water

      const success = executeMoveTile(
        Location.Harbor,
        board,
        1,
        { q: 0, r: 0 },
        { q: 5, r: 5 }
      );
      expect(success).toBe(true);
      expect(board.getSettlement({ q: 0, r: 0 })).toBeUndefined();
      expect(board.getSettlement({ q: 5, r: 5 })).toBe(1);
    });

    it('rejects Harbor move to a non-Water cell (Grass)', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(5, 5, Terrain.Grass));

      const success = executeMoveTile(
        Location.Harbor,
        board,
        1,
        { q: 0, r: 0 },
        { q: 5, r: 5 }
      );
      expect(success).toBe(false);
    });

    it('rejects Harbor move to occupied Water cell', () => {
      const board = new Board(10, 10);
      board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
      board.setCell(makeCell(5, 5, Terrain.Water, undefined, 2)); // occupied

      const success = executeMoveTile(
        Location.Harbor,
        board,
        1,
        { q: 0, r: 0 },
        { q: 5, r: 5 }
      );
      expect(success).toBe(false);
    });
  });

  it('rejects move if source cell does not belong to player', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 2)); // different player
    board.setCell(makeCell(2, 0, Terrain.Grass));

    const success = executeMoveTile(
      Location.Paddock,
      board,
      1,
      { q: 0, r: 0 },
      { q: 2, r: 0 }
    );
    expect(success).toBe(false);
  });

  it('rejects move to occupied destination', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 2)); // occupied (2 steps East)

    const success = executeMoveTile(
      Location.Paddock,
      board,
      1,
      { q: 0, r: 0 },
      { q: 2, r: 0 }
    );
    expect(success).toBe(false);
  });
});

// ────────────────────────────────────────────────────
// getHarborDestinations (Phase 2)
// ────────────────────────────────────────────────────

describe('getHarborDestinations', () => {
  it('returns all unoccupied Water cells as destinations', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // player settlement
    board.setCell(makeCell(5, 5, Terrain.Water));               // unoccupied Water ✓
    board.setCell(makeCell(6, 5, Terrain.Water, undefined, 2)); // occupied Water ✗
    board.setCell(makeCell(7, 5, Terrain.Grass));               // Grass (not Water) ✗

    const result = getHarborDestinations(board, { q: 0, r: 0 }, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('5,5');
    expect(keys).not.toContain('6,5'); // occupied
    expect(keys).not.toContain('7,5'); // not Water
  });

  it('applies adjacent-if-possible: prefers Water cells adjacent to other player settlements', () => {
    const board = new Board(10, 10);
    // Two player settlements
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // the one being moved
    board.setCell(makeCell(3, 0, Terrain.Grass, undefined, 1)); // another settlement (stays)
    // Water cell adjacent to (3,0): East neighbour = (4,0)
    board.setCell(makeCell(4, 0, Terrain.Water));
    // Far Water cell not adjacent to any remaining settlement
    board.setCell(makeCell(9, 9, Terrain.Water));

    // Moving (0,0) → from excludes it. Remaining: (3,0).
    // Adjacent Water to (3,0) is (4,0).
    const result = getHarborDestinations(board, { q: 0, r: 0 }, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('4,0');    // adjacent to remaining settlement ✓
    expect(keys).not.toContain('9,9'); // not adjacent → excluded by adjacent-if-possible
  });

  it('returns all Water cells when no Water is adjacent to other player settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // only settlement (moved)
    board.setCell(makeCell(5, 5, Terrain.Water));               // far Water
    board.setCell(makeCell(6, 6, Terrain.Water));               // another far Water

    // No other settlements after removing (0,0) → return all Water
    const result = getHarborDestinations(board, { q: 0, r: 0 }, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('5,5');
    expect(keys).toContain('6,6');
  });

  it('returns empty when there are no Water cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 5, Terrain.Grass));

    const result = getHarborDestinations(board, { q: 0, r: 0 }, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Fisherman scoring connected to Harbor move (Phase 2 integration)
// ────────────────────────────────────────────────────

describe('Harbor + Fisherman integration', () => {
  /**
   * Official semantic: scoreFisherman checks whether any settlement in a connected
   * group is ADJACENT to a Water cell, NOT whether the settlement itself sits on Water.
   * A settlement that moved onto a Water cell scores +2 only if at least one
   * NEIGHBOURING cell is also Water.
   */
  it('after Harbor move to Water, scoreFisherman +2 when destination has a Water neighbour (natural fixture)', () => {
    const board = new Board(10, 10);
    // Natural fixture: Water cell at (5,5) with a Water neighbour at (5,6) already on the board.
    // Southeast of (5,5) is (5+0, 5+1) = (5,6) per HEX_DIRECTIONS[5] = { q:0, r:1 }.
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement to move
    board.setCell(makeCell(5, 5, Terrain.Water));               // Harbor destination
    board.setCell(makeCell(5, 6, Terrain.Water));               // Water neighbour of (5,5) — pre-placed

    // Before move: no settlement adjacent to any Water → score = 0
    const scoreBefore = scoreFisherman(board, 1);
    expect(scoreBefore).toBe(0);

    // Execute Harbor move: (0,0) → (5,5)
    const success = executeMoveTile(
      Location.Harbor,
      board,
      1,
      { q: 0, r: 0 },
      { q: 5, r: 5 }
    );
    expect(success).toBe(true);

    // After move: settlement at (5,5) is adjacent to Water at (5,6) → +2
    // (5,6) was already on the board before the move — no post-move board mutation.
    const scoreAfter = scoreFisherman(board, 1);
    expect(scoreAfter).toBe(2);
  });

  it('after Harbor move to isolated Water cell (no Water neighbours), scoreFisherman = 0 (official semantic)', () => {
    // Official semantic: scoring is based on ADJACENCY to Water, not on being on a Water cell.
    // A settlement moved onto a Water cell that has no Water neighbours scores 0.
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // settlement to move
    board.setCell(makeCell(5, 5, Terrain.Water));               // isolated Water destination
    // All 6 neighbours of (5,5) are Grass (no Water neighbours)
    board.setCell(makeCell(6, 5, Terrain.Grass));   // East
    board.setCell(makeCell(6, 4, Terrain.Grass));   // Northeast
    board.setCell(makeCell(5, 4, Terrain.Grass));   // Northwest
    board.setCell(makeCell(4, 5, Terrain.Grass));   // West
    board.setCell(makeCell(4, 6, Terrain.Grass));   // Southwest
    board.setCell(makeCell(5, 6, Terrain.Grass));   // Southeast

    // Execute Harbor move
    const success = executeMoveTile(
      Location.Harbor,
      board,
      1,
      { q: 0, r: 0 },
      { q: 5, r: 5 }
    );
    expect(success).toBe(true);

    // Settlement is ON Water, but zero Water neighbours → scoreFisherman = 0
    const scoreAfter = scoreFisherman(board, 1);
    expect(scoreAfter).toBe(0);
  });

  it('Harbor move: group that stays on land scores 0, group moved to Water-adjacent cell scores +2 (natural fixture)', () => {
    const board = new Board(10, 10);
    // Two player settlements forming a group: (0,0) and (1,0)
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    // Natural fixture: Water at (9,9) with Water neighbour at (9,8) pre-placed on board.
    // Northwest of (9,9) = (9+0, 9-1) = (9,8) per HEX_DIRECTIONS[2] = { q:0, r:-1 }.
    board.setCell(makeCell(9, 9, Terrain.Water));  // Harbor destination
    board.setCell(makeCell(9, 8, Terrain.Water));  // Water neighbour — pre-placed

    const scoreBefore = scoreFisherman(board, 1);
    expect(scoreBefore).toBe(0); // neither settlement adjacent to Water

    // Move (0,0) onto Water at (9,9)
    const success = executeMoveTile(
      Location.Harbor,
      board,
      1,
      { q: 0, r: 0 },
      { q: 9, r: 9 }
    );
    expect(success).toBe(true);

    // Now: group {(1,0)} not adjacent to Water → 0; group {(9,9)} adjacent to Water (9,8) → +2
    const scoreAfter = scoreFisherman(board, 1);
    expect(scoreAfter).toBe(2);
  });
});

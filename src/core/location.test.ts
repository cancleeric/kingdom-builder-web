import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import {
  checkTileAcquisition,
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
// Farm placements
// ────────────────────────────────────────────────────

describe('getFarmPlacements', () => {
  it('returns all unoccupied grass cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // occupied
    board.setCell(makeCell(2, 0, Terrain.Forest));

    const result = getFarmPlacements(board);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ q: 0, r: 0 });
  });
});

// ────────────────────────────────────────────────────
// Harbor placements
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
  it('returns unoccupied desert cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Desert));
    board.setCell(makeCell(1, 0, Terrain.Desert, undefined, 1)); // occupied
    board.setCell(makeCell(2, 0, Terrain.Grass));

    const result = getOasisPlacements(board);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ q: 0, r: 0 });
  });
});

// ────────────────────────────────────────────────────
// Tower placements
// ────────────────────────────────────────────────────

describe('getTowerPlacements', () => {
  it('returns buildable cells adjacent to mountain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Mountain));
    board.setCell(makeCell(1, 0, Terrain.Grass)); // adjacent to mountain
    board.setCell(makeCell(5, 5, Terrain.Grass)); // interior

    const result = getTowerPlacements(board);
    const keys = result.map(hexToKey);
    expect(keys).toContain('1,0');
  });

  it('returns cells on map border (missing neighbor)', () => {
    const board = new Board(10, 10);
    // Cell at (0,0) has neighbors that don't exist on the board
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = getTowerPlacements(board);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(true);
  });

  it('excludes mountain cells themselves', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Mountain));

    const result = getTowerPlacements(board);
    expect(result.some(c => c.q === 0 && c.r === 0)).toBe(false);
  });
});

// ────────────────────────────────────────────────────
// Oracle placements
// ────────────────────────────────────────────────────

describe('getOraclePlacements', () => {
  it('returns buildable unoccupied cells adjacent to player settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // player settlement
    board.setCell(makeCell(1, 0, Terrain.Grass)); // adjacent, unoccupied

    const result = getOraclePlacements(board, 1);
    expect(result.some(c => c.q === 1 && c.r === 0)).toBe(true);
  });

  it('excludes water cells', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Water));

    const result = getOraclePlacements(board, 1);
    expect(result.some(c => c.q === 1 && c.r === 0)).toBe(false);
  });

  it('returns empty list if player has no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass));

    const result = getOraclePlacements(board, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Tavern placements
// ────────────────────────────────────────────────────

describe('getTavernPlacements', () => {
  it('returns cells at the end of a single-settlement row', () => {
    const board = new Board(10, 10);
    // Player settlement at (3, 2)
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass)); // left extension
    board.setCell(makeCell(4, 2, Terrain.Grass)); // right extension

    const result = getTavernPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,2');
    expect(keys).toContain('4,2');
  });

  it('returns cells at ends of a multi-settlement run', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(4, 2, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 2, Terrain.Grass)); // left extension
    board.setCell(makeCell(5, 2, Terrain.Grass)); // right extension

    const result = getTavernPlacements(board, 1);
    const keys = result.map(hexToKey);
    expect(keys).toContain('2,2');
    expect(keys).toContain('5,2');
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

  it('returns empty for movement tiles (Paddock)', () => {
    const board = new Board(5, 5);
    const result = getExtraPlacementPositions(Location.Paddock, board, 1);
    expect(result).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────
// Paddock destinations
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
// Barn destinations
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

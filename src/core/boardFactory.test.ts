import { describe, it, expect } from 'vitest';
import { Location } from './terrain';
import { QUADRANT_TEMPLATES, rotateQuadrant, QuadrantGrid } from './quadrant';
import { selectRandomQuadrants, assembleBoard, createRandomBoard } from './boardFactory';

const QUADRANT_SIZE = 10;
const BOARD_SIZE = 20;

describe('selectRandomQuadrants', () => {
  it('returns exactly 4 items by default', () => {
    const result = selectRandomQuadrants();
    expect(result.length).toBe(4);
  });

  it('returns the requested count', () => {
    const result = selectRandomQuadrants(2);
    expect(result.length).toBe(2);
  });

  it('does not repeat templates (unique ids)', () => {
    const result = selectRandomQuadrants(4);
    const ids = result.map(s => s.template.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('assigns one of [0, 90, 180, 270] to each rotation', () => {
    const validRotations = new Set([0, 90, 180, 270]);
    const result = selectRandomQuadrants(4);
    result.forEach(s => {
      expect(validRotations.has(s.rotation)).toBe(true);
    });
  });

  it('throws when count exceeds pool size', () => {
    expect(() => selectRandomQuadrants(QUADRANT_TEMPLATES.length + 1)).toThrow(RangeError);
  });

  it('returns templates that all come from QUADRANT_TEMPLATES', () => {
    const knownIds = new Set(QUADRANT_TEMPLATES.map(t => t.id));
    const result = selectRandomQuadrants(4);
    result.forEach(s => {
      expect(knownIds.has(s.template.id)).toBe(true);
    });
  });
});

describe('assembleBoard', () => {
  // Helper: build four identity grids from the first four templates
  const makeGrids = (rotation: 0 | 90 | 180 | 270 = 0) =>
    QUADRANT_TEMPLATES.slice(0, 4).map(t =>
      rotateQuadrant(t.grid, rotation)
    ) as [QuadrantGrid, QuadrantGrid, QuadrantGrid, QuadrantGrid];

  it('produces a board with 400 cells (20×20)', () => {
    const board = assembleBoard(makeGrids(0));
    expect(board.getAllCells().length).toBe(BOARD_SIZE * BOARD_SIZE);
  });

  it('board width and height are 20', () => {
    const board = assembleBoard(makeGrids(0));
    expect(board.width).toBe(BOARD_SIZE);
    expect(board.height).toBe(BOARD_SIZE);
  });

  it('every cell has q in [0, 19] and r in [0, 19]', () => {
    const board = assembleBoard(makeGrids(0));
    board.getAllCells().forEach(cell => {
      expect(cell.coord.q).toBeGreaterThanOrEqual(0);
      expect(cell.coord.q).toBeLessThanOrEqual(BOARD_SIZE - 1);
      expect(cell.coord.r).toBeGreaterThanOrEqual(0);
      expect(cell.coord.r).toBeLessThanOrEqual(BOARD_SIZE - 1);
    });
  });

  it('covers all 400 distinct coordinates', () => {
    const board = assembleBoard(makeGrids(0));
    const coords = new Set(
      board.getAllCells().map(c => `${c.coord.q},${c.coord.r}`)
    );
    expect(coords.size).toBe(BOARD_SIZE * BOARD_SIZE);
  });

  it('board contains at least 8 Castle hexes (≥2 per quadrant)', () => {
    const board = assembleBoard(makeGrids(0));
    const castleCount = board
      .getAllCells()
      .filter(cell => cell.location === Location.Castle).length;
    expect(castleCount).toBeGreaterThanOrEqual(8);
  });

  it('NW quadrant cells use the first grid', () => {
    const grids = makeGrids(0);
    const board = assembleBoard(grids);
    // NW: q in [0,9], r in [0,9] → grid[r][q] of grids[0]
    for (let r = 0; r < QUADRANT_SIZE; r++) {
      for (let c = 0; c < QUADRANT_SIZE; c++) {
        const cell = board.getCell({ q: c, r });
        expect(cell).toBeDefined();
        expect(cell!.terrain).toBe(grids[0][r][c].terrain);
      }
    }
  });

  it('SE quadrant cells use the fourth grid', () => {
    const grids = makeGrids(0);
    const board = assembleBoard(grids);
    // SE: q in [10,19], r in [10,19] → grids[3][r-10][q-10]
    for (let r = 0; r < QUADRANT_SIZE; r++) {
      for (let c = 0; c < QUADRANT_SIZE; c++) {
        const cell = board.getCell({ q: c + 10, r: r + 10 });
        expect(cell).toBeDefined();
        expect(cell!.terrain).toBe(grids[3][r][c].terrain);
      }
    }
  });
});

describe('createRandomBoard', () => {
  it('returns a board with 400 cells', () => {
    const board = createRandomBoard();
    expect(board.getAllCells().length).toBe(BOARD_SIZE * BOARD_SIZE);
  });

  it('board dimensions are 20×20', () => {
    const board = createRandomBoard();
    expect(board.width).toBe(BOARD_SIZE);
    expect(board.height).toBe(BOARD_SIZE);
  });

  it('contains at least 8 Castles', () => {
    const board = createRandomBoard();
    const castleCount = board
      .getAllCells()
      .filter(cell => cell.location === Location.Castle).length;
    expect(castleCount).toBeGreaterThanOrEqual(8);
  });

  it('two successive calls can produce different terrain distributions', () => {
    // Run several times to reduce flakiness: boards should differ at least once
    let foundDifference = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const board1 = createRandomBoard();
      const board2 = createRandomBoard();
      const cells1 = board1.getAllCells().map(c => `${c.coord.q},${c.coord.r}:${c.terrain}`).sort();
      const cells2 = board2.getAllCells().map(c => `${c.coord.q},${c.coord.r}:${c.terrain}`).sort();
      if (cells1.join('|') !== cells2.join('|')) {
        foundDifference = true;
        break;
      }
    }
    expect(foundDifference).toBe(true);
  });
});

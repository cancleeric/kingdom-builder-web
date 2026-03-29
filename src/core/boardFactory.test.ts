import { describe, it, expect } from 'vitest';
import {
  selectRandomQuadrants,
  assembleBoard,
  createRandomBoard,
} from './boardFactory';
import { QUADRANT_TEMPLATES } from './quadrant';
import { Location } from './terrain';

describe('selectRandomQuadrants', () => {
  it('returns the requested number of quadrants', () => {
    const selected = selectRandomQuadrants(4);
    expect(selected).toHaveLength(4);
  });

  it('does not select the same template twice', () => {
    const selected = selectRandomQuadrants(4);
    const ids = selected.map(s => s.template.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('assigns a valid rotation to each selected quadrant', () => {
    const validRotations = new Set([0, 90, 180, 270]);
    const selected = selectRandomQuadrants(4);
    selected.forEach(({ rotation }) => {
      expect(validRotations.has(rotation)).toBe(true);
    });
  });

  it('handles requesting fewer quadrants than available', () => {
    const selected = selectRandomQuadrants(2);
    expect(selected).toHaveLength(2);

    const ids = selected.map(s => s.template.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('does not exceed the available pool size', () => {
    const selected = selectRandomQuadrants(100);
    expect(selected.length).toBeLessThanOrEqual(QUADRANT_TEMPLATES.length);
  });
});

describe('assembleBoard', () => {
  it('produces a board with exactly 400 cells (20×20)', () => {
    const quadrants = selectRandomQuadrants(4);
    const board = assembleBoard(quadrants);
    expect(board.getAllCells()).toHaveLength(400);
  });

  it('board width and height are 20', () => {
    const quadrants = selectRandomQuadrants(4);
    const board = assembleBoard(quadrants);
    expect(board.width).toBe(20);
    expect(board.height).toBe(20);
  });

  it('has no pre-placed settlements', () => {
    const quadrants = selectRandomQuadrants(4);
    const board = assembleBoard(quadrants);
    const occupied = board.getAllCells().filter(c => c.settlement !== undefined);
    expect(occupied).toHaveLength(0);
  });

  it('cells cover q in [0,19] and r in [0,19]', () => {
    const quadrants = selectRandomQuadrants(4);
    const board = assembleBoard(quadrants);
    const cells = board.getAllCells();

    const qValues = cells.map(c => c.coord.q);
    const rValues = cells.map(c => c.coord.r);

    expect(Math.min(...qValues)).toBe(0);
    expect(Math.max(...qValues)).toBe(19);
    expect(Math.min(...rValues)).toBe(0);
    expect(Math.max(...rValues)).toBe(19);
  });

  it('assembled board has at least 8 Castle hexes (≥2 per quadrant)', () => {
    const quadrants = selectRandomQuadrants(4);
    const board = assembleBoard(quadrants);
    const castles = board.getAllCells().filter(c => c.location === Location.Castle);
    expect(castles.length).toBeGreaterThanOrEqual(8);
  });
});

describe('createRandomBoard', () => {
  it('creates a valid 20×20 board', () => {
    const board = createRandomBoard();
    expect(board.width).toBe(20);
    expect(board.height).toBe(20);
    expect(board.getAllCells()).toHaveLength(400);
  });

  it('produces different boards on successive calls', () => {
    // Run enough times to make a collision extremely unlikely
    const runs = 20;
    const seen = new Set<string>();

    for (let i = 0; i < runs; i++) {
      const board = createRandomBoard();
      // Summarise the board by the terrain of every cell to detect variation
      const snapshot = board
        .getAllCells()
        .sort((a, b) => a.coord.q - b.coord.q || a.coord.r - b.coord.r)
        .map(c => c.terrain[0])
        .join('');
      seen.add(snapshot);
    }

    // With 4 templates × 4 rotations each there are many combinations;
    // at least 2 distinct boards should appear in 20 runs
    expect(seen.size).toBeGreaterThan(1);
  });
});

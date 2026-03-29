import { describe, it, expect } from 'vitest';
import {
  QUADRANT_TEMPLATES,
  rotateQuadrant,
  QuadrantGrid,
} from './quadrant';
import { Location, Terrain } from './terrain';

describe('QUADRANT_TEMPLATES', () => {
  it('should contain at least 4 templates', () => {
    expect(QUADRANT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('each template grid should be 10 rows × 10 columns', () => {
    QUADRANT_TEMPLATES.forEach(({ id, grid }) => {
      expect(grid.length, `template ${id} should have 10 rows`).toBe(10);
      grid.forEach((row, r) => {
        expect(row.length, `template ${id} row ${r} should have 10 cols`).toBe(10);
      });
    });
  });

  it('each template should have at least 2 Castle hexes', () => {
    QUADRANT_TEMPLATES.forEach(({ id, grid }) => {
      const castleCount = grid
        .flat()
        .filter(cell => cell.location === Location.Castle).length;
      expect(castleCount, `template ${id} should have ≥ 2 Castles`).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('rotateQuadrant', () => {
  /**
   * Build a minimal 10×10 test grid where each cell encodes its position
   * as { terrain: Grass } but we use a sentinel in the top-left to verify rotation.
   */
  function makeGrid(): QuadrantGrid {
    return Array.from({ length: 10 }, (_, r) =>
      Array.from({ length: 10 }, (_, q) => ({
        terrain: r === 0 && q === 0 ? Terrain.Forest : Terrain.Grass,
      })),
    );
  }

  it('0° rotation returns an identical grid', () => {
    const grid = makeGrid();
    const rotated = rotateQuadrant(grid, 0);

    for (let r = 0; r < 10; r++) {
      for (let q = 0; q < 10; q++) {
        expect(rotated[r][q].terrain).toBe(grid[r][q].terrain);
      }
    }
  });

  it('90° CW rotation: top-left cell moves to top-right position', () => {
    // Original (0,0) = Forest; after 90° CW it should be at new position (0, 9)
    const grid = makeGrid();
    const rotated = rotateQuadrant(grid, 90);

    // Original[0][0] → new[0][9] for 90° CW
    expect(rotated[0][9].terrain).toBe(Terrain.Forest);
    // All other top-row cells in the rotated grid should be Grass
    expect(rotated[0][0].terrain).toBe(Terrain.Grass);
  });

  it('180° rotation: top-left cell moves to bottom-right position', () => {
    const grid = makeGrid();
    const rotated = rotateQuadrant(grid, 180);

    expect(rotated[9][9].terrain).toBe(Terrain.Forest);
    expect(rotated[0][0].terrain).toBe(Terrain.Grass);
  });

  it('270° CW rotation: top-left cell moves to bottom-left position', () => {
    const grid = makeGrid();
    const rotated = rotateQuadrant(grid, 270);

    // Original[0][0] → new[9][0] for 270° CW
    expect(rotated[9][0].terrain).toBe(Terrain.Forest);
    expect(rotated[0][0].terrain).toBe(Terrain.Grass);
  });

  it('four 90° rotations should return to the original grid', () => {
    const grid = makeGrid();
    let rotated = rotateQuadrant(grid, 90);
    rotated = rotateQuadrant(rotated, 90);
    rotated = rotateQuadrant(rotated, 90);
    rotated = rotateQuadrant(rotated, 90);

    for (let r = 0; r < 10; r++) {
      for (let q = 0; q < 10; q++) {
        expect(rotated[r][q].terrain).toBe(grid[r][q].terrain);
      }
    }
  });

  it('preserves the location property after rotation', () => {
    const grid = makeGrid();
    grid[0][0] = { terrain: Terrain.Grass, location: Location.Castle };

    const rotated = rotateQuadrant(grid, 90);

    // After 90° CW the castle should now be at [0][9]
    expect(rotated[0][9].location).toBe(Location.Castle);
    // Original position should no longer have the castle
    expect(rotated[0][0].location).toBeUndefined();
  });
});

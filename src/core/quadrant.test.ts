import { describe, it, expect } from 'vitest';
import { Terrain, Location } from './terrain';
import {
  QUADRANT_TEMPLATES,
  QuadrantGrid,
  rotateQuadrant,
} from './quadrant';

const QUADRANT_SIZE = 10;

describe('QUADRANT_TEMPLATES', () => {
  it('provides at least 4 templates', () => {
    expect(QUADRANT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  QUADRANT_TEMPLATES.forEach(template => {
    describe(`Template "${template.name}" (id=${template.id})`, () => {
      it('has a 10×10 grid', () => {
        expect(template.grid.length).toBe(QUADRANT_SIZE);
        template.grid.forEach(row => {
          expect(row.length).toBe(QUADRANT_SIZE);
        });
      });

      it('has at least 2 Castle hexes', () => {
        const castleCount = template.grid.flat().filter(
          cell => cell.location === Location.Castle
        ).length;
        expect(castleCount).toBeGreaterThanOrEqual(2);
      });

      it('has a valid terrain on every cell', () => {
        const validTerrains = new Set<string>(Object.values(Terrain));
        template.grid.flat().forEach(cell => {
          expect(validTerrains.has(cell.terrain)).toBe(true);
        });
      });
    });
  });
});

describe('rotateQuadrant', () => {
  // Use a small identifiable grid for rotation tests
  // We'll use the first template
  const template = QUADRANT_TEMPLATES[0];
  const originalGrid = template.grid;

  it('rotation 0° returns a grid of the same size', () => {
    const rotated = rotateQuadrant(originalGrid, 0);
    expect(rotated.length).toBe(QUADRANT_SIZE);
    rotated.forEach(row => expect(row.length).toBe(QUADRANT_SIZE));
  });

  it('rotation 0° preserves every cell value', () => {
    const rotated = rotateQuadrant(originalGrid, 0);
    for (let r = 0; r < QUADRANT_SIZE; r++) {
      for (let c = 0; c < QUADRANT_SIZE; c++) {
        expect(rotated[r][c].terrain).toBe(originalGrid[r][c].terrain);
        expect(rotated[r][c].location).toBe(originalGrid[r][c].location);
      }
    }
  });

  it('rotation 90° produces a 10×10 grid', () => {
    const rotated = rotateQuadrant(originalGrid, 90);
    expect(rotated.length).toBe(QUADRANT_SIZE);
    rotated.forEach(row => expect(row.length).toBe(QUADRANT_SIZE));
  });

  it('rotation 90° clockwise: top-left moves to top-right', () => {
    const rotated = rotateQuadrant(originalGrid, 90);
    // new[c][N-1-r] = old[r][c]  →  new[0][N-1] = old[0][0]
    const N = QUADRANT_SIZE;
    expect(rotated[0][N - 1].terrain).toBe(originalGrid[0][0].terrain);
  });

  it('rotation 90° clockwise: bottom-left moves to top-left', () => {
    const rotated = rotateQuadrant(originalGrid, 90);
    const N = QUADRANT_SIZE;
    // new[0][0] = old[N-1][0]
    expect(rotated[0][0].terrain).toBe(originalGrid[N - 1][0].terrain);
  });

  it('rotation 180° returns a grid of the same size', () => {
    const rotated = rotateQuadrant(originalGrid, 180);
    expect(rotated.length).toBe(QUADRANT_SIZE);
    rotated.forEach(row => expect(row.length).toBe(QUADRANT_SIZE));
  });

  it('rotation 180°: top-left moves to bottom-right', () => {
    const rotated = rotateQuadrant(originalGrid, 180);
    const N = QUADRANT_SIZE;
    expect(rotated[N - 1][N - 1].terrain).toBe(originalGrid[0][0].terrain);
  });

  it('rotation 270° returns a grid of the same size', () => {
    const rotated = rotateQuadrant(originalGrid, 270);
    expect(rotated.length).toBe(QUADRANT_SIZE);
    rotated.forEach(row => expect(row.length).toBe(QUADRANT_SIZE));
  });

  it('4 × 90° rotation is the identity', () => {
    let grid: QuadrantGrid = originalGrid;
    for (let i = 0; i < 4; i++) {
      grid = rotateQuadrant(grid, 90);
    }
    for (let r = 0; r < QUADRANT_SIZE; r++) {
      for (let c = 0; c < QUADRANT_SIZE; c++) {
        expect(grid[r][c].terrain).toBe(originalGrid[r][c].terrain);
        expect(grid[r][c].location).toBe(originalGrid[r][c].location);
      }
    }
  });

  it('rotation preserves Castle location markers', () => {
    const rotated = rotateQuadrant(originalGrid, 90);
    const castleCountBefore = originalGrid.flat().filter(
      cell => cell.location === Location.Castle
    ).length;
    const castleCountAfter = rotated.flat().filter(
      cell => cell.location === Location.Castle
    ).length;
    expect(castleCountAfter).toBe(castleCountBefore);
  });

  it('rotation 0° returns a new copy (not same reference)', () => {
    const rotated = rotateQuadrant(originalGrid, 0);
    expect(rotated).not.toBe(originalGrid);
    expect(rotated[0]).not.toBe(originalGrid[0]);
  });
});

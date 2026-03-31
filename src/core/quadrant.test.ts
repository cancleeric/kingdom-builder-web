import { describe, it, expect } from 'vitest';
import {
  QUADRANTS,
  rotateQuadrant,
  selectRandomQuadrants,
  assembleBoard,
  createRandomBoard,
} from './quadrant';
import type { QuadrantTemplate } from './quadrant';
import { Terrain, Location } from './terrain';

describe('Quadrant system', () => {
  describe('QUADRANTS data', () => {
    it('should have at least 4 quadrants', () => {
      expect(QUADRANTS.length).toBeGreaterThanOrEqual(4);
    });

    it('each quadrant should have a unique id', () => {
      const ids = QUADRANTS.map(q => q.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(QUADRANTS.length);
    });

    it('each quadrant terrain grid should be 10x10', () => {
      for (const quadrant of QUADRANTS) {
        expect(quadrant.terrain).toHaveLength(10);
        for (const row of quadrant.terrain) {
          expect(row).toHaveLength(10);
        }
      }
    });

    it('each cell should be a valid Terrain value', () => {
      const validTerrains = new Set(Object.values(Terrain));
      for (const quadrant of QUADRANTS) {
        for (const row of quadrant.terrain) {
          for (const cell of row) {
            expect(validTerrains.has(cell)).toBe(true);
          }
        }
      }
    });
  });

  describe('rotateQuadrant', () => {
    // Use a simple 10x10 grid with identifiable corner values for testing
    const makeGrid = (): QuadrantTemplate => {
      const grid: QuadrantTemplate = Array.from({ length: 10 }, () =>
        new Array<Terrain>(10).fill(Terrain.Grass)
      );
      grid[0][0] = Terrain.Forest;   // top-left
      grid[0][9] = Terrain.Desert;   // top-right
      grid[9][0] = Terrain.Canyon;   // bottom-left
      grid[9][9] = Terrain.Flower;   // bottom-right
      return grid;
    };

    it('should return the same grid for 0° rotation', () => {
      const grid = makeGrid();
      const rotated = rotateQuadrant(grid, 0);
      expect(rotated[0][0]).toBe(Terrain.Forest);
      expect(rotated[0][9]).toBe(Terrain.Desert);
      expect(rotated[9][0]).toBe(Terrain.Canyon);
      expect(rotated[9][9]).toBe(Terrain.Flower);
    });

    it('should rotate corners correctly for 90° CW', () => {
      const grid = makeGrid();
      const rotated = rotateQuadrant(grid, 90);
      // 90° CW: top-left → top-right, top-right → bottom-right,
      //         bottom-right → bottom-left, bottom-left → top-left
      expect(rotated[0][9]).toBe(Terrain.Forest);  // top-left goes to top-right
      expect(rotated[9][9]).toBe(Terrain.Desert);  // top-right goes to bottom-right
      expect(rotated[0][0]).toBe(Terrain.Canyon);  // bottom-left goes to top-left
      expect(rotated[9][0]).toBe(Terrain.Flower);  // bottom-right goes to bottom-left
    });

    it('should rotate corners correctly for 180°', () => {
      const grid = makeGrid();
      const rotated = rotateQuadrant(grid, 180);
      expect(rotated[9][9]).toBe(Terrain.Forest);  // top-left goes to bottom-right
      expect(rotated[9][0]).toBe(Terrain.Desert);  // top-right goes to bottom-left
      expect(rotated[0][9]).toBe(Terrain.Canyon);  // bottom-left goes to top-right
      expect(rotated[0][0]).toBe(Terrain.Flower);  // bottom-right goes to top-left
    });

    it('should rotate corners correctly for 270° CW', () => {
      const grid = makeGrid();
      const rotated = rotateQuadrant(grid, 270);
      // 270° CW = 90° CCW: top-left → bottom-left, top-right → top-left,
      //                    bottom-right → top-right, bottom-left → bottom-right
      expect(rotated[9][0]).toBe(Terrain.Forest);  // top-left goes to bottom-left
      expect(rotated[0][0]).toBe(Terrain.Desert);  // top-right goes to top-left
      expect(rotated[9][9]).toBe(Terrain.Canyon);  // bottom-left goes to bottom-right
      expect(rotated[0][9]).toBe(Terrain.Flower);  // bottom-right goes to top-right
    });

    it('four 90° rotations should return to original', () => {
      const grid = makeGrid();
      let rotated = rotateQuadrant(grid, 90);
      rotated = rotateQuadrant(rotated, 90);
      rotated = rotateQuadrant(rotated, 90);
      rotated = rotateQuadrant(rotated, 90);

      expect(rotated[0][0]).toBe(Terrain.Forest);
      expect(rotated[0][9]).toBe(Terrain.Desert);
      expect(rotated[9][0]).toBe(Terrain.Canyon);
      expect(rotated[9][9]).toBe(Terrain.Flower);
    });

    it('should not mutate the original quadrant', () => {
      const grid = makeGrid();
      rotateQuadrant(grid, 90);
      expect(grid[0][0]).toBe(Terrain.Forest);
    });

    it('returned grid should be 10x10', () => {
      const grid = makeGrid();
      for (const rotation of [0, 90, 180, 270] as const) {
        const rotated = rotateQuadrant(grid, rotation);
        expect(rotated).toHaveLength(10);
        for (const row of rotated) {
          expect(row).toHaveLength(10);
        }
      }
    });
  });

  describe('selectRandomQuadrants', () => {
    it('should return the requested count', () => {
      const selected = selectRandomQuadrants(4);
      expect(selected).toHaveLength(4);
    });

    it('should return unique quadrants (no duplicates)', () => {
      const selected = selectRandomQuadrants(4);
      const ids = selected.map(q => q.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(4);
    });

    it('should throw when requesting more than available', () => {
      expect(() => selectRandomQuadrants(QUADRANTS.length + 1)).toThrow();
    });

    it('should return quadrants from the pool', () => {
      const validIds = new Set(QUADRANTS.map(q => q.id));
      const selected = selectRandomQuadrants(4);
      for (const q of selected) {
        expect(validIds.has(q.id)).toBe(true);
      }
    });
  });

  describe('assembleBoard', () => {
    it('should produce a 20x20 board', () => {
      const [nw, ne, sw, se] = QUADRANTS.slice(0, 4).map(q => q.terrain);
      const board = assembleBoard(nw, ne, sw, se);
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
    });

    it('should have exactly 400 cells', () => {
      const [nw, ne, sw, se] = QUADRANTS.slice(0, 4).map(q => q.terrain);
      const board = assembleBoard(nw, ne, sw, se);
      expect(board.getAllCells()).toHaveLength(400);
    });

    it('should have no settlements initially', () => {
      const [nw, ne, sw, se] = QUADRANTS.slice(0, 4).map(q => q.terrain);
      const board = assembleBoard(nw, ne, sw, se);
      const occupied = board.getAllCells().filter(c => c.settlement !== undefined);
      expect(occupied).toHaveLength(0);
    });

    it('should place castles at the four fixed interior positions', () => {
      const [nw, ne, sw, se] = QUADRANTS.slice(0, 4).map(q => q.terrain);
      const board = assembleBoard(nw, ne, sw, se);

      const castlePositions = [
        { q: 3, r: 3 },
        { q: 16, r: 3 },
        { q: 3, r: 16 },
        { q: 16, r: 16 },
      ];

      for (const pos of castlePositions) {
        const cell = board.getCell(pos);
        expect(cell?.location).toBe(Location.Castle);
      }
    });

    it('NW quadrant terrain should appear in top-left region', () => {
      // Use a distinctive NW quadrant (all Flower) to verify placement
      const allFlower: QuadrantTemplate = Array.from({ length: 10 }, () =>
        new Array<Terrain>(10).fill(Terrain.Flower)
      );
      const plain: QuadrantTemplate = Array.from({ length: 10 }, () =>
        new Array<Terrain>(10).fill(Terrain.Grass)
      );

      const board = assembleBoard(allFlower, plain, plain, plain);

      // All NW cells (q: 0-9, r: 0-9) should be Flower
      for (let r = 0; r < 10; r++) {
        for (let q = 0; q < 10; q++) {
          expect(board.getCell({ q, r })?.terrain).toBe(Terrain.Flower);
        }
      }

      // NE region should be Grass
      expect(board.getCell({ q: 10, r: 0 })?.terrain).toBe(Terrain.Grass);
    });
  });

  describe('createRandomBoard', () => {
    it('should return a 20x20 board', () => {
      const board = createRandomBoard();
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
    });

    it('should have 400 cells', () => {
      const board = createRandomBoard();
      expect(board.getAllCells()).toHaveLength(400);
    });

    it('should have no initial settlements', () => {
      const board = createRandomBoard();
      const occupied = board.getAllCells().filter(c => c.settlement !== undefined);
      expect(occupied).toHaveLength(0);
    });

    it('should have multiple terrain types', () => {
      const board = createRandomBoard();
      const terrains = new Set(board.getAllCells().map(c => c.terrain));
      expect(terrains.size).toBeGreaterThan(1);
    });

    it('should produce different boards across multiple calls', () => {
      // Run many times; at least two should differ (probability of all being
      // identical with random selection + rotation is astronomically small)
      const hashes = Array.from({ length: 10 }, () => {
        const board = createRandomBoard();
        return board
          .getAllCells()
          .slice(0, 20)
          .map(c => c.terrain)
          .join(',');
      });
      const unique = new Set(hashes);
      expect(unique.size).toBeGreaterThan(1);
    });
  });
});

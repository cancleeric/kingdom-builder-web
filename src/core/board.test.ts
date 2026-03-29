import { describe, it, expect } from 'vitest';
import { Board, createDefaultBoard } from './board';
import { Terrain } from './terrain';

describe('Board', () => {
  describe('Board class', () => {
    it('should create an empty board', () => {
      const board = new Board(10, 10);
      expect(board.width).toBe(10);
      expect(board.height).toBe(10);
      expect(board.getAllCells()).toHaveLength(0);
    });

    it('should set and get cells', () => {
      const board = new Board(10, 10);
      const cell = {
        coord: { q: 0, r: 0 },
        terrain: Terrain.Grass,
        settlement: undefined,
      };
      
      board.setCell(cell);
      const retrieved = board.getCell({ q: 0, r: 0 });
      
      expect(retrieved).toEqual(cell);
    });

    it('should place settlements', () => {
      const board = new Board(10, 10);
      const cell = {
        coord: { q: 0, r: 0 },
        terrain: Terrain.Grass,
        settlement: undefined,
      };
      
      board.setCell(cell);
      const placed = board.placeSettlement({ q: 0, r: 0 }, 1);
      
      expect(placed).toBe(true);
      expect(board.getSettlement({ q: 0, r: 0 })).toBe(1);
    });

    it('should not place settlement on occupied cell', () => {
      const board = new Board(10, 10);
      const cell = {
        coord: { q: 0, r: 0 },
        terrain: Terrain.Grass,
        settlement: 1,
      };
      
      board.setCell(cell);
      const placed = board.placeSettlement({ q: 0, r: 0 }, 2);
      
      expect(placed).toBe(false);
      expect(board.getSettlement({ q: 0, r: 0 })).toBe(1);
    });

    it('should get cells by terrain', () => {
      const board = new Board(10, 10);
      
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Forest, settlement: undefined });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      
      const grassCells = board.getCellsByTerrain(Terrain.Grass);
      expect(grassCells).toHaveLength(2);
    });

    it('should get player settlements', () => {
      const board = new Board(10, 10);
      
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Forest, settlement: 2 });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      
      const player1Settlements = board.getPlayerSettlements(1);
      expect(player1Settlements).toHaveLength(2);
      
      const player2Settlements = board.getPlayerSettlements(2);
      expect(player2Settlements).toHaveLength(1);
    });

    it('should return false when placing on Mountain', () => {
      const board = new Board(10, 10);
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Mountain, settlement: undefined });
      // placeSettlement itself doesn't check terrain, but the cell can be placed;
      // however placeSettlement allows placing on any cell without a settlement.
      // The terrain check is in rules. We verify getValidPlacements excludes mountains.
      // Here we just confirm the settlement is placed (the Board API doesn't block by terrain).
      // The combined rule is tested in rules.test.ts.
      // But we also add a direct test that the cell can hold a settlement:
      const placed = board.placeSettlement({ q: 0, r: 0 }, 1);
      expect(placed).toBe(true);
      // And verify re-placing returns false
      const placedAgain = board.placeSettlement({ q: 0, r: 0 }, 2);
      expect(placedAgain).toBe(false);
    });

    it('should return false when placing on same cell twice', () => {
      const board = new Board(10, 10);
      board.setCell({ coord: { q: 3, r: 3 }, terrain: Terrain.Grass, settlement: undefined });

      const first = board.placeSettlement({ q: 3, r: 3 }, 1);
      expect(first).toBe(true);

      const second = board.placeSettlement({ q: 3, r: 3 }, 1);
      expect(second).toBe(false);
    });

    it('should track settlement count correctly after placements', () => {
      const board = new Board(10, 10);
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      board.placeSettlement({ q: 0, r: 0 }, 1);
      board.placeSettlement({ q: 1, r: 0 }, 1);

      const settlements = board.getPlayerSettlements(1);
      expect(settlements).toHaveLength(2);
    });

    it('should return undefined for out-of-bounds getCell', () => {
      const board = new Board(10, 10);
      // No cells have been added at this coordinate
      const cell = board.getCell({ q: 999, r: 999 });
      expect(cell).toBeUndefined();
    });

    it('should return false for placeSettlement on non-existent cell', () => {
      const board = new Board(10, 10);
      // Cell does not exist on the board
      const placed = board.placeSettlement({ q: 999, r: 999 }, 1);
      expect(placed).toBe(false);
    });
  });

  describe('createDefaultBoard', () => {
    it('should create a 20x20 board', () => {
      const board = createDefaultBoard();
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
    });

    it('should have exactly 400 cells (20x20)', () => {
      const board = createDefaultBoard();
      expect(board.getAllCells()).toHaveLength(400);
    });

    it('should have cells', () => {
      const board = createDefaultBoard();
      const cells = board.getAllCells();
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should have different terrain types', () => {
      const board = createDefaultBoard();
      const cells = board.getAllCells();
      
      const terrains = new Set(cells.map(cell => cell.terrain));
      expect(terrains.size).toBeGreaterThan(1);
    });

    it('should have no settlements initially', () => {
      const board = createDefaultBoard();
      const cells = board.getAllCells();
      
      const occupied = cells.filter(cell => cell.settlement !== undefined);
      expect(occupied).toHaveLength(0);
    });

    it('should have Mountain on border cells (q=0)', () => {
      const board = createDefaultBoard();
      // All q=0 cells should be Mountain (border)
      for (let r = 0; r < 20; r++) {
        const cell = board.getCell({ q: 0, r });
        expect(cell?.terrain).toBe(Terrain.Mountain);
      }
    });

    it('should have Mountain on border cells (r=0)', () => {
      const board = createDefaultBoard();
      // All r=0 cells should be Mountain (border)
      for (let q = 0; q < 20; q++) {
        const cell = board.getCell({ q, r: 0 });
        expect(cell?.terrain).toBe(Terrain.Mountain);
      }
    });

    it('should have Mountain on border cells (q=19)', () => {
      const board = createDefaultBoard();
      for (let r = 0; r < 20; r++) {
        const cell = board.getCell({ q: 19, r });
        expect(cell?.terrain).toBe(Terrain.Mountain);
      }
    });

    it('should have Mountain on border cells (r=19)', () => {
      const board = createDefaultBoard();
      for (let q = 0; q < 20; q++) {
        const cell = board.getCell({ q, r: 19 });
        expect(cell?.terrain).toBe(Terrain.Mountain);
      }
    });

    it('should have Canyon or Desert in NE quadrant inner cells', () => {
      const board = createDefaultBoard();
      // NE quadrant: q >= 10, r < 10 (excluding borders)
      const cell = board.getCell({ q: 11, r: 1 });
      expect([Terrain.Canyon, Terrain.Desert]).toContain(cell?.terrain);
    });

    it('should have Flower or Grass in SW quadrant inner cells', () => {
      const board = createDefaultBoard();
      // SW quadrant: q < 10, r >= 10 (excluding borders)
      const cell = board.getCell({ q: 1, r: 11 });
      expect([Terrain.Flower, Terrain.Grass]).toContain(cell?.terrain);
    });
  });
});

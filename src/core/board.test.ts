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
  });

  describe('createDefaultBoard', () => {
    it('should create a 20x20 board', () => {
      const board = createDefaultBoard();
      expect(board.width).toBe(20);
      expect(board.height).toBe(20);
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
  });
});

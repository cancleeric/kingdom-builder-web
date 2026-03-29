import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import { getValidPlacements, isValidPlacement, countSettlementsAdjacentToCastles } from './rules';

describe('Game Rules', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board(10, 10);
  });

  describe('getValidPlacements', () => {
    it('should allow placement anywhere for first settlement', () => {
      // Set up a simple board with grass cells
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      expect(validPlacements).toHaveLength(3);
    });

    it('should require adjacent placement when player has settlements', () => {
      // Set up board
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 0, r: 1 }, terrain: Terrain.Grass, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      // Should only allow placement adjacent to existing settlement at (0,0)
      // Neighbors of (0,0) are: (1,0), (1,-1), (0,-1), (-1,0), (-1,1), (0,1)
      // Only (1,0) and (0,1) exist on our board and are grass
      expect(validPlacements.length).toBeGreaterThan(0);
      expect(validPlacements.some(p => p.q === 1 && p.r === 0)).toBe(true);
    });

    it('should allow any matching terrain if no adjacent terrain available', () => {
      // Player has settlements on grass
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      
      // Forest cells are far away
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Forest, settlement: undefined });
      board.setCell({ coord: { q: 6, r: 5 }, terrain: Terrain.Forest, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Forest, 1);

      // Should allow placement on any forest cell since none are adjacent
      expect(validPlacements).toHaveLength(2);
    });

    it('should not allow placement on mountains', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Mountain, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Mountain, 1);

      expect(validPlacements).toHaveLength(0);
    });

    it('should not allow placement on water', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Water, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Water, 1);

      expect(validPlacements).toHaveLength(0);
    });

    it('should not allow placement on occupied cells', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 2 });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      expect(validPlacements.length).toBe(0);
    });
  });

  describe('isValidPlacement', () => {
    it('should validate correct placements', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      const isValid = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Grass, 1);

      expect(isValid).toBe(true);
    });

    it('should reject invalid placements', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      const isValid = isValidPlacement(board, { q: 0, r: 0 }, Terrain.Forest, 1);

      expect(isValid).toBe(false);
    });
  });

  describe('countSettlementsAdjacentToCastles', () => {
    it('should count settlements adjacent to castles', () => {
      // Place a castle
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Castle, settlement: undefined });
      
      // Place player settlements adjacent to castle
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 0, r: 1 }, terrain: Terrain.Grass, settlement: 1 });
      
      // Place a settlement not adjacent to castle
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: 1 });

      const count = countSettlementsAdjacentToCastles(board, 1);

      expect(count).toBe(2);
    });

    it('should return 0 if no settlements adjacent to castles', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Castle, settlement: undefined });
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: 1 });

      const count = countSettlementsAdjacentToCastles(board, 1);

      expect(count).toBe(0);
    });
  });
});

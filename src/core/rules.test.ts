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

    it('adjacent rule: player with settlement next to grass must place adjacent (not on distant grass)', () => {
      // Settlement A at (0,0) on grass
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      // Adjacent grass at (1,0)
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      // Distant grass at (5,5) - not adjacent to A
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      // Must only allow the adjacent cell (1,0), not the distant (5,5)
      expect(validPlacements).toHaveLength(1);
      expect(validPlacements[0]).toEqual({ q: 1, r: 0 });
    });

    it('no adjacent exception: player with no settlements can place on any matching terrain', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: undefined });

      // Player 1 has no settlements
      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      expect(validPlacements).toHaveLength(2);
    });

    it('fallback: all adjacent terrain occupied → can place anywhere on matching terrain', () => {
      // Player 1 has a settlement; adjacent grass is fully occupied
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      // Neighbors of (0,0): (1,0),(1,-1),(0,-1),(-1,0),(-1,1),(0,1)
      // Occupy the only neighbour grass we put on the board
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: 2 });

      // Distant grass
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: undefined });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      // No adjacent unoccupied grass → fall back to any available grass
      expect(validPlacements).toHaveLength(1);
      expect(validPlacements[0]).toEqual({ q: 5, r: 5 });
    });

    it('multi-player: rules only consider current player settlements (not other players)', () => {
      // Player 2 has a settlement adjacent to grass
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 2 });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      // Distant grass
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: undefined });

      // Player 1 has NO settlements, so adjacency of player 2 should be ignored
      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      // Player 1 has no settlements → can place anywhere (but (0,0) is occupied by p2)
      expect(validPlacements).toHaveLength(2);
      expect(validPlacements.some(p => p.q === 1 && p.r === 0)).toBe(true);
      expect(validPlacements.some(p => p.q === 5 && p.r === 5)).toBe(true);
    });

    it('non-buildable terrains: Mountain and Water never appear in valid positions', () => {
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Mountain, settlement: undefined });
      board.setCell({ coord: { q: 2, r: 0 }, terrain: Terrain.Water, settlement: undefined });

      const grassPlacements = getValidPlacements(board, Terrain.Grass, 1);
      grassPlacements.forEach(p => {
        const cell = board.getCell(p);
        expect(cell?.terrain).not.toBe(Terrain.Mountain);
        expect(cell?.terrain).not.toBe(Terrain.Water);
      });
    });

    it('board fully occupied with terrain: valid placements are empty', () => {
      // All grass cells are occupied
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: 2 });

      const validPlacements = getValidPlacements(board, Terrain.Grass, 1);

      expect(validPlacements).toHaveLength(0);
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

    it('castle adjacency does not block building near castles, only affects scoring', () => {
      // A castle hex neighbour should still be a valid grass placement
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, location: Location.Castle, settlement: undefined });
      // Adjacent cell to castle - grass, no settlement
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      // Player 1 has no settlements - can place anywhere on grass
      const valid = getValidPlacements(board, Terrain.Grass, 1);

      // (1,0) should be included since it's grass and unoccupied
      expect(valid.some(p => p.q === 1 && p.r === 0)).toBe(true);
    });
  });
});

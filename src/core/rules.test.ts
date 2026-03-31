import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import { getValidPlacements, countSettlementsAdjacentToCastles } from './rules';
import { hexDistance } from './hex';

function makeBoard(): Board {
  const board = new Board(10, 10);
  for (let q = 0; q < 10; q++) {
    for (let r = 0; r < 10; r++) {
      board.setCell({ coord: { q, r }, terrain: Terrain.Grass, settlement: undefined });
    }
  }
  return board;
}

describe('Rules', () => {
  describe('getValidPlacements', () => {
    it('player with no settlements can place anywhere on matching terrain', () => {
      const board = makeBoard();
      const placements = getValidPlacements(board, Terrain.Grass, 1);
      expect(placements.length).toBe(100);
    });

    it('should exclude Mountain terrain', () => {
      const board = new Board(5, 5);
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Mountain, settlement: undefined });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      const placements = getValidPlacements(board, Terrain.Mountain, 1);
      expect(placements).toHaveLength(0);
    });

    it('should exclude Water terrain', () => {
      const board = new Board(5, 5);
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Water, settlement: undefined });

      const placements = getValidPlacements(board, Terrain.Water, 1);
      expect(placements).toHaveLength(0);
    });

    it('should exclude occupied cells', () => {
      const board = new Board(3, 3);
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass, settlement: undefined });

      const placements = getValidPlacements(board, Terrain.Grass, 2);
      expect(placements.some(p => p.q === 0 && p.r === 0)).toBe(false);
      expect(placements.some(p => p.q === 1 && p.r === 0)).toBe(true);
    });

    it('player with settlements must place adjacent when adjacent terrain available', () => {
      const board = makeBoard();
      board.placeSettlement({ q: 5, r: 5 }, 1);

      const placements = getValidPlacements(board, Terrain.Grass, 1);
      // All valid placements should be neighbors of {q:5, r:5} (distance === 1)
      for (const p of placements) {
        expect(hexDistance(p, { q: 5, r: 5 })).toBe(1);
      }
    });

    it('should fall back to any terrain when no adjacent terrain available', () => {
      const board = new Board(5, 5);
      // Settlement on Forest cell; matching terrain is Grass (not adjacent to Forest)
      board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Forest, settlement: 1 });
      board.setCell({ coord: { q: 4, r: 4 }, terrain: Terrain.Grass, settlement: undefined });
      board.setCell({ coord: { q: 3, r: 4 }, terrain: Terrain.Grass, settlement: undefined });

      const placements = getValidPlacements(board, Terrain.Grass, 1);
      expect(placements.length).toBeGreaterThan(0);
    });
  });

  describe('countSettlementsAdjacentToCastles', () => {
    it('should count settlements adjacent to castles', () => {
      const board = new Board(10, 10);
      board.setCell({ coord: { q: 3, r: 3 }, terrain: Terrain.Grass, location: Location.Castle, settlement: undefined });
      board.setCell({ coord: { q: 4, r: 3 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 3, r: 4 }, terrain: Terrain.Grass, settlement: 1 });
      board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, settlement: 1 });

      const count = countSettlementsAdjacentToCastles(board, 1);
      expect(count).toBe(2);
    });
  });
});

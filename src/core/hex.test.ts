import { describe, it, expect } from 'vitest';
import {
  hexNeighbor,
  hexNeighbors,
  hexDistance,
  hexEquals,
  axialToPixel,
  pixelToAxial,
  hexToKey,
  keyToHex,
  HEX_SIZE,
  HEX_DIRECTIONS,
} from './hex';

describe('Hex Coordinate System', () => {
  describe('hexNeighbor', () => {
    it('should return correct neighbor in each direction', () => {
      const origin = { q: 0, r: 0 };
      
      expect(hexNeighbor(origin, 0)).toEqual({ q: 1, r: 0 });   // East
      expect(hexNeighbor(origin, 1)).toEqual({ q: 1, r: -1 });  // Northeast
      expect(hexNeighbor(origin, 2)).toEqual({ q: 0, r: -1 });  // Northwest
      expect(hexNeighbor(origin, 3)).toEqual({ q: -1, r: 0 });  // West
      expect(hexNeighbor(origin, 4)).toEqual({ q: -1, r: 1 });  // Southwest
      expect(hexNeighbor(origin, 5)).toEqual({ q: 0, r: 1 });   // Southeast
    });
  });

  describe('hexNeighbors', () => {
    it('should return all 6 neighbors', () => {
      const origin = { q: 0, r: 0 };
      const neighbors = hexNeighbors(origin);
      
      expect(neighbors).toHaveLength(6);
      expect(neighbors).toContainEqual({ q: 1, r: 0 });
      expect(neighbors).toContainEqual({ q: -1, r: 0 });
    });

    it('should return different neighbors for different positions', () => {
      const hex = { q: 5, r: 5 };
      const neighbors = hexNeighbors(hex);
      
      expect(neighbors).toHaveLength(6);
      expect(neighbors).toContainEqual({ q: 6, r: 5 });
      expect(neighbors).toContainEqual({ q: 4, r: 5 });
    });

    it('should include out-of-bounds neighbors for edge hexes (filtering is the board responsibility)', () => {
      // hexNeighbors always returns 6 neighbors, including out-of-bounds ones
      // Boundary filtering is the board's responsibility
      const edgeHex = { q: 0, r: 0 };
      const neighbors = hexNeighbors(edgeHex);
      expect(neighbors).toHaveLength(6);
      // Some neighbors will have negative coordinates (out of a 0-based board)
      const outOfBounds = neighbors.filter(n => n.q < 0 || n.r < 0);
      expect(outOfBounds.length).toBeGreaterThan(0);
    });
  });

  describe('hexDistance', () => {
    it('should return 0 for same hex', () => {
      const hex = { q: 0, r: 0 };
      expect(hexDistance(hex, hex)).toBe(0);
    });

    it('should return 0 when both arguments are equal coordinates', () => {
      const a = { q: 5, r: 3 };
      const b = { q: 5, r: 3 };
      expect(hexDistance(a, b)).toBe(0);
    });

    it('should return 1 for each of the six adjacent directions', () => {
      const origin = { q: 0, r: 0 };
      HEX_DIRECTIONS.forEach(dir => {
        expect(hexDistance(origin, dir)).toBe(1);
      });
    });

    it('should return 1 for adjacent hexes', () => {
      const a = { q: 0, r: 0 };
      const b = { q: 1, r: 0 };
      expect(hexDistance(a, b)).toBe(1);
    });

    it('should calculate correct distance for non-adjacent hexes', () => {
      const a = { q: 0, r: 0 };
      const b = { q: 3, r: 3 };
      expect(hexDistance(a, b)).toBe(6);
    });

    it('should be symmetric', () => {
      const a = { q: 2, r: 3 };
      const b = { q: 5, r: 1 };
      expect(hexDistance(a, b)).toBe(hexDistance(b, a));
    });

    it('should calculate large distances correctly (distance > 5)', () => {
      const a = { q: 0, r: 0 };
      const b = { q: 10, r: 0 };
      expect(hexDistance(a, b)).toBe(10);

      const c = { q: 0, r: 0 };
      const d = { q: 6, r: 6 };
      expect(hexDistance(c, d)).toBe(12);
    });
  });

  describe('hexEquals', () => {
    it('should return true for equal hexes', () => {
      const a = { q: 5, r: 3 };
      const b = { q: 5, r: 3 };
      expect(hexEquals(a, b)).toBe(true);
    });

    it('should return false for different hexes', () => {
      const a = { q: 5, r: 3 };
      const b = { q: 5, r: 4 };
      expect(hexEquals(a, b)).toBe(false);
    });
  });

  describe('axialToPixel', () => {
    it('should convert origin correctly', () => {
      const hex = { q: 0, r: 0 };
      const pixel = axialToPixel(hex);
      expect(pixel.x).toBeCloseTo(0, 1);
      expect(pixel.y).toBeCloseTo(0, 1);
    });

    it('should use custom size parameter', () => {
      const hex = { q: 1, r: 0 };
      const pixel1 = axialToPixel(hex, HEX_SIZE);
      const pixel2 = axialToPixel(hex, HEX_SIZE * 2);
      
      expect(pixel2.x).toBeCloseTo(pixel1.x * 2, 1);
      expect(pixel2.y).toBeCloseTo(pixel1.y * 2, 1);
    });
  });

  describe('axialToPixel / pixelToAxial round-trip', () => {
    it('should round-trip axial→pixel→axial precisely', () => {
      const original = { q: 3, r: 5 };
      const pixel = axialToPixel(original);
      const result = pixelToAxial(pixel);
      expect(result.q).toBe(original.q);
      expect(result.r).toBe(original.r);
    });

    it('should round-trip for negative coordinates', () => {
      const original = { q: -4, r: 7 };
      const pixel = axialToPixel(original);
      const result = pixelToAxial(pixel);
      expect(result.q).toBe(original.q);
      expect(result.r).toBe(original.r);
    });

    it('should round-trip for origin', () => {
      const original = { q: 0, r: 0 };
      const pixel = axialToPixel(original);
      const result = pixelToAxial(pixel);
      expect(result.q).toBe(original.q);
      expect(result.r).toBe(original.r);
    });
  });

  describe('hexToKey and keyToHex', () => {
    it('should convert hex to key and back', () => {
      const hex = { q: 5, r: -3 };
      const key = hexToKey(hex);
      const result = keyToHex(key);
      
      expect(result).toEqual(hex);
    });

    it('should create unique keys for different hexes', () => {
      const hexes = [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 0, r: 1 },
      ];
      
      const keys = hexes.map(hexToKey);
      const uniqueKeys = new Set(keys);
      
      expect(uniqueKeys.size).toBe(hexes.length);
    });
  });
});

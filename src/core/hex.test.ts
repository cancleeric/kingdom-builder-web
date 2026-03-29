import { describe, it, expect } from 'vitest';
import {
  hexNeighbor,
  hexNeighbors,
  hexDistance,
  hexEquals,
  axialToPixel,
  hexToKey,
  keyToHex,
  HEX_SIZE,
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
  });

  describe('hexDistance', () => {
    it('should return 0 for same hex', () => {
      const hex = { q: 0, r: 0 };
      expect(hexDistance(hex, hex)).toBe(0);
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

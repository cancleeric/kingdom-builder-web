import { describe, it, expect } from 'vitest';
import {
  hexNeighbors,
  hexDistance,
  hexEquals,
  axialToPixel,
  hexToKey,
  keyToHex,
  HEX_SIZE,
} from './hex';

describe('Hex coordinates', () => {
  describe('hexNeighbors', () => {
    it('should return 6 neighbors', () => {
      const neighbors = hexNeighbors({ q: 0, r: 0 });
      expect(neighbors).toHaveLength(6);
    });

    it('neighbors should be at distance 1', () => {
      const neighbors = hexNeighbors({ q: 5, r: 3 });
      for (const neighbor of neighbors) {
        expect(hexDistance({ q: 5, r: 3 }, neighbor)).toBe(1);
      }
    });
  });

  describe('hexDistance', () => {
    it('distance from a hex to itself should be 0', () => {
      expect(hexDistance({ q: 2, r: 3 }, { q: 2, r: 3 })).toBe(0);
    });

    it('distance between adjacent hexes should be 1', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    });

    it('should compute longer distances correctly', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 })).toBe(3);
    });
  });

  describe('hexEquals', () => {
    it('should be true for same coordinates', () => {
      expect(hexEquals({ q: 1, r: 2 }, { q: 1, r: 2 })).toBe(true);
    });

    it('should be false for different coordinates', () => {
      expect(hexEquals({ q: 1, r: 2 }, { q: 1, r: 3 })).toBe(false);
    });
  });

  describe('axialToPixel', () => {
    it('origin should map to (0, 0)', () => {
      const pixel = axialToPixel({ q: 0, r: 0 });
      expect(pixel.x).toBeCloseTo(0);
      expect(pixel.y).toBeCloseTo(0);
    });

    it('should scale with HEX_SIZE', () => {
      const pixel = axialToPixel({ q: 1, r: 0 });
      expect(pixel.x).toBeCloseTo(HEX_SIZE * Math.sqrt(3));
    });
  });

  describe('hexToKey / keyToHex', () => {
    it('round-trip should preserve coordinates', () => {
      const original = { q: 5, r: -3 };
      expect(keyToHex(hexToKey(original))).toEqual(original);
    });

    it('different coordinates should produce different keys', () => {
      const keys = [
        hexToKey({ q: 0, r: 0 }),
        hexToKey({ q: 1, r: 0 }),
        hexToKey({ q: 0, r: 1 }),
      ];
      const unique = new Set(keys);
      expect(unique.size).toBe(3);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  hexDistance,
  hexNeighbors,
  hexEqual,
  hexKey,
  hexToPixel,
  pixelToHex,
  hexRound,
} from '../core/hex';
import type { Hex } from '../types';

describe('hex coordinate system', () => {
  describe('hexDistance', () => {
    it('distance between same hex is 0', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    });

    it('distance between neighbors is 1', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
      expect(hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
    });

    it('distance is symmetric', () => {
      const a: Hex = { q: 3, r: -2 };
      const b: Hex = { q: -1, r: 4 };
      expect(hexDistance(a, b)).toBe(hexDistance(b, a));
    });

    it('distance follows triangle inequality', () => {
      const a: Hex = { q: 0, r: 0 };
      const b: Hex = { q: 2, r: 0 };
      const c: Hex = { q: 1, r: 1 };
      expect(hexDistance(a, b)).toBeLessThanOrEqual(
        hexDistance(a, c) + hexDistance(c, b)
      );
    });
  });

  describe('hexNeighbors', () => {
    it('returns 6 neighbors', () => {
      expect(hexNeighbors({ q: 0, r: 0 })).toHaveLength(6);
    });

    it('all neighbors are at distance 1', () => {
      const center: Hex = { q: 3, r: -1 };
      const neighbors = hexNeighbors(center);
      for (const n of neighbors) {
        expect(hexDistance(center, n)).toBe(1);
      }
    });
  });

  describe('hexEqual', () => {
    it('same hex is equal', () => {
      expect(hexEqual({ q: 2, r: 3 }, { q: 2, r: 3 })).toBe(true);
    });

    it('different hexes are not equal', () => {
      expect(hexEqual({ q: 2, r: 3 }, { q: 2, r: 4 })).toBe(false);
    });
  });

  describe('hexKey', () => {
    it('returns deterministic string key', () => {
      expect(hexKey({ q: 5, r: -3 })).toBe('5,-3');
    });
  });

  describe('hexToPixel / pixelToHex roundtrip', () => {
    it('converts hex to pixel and back', () => {
      const origin = { x: 0, y: 0 };
      const size = 20;
      const original: Hex = { q: 3, r: -2 };
      const { x, y } = hexToPixel(original, size, origin);
      const recovered = pixelToHex(x, y, size, origin);
      expect(recovered.q).toBe(original.q);
      expect(recovered.r).toBe(original.r);
    });
  });

  describe('hexRound', () => {
    it('rounds to nearest hex', () => {
      const result = hexRound({ q: 0.1, r: 0.1 });
      expect(result.q).toBe(0);
      expect(result.r).toBe(0);
    });
  });
});

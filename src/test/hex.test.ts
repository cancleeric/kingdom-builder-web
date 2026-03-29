import { describe, it, expect } from 'vitest';
import { hexDistance, hexNeighbors, hexEquals, hexToPixel } from '../core/hex';

describe('hex utilities', () => {
  it('hexDistance between same cell is 0', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it('hexDistance between adjacent cells is 1', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
  });

  it('hexDistance between non-adjacent cells', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 })).toBe(3);
  });

  it('hexNeighbors returns 6 neighbors', () => {
    const neighbors = hexNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
  });

  it('hexNeighbors are all distance 1 away', () => {
    const origin = { q: 2, r: -1 };
    const neighbors = hexNeighbors(origin);
    neighbors.forEach(n => {
      expect(hexDistance(origin, n)).toBe(1);
    });
  });

  it('hexEquals returns true for same coords', () => {
    expect(hexEquals({ q: 1, r: -1 }, { q: 1, r: -1 })).toBe(true);
  });

  it('hexEquals returns false for different coords', () => {
    expect(hexEquals({ q: 1, r: -1 }, { q: 1, r: 0 })).toBe(false);
  });

  it('hexToPixel returns expected pixel position', () => {
    const pixel = hexToPixel({ q: 0, r: 0 }, 30);
    expect(pixel.x).toBe(0);
    expect(pixel.y).toBe(0);
  });
});

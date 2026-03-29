import { describe, it, expect } from 'vitest';
import {
  hexToPixel,
  pixelToHex,
  hexRound,
  hexNeighbors,
  hexDistance,
  hexKey,
  isBuildable,
  generateDemoBoard,
} from '../core/hex';

describe('hexToPixel', () => {
  it('converts origin to (0, 0)', () => {
    const { x, y } = hexToPixel({ q: 0, r: 0 }, 10);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
  });

  it('converts (1, 0) correctly for pointy-top hex', () => {
    const size = 10;
    const { x, y } = hexToPixel({ q: 1, r: 0 }, size);
    expect(x).toBeCloseTo(size * Math.sqrt(3));
    expect(y).toBeCloseTo(0);
  });
});

describe('pixelToHex / hexRound', () => {
  it('round-trips through hexToPixel and pixelToHex', () => {
    const coord = { q: 2, r: -1 };
    const size = 32;
    const { x, y } = hexToPixel(coord, size);
    const result = pixelToHex(x, y, size);
    expect(result.q).toBe(coord.q);
    expect(result.r).toBe(coord.r);
  });

  it('rounds fractional hex coordinates', () => {
    const result = hexRound({ q: 1.4, r: -0.3 });
    expect(result.q).toBe(1);
    expect(result.r).toBeCloseTo(0);
  });
});

describe('hexNeighbors', () => {
  it('returns 6 neighbors', () => {
    const neighbors = hexNeighbors({ q: 0, r: 0 });
    expect(neighbors).toHaveLength(6);
  });

  it('neighbors of origin have distance 1', () => {
    const origin = { q: 0, r: 0 };
    const neighbors = hexNeighbors(origin);
    for (const nb of neighbors) {
      expect(hexDistance(origin, nb)).toBe(1);
    }
  });
});

describe('hexDistance', () => {
  it('distance from cell to itself is 0', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
  });

  it('distance between adjacent cells is 1', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
  });

  it('distance between non-adjacent cells', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });
});

describe('hexKey', () => {
  it('produces unique keys for different coords', () => {
    const keys = [
      hexKey({ q: 0, r: 0 }),
      hexKey({ q: 1, r: 0 }),
      hexKey({ q: 0, r: 1 }),
    ];
    const unique = new Set(keys);
    expect(unique.size).toBe(3);
  });

  it('produces same key for same coord', () => {
    expect(hexKey({ q: 3, r: -2 })).toBe(hexKey({ q: 3, r: -2 }));
  });
});

describe('isBuildable', () => {
  it('grass, forest, desert, flower, canyon are buildable', () => {
    expect(isBuildable('grass')).toBe(true);
    expect(isBuildable('forest')).toBe(true);
    expect(isBuildable('desert')).toBe(true);
    expect(isBuildable('flower')).toBe(true);
    expect(isBuildable('canyon')).toBe(true);
  });

  it('water, mountain, castle, location are not buildable', () => {
    expect(isBuildable('water')).toBe(false);
    expect(isBuildable('mountain')).toBe(false);
    expect(isBuildable('castle')).toBe(false);
    expect(isBuildable('location')).toBe(false);
  });
});

describe('generateDemoBoard', () => {
  it('generates a non-empty board', () => {
    const board = generateDemoBoard();
    expect(board.length).toBeGreaterThan(0);
  });

  it('all cells have valid terrain', () => {
    const validTerrains = new Set([
      'grass', 'forest', 'desert', 'flower', 'canyon',
      'water', 'mountain', 'castle', 'location',
    ]);
    const board = generateDemoBoard();
    for (const cell of board) {
      expect(validTerrains.has(cell.terrain)).toBe(true);
    }
  });

  it('no duplicate coordinates', () => {
    const board = generateDemoBoard();
    const keys = board.map((c) => hexKey(c.coord));
    const unique = new Set(keys);
    expect(unique.size).toBe(board.length);
  });
});

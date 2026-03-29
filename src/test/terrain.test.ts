import { describe, it, expect } from 'vitest';
import { isPlaceable, getTerrainColor, TERRAIN_COLORS, PLACEABLE_TERRAINS } from '../core/terrain';

describe('terrain utilities', () => {
  it('grass is placeable', () => {
    expect(isPlaceable('grass')).toBe(true);
  });

  it('forest is placeable', () => {
    expect(isPlaceable('forest')).toBe(true);
  });

  it('mountain is not placeable', () => {
    expect(isPlaceable('mountain')).toBe(false);
  });

  it('water is not placeable', () => {
    expect(isPlaceable('water')).toBe(false);
  });

  it('castle is not placeable', () => {
    expect(isPlaceable('castle')).toBe(false);
  });

  it('PLACEABLE_TERRAINS has 5 entries', () => {
    expect(PLACEABLE_TERRAINS).toHaveLength(5);
  });

  it('getTerrainColor returns a color string', () => {
    const color = getTerrainColor('grass');
    expect(color).toBeTruthy();
    expect(typeof color).toBe('string');
  });

  it('all terrain types have colors', () => {
    const types = ['grass', 'forest', 'desert', 'flower', 'canyon', 'mountain', 'water', 'castle'] as const;
    types.forEach(t => {
      expect(TERRAIN_COLORS[t]).toBeTruthy();
    });
  });
});

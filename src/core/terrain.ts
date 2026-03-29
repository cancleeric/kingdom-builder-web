import type { TerrainType } from '../types';

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#90EE90',
  forest: '#228B22',
  desert: '#F4A460',
  flower: '#FFB6C1',
  canyon: '#CD853F',
  mountain: '#808080',
  water: '#4169E1',
  castle: '#FFD700',
};

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  grass: '草地',
  forest: '森林',
  desert: '沙漠',
  flower: '花田',
  canyon: '峽谷',
  mountain: '山脈',
  water: '水域',
  castle: '城堡',
};

export const PLACEABLE_TERRAINS: TerrainType[] = ['grass', 'forest', 'desert', 'flower', 'canyon'];

export function isPlaceable(terrain: TerrainType): boolean {
  return PLACEABLE_TERRAINS.includes(terrain);
}

export function getTerrainColor(terrain: TerrainType): string {
  return TERRAIN_COLORS[terrain];
}

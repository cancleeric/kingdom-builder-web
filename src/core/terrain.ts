import { TerrainType } from '../types';

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#7ec850',
  forest: '#2d6a2d',
  desert: '#e8c87a',
  flower: '#e87ab5',
  canyon: '#c8703c',
  water: '#4a90d9',
  mountain: '#8c8c8c',
  castle: '#c8a832',
};

export function canBuild(terrain: TerrainType): boolean {
  return terrain !== 'water' && terrain !== 'mountain';
}

export const TERRAIN_CARD_TYPES: TerrainType[] = ['grass', 'forest', 'desert', 'flower', 'canyon'];

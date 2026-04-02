import type { TerrainId } from '../types/game'

export const BUILDABLE_TERRAINS = [
  'grass',
  'forest',
  'desert',
  'flower',
  'canyon',
] as const

export const TERRAIN_META: Record<
  TerrainId,
  { id: TerrainId; label: string; color: string; description: string; buildable: boolean }
> = {
  grass: {
    id: 'grass',
    label: 'Grassland',
    color: '#7aa95c',
    description: '穩定擴張的基本地形。',
    buildable: true,
  },
  forest: {
    id: 'forest',
    label: 'Forest',
    color: '#49734f',
    description: '深色林地，仍可正常建造。',
    buildable: true,
  },
  desert: {
    id: 'desert',
    label: 'Desert',
    color: '#d5b06a',
    description: '較稀疏的可建地。',
    buildable: true,
  },
  flower: {
    id: 'flower',
    label: 'Flower Field',
    color: '#c97b92',
    description: '高對比花田區塊。',
    buildable: true,
  },
  canyon: {
    id: 'canyon',
    label: 'Canyon',
    color: '#a06143',
    description: '偏岩層地貌，仍可放置房屋。',
    buildable: true,
  },
  water: {
    id: 'water',
    label: 'Water',
    color: '#4a8abf',
    description: '不可建造。',
    buildable: false,
  },
  mountain: {
    id: 'mountain',
    label: 'Mountain',
    color: '#6f6d78',
    description: '不可建造。',
    buildable: false,
  },
}

export function drawTerrainCard(turnNumber: number) {
  return BUILDABLE_TERRAINS[(turnNumber - 1) % BUILDABLE_TERRAINS.length]
}
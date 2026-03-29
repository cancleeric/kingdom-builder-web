export type TerrainType = 
  | 'grass'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'mountain'
  | 'water'
  | 'castle'
  | 'location'

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#4ade80',
  forest: '#166534',
  desert: '#fbbf24',
  flower: '#f9a8d4',
  canyon: '#ea580c',
  mountain: '#6b7280',
  water: '#3b82f6',
  castle: '#7c3aed',
  location: '#f59e0b',
}

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  grass: '草地',
  forest: '森林',
  desert: '沙漠',
  flower: '花田',
  canyon: '峽谷',
  mountain: '山脈',
  water: '水域',
  castle: '城堡',
  location: '地點',
}

export const BUILDABLE_TERRAINS: TerrainType[] = [
  'grass', 'forest', 'desert', 'flower', 'canyon'
]

export const CARD_TERRAINS: TerrainType[] = [
  'grass', 'forest', 'desert', 'flower', 'canyon'
]

import { createHexes, hexKey } from './hex'
import type { TerrainId, Tile } from '../types/game'

const TERRAIN_PATTERN: TerrainId[] = [
  'grass',
  'forest',
  'desert',
  'flower',
  'canyon',
  'grass',
  'forest',
  'water',
  'mountain',
  'flower',
  'canyon',
  'desert',
]

const CASTLE_KEYS = new Set(['0,0', '3,-2', '-3,2'])

function resolveTerrain(q: number, r: number): TerrainId {
  const seed = Math.abs(q * 31 + r * 17 + q * r * 13)
  return TERRAIN_PATTERN[seed % TERRAIN_PATTERN.length]
}

export function createInitialBoard(): Tile[] {
  return createHexes(4).map(({ q, r }) => ({
    id: hexKey({ q, r }),
    q,
    r,
    terrain: resolveTerrain(q, r),
    castle: CASTLE_KEYS.has(hexKey({ q, r })),
    hasSettlement: false,
  }))
}

export function placeSettlement(board: Tile[], tileId: string): Tile[] {
  return board.map((tile) =>
    tile.id === tileId
      ? {
          ...tile,
          hasSettlement: true,
        }
      : tile,
  )
}
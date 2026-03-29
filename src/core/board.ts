import type { HexCoord } from './hex'
import type { TerrainType } from './terrain'

export interface Cell {
  coord: HexCoord
  terrain: TerrainType
  owner: number | null
  locationTile: string | null
  hasLocationTile: boolean
}

export type Board = Map<string, Cell>

function createRng(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export const LOCATION_TILES = [
  'farm', 'harbor', 'oracle', 'oasis', 'tower', 'tavern', 'barn', 'paddock'
]

const BOARD_SIZE = 10

export function generateBoard(seed: number): Board {
  const rng = createRng(seed)
  const board: Board = new Map()

  const terrains: TerrainType[] = ['grass', 'forest', 'desert', 'flower', 'canyon']

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let q = 0; q < BOARD_SIZE; q++) {
      const coord: HexCoord = { q, r }
      const key = `${q},${r}`

      const roll = rng()
      let terrain: TerrainType

      if (roll < 0.05) terrain = 'mountain'
      else if (roll < 0.10) terrain = 'water'
      else if (roll < 0.13) terrain = 'castle'
      else if (roll < 0.18) terrain = 'location'
      else {
        const idx = Math.floor(rng() * terrains.length)
        terrain = terrains[idx]
      }

      const hasLocationTile = terrain === 'location'
      const locationTile = hasLocationTile 
        ? LOCATION_TILES[Math.floor(rng() * LOCATION_TILES.length)]
        : null

      board.set(key, {
        coord,
        terrain,
        owner: null,
        locationTile,
        hasLocationTile,
      })
    }
  }

  return board
}

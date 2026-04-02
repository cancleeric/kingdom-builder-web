export type TerrainId =
  | 'grass'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'water'
  | 'mountain'

export interface HexCoordinate {
  q: number
  r: number
}

export type TurnPhase = 'place-settlement' | 'turn-transition' | 'no-legal-moves'

export interface Tile extends HexCoordinate {
  id: string
  terrain: TerrainId
  castle: boolean
  hasSettlement: boolean
}

export interface TurnState {
  number: number
  playerName: string
  terrainCard: Extract<TerrainId, 'grass' | 'forest' | 'desert' | 'flower' | 'canyon'>
  housesRemaining: number
  phase: TurnPhase
}
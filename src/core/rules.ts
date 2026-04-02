import { getNeighbors, hexKey } from './hex'
import { BUILDABLE_TERRAINS } from './terrain'
import type { Tile, TurnState } from '../types/game'

export function getLegalPlacements(board: Tile[], turn: TurnState): Tile[] {
  if (turn.housesRemaining <= 0) {
    return []
  }

  const matchingTerrainTiles = board.filter(
    (tile) =>
      !tile.hasSettlement &&
      tile.terrain === turn.terrainCard &&
      BUILDABLE_TERRAINS.includes(tile.terrain),
  )

  if (matchingTerrainTiles.length === 0) {
    return []
  }

  const settlements = new Set(board.filter((tile) => tile.hasSettlement).map((tile) => tile.id))

  if (settlements.size === 0) {
    return matchingTerrainTiles
  }

  const adjacentTiles = matchingTerrainTiles.filter((tile) =>
    getNeighbors(tile).some((neighbor) => settlements.has(hexKey(neighbor))),
  )

  return adjacentTiles.length > 0 ? adjacentTiles : matchingTerrainTiles
}

export function countCastleScore(board: Tile[]): number {
  return board.filter((tile) => tile.castle && tile.hasSettlement).length * 3
}

export function canPlaceOnTile(board: Tile[], turn: TurnState, tileId: string): boolean {
  return getLegalPlacements(board, turn).some((tile) => tile.id === tileId)
}
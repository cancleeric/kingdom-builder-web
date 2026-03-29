import type { Board } from './board'
import type { HexCoord } from './hex'
import { hexNeighbors, hexKey } from './hex'
import type { TerrainType } from './terrain'
import { BUILDABLE_TERRAINS } from './terrain'

export function getValidPlacements(
  board: Board,
  currentPlayer: number,
  terrain: TerrainType,
): HexCoord[] {
  const valid: HexCoord[] = []

  const hasAdjacentToTerrain = checkHasAdjacentPlacements(board, currentPlayer, terrain)

  for (const [, cell] of board) {
    if (cell.owner !== null) continue
    if (!BUILDABLE_TERRAINS.includes(cell.terrain)) continue
    if (cell.terrain !== terrain) continue

    if (hasAdjacentToTerrain) {
      const neighbors = hexNeighbors(cell.coord)
      const isAdjacent = neighbors.some(n => {
        const nc = board.get(hexKey(n))
        return nc?.owner === currentPlayer
      })
      if (isAdjacent) valid.push(cell.coord)
    } else {
      valid.push(cell.coord)
    }
  }

  return valid
}

function checkHasAdjacentPlacements(
  board: Board,
  currentPlayer: number,
  terrain: TerrainType,
): boolean {
  for (const [, cell] of board) {
    if (cell.terrain !== terrain) continue
    if (cell.owner !== null) continue
    if (!BUILDABLE_TERRAINS.includes(cell.terrain)) continue

    const neighbors = hexNeighbors(cell.coord)
    const isAdjacent = neighbors.some(n => {
      const nc = board.get(hexKey(n))
      return nc?.owner === currentPlayer
    })
    if (isAdjacent) return true
  }
  return false
}

export function isValidPlacement(
  board: Board,
  currentPlayer: number,
  terrain: TerrainType,
  coord: HexCoord,
): boolean {
  const valid = getValidPlacements(board, currentPlayer, terrain)
  return valid.some(v => v.q === coord.q && v.r === coord.r)
}

export function checkLocationTileEarned(
  board: Board,
  coord: HexCoord,
  _currentPlayer: number,
): string | null {
  const neighbors = hexNeighbors(coord)
  for (const n of neighbors) {
    const nc = board.get(hexKey(n))
    if (nc?.terrain === 'location' && nc.hasLocationTile && nc.locationTile) {
      return nc.locationTile
    }
  }
  return null
}

import { AxialCoord, hexNeighbors, hexEquals } from './hex';
import { Board } from './board';
import { Terrain, isBuildable } from './terrain';
import { HexCell } from '../types';

/**
 * Get all valid placement positions for a player based on the current terrain card
 * 
 * Rules (Kingdom Builder official rules):
 * 1. Can only place on cells matching the terrain card
 * 2. Cannot place on mountain or water
 * 3. Cannot place on cells that already have settlements
 * 4. First settlement this turn: can place on ANY matching terrain cell
 * 5. Second/third settlement this turn: MUST place adjacent to settlements placed THIS TURN
 * 6. If no adjacent cells available (fallback): can place on any matching terrain cell
 */
export function getValidPlacements(
  board: Board,
  terrainCard: Terrain,
  _playerId: number, // Parameter kept for API compatibility; placement rules now depend on placementsThisTurn
  placementsThisTurn: AxialCoord[] = []
): AxialCoord[] {
  // Get all buildable cells of the terrain type
  const matchingCells = board
    .getCellsByTerrain(terrainCard)
    .filter(cell => isBuildable(cell.terrain) && cell.settlement === undefined);

  if (matchingCells.length === 0) {
    return [];
  }

  // First settlement this turn: can place anywhere on matching terrain (unrestricted)
  if (placementsThisTurn.length === 0) {
    return matchingCells.map(cell => cell.coord);
  }

  // Second/third settlement: must be adjacent to placements THIS TURN
  const adjacentCells = new Set<string>();

  placementsThisTurn.forEach(placement => {
    const neighbors = hexNeighbors(placement);
    neighbors.forEach(neighbor => {
      const neighborCell = board.getCell(neighbor);
      if (neighborCell && neighborCell.terrain === terrainCard && neighborCell.settlement === undefined) {
        adjacentCells.add(`${neighbor.q},${neighbor.r}`);
      }
    });
  });

  // If there are adjacent cells, must place there
  if (adjacentCells.size > 0) {
    return Array.from(adjacentCells).map(key => {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    });
  }

  // Fallback: no adjacent cells available → can place anywhere on matching terrain
  return matchingCells.map(cell => cell.coord);
}

/**
 * Check if a placement is valid
 */
export function isValidPlacement(
  board: Board,
  coord: AxialCoord,
  terrainCard: Terrain,
  playerId: number
): boolean {
  const validPlacements = getValidPlacements(board, terrainCard, playerId);
  return validPlacements.some(valid => hexEquals(valid, coord));
}

/**
 * Get neighbors of a player's settlements
 */
export function getSettlementNeighbors(board: Board, playerId: number): HexCell[] {
  const playerSettlements = board.getPlayerSettlements(playerId);
  const neighbors = new Set<string>();

  playerSettlements.forEach(settlement => {
    const neighborCoords = hexNeighbors(settlement.coord);
    neighborCoords.forEach(coord => {
      const cell = board.getCell(coord);
      if (cell && cell.settlement === undefined) {
        neighbors.add(`${coord.q},${coord.r}`);
      }
    });
  });

  return Array.from(neighbors)
    .map(key => {
      const [q, r] = key.split(',').map(Number);
      return board.getCell({ q, r });
    })
    .filter((cell): cell is HexCell => cell !== undefined);
}

/**
 * Check if any settlements are adjacent to a specific location
 */
export function isAdjacentToLocation(
  board: Board,
  playerId: number,
  locationName: string
): boolean {
  const playerSettlements = board.getPlayerSettlements(playerId);

  return playerSettlements.some(settlement => {
    const neighbors = hexNeighbors(settlement.coord);
    return neighbors.some(neighbor => {
      const cell = board.getCell(neighbor);
      return cell?.location === locationName;
    });
  });
}

/**
 * Count settlements adjacent to castles (for scoring)
 */
export function countSettlementsAdjacentToCastles(board: Board, playerId: number): number {
  const playerSettlements = board.getPlayerSettlements(playerId);
  let count = 0;

  playerSettlements.forEach(settlement => {
    const neighbors = hexNeighbors(settlement.coord);
    const adjacentToCastle = neighbors.some(neighbor => {
      const cell = board.getCell(neighbor);
      return cell?.location === 'Castle';
    });

    if (adjacentToCastle) {
      count++;
    }
  });

  return count;
}

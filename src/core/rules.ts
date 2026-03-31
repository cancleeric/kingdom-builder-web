import type { AxialCoord } from './hex';
import { hexNeighbors, hexEquals } from './hex';
import { Terrain, Location, isBuildable } from './terrain';
import { Board } from './board';

/**
 * Get all valid placement positions for the current player given a terrain card
 */
export function getValidPlacements(
  board: Board,
  terrain: Terrain,
  playerId: number
): AxialCoord[] {
  const matchingCells = board
    .getCellsByTerrain(terrain)
    .filter(cell => !cell.settlement && isBuildable(cell.terrain));

  if (matchingCells.length === 0) return [];

  const playerSettlements = board.getPlayerSettlements(playerId);

  if (playerSettlements.length === 0) {
    return matchingCells.map(cell => cell.coord);
  }

  // Find matching terrain cells adjacent to existing settlements
  const adjacentMatching = matchingCells.filter(cell =>
    playerSettlements.some(settlement =>
      hexNeighbors(settlement.coord).some(neighbor =>
        hexEquals(neighbor, cell.coord)
      )
    )
  );

  // If there are adjacent matching cells, player must use them
  if (adjacentMatching.length > 0) {
    return adjacentMatching.map(cell => cell.coord);
  }

  // Otherwise, can place anywhere on matching terrain
  return matchingCells.map(cell => cell.coord);
}

/**
 * Check if a specific placement is valid
 */
export function isValidPlacement(
  board: Board,
  coord: AxialCoord,
  terrain: Terrain,
  playerId: number
): boolean {
  const validPlacements = getValidPlacements(board, terrain, playerId);
  return validPlacements.some(valid => hexEquals(valid, coord));
}

/**
 * Get empty neighbor cells of all player's settlements
 */
export function getSettlementNeighbors(board: Board, playerId: number): AxialCoord[] {
  const playerSettlements = board.getPlayerSettlements(playerId);
  const neighbors = new Set<string>();

  playerSettlements.forEach(settlement => {
    hexNeighbors(settlement.coord).forEach(neighbor => {
      const cell = board.getCell(neighbor);
      if (cell && !cell.settlement) {
        neighbors.add(`${neighbor.q},${neighbor.r}`);
      }
    });
  });

  return Array.from(neighbors).map(key => {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
  });
}

/**
 * Check if any of the player's settlements are adjacent to a specific location type
 */
export function isAdjacentToLocation(
  board: Board,
  playerId: number,
  location: Location
): boolean {
  const playerSettlements = board.getPlayerSettlements(playerId);

  return playerSettlements.some(settlement =>
    hexNeighbors(settlement.coord).some(neighbor => {
      const cell = board.getCell(neighbor);
      return cell?.location === location;
    })
  );
}

/**
 * Count how many of a player's settlements are adjacent to castles
 */
export function countSettlementsAdjacentToCastles(board: Board, playerId: number): number {
  const playerSettlements = board.getPlayerSettlements(playerId);

  return playerSettlements.filter(settlement =>
    hexNeighbors(settlement.coord).some(neighbor => {
      const cell = board.getCell(neighbor);
      return cell?.location === Location.Castle;
    })
  ).length;
}

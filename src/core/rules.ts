import { BoardState, TerrainType, Player } from '../types';
import { getNeighbors, isValidCell } from './hex';
import { canBuild } from './terrain';

export function hasAdjacentHouse(board: BoardState, row: number, col: number, playerId: number): boolean {
  const neighbors = getNeighbors(row, col, board.length);
  return neighbors.some(({ row: r, col: c }) => board[r][c].hasHouse && board[r][c].playerId === playerId);
}

export function findValidPlacements(
  board: BoardState,
  terrain: TerrainType,
  player: Player
): { row: number; col: number }[] {
  const size = board.length;
  const results: { row: number; col: number }[] = [];

  const hasExistingHouses = board.some(row =>
    row.some(cell => cell.hasHouse && cell.playerId === player.id)
  );

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell.terrain !== terrain) continue;
      if (!canBuild(cell.terrain)) continue;
      if (cell.hasHouse) continue;
      if (!isValidCell(r, c, size)) continue;

      if (hasExistingHouses) {
        if (hasAdjacentHouse(board, r, c, player.id)) {
          results.push({ row: r, col: c });
        }
      } else {
        results.push({ row: r, col: c });
      }
    }
  }

  if (results.length === 0 && hasExistingHouses) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = board[r][c];
        if (cell.terrain !== terrain) continue;
        if (!canBuild(cell.terrain)) continue;
        if (cell.hasHouse) continue;
        results.push({ row: r, col: c });
      }
    }
  }

  return results;
}

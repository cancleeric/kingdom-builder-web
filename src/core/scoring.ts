import type { GameState, HexCell } from '../types';
import { hexNeighbors } from './hex';
import { getCell } from './board';

export function calculateScore(state: GameState): number[] {
  const scores = state.players.map((_, playerId) => {
    let score = 0;
    const castles = state.board.filter(c => c.terrain === 'castle');
    castles.forEach(castle => {
      const neighbors = hexNeighbors(castle.coord);
      neighbors.forEach(n => {
        const cell = getCell(state.board, n);
        if (cell?.settlement === playerId) score += 3;
      });
    });
    return score;
  });
  return scores;
}

export function getPlayerSettlements(board: HexCell[], playerId: number): HexCell[] {
  return board.filter(c => c.settlement === playerId);
}

export function countGroups(board: HexCell[], playerId: number): number {
  const settlements = board.filter(c => c.settlement === playerId);
  if (settlements.length === 0) return 0;

  const visited = new Set<string>();
  let groups = 0;

  for (const cell of settlements) {
    const key = `${cell.coord.q},${cell.coord.r}`;
    if (visited.has(key)) continue;
    groups++;
    const queue = [cell];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const k = `${current.coord.q},${current.coord.r}`;
      if (visited.has(k)) continue;
      visited.add(k);
      const neighbors = hexNeighbors(current.coord);
      neighbors.forEach(n => {
        const nc = getCell(board, n);
        if (nc?.settlement === playerId && !visited.has(`${n.q},${n.r}`)) {
          queue.push(nc);
        }
      });
    }
  }
  return groups;
}

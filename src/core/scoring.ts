import { BoardState, Player, ScoringCardType } from '../types';
import { getNeighbors } from './hex';

export function calculateScore(
  board: BoardState,
  players: Player[],
  scoringCards: ScoringCardType[]
): number[] {
  const scores = players.map(() => 0);
  const size = board.length;

  for (const card of scoringCards) {
    switch (card) {
      case 'lords': {
        for (let pi = 0; pi < players.length; pi++) {
          const quadrantHouses = [0, 0, 0, 0];
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              const cell = board[r][c];
              if (cell.hasHouse && cell.playerId === players[pi].id) {
                const q = (r < 10 ? 0 : 2) + (c < 10 ? 0 : 1);
                quadrantHouses[q]++;
              }
            }
          }
          scores[pi] += quadrantHouses.filter(h => h > 0).length * 3;
        }
        break;
      }
      case 'merchants': {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (board[r][c].terrain === 'castle') {
              const neighbors = getNeighbors(r, c, size);
              for (const { row: nr, col: nc } of neighbors) {
                const neighbor = board[nr][nc];
                if (neighbor.hasHouse && neighbor.playerId !== undefined) {
                  const pi = players.findIndex(p => p.id === neighbor.playerId);
                  if (pi !== -1) scores[pi] += 2;
                }
              }
            }
          }
        }
        break;
      }
      case 'citizens': {
        const visited = Array.from({ length: size }, () => new Array(size).fill(false));
        for (let pi = 0; pi < players.length; pi++) {
          let largestGroup = 0;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (!visited[r][c] && board[r][c].hasHouse && board[r][c].playerId === players[pi].id) {
                const queue = [{ row: r, col: c }];
                let groupSize = 0;
                while (queue.length > 0) {
                  const curr = queue.shift()!;
                  if (visited[curr.row][curr.col]) continue;
                  visited[curr.row][curr.col] = true;
                  groupSize++;
                  for (const n of getNeighbors(curr.row, curr.col, size)) {
                    if (!visited[n.row][n.col] && board[n.row][n.col].hasHouse && board[n.row][n.col].playerId === players[pi].id) {
                      queue.push(n);
                    }
                  }
                }
                largestGroup = Math.max(largestGroup, groupSize);
              }
            }
          }
          scores[pi] += largestGroup;
        }
        break;
      }
      default:
        for (let pi = 0; pi < players.length; pi++) {
          let count = 0;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (board[r][c].hasHouse && board[r][c].playerId === players[pi].id) count++;
            }
          }
          scores[pi] += count;
        }
    }
  }

  return scores;
}

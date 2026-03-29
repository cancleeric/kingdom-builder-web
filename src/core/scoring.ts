import type { Board } from './board'
import { hexNeighbors, hexKey } from './hex'

export interface PlayerScore {
  player: number
  name: string
  total: number
  castleBonus: number
  settlementCount: number
}

export function calculateScores(
  board: Board,
  playerNames: string[],
): PlayerScore[] {
  const scores: PlayerScore[] = playerNames.map((name, i) => ({
    player: i,
    name,
    total: 0,
    castleBonus: 0,
    settlementCount: 0,
  }))

  for (const [, cell] of board) {
    if (cell.owner === null) continue
    const score = scores[cell.owner]
    if (!score) continue
    score.settlementCount++

    const neighbors = hexNeighbors(cell.coord)
    for (const n of neighbors) {
      const nc = board.get(hexKey(n))
      if (nc?.terrain === 'castle') {
        score.castleBonus += 3
        score.total += 3
      }
    }
  }

  return scores
}

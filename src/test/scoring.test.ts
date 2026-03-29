import { describe, it, expect } from 'vitest'
import { generateBoard } from '../core/board'
import { calculateScores } from '../core/scoring'

describe('calculateScores', () => {
  it('returns scores for all players', () => {
    const board = generateBoard(42)
    const scores = calculateScores(board, ['Alice', 'Bob'])
    expect(scores).toHaveLength(2)
    expect(scores[0].name).toBe('Alice')
    expect(scores[1].name).toBe('Bob')
  })

  it('returns zero score for empty board', () => {
    const board = generateBoard(42)
    const scores = calculateScores(board, ['Alice', 'Bob'])
    expect(scores[0].total).toBe(0)
    expect(scores[1].total).toBe(0)
  })

  it('counts settlements correctly', () => {
    const board = generateBoard(42)
    const cells = Array.from(board.values()).filter(c => c.terrain === 'grass')
    // Place 3 settlements for player 0
    let count = 0
    for (const cell of cells) {
      if (count >= 3) break
      board.set(`${cell.coord.q},${cell.coord.r}`, { ...cell, owner: 0 })
      count++
    }

    const scores = calculateScores(board, ['Alice', 'Bob'])
    expect(scores[0].settlementCount).toBe(3)
    expect(scores[1].settlementCount).toBe(0)
  })

  it('awards castle bonuses', () => {
    const board = generateBoard(42)
    // Find a castle
    const castleCell = Array.from(board.values()).find(c => c.terrain === 'castle')
    if (!castleCell) return

    // Find a neighbor to place a settlement
    const { q, r } = castleCell.coord
    const neighborKey = `${q + 1},${r}`
    const neighbor = board.get(neighborKey)
    if (!neighbor || neighbor.owner !== null) return

    board.set(neighborKey, { ...neighbor, owner: 0 })

    const scores = calculateScores(board, ['Alice', 'Bob'])
    // Player 0 should have castle bonus
    expect(scores[0].castleBonus).toBeGreaterThanOrEqual(3)
    expect(scores[0].total).toBeGreaterThanOrEqual(3)
  })
})

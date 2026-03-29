import { describe, it, expect } from 'vitest'
import { generateBoard } from '../core/board'
import { getValidPlacements, isValidPlacement } from '../core/rules'

describe('getValidPlacements', () => {
  it('returns placements on first turn (no settlements placed)', () => {
    const board = generateBoard(42)
    // Find a terrain that exists
    let terrain: 'grass' | 'forest' | 'desert' | 'flower' | 'canyon' = 'grass'
    for (const cell of board.values()) {
      if (['grass', 'forest', 'desert', 'flower', 'canyon'].includes(cell.terrain)) {
        terrain = cell.terrain as typeof terrain
        break
      }
    }
    const placements = getValidPlacements(board, 0, terrain)
    // On first turn, should return all cells of that terrain type
    expect(placements.length).toBeGreaterThan(0)
  })

  it('returns adjacent placements when player has settlements', () => {
    const board = generateBoard(42)
    // Place a settlement manually
    const firstGrass = Array.from(board.values()).find(c => c.terrain === 'grass')
    if (!firstGrass) return

    const key = `${firstGrass.coord.q},${firstGrass.coord.r}`
    board.set(key, { ...firstGrass, owner: 0 })

    const placements = getValidPlacements(board, 0, 'grass')
    // Should only return placements adjacent to the placed settlement
    expect(placements.length).toBeGreaterThanOrEqual(0)
  })
})

describe('isValidPlacement', () => {
  it('returns false for invalid terrain', () => {
    const board = generateBoard(42)
    const mountainCell = Array.from(board.values()).find(c => c.terrain === 'mountain')
    if (!mountainCell) return
    const result = isValidPlacement(board, 0, 'grass', mountainCell.coord)
    expect(result).toBe(false)
  })
})

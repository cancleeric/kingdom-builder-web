import { describe, it, expect } from 'vitest'
import { generateBoard } from '../core/board'

describe('generateBoard', () => {
  it('generates a board with 100 cells', () => {
    const board = generateBoard(42)
    expect(board.size).toBe(100)
  })

  it('generates deterministic boards for same seed', () => {
    const board1 = generateBoard(42)
    const board2 = generateBoard(42)
    expect(Array.from(board1.entries())).toEqual(Array.from(board2.entries()))
  })

  it('generates different boards for different seeds', () => {
    const board1 = generateBoard(42)
    const board2 = generateBoard(99)
    const cells1 = Array.from(board1.values()).map(c => c.terrain)
    const cells2 = Array.from(board2.values()).map(c => c.terrain)
    expect(cells1).not.toEqual(cells2)
  })

  it('all cells have valid terrain types', () => {
    const board = generateBoard(42)
    const validTerrains = ['grass', 'forest', 'desert', 'flower', 'canyon', 'mountain', 'water', 'castle', 'location']
    for (const cell of board.values()) {
      expect(validTerrains).toContain(cell.terrain)
    }
  })

  it('all cells start with no owner', () => {
    const board = generateBoard(42)
    for (const cell of board.values()) {
      expect(cell.owner).toBeNull()
    }
  })

  it('location cells have location tiles', () => {
    const board = generateBoard(42)
    for (const cell of board.values()) {
      if (cell.terrain === 'location') {
        expect(cell.hasLocationTile).toBe(true)
        expect(cell.locationTile).not.toBeNull()
      }
    }
  })
})

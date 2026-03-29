import { describe, it, expect } from 'vitest'
import { hexDistance, hexNeighbors, hexKey } from '../core/hex'

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0)
  })

  it('returns 1 for adjacent hex', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1)
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1)
  })

  it('calculates distance correctly', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -1 })).toBe(3)
  })
})

describe('hexNeighbors', () => {
  it('returns 6 neighbors', () => {
    expect(hexNeighbors({ q: 0, r: 0 })).toHaveLength(6)
  })

  it('returns correct neighbors', () => {
    const neighbors = hexNeighbors({ q: 1, r: 1 })
    expect(neighbors).toContainEqual({ q: 2, r: 1 })
    expect(neighbors).toContainEqual({ q: 0, r: 1 })
    expect(neighbors).toContainEqual({ q: 1, r: 2 })
    expect(neighbors).toContainEqual({ q: 1, r: 0 })
  })
})

describe('hexKey', () => {
  it('returns correct key string', () => {
    expect(hexKey({ q: 3, r: 5 })).toBe('3,5')
  })
})

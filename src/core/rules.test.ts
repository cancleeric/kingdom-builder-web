import { describe, expect, it } from 'vitest'
import { getLegalPlacements } from './rules'
import type { Tile, TurnState } from '../types/game'

function buildTurn(terrainCard: TurnState['terrainCard']): TurnState {
  return {
    number: 1,
    playerName: '玩家一',
    terrainCard,
    housesRemaining: 3,
    phase: 'place-settlement',
  }
}

describe('getLegalPlacements', () => {
  it('allows any matching terrain when no settlement exists', () => {
    const board: Tile[] = [
      { id: '0,0', q: 0, r: 0, terrain: 'grass', castle: false, hasSettlement: false },
      { id: '1,0', q: 1, r: 0, terrain: 'grass', castle: false, hasSettlement: false },
      { id: '0,1', q: 0, r: 1, terrain: 'forest', castle: false, hasSettlement: false },
    ]

    expect(getLegalPlacements(board, buildTurn('grass')).map((tile) => tile.id)).toEqual([
      '0,0',
      '1,0',
    ])
  })

  it('forces adjacency when adjacent matching terrain exists', () => {
    const board: Tile[] = [
      { id: '0,0', q: 0, r: 0, terrain: 'grass', castle: false, hasSettlement: true },
      { id: '1,0', q: 1, r: 0, terrain: 'forest', castle: false, hasSettlement: false },
      { id: '2,0', q: 2, r: 0, terrain: 'forest', castle: false, hasSettlement: false },
      { id: '0,1', q: 0, r: 1, terrain: 'forest', castle: false, hasSettlement: false },
    ]

    expect(getLegalPlacements(board, buildTurn('forest')).map((tile) => tile.id).sort()).toEqual([
      '0,1',
      '1,0',
    ])
  })

  it('falls back to any matching terrain when adjacency is impossible', () => {
    const board: Tile[] = [
      { id: '0,0', q: 0, r: 0, terrain: 'grass', castle: false, hasSettlement: true },
      { id: '3,0', q: 3, r: 0, terrain: 'desert', castle: false, hasSettlement: false },
      { id: '2,1', q: 2, r: 1, terrain: 'desert', castle: false, hasSettlement: false },
    ]

    expect(getLegalPlacements(board, buildTurn('desert')).map((tile) => tile.id).sort()).toEqual([
      '2,1',
      '3,0',
    ])
  })
})
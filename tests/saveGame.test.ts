import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveGame,
  loadGame,
  clearSave,
  getSaveMetadata,
  SAVE_KEY,
  CURRENT_SAVE_VERSION,
} from '../src/utils/saveGame'
import type { GameState } from '../src/types/game'

// Minimal valid GameState for testing
function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: [],
    players: [
      { id: 0, name: 'Player 1', housesRemaining: 40, locationTiles: [], score: 0 },
    ],
    currentPlayerId: 0,
    turn: 1,
    currentTerrainCard: null,
    housesPlacedThisTurn: 0,
    scoringCards: [],
    phase: 'playing',
    ...overrides,
  }
}

describe('saveGame / loadGame round-trip', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads the game state correctly', () => {
    const state = makeState({ turn: 5 })
    saveGame(state)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.turn).toBe(5)
    expect(loaded!.players[0].name).toBe('Player 1')
  })

  it('persists board and player data', () => {
    const state = makeState({
      players: [
        { id: 0, name: 'Alice', housesRemaining: 35, locationTiles: [], score: 10 },
        { id: 1, name: 'Bob', housesRemaining: 38, locationTiles: [], score: 4 },
      ],
      currentPlayerId: 1,
      phase: 'playing',
    })
    saveGame(state)
    const loaded = loadGame()
    expect(loaded!.players).toHaveLength(2)
    expect(loaded!.players[0].name).toBe('Alice')
    expect(loaded!.players[0].score).toBe(10)
    expect(loaded!.currentPlayerId).toBe(1)
  })

  it('persists the terrain card', () => {
    const state = makeState({ currentTerrainCard: 'forest' })
    saveGame(state)
    const loaded = loadGame()
    expect(loaded!.currentTerrainCard).toBe('forest')
  })

  it('overwrites previous save', () => {
    saveGame(makeState({ turn: 1 }))
    saveGame(makeState({ turn: 9 }))
    const loaded = loadGame()
    expect(loaded!.turn).toBe(9)
  })
})

describe('loadGame — no save', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is saved', () => {
    expect(loadGame()).toBeNull()
  })
})

describe('clearSave', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes the save entry from localStorage', () => {
    saveGame(makeState())
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
    clearSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(loadGame()).toBeNull()
  })
})

describe('version mismatch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears the save and returns null when saveVersion does not match', () => {
    const badSave = {
      saveVersion: CURRENT_SAVE_VERSION + 99,
      savedAt: new Date().toISOString(),
      state: makeState(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(badSave))

    const result = loadGame()
    expect(result).toBeNull()
    // Save should be cleared
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('clears the save and returns null when saveVersion is 0', () => {
    const badSave = {
      saveVersion: 0,
      savedAt: new Date().toISOString(),
      state: makeState(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(badSave))

    expect(loadGame()).toBeNull()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })
})

describe('getSaveMetadata', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when there is no save', () => {
    expect(getSaveMetadata()).toBeNull()
  })

  it('returns the full save schema including timestamp', () => {
    const state = makeState()
    saveGame(state)
    const meta = getSaveMetadata()
    expect(meta).not.toBeNull()
    expect(meta!.saveVersion).toBe(CURRENT_SAVE_VERSION)
    expect(typeof meta!.savedAt).toBe('string')
    expect(new Date(meta!.savedAt).getFullYear()).toBeGreaterThanOrEqual(2024)
  })

  it('returns the schema even for a version-mismatched save without clearing', () => {
    const oldSave = {
      saveVersion: 999,
      savedAt: new Date().toISOString(),
      state: makeState(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave))
    const meta = getSaveMetadata()
    expect(meta!.saveVersion).toBe(999)
    // Key still exists — getSaveMetadata does NOT clear
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
  })
})

describe('corrupt save data', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null and clears the key when data is not valid JSON', () => {
    localStorage.setItem(SAVE_KEY, 'not-json{{{{')
    expect(loadGame()).toBeNull()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })
})

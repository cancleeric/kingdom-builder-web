import { create } from 'zustand'
import { generateBoard, type Board } from '../core/board'
import { getValidPlacements, isValidPlacement, checkLocationTileEarned } from '../core/rules'
import { calculateScores, type PlayerScore } from '../core/scoring'
import { hexKey } from '../core/hex'
import type { TerrainType } from '../core/terrain'
import { CARD_TERRAINS } from '../core/terrain'

export type GamePhase = 'setup' | 'playing' | 'gameover'

export interface PlayerState {
  id: number
  name: string
  settlements: number
  locationTiles: string[]
}

interface GameState {
  phase: GamePhase
  players: PlayerState[]
  currentPlayerIndex: number
  board: Board
  currentTerrain: TerrainType | null
  placementsThisTurn: number
  seed: number
  history: Board[]
  scores: PlayerScore[]
  rng: () => number
  
  startGame: (playerNames: string[], seed: number) => void
  placeSettlement: (q: number, r: number) => boolean
  endTurn: () => void
  undo: () => void
  resetGame: () => void
}

function createRng(seed: number) {
  let s = seed
  return () => {
    s |= 0
    s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function drawCard(rng: () => number): TerrainType {
  return CARD_TERRAINS[Math.floor(rng() * CARD_TERRAINS.length)]
}

const MAX_SETTLEMENTS = 40
const PLACEMENTS_PER_TURN = 3

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'setup',
  players: [],
  currentPlayerIndex: 0,
  board: new Map(),
  currentTerrain: null,
  placementsThisTurn: 0,
  seed: 42,
  history: [],
  scores: [],
  rng: createRng(42),

  startGame: (playerNames: string[], seed: number) => {
    const rng = createRng(seed)
    const board = generateBoard(seed)
    const terrain = drawCard(rng)
    set({
      phase: 'playing',
      players: playerNames.map((name, id) => ({
        id,
        name,
        settlements: MAX_SETTLEMENTS,
        locationTiles: [],
      })),
      currentPlayerIndex: 0,
      board,
      currentTerrain: terrain,
      placementsThisTurn: 0,
      seed,
      history: [],
      scores: [],
      rng,
    })
  },

  placeSettlement: (q: number, r: number) => {
    const state = get()
    if (state.phase !== 'playing') return false
    if (!state.currentTerrain) return false
    if (state.placementsThisTurn >= PLACEMENTS_PER_TURN) return false

    const coord = { q, r }
    const valid = isValidPlacement(state.board, state.currentPlayerIndex, state.currentTerrain, coord)
    if (!valid) return false

    const player = state.players[state.currentPlayerIndex]
    if (player.settlements <= 0) return false

    const newBoard = new Map(state.board)
    const key = hexKey(coord)
    const cell = newBoard.get(key)
    if (!cell) return false

    newBoard.set(key, { ...cell, owner: state.currentPlayerIndex })

    const tile = checkLocationTileEarned(newBoard, coord, state.currentPlayerIndex)
    const newPlayers = state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p
      return {
        ...p,
        settlements: p.settlements - 1,
        locationTiles: tile ? [...p.locationTiles, tile] : p.locationTiles,
      }
    })

    const newPlacements = state.placementsThisTurn + 1
    const isGameOver = newPlayers.some(p => p.settlements <= 0)

    set({
      board: newBoard,
      players: newPlayers,
      placementsThisTurn: newPlacements,
      history: [...state.history, state.board],
      ...(isGameOver ? {
        phase: 'gameover',
        scores: calculateScores(newBoard, newPlayers.map(p => p.name)),
      } : {}),
    })

    return true
  },

  endTurn: () => {
    const state = get()
    if (state.phase !== 'playing') return
    if (state.placementsThisTurn < PLACEMENTS_PER_TURN) {
      const validPlacements = getValidPlacements(state.board, state.currentPlayerIndex, state.currentTerrain!)
      if (validPlacements.length > 0) return
    }

    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
    const newTerrain = drawCard(state.rng)
    
    set({
      currentPlayerIndex: nextPlayerIndex,
      currentTerrain: newTerrain,
      placementsThisTurn: 0,
      history: [],
    })
  },

  undo: () => {
    const state = get()
    if (state.history.length === 0) return
    const previousBoard = state.history[state.history.length - 1]
    
    const playerIdx = state.currentPlayerIndex
    const currentSettlements = Array.from(state.board.values()).filter(c => c.owner === playerIdx).length
    const previousSettlements = Array.from(previousBoard.values()).filter(c => c.owner === playerIdx).length
    const diff = currentSettlements - previousSettlements

    set({
      board: previousBoard,
      placementsThisTurn: state.placementsThisTurn - 1,
      history: state.history.slice(0, -1),
      players: state.players.map((p, i) => {
        if (i !== playerIdx) return p
        return { ...p, settlements: p.settlements + diff }
      }),
    })
  },

  resetGame: () => {
    set({
      phase: 'setup',
      players: [],
      currentPlayerIndex: 0,
      board: new Map(),
      currentTerrain: null,
      placementsThisTurn: 0,
      history: [],
      scores: [],
    })
  },
}))

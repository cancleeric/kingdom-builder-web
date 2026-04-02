import { create } from 'zustand'
import { createInitialBoard, placeSettlement } from '../core/board'
import { drawTerrainCard, TERRAIN_META } from '../core/terrain'
import { canPlaceOnTile, countCastleScore, getLegalPlacements } from '../core/rules'
import type { Tile, TurnPhase, TurnState } from '../types/game'

interface TurnStatus {
  title: string
  detail: string
}

interface GameStore {
  board: Tile[]
  turn: TurnState
  availablePlacements: Tile[]
  score: number
  status: TurnStatus
  placeOnBoard: (tileId: string) => void
  nextTurn: () => void
}

function buildTurn(number: number, housesRemaining = 3, phase: TurnPhase = 'place-settlement'): TurnState {
  return {
    number,
    playerName: '玩家一',
    terrainCard: drawTerrainCard(number),
    housesRemaining,
    phase,
  }
}

export function buildTurnStatus(turn: TurnState, placements: Tile[]): TurnStatus {
  const terrainLabel = TERRAIN_META[turn.terrainCard].label
  const completedSteps = 3 - turn.housesRemaining

  if (placements.length === 0) {
    return {
      title: `${turn.playerName} 的回合`,
      detail: `抽到 ${terrainLabel}，但目前沒有合法位置，請直接跳到下一回合。`,
    }
  }

  if (turn.phase === 'turn-transition') {
    return {
      title: `輪到 ${turn.playerName}`,
      detail: `新回合抽到 ${terrainLabel}，請在高亮格子放置 3 間 settlement。`,
    }
  }

  return {
    title: `${turn.playerName} 的回合`,
    detail: `請在 ${terrainLabel} 放置 settlement（還剩 ${turn.housesRemaining} 個），目前進度 ${completedSteps}/3。`,
  }
}

function resolvePhase(placements: Tile[], fallbackPhase: TurnPhase): TurnPhase {
  return placements.length === 0 ? 'no-legal-moves' : fallbackPhase
}

export function createInitialGameSnapshot() {
  const board = createInitialBoard()
  const turn = buildTurn(1)
  const availablePlacements = getLegalPlacements(board, turn)

  return {
    board,
    turn: {
      ...turn,
      phase: resolvePhase(availablePlacements, turn.phase),
    },
    availablePlacements,
    score: countCastleScore(board),
    status: buildTurnStatus(
      {
        ...turn,
        phase: resolvePhase(availablePlacements, turn.phase),
      },
      availablePlacements,
    ),
  }
}

export const useGameStore = create<GameStore>((set) => {
  const initialState = createInitialGameSnapshot()

  return {
    ...initialState,
    placeOnBoard: (tileId) => {
      set((state) => {
        if (!canPlaceOnTile(state.board, state.turn, tileId)) {
          return {
            ...state,
            status: {
              title: `${state.turn.playerName} 的回合`,
              detail: '這個格子目前不能放置房屋，請選擇發亮的合法格子。',
            },
          }
        }

        const board = placeSettlement(state.board, tileId)
        const housesRemaining = state.turn.housesRemaining - 1

        if (housesRemaining > 0) {
          const turn = buildTurn(state.turn.number, housesRemaining, 'place-settlement')
          const availablePlacements = getLegalPlacements(board, turn)
          const nextTurn = {
            ...turn,
            phase: resolvePhase(availablePlacements, turn.phase),
          }

          return {
            board,
            turn: nextTurn,
            availablePlacements,
            score: countCastleScore(board),
            status: buildTurnStatus(nextTurn, availablePlacements),
          }
        }

        const nextTurnNumber = state.turn.number + 1
        const turn = buildTurn(nextTurnNumber, 3, 'turn-transition')
        const availablePlacements = getLegalPlacements(board, turn)
        const nextTurn = {
          ...turn,
          phase: resolvePhase(availablePlacements, turn.phase),
        }

        return {
          board,
          turn: nextTurn,
          availablePlacements,
          score: countCastleScore(board),
          status: buildTurnStatus(nextTurn, availablePlacements),
        }
      })
    },
    nextTurn: () => {
      set((state) => {
        const turnNumber = state.turn.number + 1
        const turn = buildTurn(turnNumber, 3, 'turn-transition')
        const availablePlacements = getLegalPlacements(state.board, turn)
        const nextTurn = {
          ...turn,
          phase: resolvePhase(availablePlacements, turn.phase),
        }

        return {
          turn: nextTurn,
          availablePlacements,
          status: buildTurnStatus(nextTurn, availablePlacements),
        }
      })
    },
  }
})
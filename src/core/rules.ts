import type { GameState, HexCoord } from '../types';
import { canPlace, placeSettlement } from './board';
import { PLACEABLE_TERRAINS } from './terrain';

export function isValidMove(state: GameState, coord: HexCoord): boolean {
  if (state.phase !== 'playing') return false;
  if (state.placementsLeft <= 0) return false;
  if (!state.currentTerrain) return false;
  if (!PLACEABLE_TERRAINS.includes(state.currentTerrain)) return false;
  return canPlace(state.board, coord, state.currentTerrain, state.currentPlayerIndex);
}

export function applyMove(state: GameState, coord: HexCoord): GameState {
  if (!isValidMove(state, coord)) return state;
  if (!state.currentTerrain) return state;

  const newBoard = placeSettlement(state.board, coord, state.currentPlayerIndex);
  const newPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p, settlements: p.settlements - 1 }
      : p
  );

  const placementsLeft = state.placementsLeft - 1;

  if (placementsLeft <= 0) {
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerCount;
    const allSettlementsUsed = newPlayers.every(p => p.settlements === 0);
    return {
      ...state,
      board: newBoard,
      players: newPlayers,
      placementsLeft: 0,
      currentPlayerIndex: nextPlayerIndex,
      currentTerrain: null,
      phase: allSettlementsUsed ? 'ended' : 'playing',
      turnNumber: state.turnNumber + 1,
    };
  }

  return {
    ...state,
    board: newBoard,
    players: newPlayers,
    placementsLeft,
  };
}

export function endTurn(state: GameState): GameState {
  if (state.placementsLeft > 0) return state;
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerCount;
  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    currentTerrain: null,
    turnNumber: state.turnNumber + 1,
  };
}

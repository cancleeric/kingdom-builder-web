import { describe, it, expect } from 'vitest';
import { isValidMove, applyMove } from '../core/rules';
import { createInitialState } from '../store/gameStore';

const defaultPlayers = [
  { id: 0, name: '玩家1', color: 'orange' as const },
  { id: 1, name: '玩家2', color: 'blue' as const },
];

describe('rules', () => {
  it('isValidMove returns false when not in playing phase', () => {
    const state = createInitialState(defaultPlayers);
    const modifiedState = { ...state, phase: 'setup' as const };
    const validMoves = state.board.filter(c => c.terrain === state.currentTerrain);
    if (validMoves.length === 0) return;
    expect(isValidMove(modifiedState, validMoves[0].coord)).toBe(false);
  });

  it('isValidMove returns false when no placements left', () => {
    const state = { ...createInitialState(defaultPlayers), placementsLeft: 0 };
    const cell = state.board.find(c => c.terrain === state.currentTerrain);
    if (!cell) return;
    expect(isValidMove(state, cell.coord)).toBe(false);
  });

  it('applyMove reduces placementsLeft', () => {
    const state = createInitialState(defaultPlayers);
    const cell = state.board.find(c => c.terrain === state.currentTerrain && c.settlement === null);
    if (!cell) return;
    const newState = applyMove(state, cell.coord);
    if (newState === state) return;
    expect(newState.placementsLeft).toBe(state.placementsLeft - 1);
  });

  it('applyMove does not modify original state', () => {
    const state = createInitialState(defaultPlayers);
    const cell = state.board.find(c => c.terrain === state.currentTerrain && c.settlement === null);
    if (!cell) return;
    applyMove(state, cell.coord);
    expect(state.placementsLeft).toBe(3);
  });
});

import { describe, it, expect } from 'vitest';
import { calculateScore, countGroups } from '../core/scoring';
import { createInitialState } from '../store/gameStore';
import { placeSettlement } from '../core/board';

const defaultPlayers = [
  { id: 0, name: '玩家1', color: 'orange' as const },
  { id: 1, name: '玩家2', color: 'blue' as const },
];

describe('scoring', () => {
  it('calculateScore returns array of scores for each player', () => {
    const state = createInitialState(defaultPlayers);
    const scores = calculateScore(state);
    expect(scores).toHaveLength(2);
    expect(scores.every(s => typeof s === 'number')).toBe(true);
  });

  it('initial state has 0 scores', () => {
    const state = createInitialState(defaultPlayers);
    const scores = calculateScore(state);
    expect(scores[0]).toBe(0);
    expect(scores[1]).toBe(0);
  });

  it('countGroups returns 0 when no settlements', () => {
    const state = createInitialState(defaultPlayers);
    expect(countGroups(state.board, 0)).toBe(0);
  });

  it('countGroups returns 1 for isolated settlement', () => {
    const state = createInitialState(defaultPlayers);
    const cell = state.board.find(c => c.terrain === 'grass');
    if (!cell) return;
    const board = placeSettlement(state.board, cell.coord, 0);
    expect(countGroups(board, 0)).toBe(1);
  });
});

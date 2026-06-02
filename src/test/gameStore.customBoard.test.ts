/**
 * Unit tests for initGame opt-in customBoard parameter.
 *
 * Verifies:
 *  - Without customBoard: board.width equals default size (large = 20)
 *  - With customBoard Board(12,12): get().board === customBoard and width === 12
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { Board } from '../core/board';

beforeEach(() => {
  // Reset store between tests
  useGameStore.setState({ board: new Board(20, 20) });
});

describe('initGame opt-in customBoard', () => {
  it('without customBoard uses default board size (large = 20)', () => {
    useGameStore.getState().initGame(2, { boardSize: 'large', objectiveCount: 3, enableUndo: true });
    expect(useGameStore.getState().board.width).toBe(20);
  });

  it('with customBoard Board(12,12) uses injected board instance', () => {
    const customBoard = new Board(12, 12);
    useGameStore.getState().initGame(2, { boardSize: 'large', objectiveCount: 3, enableUndo: true }, customBoard);
    const state = useGameStore.getState();
    expect(state.board).toBe(customBoard);
    expect(state.board.width).toBe(12);
  });

  it('with customBoard does not affect other state fields', () => {
    const customBoard = new Board(16, 16);
    useGameStore.getState().initGame(2, { boardSize: 'large', objectiveCount: 2, enableUndo: false }, customBoard);
    const state = useGameStore.getState();
    // Players should still be initialised correctly
    expect(state.players).toHaveLength(2);
    // Deck should be populated
    expect(state.deck.length).toBeGreaterThan(0);
    // Turn number resets
    expect(state.turnNumber).toBe(1);
    // customBoard correctly injected
    expect(state.board.width).toBe(16);
  });
});

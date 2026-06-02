/**
 * Tests for HexGrid UI-layer isRecentlyPlaced tracking (issue #141).
 *
 * Verifies that when a new settlement appears on the board, the corresponding
 * HexCell receives isRecentlyPlaced=true (triggering ring + drop animations),
 * and that it resets to false after ~350 ms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

import { HexGrid } from '../components/Board/HexGrid';
import { Board } from '../core/board';
import { Terrain } from '../core/terrain';
import { BotDifficulty, GamePhase } from '../types';
import type { Player } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeBoard(withSettlement?: { q: number; r: number; playerId: number }): Board {
  const board = new Board(3, 3);
  board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass });
  board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass });
  board.setCell({ coord: { q: 0, r: 1 }, terrain: Terrain.Grass });
  if (withSettlement) {
    board.placeSettlement(
      { q: withSettlement.q, r: withSettlement.r },
      withSettlement.playerId,
    );
  }
  return board;
}

function makePlayer(id: number): Player {
  return {
    id,
    name: `Player${id}`,
    color: '#ff0000',
    settlements: [],
    remainingSettlements: 40,
    tiles: [],
    isBot: false,
    difficulty: BotDifficulty.Normal,
  };
}

function makeHexGridProps(board: Board, players: Player[]) {
  return {
    board,
    validPlacements: [],
    selectedCell: null,
    players,
    onCellClick: vi.fn(),
    onCellSelect: vi.fn(),
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('HexGrid isRecentlyPlaced tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no cell is recently placed on initial render (no settlements)', () => {
    const board = makeBoard();
    const players = [makePlayer(1)];
    const { container } = render(
      <HexGrid {...makeHexGridProps(board, players)} />,
    );
    // animate-settlement-ring element must NOT exist
    expect(
      container.querySelector('.animate-settlement-ring'),
    ).toBeNull();
  });

  it('ring element appears when a new settlement is placed (prop re-render)', () => {
    const players = [makePlayer(1)];
    const boardBefore = makeBoard();

    const { rerender, container } = render(
      <HexGrid {...makeHexGridProps(boardBefore, players)} />,
    );

    // Simulate placing a settlement: give HexGrid a new board prop that has a settlement
    const boardAfter = makeBoard({ q: 0, r: 0, playerId: 1 });

    act(() => {
      rerender(<HexGrid {...makeHexGridProps(boardAfter, players)} />);
    });

    // ring element should now be in DOM
    expect(
      container.querySelector('.animate-settlement-ring'),
    ).not.toBeNull();
  });

  it('recentlyPlacedKey resets to null after 350 ms (setTimeout scheduled)', () => {
    // Verify that our useEffect schedules a clearTimeout timer.
    // We use a spy on setTimeout to confirm the 350 ms delay is registered
    // when a settlement is newly placed.
    const players = [makePlayer(1)];
    const boardBefore = makeBoard();

    // Spy on real setTimeout (vi.useFakeTimers in beforeEach replaces it)
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const { rerender } = render(
      <HexGrid {...makeHexGridProps(boardBefore, players)} />,
    );

    const boardAfter = makeBoard({ q: 0, r: 0, playerId: 1 });

    act(() => {
      rerender(<HexGrid {...makeHexGridProps(boardAfter, players)} />);
    });

    // A setTimeout of 350 ms should have been scheduled by our useEffect
    const calls = setTimeoutSpy.mock.calls;
    const hasResetTimer = calls.some(([, delay]) => delay === 350);
    expect(hasResetTimer).toBe(true);

    setTimeoutSpy.mockRestore();
  });

  it('animate-settlement-drop class appears on the settlement group for recently placed cell', () => {
    const players = [makePlayer(1)];
    const boardBefore = makeBoard();

    const { rerender, container } = render(
      <HexGrid {...makeHexGridProps(boardBefore, players)} />,
    );

    const boardAfter = makeBoard({ q: 0, r: 0, playerId: 1 });

    act(() => {
      rerender(<HexGrid {...makeHexGridProps(boardAfter, players)} />);
    });

    expect(
      container.querySelector('.animate-settlement-drop'),
    ).not.toBeNull();
  });

  it('only the newly placed cell gets the ring, not pre-existing settlements', () => {
    const players = [makePlayer(1)];
    // Board already has a settlement at (0,0)
    const boardWithOne = makeBoard({ q: 0, r: 0, playerId: 1 });

    const { rerender, container } = render(
      <HexGrid {...makeHexGridProps(boardWithOne, players)} />,
    );

    // Add a second settlement at (1,0)
    const boardWithTwo = makeBoard({ q: 0, r: 0, playerId: 1 });
    boardWithTwo.placeSettlement({ q: 1, r: 0 }, 1);

    act(() => {
      rerender(<HexGrid {...makeHexGridProps(boardWithTwo, players)} />);
    });

    // Exactly one ring should be present
    const rings = container.querySelectorAll('.animate-settlement-ring');
    expect(rings).toHaveLength(1);
  });
});

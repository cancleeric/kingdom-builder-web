import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Board, serializeBoard } from '../core/board';
import { Terrain } from '../core/terrain';
import type { HexCell } from '../types';
import type { WireGameState } from '../store/persistence';

// Mock the gameStore to avoid zustand / React environment issues in unit tests
let capturedState: unknown = null;
let mockGetState: () => Record<string, unknown> = () => ({});

vi.mock('../store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(() => mockGetState()),
    setState: vi.fn((next: unknown) => { capturedState = next; }),
  },
}));

import { hydrateSerializableState, extractSerializableState } from '../multiplayer/stateSerializer';

describe('extractSerializableState – board serialisation', () => {
  it('serialises board.cells Map to an array so JSON.stringify does not produce {}', () => {
    const board = new Board(10, 10);
    board.setCell({ coord: { q: 1, r: 2 }, terrain: Terrain.Grass, settlement: undefined });
    board.setCell({ coord: { q: 3, r: 4 }, terrain: Terrain.Forest, settlement: 1 });

    mockGetState = () => ({ board, players: [], currentPlayerIndex: 0 });

    const extracted = extractSerializableState();

    // After JSON round-trip (as WebSocket JSON.stringify would do), cells must be an array
    const jsonStr = JSON.stringify(extracted);
    const parsed = JSON.parse(jsonStr);

    expect(Array.isArray(parsed.board.cells)).toBe(true);
    expect(parsed.board.cells).toHaveLength(2);
    // Width/height preserved
    expect(parsed.board.width).toBe(10);
    expect(parsed.board.height).toBe(10);
  });
});

describe('hydrateSerializableState – board hydration', () => {
  beforeEach(() => {
    capturedState = null;
  });

  it('converts plain-JSON board (cells as tuple array) into Board instance', () => {
    // Build a real board, then simulate what JSON.parse produces from the wire
    const board = new Board(10, 10);
    const cell: HexCell = { coord: { q: 2, r: 3 }, terrain: Terrain.Grass, settlement: 1 };
    board.setCell(cell);

    const serialised = serializeBoard(board);
    // Round-trip through JSON (as the wire would deliver it)
    const wireBoard = JSON.parse(JSON.stringify(serialised));

    const fakeState = {
      board: wireBoard,
      players: [],
      currentPlayerIndex: 0,
      phase: 'playing',
    } as unknown as WireGameState;

    hydrateSerializableState(fakeState);

    // Verify the board stored in gameStore is a proper Board instance
    const stored = (capturedState as { board: Board }).board;
    expect(stored).toBeInstanceOf(Board);
    expect(stored.cells).toBeInstanceOf(Map);

    // Prototype methods must be callable
    expect(() => stored.getPlayerSettlements(1)).not.toThrow();
    expect(stored.getPlayerSettlements(1)).toHaveLength(1);
    expect(() => stored.cells.entries()).not.toThrow();
    expect(stored.getCell({ q: 2, r: 3 })?.settlement).toBe(1);
  });

  it('preserves all other state fields unchanged', () => {
    const board = new Board(5, 5);
    const serialised = serializeBoard(board);
    const wireBoard = JSON.parse(JSON.stringify(serialised));

    const fakeState = {
      board: wireBoard,
      currentPlayerIndex: 2,
      phase: 'game_over',
      players: [{ id: 1, name: 'Alice' }],
    } as unknown as WireGameState;

    hydrateSerializableState(fakeState);

    const stored = capturedState as Record<string, unknown>;
    expect(stored.currentPlayerIndex).toBe(2);
    expect(stored.phase).toBe('game_over');
    expect(stored.players).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('round-trips serialize → JSON wire → hydrateSerializableState → Board.getPlayerSettlements', () => {
    const board = new Board(20, 20);
    // Place settlements for two players
    board.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: 1 });
    board.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Forest, settlement: 1 });
    board.setCell({ coord: { q: 0, r: 1 }, terrain: Terrain.Desert, settlement: 2 });

    const wireBoard = JSON.parse(JSON.stringify(serializeBoard(board)));
    const fakeState = { board: wireBoard } as unknown as WireGameState;

    hydrateSerializableState(fakeState);

    const stored = (capturedState as { board: Board }).board;
    expect(stored.getPlayerSettlements(1)).toHaveLength(2);
    expect(stored.getPlayerSettlements(2)).toHaveLength(1);
    expect(stored.getPlayerSettlements(3)).toHaveLength(0);
  });

  it('wire round-trip preserves gameOptions and placementsThisTurn', () => {
    const board = new Board(5, 5);
    const wireBoard = JSON.parse(JSON.stringify(serializeBoard(board)));

    const fakeState: WireGameState = {
      board: wireBoard,
      gameOptions: { boardSize: 'medium', objectiveCount: 2, enableUndo: false },
      placementsThisTurn: [{ q: 1, r: 0 }, { q: 2, r: -1 }],
      players: [],
      currentPlayerIndex: 0,
      phase: 'PlaceSettlements' as import('../types').GamePhase,
      currentTerrainCard: null,
      remainingPlacements: 1,
      deck: [],
      acquiredLocations: [],
      objectiveCards: [],
      finalScores: [],
      selectedCell: null,
      validPlacements: [],
      activeTile: null,
      tileMoveSources: [],
      tileMoveFrom: null,
      tileMoveDestinations: [],
      history: [],
      canUndo: false,
      undoStack: [],
      turnNumber: 3,
    };

    // Simulate JSON wire round-trip
    const onWire = JSON.parse(JSON.stringify(fakeState)) as WireGameState;
    hydrateSerializableState(onWire);

    const stored = capturedState as Record<string, unknown>;
    expect(stored.gameOptions).toEqual({
      boardSize: 'medium',
      objectiveCount: 2,
      enableUndo: false,
    });
    expect(stored.placementsThisTurn).toEqual([{ q: 1, r: 0 }, { q: 2, r: -1 }]);
    expect(stored.turnNumber).toBe(3);
  });
});

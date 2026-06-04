import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, loadGame, clearSave, SAVE_VERSION } from './persistence';
import { GamePhase } from '../types';
import { createDefaultBoard, serializeBoard } from '../core/board';

const STORAGE_KEY = 'kingdom-builder-save';

function makeMinimalState() {
  return {
    board: createDefaultBoard(),
    players: [],
    currentPlayerIndex: 0,
    phase: GamePhase.Setup,
    currentTerrainCard: null,
    remainingPlacements: 0,
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
    undoStack: [] as import('../types/history').UndoSnapshot[],
    turnNumber: 0,
  };
}

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('save/load round-trip returns matching state', () => {
    const state = makeMinimalState();
    state.currentPlayerIndex = 1;
    state.turnNumber = 5;

    saveGame(state);
    const loaded = loadGame();

    expect(loaded).not.toBeNull();
    expect(loaded!.currentPlayerIndex).toBe(1);
    expect(loaded!.turnNumber).toBe(5);
    expect(loaded!.phase).toBe(GamePhase.Setup);
  });

  it('returns null on empty localStorage', () => {
    expect(loadGame()).toBeNull();
  });

  it('returns null and clears save on version mismatch', () => {
    const state = makeMinimalState();
    saveGame(state);

    // Manually corrupt the version
    const raw = localStorage.getItem(STORAGE_KEY)!;
    const parsed = JSON.parse(raw) as { saveVersion: number; state: unknown };
    parsed.saveVersion = SAVE_VERSION + 99;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    const loaded = loadGame();
    expect(loaded).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns null and clears save on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json}');
    expect(loadGame()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clearSave removes the item', () => {
    const state = makeMinimalState();
    saveGame(state);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearSave();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // ── Backwards-compat: old saves with undoSnapshot / undoUsedThisTurn ──────

  it('loads old save (undoSnapshot field, no undoStack) without clearSave', () => {
    // Simulate a pre-Phase-B save: has undoSnapshot/undoUsedThisTurn, no undoStack.
    // Board must be serialized with serializeBoard (same as saveGame does).
    const base = makeMinimalState();
    const oldStylePayload = {
      saveVersion: SAVE_VERSION,
      state: {
        ...base,
        board: serializeBoard(base.board),
        undoStack: undefined,
        undoSnapshot: {
          type: 'PLACE_SETTLEMENT',
          coord: { q: 1, r: 2 },
          previousRemainingPlacements: 2,
          previousPhase: GamePhase.Setup,
          acquiredLocationKeys: [],
          acquiredTileLocs: [],
        },
        undoUsedThisTurn: false,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldStylePayload));

    const loaded = loadGame();

    // Must load successfully (not clearSave + return null)
    expect(loaded).not.toBeNull();
    // undoStack should be populated from the old undoSnapshot
    expect(loaded!.undoStack).toHaveLength(1);
    expect(loaded!.undoStack[0].type).toBe('PLACE_SETTLEMENT');
    // LocalStorage key must still exist (save was NOT wiped)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('loads old save with null undoSnapshot as empty undoStack', () => {
    const base = makeMinimalState();
    const oldStylePayload = {
      saveVersion: SAVE_VERSION,
      state: {
        ...base,
        board: serializeBoard(base.board),
        undoStack: undefined,
        undoSnapshot: null,
        undoUsedThisTurn: true,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldStylePayload));

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.undoStack).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('new-format save (undoStack present) loads without migration', () => {
    const state = makeMinimalState();
    saveGame(state);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.undoStack).toHaveLength(0);
  });
});

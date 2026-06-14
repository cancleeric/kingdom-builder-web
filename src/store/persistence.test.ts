import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, loadGame, clearSave, SAVE_VERSION } from './persistence';
import { GamePhase } from '../types';
import type { GameOptions } from '../types';
import { createDefaultBoard, serializeBoard } from '../core/board';

const STORAGE_KEY = 'kingdom-builder-save';

const DEFAULT_GAME_OPTIONS: GameOptions = {
  boardSize: 'large',
  objectiveCount: 3,
  enableUndo: true,
};

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
    placementsThisTurn: [] as import('../core/hex').AxialCoord[],
    activeTile: null,
    tileMoveSources: [],
    tileMoveFrom: null,
    tileMoveDestinations: [],
    history: [],
    canUndo: false,
    undoStack: [] as import('../types/history').UndoSnapshot[],
    turnNumber: 0,
    gameOptions: DEFAULT_GAME_OPTIONS,
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

  it('rejects R39/earlier save (saveVersion=1) after SAVE_VERSION bump to 2 — clears stale objectiveCards', () => {
    // Simulate a pre-R40 save that contains legacy objectiveCards like 'Rangers'.
    // saveVersion is hard-coded as 1 (the old version before the bump).
    // SAVE_VERSION is now 2, so loadGame() must reject this and clear the save.
    const base = makeMinimalState();
    const legacyPayload = {
      saveVersion: 1,
      state: {
        ...base,
        board: serializeBoard(base.board),
        objectiveCards: ['Rangers', 'Shepherds', 'Miners'],
        undoStack: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyPayload));

    const loaded = loadGame();
    // Must be rejected: saveVersion 1 !== SAVE_VERSION 2 → clearSave + return null
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

  // ── Backwards-compat: old saves missing gameOptions / placementsThisTurn ──

  it('loads old save missing gameOptions — falls back to large/3/undo defaults', () => {
    const base = makeMinimalState();
    const { gameOptions: _omit, ...baseWithoutOptions } = base;
    const oldPayload = {
      saveVersion: SAVE_VERSION,
      state: {
        ...baseWithoutOptions,
        board: serializeBoard(base.board),
        undoStack: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldPayload));

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.gameOptions).toEqual({
      boardSize: 'large',
      objectiveCount: 3,
      enableUndo: true,
    });
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('loads old save missing placementsThisTurn — falls back to []', () => {
    const base = makeMinimalState();
    const { placementsThisTurn: _omit, ...baseWithoutPlacements } = base;
    const oldPayload = {
      saveVersion: SAVE_VERSION,
      state: {
        ...baseWithoutPlacements,
        board: serializeBoard(base.board),
        undoStack: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(oldPayload));

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.placementsThisTurn).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('new-format save round-trips gameOptions and placementsThisTurn', () => {
    const state = makeMinimalState();
    state.gameOptions = { boardSize: 'small', objectiveCount: 1, enableUndo: false };
    state.placementsThisTurn = [{ q: 2, r: -1 }, { q: 3, r: 0 }];
    saveGame(state);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.gameOptions).toEqual({
      boardSize: 'small',
      objectiveCount: 1,
      enableUndo: false,
    });
    expect(loaded!.placementsThisTurn).toEqual([{ q: 2, r: -1 }, { q: 3, r: 0 }]);
  });

  it('saveGame board field is serialised (not a Board instance) in localStorage', () => {
    const state = makeMinimalState();
    saveGame(state);

    const raw = localStorage.getItem(STORAGE_KEY)!;
    const parsed = JSON.parse(raw) as { saveVersion: number; state: { board: unknown } };
    // The stored board.cells must be an array, not a Map (JSON.stringify Map → {})
    const storedBoard = parsed.state.board as { cells: unknown };
    expect(Array.isArray(storedBoard.cells)).toBe(true);
  });
});

import { Board, serializeBoard, deserializeBoard } from '../core/board';
import { TerrainCard } from '../core/terrain';
import { Player, GamePhase, PlayerScore, GameOptions } from '../types';
import { AxialCoord } from '../core/hex';
import { Location } from '../core/terrain';
import { ObjectiveCard } from '../core/scoring';
import { GameAction, UndoSnapshot } from '../types/history';

// ────────────────────────────────────────────────────
// Save format
// ────────────────────────────────────────────────────

// Bumped to 2 (2026-06-14): invalidates R39/earlier saves that may contain
// removed ObjectiveCard values ('Rangers', 'Shepherds'). On version mismatch
// loadGame() clears the save and returns null, starting a fresh game with the
// current card set.
export const SAVE_VERSION = 2;
const STORAGE_KEY = 'kingdom-builder-save';

export interface SerializableGameState {
  board: Board;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  currentTerrainCard: TerrainCard | null;
  remainingPlacements: number;
  deck: TerrainCard[];
  acquiredLocations: string[];
  objectiveCards: ObjectiveCard[];
  finalScores: PlayerScore[];
  selectedCell: AxialCoord | null;
  validPlacements: AxialCoord[];
  /** Settlements placed so far in the current turn (for adjacency rule). */
  placementsThisTurn: AxialCoord[];
  activeTile: Location | null;
  tileMoveSources: AxialCoord[];
  tileMoveFrom: AxialCoord | null;
  tileMoveDestinations: AxialCoord[];
  history: GameAction[];
  canUndo: boolean;
  /**
   * Multi-step undo stack (Phase B). Replaces the old undoSnapshot/undoUsedThisTurn
   * fields. SAVE_VERSION is intentionally kept at 1; loadGame() handles old saves
   * via the backwards-compat fallback below.
   */
  undoStack: UndoSnapshot[];
  turnNumber: number;
  /** Options chosen at setup time (boardSize, objectiveCount, enableUndo, mapSeed). */
  gameOptions: GameOptions;
}

/**
 * Wire / storage format for board: cells serialised to [key, HexCell][] tuples
 * instead of a Map so it survives JSON.stringify → JSON.parse round-trips.
 * Used by stateSerializer (multiplayer wire) and saveGame (localStorage).
 */
export type WireGameState = Omit<SerializableGameState, 'board'> & {
  board: ReturnType<typeof serializeBoard>;
};

export interface SaveSchema {
  saveVersion: number;
  state: WireGameState;
}

// ────────────────────────────────────────────────────
// API
// ────────────────────────────────────────────────────

export function saveGame(state: SerializableGameState): void {
  const payload: SaveSchema = {
    saveVersion: SAVE_VERSION,
    state: {
      ...state,
      // Serialize Board instance to a plain [key, HexCell][] structure so the
      // payload survives JSON.stringify → JSON.parse without losing the Map.
      board: serializeBoard(state.board),
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadGame(): SerializableGameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    // Parse as a loose type so we can read both old and new fields
    const parsed = JSON.parse(raw) as {
      saveVersion: number;
      state: Record<string, unknown>;
    };
    if (parsed.saveVersion !== SAVE_VERSION) {
      clearSave();
      return null;
    }

    // Deserialize Board from plain object
    const boardData = parsed.state.board as unknown as ReturnType<typeof serializeBoard>;
    const board = deserializeBoard(boardData);

    // Backwards-compat: old saves (pre-Phase-B) have undoSnapshot / undoUsedThisTurn
    // instead of undoStack. Migrate gracefully without clearing the save.
    const rawState = parsed.state as Record<string, unknown> & {
      undoStack?: UndoSnapshot[];
      undoSnapshot?: UndoSnapshot | null;
      undoUsedThisTurn?: boolean;
      gameOptions?: GameOptions;
      placementsThisTurn?: AxialCoord[];
    };
    const undoStack: UndoSnapshot[] =
      rawState.undoStack ??
      (rawState.undoSnapshot ? [rawState.undoSnapshot] : []);

    // Backwards-compat: old saves lack gameOptions / placementsThisTurn.
    // Provide sensible defaults so pre-PR saves continue to load correctly.
    const gameOptions: GameOptions = rawState.gameOptions ?? {
      boardSize: 'large',
      objectiveCount: 3,
      enableUndo: true,
    };
    const placementsThisTurn: AxialCoord[] = rawState.placementsThisTurn ?? [];

    return {
      ...(rawState as unknown as SerializableGameState),
      board,
      undoStack,
      gameOptions,
      placementsThisTurn,
    };
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

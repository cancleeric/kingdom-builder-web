import { Board, serializeBoard, deserializeBoard } from '../core/board';
import { TerrainCard } from '../core/terrain';
import { Player, GamePhase, PlayerScore } from '../types';
import { AxialCoord } from '../core/hex';
import { Location } from '../core/terrain';
import { ObjectiveCard } from '../core/scoring';
import { GameAction, UndoSnapshot } from '../types/history';

// ────────────────────────────────────────────────────
// Save format
// ────────────────────────────────────────────────────

export const SAVE_VERSION = 1;
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
}

export interface SaveSchema {
  saveVersion: number;
  state: SerializableGameState;
}

// ────────────────────────────────────────────────────
// API
// ────────────────────────────────────────────────────

export function saveGame(state: SerializableGameState): void {
  const payload: SaveSchema = {
    saveVersion: SAVE_VERSION,
    state: {
      ...state,
      // Serialize Board instance to plain object
      board: serializeBoard(state.board) as unknown as Board,
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
    };
    const undoStack: UndoSnapshot[] =
      rawState.undoStack ??
      (rawState.undoSnapshot ? [rawState.undoSnapshot] : []);

    return {
      ...(rawState as unknown as SerializableGameState),
      board,
      undoStack,
    };
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

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
  undoSnapshot: UndoSnapshot | null;
  undoUsedThisTurn: boolean;
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
    const parsed: SaveSchema = JSON.parse(raw) as SaveSchema;
    if (parsed.saveVersion !== SAVE_VERSION) {
      clearSave();
      return null;
    }

    // Deserialize Board from plain object
    const boardData = parsed.state.board as unknown as ReturnType<typeof serializeBoard>;
    const board = deserializeBoard(boardData);

    return {
      ...parsed.state,
      board,
    };
  } catch {
    clearSave();
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

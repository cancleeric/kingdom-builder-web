/**
 * KingdomG — pure game-domain state for the Kingdom Builder engine adapter.
 *
 * Derived from SerializableGameState (src/store/persistence.ts) with UI-only
 * fields removed:
 *   - selectedCell      : UI cursor selection, not a game rule concern
 *   - validPlacements   : derived/cached from getValidPlacements(), not ground truth
 *   - history           : GameAction[] action log, used only for UI replay / recording
 *
 * All types are imported from the existing src/ type definitions; no new types
 * are introduced here.
 */

import { Board } from '../core/board';
import { TerrainCard, Location } from '../core/terrain';
import { ObjectiveCard } from '../core/scoring';
import { AxialCoord } from '../core/hex';
import { Player, GamePhase, PlayerScore, GameOptions } from '../types';
import { UndoSnapshot } from '../types/history';

export interface KingdomG {
  /** The hex grid (Board class with Map<string, HexCell> cells). */
  board: Board;

  /** All players in turn order. */
  players: Player[];

  /** Index into players[] for whose turn it currently is (0-based). */
  currentPlayerIndex: number;

  /**
   * Current game phase.
   * Valid engine states: DrawCard | PlaceSettlements | EndTurn | GameOver.
   * Setup is a pre-game phase handled outside the engine.
   */
  phase: GamePhase;

  /** The terrain card drawn for this turn; null during DrawCard phase. */
  currentTerrainCard: TerrainCard | null;

  /**
   * How many settlement placements remain in the current PlaceSettlements
   * phase (starts at 3 per turn, decrements on each valid placement).
   */
  remainingPlacements: number;

  /** The remaining terrain draw deck. */
  deck: TerrainCard[];

  /**
   * Keys of Location tiles that have been acquired (as "<q>,<r>" strings).
   * Used to guard against re-awarding the same location tile.
   */
  acquiredLocations: string[];

  /** The three objective cards in play for this game. */
  objectiveCards: ObjectiveCard[];

  /** Final per-player score breakdown; populated when phase === GameOver. */
  finalScores: PlayerScore[];

  /**
   * Coordinates of settlements placed during the current turn.
   * Required for the adjacency rule: 2nd and 3rd placements must be
   * adjacent to a cell already placed this turn (when adjacent cells exist).
   */
  placementsThisTurn: AxialCoord[];

  /** The Location tile currently being activated (null if none). */
  activeTile: Location | null;

  /**
   * Valid source coordinates when executing a tile-move action
   * (e.g. Paddock, Barn).
   */
  tileMoveSources: AxialCoord[];

  /** The settlement coordinate chosen as the source of a tile move. */
  tileMoveFrom: AxialCoord | null;

  /** Valid destination coordinates for the current tile move. */
  tileMoveDestinations: AxialCoord[];

  /** Monotonically increasing turn counter (incremented on endTurn). */
  turnNumber: number;

  /** Board size, objective count, undo enablement, and optional map seed. */
  gameOptions: GameOptions;

  /**
   * Stack of reversible action snapshots for the multi-step undo feature.
   * Empty when undo is disabled or no actions have been taken this turn.
   */
  undoStack: UndoSnapshot[];

  /**
   * Whether an undo action is currently available (derived from undoStack,
   * retained in G so the engine can expose it without recomputing).
   */
  canUndo: boolean;
}

/**
 * Fields present in SerializableGameState that are intentionally excluded
 * from KingdomG (UI-only concerns, not engine domain state):
 *
 *   selectedCell    — AxialCoord | null  — UI hex cursor
 *   validPlacements — AxialCoord[]       — UI cached move hints (recomputed each render)
 *   history         — GameAction[]       — action log for replay UI only
 */
export type ClientOnlyState = {
  selectedCell: AxialCoord | null;
  validPlacements: AxialCoord[];
};

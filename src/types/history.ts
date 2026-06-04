import { AxialCoord } from '../core/hex';
import { Location } from '../core/terrain';

export type GameActionType = 'PLACE_SETTLEMENT' | 'TILE_PLACEMENT' | 'TILE_MOVE';

/**
 * A single recorded game action, stored in the history log.
 */
export interface GameAction {
  type: GameActionType;
  playerId: number;
  turnNumber: number;
  /** Destination hex for PLACE_SETTLEMENT and TILE_PLACEMENT */
  hex?: AxialCoord;
  /** Source hex for TILE_MOVE */
  fromHex?: AxialCoord;
  /** Destination hex for TILE_MOVE */
  toHex?: AxialCoord;
  /** Location tile involved (TILE_PLACEMENT / TILE_MOVE) */
  tile?: Location;
  /** Location tile acquired as a side-effect of the action */
  acquiredTile?: Location;
  timestamp: number;
}

/**
 * Internal snapshot used to reverse a single undoable action.
 * Stored in a stack (undoStack) in GameState; the top of the stack is the most
 * recent action. Popping and reversing allows the player to step back one
 * action at a time until the stack is empty (start of the current turn).
 */
export interface UndoSnapshot {
  type: GameActionType;
  /** For PLACE_SETTLEMENT / TILE_PLACEMENT: the placed coord */
  coord?: AxialCoord;
  /** For TILE_MOVE: settlement was moved FROM here */
  fromCoord?: AxialCoord;
  /** For TILE_MOVE: settlement was moved TO here */
  toCoord?: AxialCoord;
  /** Previous remainingPlacements value */
  previousRemainingPlacements: number;
  /** Previous game phase */
  previousPhase: import('../types').GamePhase;
  /** Keys added to acquiredLocations by this action */
  acquiredLocationKeys: string[];
  /** Location tile types added to player.tiles by this action */
  acquiredTileLocs: Location[];
  /** Location tile that was marked usedThisTurn by this action */
  tileUsed?: Location;
  /**
   * Index into player.tiles[] for the specific tile instance that was marked
   * usedThisTurn. Used by undoLastAction to unmark the correct tile when the
   * player holds duplicate location tiles (e.g. Farm×2).
   *
   * Backwards-compat: old snapshots (e.g. from localStorage) will not have
   * this field → undoLastAction falls back to `.find(t.location === tileUsed)`.
   */
  tileUsedIndex?: number;
  /** Settlement index in player.settlements that was removed (TILE_MOVE only) */
  movedSettlementIdx?: number;
  /**
   * Snapshot of placementsThisTurn BEFORE this action was applied.
   * Restored when undoing to support correct adjacency-rule recalculation.
   * Backwards-compat: old snapshots lack this field → fallback to
   * state.placementsThisTurn.slice(0, -1) when undefined.
   */
  previousPlacementsThisTurn?: AxialCoord[];
}

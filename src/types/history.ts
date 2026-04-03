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
 * Internal snapshot used to reverse the last action (undo support).
 * One snapshot is stored at most, covering the most recent undoable action
 * in the current turn. A new snapshot is only created when `undoUsedThisTurn`
 * is false; once the player has consumed their undo for the turn the snapshot
 * is set to null and `canUndo` stays false for the remainder of that turn.
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
  /** Settlement index in player.settlements that was removed (TILE_MOVE only) */
  movedSettlementIdx?: number;
}

import type { WireGameState } from '../store/persistence';
import type { AxialCoord } from '../core/hex';
import type {
  ClientToServerMessage as KitClientToServerMessage,
  ServerToClientMessage as KitServerToClientMessage,
} from '@hd/game-kit';

// Re-export generic room/connection types from @hd/game-kit
export type { RoomPlayer, RoomInfo, ConnectionStatus } from '@hd/game-kit';

// Kingdom-specific action union (game-agnostic kit has no knowledge of this)
export type MultiplayerAction =
  | { type: 'draw_terrain_card' }
  | { type: 'place_settlement'; coord: AxialCoord }
  | { type: 'end_turn' }
  | { type: 'activate_tile'; location: string }
  | { type: 'cancel_tile' }
  | { type: 'apply_tile_placement'; coord: AxialCoord }
  | { type: 'select_tile_move_source'; coord: AxialCoord }
  | { type: 'apply_tile_move'; coord: AxialCoord }
  | { type: 'undo_last_action' }
  | { type: 'select_cell'; coord: AxialCoord | null };

// Concrete message types for Kingdom Builder, specialising the kit generics.
// WireGameState (not SerializableGameState) is used here because the wire
// payload has board serialised to [key, HexCell][] rather than a Board instance.
export type ClientToServerMessage = KitClientToServerMessage<MultiplayerAction, WireGameState>;
export type ServerToClientMessage = KitServerToClientMessage<MultiplayerAction, WireGameState>;

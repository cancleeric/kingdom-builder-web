import type { SerializableGameState } from '../store/persistence';
import type { AxialCoord } from '../core/hex';

export interface RoomPlayer {
  id: number;
  name: string;
  ready: boolean;
  connected: boolean;
}

export interface RoomInfo {
  id: string;
  hostPlayerId: number;
  gameStarted: boolean;
  players: RoomPlayer[];
}

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

export type ClientToServerMessage =
  | { type: 'create_room'; playerName: string }
  | { type: 'join_room'; roomId: string; playerName: string; playerToken?: string }
  | { type: 'reconnect'; roomId: string; playerToken: string }
  | { type: 'set_ready'; ready: boolean }
  | { type: 'leave_room' }
  | { type: 'start_game'; gameState: SerializableGameState }
  | { type: 'state_update'; gameState: SerializableGameState }
  | { type: 'player_action'; action: MultiplayerAction };

export type ServerToClientMessage =
  | { type: 'connected' }
  | {
      type: 'room_created';
      room: RoomInfo;
      yourPlayerId: number;
      yourPlayerToken: string;
    }
  | {
      type: 'room_joined';
      room: RoomInfo;
      yourPlayerId: number;
      yourPlayerToken: string;
      gameState: SerializableGameState | null;
    }
  | { type: 'room_update'; room: RoomInfo }
  | { type: 'game_started'; room: RoomInfo; gameState: SerializableGameState | null }
  | { type: 'state_update'; gameState: SerializableGameState | null }
  | { type: 'action_request'; playerId: number; action: MultiplayerAction }
  | { type: 'error'; message: string };

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

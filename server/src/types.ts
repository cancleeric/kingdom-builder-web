/**
 * Shared WebSocket protocol types for Kingdom Builder multiplayer.
 * This file is the server-side copy; the client has a matching file at
 * src/multiplayer/types.ts.
 */

// ─── Identifiers ────────────────────────────────────────────────────────────

export type RoomId = string;
export type PlayerId = string;

// ─── Domain objects ──────────────────────────────────────────────────────────

export interface RoomPlayer {
  id: PlayerId;
  name: string;
  color: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface RoomInfo {
  id: RoomId;
  hostId: PlayerId;
  players: RoomPlayer[];
  status: 'waiting' | 'in_game' | 'finished';
  maxPlayers: number;
  options: GameRoomOptions;
}

export interface GameRoomOptions {
  boardSize: 'small' | 'medium' | 'large';
  objectiveCount: 1 | 2 | 3;
  enableUndo: boolean;
  turnTimeoutSeconds: number;
}

// ─── Serialisable game state ─────────────────────────────────────────────────

export interface AxialCoord {
  q: number;
  r: number;
}

export interface SerializedCell {
  q: number;
  r: number;
  terrain: string;
  location?: string;
  settlement?: number;
}

export interface SerializedPlayer {
  id: number;
  name: string;
  color: string;
  settlements: AxialCoord[];
  remainingSettlements: number;
  tiles: { location: string; usedThisTurn: boolean }[];
  isBot: boolean;
}

export interface SerializedGameState {
  board: SerializedCell[];
  players: SerializedPlayer[];
  currentPlayerIndex: number;
  phase: string;
  currentTerrainCard: { terrain: string } | null;
  remainingPlacements: number;
  objectiveCards: string[];
  finalScores: { playerId: number; castleScore: number; totalScore: number }[];
  turnNumber: number;
  acquiredLocations: string[];
}

// ─── Game actions (client → server) ─────────────────────────────────────────

export type GameActionPayload =
  | { type: 'DRAW_CARD' }
  | { type: 'PLACE_SETTLEMENT'; coord: AxialCoord }
  | { type: 'END_TURN' }
  | { type: 'ACTIVATE_TILE'; location: string }
  | { type: 'CANCEL_TILE' }
  | { type: 'APPLY_TILE_PLACEMENT'; coord: AxialCoord }
  | { type: 'SELECT_TILE_MOVE_SOURCE'; from: AxialCoord }
  | { type: 'APPLY_TILE_MOVE'; to: AxialCoord }
  | { type: 'UNDO' };

// ─── Messages: Client → Server ───────────────────────────────────────────────

export type ClientMessage =
  | { type: 'CREATE_ROOM'; playerName: string; options: Partial<GameRoomOptions> }
  | { type: 'JOIN_ROOM'; roomId: RoomId; playerName: string }
  | { type: 'REJOIN_ROOM'; roomId: RoomId; playerId: PlayerId }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_GAME' }
  | { type: 'GAME_ACTION'; action: GameActionPayload }
  | { type: 'SEND_CHAT'; text: string }
  | { type: 'PING' };

// ─── Messages: Server → Client ───────────────────────────────────────────────

export type ServerMessage =
  | { type: 'PONG' }
  | { type: 'ROOM_CREATED'; roomId: RoomId; playerId: PlayerId; room: RoomInfo }
  | { type: 'ROOM_JOINED'; playerId: PlayerId; room: RoomInfo }
  | { type: 'ROOM_UPDATED'; room: RoomInfo }
  | { type: 'GAME_STARTED'; gameState: SerializedGameState; room: RoomInfo }
  | { type: 'GAME_STATE_UPDATE'; gameState: SerializedGameState }
  | { type: 'CHAT_RECEIVED'; playerId: PlayerId; playerName: string; text: string; timestamp: number }
  | { type: 'TURN_TIMEOUT'; skippedPlayerId: PlayerId }
  | { type: 'PLAYER_DISCONNECTED'; playerId: PlayerId; playerName: string }
  | { type: 'PLAYER_RECONNECTED'; playerId: PlayerId; playerName: string }
  | { type: 'GAME_OVER'; finalScores: { playerId: number; totalScore: number }[] }
  | { type: 'ERROR'; code: string; message: string };

import { create } from 'zustand';
import { Location } from '../core/terrain';
import { wsClient } from '../multiplayer/wsClient';
import type {
  ConnectionStatus,
  MultiplayerAction,
  RoomInfo,
  ServerToClientMessage,
} from '../multiplayer/types';
import type { SerializableGameState } from './persistence';
import { hydrateSerializableState } from '../multiplayer/stateSerializer';
import { useGameStore } from './gameStore';

const TOKEN_KEY = 'kb-mp-player-token';
const ROOM_KEY = 'kb-mp-room-id';

function dispatchRequestedAction(action: MultiplayerAction): void {
  const game = useGameStore.getState();
  switch (action.type) {
    case 'draw_terrain_card':
      game.drawTerrainCard();
      break;
    case 'place_settlement':
      game.placeSettlement(action.coord);
      break;
    case 'end_turn':
      game.endTurn();
      break;
    case 'activate_tile':
      game.activateTile(action.location as Location);
      break;
    case 'cancel_tile':
      game.cancelTile();
      break;
    case 'apply_tile_placement':
      game.applyTilePlacement(action.coord);
      break;
    case 'select_tile_move_source':
      game.selectTileMoveSource(action.coord);
      break;
    case 'apply_tile_move':
      game.applyTileMove(action.coord);
      break;
    case 'undo_last_action':
      game.undoLastAction();
      break;
    case 'select_cell':
      game.selectCell(action.coord);
      break;
  }
}

interface MultiplayerState {
  connectionStatus: ConnectionStatus;
  serverUrl: string;
  room: RoomInfo | null;
  localPlayerId: number | null;
  localPlayerToken: string | null;
  error: string | null;
  mode: 'idle' | 'lobby' | 'in_game';

  connect: (serverUrl?: string) => void;
  disconnect: () => void;
  clearError: () => void;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  setReady: (ready: boolean) => void;
  leaveRoom: () => void;
  startGame: (initialState: SerializableGameState) => void;
  sendPlayerAction: (action: MultiplayerAction) => void;
  sendStateUpdate: (gameState: SerializableGameState) => void;
}

let listenersBound = false;

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  if (!listenersBound) {
    listenersBound = true;
    wsClient.subscribe((message) => {
      handleServerMessage(message, set, get);
    });
    wsClient.subscribeStatus((status) => {
      set({ connectionStatus: status });
    });
  }

  const storedRoom = localStorage.getItem(ROOM_KEY);
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (storedRoom && storedToken) {
    wsClient.setReconnectIdentity(storedRoom, storedToken);
  }

  return {
    connectionStatus: 'disconnected',
    serverUrl: import.meta.env.VITE_WS_SERVER_URL ?? 'ws://localhost:8787',
    room: null,
    localPlayerId: null,
    localPlayerToken: storedToken,
    error: null,
    mode: 'idle',

    connect: (serverUrl) => {
      const url = serverUrl ?? get().serverUrl;
      set({ serverUrl: url, error: null });
      wsClient.connect(url);
    },

    disconnect: () => {
      wsClient.disconnect();
      set({ connectionStatus: 'disconnected' });
    },

    clearError: () => set({ error: null }),

    createRoom: (playerName) => {
      wsClient.send({ type: 'create_room', playerName });
    },

    joinRoom: (roomId, playerName) => {
      const token = get().localPlayerToken;
      wsClient.send({
        type: 'join_room',
        roomId: roomId.toUpperCase(),
        playerName,
        playerToken: token ?? undefined,
      });
    },

    setReady: (ready) => {
      wsClient.send({ type: 'set_ready', ready });
    },

    leaveRoom: () => {
      wsClient.send({ type: 'leave_room' });
      localStorage.removeItem(ROOM_KEY);
      localStorage.removeItem(TOKEN_KEY);
      wsClient.setReconnectIdentity(null, null);
      set({
        room: null,
        localPlayerId: null,
        localPlayerToken: null,
        mode: 'idle',
      });
    },

    startGame: (initialState) => {
      wsClient.send({ type: 'start_game', gameState: initialState });
    },

    sendPlayerAction: (action) => {
      wsClient.send({ type: 'player_action', action });
    },

    sendStateUpdate: (gameState) => {
      wsClient.send({ type: 'state_update', gameState });
    },
  };
});

function handleServerMessage(
  message: ServerToClientMessage,
  set: (next: Partial<MultiplayerState>) => void,
  get: () => MultiplayerState
): void {
  if (message.type === 'error') {
    set({ error: message.message });
    return;
  }

  if (message.type === 'room_created' || message.type === 'room_joined') {
    localStorage.setItem(ROOM_KEY, message.room.id);
    localStorage.setItem(TOKEN_KEY, message.yourPlayerToken);
    wsClient.setReconnectIdentity(message.room.id, message.yourPlayerToken);

    set({
      room: message.room,
      localPlayerId: message.yourPlayerId,
      localPlayerToken: message.yourPlayerToken,
      mode: message.room.gameStarted ? 'in_game' : 'lobby',
      error: null,
    });

    if (message.type === 'room_joined' && message.gameState) {
      hydrateSerializableState(message.gameState);
    }
    return;
  }

  if (message.type === 'room_update') {
    const mode =
      message.room.gameStarted
        ? 'in_game'
        : get().mode === 'idle'
          ? 'lobby'
          : get().mode;
    set({ room: message.room, mode });
    return;
  }

  if (message.type === 'game_started') {
    set({ room: message.room, mode: 'in_game', error: null });
    if (message.gameState) {
      hydrateSerializableState(message.gameState);
    }
    return;
  }

  if (message.type === 'state_update') {
    if (message.gameState) {
      hydrateSerializableState(message.gameState);
    }
    return;
  }

  if (message.type === 'action_request') {
    const state = get();
    if (state.room && state.localPlayerId === state.room.hostPlayerId) {
      dispatchRequestedAction(message.action);
    }
  }
}

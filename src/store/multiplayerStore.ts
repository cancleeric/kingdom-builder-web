import { create } from 'zustand';
import { wsClient } from '../multiplayer/wsClient';
import type {
  RoomInfo,
  RoomId,
  PlayerId,
  SerializedGameState,
  ChatMessage,
  GameRoomOptions,
  GameActionPayload,
} from '../multiplayer/types';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY_ROOM = 'mp_room';
const STORAGE_KEY_PLAYER = 'mp_player';

// ─── State shape ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MultiplayerState {
  // Connection
  connectionStatus: ConnectionStatus;
  wsUrl: string;

  // Identity
  playerId: PlayerId | null;
  playerName: string;

  // Room
  room: RoomInfo | null;
  isHost: boolean;

  // In-game state (mirrors server authoritative state)
  gameState: SerializedGameState | null;

  // UI state
  screenView: 'lobby' | 'waiting_room' | 'in_game';
  error: string | null;

  // Chat
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  chatOpen: boolean;

  // Turn timeout countdown
  turnSecondsLeft: number | null;
}

interface MultiplayerActions {
  // Setup
  setPlayerName: (name: string) => void;
  setWsUrl: (url: string) => void;

  // Connection lifecycle
  connectAndCreate: (playerName: string, options?: Partial<GameRoomOptions>) => void;
  connectAndJoin: (roomId: RoomId, playerName: string) => void;
  leaveRoom: () => void;
  disconnect: () => void;

  // Room actions
  startGame: () => void;
  sendAction: (action: GameActionPayload) => void;

  // Chat
  sendChat: (text: string) => void;
  openChat: () => void;
  closeChat: () => void;

  // Internal (used by WS handlers)
  _onConnected: () => void;
  _onDisconnected: () => void;
  _handleMessage: (msg: import('../multiplayer/types').ServerMessage) => void;
}

// ─── Local storage helpers ───────────────────────────────────────────────────

function saveSession(roomId: RoomId, playerId: PlayerId): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_ROOM, roomId);
    sessionStorage.setItem(STORAGE_KEY_PLAYER, playerId);
  } catch {
    // ignore
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_ROOM);
    sessionStorage.removeItem(STORAGE_KEY_PLAYER);
  } catch {
    // ignore
  }
}

function loadSession(): { roomId: RoomId; playerId: PlayerId } | null {
  try {
    const roomId = sessionStorage.getItem(STORAGE_KEY_ROOM);
    const playerId = sessionStorage.getItem(STORAGE_KEY_PLAYER);
    if (roomId && playerId) return { roomId, playerId };
  } catch {
    // ignore
  }
  return null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMultiplayerStore = create<MultiplayerState & MultiplayerActions>(
  (set, get) => {
    // ── WS event wiring (done once on store creation) ────────────────────────
    wsClient.onConnectionChange((connected) => {
      if (connected) {
        get()._onConnected();
      } else {
        get()._onDisconnected();
      }
    });

    wsClient.onMessage((msg) => {
      get()._handleMessage(msg);
    });

    // ── Initial state ────────────────────────────────────────────────────────
    return {
      connectionStatus: 'disconnected',
      wsUrl: 'ws://localhost:8080',
      playerId: null,
      playerName: '',
      room: null,
      isHost: false,
      gameState: null,
      screenView: 'lobby',
      error: null,
      chatMessages: [],
      unreadChatCount: 0,
      chatOpen: false,
      turnSecondsLeft: null,

      // ── Actions ─────────────────────────────────────────────────────────────

      setPlayerName: (name) => set({ playerName: name }),
      setWsUrl: (url) => set({ wsUrl: url }),

      connectAndCreate: (playerName, options = {}) => {
        set({ connectionStatus: 'connecting', error: null, playerName });
        wsClient.connect(get().wsUrl);
        // After connect the onopen will fire; store pending intent
        pendingAction = { type: 'create', playerName, options };
      },

      connectAndJoin: (roomId, playerName) => {
        set({ connectionStatus: 'connecting', error: null, playerName });
        wsClient.connect(get().wsUrl);
        pendingAction = { type: 'join', roomId, playerName };
      },

      leaveRoom: () => {
        wsClient.leaveRoom();
        clearSession();
        set({
          room: null,
          playerId: null,
          isHost: false,
          gameState: null,
          screenView: 'lobby',
          chatMessages: [],
          turnSecondsLeft: null,
        });
      },

      disconnect: () => {
        wsClient.disconnect();
        clearSession();
        set({
          connectionStatus: 'disconnected',
          room: null,
          playerId: null,
          isHost: false,
          gameState: null,
          screenView: 'lobby',
          chatMessages: [],
          turnSecondsLeft: null,
        });
      },

      startGame: () => {
        wsClient.startGame();
      },

      sendAction: (action) => {
        wsClient.sendAction(action);
      },

      sendChat: (text) => {
        wsClient.sendChat(text);
      },

      openChat: () => set({ chatOpen: true, unreadChatCount: 0 }),
      closeChat: () => set({ chatOpen: false }),

      // ── Internal handlers ────────────────────────────────────────────────────

      _onConnected: () => {
        set({ connectionStatus: 'connected' });

        // Execute pending intent
        const action = pendingAction;
        pendingAction = null;

        if (action?.type === 'create') {
          wsClient.createRoom(action.playerName, action.options ?? {});
        } else if (action?.type === 'join') {
          wsClient.joinRoom(action.roomId, action.playerName);
        } else {
          // Check for existing session to rejoin
          const session = loadSession();
          if (session) {
            wsClient.rejoinRoom(session.roomId, session.playerId);
          }
        }
      },

      _onDisconnected: () => {
        set({ connectionStatus: 'disconnected' });
      },

      _handleMessage: (msg) => {
        switch (msg.type) {
          case 'ROOM_CREATED': {
            saveSession(msg.roomId, msg.playerId);
            set({
              playerId: msg.playerId,
              room: msg.room,
              isHost: true,
              screenView: 'waiting_room',
              error: null,
            });
            break;
          }

          case 'ROOM_JOINED': {
            const { room, playerId } = msg;
            saveSession(room.id, playerId);
            set({
              playerId,
              room,
              isHost: room.hostId === playerId,
              screenView: room.status === 'in_game' ? 'in_game' : 'waiting_room',
              error: null,
            });
            break;
          }

          case 'ROOM_UPDATED': {
            set({ room: msg.room });
            break;
          }

          case 'GAME_STARTED': {
            set({
              room: msg.room,
              gameState: msg.gameState,
              screenView: 'in_game',
            });
            break;
          }

          case 'GAME_STATE_UPDATE': {
            set({ gameState: msg.gameState });
            // Reset turn timeout
            const opts = get().room?.options;
            if (opts && msg.gameState.phase === 'DrawCard') {
              startCountdown(opts.turnTimeoutSeconds);
            }
            break;
          }

          case 'CHAT_RECEIVED': {
            const chatMsg: ChatMessage = {
              playerId: msg.playerId,
              playerName: msg.playerName,
              text: msg.text,
              timestamp: msg.timestamp,
            };
            set(state => ({
              chatMessages: [...state.chatMessages.slice(-99), chatMsg],
              unreadChatCount: state.chatOpen ? 0 : state.unreadChatCount + 1,
            }));
            break;
          }

          case 'PLAYER_DISCONNECTED': {
            set(state => ({
              chatMessages: [
                ...state.chatMessages.slice(-99),
                {
                  playerId: msg.playerId,
                  playerName: 'System',
                  text: `${msg.playerName} disconnected`,
                  timestamp: Date.now(),
                },
              ],
            }));
            break;
          }

          case 'PLAYER_RECONNECTED': {
            set(state => ({
              chatMessages: [
                ...state.chatMessages.slice(-99),
                {
                  playerId: msg.playerId,
                  playerName: 'System',
                  text: `${msg.playerName} reconnected`,
                  timestamp: Date.now(),
                },
              ],
            }));
            break;
          }

          case 'TURN_TIMEOUT': {
            set(state => ({
              chatMessages: [
                ...state.chatMessages.slice(-99),
                {
                  playerId: '',
                  playerName: 'System',
                  text: 'Turn timed out – skipping',
                  timestamp: Date.now(),
                },
              ],
              turnSecondsLeft: null,
            }));
            break;
          }

          case 'GAME_OVER': {
            set({ turnSecondsLeft: null });
            break;
          }

          case 'ERROR': {
            set({ error: msg.message });
            break;
          }

          case 'PONG':
            break;
        }
      },
    };
  }
);

// ─── Pending action (set before WS connects) ─────────────────────────────────

type PendingAction =
  | { type: 'create'; playerName: string; options?: Partial<GameRoomOptions> }
  | { type: 'join'; roomId: RoomId; playerName: string }
  | null;

let pendingAction: PendingAction = null;

// ─── Turn countdown ──────────────────────────────────────────────────────────

let countdownInterval: ReturnType<typeof setInterval> | null = null;

function startCountdown(seconds: number): void {
  if (countdownInterval) clearInterval(countdownInterval);
  useMultiplayerStore.setState({ turnSecondsLeft: seconds });
  countdownInterval = setInterval(() => {
    const cur = useMultiplayerStore.getState().turnSecondsLeft ?? 0;
    if (cur <= 1) {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
      useMultiplayerStore.setState({ turnSecondsLeft: null });
    } else {
      useMultiplayerStore.setState({ turnSecondsLeft: cur - 1 });
    }
  }, 1000);
}

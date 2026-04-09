import type {
  ClientMessage,
  ServerMessage,
  GameRoomOptions,
  RoomId,
  PlayerId,
  GameActionPayload,
} from './types';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_WS_URL =
  typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_WS_URL
    ? (import.meta as { env?: Record<string, string> }).env!['VITE_WS_URL']
    : 'ws://localhost:8080';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL_MS = 25000;

// ─── Event system ────────────────────────────────────────────────────────────

type MessageHandler = (msg: ServerMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

// ─── Client class ────────────────────────────────────────────────────────────

class MultiplayerWSClient {
  private ws: WebSocket | null = null;
  private url = DEFAULT_WS_URL;

  private messageHandlers = new Set<MessageHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // Pending rejoin info (stored across reconnects)
  private pendingRejoin: { roomId: RoomId; playerId: PlayerId } | null = null;

  // ── Public API ──────────────────────────────────────────────────────────────

  connect(url?: string): void {
    if (url) this.url = url;
    this._connect();
  }

  disconnect(): void {
    this.pendingRejoin = null;
    this._cleanUp();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] Cannot send – not connected:', msg.type);
    }
  }

  // ── Room actions ────────────────────────────────────────────────────────────

  createRoom(playerName: string, options: Partial<GameRoomOptions> = {}): void {
    this.send({ type: 'CREATE_ROOM', playerName, options });
  }

  joinRoom(roomId: RoomId, playerName: string): void {
    this.send({ type: 'JOIN_ROOM', roomId, playerName });
  }

  rejoinRoom(roomId: RoomId, playerId: PlayerId): void {
    this.pendingRejoin = { roomId, playerId };
    this.send({ type: 'REJOIN_ROOM', roomId, playerId });
  }

  leaveRoom(): void {
    this.pendingRejoin = null;
    this.send({ type: 'LEAVE_ROOM' });
  }

  startGame(): void {
    this.send({ type: 'START_GAME' });
  }

  sendAction(action: GameActionPayload): void {
    this.send({ type: 'GAME_ACTION', action });
  }

  sendChat(text: string): void {
    this.send({ type: 'SEND_CHAT', text });
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private _connect(): void {
    this._cleanUp(false);
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('[WS] Failed to create WebSocket:', e);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      this._notifyConnection(true);
      this._startPing();

      // Auto-rejoin if we have pending state
      if (this.pendingRejoin) {
        this.send({
          type: 'REJOIN_ROOM',
          roomId: this.pendingRejoin.roomId,
          playerId: this.pendingRejoin.playerId,
        });
      }
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        this.messageHandlers.forEach(h => h(msg));
      } catch {
        console.error('[WS] Failed to parse message', event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this._stopPing();
      this._notifyConnection(false);
      this._scheduleReconnect();
    };

    this.ws.onerror = (e) => {
      console.error('[WS] Error:', e);
    };
  }

  private _cleanUp(clearRejoin = true): void {
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
    if (clearRejoin) this.pendingRejoin = null;
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[WS] Max reconnect attempts reached');
      return;
    }
    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  private _startPing(): void {
    this._stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' });
    }, PING_INTERVAL_MS);
  }

  private _stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private _notifyConnection(connected: boolean): void {
    this.connectionHandlers.forEach(h => h(connected));
  }
}

// Singleton
export const wsClient = new MultiplayerWSClient();

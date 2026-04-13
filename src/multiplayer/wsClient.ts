import type { ClientToServerMessage, ServerToClientMessage } from './types';

type MessageListener = (message: ServerToClientMessage) => void;
type StatusListener = (status: 'connected' | 'connecting' | 'disconnected') => void;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 8000;

class WSClient {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private shouldReconnect = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectRoomId: string | null = null;
  private reconnectToken: string | null = null;

  private readonly messageListeners = new Set<MessageListener>();
  private readonly statusListeners = new Set<StatusListener>();

  connect(url: string): void {
    this.url = url;
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.emitStatus('connecting');

    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.emitStatus('connected');

      if (this.reconnectRoomId && this.reconnectToken) {
        this.send({
          type: 'reconnect',
          roomId: this.reconnectRoomId,
          playerToken: this.reconnectToken,
        });
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as ServerToClientMessage;
        this.emitMessage(parsed);
      } catch {
        this.emitMessage({ type: 'error', message: 'Invalid server message.' });
      }
    };

    this.socket.onclose = () => {
      this.emitStatus('disconnected');
      this.socket = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.emitStatus('disconnected');
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.emitStatus('disconnected');
  }

  setReconnectIdentity(roomId: string | null, playerToken: string | null): void {
    this.reconnectRoomId = roomId;
    this.reconnectToken = playerToken;
  }

  send(message: ClientToServerMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  subscribe(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private scheduleReconnect(): void {
    if (!this.url) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      if (!this.url) return;
      this.connect(this.url);
    }, delay);
  }

  private emitMessage(message: ServerToClientMessage): void {
    for (const listener of this.messageListeners) listener(message);
  }

  private emitStatus(status: 'connected' | 'connecting' | 'disconnected'): void {
    for (const listener of this.statusListeners) listener(status);
  }
}

export const wsClient = new WSClient();

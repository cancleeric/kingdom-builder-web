import { WsTransport } from '@hd/game-kit';
import type { ClientToServerMessage, ServerToClientMessage } from './types';

type MessageListener = (message: ServerToClientMessage) => void;
type StatusListener = (status: 'connected' | 'connecting' | 'disconnected') => void;

/**
 * Thin wrapper around kit's WsTransport that preserves the existing
 * subscribe / subscribeStatus / send / connect / disconnect /
 * setReconnectIdentity interface used by multiplayerStore.
 */
class WSClient {
  private readonly transport = new WsTransport<ClientToServerMessage, ServerToClientMessage>();

  connect(url: string): void {
    this.transport.connect(url);
  }

  disconnect(): void {
    this.transport.disconnect();
  }

  setReconnectIdentity(roomId: string | null, playerToken: string | null): void {
    this.transport.setReconnectIdentity(roomId, playerToken);
  }

  send(message: ClientToServerMessage): void {
    this.transport.send(message);
  }

  subscribe(listener: MessageListener): () => void {
    return this.transport.onMessage(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    return this.transport.onStatusChange(listener);
  }
}

export const wsClient = new WSClient();

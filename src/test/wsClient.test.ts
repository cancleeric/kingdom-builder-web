/**
 * Unit tests for src/multiplayer/wsClient.ts
 *
 * Strategy: mock @hd/game-kit's WsTransport with a class-based mock so
 * `new WsTransport()` inside WSClient works. We then retrieve the mock
 * instance from wsClient's private transport field and verify delegation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock @hd/game-kit BEFORE importing wsClient ──────────────────────────────
//
// WsTransport is instantiated at module-load time as a class field, so the
// mock must expose a proper class (not just vi.fn()).

type MsgListener = (msg: unknown) => void;
type StatusListener = (s: 'connected' | 'connecting' | 'disconnected') => void;

// Shared spy references — populated after wsClient import
let transportInstance: {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  setReconnectIdentity: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn>;
  onStatusChange: ReturnType<typeof vi.fn>;
  _msgListeners: MsgListener[];
  _statusListeners: StatusListener[];
};

vi.mock('@hd/game-kit', () => {
  class WsTransport {
    _msgListeners: MsgListener[] = [];
    _statusListeners: StatusListener[] = [];
    connect = vi.fn();
    disconnect = vi.fn();
    send = vi.fn();
    setReconnectIdentity = vi.fn();
    onMessage = vi.fn((cb: MsgListener) => {
      this._msgListeners.push(cb);
      return () => { const i = this._msgListeners.indexOf(cb); if (i !== -1) this._msgListeners.splice(i, 1); };
    });
    onStatusChange = vi.fn((cb: StatusListener) => {
      this._statusListeners.push(cb);
      return () => { const i = this._statusListeners.indexOf(cb); if (i !== -1) this._statusListeners.splice(i, 1); };
    });
  }
  return { WsTransport };
});

// Import AFTER mock is declared
import { wsClient } from '../multiplayer/wsClient';
import type { ClientToServerMessage } from '../multiplayer/types';

// Grab the mock transport instance created inside WSClient
beforeEach(() => {
  transportInstance = (wsClient as unknown as { transport: typeof transportInstance }).transport;
  vi.clearAllMocks();
  // Re-attach listener tracking after clearAllMocks resets them
  transportInstance._msgListeners = [];
  transportInstance._statusListeners = [];
  transportInstance.onMessage.mockImplementation((cb: MsgListener) => {
    transportInstance._msgListeners.push(cb);
    return () => { const i = transportInstance._msgListeners.indexOf(cb); if (i !== -1) transportInstance._msgListeners.splice(i, 1); };
  });
  transportInstance.onStatusChange.mockImplementation((cb: StatusListener) => {
    transportInstance._statusListeners.push(cb);
    return () => { const i = transportInstance._statusListeners.indexOf(cb); if (i !== -1) transportInstance._statusListeners.splice(i, 1); };
  });
});

function emitMsg(msg: unknown) { transportInstance._msgListeners.forEach(l => l(msg)); }
function emitStatus(s: 'connected' | 'connecting' | 'disconnected') { transportInstance._statusListeners.forEach(l => l(s)); }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WSClient.connect', () => {
  it('delegates connect(url) to transport.connect(url)', () => {
    wsClient.connect('ws://test.example.com/ws');
    expect(transportInstance.connect).toHaveBeenCalledOnce();
    expect(transportInstance.connect).toHaveBeenCalledWith('ws://test.example.com/ws');
  });

  it('passes any URL string verbatim', () => {
    wsClient.connect('wss://prod.example.com:8787');
    expect(transportInstance.connect).toHaveBeenCalledWith('wss://prod.example.com:8787');
  });
});

describe('WSClient.disconnect', () => {
  it('delegates disconnect() to transport.disconnect()', () => {
    wsClient.disconnect();
    expect(transportInstance.disconnect).toHaveBeenCalledOnce();
  });
});

describe('WSClient.send', () => {
  it('delegates send(message) to transport.send(message)', () => {
    const msg: ClientToServerMessage = { type: 'create_room', playerName: 'Alice' };
    wsClient.send(msg);
    expect(transportInstance.send).toHaveBeenCalledOnce();
    expect(transportInstance.send).toHaveBeenCalledWith(msg);
  });

  it('sends join_room message with token', () => {
    const msg: ClientToServerMessage = {
      type: 'join_room',
      roomId: 'ABCD',
      playerName: 'Bob',
      playerToken: 'token-xyz',
    };
    wsClient.send(msg);
    expect(transportInstance.send).toHaveBeenCalledWith(msg);
  });

  it('sends player_action message', () => {
    const msg: ClientToServerMessage = {
      type: 'player_action',
      action: { type: 'draw_terrain_card' },
    };
    wsClient.send(msg);
    expect(transportInstance.send).toHaveBeenCalledWith(msg);
  });

  it('sends leave_room message', () => {
    const msg: ClientToServerMessage = { type: 'leave_room' };
    wsClient.send(msg);
    expect(transportInstance.send).toHaveBeenCalledWith({ type: 'leave_room' });
  });
});

describe('WSClient.setReconnectIdentity', () => {
  it('delegates to transport.setReconnectIdentity with both args', () => {
    wsClient.setReconnectIdentity('ROOM1', 'tok-abc');
    expect(transportInstance.setReconnectIdentity).toHaveBeenCalledWith('ROOM1', 'tok-abc');
  });

  it('passes null values to clear identity', () => {
    wsClient.setReconnectIdentity(null, null);
    expect(transportInstance.setReconnectIdentity).toHaveBeenCalledWith(null, null);
  });

  it('passes mixed null / value', () => {
    wsClient.setReconnectIdentity('ROOM2', null);
    expect(transportInstance.setReconnectIdentity).toHaveBeenCalledWith('ROOM2', null);
  });
});

describe('WSClient.subscribe (onMessage)', () => {
  it('registers a listener via transport.onMessage', () => {
    const cb = vi.fn();
    wsClient.subscribe(cb);
    expect(transportInstance.onMessage).toHaveBeenCalledWith(cb);
  });

  it('registered listener receives emitted messages', () => {
    const received: unknown[] = [];
    wsClient.subscribe((msg) => received.push(msg));
    emitMsg({ type: 'connected' });
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ type: 'connected' });
  });

  it('returns an unsubscribe function that stops delivery', () => {
    const received: unknown[] = [];
    const unsub = wsClient.subscribe((msg) => received.push(msg));

    emitMsg({ type: 'connected' });
    expect(received).toHaveLength(1);

    unsub();
    emitMsg({ type: 'connected' });
    expect(received).toHaveLength(1); // no new delivery
  });

  it('multiple listeners all receive the same message', () => {
    const a: unknown[] = [];
    const b: unknown[] = [];
    wsClient.subscribe((m) => a.push(m));
    wsClient.subscribe((m) => b.push(m));

    emitMsg({ type: 'error', message: 'oops' });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
  });
});

describe('WSClient.subscribeStatus (onStatusChange)', () => {
  it('registers a status listener via transport.onStatusChange', () => {
    const cb = vi.fn();
    wsClient.subscribeStatus(cb);
    expect(transportInstance.onStatusChange).toHaveBeenCalledWith(cb);
  });

  it('registered listener receives status updates', () => {
    const statuses: string[] = [];
    wsClient.subscribeStatus((s) => statuses.push(s));

    emitStatus('connecting');
    emitStatus('connected');
    expect(statuses).toEqual(['connecting', 'connected']);
  });

  it('returns unsubscribe that stops status delivery', () => {
    const statuses: string[] = [];
    const unsub = wsClient.subscribeStatus((s) => statuses.push(s));

    emitStatus('connected');
    unsub();
    emitStatus('disconnected');
    expect(statuses).toEqual(['connected']);
  });

  it('receives disconnected status', () => {
    const statuses: string[] = [];
    wsClient.subscribeStatus((s) => statuses.push(s));
    emitStatus('disconnected');
    expect(statuses).toContain('disconnected');
  });
});

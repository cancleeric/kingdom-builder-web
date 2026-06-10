/**
 * Unit tests for src/store/multiplayerStore.ts
 *
 * All network I/O is intercepted by mocking wsClient and stateSerializer.
 * Tests cover:
 *  - Initial state shape
 *  - connect / disconnect actions
 *  - createRoom / joinRoom / leaveRoom sends correct messages
 *  - handleServerMessage branches: error, room_created, room_joined,
 *    room_update, game_started, state_update, action_request
 *  - hydrate edge cases (issue #183): room_joined with null gameState,
 *    game_started with null gameState
 *  - clearError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (vi.hoisted ensures variables are available inside vi.mock factory) ─

const { mockWsClient, onMessageCbHolder, onStatusCbHolder } = vi.hoisted(() => {
  const onMessageCbHolder: { cb: ((msg: unknown) => void) | null } = { cb: null };
  const onStatusCbHolder: { cb: ((s: string) => void) | null } = { cb: null };

  const mockWsClient = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    setReconnectIdentity: vi.fn(),
    subscribe: vi.fn((cb: (msg: unknown) => void) => {
      onMessageCbHolder.cb = cb;
      return () => { onMessageCbHolder.cb = null; };
    }),
    subscribeStatus: vi.fn((cb: (s: string) => void) => {
      onStatusCbHolder.cb = cb;
      return () => { onStatusCbHolder.cb = null; };
    }),
  };

  return { mockWsClient, onMessageCbHolder, onStatusCbHolder };
});

vi.mock('../multiplayer/wsClient', () => ({ wsClient: mockWsClient }));

const mockHydrate = vi.hoisted(() => vi.fn());
vi.mock('../multiplayer/stateSerializer', () => ({
  hydrateSerializableState: mockHydrate,
  extractSerializableState: vi.fn(),
}));

// Minimal gameStore mock (action dispatch covered by gameStore tests)
vi.mock('../store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(() => ({
      drawTerrainCard: vi.fn(),
      endTurn: vi.fn(),
      placeSettlement: vi.fn(),
      activateTile: vi.fn(),
      cancelTile: vi.fn(),
      applyTilePlacement: vi.fn(),
      selectTileMoveSource: vi.fn(),
      applyTileMove: vi.fn(),
      undoLastAction: vi.fn(),
      selectCell: vi.fn(),
    })),
  },
}));

// ── Import AFTER mocks ────────────────────────────────────────────────────────
import { useMultiplayerStore } from '../store/multiplayerStore';
import type { RoomInfo } from '../multiplayer/types';
import type { SerializableGameState, WireGameState } from '../store/persistence';

// ── Helpers ───────────────────────────────────────────────────────────────────

function emitMessage(msg: unknown) {
  if (!onMessageCbHolder.cb) throw new Error('No message listener registered');
  onMessageCbHolder.cb(msg);
}

function emitStatus(status: 'connected' | 'connecting' | 'disconnected') {
  if (!onStatusCbHolder.cb) throw new Error('No status listener registered');
  onStatusCbHolder.cb(status);
}

const baseRoom: RoomInfo = {
  id: 'ROOM1',
  hostPlayerId: 1,
  gameStarted: false,
  players: [{ id: 1, name: 'Alice', ready: false, connected: true }],
};

function resetStore() {
  localStorage.clear();
  useMultiplayerStore.setState({
    connectionStatus: 'disconnected',
    room: null,
    localPlayerId: null,
    localPlayerToken: null,
    error: null,
    mode: 'idle',
  });
  vi.clearAllMocks();
  // Re-register subscribe implementations after clearAllMocks
  mockWsClient.subscribe.mockImplementation((cb: (msg: unknown) => void) => {
    onMessageCbHolder.cb = cb;
    return () => { onMessageCbHolder.cb = null; };
  });
  mockWsClient.subscribeStatus.mockImplementation((cb: (s: string) => void) => {
    onStatusCbHolder.cb = cb;
    return () => { onStatusCbHolder.cb = null; };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMultiplayerStore — initial state', () => {
  beforeEach(resetStore);

  it('starts disconnected with no room or error', () => {
    const s = useMultiplayerStore.getState();
    expect(s.connectionStatus).toBe('disconnected');
    expect(s.room).toBeNull();
    expect(s.error).toBeNull();
    expect(s.mode).toBe('idle');
    expect(s.localPlayerId).toBeNull();
  });
});

describe('useMultiplayerStore.connect', () => {
  beforeEach(resetStore);

  it('calls wsClient.connect with provided URL', () => {
    useMultiplayerStore.getState().connect('ws://localhost:8787');
    expect(mockWsClient.connect).toHaveBeenCalledWith('ws://localhost:8787');
  });

  it('uses stored serverUrl when called without argument', () => {
    useMultiplayerStore.setState({ serverUrl: 'ws://custom:9999' });
    useMultiplayerStore.getState().connect();
    expect(mockWsClient.connect).toHaveBeenCalledWith('ws://custom:9999');
  });

  it('clears error on connect', () => {
    useMultiplayerStore.setState({ error: 'previous error' });
    useMultiplayerStore.getState().connect('ws://any');
    expect(useMultiplayerStore.getState().error).toBeNull();
  });

  it('stores custom serverUrl in state', () => {
    useMultiplayerStore.getState().connect('ws://new-server.example.com');
    expect(useMultiplayerStore.getState().serverUrl).toBe('ws://new-server.example.com');
  });
});

describe('useMultiplayerStore.disconnect', () => {
  beforeEach(resetStore);

  it('calls wsClient.disconnect and sets status to disconnected', () => {
    useMultiplayerStore.setState({ connectionStatus: 'connected' });
    useMultiplayerStore.getState().disconnect();
    expect(mockWsClient.disconnect).toHaveBeenCalledOnce();
    expect(useMultiplayerStore.getState().connectionStatus).toBe('disconnected');
  });
});

describe('useMultiplayerStore.clearError', () => {
  beforeEach(resetStore);

  it('clears the error field', () => {
    useMultiplayerStore.setState({ error: 'something went wrong' });
    useMultiplayerStore.getState().clearError();
    expect(useMultiplayerStore.getState().error).toBeNull();
  });
});

describe('useMultiplayerStore.createRoom', () => {
  beforeEach(resetStore);

  it('sends create_room message with playerName', () => {
    useMultiplayerStore.getState().createRoom('Alice');
    expect(mockWsClient.send).toHaveBeenCalledWith({
      type: 'create_room',
      playerName: 'Alice',
    });
  });
});

describe('useMultiplayerStore.joinRoom', () => {
  beforeEach(resetStore);

  it('sends join_room with uppercased roomId', () => {
    useMultiplayerStore.getState().joinRoom('abc1', 'Bob');
    expect(mockWsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'join_room', roomId: 'ABC1', playerName: 'Bob' })
    );
  });

  it('includes localPlayerToken when present', () => {
    useMultiplayerStore.setState({ localPlayerToken: 'existing-token' });
    useMultiplayerStore.getState().joinRoom('ROOM2', 'Carol');
    expect(mockWsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({ playerToken: 'existing-token' })
    );
  });

  it('omits playerToken when localPlayerToken is null', () => {
    useMultiplayerStore.setState({ localPlayerToken: null });
    useMultiplayerStore.getState().joinRoom('ROOM3', 'Dave');
    const call = mockWsClient.send.mock.calls[0][0] as Record<string, unknown>;
    expect(call.playerToken).toBeUndefined();
  });
});

describe('useMultiplayerStore.leaveRoom', () => {
  beforeEach(resetStore);

  it('sends leave_room, clears room state, and removes localStorage keys', () => {
    localStorage.setItem('kb-mp-room-id', 'ROOM1');
    localStorage.setItem('kb-mp-player-token', 'tok');
    useMultiplayerStore.setState({ room: baseRoom, localPlayerId: 1, localPlayerToken: 'tok', mode: 'lobby' });

    useMultiplayerStore.getState().leaveRoom();

    expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'leave_room' });
    expect(mockWsClient.setReconnectIdentity).toHaveBeenCalledWith(null, null);

    const s = useMultiplayerStore.getState();
    expect(s.room).toBeNull();
    expect(s.localPlayerId).toBeNull();
    expect(s.localPlayerToken).toBeNull();
    expect(s.mode).toBe('idle');

    expect(localStorage.getItem('kb-mp-room-id')).toBeNull();
    expect(localStorage.getItem('kb-mp-player-token')).toBeNull();
  });
});

describe('useMultiplayerStore.setReady', () => {
  beforeEach(resetStore);

  it('sends set_ready with ready=true', () => {
    useMultiplayerStore.getState().setReady(true);
    expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'set_ready', ready: true });
  });

  it('sends set_ready with ready=false', () => {
    useMultiplayerStore.getState().setReady(false);
    expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'set_ready', ready: false });
  });
});

describe('useMultiplayerStore — server message: error', () => {
  beforeEach(resetStore);

  it('sets error field from error message', () => {
    emitMessage({ type: 'error', message: 'Room not found' });
    expect(useMultiplayerStore.getState().error).toBe('Room not found');
  });
});

describe('useMultiplayerStore — server message: room_created', () => {
  beforeEach(resetStore);

  it('sets room, localPlayerId, mode=lobby, and persists to localStorage', () => {
    emitMessage({
      type: 'room_created',
      room: baseRoom,
      yourPlayerId: 1,
      yourPlayerToken: 'tok-abc',
    });

    const s = useMultiplayerStore.getState();
    expect(s.room).toEqual(baseRoom);
    expect(s.localPlayerId).toBe(1);
    expect(s.localPlayerToken).toBe('tok-abc');
    expect(s.mode).toBe('lobby');
    expect(s.error).toBeNull();

    expect(localStorage.getItem('kb-mp-room-id')).toBe('ROOM1');
    expect(localStorage.getItem('kb-mp-player-token')).toBe('tok-abc');
  });

  it('sets mode=in_game when room.gameStarted=true', () => {
    const startedRoom: RoomInfo = { ...baseRoom, gameStarted: true };
    emitMessage({
      type: 'room_created',
      room: startedRoom,
      yourPlayerId: 1,
      yourPlayerToken: 'tok',
    });
    expect(useMultiplayerStore.getState().mode).toBe('in_game');
  });
});

describe('useMultiplayerStore — server message: room_joined', () => {
  beforeEach(resetStore);

  it('sets room and calls setReconnectIdentity', () => {
    emitMessage({
      type: 'room_joined',
      room: baseRoom,
      yourPlayerId: 2,
      yourPlayerToken: 'tok-join',
      gameState: null,
    });

    expect(mockWsClient.setReconnectIdentity).toHaveBeenCalledWith('ROOM1', 'tok-join');
    expect(useMultiplayerStore.getState().localPlayerId).toBe(2);
  });

  it('calls hydrateSerializableState when gameState is non-null (issue #183 — hydrate on rejoin)', () => {
    const fakeState = { board: {}, players: [] } as unknown as SerializableGameState;
    emitMessage({
      type: 'room_joined',
      room: baseRoom,
      yourPlayerId: 2,
      yourPlayerToken: 'tok',
      gameState: fakeState,
    });
    expect(mockHydrate).toHaveBeenCalledWith(fakeState);
  });

  it('does NOT call hydrateSerializableState when gameState is null (issue #183 — null guard)', () => {
    emitMessage({
      type: 'room_joined',
      room: baseRoom,
      yourPlayerId: 2,
      yourPlayerToken: 'tok',
      gameState: null,
    });
    expect(mockHydrate).not.toHaveBeenCalled();
  });
});

describe('useMultiplayerStore — server message: room_update', () => {
  beforeEach(resetStore);

  it('updates room and sets mode=in_game when gameStarted', () => {
    useMultiplayerStore.setState({ mode: 'lobby' });
    const updatedRoom: RoomInfo = { ...baseRoom, gameStarted: true };
    emitMessage({ type: 'room_update', room: updatedRoom });

    const s = useMultiplayerStore.getState();
    expect(s.room).toEqual(updatedRoom);
    expect(s.mode).toBe('in_game');
  });

  it('keeps mode=lobby when gameStarted=false and mode was lobby', () => {
    useMultiplayerStore.setState({ mode: 'lobby' });
    emitMessage({ type: 'room_update', room: baseRoom });
    expect(useMultiplayerStore.getState().mode).toBe('lobby');
  });

  it('transitions from idle to lobby on room_update when gameStarted=false', () => {
    useMultiplayerStore.setState({ mode: 'idle' });
    emitMessage({ type: 'room_update', room: baseRoom });
    // When mode is 'idle' and gameStarted=false the logic sets mode to 'lobby'
    expect(useMultiplayerStore.getState().mode).toBe('lobby');
  });
});

describe('useMultiplayerStore — server message: game_started', () => {
  beforeEach(resetStore);

  it('sets mode=in_game and calls hydrateSerializableState with gameState', () => {
    const fakeState = { board: {}, players: [{ id: 1 }] } as unknown as SerializableGameState;
    emitMessage({ type: 'game_started', room: baseRoom, gameState: fakeState });

    expect(useMultiplayerStore.getState().mode).toBe('in_game');
    expect(useMultiplayerStore.getState().error).toBeNull();
    expect(mockHydrate).toHaveBeenCalledWith(fakeState);
  });

  it('does NOT call hydrateSerializableState when gameState is null (issue #183)', () => {
    emitMessage({ type: 'game_started', room: baseRoom, gameState: null });
    expect(mockHydrate).not.toHaveBeenCalled();
    expect(useMultiplayerStore.getState().mode).toBe('in_game');
  });
});

describe('useMultiplayerStore — server message: state_update', () => {
  beforeEach(resetStore);

  it('calls hydrateSerializableState with the payload gameState', () => {
    const fakeState = { board: {}, players: [] } as unknown as SerializableGameState;
    emitMessage({ type: 'state_update', gameState: fakeState });
    expect(mockHydrate).toHaveBeenCalledWith(fakeState);
  });

  it('does NOT call hydrateSerializableState when gameState is null', () => {
    emitMessage({ type: 'state_update', gameState: null });
    expect(mockHydrate).not.toHaveBeenCalled();
  });
});

describe('useMultiplayerStore — server message: action_request', () => {
  beforeEach(resetStore);

  it('does not throw when localPlayer is host and action is dispatched', () => {
    useMultiplayerStore.setState({
      room: baseRoom,   // hostPlayerId = 1
      localPlayerId: 1,
    });
    expect(() =>
      emitMessage({ type: 'action_request', action: { type: 'draw_terrain_card' } })
    ).not.toThrow();
  });

  it('does not throw when localPlayer is NOT host (no-op path)', () => {
    useMultiplayerStore.setState({
      room: { ...baseRoom, hostPlayerId: 1 },
      localPlayerId: 2,  // guest
    });
    expect(() =>
      emitMessage({ type: 'action_request', action: { type: 'end_turn' } })
    ).not.toThrow();
  });

  it('does not throw when room is null', () => {
    useMultiplayerStore.setState({ room: null, localPlayerId: 1 });
    expect(() =>
      emitMessage({ type: 'action_request', action: { type: 'end_turn' } })
    ).not.toThrow();
  });
});

describe('useMultiplayerStore — status subscription', () => {
  beforeEach(resetStore);

  it('updates connectionStatus when transport emits connected', () => {
    emitStatus('connected');
    expect(useMultiplayerStore.getState().connectionStatus).toBe('connected');
  });

  it('updates connectionStatus to disconnected', () => {
    emitStatus('disconnected');
    expect(useMultiplayerStore.getState().connectionStatus).toBe('disconnected');
  });

  it('sets connectionStatus to connecting', () => {
    emitStatus('connecting');
    expect(useMultiplayerStore.getState().connectionStatus).toBe('connecting');
  });
});

describe('useMultiplayerStore.sendPlayerAction', () => {
  beforeEach(resetStore);

  it('wraps action in player_action message', () => {
    useMultiplayerStore.getState().sendPlayerAction({ type: 'end_turn' });
    expect(mockWsClient.send).toHaveBeenCalledWith({
      type: 'player_action',
      action: { type: 'end_turn' },
    });
  });
});

describe('useMultiplayerStore.sendStateUpdate', () => {
  beforeEach(resetStore);

  it('wraps gameState in state_update message', () => {
    const gs = { board: {} } as unknown as WireGameState;
    useMultiplayerStore.getState().sendStateUpdate(gs);
    expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'state_update', gameState: gs });
  });
});

describe('useMultiplayerStore.startGame', () => {
  beforeEach(resetStore);

  it('wraps initialState in start_game message', () => {
    const gs = { board: {} } as unknown as WireGameState;
    useMultiplayerStore.getState().startGame(gs);
    expect(mockWsClient.send).toHaveBeenCalledWith({ type: 'start_game', gameState: gs });
  });
});

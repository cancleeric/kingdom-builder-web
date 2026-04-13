import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_PLAYERS = 4;

/** @typedef {{id:number,name:string,ready:boolean,connected:boolean,token:string,socket:import('ws').WebSocket|null}} RoomPlayer */
/** @typedef {{id:string,players:RoomPlayer[],hostPlayerId:number,gameStarted:boolean,gameState:unknown|null}} Room */

/** @type {Map<string, Room>} */
const rooms = new Map();

function roomSummary(room) {
  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId,
    gameStarted: room.gameStarted,
    players: room.players
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        connected: p.connected,
      })),
  };
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcastRoom(room, message, exceptPlayerId) {
  for (const player of room.players) {
    if (exceptPlayerId !== undefined && player.id === exceptPlayerId) continue;
    if (player.socket) send(player.socket, message);
  }
}

function randomToken() {
  return randomBytes(16).toString('hex');
}

function randomRoomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function createRoom() {
  let id = randomRoomId();
  while (rooms.has(id)) id = randomRoomId();
  /** @type {Room} */
  const room = {
    id,
    players: [],
    hostPlayerId: 1,
    gameStarted: false,
    gameState: null,
  };
  rooms.set(id, room);
  return room;
}

function firstAvailablePlayerId(players) {
  for (let id = 1; id <= MAX_PLAYERS; id += 1) {
    if (!players.some((p) => p.id === id)) return id;
  }
  return null;
}

function currentTurnPlayerId(room) {
  if (!room.gameState || typeof room.gameState !== 'object') return null;
  const state = /** @type {{players?:Array<{id:number}>, currentPlayerIndex?:number}} */ (room.gameState);
  if (!Array.isArray(state.players) || typeof state.currentPlayerIndex !== 'number') return null;
  return state.players[state.currentPlayerIndex]?.id ?? null;
}

function attachPlayerSocket(socket, room, player) {
  player.connected = true;
  player.socket = socket;
  socket._roomId = room.id;
  socket._playerId = player.id;
}

function detachSocket(socket) {
  const roomId = socket._roomId;
  const playerId = socket._playerId;
  if (!roomId || !playerId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.connected = false;
    player.socket = null;
  }

  if (!room.gameStarted) {
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      rooms.delete(room.id);
      return;
    }

    if (room.hostPlayerId === playerId) {
      room.hostPlayerId = room.players.slice().sort((a, b) => a.id - b.id)[0].id;
    }
  } else if (room.hostPlayerId === playerId) {
    const connectedReplacement = room.players
      .slice()
      .sort((a, b) => a.id - b.id)
      .find((p) => p.connected);
    if (connectedReplacement) {
      room.hostPlayerId = connectedReplacement.id;
    }
  }

  broadcastRoom(room, {
    type: 'room_update',
    room: roomSummary(room),
  });
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  send(socket, { type: 'connected' });

  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      send(socket, { type: 'error', message: 'Invalid JSON payload.' });
      return;
    }

    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
      send(socket, { type: 'error', message: 'Invalid message shape.' });
      return;
    }

    if (msg.type === 'create_room') {
      if (typeof msg.playerName !== 'string' || msg.playerName.trim().length === 0) {
        send(socket, { type: 'error', message: 'playerName is required.' });
        return;
      }

      const room = createRoom();
      const player = {
        id: 1,
        name: msg.playerName.trim(),
        ready: false,
        connected: true,
        token: randomToken(),
        socket,
      };
      room.players.push(player);
      room.hostPlayerId = player.id;
      attachPlayerSocket(socket, room, player);

      send(socket, {
        type: 'room_created',
        room: roomSummary(room),
        yourPlayerId: player.id,
        yourPlayerToken: player.token,
      });
      return;
    }

    if (msg.type === 'join_room') {
      if (typeof msg.roomId !== 'string' || typeof msg.playerName !== 'string') {
        send(socket, { type: 'error', message: 'roomId and playerName are required.' });
        return;
      }
      const room = rooms.get(msg.roomId.toUpperCase());
      if (!room) {
        send(socket, { type: 'error', message: 'Room not found.' });
        return;
      }

      const playerName = msg.playerName.trim();
      if (!playerName) {
        send(socket, { type: 'error', message: 'playerName is required.' });
        return;
      }

      const rejoinToken = typeof msg.playerToken === 'string' ? msg.playerToken : null;
      if (rejoinToken) {
        const existing = room.players.find((p) => p.token === rejoinToken);
        if (existing) {
          attachPlayerSocket(socket, room, existing);
          send(socket, {
            type: 'room_joined',
            room: roomSummary(room),
            yourPlayerId: existing.id,
            yourPlayerToken: existing.token,
            gameState: room.gameState,
          });
          broadcastRoom(room, { type: 'room_update', room: roomSummary(room) }, existing.id);
          return;
        }
      }

      if (room.gameStarted) {
        send(socket, { type: 'error', message: 'Game already started.' });
        return;
      }

      const id = firstAvailablePlayerId(room.players);
      if (id === null) {
        send(socket, { type: 'error', message: 'Room is full.' });
        return;
      }

      const player = {
        id,
        name: playerName,
        ready: false,
        connected: true,
        token: randomToken(),
        socket,
      };
      room.players.push(player);
      attachPlayerSocket(socket, room, player);

      send(socket, {
        type: 'room_joined',
        room: roomSummary(room),
        yourPlayerId: player.id,
        yourPlayerToken: player.token,
        gameState: room.gameState,
      });

      broadcastRoom(room, { type: 'room_update', room: roomSummary(room) }, player.id);
      return;
    }

    if (msg.type === 'reconnect') {
      if (typeof msg.roomId !== 'string' || typeof msg.playerToken !== 'string') {
        send(socket, { type: 'error', message: 'roomId and playerToken are required.' });
        return;
      }

      const room = rooms.get(msg.roomId.toUpperCase());
      if (!room) {
        send(socket, { type: 'error', message: 'Room not found for reconnect.' });
        return;
      }

      const player = room.players.find((p) => p.token === msg.playerToken);
      if (!player) {
        send(socket, { type: 'error', message: 'Reconnect token invalid.' });
        return;
      }

      attachPlayerSocket(socket, room, player);
      send(socket, {
        type: 'room_joined',
        room: roomSummary(room),
        yourPlayerId: player.id,
        yourPlayerToken: player.token,
        gameState: room.gameState,
      });
      if (room.gameStarted && room.gameState) {
        send(socket, { type: 'state_update', gameState: room.gameState });
      }
      broadcastRoom(room, { type: 'room_update', room: roomSummary(room) }, player.id);
      return;
    }

    const roomId = socket._roomId;
    const playerId = socket._playerId;
    if (!roomId || !playerId) {
      send(socket, { type: 'error', message: 'Join a room first.' });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      send(socket, { type: 'error', message: 'Room not found.' });
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      send(socket, { type: 'error', message: 'Player not found in room.' });
      return;
    }

    if (msg.type === 'set_ready') {
      player.ready = Boolean(msg.ready);
      broadcastRoom(room, { type: 'room_update', room: roomSummary(room) });
      return;
    }

    if (msg.type === 'leave_room') {
      if (!room.gameStarted) {
        room.players = room.players.filter((p) => p.id !== player.id);
      } else {
        player.connected = false;
        player.socket = null;
      }

      socket._roomId = undefined;
      socket._playerId = undefined;

      if (room.players.length === 0) {
        rooms.delete(room.id);
      } else {
        if (room.hostPlayerId === player.id) {
          room.hostPlayerId = room.players.slice().sort((a, b) => a.id - b.id)[0].id;
        }
        broadcastRoom(room, { type: 'room_update', room: roomSummary(room) });
      }
      return;
    }

    if (msg.type === 'start_game') {
      if (player.id !== room.hostPlayerId) {
        send(socket, { type: 'error', message: 'Only host can start the game.' });
        return;
      }
      if (room.players.length < 2) {
        send(socket, { type: 'error', message: 'At least 2 players are required.' });
        return;
      }
      const allReady = room.players.every((p) => p.ready || p.id === room.hostPlayerId);
      if (!allReady) {
        send(socket, { type: 'error', message: 'All non-host players must be ready.' });
        return;
      }

      room.gameStarted = true;
      room.gameState = msg.gameState ?? null;
      broadcastRoom(room, {
        type: 'game_started',
        room: roomSummary(room),
        gameState: room.gameState,
      });
      return;
    }

    if (msg.type === 'state_update') {
      if (player.id !== room.hostPlayerId) {
        send(socket, { type: 'error', message: 'Only host can publish state updates.' });
        return;
      }
      room.gameState = msg.gameState ?? null;
      broadcastRoom(room, { type: 'state_update', gameState: room.gameState }, player.id);
      return;
    }

    if (msg.type === 'player_action') {
      if (!room.gameStarted) {
        send(socket, { type: 'error', message: 'Game not started.' });
        return;
      }
      const turnPlayerId = currentTurnPlayerId(room);
      if (turnPlayerId === null || turnPlayerId !== player.id) {
        send(socket, { type: 'error', message: 'It is not your turn.' });
        return;
      }
      const host = room.players.find((p) => p.id === room.hostPlayerId);
      if (!host?.socket) {
        send(socket, { type: 'error', message: 'Host is disconnected.' });
        return;
      }

      send(host.socket, {
        type: 'action_request',
        playerId: player.id,
        action: msg.action,
      });
      return;
    }

    send(socket, { type: 'error', message: `Unsupported message type: ${msg.type}` });
  });

  socket.on('close', () => {
    detachSocket(socket);
  });
});

console.log(`WebSocket room server listening on ws://localhost:${PORT}`);

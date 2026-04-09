import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './roomManager';
import type { ClientMessage, ServerMessage } from './types';

const PORT = parseInt(process.env.PORT ?? '8080', 10);

const wss = new WebSocketServer({ port: PORT });
const roomManager = new RoomManager();

// Map from WebSocket instance → unique wsId
const wsIds = new Map<WebSocket, string>();

// Active turn timeouts per room
const turnTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(wsId: string, roomId: string, msg: ServerMessage): void {
  for (const [socket, id] of wsIds.entries()) {
    if (id === wsId) continue;
    const entry = roomManager.getPlayerEntry(id);
    if (entry?.roomId === roomId) {
      send(socket, msg);
    }
  }
}

function broadcastAll(roomId: string, msg: ServerMessage): void {
  for (const [socket, id] of wsIds.entries()) {
    const entry = roomManager.getPlayerEntry(id);
    if (entry?.roomId === roomId) {
      send(socket, msg);
    }
  }
}

function startTurnTimeout(roomId: string, timeoutSeconds: number): void {
  clearTurnTimeout(roomId);
  const handle = setTimeout(() => {
    const result = roomManager.skipTurn(roomId);
    if (!result) return;
    const { gameState, skippedWsId } = result;
    // Find the PlayerId that maps to the skipped WS connection
    const skippedEntry = roomManager.getPlayerEntry(skippedWsId);
    broadcastAll(roomId, {
      type: 'TURN_TIMEOUT',
      skippedPlayerId: skippedEntry?.playerId ?? '',
    });
    broadcastAll(roomId, { type: 'GAME_STATE_UPDATE', gameState });
  }, timeoutSeconds * 1000);
  turnTimeouts.set(roomId, handle);
}

function clearTurnTimeout(roomId: string): void {
  const h = turnTimeouts.get(roomId);
  if (h) {
    clearTimeout(h);
    turnTimeouts.delete(roomId);
  }
}

wss.on('connection', (ws: WebSocket) => {
  const wsId = uuidv4();
  wsIds.set(ws, wsId);

  ws.on('message', (data: Buffer) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString()) as ClientMessage;
    } catch {
      send(ws, { type: 'ERROR', code: 'INVALID_JSON', message: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'PING':
        send(ws, { type: 'PONG' });
        break;

      case 'CREATE_ROOM': {
        const result = roomManager.createRoom(wsId, msg.playerName, msg.options);
        send(ws, {
          type: 'ROOM_CREATED',
          roomId: result.roomId,
          playerId: result.playerId,
          room: result.room,
        });
        break;
      }

      case 'JOIN_ROOM': {
        const result = roomManager.joinRoom(wsId, msg.roomId, msg.playerName);
        if ('error' in result) {
          send(ws, { type: 'ERROR', code: 'JOIN_FAILED', message: result.error });
          return;
        }
        send(ws, { type: 'ROOM_JOINED', playerId: result.playerId, room: result.room });
        broadcast(wsId, msg.roomId, { type: 'ROOM_UPDATED', room: result.room });
        break;
      }

      case 'REJOIN_ROOM': {
        const result = roomManager.rejoinRoom(wsId, msg.roomId, msg.playerId);
        if ('error' in result) {
          send(ws, { type: 'ERROR', code: 'REJOIN_FAILED', message: result.error });
          return;
        }
        send(ws, { type: 'ROOM_JOINED', playerId: msg.playerId, room: result.room });
        if (result.gameState) {
          send(ws, { type: 'GAME_STATE_UPDATE', gameState: result.gameState });
        }
        broadcast(wsId, msg.roomId, {
          type: 'PLAYER_RECONNECTED',
          playerId: msg.playerId,
          playerName: result.room.players.find(p => p.id === msg.playerId)?.name ?? '',
        });
        break;
      }

      case 'LEAVE_ROOM': {
        const result = roomManager.leaveRoom(wsId);
        if (result) {
          clearTurnTimeout(result.roomId);
          broadcast(wsId, result.roomId, { type: 'ROOM_UPDATED', room: result.room });
        }
        break;
      }

      case 'START_GAME': {
        const entry = roomManager.getPlayerEntry(wsId);
        if (!entry) {
          send(ws, { type: 'ERROR', code: 'NOT_IN_ROOM', message: 'Not in a room' });
          return;
        }
        const result = roomManager.startGame(entry.playerId);
        if ('error' in result) {
          send(ws, { type: 'ERROR', code: 'START_FAILED', message: result.error });
          return;
        }
        broadcastAll(entry.roomId, {
          type: 'GAME_STARTED',
          gameState: result.gameState,
          room: result.room,
        });
        startTurnTimeout(entry.roomId, result.room.options.turnTimeoutSeconds);
        break;
      }

      case 'GAME_ACTION': {
        const entry = roomManager.getPlayerEntry(wsId);
        if (!entry) {
          send(ws, { type: 'ERROR', code: 'NOT_IN_ROOM', message: 'Not in a room' });
          return;
        }
        const result = roomManager.applyAction(entry.playerId, msg.action);
        if ('error' in result) {
          send(ws, { type: 'ERROR', code: 'ACTION_FAILED', message: result.error });
          return;
        }
        // Reset turn timer on any action
        clearTurnTimeout(entry.roomId);
        if (result.gameState.phase === 'DrawCard') {
          startTurnTimeout(entry.roomId, result.room.options.turnTimeoutSeconds);
        }
        broadcastAll(entry.roomId, {
          type: 'GAME_STATE_UPDATE',
          gameState: result.gameState,
        });
        if (result.gameState.phase === 'GameOver') {
          broadcastAll(entry.roomId, {
            type: 'GAME_OVER',
            finalScores: result.gameState.finalScores,
          });
        }
        break;
      }

      case 'SEND_CHAT': {
        const entry = roomManager.getPlayerEntry(wsId);
        if (!entry) return;
        const playerName = roomManager.getPlayerName(entry.roomId, entry.playerId);
        broadcastAll(entry.roomId, {
          type: 'CHAT_RECEIVED',
          playerId: entry.playerId,
          playerName,
          text: msg.text.slice(0, 200),
          timestamp: Date.now(),
        });
        break;
      }

      default:
        send(ws, { type: 'ERROR', code: 'UNKNOWN_MESSAGE', message: 'Unknown message type' });
    }
  });

  ws.on('close', () => {
    const result = roomManager.handleDisconnect(wsId);
    wsIds.delete(ws);
    if (result) {
      broadcast(wsId, result.roomId, {
        type: 'PLAYER_DISCONNECTED',
        playerId: result.playerId,
        playerName: result.room.players.find(p => p.id === result.playerId)?.name ?? '',
      });
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

wss.on('listening', () => {
  console.log(`Kingdom Builder WebSocket server running on ws://localhost:${PORT}`);
});

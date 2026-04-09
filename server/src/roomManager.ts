import { v4 as uuidv4 } from 'uuid';
import type {
  RoomId,
  PlayerId,
  RoomInfo,
  RoomPlayer,
  GameRoomOptions,
  SerializedGameState,
  GameActionPayload,
  SerializedCell,
  SerializedPlayer,
  AxialCoord,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];
const TOTAL_SETTLEMENTS = 40;
const SETTLEMENTS_PER_TURN = 3;
const DEFAULT_TURN_TIMEOUT = 90; // seconds

// ─── Terrain / board helpers (simplified server-side logic) ──────────────────

type Terrain =
  | 'Grass'
  | 'Forest'
  | 'Desert'
  | 'Flower'
  | 'Canyon';
type Location =
  | 'Castle'
  | 'Farm'
  | 'Harbor'
  | 'Oasis'
  | 'Tower'
  | 'Paddock'
  | 'Barn'
  | 'Oracle'
  | 'Tavern';

const ALL_TERRAINS: Terrain[] = ['Grass', 'Forest', 'Desert', 'Flower', 'Canyon'];
const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

function hexKey(c: AxialCoord): string {
  return `${c.q},${c.r}`;
}

function neighbors(c: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map(d => ({ q: c.q + d.q, r: c.r + d.r }));
}

// ─── Board (server-side) ──────────────────────────────────────────────────────

interface ServerCell {
  q: number;
  r: number;
  terrain: Terrain;
  location?: Location;
  settlement?: number;
}

function createBoardForSize(
  size: 'small' | 'medium' | 'large'
): Map<string, ServerCell> {
  const radius = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  const terrains = [...ALL_TERRAINS];
  const cells = new Map<string, ServerCell>();

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const terrain = terrains[Math.floor(Math.random() * terrains.length)];
      cells.set(hexKey({ q, r }), { q, r, terrain });
    }
  }
  return cells;
}

function addLocations(
  cells: Map<string, ServerCell>,
  size: 'small' | 'medium' | 'large'
): void {
  const locations: Location[] = [
    'Castle', 'Farm', 'Harbor', 'Oasis', 'Tower',
    'Paddock', 'Barn', 'Oracle', 'Tavern',
  ];
  const keys = [...cells.keys()];
  const radius = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
  // Place locations at roughly regular intervals around the board
  const step = Math.floor(keys.length / locations.length);
  const offset = Math.floor(radius * 0.6);
  const positions: AxialCoord[] = [
    { q: offset, r: -offset }, { q: 0, r: -offset }, { q: -offset, r: 0 },
    { q: offset, r: 0 }, { q: 0, r: offset }, { q: -offset, r: offset },
    { q: offset / 2, r: -offset / 2 }, { q: -offset / 2, r: offset / 2 },
    { q: 0, r: 0 },
  ];

  locations.forEach((loc, i) => {
    // Find nearest cell to desired position
    const target = positions[i] ?? positions[0];
    let bestKey = keys[i * step];
    let bestDist = Infinity;
    for (const k of keys) {
      const cell = cells.get(k)!;
      if (cell.location || cell.settlement != null) continue;
      const dist =
        Math.abs(cell.q - target.q) +
        Math.abs(cell.r - target.r) +
        Math.abs(cell.q + cell.r - target.q - target.r);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = k;
      }
    }
    if (bestKey) {
      cells.get(bestKey)!.location = loc;
    }
  });
}

function serializeBoard(cells: Map<string, ServerCell>): SerializedCell[] {
  return [...cells.values()].map(c => ({
    q: c.q,
    r: c.r,
    terrain: c.terrain,
    location: c.location,
    settlement: c.settlement,
  }));
}

// ─── Terrain deck ─────────────────────────────────────────────────────────────

function createAndShuffleDeck(): Terrain[] {
  const deck: Terrain[] = [];
  for (const t of ALL_TERRAINS) {
    for (let i = 0; i < 10; i++) deck.push(t);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ─── Valid placements ─────────────────────────────────────────────────────────

function getValidPlacements(
  cells: Map<string, ServerCell>,
  terrain: Terrain,
  playerId: number
): AxialCoord[] {
  const valid: AxialCoord[] = [];
  const playerSettlements = [...cells.values()].filter(
    c => c.settlement === playerId
  );

  for (const cell of cells.values()) {
    if (cell.terrain !== terrain) continue;
    if (cell.settlement != null) continue;
    if (cell.location != null) continue;

    const key = hexKey(cell);
    const isAdjacentToOwn = playerSettlements.some(s =>
      neighbors(s).some(n => hexKey(n) === key)
    );

    if (playerSettlements.length === 0 || isAdjacentToOwn) {
      valid.push({ q: cell.q, r: cell.r });
    }
  }

  // If no adjacent placements, allow any matching terrain
  if (valid.length === 0) {
    for (const cell of cells.values()) {
      if (cell.terrain !== terrain) continue;
      if (cell.settlement != null) continue;
      if (cell.location != null) continue;
      valid.push({ q: cell.q, r: cell.r });
    }
  }

  return valid;
}

// ─── Objective cards (simplified) ────────────────────────────────────────────

const ALL_OBJECTIVES = [
  'Miners', 'Fishermen', 'Citizens', 'Knights', 'Farmers',
  'Merchants', 'Lords', 'Shepherds',
];

function selectObjectives(count: 1 | 2 | 3): string[] {
  const shuffled = [...ALL_OBJECTIVES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Room state ───────────────────────────────────────────────────────────────

interface InternalPlayer extends SerializedPlayer {
  wsId: string; // WebSocket connection ID
  isConnected: boolean;
  isReady: boolean;
}

interface RoomState {
  id: RoomId;
  hostId: PlayerId;
  players: Map<PlayerId, InternalPlayer>;
  status: 'waiting' | 'in_game' | 'finished';
  maxPlayers: number;
  options: GameRoomOptions;

  // Game state (set when game starts)
  board: Map<string, ServerCell> | null;
  deck: Terrain[];
  objectiveCards: string[];
  currentPlayerIndex: number;
  phase: string;
  currentTerrainCard: Terrain | null;
  remainingPlacements: number;
  acquiredLocations: string[];
  finalScores: { playerId: number; castleScore: number; totalScore: number }[];
  turnNumber: number;
  turnTimeoutHandle: ReturnType<typeof setTimeout> | null;
}

// ─── Room Manager ─────────────────────────────────────────────────────────────

export class RoomManager {
  private rooms = new Map<RoomId, RoomState>();

  // Map from WebSocket ID → PlayerId for routing
  private wsToPlayer = new Map<string, { roomId: RoomId; playerId: PlayerId }>();

  createRoom(
    wsId: string,
    playerName: string,
    options: Partial<GameRoomOptions>
  ): { roomId: RoomId; playerId: PlayerId; room: RoomInfo } {
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    const playerId = uuidv4();
    const resolvedOptions: GameRoomOptions = {
      boardSize: options.boardSize ?? 'large',
      objectiveCount: options.objectiveCount ?? 3,
      enableUndo: options.enableUndo ?? true,
      turnTimeoutSeconds: options.turnTimeoutSeconds ?? DEFAULT_TURN_TIMEOUT,
    };

    const player: InternalPlayer = {
      id: 1,
      name: playerName,
      color: PLAYER_COLORS[0],
      settlements: [],
      remainingSettlements: TOTAL_SETTLEMENTS,
      tiles: [],
      isBot: false,
      wsId,
      isConnected: true,
      isReady: false,
    };

    const room: RoomState = {
      id: roomId,
      hostId: playerId,
      players: new Map([[playerId, player]]),
      status: 'waiting',
      maxPlayers: 4,
      options: resolvedOptions,
      board: null,
      deck: [],
      objectiveCards: [],
      currentPlayerIndex: 0,
      phase: 'Setup',
      currentTerrainCard: null,
      remainingPlacements: 0,
      acquiredLocations: [],
      finalScores: [],
      turnNumber: 1,
      turnTimeoutHandle: null,
    };

    this.rooms.set(roomId, room);
    this.wsToPlayer.set(wsId, { roomId, playerId });
    return { roomId, playerId, room: this.toRoomInfo(room) };
  }

  joinRoom(
    wsId: string,
    roomId: RoomId,
    playerName: string
  ): { playerId: PlayerId; room: RoomInfo } | { error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'waiting') return { error: 'Game already started' };
    if (room.players.size >= room.maxPlayers)
      return { error: 'Room is full' };

    const playerId = uuidv4();
    const colorIndex = room.players.size;
    const player: InternalPlayer = {
      id: colorIndex + 1,
      name: playerName,
      color: PLAYER_COLORS[colorIndex] ?? '#CCCCCC',
      settlements: [],
      remainingSettlements: TOTAL_SETTLEMENTS,
      tiles: [],
      isBot: false,
      wsId,
      isConnected: true,
      isReady: false,
    };

    room.players.set(playerId, player);
    this.wsToPlayer.set(wsId, { roomId, playerId });
    return { playerId, room: this.toRoomInfo(room) };
  }

  rejoinRoom(
    wsId: string,
    roomId: RoomId,
    playerId: PlayerId
  ): { room: RoomInfo; gameState: SerializedGameState | null } | { error: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    const player = room.players.get(playerId);
    if (!player) return { error: 'Player not found in room' };

    // Update ws connection
    const oldWsId = player.wsId;
    if (oldWsId !== wsId) {
      this.wsToPlayer.delete(oldWsId);
    }
    player.wsId = wsId;
    player.isConnected = true;
    this.wsToPlayer.set(wsId, { roomId, playerId });

    const gameState = room.board ? this.buildGameState(room) : null;
    return { room: this.toRoomInfo(room), gameState };
  }

  startGame(
    playerId: PlayerId
  ): { room: RoomInfo; gameState: SerializedGameState } | { error: string } {
    const entry = this.findRoomByPlayer(playerId);
    if (!entry) return { error: 'Not in a room' };
    const { room } = entry;

    if (room.hostId !== playerId) return { error: 'Only the host can start' };
    if (room.players.size < 2) return { error: 'Need at least 2 players' };
    if (room.status !== 'waiting') return { error: 'Game already started' };

    room.status = 'in_game';
    room.board = createBoardForSize(room.options.boardSize);
    addLocations(room.board, room.options.boardSize);
    room.deck = createAndShuffleDeck();
    room.objectiveCards = selectObjectives(room.options.objectiveCount);
    room.currentPlayerIndex = 0;
    room.phase = 'DrawCard';
    room.currentTerrainCard = null;
    room.remainingPlacements = 0;
    room.turnNumber = 1;
    room.acquiredLocations = [];
    room.finalScores = [];

    // Reset player stats
    let i = 0;
    for (const p of room.players.values()) {
      p.settlements = [];
      p.remainingSettlements = TOTAL_SETTLEMENTS;
      p.tiles = [];
      p.color = PLAYER_COLORS[i] ?? '#CCCCCC';
      p.id = i + 1;
      i++;
    }

    const gameState = this.buildGameState(room);
    return { room: this.toRoomInfo(room), gameState };
  }

  applyAction(
    playerId: PlayerId,
    action: GameActionPayload
  ): { gameState: SerializedGameState; room: RoomInfo } | { error: string } {
    const entry = this.findRoomByPlayer(playerId);
    if (!entry) return { error: 'Not in a room' };
    const { room } = entry;

    if (room.status !== 'in_game') return { error: 'Game not in progress' };
    if (!room.board) return { error: 'No board' };

    const players = [...room.players.values()];
    const currentPlayer = players[room.currentPlayerIndex];
    if (!currentPlayer) return { error: 'Invalid player index' };

    // Validate it's this player's turn
    const playerEntry = room.players.get(playerId);
    if (!playerEntry) return { error: 'Player not found' };
    if (currentPlayer !== playerEntry)
      return { error: 'Not your turn' };

    // Apply action
    const result = this.processAction(room, action, currentPlayer);
    if (result.error) return { error: result.error };

    const gameState = this.buildGameState(room);
    return { gameState, room: this.toRoomInfo(room) };
  }

  handleDisconnect(wsId: string): {
    roomId: RoomId;
    playerId: PlayerId;
    room: RoomInfo;
  } | null {
    const entry = this.wsToPlayer.get(wsId);
    if (!entry) return null;
    const { roomId, playerId } = entry;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (player) player.isConnected = false;

    // Don't delete room yet – allow reconnect
    return { roomId, playerId, room: this.toRoomInfo(room) };
  }

  leaveRoom(wsId: string): { roomId: RoomId; playerId: PlayerId; room: RoomInfo } | null {
    const entry = this.wsToPlayer.get(wsId);
    if (!entry) return null;
    const { roomId, playerId } = entry;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players.delete(playerId);
    this.wsToPlayer.delete(wsId);

    // Reassign host if necessary
    if (room.hostId === playerId && room.players.size > 0) {
      room.hostId = room.players.keys().next().value as PlayerId;
    }
    if (room.players.size === 0) {
      if (room.turnTimeoutHandle) clearTimeout(room.turnTimeoutHandle);
      this.rooms.delete(roomId);
      return null;
    }

    return { roomId, playerId, room: this.toRoomInfo(room) };
  }

  getPlayerEntry(wsId: string): { roomId: RoomId; playerId: PlayerId } | undefined {
    return this.wsToPlayer.get(wsId);
  }

  getRoomPlayers(roomId: RoomId): InternalPlayer[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return [...room.players.values()];
  }

  getPlayerWsId(roomId: RoomId, playerId: PlayerId): string | undefined {
    const room = this.rooms.get(roomId);
    return room?.players.get(playerId)?.wsId;
  }

  skipTurn(roomId: RoomId): SerializedGameState | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'in_game') return null;
    const players = [...room.players.values()];
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % players.length;
    room.phase = 'DrawCard';
    room.currentTerrainCard = null;
    room.remainingPlacements = 0;
    room.turnNumber++;
    for (const p of players) {
      for (const t of p.tiles) t.usedThisTurn = false;
    }
    return this.buildGameState(room);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private findRoomByPlayer(playerId: PlayerId): { room: RoomState } | null {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) return { room };
    }
    return null;
  }

  private processAction(
    room: RoomState,
    action: GameActionPayload,
    currentPlayer: InternalPlayer
  ): { error?: string } {
    const board = room.board!;

    switch (action.type) {
      case 'DRAW_CARD': {
        if (room.phase !== 'DrawCard') return { error: 'Wrong phase' };
        if (room.deck.length === 0) {
          room.deck = createAndShuffleDeck();
        }
        const card = room.deck.shift()!;
        room.currentTerrainCard = card;
        room.phase = 'PlaceSettlements';
        room.remainingPlacements = SETTLEMENTS_PER_TURN;
        return {};
      }

      case 'PLACE_SETTLEMENT': {
        if (room.phase !== 'PlaceSettlements') return { error: 'Wrong phase' };
        if (!room.currentTerrainCard) return { error: 'No terrain card' };
        const { coord } = action;
        const cell = board.get(hexKey(coord));
        if (!cell) return { error: 'Cell not found' };
        if (cell.terrain !== room.currentTerrainCard)
          return { error: 'Wrong terrain' };
        if (cell.settlement != null) return { error: 'Cell occupied' };
        if (cell.location != null) return { error: 'Cannot place on location' };

        const valid = getValidPlacements(board, room.currentTerrainCard, currentPlayer.id);
        if (!valid.some(v => v.q === coord.q && v.r === coord.r))
          return { error: 'Invalid placement' };

        cell.settlement = currentPlayer.id;
        currentPlayer.settlements.push(coord);
        currentPlayer.remainingSettlements--;

        // Check for location acquisition
        this.checkLocationAcquisition(board, coord, currentPlayer, room);

        room.remainingPlacements--;
        if (room.remainingPlacements === 0) {
          room.phase = 'EndTurn';
        }
        return {};
      }

      case 'END_TURN': {
        if (room.phase !== 'EndTurn') return { error: 'Wrong phase' };
        const players = [...room.players.values()];

        // Reset tile usage
        for (const p of players) {
          for (const t of p.tiles) t.usedThisTurn = false;
        }

        const nextIdx = (room.currentPlayerIndex + 1) % players.length;

        // Check game over
        if (players.some(p => p.remainingSettlements === 0)) {
          room.phase = 'GameOver';
          room.finalScores = players.map(p => ({
            playerId: p.id,
            castleScore: 0, // simplified
            totalScore: TOTAL_SETTLEMENTS - p.remainingSettlements,
          }));
        } else {
          room.currentPlayerIndex = nextIdx;
          room.phase = 'DrawCard';
          room.currentTerrainCard = null;
          room.remainingPlacements = 0;
          room.turnNumber++;
        }
        return {};
      }

      case 'UNDO':
        // Undo is not validated server-side in this implementation
        return {};

      default:
        return {};
    }
  }

  private checkLocationAcquisition(
    board: Map<string, ServerCell>,
    coord: AxialCoord,
    player: InternalPlayer,
    room: RoomState
  ): void {
    for (const n of neighbors(coord)) {
      const nKey = hexKey(n);
      const cell = board.get(nKey);
      if (!cell?.location || cell.location === 'Castle') continue;
      if (room.acquiredLocations.includes(nKey)) continue;
      room.acquiredLocations.push(nKey);
      player.tiles.push({ location: cell.location, usedThisTurn: false });
    }
  }

  private buildGameState(room: RoomState): SerializedGameState {
    const players: SerializedPlayer[] = [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      settlements: p.settlements,
      remainingSettlements: p.remainingSettlements,
      tiles: p.tiles,
      isBot: false,
    }));

    return {
      board: room.board ? serializeBoard(room.board) : [],
      players,
      currentPlayerIndex: room.currentPlayerIndex,
      phase: room.phase,
      currentTerrainCard: room.currentTerrainCard
        ? { terrain: room.currentTerrainCard }
        : null,
      remainingPlacements: room.remainingPlacements,
      objectiveCards: room.objectiveCards,
      finalScores: room.finalScores,
      turnNumber: room.turnNumber,
      acquiredLocations: room.acquiredLocations,
    };
  }

  private toRoomInfo(room: RoomState): RoomInfo {
    const players: RoomPlayer[] = [...room.players.entries()].map(
      ([id, p]) => ({
        id,
        name: p.name,
        color: p.color,
        isReady: p.isReady,
        isConnected: p.isConnected,
      })
    );
    return {
      id: room.id,
      hostId: room.hostId,
      players,
      status: room.status,
      maxPlayers: room.maxPlayers,
      options: room.options,
    };
  }
}

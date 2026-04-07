import { create } from 'zustand';
import type { GameAction, GameState, Cell, Terrain, HexCoord } from '../types';

interface UndoSnapshot {
  board: Cell[];
  players: GameState['players'];
  placementsThisTurn: number;
  history: GameAction[];
}

interface GameStore extends GameState {
  undoSnapshot: UndoSnapshot | null;
  placeSettlement: (hex: HexCoord) => void;
  acquireTile: (hex: HexCoord, tile: string) => void;
  drawCard: () => void;
  endTurn: () => void;
  undoLastAction: () => void;
  startGame: (playerCount: number) => void;
  resetGame: () => void;
}

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
const PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const TERRAIN_CARDS: Terrain[] = ['grass', 'forest', 'desert', 'flower', 'canyon'];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createInitialBoard(): Cell[] {
  const cells: Cell[] = [];
  for (let q = -4; q <= 4; q++) {
    for (let r = -4; r <= 4; r++) {
      if (Math.abs(q + r) <= 4) {
        const terrainIndex = Math.abs(q * 3 + r * 7) % TERRAIN_CARDS.length;
        cells.push({ q, r, terrain: TERRAIN_CARDS[terrainIndex] });
      }
    }
  }
  return cells;
}

const INITIAL_SETTLEMENTS = 40;

function createPlayers(count: number): GameState['players'] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: PLAYER_NAMES[i],
    color: PLAYER_COLORS[i],
    settlements: INITIAL_SETTLEMENTS,
    locationTiles: [],
    undoUsedThisTurn: false,
  }));
}

type InitialState = Omit<
  GameStore,
  'placeSettlement' | 'acquireTile' | 'drawCard' | 'endTurn' | 'undoLastAction' | 'startGame' | 'resetGame'
>;

const buildInitialState = (): InitialState => ({
  board: createInitialBoard(),
  players: createPlayers(2),
  currentPlayerIndex: 0,
  currentTurn: 1,
  currentCard: null,
  placementsThisTurn: 0,
  maxPlacementsPerTurn: 3,
  history: [],
  canUndo: false,
  phase: 'setup',
  undoSnapshot: null,
});

export { INITIAL_SETTLEMENTS };

export const useGameStore = create<GameStore>((set, get) => ({
  ...buildInitialState(),

  startGame: (playerCount: number) => {
    set({
      board: createInitialBoard(),
      players: createPlayers(playerCount),
      currentPlayerIndex: 0,
      currentTurn: 1,
      currentCard: TERRAIN_CARDS[Math.floor(Math.random() * TERRAIN_CARDS.length)],
      placementsThisTurn: 0,
      maxPlacementsPerTurn: 3,
      history: [],
      canUndo: false,
      phase: 'playing',
      undoSnapshot: null,
    });
  },

  resetGame: () => {
    set(buildInitialState());
  },

  drawCard: () => {
    const card = TERRAIN_CARDS[Math.floor(Math.random() * TERRAIN_CARDS.length)];
    const { currentPlayerIndex, currentTurn } = get();
    const action: GameAction = {
      id: generateId(),
      type: 'DRAW_CARD',
      playerId: currentPlayerIndex,
      turnNumber: currentTurn,
      timestamp: Date.now(),
    };
    set(state => ({
      currentCard: card,
      history: [...state.history, action],
    }));
  },

  placeSettlement: (hex: HexCoord) => {
    const state = get();
    const { board, currentPlayerIndex, currentTurn, placementsThisTurn, maxPlacementsPerTurn, players } = state;

    const cell = board.find(c => c.q === hex.q && c.r === hex.r);
    if (!cell || cell.owner !== undefined) return;
    if (placementsThisTurn >= maxPlacementsPerTurn) return;
    if (state.phase !== 'playing') return;

    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.settlements <= 0) return;

    // Save snapshot only before the first placement so undo always reverts the whole turn
    const snapshot: UndoSnapshot | null = placementsThisTurn === 0
      ? {
          board: board.map(c => ({ ...c })),
          players: players.map(p => ({ ...p })),
          placementsThisTurn,
          history: [...state.history],
        }
      : state.undoSnapshot;

    const action: GameAction = {
      id: generateId(),
      type: 'PLACE_SETTLEMENT',
      playerId: currentPlayerIndex,
      hex,
      turnNumber: currentTurn,
      timestamp: Date.now(),
    };

    const newBoard = board.map(c =>
      c.q === hex.q && c.r === hex.r ? { ...c, owner: currentPlayerIndex } : c
    );
    const newPlayers = players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, settlements: p.settlements - 1 } : p
    );

    set({
      board: newBoard,
      players: newPlayers,
      placementsThisTurn: placementsThisTurn + 1,
      history: [...state.history, action],
      canUndo: !currentPlayer.undoUsedThisTurn,
      undoSnapshot: snapshot,
    });
  },

  acquireTile: (hex: HexCoord, tile: string) => {
    const state = get();
    const { currentPlayerIndex, currentTurn, players } = state;

    const action: GameAction = {
      id: generateId(),
      type: 'ACQUIRE_TILE',
      playerId: currentPlayerIndex,
      hex,
      tile,
      turnNumber: currentTurn,
      timestamp: Date.now(),
    };

    const newPlayers = players.map((p, i) =>
      i === currentPlayerIndex
        ? { ...p, locationTiles: [...p.locationTiles, tile] }
        : p
    );

    set({
      players: newPlayers,
      history: [...state.history, action],
    });
  },

  undoLastAction: () => {
    const state = get();
    const { undoSnapshot, players, currentPlayerIndex } = state;

    if (!state.canUndo || !undoSnapshot) return;

    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.undoUsedThisTurn) return;

    // Restore snapshot state, mark undo as used for current player
    const newPlayers = undoSnapshot.players.map((p, i) =>
      i === currentPlayerIndex ? { ...p, undoUsedThisTurn: true } : p
    );

    set({
      board: undoSnapshot.board,
      players: newPlayers,
      placementsThisTurn: undoSnapshot.placementsThisTurn,
      history: undoSnapshot.history,
      canUndo: false,
      undoSnapshot: null,
    });
  },

  endTurn: () => {
    const state = get();
    const { currentPlayerIndex, players, currentTurn } = state;

    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextTurn = nextPlayerIndex === 0 ? currentTurn + 1 : currentTurn;

    const action: GameAction = {
      id: generateId(),
      type: 'END_TURN',
      playerId: currentPlayerIndex,
      turnNumber: currentTurn,
      timestamp: Date.now(),
    };

    // Reset undo flag for the next player
    const newPlayers = players.map((p, i) =>
      i === nextPlayerIndex ? { ...p, undoUsedThisTurn: false } : p
    );

    set({
      currentPlayerIndex: nextPlayerIndex,
      currentTurn: nextTurn,
      placementsThisTurn: 0,
      canUndo: false,
      undoSnapshot: null,
      currentCard: TERRAIN_CARDS[Math.floor(Math.random() * TERRAIN_CARDS.length)],
      players: newPlayers,
      history: [...state.history, action],
    });
  },
}));

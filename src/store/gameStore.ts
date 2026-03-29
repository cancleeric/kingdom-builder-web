import { create } from 'zustand';
import type { GameState, Player, Terrain, ScoringCard, HexCoord } from '../types/game';
import { saveGame, loadGame, clearSave } from '../utils/saveGame';

// Default initial state for a new 2-player game
function createInitialState(): GameState {
  const players: Player[] = [
    { id: 0, name: 'Player 1', housesRemaining: 40, locationTiles: [], score: 0 },
    { id: 1, name: 'Player 2', housesRemaining: 40, locationTiles: [], score: 0 },
  ];

  return {
    board: [],
    players,
    currentPlayerId: 0,
    turn: 1,
    currentTerrainCard: null,
    housesPlacedThisTurn: 0,
    scoringCards: [],
    phase: 'setup',
  };
}

export interface GameStore {
  gameState: GameState;
  hasSave: boolean;

  /** Start a brand-new game, clearing any existing save */
  newGame: (playerNames?: string[], scoringCards?: ScoringCard[]) => void;

  /** Restore state from localStorage */
  continueGame: () => boolean;

  /** Place a house on the board at the given hex coord */
  placeHouse: (coord: HexCoord) => void;

  /** Draw the terrain card for the current turn */
  drawTerrainCard: (terrain: Terrain) => void;

  /** Advance to the next player's turn */
  endTurn: () => void;

  /** Manually trigger a save */
  saveNow: () => void;

  /** Clear the save and show only "new game" option */
  clearSaveData: () => void;

  /** Update hasSave flag (called on mount) */
  checkForSave: () => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: createInitialState(),
  hasSave: false,

  checkForSave: () => {
    const raw =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('kingdom-builder-save')
        : null;
    set({ hasSave: raw !== null });
  },

  newGame: (playerNames, scoringCards) => {
    clearSave();
    const base = createInitialState();
    if (playerNames && playerNames.length > 0) {
      base.players = playerNames.map((name, i) => ({
        id: i,
        name,
        housesRemaining: 40,
        locationTiles: [],
        score: 0,
      }));
      base.currentPlayerId = 0;
    }
    if (scoringCards) {
      base.scoringCards = scoringCards;
    }
    base.phase = 'playing';
    set({ gameState: base, hasSave: false });
    saveGame(base);
    set({ hasSave: true });
  },

  continueGame: () => {
    const saved = loadGame();
    if (!saved) {
      set({ hasSave: false });
      return false;
    }
    set({ gameState: saved, hasSave: true });
    return true;
  },

  placeHouse: (coord) => {
    const { gameState } = get();
    const updatedBoard = gameState.board.map((cell) => {
      if (cell.coord.q === coord.q && cell.coord.r === coord.r) {
        return { ...cell, hasHouse: true, playerId: gameState.currentPlayerId };
      }
      return cell;
    });
    const updatedPlayers = gameState.players.map((p) => {
      if (p.id === gameState.currentPlayerId) {
        return { ...p, housesRemaining: p.housesRemaining - 1 };
      }
      return p;
    });
    const newState: GameState = {
      ...gameState,
      board: updatedBoard,
      players: updatedPlayers,
      housesPlacedThisTurn: gameState.housesPlacedThisTurn + 1,
    };
    set({ gameState: newState });
    saveGame(newState);
  },

  drawTerrainCard: (terrain) => {
    const { gameState } = get();
    const newState: GameState = {
      ...gameState,
      currentTerrainCard: terrain,
      housesPlacedThisTurn: 0,
    };
    set({ gameState: newState });
    saveGame(newState);
  },

  endTurn: () => {
    const { gameState } = get();
    const nextPlayerId =
      (gameState.currentPlayerId + 1) % gameState.players.length;
    const nextTurn =
      nextPlayerId === 0 ? gameState.turn + 1 : gameState.turn;
    const newState: GameState = {
      ...gameState,
      currentPlayerId: nextPlayerId,
      turn: nextTurn,
      currentTerrainCard: null,
      housesPlacedThisTurn: 0,
    };
    set({ gameState: newState });
    saveGame(newState);
  },

  saveNow: () => {
    const { gameState } = get();
    saveGame(gameState);
    set({ hasSave: true });
  },

  clearSaveData: () => {
    clearSave();
    set({ hasSave: false });
  },
}));

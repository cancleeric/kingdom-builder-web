import { create } from 'zustand';
import type { GameState, Player, PlayerType, ObjectiveType } from '../types';
import {
  buildStandardBoard,
  buildTerrainDeck,
  shuffleDeck,
  drawTerrain,
  applyPlacement,
  advanceTurn,
  isValidPlacement,
} from '../core/board';
import { calculateScore } from '../core/scoring';
import { executeBotTurn, playerTypeToDifficulty } from '../ai/botPlayer';

// Default objectives for a game
const ALL_OBJECTIVES: ObjectiveType[] = [
  'fisherman', 'miner', 'knight', 'lords', 'farmers',
  'hermits', 'merchants', 'discoverers', 'builders', 'shepherds',
];

// Player colors
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

function pickRandomObjectives(count: number = 3): ObjectiveType[] {
  const shuffled = shuffleDeck([...ALL_OBJECTIVES]);
  return shuffled.slice(0, count);
}

interface GameStore extends GameState {
  // Actions
  startGame: (playerTypes: PlayerType[], seed?: number) => void;
  drawCard: () => void;
  placeSettlement: (hex: { q: number; r: number }) => void;
  endTurn: () => void;
  resetGame: () => void;
  // Bot turn trigger (called internally)
  triggerBotTurn: () => void;
}

const initialState: GameState = {
  phase: 'setup',
  cells: [],
  players: [],
  currentPlayer: 0,
  currentTerrain: null,
  placementsThisTurn: 0,
  placementsRequired: 3,
  objectives: [],
  turnHistory: [],
  terrainDeck: [],
};

const DIFFICULTY_LABELS: Record<string, string> = {
  'bot-easy': 'Easy',
  'bot-normal': 'Normal',
  'bot-hard': 'Hard',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: (playerTypes: PlayerType[], seed?: number) => {
    const players: Player[] = playerTypes.map((type, i) => ({
      id: i,
      name: type === 'human'
        ? `Player ${i + 1}`
        : `Bot ${i + 1} (${DIFFICULTY_LABELS[type] ?? type})`,
      type,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0,
      locationTiles: [],
    }));

    const deck = shuffleDeck(buildTerrainDeck());
    const cells = buildStandardBoard(seed);
    const objectives = pickRandomObjectives(3);

    set({
      phase: 'playing',
      cells,
      players,
      currentPlayer: 0,
      currentTerrain: null,
      placementsThisTurn: 0,
      placementsRequired: 3,
      objectives,
      turnHistory: [],
      terrainDeck: deck,
    });
  },

  drawCard: () => {
    const state = get();
    if (state.phase !== 'playing') return;
    if (state.currentTerrain !== null) return; // already drawn

    const newState = drawTerrain(state);
    set({ currentTerrain: newState.currentTerrain, terrainDeck: newState.terrainDeck });

    // If current player is a bot, trigger bot turn after a short delay
    const currentPlayer = state.players[state.currentPlayer];
    if (currentPlayer.type !== 'human') {
      setTimeout(() => get().triggerBotTurn(), 800);
    }
  },

  placeSettlement: (hex: { q: number; r: number }) => {
    const state = get();
    if (state.phase !== 'playing') return;
    if (state.currentTerrain === null) return;
    if (state.placementsThisTurn >= state.placementsRequired) return;

    const currentPlayer = state.players[state.currentPlayer];
    if (currentPlayer.type !== 'human') return; // bots use triggerBotTurn

    if (!isValidPlacement(state, hex)) return;

    const newState = applyPlacement(state, hex);

    // Update scores
    const updatedPlayers = newState.players.map((p) => ({
      ...p,
      score: calculateScore(newState, p.id),
    }));

    set({
      cells: newState.cells,
      players: updatedPlayers,
      placementsThisTurn: newState.placementsThisTurn,
    });

    // Auto-advance if all placements done
    if (newState.placementsThisTurn >= state.placementsRequired) {
      setTimeout(() => get().endTurn(), 300);
    }
  },

  endTurn: () => {
    const state = get();
    if (state.phase !== 'playing') return;

    // Check if game is over (no empty buildable cells)
    const hasEmpty = state.cells.some(
      (c) => c.owner === null && c.terrain !== 'mountain' && c.terrain !== 'water'
    );
    if (!hasEmpty) {
      // Game over: update final scores
      const updatedPlayers = state.players.map((p) => ({
        ...p,
        score: calculateScore(state, p.id),
      }));
      set({ phase: 'finished', players: updatedPlayers });
      return;
    }

    const nextState = advanceTurn(state);
    set({
      currentPlayer: nextState.currentPlayer,
      placementsThisTurn: 0,
      currentTerrain: null,
    });

    // If next player is a bot, auto-draw card after delay
    const nextPlayer = state.players[nextState.currentPlayer];
    if (nextPlayer.type !== 'human') {
      setTimeout(() => get().drawCard(), 500);
    }
  },

  triggerBotTurn: () => {
    const state = get();
    if (state.phase !== 'playing') return;
    if (state.currentTerrain === null) return;

    const currentPlayer = state.players[state.currentPlayer];
    const difficulty = playerTypeToDifficulty(currentPlayer.type);
    if (!difficulty) return;

    const newState = executeBotTurn(state, difficulty);

    // Update scores
    const updatedPlayers = newState.players.map((p) => ({
      ...p,
      score: calculateScore(newState, p.id),
    }));

    set({
      cells: newState.cells,
      players: updatedPlayers,
      placementsThisTurn: newState.placementsThisTurn,
    });

    // End bot turn after placements
    setTimeout(() => get().endTurn(), 600);
  },

  resetGame: () => {
    set(initialState);
  },
}));

// Selector helpers
export const selectCurrentPlayer = (state: GameStore) =>
  state.players[state.currentPlayer];

export const selectIsCurrentPlayerBot = (state: GameStore) =>
  state.players[state.currentPlayer]?.type !== 'human';

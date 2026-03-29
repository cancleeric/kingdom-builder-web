import { create } from 'zustand';
import type { GameState, HexCoord } from '../types';
import type { PlayerConfig } from '../types/setup';
import { createBoard } from '../core/board';
import { isValidMove, applyMove } from '../core/rules';
import { PLACEABLE_TERRAINS } from '../core/terrain';

export function createInitialState(players: PlayerConfig[]): GameState {
  const playerCount = players.length as 2 | 3 | 4;
  return {
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      settlements: 40,
      score: 0,
      locationTokens: [],
    })),
    playerCount,
    currentPlayerIndex: 0,
    board: createBoard(),
    currentTerrain: PLACEABLE_TERRAINS[Math.floor(Math.random() * PLACEABLE_TERRAINS.length)],
    placementsLeft: 3,
    phase: 'playing',
    turnNumber: 1,
  };
}

interface GameStore {
  gameState: GameState | null;
  screen: 'setup' | 'game';
  startGame: (players: PlayerConfig[]) => void;
  returnToSetup: () => void;
  placeSettlement: (coord: HexCoord) => void;
  drawTerrain: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  screen: 'setup',

  startGame: (players: PlayerConfig[]) => {
    const state = createInitialState(players);
    set({ gameState: state, screen: 'game' });
  },

  returnToSetup: () => {
    set({ screen: 'setup', gameState: null });
  },

  placeSettlement: (coord: HexCoord) => {
    const { gameState } = get();
    if (!gameState) return;
    if (!isValidMove(gameState, coord)) return;
    const newState = applyMove(gameState, coord);
    set({ gameState: newState });
  },

  drawTerrain: () => {
    const { gameState } = get();
    if (!gameState) return;
    const terrain = PLACEABLE_TERRAINS[Math.floor(Math.random() * PLACEABLE_TERRAINS.length)];
    set({
      gameState: {
        ...gameState,
        currentTerrain: terrain,
        placementsLeft: 3,
      },
    });
  },
}));

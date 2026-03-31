import { create } from 'zustand';
import { GameState, TerrainType, Player, ScoringCardType } from '../types';
import { createRandomBoard } from '../core/quadrants';
import { findValidPlacements } from '../core/rules';
import { TERRAIN_CARD_TYPES } from '../core/terrain';

function createInitialPlayers(): Player[] {
  return [
    { id: 1, name: 'Player 1', houses: 40, score: 0, locationTiles: [] },
    { id: 2, name: 'Player 2', houses: 40, score: 0, locationTiles: [] },
  ];
}

function drawRandomTerrain(): TerrainType {
  return TERRAIN_CARD_TYPES[Math.floor(Math.random() * TERRAIN_CARD_TYPES.length)];
}

const initialScoringCards: ScoringCardType[] = ['lords', 'merchants', 'citizens'];

interface GameStore extends GameState {
  drawCard: () => void;
  placeHouse: (row: number, col: number) => void;
  endTurn: () => void;
  validPlacements: { row: number; col: number }[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: createRandomBoard(),
  players: createInitialPlayers(),
  currentPlayer: 1,
  currentTerrain: null,
  placementsLeft: 3,
  phase: 'draw',
  winner: null,
  scoringCards: initialScoringCards,
  validPlacements: [],

  drawCard: () => {
    const { phase, board, players, currentPlayer } = get();
    if (phase !== 'draw') return;
    const terrain = drawRandomTerrain();
    const player = players.find(p => p.id === currentPlayer)!;
    const valid = findValidPlacements(board, terrain, player);
    set({ currentTerrain: terrain, phase: 'place', placementsLeft: 3, validPlacements: valid });
  },

  placeHouse: (row: number, col: number) => {
    const { board, players, currentPlayer, currentTerrain, placementsLeft, phase } = get();
    if (phase !== 'place' || !currentTerrain || placementsLeft <= 0) return;
    const valid = get().validPlacements;
    const isValid = valid.some(v => v.row === row && v.col === col);
    if (!isValid) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].hasHouse = true;
    newBoard[row][col].playerId = currentPlayer;

    const newPlayers = players.map(p =>
      p.id === currentPlayer ? { ...p, houses: p.houses - 1 } : p
    );

    const newLeft = placementsLeft - 1;
    const updatedPlayer = newPlayers.find(p => p.id === currentPlayer)!;
    const newValid = newLeft > 0 ? findValidPlacements(newBoard, currentTerrain, updatedPlayer) : [];

    const newPhase = newLeft <= 0 || newValid.length === 0 ? 'draw' : 'place';

    set({ board: newBoard, players: newPlayers, placementsLeft: newLeft, phase: newPhase, validPlacements: newValid });
  },

  endTurn: () => {
    const { players, currentPlayer } = get();
    const nextPlayer = currentPlayer === players.length ? 1 : currentPlayer + 1;
    set({ currentPlayer: nextPlayer, phase: 'draw', currentTerrain: null, placementsLeft: 3, validPlacements: [] });
  },
}));

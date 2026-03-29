import { create } from 'zustand';
import type { GameState, HexCell, HexCoord, Terrain } from '../types';
import {
  generateDemoBoard,
  isBuildable,
  hexNeighbors,
  hexKey,
  BUILDABLE_TERRAINS,
} from '../core/hex';

interface GameStore extends GameState {
  initGame: () => void;
  placeSettlement: (coord: HexCoord) => void;
  drawTerrain: () => void;
  highlightValidCells: (terrain: Terrain) => void;
}

const INITIAL_PLAYERS = [
  { id: 1, name: 'Player 1', color: '#e53935', settlements: 40 },
  { id: 2, name: 'Player 2', color: '#1e88e5', settlements: 40 },
];

function pickRandomTerrain(): Terrain {
  const idx = Math.floor(Math.random() * BUILDABLE_TERRAINS.length);
  return BUILDABLE_TERRAINS[idx];
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: [],
  currentPlayer: INITIAL_PLAYERS[0],
  players: INITIAL_PLAYERS,
  currentTerrain: null,
  placementsLeft: 3,
  phase: 'draw',
  turn: 1,

  initGame: () => {
    set({
      board: generateDemoBoard(),
      currentPlayer: INITIAL_PLAYERS[0],
      players: INITIAL_PLAYERS,
      currentTerrain: null,
      placementsLeft: 3,
      phase: 'draw',
      turn: 1,
    });
  },

  drawTerrain: () => {
    const terrain = pickRandomTerrain();
    const { board } = get();

    // Highlight valid cells
    const updatedBoard = board.map((cell) => ({
      ...cell,
      isHighlighted: cell.terrain === terrain && isBuildable(cell.terrain) && !cell.hasSettlement,
    }));

    set({ currentTerrain: terrain, placementsLeft: 3, phase: 'place', board: updatedBoard });
  },

  highlightValidCells: (terrain: Terrain) => {
    const { board } = get();

    // Check if current player has adjacent settlements
    const { currentPlayer } = get();
    const playerCells = board.filter(
      (c) => c.hasSettlement && c.settlementColor === currentPlayer.color
    );

    let hasAdjacentRequirement = playerCells.length > 0;
    const adjacentToPlayer = new Set<string>();

    if (hasAdjacentRequirement) {
      for (const cell of playerCells) {
        for (const nb of hexNeighbors(cell.coord)) {
          adjacentToPlayer.add(hexKey(nb));
        }
      }
    }

    const updatedBoard = board.map((cell) => {
      if (cell.terrain !== terrain || !isBuildable(cell.terrain) || cell.hasSettlement) {
        return { ...cell, isHighlighted: false };
      }
      if (hasAdjacentRequirement && adjacentToPlayer.size > 0) {
        return { ...cell, isHighlighted: adjacentToPlayer.has(hexKey(cell.coord)) };
      }
      return { ...cell, isHighlighted: true };
    });

    // If no adjacent cells are valid, allow any cell of that terrain
    const anyHighlighted = updatedBoard.some((c) => c.isHighlighted);
    if (!anyHighlighted) {
      hasAdjacentRequirement = false;
      const fallback = updatedBoard.map((cell) => ({
        ...cell,
        isHighlighted: cell.terrain === terrain && isBuildable(cell.terrain) && !cell.hasSettlement,
      }));
      set({ board: fallback });
    } else {
      set({ board: updatedBoard });
    }
  },

  placeSettlement: (coord: HexCoord) => {
    const { board, currentTerrain, placementsLeft, currentPlayer, players, turn, phase } = get();
    if (phase !== 'place' || placementsLeft <= 0 || !currentTerrain) return;

    const key = hexKey(coord);
    const cell = board.find((c) => hexKey(c.coord) === key);
    if (!cell || !cell.isHighlighted) return;

    const updatedBoard: HexCell[] = board.map((c) =>
      hexKey(c.coord) === key
        ? { ...c, hasSettlement: true, settlementColor: currentPlayer.color }
        : c
    );

    const newPlacementsLeft = placementsLeft - 1;

    if (newPlacementsLeft === 0) {
      // End of placement — next player's turn
      const currentIdx = players.findIndex((p) => p.id === currentPlayer.id);
      const nextPlayer = players[(currentIdx + 1) % players.length];
      const clearedBoard = updatedBoard.map((c) => ({ ...c, isHighlighted: false }));

      set({
        board: clearedBoard,
        placementsLeft: 0,
        phase: 'draw',
        currentPlayer: nextPlayer,
        turn: currentIdx === players.length - 1 ? turn + 1 : turn,
      });
    } else {
      // Re-highlight valid cells for next placement
      const existingSettlements = updatedBoard.filter(
        (c) => c.hasSettlement && c.settlementColor === currentPlayer.color
      );

      const adjacentToPlayer = new Set<string>();
      for (const s of existingSettlements) {
        for (const nb of hexNeighbors(s.coord)) {
          adjacentToPlayer.add(hexKey(nb));
        }
      }

      const reHighlighted = updatedBoard.map((c) => {
        if (c.terrain !== currentTerrain || !isBuildable(c.terrain) || c.hasSettlement) {
          return { ...c, isHighlighted: false };
        }
        if (adjacentToPlayer.size > 0) {
          return { ...c, isHighlighted: adjacentToPlayer.has(hexKey(c.coord)) };
        }
        return { ...c, isHighlighted: true };
      });

      const anyHighlighted = reHighlighted.some((c) => c.isHighlighted);
      const finalBoard = anyHighlighted
        ? reHighlighted
        : updatedBoard.map((c) => ({
            ...c,
            isHighlighted: c.terrain === currentTerrain && isBuildable(c.terrain) && !c.hasSettlement,
          }));

      set({ board: finalBoard, placementsLeft: newPlacementsLeft });
    }

    // Update player's settlement count
    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, settlements: p.settlements - 1 } : p
    );
    set({ players: updatedPlayers, currentPlayer: updatedPlayers.find((p) => p.id === currentPlayer.id) ?? currentPlayer });
  },
}));

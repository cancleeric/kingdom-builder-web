import { create } from 'zustand';
import { Board, createDefaultBoard } from '../core/board';
import { TerrainCard, createTerrainDeck, shuffleDeck, drawCard, Location } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import { Player, GamePhase } from '../types';
import { AxialCoord, hexNeighbors } from '../core/hex';

interface GameState {
  // Board state
  board: Board;
  
  // Player state
  players: Player[];
  currentPlayerIndex: number;
  
  // Turn state
  phase: GamePhase;
  currentTerrainCard: TerrainCard | null;
  remainingPlacements: number;
  
  // Deck state
  deck: TerrainCard[];
  
  // UI state
  selectedCell: AxialCoord | null;
  validPlacements: AxialCoord[];

  // Animation state — tracks last placed settlement for drop animation
  lastPlacedCoord: AxialCoord | null;

  // Location tile state — acquired by placing adjacent to location hexes
  acquiredLocations: Location[];
  newlyAcquiredLocationIndex: number | null;
  
  // Actions
  initGame: (playerCount: number) => void;
  drawTerrainCard: () => void;
  placeSettlement: (coord: AxialCoord) => void;
  endTurn: () => void;
  selectCell: (coord: AxialCoord | null) => void;
  clearLastPlaced: () => void;
}

const SETTLEMENTS_PER_TURN = 3;
const TOTAL_SETTLEMENTS_PER_PLAYER = 40;

const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
];

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  board: createDefaultBoard(),
  players: [],
  currentPlayerIndex: 0,
  phase: GamePhase.Setup,
  currentTerrainCard: null,
  remainingPlacements: 0,
  deck: [],
  selectedCell: null,
  validPlacements: [],
  lastPlacedCoord: null,
  acquiredLocations: [],
  newlyAcquiredLocationIndex: null,

  // Initialize game with specified number of players
  initGame: (playerCount: number) => {
    if (playerCount < 2 || playerCount > 4) {
      console.error('Player count must be between 2 and 4');
      return;
    }

    const players: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      players.push({
        id: i + 1,
        name: `Player ${i + 1}`,
        color: PLAYER_COLORS[i],
        settlements: [],
        remainingSettlements: TOTAL_SETTLEMENTS_PER_PLAYER,
      });
    }

    const deck = shuffleDeck(createTerrainDeck());
    const board = createDefaultBoard();

    set({
      board,
      players,
      currentPlayerIndex: 0,
      phase: GamePhase.DrawCard,
      currentTerrainCard: null,
      remainingPlacements: 0,
      deck,
      selectedCell: null,
      validPlacements: [],
      lastPlacedCoord: null,
      acquiredLocations: [],
      newlyAcquiredLocationIndex: null,
    });
  },

  // Draw a terrain card for the current turn
  drawTerrainCard: () => {
    const state = get();
    
    if (state.phase !== GamePhase.DrawCard) {
      console.error('Cannot draw card in current phase');
      return;
    }

    const { card, remainingDeck } = drawCard(state.deck);
    
    if (!card) {
      // Deck is empty, reshuffle
      const newDeck = shuffleDeck(createTerrainDeck());
      const { card: newCard, remainingDeck: newRemainingDeck } = drawCard(newDeck);
      
      set({
        currentTerrainCard: newCard,
        deck: newRemainingDeck,
        phase: GamePhase.PlaceSettlements,
        remainingPlacements: SETTLEMENTS_PER_TURN,
        validPlacements: newCard ? getValidPlacements(
          state.board,
          newCard.terrain,
          state.players[state.currentPlayerIndex].id
        ) : [],
      });
    } else {
      set({
        currentTerrainCard: card,
        deck: remainingDeck,
        phase: GamePhase.PlaceSettlements,
        remainingPlacements: SETTLEMENTS_PER_TURN,
        validPlacements: getValidPlacements(
          state.board,
          card.terrain,
          state.players[state.currentPlayerIndex].id
        ),
      });
    }
  },

  // Place a settlement at the specified coordinate
  placeSettlement: (coord: AxialCoord) => {
    const state = get();
    
    if (state.phase !== GamePhase.PlaceSettlements) {
      console.error('Cannot place settlement in current phase');
      return;
    }

    if (!state.currentTerrainCard) {
      console.error('No terrain card drawn');
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Validate placement
    const isValid = state.validPlacements.some(
      valid => valid.q === coord.q && valid.r === coord.r
    );
    
    if (!isValid) {
      console.error('Invalid placement position');
      return;
    }

    // Place the settlement
    const success = state.board.placeSettlement(coord, currentPlayer.id);
    
    if (!success) {
      console.error('Failed to place settlement');
      return;
    }

    // Update player settlements
    currentPlayer.settlements.push(coord);
    currentPlayer.remainingSettlements--;

    // Check if placement is adjacent to any location hex (for tile acquisition)
    const neighbors = hexNeighbors(coord);
    let newlyAcquiredLocationIndex: number | null = null;
    const updatedLocations = [...state.acquiredLocations];
    for (const neighbor of neighbors) {
      const cell = state.board.getCell(neighbor);
      if (cell?.location && !updatedLocations.includes(cell.location as Location)) {
        updatedLocations.push(cell.location as Location);
        newlyAcquiredLocationIndex = updatedLocations.length - 1;
        break; // acquire at most one tile per placement
      }
    }

    const newRemainingPlacements = state.remainingPlacements - 1;

    // Schedule clearing the last-placed animation marker after 350 ms
    setTimeout(() => get().clearLastPlaced(), 350);

    // Check if player has placed all settlements for this turn
    if (newRemainingPlacements === 0) {
      set({
        remainingPlacements: 0,
        phase: GamePhase.EndTurn,
        validPlacements: [],
        selectedCell: null,
        lastPlacedCoord: coord,
        acquiredLocations: updatedLocations,
        newlyAcquiredLocationIndex,
      });
    } else {
      // Update valid placements for next settlement
      const newValidPlacements = getValidPlacements(
        state.board,
        state.currentTerrainCard.terrain,
        currentPlayer.id
      );

      set({
        remainingPlacements: newRemainingPlacements,
        validPlacements: newValidPlacements,
        selectedCell: null,
        lastPlacedCoord: coord,
        acquiredLocations: updatedLocations,
        newlyAcquiredLocationIndex,
      });
    }
  },

  // End the current player's turn
  endTurn: () => {
    const state = get();
    
    if (state.phase !== GamePhase.EndTurn) {
      console.error('Cannot end turn in current phase');
      return;
    }

    // Move to next player
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    // Check if game is over (all players out of settlements or deck exhausted multiple times)
    const allPlayersOutOfSettlements = state.players.every(
      player => player.remainingSettlements === 0
    );

    if (allPlayersOutOfSettlements) {
      set({
        phase: GamePhase.GameOver,
        currentPlayerIndex: nextPlayerIndex,
        currentTerrainCard: null,
        validPlacements: [],
      });
    } else {
      set({
        currentPlayerIndex: nextPlayerIndex,
        phase: GamePhase.DrawCard,
        currentTerrainCard: null,
        validPlacements: [],
      });
    }
  },

  // Select a cell (for UI highlighting)
  selectCell: (coord: AxialCoord | null) => {
    set({ selectedCell: coord });
  },

  // Clear the last-placed animation marker
  clearLastPlaced: () => {
    set({ lastPlacedCoord: null, newlyAcquiredLocationIndex: null });
  },
}));

// Hex coordinate
export interface HexCoord {
  q: number;
  r: number;
}

// Action types for game history
export type GameActionType =
  | 'PLACE_SETTLEMENT'
  | 'ACQUIRE_TILE'
  | 'MOVE_SETTLEMENT'
  | 'DRAW_CARD'
  | 'END_TURN';

// A single game action recorded in history
export interface GameAction {
  id: string;
  type: GameActionType;
  playerId: number;
  hex?: HexCoord;
  tile?: string;
  timestamp: number;
  turnNumber: number;
}

// Terrain types
export type Terrain =
  | 'grass'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'mountain'
  | 'water'
  | 'castle'
  | 'location';

// Player info
export interface Player {
  id: number;
  name: string;
  color: string;
  settlements: number;
  locationTiles: string[];
  undoUsedThisTurn: boolean;
}

// Cell on the board
export interface Cell {
  q: number;
  r: number;
  terrain: Terrain;
  owner?: number;
  locationTile?: string;
}

// Game state
export interface GameState {
  board: Cell[];
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: number;
  currentCard: Terrain | null;
  placementsThisTurn: number;
  maxPlacementsPerTurn: number;
  history: GameAction[];
  canUndo: boolean;
  phase: 'setup' | 'playing' | 'ended';
}

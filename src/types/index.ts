// Hex coordinate (axial coordinates)
export interface Hex {
  q: number;
  r: number;
}

// Terrain types
export type TerrainType =
  | 'grassland'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'mountain'
  | 'water';

// Location tile types
export type LocationTileType =
  | 'farm'
  | 'harbor'
  | 'temple'
  | 'tower'
  | 'oracle'
  | 'oasis'
  | 'tavern'
  | 'barn';

// Objective card types
export type ObjectiveType =
  | 'fisherman'
  | 'miner'
  | 'knight'
  | 'lords'
  | 'farmers'
  | 'hermits'
  | 'merchants'
  | 'discoverers'
  | 'builders'
  | 'shepherds';

// A cell on the board
export interface Cell {
  hex: Hex;
  terrain: TerrainType;
  owner: number | null; // player index (0-based), null if empty
  hasCastle: boolean;
  hasLocationTile: LocationTileType | null;
  locationTileClaimed: boolean;
}

// Player type
export type PlayerType = 'human' | 'bot-easy' | 'bot-normal' | 'bot-hard';

// Player info
export interface Player {
  id: number;
  name: string;
  type: PlayerType;
  color: string;
  score: number;
  locationTiles: LocationTileType[];
}

// Game phase
export type GamePhase = 'setup' | 'playing' | 'finished';

// Turn phase
export type TurnPhase = 'draw' | 'place' | 'confirm';

// Game state
export interface GameState {
  phase: GamePhase;
  cells: Cell[];
  players: Player[];
  currentPlayer: number;
  currentTerrain: TerrainType | null;
  placementsThisTurn: number;
  placementsRequired: number;
  objectives: ObjectiveType[];
  turnHistory: TurnRecord[];
  terrainDeck: TerrainType[];
}

// Turn record for history
export interface TurnRecord {
  player: number;
  terrain: TerrainType;
  placements: Hex[];
}

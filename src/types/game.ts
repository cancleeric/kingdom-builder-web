// Terrain types
export type Terrain =
  | 'grass'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'water'
  | 'mountain'
  | 'castle'
  | 'location';

// Location tile types
export type LocationTileType =
  | 'farm'
  | 'harbor'
  | 'temple'
  | 'tower'
  | 'tavern'
  | 'oasis'
  | 'barn'
  | 'paddock';

// Hex coordinate (axial)
export interface HexCoord {
  q: number;
  r: number;
}

// A cell on the board
export interface BoardCell {
  coord: HexCoord;
  terrain: Terrain;
  hasHouse: boolean;
  playerId: number | null;
  locationTile: LocationTileType | null;
}

// Location tile held by a player
export interface LocationTile {
  type: LocationTileType;
  used: boolean;
}

// Scoring card
export type ScoringCard =
  | 'fisherman'
  | 'miner'
  | 'knight'
  | 'lords'
  | 'hermit'
  | 'merchant'
  | 'explorer'
  | 'farmer'
  | 'citizen'
  | 'worker';

// Player state
export interface Player {
  id: number;
  name: string;
  housesRemaining: number;
  locationTiles: LocationTile[];
  score: number;
}

// Full game state — serializable to JSON
export interface GameState {
  board: BoardCell[];
  players: Player[];
  currentPlayerId: number;
  turn: number;
  currentTerrainCard: Terrain | null;
  housesPlacedThisTurn: number;
  scoringCards: ScoringCard[];
  phase: 'setup' | 'playing' | 'ended';
}

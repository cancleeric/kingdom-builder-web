export type TerrainType = 'grass' | 'forest' | 'desert' | 'flower' | 'canyon' | 'water' | 'mountain' | 'castle';

export interface HexCell {
  row: number;
  col: number;
  terrain: TerrainType;
  hasHouse?: boolean;
  playerId?: number;
  locationTile?: LocationTileType;
  hasCastle?: boolean;
}

export type BoardState = HexCell[][];  // 20×20 grid

export interface QuadrantTemplate {
  id: string;
  name: string;
  terrain: TerrainType[][];  // 10×10 grid
}

export type LocationTileType = 'farm' | 'harbor' | 'temple' | 'tower' | 'tavern' | 'stable' | 'oasis' | 'barn';

export interface LocationTile {
  type: LocationTileType;
  row: number;
  col: number;
}

export interface Player {
  id: number;
  name: string;
  houses: number;
  score: number;
  locationTiles: LocationTileType[];
}

export interface GameState {
  board: BoardState;
  players: Player[];
  currentPlayer: number;
  currentTerrain: TerrainType | null;
  placementsLeft: number;
  phase: 'draw' | 'place' | 'end';
  winner: number | null;
  scoringCards: ScoringCardType[];
}

export type ScoringCardType = 'fishermen' | 'miners' | 'knights' | 'lords' | 'merchants' | 'citizens' | 'shepherds' | 'farmers' | 'explorers' | 'builders';

export type Rotation = 0 | 90 | 180 | 270;

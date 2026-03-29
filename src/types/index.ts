export type { PlayerColor, PlayerConfig, PlayerCount } from './setup';

export type TerrainType =
  | 'grass'
  | 'forest'
  | 'desert'
  | 'flower'
  | 'canyon'
  | 'mountain'
  | 'water'
  | 'castle';

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexCell {
  coord: HexCoord;
  terrain: TerrainType;
  settlement: number | null; // player id (0-indexed) or null
  hasLocation: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: import('./setup').PlayerColor;
  settlements: number; // remaining settlements
  score: number;
  locationTokens: string[];
}

export interface GameState {
  players: Player[];
  playerCount: 2 | 3 | 4;
  currentPlayerIndex: number;
  board: HexCell[];
  currentTerrain: TerrainType | null;
  placementsLeft: number;
  phase: 'setup' | 'playing' | 'ended';
  turnNumber: number;
}

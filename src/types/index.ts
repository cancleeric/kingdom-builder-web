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

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexCell {
  coord: HexCoord;
  terrain: Terrain;
  hasSettlement: boolean;
  settlementColor?: string;
  isLocation: boolean;
  isHighlighted?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  settlements: number;
}

export interface GameState {
  board: HexCell[];
  currentPlayer: Player;
  players: Player[];
  currentTerrain: Terrain | null;
  placementsLeft: number;
  phase: 'draw' | 'place' | 'end';
  turn: number;
}

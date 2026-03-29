import { AxialCoord } from '../core/hex';
import { Terrain, Location } from '../core/terrain';

/**
 * A single hex cell on the board
 */
export interface HexCell {
  coord: AxialCoord;
  terrain: Terrain;
  location?: Location;
  settlement?: number; // Player ID if occupied, undefined otherwise
}

/**
 * Player information
 */
export interface Player {
  id: number;
  name: string;
  color: string;
  settlements: AxialCoord[]; // All settlements placed by this player
  remainingSettlements: number; // Number of settlements left to place
}

/**
 * Game phase
 */
export enum GamePhase {
  Setup = 'Setup',
  DrawCard = 'DrawCard',
  PlaceSettlements = 'PlaceSettlements',
  EndTurn = 'EndTurn',
  GameOver = 'GameOver',
}

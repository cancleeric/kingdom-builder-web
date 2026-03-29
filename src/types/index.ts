import { AxialCoord } from '../core/hex';
import { Terrain, Location } from '../core/terrain';
import { ObjectiveCard } from '../core/scoring';

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
 * A location tile owned by a player
 */
export interface LocationTile {
  location: Location;
  usedThisTurn: boolean;
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
  tiles: LocationTile[]; // Location tiles acquired by this player
}

/**
 * Per-player score breakdown
 */
export interface PlayerScore {
  playerId: number;
  castleScore: number;
  objectiveScores: { card: ObjectiveCard; score: number }[];
  totalScore: number;
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

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
 * Bot difficulty levels
 */
export enum BotDifficulty {
  Easy = 'easy',       // Random valid placement
  Medium = 'medium',   // Strategic greedy heuristics
  Hard = 'hard',       // Alpha-beta strategic search
  Normal = 'normal',   // Legacy saved-game alias for medium
}

/**
 * Configuration for a single player slot at game setup
 */
export interface PlayerConfig {
  name: string;
  type: 'human' | 'bot';
  difficulty: BotDifficulty;
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
  isBot: boolean;
  difficulty: BotDifficulty;
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

/**
 * Board size options for game setup
 */
export type BoardSize = 'small' | 'medium' | 'large';

/**
 * Optional game configuration chosen at setup time
 */
export interface GameOptions {
  boardSize: BoardSize;
  objectiveCount: 1 | 2 | 3;
  enableUndo: boolean;
}

// ────────────────────────────────────────────────────
// Tutorial types
// ────────────────────────────────────────────────────

/**
 * A single step in the interactive tutorial
 */
export interface TutorialStep {
  /** Unique id for the step */
  id: string;
  /** Short title shown in the tooltip header */
  title: string;
  /** Detailed description shown in the tooltip body */
  description: string;
  /** Optional emoji / icon to visually identify the step */
  icon?: string;
  /** IDs of board-cell coordinates to highlight (encoded as "q,r") */
  highlightCells?: string[];
  /** CSS selector (or logical name) of the UI element to point at */
  targetElement?: string;
  /** Which user action, if any, should auto-advance to the next step */
  advanceOn?: 'click' | 'drawCard' | 'placeSettlement' | 'endTurn' | 'none';
}

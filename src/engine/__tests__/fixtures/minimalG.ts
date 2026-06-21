/**
 * Minimal KingdomG fixtures for adapter tests.
 *
 * These are hand-constructed snapshots — NOT produced by UI/store flows —
 * so tests can remain pure and deterministic.
 *
 * Board layout (5x5 region we care about, offset coords q in [1..3], r in [1..3]):
 *
 *   (1,1)=Grass  (2,1)=Grass  (3,1)=Forest
 *   (1,2)=Grass  (2,2)=Water  (3,2)=Forest
 *   (1,3)=Grass  (2,3)=Mountain (3,3)=Forest
 *
 * All other cells: Grass (fills 20x20 board).
 *
 * Castles at (0,0), (19,0), (0,19), (19,19) to satisfy Board conventions.
 */

import { Board } from '../../../core/board';
import { Terrain, Location } from '../../../core/terrain';
import type { TerrainCard } from '../../../core/terrain';
import { ObjectiveCard } from '../../../core/scoring';
import { GamePhase, BotDifficulty } from '../../../types';
import type { Player, GameOptions } from '../../../types';
import type { KingdomG } from '../../types';

// ────────────────────────────────────────────────────────────────────────────
// Board builder helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal 20x20 board where:
 * - (1,1),(2,1),(1,2),(1,3) = Grass (buildable, the terrain we test with)
 * - (2,2)                   = Water (not buildable)
 * - (2,3)                   = Mountain (not buildable)
 * - (3,1),(3,2),(3,3)       = Forest (different terrain)
 * - Castles at (0,0),(19,0),(0,19),(19,19)
 * - All remaining cells = Grass
 */
export function buildMinimalBoard(): Board {
  const board = new Board(20, 20);

  for (let q = 0; q < 20; q++) {
    for (let r = 0; r < 20; r++) {
      // Determine terrain
      let terrain = Terrain.Grass;

      if (q === 2 && r === 2) terrain = Terrain.Water;
      else if (q === 2 && r === 3) terrain = Terrain.Mountain;
      else if (q === 3 && r >= 1 && r <= 4) terrain = Terrain.Forest;

      const cell = {
        coord: { q, r },
        terrain,
        settlement: undefined as number | undefined,
        location: undefined as Location | undefined,
      };

      // Place castles at corners
      if ((q === 0 && r === 0) || (q === 19 && r === 0) ||
          (q === 0 && r === 19) || (q === 19 && r === 19)) {
        cell.location = Location.Castle;
      }

      board.setCell(cell);
    }
  }

  return board;
}

/**
 * Build the two default Players for a 2-player match.
 * player.id is 1-based (Player 1 = id:1, Player 2 = id:2).
 */
export function buildTwoPlayers(): Player[] {
  const base: Omit<Player, 'id' | 'name' | 'color'> = {
    settlements: [],
    remainingSettlements: 40,
    tiles: [],
    isBot: false,
    difficulty: BotDifficulty.Medium,
  };
  return [
    { ...base, id: 1, name: 'Player 1', color: '#FF6B6B' },
    { ...base, id: 2, name: 'Player 2', color: '#4ECDC4' },
  ];
}

export const DEFAULT_OPTIONS: GameOptions = {
  boardSize: 'large',
  objectiveCount: 3,
  enableUndo: true,
};

export const GRASS_CARD: TerrainCard = { terrain: Terrain.Grass };
export const FOREST_CARD: TerrainCard = { terrain: Terrain.Forest };

// ────────────────────────────────────────────────────────────────────────────
// Fixture A: DrawCard phase, fresh turn, no settlements on board
// ────────────────────────────────────────────────────────────────────────────

/**
 * fixtureA: 2-player match, Player 1 to act, DrawCard phase.
 * Board has plenty of Grass cells at (1,1),(2,1),(1,2),(1,3) and many more.
 */
export function makeFixtureA(): KingdomG {
  return {
    board: buildMinimalBoard(),
    players: buildTwoPlayers(),
    currentPlayerIndex: 0,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    remainingPlacements: 0,
    deck: [GRASS_CARD, FOREST_CARD],
    acquiredLocations: [],
    objectiveCards: [ObjectiveCard.Fisherman, ObjectiveCard.Miners, ObjectiveCard.Knights],
    finalScores: [],
    placementsThisTurn: [],
    activeTile: null,
    tileMoveSources: [],
    tileMoveFrom: null,
    tileMoveDestinations: [],
    turnNumber: 1,
    gameOptions: DEFAULT_OPTIONS,
    undoStack: [],
    canUndo: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Fixture B: PlaceSettlements phase, Grass card drawn, 3 placements remain
// ────────────────────────────────────────────────────────────────────────────

/**
 * fixtureB: Player 1's turn, Grass terrain card drawn, PlaceSettlements phase.
 * Board is empty — all Grass cells are valid first placements.
 */
export function makeFixtureB(): KingdomG {
  return {
    ...makeFixtureA(),
    phase: GamePhase.PlaceSettlements,
    currentTerrainCard: GRASS_CARD,
    remainingPlacements: 3,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Fixture C: End-game state — Player 1 has 0 remainingSettlements
// ────────────────────────────────────────────────────────────────────────────

/**
 * fixtureC: Player 1 placed all 40 settlements; EndTurn phase.
 * Player 2 still has 40. Victory check should trigger.
 */
export function makeFixtureC(withSettlementsOnBoard = false): KingdomG {
  const board = buildMinimalBoard();
  const players = buildTwoPlayers();

  // Player 1 has used all settlements
  players[0].remainingSettlements = 0;

  // Optionally place a few settlements on the board for scoring tests
  if (withSettlementsOnBoard) {
    // Place Player 1 settlement adjacent to Castle at (0,0)
    // Cell (1,0) is Grass and adjacent to Castle (0,0)
    const cell10 = board.getCell({ q: 1, r: 0 });
    if (cell10) {
      cell10.settlement = 1; // player id 1
      players[0].settlements.push({ q: 1, r: 0 });
    }
    // Place Player 2 settlement at (2,1) — not adjacent to any castle
    const cell21 = board.getCell({ q: 2, r: 1 });
    if (cell21) {
      cell21.settlement = 2; // player id 2
      players[1].settlements.push({ q: 2, r: 1 });
    }
  }

  return {
    board,
    players,
    currentPlayerIndex: 0,
    phase: GamePhase.EndTurn,
    currentTerrainCard: null,
    remainingPlacements: 0,
    deck: [FOREST_CARD],
    acquiredLocations: [],
    objectiveCards: [ObjectiveCard.Fisherman, ObjectiveCard.Miners, ObjectiveCard.Knights],
    finalScores: [],
    placementsThisTurn: [],
    activeTile: null,
    tileMoveSources: [],
    tileMoveFrom: null,
    tileMoveDestinations: [],
    turnNumber: 10,
    gameOptions: DEFAULT_OPTIONS,
    undoStack: [],
    canUndo: false,
  };
}

/**
 * Q2-1: Bot tile enumerate — unit tests
 *
 * Covers the 4 tile moves added to the enumerate function in adapter.ts:
 *   - activate_tile
 *   - apply_tile_placement
 *   - select_tile_move_source
 *   - apply_tile_move
 *
 * Test cases (7 total, per Q2-1 plan):
 *   E-01  activate_tile: player has Farm tile + valid grass placements → non-empty Location[]
 *   E-02  activate_tile: player has Farm tile but no valid positions → [] (Farm excluded)
 *   E-03  activate_tile: player has Paddock tile + valid movement options → non-empty Location[]
 *   E-04  apply_tile_placement: activeTile=Farm → valid AxialCoord[]
 *   E-05  apply_tile_placement: activeTile=null → []
 *   E-06  select_tile_move_source: activeTile=Paddock → from coord[]
 *   E-07  apply_tile_move: tileMoveFrom=null → []; has value → tileMoveDestinations
 *
 * playerId convention: enumerate receives 0-based playerId; location.ts expects
 * 1-based player id. The adapter uses `playerId + 1` (see adapter.ts:152, 174).
 */

import { describe, it, expect } from 'vitest';
import { kingdomGame } from '../adapter';
import { Location, Terrain } from '../../core/terrain';
import { GamePhase, BotDifficulty } from '../../types';
import type { KingdomG } from '../types';
import type { MatchState } from '@hd/game-kit/engine';
import { buildMinimalBoard, buildTwoPlayers, DEFAULT_OPTIONS, GRASS_CARD } from './fixtures/minimalG';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a MatchState from a KingdomG (bypasses createMatch/setup). */
function matchFrom(G: KingdomG, currentPlayer = 0, phase = 'PlaceSettlements'): MatchState<KingdomG> {
  return {
    G,
    ctx: {
      numPlayers: G.players.length,
      currentPlayer,
      phase,
      gameover: null,
    },
  };
}

/** Call enumerate on the kingdomGame adapter. */
function enumerateMove(match: MatchState<KingdomG>, moveId: string, playerId = 0): readonly unknown[] {
  return kingdomGame.enumerate!(match, moveId, playerId);
}

/**
 * Build a base PlaceSettlements-phase fixture with the given tile on player 0
 * (player.id=1, because player ids are 1-based).
 */
function makeGWithTile(tileLocation: Location, usedThisTurn = false): KingdomG {
  const board = buildMinimalBoard();
  const players = buildTwoPlayers();
  // Grant player id:1 (index 0) the given tile
  players[0].tiles = [{ location: tileLocation, usedThisTurn }];
  return {
    board,
    players,
    currentPlayerIndex: 0,
    phase: GamePhase.PlaceSettlements,
    currentTerrainCard: GRASS_CARD,
    remainingPlacements: 3,
    deck: [],
    acquiredLocations: [],
    objectiveCards: [],
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

// ─────────────────────────────────────────────────────────────────────────────
// E-01  activate_tile: player has Farm tile + valid grass placements → non-empty
// ─────────────────────────────────────────────────────────────────────────────

describe('E-01: activate_tile returns Farm when placement positions exist', () => {
  it('returns [Location.Farm] when board has many grass cells (no adjacent constraint)', () => {
    // Farm uses getFarmPlacements: all empty grass cells (no adjacency restriction
    // when the player has no existing settlements on the board).
    // minimalBoard has many Grass cells → positions non-empty → Farm is included.
    const G = makeGWithTile(Location.Farm);
    const match = matchFrom(G);
    const result = enumerateMove(match, 'activate_tile', 0);

    expect(result).toContain(Location.Farm);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-02  activate_tile: Farm tile but all grass cells occupied → []
// ─────────────────────────────────────────────────────────────────────────────

describe('E-02: activate_tile returns [] when Farm has no valid positions', () => {
  it('returns [] when every grass cell is already occupied', () => {
    const G = makeGWithTile(Location.Farm);
    // Occupy every cell on the board so there are no empty grass cells
    for (const cell of G.board.getAllCells()) {
      if (cell.terrain === Terrain.Grass && cell.location === undefined) {
        // Mark occupied by player 2 (so farm still won't match player 1's adjacency)
        cell.settlement = 2;
      }
    }
    const match = matchFrom(G);
    const result = enumerateMove(match, 'activate_tile', 0);

    // Farm has no valid placement positions → should NOT appear
    expect(result).not.toContain(Location.Farm);
    // The overall result should be empty (no other tiles)
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-03  activate_tile: player has Paddock tile + movement options → non-empty
// ─────────────────────────────────────────────────────────────────────────────

describe('E-03: activate_tile returns Paddock when movement options exist', () => {
  it('returns [Location.Paddock] when player has a settlement with open 2-step moves', () => {
    const G = makeGWithTile(Location.Paddock);
    // Place a settlement for player id:1 at (5,5) so Paddock has movement sources.
    // (5,5) is Grass; destinations 2 hexes away in each direction should be available.
    const cell = G.board.getCell({ q: 5, r: 5 });
    expect(cell).toBeDefined();
    cell!.settlement = 1; // player id 1 (1-based)
    G.players[0].settlements.push({ q: 5, r: 5 });

    const match = matchFrom(G);
    const result = enumerateMove(match, 'activate_tile', 0);

    expect(result).toContain(Location.Paddock);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-04  apply_tile_placement: activeTile=Farm → valid AxialCoord[]
// ─────────────────────────────────────────────────────────────────────────────

describe('E-04: apply_tile_placement returns AxialCoord[] when activeTile is a placement tile', () => {
  it('returns non-empty AxialCoord[] when activeTile=Farm and board has empty grass', () => {
    const G = makeGWithTile(Location.Farm);
    // Set activeTile to Farm (simulating that activate_tile was called already)
    const G2: KingdomG = { ...G, activeTile: Location.Farm };
    const match = matchFrom(G2);
    const result = enumerateMove(match, 'apply_tile_placement', 0);

    expect(result.length).toBeGreaterThan(0);
    // Each result should be an AxialCoord
    for (const coord of result) {
      const c = coord as { q: number; r: number };
      expect(typeof c.q).toBe('number');
      expect(typeof c.r).toBe('number');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-05  apply_tile_placement: activeTile=null → []
// ─────────────────────────────────────────────────────────────────────────────

describe('E-05: apply_tile_placement returns [] when activeTile is null', () => {
  it('returns [] when no tile has been activated', () => {
    const G = makeGWithTile(Location.Farm);
    // activeTile stays null (default from makeGWithTile)
    const match = matchFrom(G);
    const result = enumerateMove(match, 'apply_tile_placement', 0);

    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-06  select_tile_move_source: activeTile=Paddock → from coord[]
// ─────────────────────────────────────────────────────────────────────────────

describe('E-06: select_tile_move_source returns from coords when activeTile is a movement tile', () => {
  it('returns from coord array when activeTile=Paddock and player has movable settlements', () => {
    const G = makeGWithTile(Location.Paddock);
    // Place player settlement at (5,5)
    const cell = G.board.getCell({ q: 5, r: 5 });
    expect(cell).toBeDefined();
    cell!.settlement = 1;
    G.players[0].settlements.push({ q: 5, r: 5 });

    // Simulate: activate_tile was called, so activeTile=Paddock
    const G2: KingdomG = { ...G, activeTile: Location.Paddock };
    const match = matchFrom(G2);
    const result = enumerateMove(match, 'select_tile_move_source', 0);

    expect(result.length).toBeGreaterThan(0);
    // Each result should be an AxialCoord (the "from" position)
    for (const coord of result) {
      const c = coord as { q: number; r: number };
      expect(typeof c.q).toBe('number');
      expect(typeof c.r).toBe('number');
    }
    // The settlement coord (5,5) should be in the result
    const hasExpected = result.some(c => {
      const a = c as { q: number; r: number };
      return a.q === 5 && a.r === 5;
    });
    expect(hasExpected).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E-07  apply_tile_move: tileMoveFrom=null → []; tileMoveFrom set → destinations
// ─────────────────────────────────────────────────────────────────────────────

describe('E-07: apply_tile_move returns [] when tileMoveFrom is null', () => {
  it('returns [] when no move source has been selected', () => {
    const G = makeGWithTile(Location.Paddock);
    // activeTile=Paddock but tileMoveFrom still null
    const G2: KingdomG = { ...G, activeTile: Location.Paddock, tileMoveFrom: null };
    const match = matchFrom(G2);
    const result = enumerateMove(match, 'apply_tile_move', 0);

    expect(result).toHaveLength(0);
  });

  it('returns tileMoveDestinations when tileMoveFrom is set', () => {
    const G = makeGWithTile(Location.Paddock);
    const destinations = [{ q: 7, r: 5 }, { q: 3, r: 5 }];
    const G2: KingdomG = {
      ...G,
      activeTile: Location.Paddock,
      tileMoveFrom: { q: 5, r: 5 },
      tileMoveDestinations: destinations,
    };
    const match = matchFrom(G2);
    const result = enumerateMove(match, 'apply_tile_move', 0);

    expect(result).toHaveLength(2);
    expect(result).toEqual(destinations);
  });
});

/**
 * Kingdom Builder — GameDefinition<KingdomG> for @hd/game-kit/engine.
 *
 * This file is the engine plug-in entry point.  It wires the pure-function
 * moves from `./moves` into a `defineGame` call, declares phases, turn order,
 * victory condition, and bot enumerate hook.
 *
 * ⚠️  setup() contains a note about seededRandom dependency:
 *   `selectObjectiveCards` uses the global seeded RNG (src/utils/seededRandom),
 *   which is NOT deterministic in isolation.  For the engine adapter (Phase 1,
 *   purely additive), setup() uses a hardcoded set of 3 objective cards as a
 *   stable placeholder.  Phase 2 / PR-C tests will inject fixture G directly
 *   (bypassing setup) or provide a seed-based extension.
 */

import { defineGame } from '@hd/game-kit/engine';
import type { GameContext } from '@hd/game-kit/engine';
import { Board, createModularBoard } from '../core/board';
import { createTerrainDeck, shuffleDeck, Location } from '../core/terrain';
import { ObjectiveCard, calculatePlayerScore } from '../core/scoring';
import { getValidPlacements } from '../core/rules';
import { getExtraPlacementPositions, getMovementOptions } from '../core/location';
import { GamePhase, BotDifficulty } from '../types';
import type { Player, PlayerScore } from '../types';
import type { KingdomG } from './types';
import * as moves from './moves';

// ────────────────────────────────────────────────────────────────────────────
// Setup helper
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the initial KingdomG for a match.
 *
 * The board is generated with a deterministic seed derived from ctx so that
 * createMatch(game, 2) produces a reproducible starting state.
 *
 * Players are given placeholder names and colours; in a real match the server
 * layer or the multiplayer lobby passes a customised initial state via the
 * Phase 2 wire protocol.
 *
 * Objective cards: three fixed cards are used as a stable placeholder (see
 * file-level note above about seededRandom dependency).
 */
function buildInitialState(ctx: GameContext): KingdomG {
  const playerCount = ctx.numPlayers;
  const playerColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    color: playerColors[i] ?? '#AAAAAA',
    settlements: [],
    remainingSettlements: 40,
    tiles: [],
    isBot: false,
    difficulty: BotDifficulty.Medium,
  }));

  // Use a fixed seed so setup is deterministic for testing.
  const board: Board = createModularBoard({ seed: 20260101 });

  const deck = shuffleDeck(createTerrainDeck());

  // Stable placeholder objective cards (no global seededRandom call in setup).
  const objectiveCards: ObjectiveCard[] = [
    ObjectiveCard.Fisherman,
    ObjectiveCard.Miners,
    ObjectiveCard.Knights,
  ];

  return {
    board,
    players,
    currentPlayerIndex: 0,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    remainingPlacements: 0,
    deck,
    acquiredLocations: [],
    objectiveCards,
    finalScores: [],
    placementsThisTurn: [],
    activeTile: null,
    tileMoveSources: [],
    tileMoveFrom: null,
    tileMoveDestinations: [],
    turnNumber: 1,
    gameOptions: { boardSize: 'large', objectiveCount: 3, enableUndo: true },
    undoStack: [],
    canUndo: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Victory check
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns the winning player index (0-based) once any player runs out of
 * settlements, or null while the game is still in progress.
 *
 * In case of a tie, returns the first player with the highest score.
 * Returns 'draw' string if all tied players share the exact same score
 * and no tiebreaker is possible.
 */
function checkVictory(G: KingdomG): unknown | null {
  if (G.phase !== GamePhase.GameOver) {
    const anyEmpty = G.players.some(p => p.remainingSettlements <= 0);
    if (!anyEmpty) return null;
  }

  const scores: PlayerScore[] = G.players.map((p, idx) => ({
    playerId: p.id,
    castleScore: 0, // placeholder; calculatePlayerScore computes the full total
    objectiveScores: G.objectiveCards.map(card => ({ card, score: 0 })),
    totalScore: calculatePlayerScore(G.board, p.id, G.objectiveCards),
    // 0-based index stored for reference
    _playerIndex: idx,
  } as PlayerScore & { _playerIndex: number }));

  const maxScore = Math.max(...scores.map(s => s.totalScore));
  const winners = scores.filter(s => s.totalScore === maxScore);

  if (winners.length === 1) {
    return (winners[0] as PlayerScore & { _playerIndex: number })._playerIndex;
  }
  return 'draw';
}

// ────────────────────────────────────────────────────────────────────────────
// Enumerate hook (bot support)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Enumerate legal payloads for each move id so makeRandomMove can play
 * automatically.
 *
 * - place_settlement: returns all valid placement coords from getValidPlacements
 * - payload-free moves: returns [undefined]
 * - others: returns [] (no valid payloads in current state)
 */
function enumerate(
  match: { G: KingdomG; ctx: GameContext },
  moveId: string,
  playerId: number
): readonly unknown[] {
  const G = match.G;

  if (moveId === 'place_settlement') {
    if (!G.currentTerrainCard) return [];
    const player = G.players.find(p => p.id === playerId + 1);
    if (!player) return [];
    return getValidPlacements(
      G.board,
      G.currentTerrainCard.terrain,
      player.id,
      G.placementsThisTurn
    );
  }

  const noPayloadMoves = new Set([
    'draw_terrain_card',
    'end_turn',
    'cancel_tile',
    'undo_last_action',
  ]);
  if (noPayloadMoves.has(moveId)) return [undefined];

  // Movement tiles: Harbor, Paddock, Barn
  const movementTiles = new Set<Location>([Location.Harbor, Location.Paddock, Location.Barn]);

  if (moveId === 'activate_tile') {
    const player = G.players.find(p => p.id === playerId + 1);
    if (!player) return [];
    const validLocations: Location[] = [];
    for (const tile of player.tiles) {
      if (tile.usedThisTurn) continue;
      const loc = tile.location as Location;
      if (movementTiles.has(loc)) {
        // Movement tile: only activate if there are valid movement options
        const options = getMovementOptions(
          loc,
          G.board,
          playerId + 1,
          G.currentTerrainCard?.terrain
        );
        if (options.length > 0) validLocations.push(loc);
      } else {
        // Placement tile: only activate if there are valid placement positions
        const positions = getExtraPlacementPositions(
          loc,
          G.board,
          playerId + 1,
          G.currentTerrainCard?.terrain
        );
        if (positions.length > 0) validLocations.push(loc);
      }
    }
    return validLocations;
  }

  if (moveId === 'apply_tile_placement') {
    if (!G.activeTile || movementTiles.has(G.activeTile)) return [];
    return getExtraPlacementPositions(
      G.activeTile,
      G.board,
      playerId + 1,
      G.currentTerrainCard?.terrain
    );
  }

  if (moveId === 'select_tile_move_source') {
    if (!G.activeTile || !movementTiles.has(G.activeTile)) return [];
    const options = getMovementOptions(
      G.activeTile,
      G.board,
      playerId + 1,
      G.currentTerrainCard?.terrain
    );
    return options.map(o => o.from);
  }

  if (moveId === 'apply_tile_move') {
    if (!G.tileMoveFrom) return [];
    return G.tileMoveDestinations;
  }

  return [];
}

// ────────────────────────────────────────────────────────────────────────────
// Game definition
// ────────────────────────────────────────────────────────────────────────────

export const kingdomGame = defineGame<KingdomG>({
  name: 'kingdom-builder',

  setup: buildInitialState,

  moves: {
    draw_terrain_card:      moves.drawTerrainCard,
    place_settlement:       moves.placeSettlement,
    end_turn:               moves.endTurn,
    activate_tile:          moves.activateTile,
    cancel_tile:            moves.cancelTile,
    apply_tile_placement:   moves.applyTilePlacement,
    select_tile_move_source: moves.selectTileMoveSource,
    apply_tile_move:        moves.applyTileMove,
    undo_last_action:       moves.undoLastAction,
  },

  /**
   * Phase declarations gate which moves are legal in each phase.
   * The first key (DrawCard) is the initial phase.
   *
   * Note: endTurn event (ctx.events.endTurn) advances the engine's
   * currentPlayer; the kingdom move also advances G.currentPlayerIndex
   * so G and ctx stay in sync.
   */
  phases: {
    DrawCard: {
      moves: ['draw_terrain_card'],
      next: 'PlaceSettlements',
    },
    PlaceSettlements: {
      moves: [
        'place_settlement',
        'activate_tile',
        'cancel_tile',
        'apply_tile_placement',
        'select_tile_move_source',
        'apply_tile_move',
        'undo_last_action',
      ],
      next: 'EndTurn',
    },
    EndTurn: {
      moves: ['end_turn'],
      next: 'DrawCard',
    },
    GameOver: {
      moves: [],
    },
  },

  turn: {
    minPlayers: 2,
    maxPlayers: 4,
    order: 'sequential',
  },

  victory: checkVictory,

  enumerate,
});

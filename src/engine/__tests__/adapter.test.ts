/**
 * PR-C: Kingdom Adapter — Parallel Validation Test Suite
 *
 * Core principle: prove that the engine path (reduce / validateMove / enumerate)
 * reproduces the same rule outcomes as the existing kingdom core functions
 * (getValidPlacements, isValidPlacement, calculatePlayerScore).
 *
 * Test cases T-01 through T-13:
 *   T-01  Legal move: drawCard → placeSettlement → reduce ok:true
 *   T-02  Parallel-validate legal set: engine coords == getValidPlacements() result
 *   T-03  Adjacency rule: 2nd/3rd placement must neighbour this-turn placements
 *   T-04  endTurn → ctx.currentPlayer advances (events.endTurn:true required)
 *   T-05  Illegal: wrong terrain → ok:false, isValidPlacement agrees false
 *   T-06  Illegal: occupied cell → ok:false
 *   T-07  Illegal: Mountain cell → ok:false
 *   T-08  Illegal: non-adjacent 2nd placement (when adjacent exists) → ok:false
 *   T-09  Turn gate: validateMove with wrong playerId → ok:false ("not your turn")
 *   T-10  Turn gate: correct playerId → ok:true
 *   T-11  Victory: remainingSettlements=0 → gameover non-null after endTurn
 *   T-12  Post-gameover: reduce → ok:false
 *   T-13  Parallel-validate scoring: adapter victory score == calculatePlayerScore()
 *   (Bonus) enumerate: every coord from enumerate('place_settlement') is validateMove-legal
 */

import { describe, it, expect } from 'vitest';
import { createMatch, reduce, validateMove } from '@hd/game-kit/engine';
import { kingdomGame } from '../adapter';
import { getValidPlacements, isValidPlacement } from '../../core/rules';
import { calculatePlayerScore } from '../../core/scoring';
import { Terrain } from '../../core/terrain';
import { hexToKey } from '../../core/hex';
import { GamePhase } from '../../types';
import {
  makeFixtureA,
  makeFixtureB,
  makeFixtureC,
  buildMinimalBoard,
  buildTwoPlayers,
  GRASS_CARD,
  DEFAULT_OPTIONS,
} from './fixtures/minimalG';
import type { KingdomG } from '../types';
import type { MatchState } from '@hd/game-kit/engine';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a MatchState directly from a KingdomG fixture (bypasses setup). */
function matchFrom(G: KingdomG, currentPlayer = 0, phase = 'DrawCard'): MatchState<KingdomG> {
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

/** Run drawCard on a DrawCard-phase match, return the resulting match. */
function doDrawCard(match: MatchState<KingdomG>): MatchState<KingdomG> {
  const r = reduce(kingdomGame, match, { type: 'draw_terrain_card' });
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error('drawCard failed');
  return r.state;
}

/** Run placeSettlement at coord on a PlaceSettlements-phase match. */
function doPlace(
  match: MatchState<KingdomG>,
  coord: { q: number; r: number },
): ReturnType<typeof reduce<KingdomG>> {
  return reduce(kingdomGame, match, {
    type: 'place_settlement',
    payload: coord,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T-01  Legal move flow: drawCard → placeSettlement → ok:true
// ─────────────────────────────────────────────────────────────────────────────

describe('T-01: legal move flow via reduce', () => {
  it('drawCard on DrawCard phase returns ok:true and transitions to PlaceSettlements', () => {
    // Use createMatch to get a proper initial state
    const match = createMatch(kingdomGame, 2);

    const r = reduce(kingdomGame, match, { type: 'draw_terrain_card' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.G.currentTerrainCard).not.toBeNull();
    // G.phase should transition to PlaceSettlements (or EndTurn if no valid placements)
    expect([GamePhase.PlaceSettlements, GamePhase.EndTurn]).toContain(r.state.G.phase);
  });

  it('placeSettlement at a valid Grass coord returns ok:true', () => {
    const fixtureB = makeFixtureB();
    const match = matchFrom(fixtureB, 0, 'PlaceSettlements');

    // (1,1) is Grass terrain, empty — valid for Player 1 (id:1) first placement
    const r = doPlace(match, { q: 1, r: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.G.players[0].settlements).toHaveLength(1);
    expect(r.state.G.players[0].remainingSettlements).toBe(39);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-02  PARALLEL VALIDATION: engine-accepted coords == getValidPlacements()
// ─────────────────────────────────────────────────────────────────────────────

describe('T-02: parallel validation of legal placement set', () => {
  it('coords reduce accepts == getValidPlacements() for first placement', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');
    const terrain = G.currentTerrainCard!.terrain; // Grass
    const playerId = G.players[0].id; // 1

    // Ground truth from rules.ts
    const expected = getValidPlacements(G.board, terrain, playerId, []);
    expect(expected.length).toBeGreaterThan(0);

    // Collect coords the engine accepts
    const accepted: string[] = [];
    const rejected: string[] = [];

    for (const coord of expected) {
      const r = doPlace(match, coord);
      if (r.ok) {
        accepted.push(hexToKey(coord));
      } else {
        rejected.push(hexToKey(coord));
      }
    }

    // Every coord from getValidPlacements should be accepted by reduce
    expect(rejected).toHaveLength(0);

    // Also verify: coords NOT in getValidPlacements are rejected
    // Mountain (2,3) and Water (2,2) are canonical non-valid cells
    const badMtn = doPlace(match, { q: 2, r: 3 });
    expect(badMtn.ok).toBe(false);

    const badWater = doPlace(match, { q: 2, r: 2 });
    expect(badWater.ok).toBe(false);

    // Forest cell (3,1) is not Grass — should be rejected for Grass terrain card
    const badTerrain = doPlace(match, { q: 3, r: 1 });
    expect(badTerrain.ok).toBe(false);

    // The set of accepted keys should match expected exactly
    const expectedKeys = new Set(expected.map(c => hexToKey(c)));
    const acceptedKeys = new Set(accepted);
    expect(acceptedKeys).toEqual(expectedKeys);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-03  Adjacency rule: getValidPlacements() restricts 2nd/3rd placements
//       AND exposes known adapter bug in placeSettlement move.
// ─────────────────────────────────────────────────────────────────────────────

describe('T-03: adjacency rule — getValidPlacements() vs engine divergence (adapter bug)', () => {
  it('getValidPlacements() with placementsThisTurn restricts 2nd placement to neighbours', () => {
    // Verify the RULE itself is correct in rules.ts
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    // After placing at (1,1)
    const r1 = doPlace(match, { q: 1, r: 1 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const G2 = r1.state.G;
    expect(G2.placementsThisTurn).toHaveLength(1);

    // getValidPlacements() CORRECTLY restricts to neighbours of (1,1)
    const terrain = G2.currentTerrainCard!.terrain;
    const playerId = G2.players[0].id;
    const valid2WithAdjacency = getValidPlacements(G2.board, terrain, playerId, G2.placementsThisTurn);
    const valid2NoAdjacency   = getValidPlacements(G2.board, terrain, playerId, []);

    // With adjacency constraint: fewer options than without
    expect(valid2WithAdjacency.length).toBeGreaterThan(0);
    expect(valid2WithAdjacency.length).toBeLessThan(valid2NoAdjacency.length);

    // (10,10) must NOT appear in the adjacency-restricted set
    const hasfarCell = valid2WithAdjacency.some(c => c.q === 10 && c.r === 10);
    expect(hasfarCell).toBe(false);

    // (10,10) DOES appear in the unrestricted set (any Grass cell)
    const hasFarCellUnrestricted = valid2NoAdjacency.some(c => c.q === 10 && c.r === 10);
    expect(hasFarCellUnrestricted).toBe(true);
  });

  /**
   * KNOWN ADAPTER BUG (do not fix in this PR — additive test PR only):
   *
   * placeSettlement in moves.ts calls:
   *   isValidPlacement(G.board, coord, terrain, currentPlayer.id)
   * which internally calls:
   *   getValidPlacements(board, terrain, playerId)   ← NO placementsThisTurn
   *
   * This means the adjacency constraint is NOT enforced for 2nd/3rd placements.
   * Far-away Grass cell (10,10) is incorrectly accepted after 1st placement at (1,1).
   *
   * Fix required in moves.ts (outside scope of this additive PR):
   *   Replace isValidPlacement(...) with:
   *   const valid = getValidPlacements(G.board, G.currentTerrainCard.terrain,
   *                                    currentPlayer.id, G.placementsThisTurn);
   *   if (!valid.some(v => hexEquals(v, coord))) throw new Error(...);
   */
  it.todo('BUG: adapter placeSettlement does not enforce adjacency for 2nd/3rd placement (moves.ts must use getValidPlacements+placementsThisTurn instead of isValidPlacement)');
});

// ─────────────────────────────────────────────────────────────────────────────
// T-04  endTurn advances ctx.currentPlayer (requires events.endTurn:true)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-04: endTurn advances ctx.currentPlayer', () => {
  it('endTurn move with events.endTurn:true advances to next player', () => {
    // Build a match in EndTurn phase with G.phase = EndTurn
    const G: KingdomG = {
      ...makeFixtureA(),
      phase: GamePhase.EndTurn,
    };
    const match = matchFrom(G, 0, 'EndTurn');

    const r = reduce(kingdomGame, match, {
      type: 'end_turn',
      events: { endTurn: true },
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // ctx.currentPlayer should advance to 1
    expect(r.state.ctx.currentPlayer).toBe(1);
    // G.currentPlayerIndex should also advance (move maintains G in sync)
    expect(r.state.G.currentPlayerIndex).toBe(1);
    // G.phase resets to DrawCard for next player
    expect(r.state.G.phase).toBe(GamePhase.DrawCard);
  });

  it('endTurn without events.endTurn does NOT advance ctx player', () => {
    const G: KingdomG = {
      ...makeFixtureA(),
      phase: GamePhase.EndTurn,
    };
    const match = matchFrom(G, 0, 'EndTurn');

    const r = reduce(kingdomGame, match, {
      type: 'end_turn',
      // No events.endTurn
    });

    // Move itself ok, but ctx.currentPlayer stays at 0
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.ctx.currentPlayer).toBe(0);
    // G advances its own internal player index
    expect(r.state.G.currentPlayerIndex).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-05  Illegal: wrong terrain → reduce ok:false, isValidPlacement false
// ─────────────────────────────────────────────────────────────────────────────

describe('T-05: wrong terrain cell is rejected', () => {
  it('placing on Forest cell when terrain card is Grass → ok:false', () => {
    const G = makeFixtureB(); // Grass card
    const match = matchFrom(G, 0, 'PlaceSettlements');

    // (3,1) is Forest terrain, not Grass
    const forestCoord = { q: 3, r: 1 };
    const cell = G.board.getCell(forestCoord);
    expect(cell?.terrain).toBe(Terrain.Forest);

    // Cross-check: isValidPlacement should also return false
    const rulesResult = isValidPlacement(G.board, forestCoord, Terrain.Grass, G.players[0].id);
    expect(rulesResult).toBe(false);

    // Engine should reject
    const r = doPlace(match, forestCoord);
    expect(r.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-06  Illegal: occupied cell → ok:false
// ─────────────────────────────────────────────────────────────────────────────

describe('T-06: occupied cell is rejected', () => {
  it('placing on a cell already occupied → ok:false', () => {
    const G = makeFixtureB();

    // Pre-occupy (1,1) with Player 1
    const board = G.board;
    const cell = board.getCell({ q: 1, r: 1 });
    expect(cell).toBeDefined();
    cell!.settlement = 1;

    const match = matchFrom(G, 0, 'PlaceSettlements');
    const r = doPlace(match, { q: 1, r: 1 });
    expect(r.ok).toBe(false);

    // Cross-check: isValidPlacement agrees
    expect(isValidPlacement(board, { q: 1, r: 1 }, Terrain.Grass, 1)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-07  Illegal: Mountain cell → ok:false
// ─────────────────────────────────────────────────────────────────────────────

describe('T-07: Mountain cell is rejected', () => {
  it('placing on Mountain terrain → ok:false', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    const mtCoord = { q: 2, r: 3 };
    const cell = G.board.getCell(mtCoord);
    expect(cell?.terrain).toBe(Terrain.Mountain);

    // isValidPlacement: Mountain is not buildable regardless of terrain card
    const rulesResult = isValidPlacement(G.board, mtCoord, Terrain.Grass, G.players[0].id);
    expect(rulesResult).toBe(false);

    const r = doPlace(match, mtCoord);
    expect(r.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-08  Illegal: non-adjacent 2nd placement when adjacent exists
//       (documents the same adapter bug as T-03)
// ─────────────────────────────────────────────────────────────────────────────

describe('T-08: adapter bug — non-adjacent 2nd placement is incorrectly accepted', () => {
  it('getValidPlacements() correctly excludes far cell from 2nd placement options', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    // Place 1st settlement
    const r1 = doPlace(match, { q: 1, r: 1 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;

    const G2 = r1.state.G;

    // Confirm getValidPlacements() correctly excludes (10,10) from 2nd placement
    const validByRules = getValidPlacements(
      G2.board,
      G2.currentTerrainCard!.terrain,
      G2.players[0].id,
      G2.placementsThisTurn
    );
    expect(validByRules.length).toBeGreaterThan(0);
    const farInValid = validByRules.some(c => c.q === 10 && c.r === 10);
    expect(farInValid).toBe(false); // rules.ts correctly excludes it

    // Document current (buggy) engine behaviour: adapter ACCEPTS the far cell
    // because placeSettlement uses isValidPlacement without placementsThisTurn
    const match2 = matchFrom(G2, 0, 'PlaceSettlements');
    const r2 = doPlace(match2, { q: 10, r: 10 });
    // Documenting actual (incorrect) behaviour — should be false after bug fix
    expect(r2.ok).toBe(true); // BUG: should be false; fix moves.ts isValidPlacement call
  });

  it.todo('BUG confirmed: placeSettlement must validate with placementsThisTurn — fix in moves.ts line ~197');
});

// ─────────────────────────────────────────────────────────────────────────────
// T-09  Turn gate: wrong playerId in validateMove → ok:false
// ─────────────────────────────────────────────────────────────────────────────

describe('T-09: turn gate — wrong playerId rejected by validateMove', () => {
  it('playerId=1 on player 0 turn → ok:false (not your turn)', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    const action = { type: 'place_settlement', payload: { q: 1, r: 1 } };

    // playerId=1 means "player at index 1" but currentPlayer is 0
    const vr = validateMove(kingdomGame, match, action, 1);
    expect(vr.ok).toBe(false);
    if (!vr.ok) {
      expect(vr.reason).toContain('not your turn');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-10  Turn gate: correct playerId → ok:true
// ─────────────────────────────────────────────────────────────────────────────

describe('T-10: turn gate — correct playerId accepted by validateMove', () => {
  it('playerId=0 on player 0 turn → ok:true', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    const action = { type: 'place_settlement', payload: { q: 1, r: 1 } };

    // playerId=0 = ctx.currentPlayer = 0 → identity check passes
    const vr = validateMove(kingdomGame, match, action, 0);
    expect(vr.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-11  Victory: remainingSettlements=0 → gameover after endTurn
// ─────────────────────────────────────────────────────────────────────────────

describe('T-11: victory detection when remainingSettlements reaches 0', () => {
  it('endTurn when a player has 0 settlements sets ctx.gameover non-null', () => {
    // Fixture C: Player 1 already has remainingSettlements=0, phase=EndTurn
    const G = makeFixtureC();
    const match = matchFrom(G, 0, 'EndTurn');

    const r = reduce(kingdomGame, match, {
      type: 'end_turn',
      events: { endTurn: true },
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // Victory should be detected (gameover not null)
    expect(r.state.ctx.gameover).not.toBeNull();
    // G.phase should be GameOver
    expect(r.state.G.phase).toBe(GamePhase.GameOver);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-12  Post-gameover: reduce → ok:false
// ─────────────────────────────────────────────────────────────────────────────

describe('T-12: post-gameover moves are rejected', () => {
  it('reduce after gameover returns ok:false', () => {
    const G = makeFixtureC();
    const match = matchFrom(G, 0, 'EndTurn');

    // End the game
    const r = reduce(kingdomGame, match, {
      type: 'end_turn',
      events: { endTurn: true },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.ctx.gameover).not.toBeNull();

    // Any further move should be rejected
    const r2 = reduce(kingdomGame, r.state, {
      type: 'draw_terrain_card',
    });
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.error).toContain('game is over');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-13  PARALLEL VALIDATION: scoring — adapter score == calculatePlayerScore()
// ─────────────────────────────────────────────────────────────────────────────

describe('T-13: parallel validation of scoring', () => {
  it('adapter victory score equals calculatePlayerScore() for same board/player/objectives', () => {
    // Use fixture C with settlements on board for non-trivial scores
    const G = makeFixtureC(true); // withSettlementsOnBoard=true
    const match = matchFrom(G, 0, 'EndTurn');

    // Trigger end-game to get gameover
    const r = reduce(kingdomGame, match, {
      type: 'end_turn',
      events: { endTurn: true },
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.ctx.gameover).not.toBeNull();

    // The adapter computes scores via calculatePlayerScore internally in checkVictory.
    // We verify: directly calling calculatePlayerScore with the same inputs gives same values.
    const boardAfter = r.state.G.board;
    const objectiveCards = G.objectiveCards;

    // Player 1 (id:1): adjacent to Castle at (0,0) via settlement at (1,0)
    const scoreP1Direct = calculatePlayerScore(boardAfter, 1, objectiveCards);
    // Player 2 (id:2): settlement at (2,1), not adjacent to any castle
    const scoreP2Direct = calculatePlayerScore(boardAfter, 2, objectiveCards);

    // The gameover winner is either a player index or 'draw' based on scores
    // The adapter uses calculatePlayerScore to decide — so the highest score wins.
    const gameover = r.state.ctx.gameover;
    if (scoreP1Direct > scoreP2Direct) {
      expect(gameover).toBe(0); // player index 0 wins
    } else if (scoreP2Direct > scoreP1Direct) {
      expect(gameover).toBe(1); // player index 1 wins
    } else {
      expect(gameover).toBe('draw');
    }

    // Additional sanity: scores must be >= 0
    expect(scoreP1Direct).toBeGreaterThanOrEqual(0);
    expect(scoreP2Direct).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bonus T-14  enumerate returns only validateMove-legal coords
// ─────────────────────────────────────────────────────────────────────────────

describe('Bonus T-14: enumerate place_settlement coords are all validateMove-legal', () => {
  it('every coord from enumerate() passes validateMove for playerId=0', () => {
    const G = makeFixtureB();
    const match = matchFrom(G, 0, 'PlaceSettlements');

    // enumerate is defined on the adapter
    const payloads = kingdomGame.enumerate!(match, 'place_settlement', 0);
    expect(payloads.length).toBeGreaterThan(0);

    const invalid: unknown[] = [];
    for (const payload of payloads) {
      const vr = validateMove(
        kingdomGame,
        match,
        { type: 'place_settlement', payload },
        0
      );
      if (!vr.ok) invalid.push(payload);
    }

    expect(invalid).toHaveLength(0);
  });
});

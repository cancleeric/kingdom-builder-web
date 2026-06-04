/**
 * Unit tests for fix #125 — duplicate location tile undo tracking.
 *
 * When a player holds two tiles with the same Location (e.g. Farm×2),
 * undoLastAction must restore the *correct* tile instance to usedThisTurn=false.
 * Before the fix, `.find()` always returned the first match, so undoing the
 * second use would incorrectly toggle the first tile.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { UndoSnapshot } from '../types/history';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset game state between tests. */
function resetStore() {
  useGameStore.getState().initGame(2);
  useGameStore.getState().drawTerrainCard();
}

/**
 * Build a minimal TILE_PLACEMENT UndoSnapshot that points at a specific tile
 * index in the player's tiles array.
 */
function makeTilePlacementSnapshot(tileUsedIndex: number, tileLocation: 'Farm'): UndoSnapshot {
  return {
    type: 'TILE_PLACEMENT',
    coord: { q: 0, r: 0 },
    previousRemainingPlacements: 3,
    previousPhase: GamePhase.PlaceSettlements,
    acquiredLocationKeys: [],
    acquiredTileLocs: [],
    tileUsed: tileLocation as import('../core/terrain').Location,
    tileUsedIndex,
  };
}

// ---------------------------------------------------------------------------
// TC-1: Farm×2 — undo second use leaves first tile untouched
// ---------------------------------------------------------------------------

describe('fix #125 — duplicate location tile undo', () => {
  beforeEach(() => {
    resetStore();
  });

  it('TC-1: Farm×2 undo second use — second tile restored, first stays used', () => {
    // Inject two Farm tiles where [0].usedThisTurn=true, [1].usedThisTurn=true
    // (simulating: player used both tiles this turn, snapshot was for index 1)
    useGameStore.setState(state => ({
      players: state.players.map((p, i) =>
        i !== 0
          ? p
          : {
              ...p,
              tiles: [
                { location: 'Farm' as import('../core/terrain').Location, usedThisTurn: true },
                { location: 'Farm' as import('../core/terrain').Location, usedThisTurn: true },
              ],
            }
      ),
      canUndo: true,
      // Snapshot targets the SECOND tile (index 1)
      undoStack: [makeTilePlacementSnapshot(1, 'Farm')],
    }));

    useGameStore.getState().undoLastAction();

    const tiles = useGameStore.getState().players[0].tiles;
    // index 0 (first Farm) must remain used
    expect(tiles[0].usedThisTurn).toBe(true);
    // index 1 (second Farm) must be restored
    expect(tiles[1].usedThisTurn).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-2: Single Farm — regression: undo still works correctly
  // -------------------------------------------------------------------------

  it('TC-2: single Farm undo regression — tile is correctly un-marked', () => {
    useGameStore.setState(state => ({
      players: state.players.map((p, i) =>
        i !== 0
          ? p
          : {
              ...p,
              tiles: [
                { location: 'Farm' as import('../core/terrain').Location, usedThisTurn: true },
              ],
            }
      ),
      canUndo: true,
      undoStack: [makeTilePlacementSnapshot(0, 'Farm')],
    }));

    useGameStore.getState().undoLastAction();

    const tiles = useGameStore.getState().players[0].tiles;
    expect(tiles[0].usedThisTurn).toBe(false);
  });

  // -------------------------------------------------------------------------
  // TC-3: Farm×2 — undo first use leaves second tile untouched
  // -------------------------------------------------------------------------

  it('TC-3: Farm×2 undo first use — first tile restored, second unaffected', () => {
    // [0].usedThisTurn=true, [1].usedThisTurn=false
    // Snapshot targets index 0 (the first Farm was used)
    useGameStore.setState(state => ({
      players: state.players.map((p, i) =>
        i !== 0
          ? p
          : {
              ...p,
              tiles: [
                { location: 'Farm' as import('../core/terrain').Location, usedThisTurn: true },
                { location: 'Farm' as import('../core/terrain').Location, usedThisTurn: false },
              ],
            }
      ),
      canUndo: true,
      undoStack: [makeTilePlacementSnapshot(0, 'Farm')],
    }));

    useGameStore.getState().undoLastAction();

    const tiles = useGameStore.getState().players[0].tiles;
    // index 0 (first Farm) must be restored
    expect(tiles[0].usedThisTurn).toBe(false);
    // index 1 (second Farm) must remain untouched
    expect(tiles[1].usedThisTurn).toBe(false);
  });
});

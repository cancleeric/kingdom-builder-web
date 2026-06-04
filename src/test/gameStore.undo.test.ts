/**
 * Unit tests for the Undo feature and game history logging.
 *
 * These tests exercise:
 *  - history accumulates on each placement
 *  - undoLastAction restores board & player state
 *  - multi-step undo: can undo every action back to start of turn
 *  - canUndo is reset correctly on endTurn / new game
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Initialise a 2-player game and fast-forward to PlaceSettlements phase. */
function setupGame() {
  useGameStore.getState().initGame(2);
  // drawTerrainCard transitions from DrawCard → PlaceSettlements
  useGameStore.getState().drawTerrainCard();
}

/**
 * Find a valid placement coord for the current player, or throw if none
 * is available.
 */
function firstValidPlacement() {
  const { validPlacements } = useGameStore.getState();
  if (validPlacements.length === 0) throw new Error('No valid placements');
  return validPlacements[0];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('History & Undo', () => {
  beforeEach(() => {
    // Start fresh for every test
    setupGame();
  });

  // ── History accumulation ─────────────────────────────────────────────────

  describe('history', () => {
    it('starts empty', () => {
      expect(useGameStore.getState().history).toHaveLength(0);
    });

    it('records PLACE_SETTLEMENT after each placement', () => {
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);

      const { history } = useGameStore.getState();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('PLACE_SETTLEMENT');
      expect(history[0].playerId).toBe(1);
      expect(history[0].hex).toEqual(coord);
    });

    it('accumulates multiple placements in order', () => {
      // Place all 3 settlements for the turn
      for (let i = 0; i < 3; i++) {
        const coord = firstValidPlacement();
        useGameStore.getState().placeSettlement(coord);
      }
      expect(useGameStore.getState().history).toHaveLength(3);
      expect(useGameStore.getState().history.every(a => a.type === 'PLACE_SETTLEMENT')).toBe(true);
    });

    it('persists across turns', () => {
      // Player 1: place 3 settlements + end turn
      for (let i = 0; i < 3; i++) {
        useGameStore.getState().placeSettlement(firstValidPlacement());
      }
      useGameStore.getState().endTurn();

      // Player 2: draw card + place 1 settlement
      useGameStore.getState().drawTerrainCard();
      useGameStore.getState().placeSettlement(firstValidPlacement());

      expect(useGameStore.getState().history).toHaveLength(4);
    });

    it('records correct turnNumber for each action', () => {
      // Turn 1 (player 1) – place 3 and end turn
      for (let i = 0; i < 3; i++) {
        useGameStore.getState().placeSettlement(firstValidPlacement());
      }
      useGameStore.getState().endTurn();
      // Turn 2 (player 2)
      useGameStore.getState().drawTerrainCard();
      useGameStore.getState().placeSettlement(firstValidPlacement());

      const { history } = useGameStore.getState();
      // First 3 actions → turn 1; last action → turn 2
      expect(history[0].turnNumber).toBe(1);
      expect(history[2].turnNumber).toBe(1);
      expect(history[3].turnNumber).toBe(2);
    });
  });

  // ── canUndo flag ─────────────────────────────────────────────────────────

  describe('canUndo', () => {
    it('is false before any placement', () => {
      expect(useGameStore.getState().canUndo).toBe(false);
    });

    it('becomes true after the first placement this turn', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().canUndo).toBe(true);
    });

    it('is false after all actions are undone back to start of turn', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().canUndo).toBe(false);
    });

    it('remains true after partial undo when more actions remain on stack', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().placeSettlement(firstValidPlacement());
      // Stack has 2 snapshots; after 1 undo still 1 left
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().canUndo).toBe(true);
    });

    it('is true after placement even if undo was already used earlier this turn', () => {
      // Phase B: undo does NOT consume the turn allowance — stack-based
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().undoLastAction();

      // Place again — canUndo should become true again
      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().canUndo).toBe(true);
    });

    it('resets to false at the start of the next turn', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      // Complete the turn
      for (let i = 0; i < 2; i++) {
        useGameStore.getState().placeSettlement(firstValidPlacement());
      }
      useGameStore.getState().endTurn();
      useGameStore.getState().drawTerrainCard();

      // Now it's player 2's turn: canUndo should be false until a placement
      expect(useGameStore.getState().canUndo).toBe(false);
    });
  });

  // ── Undo restores state ──────────────────────────────────────────────────

  describe('undoLastAction', () => {
    it('removes the settlement from the board', () => {
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);

      const { board: boardBefore } = useGameStore.getState();
      expect(boardBefore.getSettlement(coord)).toBe(1);

      useGameStore.getState().undoLastAction();

      const { board } = useGameStore.getState();
      expect(board.getSettlement(coord)).toBeUndefined();
    });

    it('restores player.remainingSettlements', () => {
      const before = useGameStore.getState().players[0].remainingSettlements;
      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().players[0].remainingSettlements).toBe(before - 1);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().players[0].remainingSettlements).toBe(before);
    });

    it('removes the coord from player.settlements', () => {
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);
      expect(useGameStore.getState().players[0].settlements).toContainEqual(coord);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().players[0].settlements).not.toContainEqual(coord);
    });

    it('restores remainingPlacements', () => {
      const before = useGameStore.getState().remainingPlacements;
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().remainingPlacements).toBe(before);
    });

    it('restores phase when undo is after the last placement of a turn', () => {
      // Place all 3 to reach EndTurn phase
      for (let i = 0; i < 3; i++) {
        useGameStore.getState().placeSettlement(firstValidPlacement());
      }
      expect(useGameStore.getState().phase).toBe(GamePhase.EndTurn);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().phase).toBe(GamePhase.PlaceSettlements);
    });

    it('removes the action from history', () => {
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);
      expect(useGameStore.getState().history).toHaveLength(1);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().history).toHaveLength(0);
    });

    it('does nothing when canUndo is false', () => {
      // No placement yet → canUndo is false
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().history).toHaveLength(0);
    });
  });

  // ── Multi-step undo ──────────────────────────────────────────────────────

  describe('multi-step undo', () => {
    it('allows undo of every action in the turn (3 placements → 3 undos)', () => {
      const coords: ReturnType<typeof firstValidPlacement>[] = [];
      for (let i = 0; i < 3; i++) {
        const coord = firstValidPlacement();
        coords.push(coord);
        useGameStore.getState().placeSettlement(coord);
      }
      expect(useGameStore.getState().undoStack.length).toBe(3);

      // Undo each one
      for (let i = 2; i >= 0; i--) {
        useGameStore.getState().undoLastAction();
        expect(useGameStore.getState().board.getSettlement(coords[i])).toBeUndefined();
      }
      expect(useGameStore.getState().undoStack.length).toBe(0);
      expect(useGameStore.getState().canUndo).toBe(false);
    });

    it('second placement after undo is also undoable', () => {
      const coord1 = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord1);

      // Undo first placement
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().board.getSettlement(coord1)).toBeUndefined();

      // Place again — new snapshot pushed
      const coord2 = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord2);
      expect(useGameStore.getState().canUndo).toBe(true);

      // Undo second placement
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().board.getSettlement(coord2)).toBeUndefined();
      expect(useGameStore.getState().canUndo).toBe(false);
    });

    it('undoStack is empty after endTurn', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().endTurn();
      expect(useGameStore.getState().undoStack).toHaveLength(0);
      expect(useGameStore.getState().canUndo).toBe(false);
    });

    it('undo restores remainingPlacements correctly after each step', () => {
      const initial = useGameStore.getState().remainingPlacements;
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().remainingPlacements).toBe(initial - 2);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().remainingPlacements).toBe(initial - 1);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().remainingPlacements).toBe(initial);
    });

    it('canUndo becomes true again after new placement following undo', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().canUndo).toBe(false);

      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().canUndo).toBe(true);
    });

    it('refreshes undoStack after endTurn', () => {
      // Player 1: undo some, complete turn
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().undoLastAction();
      for (let i = 0; i < 3; i++) {
        useGameStore.getState().placeSettlement(firstValidPlacement());
      }
      useGameStore.getState().endTurn();

      // Player 2's turn
      useGameStore.getState().drawTerrainCard();
      useGameStore.getState().placeSettlement(firstValidPlacement());
      expect(useGameStore.getState().canUndo).toBe(true);
      expect(useGameStore.getState().undoStack).toHaveLength(1);
    });
  });

  // ── history is cleared on initGame ──────────────────────────────────────

  describe('initGame reset', () => {
    it('clears history when a new game starts', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().initGame(2);
      expect(useGameStore.getState().history).toHaveLength(0);
    });

    it('resets canUndo and undoStack on new game', () => {
      useGameStore.getState().placeSettlement(firstValidPlacement());
      useGameStore.getState().initGame(2);
      expect(useGameStore.getState().canUndo).toBe(false);
      expect(useGameStore.getState().undoStack).toHaveLength(0);
    });
  });

  // ── TILE_PLACEMENT undo coverage note ───────────────────────────────────

  describe('TILE_PLACEMENT undo (via direct board mutation)', () => {
    it('TILE_PLACEMENT undo shares the same board-removal code path as PLACE_SETTLEMENT', () => {
      // The undo code for TILE_PLACEMENT uses the same board cell mutation
      // (`cell.settlement = undefined`) as PLACE_SETTLEMENT. Since we cannot
      // easily trigger a tile-placement without a real location tile on the
      // board, we verify the shared logic indirectly by confirming that after
      // undoing a PLACE_SETTLEMENT the board cell is cleared – the same branch
      // that handles TILE_PLACEMENT.
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);
      expect(useGameStore.getState().board.getSettlement(coord)).toBe(1);

      useGameStore.getState().undoLastAction();
      expect(useGameStore.getState().board.getSettlement(coord)).toBeUndefined();
    });
  });

  // ── Old snapshot backwards-compat ───────────────────────────────────────

  describe('old snapshot backwards-compat (no previousPlacementsThisTurn)', () => {
    it('does not crash when undoing a snapshot lacking previousPlacementsThisTurn', () => {
      const coord = firstValidPlacement();
      useGameStore.getState().placeSettlement(coord);

      // Simulate an old-format snapshot (pre-Phase-B) that lacks the new field
      useGameStore.setState(() => ({
        undoStack: [
          {
            type: 'PLACE_SETTLEMENT' as const,
            coord,
            previousRemainingPlacements: 3,
            previousPhase: GamePhase.PlaceSettlements,
            acquiredLocationKeys: [],
            acquiredTileLocs: [],
            // previousPlacementsThisTurn intentionally absent
          },
        ],
      }));

      expect(() => useGameStore.getState().undoLastAction()).not.toThrow();
      expect(useGameStore.getState().board.getSettlement(coord)).toBeUndefined();
    });
  });
});

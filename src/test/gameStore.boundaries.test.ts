/**
 * Unit tests for src/store/gameStore.ts — boundary and edge-case coverage
 *
 * Covers:
 *  - initGame: playerCount boundaries (1, 5 → rejected; 2, 3, 4 → accepted)
 *  - initGame: array-configs boundary (same count rules)
 *  - initGame: botDifficulty field is preserved on player objects
 *  - gameOptions: enableUndo=false makes canUndo always false
 *  - drawTerrainCard: wrong phase guard
 *  - placeSettlement: wrong phase guard
 *  - endTurn: wrong phase guard
 *  - selectCell: sets / clears selectedCell
 *  - initGame with 'medium' boardSize creates a board
 *  - initGame with 'small' boardSize creates a board
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { GamePhase, BotDifficulty } from '../types';
import { Board } from '../core/board';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupGame(playerCount = 2) {
  useGameStore.getState().initGame(playerCount);
}

function advanceToPlaceSettlements() {
  setupGame(2);
  useGameStore.getState().drawTerrainCard();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('initGame — playerCount number boundary', () => {
  it('rejects playerCount=1 (below minimum 2)', () => {
    // Should log error and return without changing phase from Setup
    useGameStore.setState({ phase: GamePhase.Setup });
    useGameStore.getState().initGame(1);
    // If rejected, phase stays unchanged or players remain empty
    // The guard does console.error + return so players won't be populated
    const state = useGameStore.getState();
    // Still setup, players unchanged
    expect(state.players.length).not.toBe(1);
  });

  it('rejects playerCount=5 (above maximum 4)', () => {
    useGameStore.getState().initGame(5);
    // Guard fires: players should NOT be 5
    expect(useGameStore.getState().players.length).not.toBe(5);
  });

  it('accepts playerCount=2 — creates 2 players in DrawCard phase', () => {
    useGameStore.getState().initGame(2);
    const s = useGameStore.getState();
    expect(s.players).toHaveLength(2);
    expect(s.phase).toBe(GamePhase.DrawCard);
  });

  it('accepts playerCount=3', () => {
    useGameStore.getState().initGame(3);
    expect(useGameStore.getState().players).toHaveLength(3);
  });

  it('accepts playerCount=4', () => {
    useGameStore.getState().initGame(4);
    expect(useGameStore.getState().players).toHaveLength(4);
  });
});

describe('initGame — PlayerConfig array boundary', () => {
  it('rejects array with 1 config', () => {
    useGameStore.getState().initGame([{ name: 'Solo', type: 'human', difficulty: BotDifficulty.Medium }]);
    // Should not start game with 1 player
    const s = useGameStore.getState();
    expect(s.players.length).not.toBe(1);
  });

  it('rejects array with 5 configs', () => {
    const configs = Array.from({ length: 5 }, (_, i) => ({
      name: `P${i + 1}`,
      type: 'human' as const,
      difficulty: BotDifficulty.Medium,
    }));
    useGameStore.getState().initGame(configs);
    expect(useGameStore.getState().players.length).not.toBe(5);
  });

  it('accepts array with 2 configs', () => {
    useGameStore.getState().initGame([
      { name: 'Alice', type: 'human', difficulty: BotDifficulty.Medium },
      { name: 'Bob', type: 'human', difficulty: BotDifficulty.Medium },
    ]);
    const s = useGameStore.getState();
    expect(s.players).toHaveLength(2);
    expect(s.players[0].name).toBe('Alice');
    expect(s.players[1].name).toBe('Bob');
  });
});

describe('initGame — botDifficulty preserved', () => {
  it('preserves Easy difficulty on bot player', () => {
    useGameStore.getState().initGame([
      { name: 'Human', type: 'human', difficulty: BotDifficulty.Medium },
      { name: 'EasyBot', type: 'bot', difficulty: BotDifficulty.Easy },
    ]);
    const s = useGameStore.getState();
    expect(s.players[1].isBot).toBe(true);
    expect(s.players[1].difficulty).toBe(BotDifficulty.Easy);
  });

  it('preserves Hard difficulty on bot player', () => {
    useGameStore.getState().initGame([
      { name: 'Human', type: 'human', difficulty: BotDifficulty.Medium },
      { name: 'HardBot', type: 'bot', difficulty: BotDifficulty.Hard },
    ]);
    const s = useGameStore.getState();
    expect(s.players[1].difficulty).toBe(BotDifficulty.Hard);
  });

  it('marks type=bot players as isBot=true', () => {
    useGameStore.getState().initGame([
      { name: 'Human', type: 'human', difficulty: BotDifficulty.Medium },
      { name: 'Bot', type: 'bot', difficulty: BotDifficulty.Medium },
    ]);
    const s = useGameStore.getState();
    expect(s.players[0].isBot).toBe(false);
    expect(s.players[1].isBot).toBe(true);
  });
});

describe('initGame — enableUndo=false', () => {
  it('canUndo stays false even after placement when enableUndo is false', () => {
    useGameStore.getState().initGame(2, {
      boardSize: 'large',
      objectiveCount: 3,
      enableUndo: false,
    });
    useGameStore.getState().drawTerrainCard();

    const { validPlacements } = useGameStore.getState();
    if (validPlacements.length > 0) {
      useGameStore.getState().placeSettlement(validPlacements[0]);
      expect(useGameStore.getState().canUndo).toBe(false);
    }
  });
});

describe('initGame — boardSize options', () => {
  it('small boardSize creates a board', () => {
    useGameStore.getState().initGame(2, { boardSize: 'small', objectiveCount: 3, enableUndo: true });
    const s = useGameStore.getState();
    expect(s.board).toBeInstanceOf(Board);
    expect(s.phase).toBe(GamePhase.DrawCard);
  });

  it('medium boardSize creates a board', () => {
    useGameStore.getState().initGame(2, { boardSize: 'medium', objectiveCount: 3, enableUndo: true });
    expect(useGameStore.getState().board).toBeInstanceOf(Board);
  });
});

describe('initGame — objectiveCount', () => {
  it('creates objectiveCards matching objectiveCount=2', () => {
    useGameStore.getState().initGame(2, { boardSize: 'large', objectiveCount: 2, enableUndo: true });
    expect(useGameStore.getState().objectiveCards).toHaveLength(2);
  });

  it('creates objectiveCards matching objectiveCount=3', () => {
    useGameStore.getState().initGame(2, { boardSize: 'large', objectiveCount: 3, enableUndo: true });
    expect(useGameStore.getState().objectiveCards).toHaveLength(3);
  });
});

describe('drawTerrainCard — phase guard', () => {
  it('does nothing when phase is not DrawCard', () => {
    advanceToPlaceSettlements();
    const before = useGameStore.getState().currentTerrainCard;
    // Phase is now PlaceSettlements — second draw should be rejected
    useGameStore.getState().drawTerrainCard();
    expect(useGameStore.getState().currentTerrainCard).toBe(before);
  });
});

describe('placeSettlement — phase guards', () => {
  it('does nothing when phase is DrawCard', () => {
    setupGame(2);
    const coord = { q: 0, r: 0 };
    const settlementsBefore = useGameStore.getState().players[0].settlements.length;
    useGameStore.getState().placeSettlement(coord);
    expect(useGameStore.getState().players[0].settlements.length).toBe(settlementsBefore);
  });

  it('does nothing when coord is not in validPlacements', () => {
    advanceToPlaceSettlements();
    const invalidCoord = { q: -999, r: -999 };
    const settlementsBefore = useGameStore.getState().players[0].settlements.length;
    useGameStore.getState().placeSettlement(invalidCoord);
    expect(useGameStore.getState().players[0].settlements.length).toBe(settlementsBefore);
  });
});

describe('endTurn — phase guard', () => {
  it('does nothing when phase is DrawCard', () => {
    setupGame(2);
    const playerIndexBefore = useGameStore.getState().currentPlayerIndex;
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().currentPlayerIndex).toBe(playerIndexBefore);
  });

  it('does nothing when phase is PlaceSettlements', () => {
    advanceToPlaceSettlements();
    const playerIndexBefore = useGameStore.getState().currentPlayerIndex;
    useGameStore.getState().endTurn();
    expect(useGameStore.getState().currentPlayerIndex).toBe(playerIndexBefore);
  });
});

describe('selectCell', () => {
  beforeEach(() => setupGame(2));

  it('sets selectedCell to provided coord', () => {
    const coord = { q: 2, r: 3 };
    useGameStore.getState().selectCell(coord);
    expect(useGameStore.getState().selectedCell).toEqual(coord);
  });

  it('clears selectedCell when null is passed', () => {
    useGameStore.getState().selectCell({ q: 1, r: 1 });
    useGameStore.getState().selectCell(null);
    expect(useGameStore.getState().selectedCell).toBeNull();
  });
});

describe('cancelTile', () => {
  it('resets activeTile and related state', () => {
    setupGame(2);
    // Manually inject activeTile state
    useGameStore.setState({ activeTile: 'Farm' as unknown as import('../core/terrain').Location });
    useGameStore.getState().cancelTile();
    expect(useGameStore.getState().activeTile).toBeNull();
    expect(useGameStore.getState().tileMoveSources).toHaveLength(0);
    expect(useGameStore.getState().tileMoveFrom).toBeNull();
  });
});

describe('initGame — resets all key counters', () => {
  it('resets turnNumber to 1', () => {
    useGameStore.getState().initGame(2);
    expect(useGameStore.getState().turnNumber).toBe(1);
  });

  it('resets undoStack and canUndo', () => {
    useGameStore.getState().initGame(2);
    expect(useGameStore.getState().undoStack).toHaveLength(0);
    expect(useGameStore.getState().canUndo).toBe(false);
  });

  it('resets acquiredLocations to empty array', () => {
    useGameStore.getState().initGame(2);
    expect(useGameStore.getState().acquiredLocations).toHaveLength(0);
  });

  it('resets placementsThisTurn to empty array', () => {
    useGameStore.getState().initGame(2);
    expect(useGameStore.getState().placementsThisTurn).toHaveLength(0);
  });
});

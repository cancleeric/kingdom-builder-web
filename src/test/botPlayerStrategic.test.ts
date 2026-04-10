/**
 * Unit tests for the Strategic AI (Hard difficulty) in src/ai/botPlayer.ts
 *
 * Covers:
 *  1. evaluateMoveStrategic: returns 0 delta for neutral move (Fisherman, no water)
 *  2. evaluateMoveStrategic: Miners – positive delta adjacent to Mountain
 *  3. evaluateMoveStrategic: Miners – zero delta when not adjacent to Mountain
 *  4. evaluateMoveStrategic: Citizens – positive delta adjacent to Castle
 *  5. evaluateMoveStrategic: Citizens – zero delta when not adjacent to Castle
 *  6. evaluateMoveStrategic: Lords – entering new quadrant beats staying in same
 *  7. evaluateMoveStrategic: Farmers – majority-quadrant placement gives positive delta
 *  8. evaluateMoveStrategic: Hermits – adjacent-to-own gives negative delta
 *  9. evaluateMoveStrategic: Hermits – isolated placement gives positive delta
 * 10. evaluateMoveStrategic: Merchants – new terrain type gives positive delta
 * 11. evaluateMoveStrategic: Merchants – same terrain type gives 0 delta
 * 12. evaluateMoveStrategic: two positive objectives yield higher delta than one
 * 13. selectBestMoves (Hard): prefers castle-adjacent with Citizens
 * 14. selectBestMoves (Hard): prefers mountain-adjacent with Miners
 * 15. selectBestMoves (Hard): does not mutate original board
 * 16. selectBestMoves (Hard): returns [] when no valid placements
 * 17. selectBestMoves (Hard): returns up to count placements
 * 18. selectBestMoves (Hard): works with no objective cards (heuristic fallback)
 * 19. BotPlayer.chooseMoves (Hard): accepts objectiveCards, returns valid moves
 * 20. BotPlayer.evaluateMove (Hard): delegates to evaluateMoveStrategic
 * 21. BotPlayer.evaluateMove (Hard): falls back to heuristic with no cards
 * 22. Hard AI achieves higher Citizens score than Easy AI over 20 rounds
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import { BotDifficulty } from '../types';
import { ObjectiveCard, scoreObjectiveCard } from '../core/scoring';
import {
  evaluateMoveStrategic,
  evaluateMove,
  selectBestMoves,
  BotPlayer,
} from '../ai/botPlayer';
import type { HexCell } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBoard(width = 10, height = 10): Board {
  const board = new Board(width, height);
  for (let q = 0; q < width; q++) {
    for (let r = 0; r < height; r++) {
      const cell: HexCell = {
        coord: { q, r },
        terrain: Terrain.Grass,
        settlement: undefined,
      };
      board.setCell(cell);
    }
  }
  return board;
}

function setLocation(board: Board, q: number, r: number, location: Location): void {
  const cell = board.getCell({ q, r });
  if (cell) cell.location = location;
}

function setTerrain(board: Board, q: number, r: number, terrain: Terrain): void {
  const cell = board.getCell({ q, r });
  if (cell) cell.terrain = terrain;
}

function placeSettlement(board: Board, q: number, r: number, playerId: number): void {
  board.placeSettlement({ q, r }, playerId);
}

// ---------------------------------------------------------------------------
// evaluateMoveStrategic tests
// ---------------------------------------------------------------------------

describe('evaluateMoveStrategic', () => {
  it('returns 0 when placement does not change any objective score (Fisherman, no water)', () => {
    const board = makeBoard();
    const delta = evaluateMoveStrategic(board, { q: 5, r: 5 }, 1, [ObjectiveCard.Fisherman]);
    expect(delta).toBe(0);
  });

  it('returns positive delta for Miners: placement adjacent to Mountain', () => {
    const board = makeBoard();
    setTerrain(board, 5, 5, Terrain.Mountain);
    const delta = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Miners]);
    expect(delta).toBeGreaterThan(0);
  });

  it('returns 0 for Miners: placement NOT adjacent to Mountain', () => {
    const board = makeBoard();
    setTerrain(board, 0, 0, Terrain.Mountain);
    const delta = evaluateMoveStrategic(board, { q: 9, r: 9 }, 1, [ObjectiveCard.Miners]);
    expect(delta).toBe(0);
  });

  it('returns positive delta for Citizens: placement adjacent to Castle', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    const delta = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Citizens]);
    expect(delta).toBeGreaterThan(0);
  });

  it('returns 0 for Citizens: placement NOT adjacent to Castle', () => {
    const board = makeBoard();
    setLocation(board, 0, 0, Location.Castle);
    const delta = evaluateMoveStrategic(board, { q: 9, r: 9 }, 1, [ObjectiveCard.Citizens]);
    expect(delta).toBe(0);
  });

  it('returns positive delta for Lords: entering a new quadrant beats staying in an occupied quadrant', () => {
    const board = makeBoard(20, 20);
    for (let q = 0; q < 20; q++) {
      for (let r = 0; r < 20; r++) {
        board.setCell({ coord: { q, r }, terrain: Terrain.Grass });
      }
    }
    placeSettlement(board, 3, 3, 1);
    placeSettlement(board, 3, 4, 1);
    // NE quadrant (q>=10, r<10) is unoccupied → higher delta
    const deltaNE = evaluateMoveStrategic(board, { q: 12, r: 5 }, 1, [ObjectiveCard.Lords]);
    // NW quadrant already occupied → lower delta
    const deltaNW = evaluateMoveStrategic(board, { q: 4, r: 4 }, 1, [ObjectiveCard.Lords]);
    expect(deltaNE).toBeGreaterThan(deltaNW);
  });

  it('returns positive delta for Farmers: placing in majority quadrant', () => {
    const board = makeBoard(20, 20);
    for (let q = 0; q < 20; q++) {
      for (let r = 0; r < 20; r++) {
        board.setCell({ coord: { q, r }, terrain: Terrain.Grass });
      }
    }
    placeSettlement(board, 1, 1, 1);
    placeSettlement(board, 2, 2, 1);
    placeSettlement(board, 3, 3, 1);
    const deltaNW = evaluateMoveStrategic(board, { q: 4, r: 3 }, 1, [ObjectiveCard.Farmers]);
    expect(deltaNW).toBeGreaterThan(0);
  });

  it('returns negative delta for Hermits: placing next to own settlement', () => {
    const board = makeBoard();
    placeSettlement(board, 5, 5, 1);
    const delta = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Hermits]);
    expect(delta).toBeLessThan(0);
  });

  it('returns positive delta for Hermits: placing isolated', () => {
    const board = makeBoard();
    placeSettlement(board, 1, 1, 1);
    const delta = evaluateMoveStrategic(board, { q: 9, r: 9 }, 1, [ObjectiveCard.Hermits]);
    expect(delta).toBeGreaterThan(0);
  });

  it('returns positive delta for Merchants: placing on a new terrain type', () => {
    const board = makeBoard();
    setTerrain(board, 5, 5, Terrain.Desert);
    const delta = evaluateMoveStrategic(board, { q: 5, r: 5 }, 1, [ObjectiveCard.Merchants]);
    expect(delta).toBeGreaterThan(0);
  });

  it('returns 0 for Merchants: placing on same terrain type already occupied', () => {
    const board = makeBoard();
    placeSettlement(board, 3, 3, 1);
    const delta = evaluateMoveStrategic(board, { q: 7, r: 7 }, 1, [ObjectiveCard.Merchants]);
    expect(delta).toBe(0);
  });

  it('two positive objectives yield higher combined delta than each alone', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    // Add Mountain adjacent to (4,5) as well
    setTerrain(board, 4, 4, Terrain.Mountain);

    const deltaCitizens = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Citizens]);
    const deltaMiners = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Miners]);
    const deltaMulti = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [
      ObjectiveCard.Citizens,
      ObjectiveCard.Miners,
    ]);

    // Combined must be strictly greater than each individual delta
    expect(deltaCitizens).toBeGreaterThan(0);
    expect(deltaMiners).toBeGreaterThan(0);
    expect(deltaMulti).toBeGreaterThan(deltaCitizens);
    expect(deltaMulti).toBeGreaterThan(deltaMiners);
  });
});

// ---------------------------------------------------------------------------
// selectBestMoves (Hard) strategic tests
// ---------------------------------------------------------------------------

describe('selectBestMoves – Hard difficulty with objective cards', () => {
  it('prefers castle-adjacent cell with Citizens objective', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);

    const moves = selectBestMoves(
      board, Terrain.Grass, 1, BotDifficulty.Hard, 1, [ObjectiveCard.Citizens]
    );
    expect(moves.length).toBe(1);

    const castleNeighbours = [
      { q: 6, r: 5 }, { q: 6, r: 4 }, { q: 5, r: 4 },
      { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 5, r: 6 },
    ];
    const isAdjacent = castleNeighbours.some(n => n.q === moves[0].q && n.r === moves[0].r);
    expect(isAdjacent).toBe(true);
  });

  it('prefers mountain-adjacent cell with Miners objective', () => {
    const board = makeBoard();
    setTerrain(board, 5, 5, Terrain.Mountain);

    const moves = selectBestMoves(
      board, Terrain.Grass, 1, BotDifficulty.Hard, 1, [ObjectiveCard.Miners]
    );
    expect(moves.length).toBe(1);

    const mountainNeighbours = [
      { q: 6, r: 5 }, { q: 6, r: 4 }, { q: 5, r: 4 },
      { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 5, r: 6 },
    ];
    const isAdjacent = mountainNeighbours.some(n => n.q === moves[0].q && n.r === moves[0].r);
    expect(isAdjacent).toBe(true);
  });

  it('does not mutate the original board', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    const before = board.getAllCells().filter(c => c.settlement !== undefined).length;

    selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Hard, 3, [ObjectiveCard.Citizens]);

    const after = board.getAllCells().filter(c => c.settlement !== undefined).length;
    expect(after).toBe(before);
  });

  it('returns [] when no valid placements exist', () => {
    const board = makeBoard();
    const moves = selectBestMoves(
      board, Terrain.Canyon, 1, BotDifficulty.Hard, 3, [ObjectiveCard.Citizens]
    );
    expect(moves).toEqual([]);
  });

  it('returns up to count placements', () => {
    const board = makeBoard();
    const moves = selectBestMoves(
      board, Terrain.Grass, 1, BotDifficulty.Hard, 3, [ObjectiveCard.Miners]
    );
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.length).toBeLessThanOrEqual(3);
  });

  it('works correctly with no objective cards (falls back to heuristic)', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Hard, 1, []);
    expect(moves.length).toBe(1);
    const cell = board.getCell(moves[0]);
    expect(cell).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// BotPlayer class – Hard difficulty tests
// ---------------------------------------------------------------------------

describe('BotPlayer (Hard difficulty) – Strategic AI', () => {
  it('chooseMoves accepts objectiveCards and returns valid moves', () => {
    const board = makeBoard();
    const bot = new BotPlayer(1, BotDifficulty.Hard);
    const moves = bot.chooseMoves(board, Terrain.Grass, 3, [ObjectiveCard.Citizens]);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.length).toBeLessThanOrEqual(3);
    for (const coord of moves) {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    }
  });

  it('evaluateMove delegates to evaluateMoveStrategic when objectiveCards provided', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    const bot = new BotPlayer(1, BotDifficulty.Hard);

    const strategicScore = bot.evaluateMove(board, { q: 4, r: 5 }, [ObjectiveCard.Citizens]);
    const expected = evaluateMoveStrategic(board, { q: 4, r: 5 }, 1, [ObjectiveCard.Citizens]);
    expect(strategicScore).toBe(expected);
  });

  it('evaluateMove falls back to heuristic when no objectiveCards provided', () => {
    const board = makeBoard();
    setLocation(board, 5, 5, Location.Castle);
    const bot = new BotPlayer(1, BotDifficulty.Hard);

    const score = bot.evaluateMove(board, { q: 4, r: 5 });
    const expected = evaluateMove(board, { q: 4, r: 5 }, 1);
    expect(score).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Difficulty comparison – Hard AI vs Easy AI
// ---------------------------------------------------------------------------

describe('Hard AI vs Easy AI – strategic advantage', () => {
  it('Hard AI achieves higher Citizens score than Easy AI over 20 rounds', () => {
    let hardWins = 0;

    for (let round = 0; round < 20; round++) {
      const hardBoard = makeBoard();
      setLocation(hardBoard, 5, 5, Location.Castle);

      const easyBoard = makeBoard();
      setLocation(easyBoard, 5, 5, Location.Castle);

      const hardMoves = selectBestMoves(
        hardBoard, Terrain.Grass, 1, BotDifficulty.Hard, 1, [ObjectiveCard.Citizens]
      );
      const easyMoves = selectBestMoves(
        easyBoard, Terrain.Grass, 2, BotDifficulty.Easy, 1, [ObjectiveCard.Citizens]
      );

      if (hardMoves.length > 0 && easyMoves.length > 0) {
        hardBoard.placeSettlement(hardMoves[0], 1);
        easyBoard.placeSettlement(easyMoves[0], 2);

        const hardScore = scoreObjectiveCard(ObjectiveCard.Citizens, hardBoard, 1);
        const easyScore = scoreObjectiveCard(ObjectiveCard.Citizens, easyBoard, 2);

        if (hardScore >= easyScore) hardWins++;
      }
    }

    // Hard AI should win or tie at least 80% of rounds
    expect(hardWins).toBeGreaterThanOrEqual(16);
  });
});

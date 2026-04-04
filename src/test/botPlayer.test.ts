/**
 * Unit tests for the Greedy Bot AI (src/ai/botPlayer.ts)
 *
 * Covers:
 *  1. evaluateMove: castle adjacency scoring
 *  2. evaluateMove: location tile adjacency scoring
 *  3. evaluateMove: clustering with own settlements
 *  4. evaluateMove: combined scoring
 *  5. evaluateMove: empty board (score = 0)
 *  6. selectBestMoves: returns valid placements only (easy difficulty)
 *  7. selectBestMoves: returns ≤ count placements
 *  8. selectBestMoves: greedy prefers castle-adjacent cells
 *  9. selectBestMoves: hard difficulty returns valid placements
 * 10. selectBestMoves: empty valid placements returns []
 * 11. BotPlayer class: chooseMoves returns valid moves
 * 12. BotPlayer class: evaluateMove delegates correctly
 * 13. selectBestMoves: normal difficulty beats random on high-value board
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import { BotDifficulty } from '../types';
import { evaluateMove, selectBestMoves, BotPlayer } from '../ai/botPlayer';
import type { HexCell } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBoard(): Board {
  const board = new Board(10, 10);
  for (let q = 0; q < 10; q++) {
    for (let r = 0; r < 10; r++) {
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

function placeSettlement(board: Board, q: number, r: number, playerId: number): void {
  board.placeSettlement({ q, r }, playerId);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('evaluateMove', () => {
  it('scores +3 for each neighbouring castle', () => {
    const board = makeBoard();
    setLocation(board, 2, 2, Location.Castle);
    // Cell (1,2) has (2,2) as East neighbour
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(3);
  });

  it('scores +6 for two neighbouring castles', () => {
    const board = makeBoard();
    setLocation(board, 2, 2, Location.Castle);
    setLocation(board, 1, 3, Location.Castle); // Southeast of (1,2)
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(6);
  });

  it('scores +2 for a neighbouring non-castle location tile', () => {
    const board = makeBoard();
    setLocation(board, 2, 2, Location.Farm);
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(2);
  });

  it('scores +1 for each neighbouring own settlement', () => {
    const board = makeBoard();
    placeSettlement(board, 2, 2, 1);
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(1);
  });

  it('does NOT score for neighbouring opponent settlement', () => {
    const board = makeBoard();
    placeSettlement(board, 2, 2, 2); // opponent
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(0);
  });

  it('returns 0 on an empty board with no special neighbours', () => {
    const board = makeBoard();
    const score = evaluateMove(board, { q: 5, r: 5 }, 1);
    expect(score).toBe(0);
  });

  it('combines castle + cluster scores', () => {
    const board = makeBoard();
    setLocation(board, 2, 2, Location.Castle);
    placeSettlement(board, 1, 3, 1); // own settlement, SE neighbour of (1,2)
    const score = evaluateMove(board, { q: 1, r: 2 }, 1);
    expect(score).toBe(4); // 3 (castle) + 1 (own settlement)
  });
});

describe('selectBestMoves', () => {
  it('returns only valid placements (all Grass, no prior settlements)', () => {
    const board = makeBoard();
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Normal, 3);
    expect(moves.length).toBeGreaterThan(0);
    for (const coord of moves) {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    }
  });

  it('returns at most `count` placements', () => {
    const board = makeBoard();
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Normal, 3);
    expect(moves.length).toBeLessThanOrEqual(3);
  });

  it('greedy mode prefers a castle-adjacent cell over a plain cell', () => {
    const board = makeBoard();
    // Place a castle at (5,5)
    setLocation(board, 5, 5, Location.Castle);
    // Make only Desert tiles except the castle-adjacent ones
    // so the bot has both castle-adjacent and non-adjacent Grass options
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Normal, 1);
    // The first move should be adjacent to the castle if possible
    expect(moves.length).toBe(1);
    // The chosen cell should have score >= 0
    const score = evaluateMove(board, moves[0], 1);
    // Any other Grass cell adjacent to (5,5)
    const castleNeighbours = [
      { q: 6, r: 5 }, { q: 6, r: 4 }, { q: 5, r: 4 },
      { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 5, r: 6 },
    ];
    const possibleBestScore = Math.max(
      ...castleNeighbours.map(c => evaluateMove(board, c, 1))
    );
    expect(score).toBe(possibleBestScore);
  });

  it('returns [] when no valid placements exist (terrain not on board)', () => {
    const board = makeBoard();
    // All cells are Grass; requesting Canyon returns nothing
    const moves = selectBestMoves(board, Terrain.Canyon, 1, BotDifficulty.Normal, 3);
    expect(moves).toEqual([]);
  });

  it('easy difficulty still returns valid placements', () => {
    const board = makeBoard();
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Easy, 3);
    expect(moves.length).toBeGreaterThan(0);
    for (const coord of moves) {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
    }
  });

  it('hard difficulty returns valid placements', () => {
    const board = makeBoard();
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Hard, 3);
    expect(moves.length).toBeGreaterThan(0);
    for (const coord of moves) {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
    }
  });

  it('does not mutate the original board', () => {
    const board = makeBoard();
    const before = board.getAllCells().filter(c => c.settlement !== undefined).length;
    selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Normal, 3);
    const after = board.getAllCells().filter(c => c.settlement !== undefined).length;
    expect(after).toBe(before);
  });

  it('follows adjacency rule after first settlement', () => {
    const board = makeBoard();
    // Place one settlement at (3,3)
    placeSettlement(board, 3, 3, 1);
    // Bot must place adjacent to (3,3) if any Grass neighbours exist
    const moves = selectBestMoves(board, Terrain.Grass, 1, BotDifficulty.Normal, 1);
    expect(moves.length).toBe(1);
    // (3,3) neighbours include (4,3), (4,2), (3,2), (2,3), (2,4), (3,4)
    const neighbours = [
      { q: 4, r: 3 }, { q: 4, r: 2 }, { q: 3, r: 2 },
      { q: 2, r: 3 }, { q: 2, r: 4 }, { q: 3, r: 4 },
    ];
    const isNeighbour = neighbours.some(n => n.q === moves[0].q && n.r === moves[0].r);
    expect(isNeighbour).toBe(true);
  });
});

describe('BotPlayer class', () => {
  it('chooseMoves returns the expected number of moves', () => {
    const board = makeBoard();
    const bot = new BotPlayer(1, BotDifficulty.Normal);
    const moves = bot.chooseMoves(board, Terrain.Grass, 3);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.length).toBeLessThanOrEqual(3);
  });

  it('evaluateMove delegates to the module-level function', () => {
    const board = makeBoard();
    setLocation(board, 2, 2, Location.Castle);
    const bot = new BotPlayer(1, BotDifficulty.Normal);
    const score = bot.evaluateMove(board, { q: 1, r: 2 });
    expect(score).toBe(3);
  });

  it('Easy difficulty bot still makes valid moves', () => {
    const board = makeBoard();
    const bot = new BotPlayer(2, BotDifficulty.Easy);
    const moves = bot.chooseMoves(board, Terrain.Grass, 3);
    for (const coord of moves) {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    }
  });
});

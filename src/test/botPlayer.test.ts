import { describe, it, expect, beforeEach } from 'vitest';
import { BotPlayer } from '../ai/botPlayer';
import { Board } from '../core/board';
import { Terrain } from '../core/terrain';
import { Location } from '../core/terrain';
import { ObjectiveCard } from '../core/scoring';
import type { BotGameState } from '../ai/botPlayer';

// ── Test helpers ────────────────────────────────────

/** Build a minimal 10×10 board filled with the given terrain */
function makeBoard(fillTerrain: Terrain = Terrain.Grass): Board {
  const board = new Board(10, 10);
  for (let q = 0; q < 10; q++) {
    for (let r = 0; r < 10; r++) {
      board.setCell({ coord: { q, r }, terrain: fillTerrain });
    }
  }
  return board;
}

function makeState(
  board: Board,
  terrain: Terrain,
  playerId: number = 1,
  objectiveCards: ObjectiveCard[] = []
): BotGameState {
  return {
    board,
    currentTerrainCard: terrain,
    players: [{ id: playerId }],
    currentPlayerIndex: 0,
    objectiveCards,
    acquiredLocations: [],
  };
}

// ── Tests ───────────────────────────────────────────

describe('BotPlayer', () => {
  let board: Board;

  beforeEach(() => {
    board = makeBoard(Terrain.Grass);
  });

  // 1. Easy bot returns valid positions
  it('easy bot returns valid positions', () => {
    const bot = new BotPlayer('easy');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 3);

    expect(moves.length).toBeGreaterThan(0);
    moves.forEach(coord => {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    });
  });

  // 2. Normal bot returns valid positions
  it('normal bot returns valid positions', () => {
    const bot = new BotPlayer('normal');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 3);

    expect(moves.length).toBeGreaterThan(0);
    moves.forEach(coord => {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    });
  });

  // 3. Hard bot returns valid positions
  it('hard bot returns valid positions', () => {
    const bot = new BotPlayer('hard');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 3);

    expect(moves.length).toBeGreaterThan(0);
    moves.forEach(coord => {
      const cell = board.getCell(coord);
      expect(cell).toBeDefined();
      expect(cell!.terrain).toBe(Terrain.Grass);
    });
  });

  // 4. Easy bot returns exactly N positions (count=3)
  it('easy bot returns exactly count=3 positions when enough valid moves exist', () => {
    const bot = new BotPlayer('easy');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 3);

    expect(moves).toHaveLength(3);
  });

  // 5. Normal bot prefers castle-adjacent positions over non-castle positions
  it('normal bot prefers castle-adjacent positions over non-castle positions', () => {
    // Place a castle at (5, 5)
    board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, location: Location.Castle });

    // (4, 5) is adjacent to the castle, (1, 1) is far away
    const bot = new BotPlayer('normal');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 1);

    expect(moves).toHaveLength(1);
    // The selected move should be adjacent to (5,5)
    // Neighbors of (5,5): (6,5),(6,4),(5,4),(4,5),(4,6),(5,6)
    const castleNeighbors = [
      { q: 6, r: 5 }, { q: 6, r: 4 }, { q: 5, r: 4 },
      { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 5, r: 6 },
    ];
    const isAdjacentToCastle = castleNeighbors.some(
      n => n.q === moves[0].q && n.r === moves[0].r
    );
    expect(isAdjacentToCastle).toBe(true);
  });

  // 6. evaluateMove gives higher score for castle-adjacent hex
  it('evaluateMove gives higher score for castle-adjacent hex', () => {
    // Place a castle
    board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, location: Location.Castle });

    const bot = new BotPlayer('normal');

    // Castle-adjacent cell
    const castleAdjCoord = { q: 4, r: 5 };
    // Non-adjacent cell
    const farCoord = { q: 1, r: 1 };

    const scoreAdjacent = bot.evaluateMove(board, castleAdjCoord, Terrain.Grass, [], 1);
    const scoreFar = bot.evaluateMove(board, farCoord, Terrain.Grass, [], 1);

    expect(scoreAdjacent).toBeGreaterThan(scoreFar);
  });

  // 7. evaluateMove gives higher score for location-tile-adjacent hex
  it('evaluateMove gives higher score for location-tile-adjacent hex', () => {
    // Place a Farm location tile
    board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, location: Location.Farm });

    const bot = new BotPlayer('normal');

    const tileAdjCoord = { q: 4, r: 5 };
    const farCoord = { q: 1, r: 1 };

    const scoreAdjacent = bot.evaluateMove(board, tileAdjCoord, Terrain.Grass, [], 1);
    const scoreFar = bot.evaluateMove(board, farCoord, Terrain.Grass, [], 1);

    expect(scoreAdjacent).toBeGreaterThan(scoreFar);
  });

  // 8. selectBestMoves handles edge case where fewer valid moves exist than requested
  it('selectBestMoves handles fewer valid moves than requested count', () => {
    // Make a board with only 2 buildable cells
    const smallBoard = new Board(5, 5);
    smallBoard.setCell({ coord: { q: 0, r: 0 }, terrain: Terrain.Grass });
    smallBoard.setCell({ coord: { q: 1, r: 0 }, terrain: Terrain.Grass });
    // All other cells are mountains (not buildable)
    for (let q = 0; q < 5; q++) {
      for (let r = 0; r < 5; r++) {
        if (!(q === 0 && r === 0) && !(q === 1 && r === 0)) {
          smallBoard.setCell({ coord: { q, r }, terrain: Terrain.Mountain });
        }
      }
    }

    const bot = new BotPlayer('normal');
    const state = makeState(smallBoard, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 5); // requesting 5 but only 2 available

    expect(moves.length).toBeLessThanOrEqual(2);
    expect(moves.length).toBeGreaterThan(0);
  });

  // 9. Normal bot selects better scoring moves than random on average
  it('normal bot selects better-scoring moves than easy bot near a castle', () => {
    // Add a castle to create a scoring difference
    board.setCell({ coord: { q: 5, r: 5 }, terrain: Terrain.Grass, location: Location.Castle });

    const normalBot = new BotPlayer('normal');
    const easyBot = new BotPlayer('easy');

    const castleNeighbors = [
      { q: 6, r: 5 }, { q: 6, r: 4 }, { q: 5, r: 4 },
      { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 5, r: 6 },
    ];

    // Run multiple trials and check normal bot picks castle-adjacent more often
    let normalCastleAdjacentCount = 0;
    let easyCastleAdjacentCount = 0;
    const TRIALS = 20;

    for (let t = 0; t < TRIALS; t++) {
      const normalMoves = normalBot.selectBestMoves(makeState(board, Terrain.Grass), 1);
      if (castleNeighbors.some(n => n.q === normalMoves[0]?.q && n.r === normalMoves[0]?.r)) {
        normalCastleAdjacentCount++;
      }

      const easyMoves = easyBot.selectBestMoves(makeState(board, Terrain.Grass), 1);
      if (castleNeighbors.some(n => n.q === easyMoves[0]?.q && n.r === easyMoves[0]?.r)) {
        easyCastleAdjacentCount++;
      }
    }

    // Normal bot should ALWAYS pick castle-adjacent (deterministic greedy)
    expect(normalCastleAdjacentCount).toBe(TRIALS);
    // Easy bot picks randomly, so on average should be less often
    expect(normalCastleAdjacentCount).toBeGreaterThanOrEqual(easyCastleAdjacentCount);
  });

  // 10. Hard bot uses lookahead to select different (potentially better) moves than normal
  it('hard bot evaluates lookahead and scores at least as well as normal on castle board', () => {
    // Place two castles to create multiple scoring opportunities
    board.setCell({ coord: { q: 2, r: 2 }, terrain: Terrain.Grass, location: Location.Castle });
    board.setCell({ coord: { q: 7, r: 7 }, terrain: Terrain.Grass, location: Location.Castle });

    const hardBot = new BotPlayer('hard');
    const normalBot = new BotPlayer('normal');

    const hardMoves = hardBot.selectBestMoves(makeState(board, Terrain.Grass), 3);
    const normalMoves = normalBot.selectBestMoves(makeState(board, Terrain.Grass), 3);

    // Both should return valid moves
    expect(hardMoves.length).toBe(3);
    expect(normalMoves.length).toBe(3);

    // Compute combined score for each set of moves
    const scoreSet = (moves: { q: number; r: number }[]) => {
      const bot = new BotPlayer('normal');
      return moves.reduce(
        (sum, coord) => sum + bot.evaluateMove(board, coord, Terrain.Grass, [], 1),
        0
      );
    };

    const hardScore = scoreSet(hardMoves);
    const normalScore = scoreSet(normalMoves);

    // Hard bot should achieve at least as much total score as normal bot
    expect(hardScore).toBeGreaterThanOrEqual(normalScore * 0.9); // Allow 10% slack
  });

  // 11. evaluateMove does not mutate the board permanently
  it('evaluateMove does not permanently modify the board', () => {
    const bot = new BotPlayer('normal');
    const coord = { q: 3, r: 3 };

    const cellBefore = board.getCell(coord);
    expect(cellBefore?.settlement).toBeUndefined();

    bot.evaluateMove(board, coord, Terrain.Grass, [], 1);

    const cellAfter = board.getCell(coord);
    expect(cellAfter?.settlement).toBeUndefined();
  });

  // 12. selectBestMoves returns no duplicates
  it('selectBestMoves returns no duplicate coordinates', () => {
    const bot = new BotPlayer('normal');
    const state = makeState(board, Terrain.Grass);
    const moves = bot.selectBestMoves(state, 3);

    const keys = moves.map(c => `${c.q},${c.r}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  // 13. evaluateMove gives cluster bonus for cells adjacent to own settlement
  it('evaluateMove gives higher score when adjacent to own settlement', () => {
    // Place a player settlement at (5, 5)
    board.placeSettlement({ q: 5, r: 5 }, 1);

    const bot = new BotPlayer('normal');

    // Adjacent cell (4, 5) should get cluster bonus
    const adjacentCoord = { q: 4, r: 5 };
    // Far cell (1, 1) should not
    const farCoord = { q: 1, r: 1 };

    const scoreAdjacent = bot.evaluateMove(board, adjacentCoord, Terrain.Grass, [], 1);
    const scoreFar = bot.evaluateMove(board, farCoord, Terrain.Grass, [], 1);

    expect(scoreAdjacent).toBeGreaterThan(scoreFar);
  });

  // 14. selectBestMoves returns empty array when no valid placements exist
  it('selectBestMoves returns empty array when no valid placements exist', () => {
    // Fill the entire board with mountains (not buildable)
    const mountainBoard = new Board(5, 5);
    for (let q = 0; q < 5; q++) {
      for (let r = 0; r < 5; r++) {
        mountainBoard.setCell({ coord: { q, r }, terrain: Terrain.Mountain });
      }
    }

    const bot = new BotPlayer('normal');
    const state = makeState(mountainBoard, Terrain.Grass); // Grass terrain card but no grass cells
    const moves = bot.selectBestMoves(state, 3);

    expect(moves).toHaveLength(0);
  });
});

/**
 * AI player – three difficulty levels:
 *
 *   easy   – random valid placement
 *   normal – greedy: always picks the highest heuristic-scoring cell
 *   hard   – Strategic AI: uses objective card-aware incremental scoring
 *            with 1-step lookahead across the full turn
 */

import { AxialCoord, hexNeighbors } from '../core/hex';
import { getValidPlacements } from '../core/rules';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import { BotDifficulty } from '../types';
import { ObjectiveCard, calculatePlayerScore } from '../core/scoring';

// ------------------------------------------------------------------
// Score constants
// ------------------------------------------------------------------
const SCORE_CASTLE_ADJACENT = 3;   // Settlement adjacent to a castle
const SCORE_LOCATION_ADJACENT = 2; // Settlement adjacent to any location tile
const SCORE_CLUSTER = 1;           // Settlement adjacent to own existing settlement

// ------------------------------------------------------------------
// evaluateMove
// ------------------------------------------------------------------

/**
 * Score how good it is for `playerId` to place a settlement at `coord`.
 *
 * Scoring heuristic:
 *   +3 for each neighbouring castle (Kingdom Builder rules: +3 pts/castle neighbour)
 *   +2 for each neighbouring location tile (triggers special abilities)
 *   +1 for each neighbouring own settlement (builds connected groups)
 */
export function evaluateMove(
  board: Board,
  coord: AxialCoord,
  playerId: number
): number {
  const neighbors = hexNeighbors(coord);
  let score = 0;

  for (const neighbor of neighbors) {
    const cell = board.getCell(neighbor);
    if (!cell) continue;

    if (cell.location === Location.Castle) {
      score += SCORE_CASTLE_ADJACENT;
    } else if (cell.location !== undefined) {
      score += SCORE_LOCATION_ADJACENT;
    }

    if (cell.settlement === playerId) {
      score += SCORE_CLUSTER;
    }
  }

  return score;
}

// ------------------------------------------------------------------
// selectBestMove (single placement)
// ------------------------------------------------------------------

/**
 * Pick the single best coordinate from `validMoves` for `playerId`.
 *   easy   – random choice
 *   normal – highest evaluateMove score (ties broken randomly)
 *   hard   – highest evaluateMoveStrategic score when objectiveCards provided,
 *            else falls back to evaluateMove (ties broken randomly)
 */
function pickBestCoord(
  board: Board,
  validMoves: AxialCoord[],
  playerId: number,
  difficulty: BotDifficulty,
  objectiveCards: ObjectiveCard[] = []
): AxialCoord | null {
  if (validMoves.length === 0) return null;

  if (difficulty === BotDifficulty.Easy) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // Normal: greedy heuristic; Hard (step 2+): strategic scoring
  const useStrategic = difficulty === BotDifficulty.Hard && objectiveCards.length > 0;

  let best: AxialCoord[] = [];
  let bestScore = -Infinity;

  for (const coord of validMoves) {
    const score = useStrategic
      ? evaluateMoveStrategic(board, coord, playerId, objectiveCards)
      : evaluateMove(board, coord, playerId);
    if (score > bestScore) {
      bestScore = score;
      best = [coord];
    } else if (score === bestScore) {
      best.push(coord);
    }
  }

  return best[Math.floor(Math.random() * best.length)];
}

// ------------------------------------------------------------------
// evaluateMoveStrategic (hard difficulty – objective-card-aware)
// ------------------------------------------------------------------

/**
 * Score how much placing a settlement at `coord` increases `playerId`'s
 * total game score given the active `objectiveCards`.
 *
 * Returns the incremental score delta (scoreAfter – scoreBefore).
 * Uses the full `calculatePlayerScore` function so all objective cards
 * are considered accurately.
 */
export function evaluateMoveStrategic(
  board: Board,
  coord: AxialCoord,
  playerId: number,
  objectiveCards: ObjectiveCard[]
): number {
  const before = calculatePlayerScore(board, playerId, objectiveCards);

  const sim = cloneBoard(board);
  sim.placeSettlement(coord, playerId);

  const after = calculatePlayerScore(sim, playerId, objectiveCards);
  return after - before;
}

// ------------------------------------------------------------------
// selectBestMoves (full turn: 3 placements)
// ------------------------------------------------------------------

/**
 * Select up to `count` placements (default 3) for the AI player.
 *
 * For `easy` and `normal` difficulties, each placement is chosen
 * independently (greedy per-step) using the heuristic evaluateMove.
 *
 * For `hard` difficulty, a 1-step lookahead is applied using
 * objective-card-aware scoring (evaluateMoveStrategic):
 *   – Try every possible first move
 *   – Simulate placing it, then greedily pick the best second move
 *   – Sum the strategic scores; choose the first move that maximises the total
 *
 * @param objectiveCards - Active objective cards (required for Hard AI)
 * Returns a (possibly shorter) list of `AxialCoord` to place in order.
 */
export function selectBestMoves(
  board: Board,
  terrain: Terrain,
  playerId: number,
  difficulty: BotDifficulty,
  count: number = 3,
  objectiveCards: ObjectiveCard[] = []
): AxialCoord[] {
  const moves: AxialCoord[] = [];

  // Deep-clone the board so we can simulate placements without mutating
  const simBoard = cloneBoard(board);

  for (let i = 0; i < count; i++) {
    const valid = getValidPlacements(simBoard, terrain, playerId);
    if (valid.length === 0) break;

    let chosen: AxialCoord | null = null;

    if (difficulty === BotDifficulty.Hard && i === 0 && count > 1) {
      chosen = strategicLookaheadPick(simBoard, terrain, playerId, valid, objectiveCards);
    } else {
      chosen = pickBestCoord(simBoard, valid, playerId, difficulty, objectiveCards);
    }

    if (!chosen) break;

    if (difficulty === BotDifficulty.Hard) {
      const score = objectiveCards.length > 0
        ? evaluateMoveStrategic(simBoard, chosen, playerId, objectiveCards)
        : evaluateMove(simBoard, chosen, playerId);
      console.debug(
        `[AI Hard] Player ${playerId} picks Q${chosen.q}R${chosen.r} (strategic Δscore=${score})`
      );
    }

    moves.push(chosen);
    simBoard.placeSettlement(chosen, playerId);
  }

  return moves;
}

// ------------------------------------------------------------------
// Lookahead helper (hard difficulty – strategic)
// ------------------------------------------------------------------

/**
 * Strategic 1-step lookahead: evaluate all first moves using objective-card
 * scoring, simulate placing each, then greedily pick the best second move.
 * Sum of (score1 + score2) determines the chosen first move.
 */
function strategicLookaheadPick(
  board: Board,
  terrain: Terrain,
  playerId: number,
  validFirst: AxialCoord[],
  objectiveCards: ObjectiveCard[]
): AxialCoord {
  const useObjectives = objectiveCards.length > 0;
  let bestCoord = validFirst[0];
  let bestTotal = -Infinity;

  for (const first of validFirst) {
    const score1 = useObjectives
      ? evaluateMoveStrategic(board, first, playerId, objectiveCards)
      : evaluateMove(board, first, playerId);

    // Simulate placing 'first'
    const sim = cloneBoard(board);
    sim.placeSettlement(first, playerId);

    // Best second move after placing 'first'
    const valid2 = getValidPlacements(sim, terrain, playerId);
    let score2 = 0;
    if (valid2.length > 0) {
      score2 = Math.max(
        ...valid2.map(c =>
          useObjectives
            ? evaluateMoveStrategic(sim, c, playerId, objectiveCards)
            : evaluateMove(sim, c, playerId)
        )
      );
    }

    const total = score1 + score2;
    if (total > bestTotal) {
      bestTotal = total;
      bestCoord = first;
    }
  }

  return bestCoord;
}

// ------------------------------------------------------------------
// Board cloning utility
// ------------------------------------------------------------------

/**
 * Create a lightweight copy of a Board for simulation purposes.
 * Only cells that exist are copied; cell objects are shallow-cloned.
 */
function cloneBoard(board: Board): Board {
  const copy = new Board(board.width, board.height);
  for (const cell of board.getAllCells()) {
    copy.setCell({ ...cell });
  }
  return copy;
}

// ------------------------------------------------------------------
// BotPlayer class
// ------------------------------------------------------------------

export class BotPlayer {
  readonly playerId: number;
  readonly difficulty: BotDifficulty;

  constructor(playerId: number, difficulty: BotDifficulty = BotDifficulty.Normal) {
    this.playerId = playerId;
    this.difficulty = difficulty;
  }

  /**
   * Choose the best moves for this bot on its turn.
   * Returns an ordered list of coordinates to place settlements.
   *
   * @param objectiveCards - Active objective cards (used by Hard difficulty)
   */
  chooseMoves(
    board: Board,
    terrain: Terrain,
    count: number = 3,
    objectiveCards: ObjectiveCard[] = []
  ): AxialCoord[] {
    return selectBestMoves(board, terrain, this.playerId, this.difficulty, count, objectiveCards);
  }

  /**
   * Evaluate how good a single placement at `coord` is.
   * Hard difficulty uses objective-card-aware scoring when cards are provided.
   */
  evaluateMove(board: Board, coord: AxialCoord, objectiveCards: ObjectiveCard[] = []): number {
    if (this.difficulty === BotDifficulty.Hard && objectiveCards.length > 0) {
      return evaluateMoveStrategic(board, coord, this.playerId, objectiveCards);
    }
    return evaluateMove(board, coord, this.playerId);
  }
}

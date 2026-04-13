import { AxialCoord, hexNeighbors } from '../core/hex';
import { getValidPlacements } from '../core/rules';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import { BotDifficulty } from '../types';
import { ObjectiveCard, calculatePlayerScore, scoreCastle } from '../core/scoring';

// ------------------------------------------------------------------
// Score constants
// ------------------------------------------------------------------
const SCORE_CASTLE_ADJACENT = 3;
const SCORE_LOCATION_ADJACENT = 2;
const SCORE_CLUSTER = 1;

const MEDIUM_CANDIDATE_LIMIT = 10;
const HARD_CANDIDATE_LIMIT = 8;
const HARD_OPPONENT_CANDIDATE_LIMIT = 6;
const HARD_MAX_DEPTH = 3;

export interface BotStrategyContext {
  objectiveCards?: ObjectiveCard[];
  opponentIds?: number[];
}

export function normalizeDifficulty(difficulty: BotDifficulty): BotDifficulty {
  return difficulty === BotDifficulty.Normal ? BotDifficulty.Medium : difficulty;
}

// ------------------------------------------------------------------
// evaluateMove (legacy heuristic)
// ------------------------------------------------------------------

/**
 * Score how good it is for `playerId` to place a settlement at `coord`.
 *
 * Legacy scoring heuristic:
 *   +3 for each neighbouring castle
 *   +2 for each neighbouring location tile
 *   +1 for each neighbouring own settlement
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
// Strategic evaluators (medium/hard)
// ------------------------------------------------------------------

function evaluateMoveStrategic(
  board: Board,
  coord: AxialCoord,
  playerId: number,
  terrain: Terrain,
  context?: BotStrategyContext
): number {
  const immediate = evaluateMove(board, coord, playerId);
  const beforeObjectiveScore = context?.objectiveCards?.length
    ? calculatePlayerScore(board, playerId, context.objectiveCards)
    : 0;

  const sim = cloneBoard(board);
  sim.placeSettlement(coord, playerId);

  const objectiveDelta = context?.objectiveCards?.length
    ? calculatePlayerScore(sim, playerId, context.objectiveCards) - beforeObjectiveScore
    : 0;

  let expansionPotential = 0;
  let connectionStrength = 0;
  let pressureOnOpponents = 0;

  for (const neighbor of hexNeighbors(coord)) {
    const cell = sim.getCell(neighbor);
    if (!cell) continue;

    if (cell.settlement === undefined) {
      expansionPotential += 1;
    } else if (cell.settlement === playerId) {
      connectionStrength += 1;
    } else {
      pressureOnOpponents += 1;
    }
  }

  const mobility = getValidPlacements(sim, terrain, playerId).length;

  return (
    immediate * 4 +
    objectiveDelta * 7 +
    expansionPotential * 0.45 +
    connectionStrength * 0.65 +
    pressureOnOpponents * 0.5 +
    mobility * 0.04
  );
}

function evaluateBoardState(
  board: Board,
  maximizingPlayerId: number,
  terrain: Terrain,
  context?: BotStrategyContext
): number {
  const objectiveCards = context?.objectiveCards ?? [];
  const opponents = context?.opponentIds ?? [];

  const selfObjectiveScore = objectiveCards.length
    ? calculatePlayerScore(board, maximizingPlayerId, objectiveCards)
    : scoreCastle(board, maximizingPlayerId);

  const selfMobility = getValidPlacements(board, terrain, maximizingPlayerId).length;
  const selfSettlements = board.getPlayerSettlements(maximizingPlayerId).length;

  let strongestOpponentScore = 0;
  let strongestOpponentMobility = 0;
  for (const opponentId of opponents) {
    const opponentScore = objectiveCards.length
      ? calculatePlayerScore(board, opponentId, objectiveCards)
      : scoreCastle(board, opponentId);
    const opponentMobility = getValidPlacements(board, terrain, opponentId).length;
    if (opponentScore > strongestOpponentScore) strongestOpponentScore = opponentScore;
    if (opponentMobility > strongestOpponentMobility) strongestOpponentMobility = opponentMobility;
  }

  return (
    selfObjectiveScore * 11 +
    selfSettlements * 0.3 +
    selfMobility * 0.08 -
    strongestOpponentScore * 6 -
    strongestOpponentMobility * 0.05
  );
}

function getCandidateMoves(
  board: Board,
  terrain: Terrain,
  playerId: number,
  difficulty: BotDifficulty,
  limit: number,
  context?: BotStrategyContext
): AxialCoord[] {
  const valid = getValidPlacements(board, terrain, playerId);
  if (valid.length <= limit) return valid;

  const normalized = normalizeDifficulty(difficulty);
  if (normalized === BotDifficulty.Easy) {
    return [...valid]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  return [...valid]
    .sort((a, b) => {
      const scoreA = evaluateMoveStrategic(board, a, playerId, terrain, context);
      const scoreB = evaluateMoveStrategic(board, b, playerId, terrain, context);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return Math.random() - 0.5;
    })
    .slice(0, limit);
}

function pickBestCoordStrategic(
  board: Board,
  validMoves: AxialCoord[],
  playerId: number,
  terrain: Terrain,
  context?: BotStrategyContext
): AxialCoord | null {
  if (validMoves.length === 0) return null;

  let best: AxialCoord[] = [];
  let bestScore = -Infinity;

  for (const coord of validMoves) {
    const score = evaluateMoveStrategic(board, coord, playerId, terrain, context);
    if (score > bestScore) {
      bestScore = score;
      best = [coord];
    } else if (score === bestScore) {
      best.push(coord);
    }
  }

  return best[Math.floor(Math.random() * best.length)] ?? null;
}

// ------------------------------------------------------------------
// Hard mode alpha-beta search
// ------------------------------------------------------------------

function alphaBeta(
  board: Board,
  terrain: Terrain,
  maximizingPlayerId: number,
  currentPlayerId: number,
  depth: number,
  alpha: number,
  beta: number,
  maximizingTurn: boolean,
  context?: BotStrategyContext
): number {
  if (depth <= 0) {
    return evaluateBoardState(board, maximizingPlayerId, terrain, context);
  }

  const branchLimit = maximizingTurn ? HARD_CANDIDATE_LIMIT : HARD_OPPONENT_CANDIDATE_LIMIT;
  const candidates = getCandidateMoves(
    board,
    terrain,
    currentPlayerId,
    BotDifficulty.Hard,
    branchLimit,
    context
  );

  if (candidates.length === 0) {
    return evaluateBoardState(board, maximizingPlayerId, terrain, context);
  }

  const firstOpponentId = context?.opponentIds?.[0];

  if (maximizingTurn) {
    let value = -Infinity;
    for (const move of candidates) {
      const sim = cloneBoard(board);
      sim.placeSettlement(move, currentPlayerId);

      const nextIsOpponent = firstOpponentId !== undefined;
      const nextPlayerId = nextIsOpponent ? firstOpponentId : maximizingPlayerId;
      const result = alphaBeta(
        sim,
        terrain,
        maximizingPlayerId,
        nextPlayerId,
        depth - 1,
        alpha,
        beta,
        !nextIsOpponent,
        context
      );
      if (result > value) value = result;
      if (result > alpha) alpha = result;
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of candidates) {
    const sim = cloneBoard(board);
    sim.placeSettlement(move, currentPlayerId);

    const result = alphaBeta(
      sim,
      terrain,
      maximizingPlayerId,
      maximizingPlayerId,
      depth - 1,
      alpha,
      beta,
      true,
      context
    );
    if (result < value) value = result;
    if (result < beta) beta = result;
    if (alpha >= beta) break;
  }
  return value;
}

function pickHardMove(
  board: Board,
  terrain: Terrain,
  playerId: number,
  remainingPlacements: number,
  context?: BotStrategyContext
): AxialCoord | null {
  const candidates = getCandidateMoves(
    board,
    terrain,
    playerId,
    BotDifficulty.Hard,
    HARD_CANDIDATE_LIMIT,
    context
  );
  if (candidates.length === 0) return null;

  const firstOpponentId = context?.opponentIds?.[0];
  const searchDepth = firstOpponentId
    ? Math.min(HARD_MAX_DEPTH, Math.max(1, remainingPlacements * 2 - 1))
    : Math.min(2, Math.max(1, remainingPlacements));

  let bestMove = candidates[0];
  let bestValue = -Infinity;

  for (const move of candidates) {
    const sim = cloneBoard(board);
    sim.placeSettlement(move, playerId);

    const value = alphaBeta(
      sim,
      terrain,
      playerId,
      firstOpponentId ?? playerId,
      searchDepth - 1,
      -Infinity,
      Infinity,
      firstOpponentId === undefined,
      context
    );

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

// ------------------------------------------------------------------
// selectBestMoves (full turn)
// ------------------------------------------------------------------

/**
 * Select up to `count` placements for the AI player.
 *
 * easy: random valid placements
 * medium: strategic heuristic greedy
 * hard: strategic alpha-beta search (with optional opponent lookahead)
 * normal: legacy alias for medium
 */
export function selectBestMoves(
  board: Board,
  terrain: Terrain,
  playerId: number,
  difficulty: BotDifficulty,
  count: number = 3,
  context?: BotStrategyContext
): AxialCoord[] {
  const resolvedDifficulty = normalizeDifficulty(difficulty);
  const moves: AxialCoord[] = [];
  const simBoard = cloneBoard(board);

  for (let i = 0; i < count; i++) {
    const valid = getValidPlacements(simBoard, terrain, playerId);
    if (valid.length === 0) break;

    let chosen: AxialCoord | null = null;

    if (resolvedDifficulty === BotDifficulty.Easy) {
      chosen = valid[Math.floor(Math.random() * valid.length)] ?? null;
    } else if (resolvedDifficulty === BotDifficulty.Medium) {
      const mediumCandidates =
        valid.length > MEDIUM_CANDIDATE_LIMIT
          ? getCandidateMoves(
              simBoard,
              terrain,
              playerId,
              BotDifficulty.Medium,
              MEDIUM_CANDIDATE_LIMIT,
              context
            )
          : valid;
      chosen = pickBestCoordStrategic(simBoard, mediumCandidates, playerId, terrain, context);
    } else {
      chosen = pickHardMove(simBoard, terrain, playerId, count - i, context);
    }

    if (!chosen) break;

    moves.push(chosen);
    simBoard.placeSettlement(chosen, playerId);
  }

  return moves;
}

// ------------------------------------------------------------------
// Board cloning utility
// ------------------------------------------------------------------

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

  constructor(playerId: number, difficulty: BotDifficulty = BotDifficulty.Medium) {
    this.playerId = playerId;
    this.difficulty = difficulty;
  }

  chooseMoves(
    board: Board,
    terrain: Terrain,
    count: number = 3,
    context?: BotStrategyContext
  ): AxialCoord[] {
    return selectBestMoves(board, terrain, this.playerId, this.difficulty, count, context);
  }

  evaluateMove(board: Board, coord: AxialCoord): number {
    return evaluateMove(board, coord, this.playerId);
  }
}

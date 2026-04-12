import { AxialCoord, hexNeighbors } from '../core/hex';
import { getValidPlacements } from '../core/rules';
import { Board } from '../core/board';
import { Terrain, Location } from '../core/terrain';
import { calculatePlayerScore, type ObjectiveCard } from '../core/scoring';
import { BotDifficulty } from '../types';

const SCORE_CASTLE_ADJACENT = 3;
const SCORE_LOCATION_ADJACENT = 2;
const SCORE_CLUSTER = 1;

const HARD_SEARCH_DEPTH = 3;
const HARD_BRANCH_FACTOR = 10;

export interface BotStrategyContext {
  objectiveCards?: ObjectiveCard[];
  opponentIds?: number[];
}

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

function getEffectiveDifficulty(difficulty: BotDifficulty): BotDifficulty {
  return difficulty === BotDifficulty.Normal ? BotDifficulty.Medium : difficulty;
}

function countOpenNeighbors(board: Board, coord: AxialCoord): number {
  let open = 0;
  for (const neighbor of hexNeighbors(coord)) {
    const cell = board.getCell(neighbor);
    if (cell && cell.settlement === undefined) {
      open++;
    }
  }
  return open;
}

function countContestedNeighbors(
  board: Board,
  coord: AxialCoord,
  opponentIds: number[]
): number {
  if (opponentIds.length === 0) return 0;
  const opponents = new Set(opponentIds);
  let contested = 0;

  for (const neighbor of hexNeighbors(coord)) {
    const cell = board.getCell(neighbor);
    if (cell?.settlement !== undefined && opponents.has(cell.settlement)) {
      contested++;
    }
  }

  return contested;
}

function strategicScoreDelta(
  board: Board,
  coord: AxialCoord,
  playerId: number,
  objectiveCards: ObjectiveCard[]
): number {
  if (objectiveCards.length === 0) return 0;
  const before = calculatePlayerScore(board, playerId, objectiveCards);
  const sim = cloneBoard(board);
  sim.placeSettlement(coord, playerId);
  const after = calculatePlayerScore(sim, playerId, objectiveCards);
  return after - before;
}

function evaluateMoveStrategic(
  board: Board,
  coord: AxialCoord,
  terrain: Terrain,
  playerId: number,
  objectiveCards: ObjectiveCard[],
  opponentIds: number[]
): number {
  const immediate = evaluateMove(board, coord, playerId);
  const scoreDelta = strategicScoreDelta(board, coord, playerId, objectiveCards);

  const sim = cloneBoard(board);
  sim.placeSettlement(coord, playerId);
  const mobility = getValidPlacements(sim, terrain, playerId).length;
  const openness = countOpenNeighbors(board, coord);
  const contested = countContestedNeighbors(board, coord, opponentIds);

  return (
    immediate +
    scoreDelta * 2.5 +
    mobility * 0.15 +
    openness * 0.2 +
    contested * 0.6
  );
}

function pickRandom(validMoves: AxialCoord[]): AxialCoord | null {
  if (validMoves.length === 0) return null;
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}

function pickGreedyStrategic(
  board: Board,
  terrain: Terrain,
  validMoves: AxialCoord[],
  playerId: number,
  objectiveCards: ObjectiveCard[],
  opponentIds: number[]
): AxialCoord | null {
  if (validMoves.length === 0) return null;

  let best: AxialCoord[] = [];
  let bestScore = -Infinity;

  for (const coord of validMoves) {
    const score = evaluateMoveStrategic(
      board,
      coord,
      terrain,
      playerId,
      objectiveCards,
      opponentIds
    );
    if (score > bestScore) {
      bestScore = score;
      best = [coord];
    } else if (score === bestScore) {
      best.push(coord);
    }
  }

  return best[Math.floor(Math.random() * best.length)];
}

function evaluateBoardState(
  board: Board,
  terrain: Terrain,
  playerId: number,
  objectiveCards: ObjectiveCard[],
  primaryOpponentId: number | undefined
): number {
  const selfScore =
    objectiveCards.length > 0
      ? calculatePlayerScore(board, playerId, objectiveCards)
      : board.getPlayerSettlements(playerId).length;
  const selfMobility = getValidPlacements(board, terrain, playerId).length;

  let oppScore = 0;
  let oppMobility = 0;
  if (primaryOpponentId !== undefined) {
    oppScore =
      objectiveCards.length > 0
        ? calculatePlayerScore(board, primaryOpponentId, objectiveCards)
        : board.getPlayerSettlements(primaryOpponentId).length;
    oppMobility = getValidPlacements(board, terrain, primaryOpponentId).length;
  }

  return selfScore - oppScore * 0.9 + (selfMobility - oppMobility) * 0.1;
}

function getOrderedCandidates(
  board: Board,
  terrain: Terrain,
  playerId: number,
  objectiveCards: ObjectiveCard[],
  opponentIds: number[],
  maximizing: boolean
): AxialCoord[] {
  const validMoves = getValidPlacements(board, terrain, playerId);
  const scored = validMoves.map(coord => ({
    coord,
    score: evaluateMoveStrategic(
      board,
      coord,
      terrain,
      playerId,
      objectiveCards,
      opponentIds
    ),
  }));

  scored.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));
  return scored.slice(0, HARD_BRANCH_FACTOR).map(s => s.coord);
}

function alphaBetaValue(
  board: Board,
  terrain: Terrain,
  maximizingPlayerId: number,
  minimizingPlayerId: number | undefined,
  objectiveCards: ObjectiveCard[],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  const currentPlayerId = maximizing ? maximizingPlayerId : minimizingPlayerId;
  if (depth === 0 || currentPlayerId === undefined) {
    return evaluateBoardState(
      board,
      terrain,
      maximizingPlayerId,
      objectiveCards,
      minimizingPlayerId
    );
  }

  const candidates = getOrderedCandidates(
    board,
    terrain,
    currentPlayerId,
    objectiveCards,
    currentPlayerId === maximizingPlayerId ? [minimizingPlayerId].filter(Boolean) as number[] : [maximizingPlayerId],
    maximizing
  );

  if (candidates.length === 0) {
    return evaluateBoardState(
      board,
      terrain,
      maximizingPlayerId,
      objectiveCards,
      minimizingPlayerId
    );
  }

  if (maximizing) {
    let value = -Infinity;
    for (const move of candidates) {
      const sim = cloneBoard(board);
      sim.placeSettlement(move, currentPlayerId);
      value = Math.max(
        value,
        alphaBetaValue(
          sim,
          terrain,
          maximizingPlayerId,
          minimizingPlayerId,
          objectiveCards,
          depth - 1,
          alpha,
          beta,
          false
        )
      );
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of candidates) {
    const sim = cloneBoard(board);
    sim.placeSettlement(move, currentPlayerId);
    value = Math.min(
      value,
      alphaBetaValue(
        sim,
        terrain,
        maximizingPlayerId,
        minimizingPlayerId,
        objectiveCards,
        depth - 1,
        alpha,
        beta,
        true
      )
    );
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function pickHardAlphaBeta(
  board: Board,
  terrain: Terrain,
  validMoves: AxialCoord[],
  playerId: number,
  objectiveCards: ObjectiveCard[],
  opponentIds: number[]
): AxialCoord | null {
  if (validMoves.length === 0) return null;
  const primaryOpponentId = opponentIds[0];
  let bestCoord: AxialCoord | null = null;
  let bestValue = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  const orderedMoves = [...validMoves].sort(
    (a, b) =>
      evaluateMoveStrategic(board, b, terrain, playerId, objectiveCards, opponentIds) -
      evaluateMoveStrategic(board, a, terrain, playerId, objectiveCards, opponentIds)
  );

  for (const move of orderedMoves) {
    const sim = cloneBoard(board);
    sim.placeSettlement(move, playerId);
    const value = alphaBetaValue(
      sim,
      terrain,
      playerId,
      primaryOpponentId,
      objectiveCards,
      HARD_SEARCH_DEPTH - 1,
      alpha,
      beta,
      false
    );

    if (value > bestValue) {
      bestValue = value;
      bestCoord = move;
    }
    alpha = Math.max(alpha, bestValue);
  }

  return bestCoord;
}

export function selectBestMoves(
  board: Board,
  terrain: Terrain,
  playerId: number,
  difficulty: BotDifficulty,
  count: number = 3,
  context: BotStrategyContext = {}
): AxialCoord[] {
  const moves: AxialCoord[] = [];
  const simBoard = cloneBoard(board);
  const effectiveDifficulty = getEffectiveDifficulty(difficulty);
  const objectiveCards = context.objectiveCards ?? [];
  const opponentIds = context.opponentIds ?? [];

  for (let i = 0; i < count; i++) {
    const valid = getValidPlacements(simBoard, terrain, playerId);
    if (valid.length === 0) break;

    let chosen: AxialCoord | null = null;
    if (effectiveDifficulty === BotDifficulty.Easy) {
      chosen = pickRandom(valid);
    } else if (effectiveDifficulty === BotDifficulty.Hard) {
      chosen = pickHardAlphaBeta(
        simBoard,
        terrain,
        valid,
        playerId,
        objectiveCards,
        opponentIds
      );
    } else {
      chosen = pickGreedyStrategic(
        simBoard,
        terrain,
        valid,
        playerId,
        objectiveCards,
        opponentIds
      );
    }

    if (!chosen) break;

    moves.push(chosen);
    simBoard.placeSettlement(chosen, playerId);
  }

  return moves;
}

function cloneBoard(board: Board): Board {
  const copy = new Board(board.width, board.height);
  for (const cell of board.getAllCells()) {
    copy.setCell({ ...cell });
  }
  return copy;
}

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
    context: BotStrategyContext = {}
  ): AxialCoord[] {
    return selectBestMoves(
      board,
      terrain,
      this.playerId,
      this.difficulty,
      count,
      context
    );
  }

  evaluateMove(board: Board, coord: AxialCoord): number {
    return evaluateMove(board, coord, this.playerId);
  }
}

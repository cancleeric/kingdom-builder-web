import { Board } from '../core/board';
import { AxialCoord, hexNeighbors, hexEquals, hexDistance } from '../core/hex';
import { Terrain, Location } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import {
  ObjectiveCard,
  calculatePlayerScore,
} from '../core/scoring';

// ─────────────────────────────────────────────
// Bot difficulty
// ─────────────────────────────────────────────

/** Three AI difficulty levels */
export type BotDifficulty = 'easy' | 'normal' | 'hard';

// ─────────────────────────────────────────────
// BotPlayer class
// ─────────────────────────────────────────────

/**
 * BotPlayer — Greedy AI that selects the best moves each turn.
 *
 * Difficulty levels:
 * - easy:   Random valid placement
 * - normal: Greedy — picks hex with highest immediate score gain
 * - hard:   Greedy + 1-step lookahead
 */
export class BotPlayer {
  private difficulty: BotDifficulty;

  constructor(difficulty: BotDifficulty = 'normal') {
    this.difficulty = difficulty;
  }

  /**
   * Evaluate the score gain of placing a settlement at a given coord.
   * Considers:
   * - Objective card score gain (delta before/after placement)
   * - Castle adjacency bonus (+3 per adjacent castle)
   * - Location tile proximity (+2 per adjacent unclaimed tile)
   * - Near-castle incentive (+0.5 for castles at distance 2)
   */
  evaluateMove(
    board: Board,
    coord: AxialCoord,
    playerId: number,
    objectiveCards: ObjectiveCard[],
    currentTerrain: Terrain
  ): number {
    const validMoves = getValidPlacements(board, currentTerrain, playerId);
    const isValid = validMoves.some(v => hexEquals(v, coord));
    if (!isValid) return -Infinity;

    const cell = board.getCell(coord);
    if (!cell || cell.settlement !== undefined) return -Infinity;

    // 1. Objective score gain: simulate placement and compute delta
    const scoreBefore = calculatePlayerScore(board, playerId, objectiveCards);
    board.placeSettlement(coord, playerId);
    const scoreAfter = calculatePlayerScore(board, playerId, objectiveCards);
    // Restore board: remove the simulated placement
    const restoredCell = board.getCell(coord);
    if (restoredCell) {
      restoredCell.settlement = undefined;
      board.setCell(restoredCell);
    }
    const objectiveDelta = scoreAfter - scoreBefore;

    // 2. Castle adjacency: +3 per adjacent castle hex
    const castleBonus = hexNeighbors(coord).filter(n => {
      const nc = board.getCell(n);
      return nc?.location === Location.Castle;
    }).length * 3;

    // 3. Location tile proximity: +2 per adjacent unclaimed location tile
    const ownedLocations = new Set(
      board.getPlayerSettlements(playerId)
        .map(c => board.getCell(c.coord)?.location)
        .filter(Boolean)
    );
    const locationBonus = hexNeighbors(coord).filter(n => {
      const nc = board.getCell(n);
      return (
        nc?.location !== undefined &&
        nc.location !== Location.Castle &&
        !ownedLocations.has(nc.location)
      );
    }).length * 2;

    // 4. Near-castle incentive: +0.5 for each castle at distance 2
    const nearCastleBonus =
      board.getAllCells()
        .filter(c => c.location === Location.Castle)
        .filter(c => hexDistance(coord, c.coord) === 2)
        .length * 0.5;

    return objectiveDelta + castleBonus + locationBonus + nearCastleBonus;
  }

  /**
   * Select up to `count` best moves for the current player.
   * Placements are sequential: each is applied to a cloned board
   * before selecting the next.
   */
  selectBestMove(
    board: Board,
    playerId: number,
    currentTerrain: Terrain,
    objectiveCards: ObjectiveCard[],
    count: number = 3
  ): AxialCoord[] {
    const placements: AxialCoord[] = [];
    const simBoard = cloneBoard(board);

    for (let i = 0; i < count; i++) {
      const validMoves = getValidPlacements(simBoard, currentTerrain, playerId);
      if (validMoves.length === 0) break;

      const chosen = this.chooseMove(simBoard, validMoves, playerId, currentTerrain, objectiveCards);
      if (!chosen) break;

      placements.push(chosen);
      simBoard.placeSettlement(chosen, playerId);
    }

    return placements;
  }

  private chooseMove(
    board: Board,
    validMoves: AxialCoord[],
    playerId: number,
    terrain: Terrain,
    objectiveCards: ObjectiveCard[]
  ): AxialCoord | null {
    if (validMoves.length === 0) return null;

    switch (this.difficulty) {
      case 'easy':
        return this.randomMove(validMoves);
      case 'normal':
        return this.greedyMove(board, validMoves, playerId, terrain, objectiveCards);
      case 'hard':
        return this.lookaheadMove(board, validMoves, playerId, terrain, objectiveCards);
    }
  }

  private randomMove(validMoves: AxialCoord[]): AxialCoord {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  private greedyMove(
    board: Board,
    validMoves: AxialCoord[],
    playerId: number,
    terrain: Terrain,
    objectiveCards: ObjectiveCard[]
  ): AxialCoord {
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const coord of validMoves) {
      const score = this.evaluateMove(board, coord, playerId, objectiveCards, terrain);
      if (score > bestScore) {
        bestScore = score;
        bestMove = coord;
      }
    }

    return bestMove;
  }

  private lookaheadMove(
    board: Board,
    validMoves: AxialCoord[],
    playerId: number,
    terrain: Terrain,
    objectiveCards: ObjectiveCard[]
  ): AxialCoord {
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const coord of validMoves) {
      const immediateScore = this.evaluateMove(board, coord, playerId, objectiveCards, terrain);

      const simBoard = cloneBoard(board);
      simBoard.placeSettlement(coord, playerId);
      const nextMoves = getValidPlacements(simBoard, terrain, playerId);
      let lookaheadScore = 0;
      if (nextMoves.length > 0) {
        lookaheadScore = Math.max(
          ...nextMoves.map(n =>
            this.evaluateMove(simBoard, n, playerId, objectiveCards, terrain)
          )
        );
      }

      const totalScore = immediateScore + lookaheadScore * 0.5;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = coord;
      }
    }

    return bestMove;
  }
}

// ─────────────────────────────────────────────
// Board cloning helper
// ─────────────────────────────────────────────

/**
 * Create a shallow-copy snapshot of a Board for simulation.
 */
function cloneBoard(board: Board): Board {
  const clone = new Board(board.width, board.height);
  for (const cell of board.getAllCells()) {
    clone.setCell({ ...cell });
  }
  return clone;
}

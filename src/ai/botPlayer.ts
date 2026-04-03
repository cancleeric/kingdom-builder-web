import { AxialCoord, hexNeighbors, hexToKey } from '../core/hex';
import { Board } from '../core/board';
import { Terrain } from '../core/terrain';
import { Location } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import { ObjectiveCard, calculatePlayerScore } from '../core/scoring';

export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface BotGameState {
  board: Board;
  currentTerrainCard: Terrain;
  players: { id: number }[];
  currentPlayerIndex: number;
  objectiveCards: ObjectiveCard[];
  acquiredLocations: string[];
}

/**
 * AI Bot player that evaluates and selects moves for Kingdom Builder.
 *
 * Difficulty levels:
 * - easy:   random valid placement
 * - normal: greedy (highest single-move score)
 * - hard:   greedy with 1-step lookahead
 */
export class BotPlayer {
  constructor(private difficulty: BotDifficulty = 'normal') {}

  /**
   * Score a potential placement at `coord`.
   * The `_terrain` parameter is part of the public interface for future use
   * (e.g., terrain-aware scoring rules) and is kept for API stability.
   *
   * Scoring components:
   *  +3 per adjacent Castle
   *  +5 per new location tile that would be acquired (adjacent, not already owned)
   *  +1 cluster bonus per adjacent own settlement (encourages grouping)
   *  + delta from objective card scoring increase
   */
  evaluateMove(
    board: Board,
    coord: AxialCoord,
    _terrain: Terrain,
    objectiveCards: ObjectiveCard[],
    playerId: number,
    acquiredLocations: Set<string> = new Set()
  ): number {
    let score = 0;
    const neighbors = hexNeighbors(coord);

    for (const neighbor of neighbors) {
      const cell = board.getCell(neighbor);
      if (!cell) continue;

      // Castle adjacency bonus
      if (cell.location === Location.Castle) {
        score += 3;
      }

      // Location tile acquisition bonus (excludes castles and already-owned tiles)
      const key = hexToKey(neighbor);
      if (cell.location && cell.location !== Location.Castle && !acquiredLocations.has(key)) {
        score += 5;
      }

      // Cluster bonus: adjacent own settlement
      if (cell.settlement === playerId) {
        score += 1;
      }
    }

    // Objective card scoring delta: temporarily place, measure increase, undo
    const cell = board.getCell(coord);
    if (cell) {
      const scoreBefore = calculatePlayerScore(board, playerId, objectiveCards);
      cell.settlement = playerId;
      const scoreAfter = calculatePlayerScore(board, playerId, objectiveCards);
      cell.settlement = undefined;
      const delta = scoreAfter - scoreBefore;
      if (delta > 0) score += delta;
    }

    return score;
  }

  /**
   * Select the best `count` placements for the current turn.
   * Returns fewer if fewer valid placements exist.
   */
  selectBestMoves(state: BotGameState, count: number): AxialCoord[] {
    const playerId = state.players[state.currentPlayerIndex].id;
    const validPlacements = getValidPlacements(state.board, state.currentTerrainCard, playerId);

    if (validPlacements.length === 0) return [];

    const actualCount = Math.min(count, validPlacements.length);
    const acquiredSet = new Set(state.acquiredLocations);

    if (this.difficulty === 'easy') {
      // Random selection
      const shuffled = [...validPlacements].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, actualCount);
    }

    return this.greedySelect(
      state.board,
      validPlacements,
      state.currentTerrainCard,
      state.objectiveCards,
      playerId,
      acquiredSet,
      actualCount,
      this.difficulty === 'hard'
    );
  }

  private greedySelect(
    board: Board,
    validPlacements: AxialCoord[],
    terrain: Terrain,
    objectiveCards: ObjectiveCard[],
    playerId: number,
    initialAcquiredSet: Set<string>,
    count: number,
    lookahead: boolean
  ): AxialCoord[] {
    const selected: AxialCoord[] = [];
    const remaining = [...validPlacements];
    const acquiredSet = new Set(initialAcquiredSet);

    for (let i = 0; i < count; i++) {
      if (remaining.length === 0) break;

      let bestScore = -Infinity;
      let bestIndex = 0;

      for (let j = 0; j < remaining.length; j++) {
        const coord = remaining[j];
        let score = this.evaluateMove(board, coord, terrain, objectiveCards, playerId, acquiredSet);

        if (lookahead) {
          // Temporarily place this settlement and evaluate the best subsequent move
          const cell = board.getCell(coord);
          if (cell) {
            cell.settlement = playerId;
            const lookaheadAcquired = this.computeNewAcquisitions(board, coord, acquiredSet);
            const nextValid = getValidPlacements(board, terrain, playerId);

            if (nextValid.length > 0) {
              let bestNextScore = 0;
              for (const next of nextValid) {
                const nextScore = this.evaluateMove(
                  board,
                  next,
                  terrain,
                  objectiveCards,
                  playerId,
                  lookaheadAcquired
                );
                if (nextScore > bestNextScore) bestNextScore = nextScore;
              }
              score += bestNextScore * 0.5;
            }
            cell.settlement = undefined;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestIndex = j;
        }
      }

      const best = remaining[bestIndex];
      selected.push(best);

      // Temporarily place on board so subsequent iterations reflect this choice
      const cell = board.getCell(best);
      if (cell) {
        cell.settlement = playerId;
        this.computeNewAcquisitions(board, best, acquiredSet).forEach(k => acquiredSet.add(k));
      }

      remaining.splice(bestIndex, 1);
    }

    // Undo all temporary placements
    for (const coord of selected) {
      const cell = board.getCell(coord);
      if (cell) cell.settlement = undefined;
    }

    return selected;
  }

  private computeNewAcquisitions(
    board: Board,
    coord: AxialCoord,
    currentAcquired: Set<string>
  ): Set<string> {
    const result = new Set(currentAcquired);
    for (const neighbor of hexNeighbors(coord)) {
      const cell = board.getCell(neighbor);
      const key = hexToKey(neighbor);
      if (cell?.location && cell.location !== Location.Castle && !result.has(key)) {
        result.add(key);
      }
    }
    return result;
  }
}

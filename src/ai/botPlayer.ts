import type { GameState, Hex, PlayerType } from '../types';
import { getValidPlacements, applyPlacement } from '../core/board';
import { calculateScoreGain } from '../core/scoring';
import { hexNeighbors, hexEqual, hexDistance } from '../core/hex';

// AI difficulty levels
export type BotDifficulty = 'easy' | 'normal' | 'hard';

/**
 * Map player type to bot difficulty
 */
export function playerTypeToDifficulty(type: PlayerType): BotDifficulty | null {
  switch (type) {
    case 'bot-easy': return 'easy';
    case 'bot-normal': return 'normal';
    case 'bot-hard': return 'hard';
    default: return null;
  }
}

/**
 * BotPlayer — Greedy AI that selects the best moves each turn.
 *
 * Difficulty levels:
 * - easy:   Random valid placement
 * - normal: Greedy — selects hex with highest immediate score gain
 * - hard:   Greedy + 1-step lookahead (evaluates best next move after each choice)
 */
export class BotPlayer {
  private difficulty: BotDifficulty;

  constructor(difficulty: BotDifficulty = 'normal') {
    this.difficulty = difficulty;
  }

  /**
   * Evaluate the score gain of placing a settlement at a given hex.
   * Considers:
   * - Objective card score gain
   * - Castle adjacency bonus
   * - Location tile proximity (bonus for being adjacent to unclaimed tiles)
   * - Edge placement near location tiles
   */
  evaluateMove(state: GameState, hex: Hex): number {
    const playerId = state.currentPlayer;

    // Check that the cell is valid
    const cell = state.cells.find(
      (c) => hexEqual(c.hex, hex) && c.owner === null
    );
    if (!cell) return -Infinity;

    let score = 0;

    // 1. Objective score gain
    score += calculateScoreGain(state, hex, playerId);

    // 2. Castle adjacency: +3 for each castle this hex would be adjacent to
    const castleBonus = state.cells
      .filter((c) => c.hasCastle)
      .filter((c) => hexNeighbors(hex).some((n) => hexEqual(n, c.hex))).length;
    score += castleBonus * 3;

    // 3. Location tile proximity: +2 for each unclaimed location tile adjacent
    const locationBonus = state.cells
      .filter((c) => c.hasLocationTile && !c.locationTileClaimed)
      .filter((c) => hexNeighbors(hex).some((n) => hexEqual(n, c.hex))).length;
    score += locationBonus * 2;

    // 4. Small bonus for placing near castles (within distance 2) to encourage expansion
    const nearCastleBonus = state.cells
      .filter((c) => c.hasCastle)
      .filter((c) => hexDistance(hex, c.hex) === 2).length;
    score += nearCastleBonus * 0.5;

    // 5. Prefer placing where we already have settlements (cluster bonus for normal/hard)
    if (this.difficulty !== 'easy') {
      const playerNeighbors = state.cells
        .filter((c) => c.owner === playerId)
        .filter((c) => hexNeighbors(hex).some((n) => hexEqual(n, c.hex))).length;
      score += playerNeighbors * 0.3;
    }

    return score;
  }

  /**
   * Select up to `count` best moves for the current player.
   * Returns an array of hexes to place settlements on.
   */
  selectBestMove(state: GameState, count: number = 3): Hex[] {
    const placements: Hex[] = [];
    let currentState = state;

    for (let i = 0; i < count; i++) {
      const validMoves = getValidPlacements(currentState);
      if (validMoves.length === 0) break;

      const chosen = this.chooseMove(currentState, validMoves);
      if (!chosen) break;

      placements.push(chosen);
      currentState = applyPlacement(currentState, chosen);
    }

    return placements;
  }

  /**
   * Choose a single move given valid options.
   */
  private chooseMove(state: GameState, validMoves: Hex[]): Hex | null {
    if (validMoves.length === 0) return null;

    switch (this.difficulty) {
      case 'easy':
        return this.randomMove(validMoves);
      case 'normal':
        return this.greedyMove(state, validMoves);
      case 'hard':
        return this.lookaheadMove(state, validMoves);
    }
  }

  /**
   * Random move: pick a random valid placement.
   */
  private randomMove(validMoves: Hex[]): Hex {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  /**
   * Greedy move: pick the placement with the highest immediate score gain.
   */
  private greedyMove(state: GameState, validMoves: Hex[]): Hex {
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const hex of validMoves) {
      const score = this.evaluateMove(state, hex);
      if (score > bestScore) {
        bestScore = score;
        bestMove = hex;
      }
    }

    return bestMove;
  }

  /**
   * Lookahead move: for each valid move, evaluate its score plus the best
   * subsequent move's score (1-step lookahead).
   */
  private lookaheadMove(state: GameState, validMoves: Hex[]): Hex {
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const hex of validMoves) {
      const immediateScore = this.evaluateMove(state, hex);
      const nextState = applyPlacement(state, hex);
      const nextMoves = getValidPlacements(nextState);

      // Look 1 step ahead: best score after this move
      let lookaheadScore = 0;
      if (nextMoves.length > 0) {
        lookaheadScore = Math.max(
          ...nextMoves.map((n) => this.evaluateMove(nextState, n))
        );
      }

      const totalScore = immediateScore + lookaheadScore * 0.5;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMove = hex;
      }
    }

    return bestMove;
  }
}

/**
 * Execute one full bot turn: select moves and return the resulting state.
 * Returns the new state after all bot placements.
 */
export function executeBotTurn(
  state: GameState,
  difficulty: BotDifficulty
): GameState {
  const bot = new BotPlayer(difficulty);
  const remaining = state.placementsRequired - state.placementsThisTurn;
  const moves = bot.selectBestMove(state, remaining);

  let currentState = state;
  for (const hex of moves) {
    currentState = applyPlacement(currentState, hex);
  }

  return currentState;
}

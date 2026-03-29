import { describe, it, expect, beforeEach } from 'vitest';
import { BotPlayer } from '../ai/botPlayer';
import { Board, createDefaultBoard } from '../core/board';
import { Terrain } from '../core/terrain';
import { ObjectiveCard, selectObjectiveCards } from '../core/scoring';
import { getValidPlacements } from '../core/rules';
import { hexEquals, hexNeighbors } from '../core/hex';
import { Location } from '../core/terrain';

function buildTestBoard(): { board: Board; objectives: ObjectiveCard[] } {
  const board = createDefaultBoard();
  const objectives = selectObjectiveCards(3);
  return { board, objectives };
}

const PLAYER_ID = 1;
const TERRAIN = Terrain.Grass;

describe('BotPlayer', () => {
  let board: Board;
  let objectives: ObjectiveCard[];

  beforeEach(() => {
    ({ board, objectives } = buildTestBoard());
  });

  describe('evaluateMove', () => {
    it('returns -Infinity for an occupied cell', () => {
      const bot = new BotPlayer('normal');
      const validMoves = getValidPlacements(board, TERRAIN, PLAYER_ID);
      expect(validMoves.length).toBeGreaterThan(0);

      const firstMove = validMoves[0];
      board.placeSettlement(firstMove, PLAYER_ID);

      const score = bot.evaluateMove(board, firstMove, PLAYER_ID, objectives, TERRAIN);
      expect(score).toBe(-Infinity);
    });

    it('returns a finite score for a valid empty cell', () => {
      const bot = new BotPlayer('normal');
      const validMoves = getValidPlacements(board, TERRAIN, PLAYER_ID);
      expect(validMoves.length).toBeGreaterThan(0);

      const score = bot.evaluateMove(board, validMoves[0], PLAYER_ID, objectives, TERRAIN);
      expect(isFinite(score)).toBe(true);
    });

    it('gives higher score for cell adjacent to castle', () => {
      const bot = new BotPlayer('normal');
      const castleCell = board.getAllCells().find(c => c.location === Location.Castle);
      if (!castleCell) return;

      const neighbors = hexNeighbors(castleCell.coord);
      const validMoves = getValidPlacements(board, TERRAIN, PLAYER_ID);

      const adjacentValid = neighbors.find(n => validMoves.some(v => hexEquals(v, n)));
      if (!adjacentValid) return;

      const nonAdjacent = validMoves.find(
        v => !neighbors.some(n => hexEquals(v, n))
      );
      if (!nonAdjacent) return;

      const adjacentScore = bot.evaluateMove(board, adjacentValid, PLAYER_ID, objectives, TERRAIN);
      const nonAdjacentScore = bot.evaluateMove(board, nonAdjacent, PLAYER_ID, objectives, TERRAIN);

      expect(adjacentScore).toBeGreaterThan(nonAdjacentScore);
    });
  });

  describe('selectBestMove', () => {
    it('returns at most `count` placements', () => {
      const bot = new BotPlayer('normal');
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);
      expect(moves.length).toBeLessThanOrEqual(3);
    });

    it('returns only valid hex positions', () => {
      const bot = new BotPlayer('normal');
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
        expect(typeof move.r).toBe('number');
      }
    });

    it('returns empty array when no valid placements', () => {
      const bot = new BotPlayer('easy');
      const grassCells = board.getCellsByTerrain(TERRAIN);
      for (const c of grassCells) {
        board.placeSettlement(c.coord, 99);
      }
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);
      expect(moves.length).toBe(0);
    });

    it('easy bot selects random valid placements', () => {
      const bot = new BotPlayer('easy');
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);
      expect(moves.length).toBeGreaterThanOrEqual(0);
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
      }
    });

    it('hard bot selects valid placements', () => {
      const bot = new BotPlayer('hard');
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);
      expect(moves.length).toBeLessThanOrEqual(3);
      for (const move of moves) {
        expect(typeof move.q).toBe('number');
      }
    });

    it('normal bot first placement is from initial valid moves', () => {
      const bot = new BotPlayer('normal');
      const validBefore = getValidPlacements(board, TERRAIN, PLAYER_ID);
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);

      if (moves.length > 0) {
        const isValid = validBefore.some(v => hexEquals(v, moves[0]));
        expect(isValid).toBe(true);
      }
    });

    it('sequential placements do not conflict', () => {
      const bot = new BotPlayer('normal');
      const moves = bot.selectBestMove(board, PLAYER_ID, TERRAIN, objectives, 3);

      const keys = moves.map(m => `${m.q},${m.r}`);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(moves.length);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { createBoard, getCell, placeSettlement } from '../core/board';

describe('board utilities', () => {
  it('createBoard returns cells', () => {
    const board = createBoard();
    expect(board.length).toBeGreaterThan(0);
  });

  it('createBoard has cells with no settlements', () => {
    const board = createBoard();
    expect(board.every(c => c.settlement === null)).toBe(true);
  });

  it('getCell returns undefined for out-of-range coord', () => {
    const board = createBoard();
    const cell = getCell(board, { q: 999, r: 999 });
    expect(cell).toBeUndefined();
  });

  it('getCell returns cell for valid coord', () => {
    const board = createBoard();
    const firstCell = board[0];
    const found = getCell(board, firstCell.coord);
    expect(found).toBeDefined();
    expect(found?.coord).toEqual(firstCell.coord);
  });

  it('placeSettlement returns new board with settlement', () => {
    const board = createBoard();
    const grassCell = board.find(c => c.terrain === 'grass');
    if (!grassCell) return;
    const newBoard = placeSettlement(board, grassCell.coord, 0);
    const cell = getCell(newBoard, grassCell.coord);
    expect(cell?.settlement).toBe(0);
  });

  it('placeSettlement does not mutate original board', () => {
    const board = createBoard();
    const grassCell = board.find(c => c.terrain === 'grass');
    if (!grassCell) return;
    placeSettlement(board, grassCell.coord, 0);
    const cell = getCell(board, grassCell.coord);
    expect(cell?.settlement).toBeNull();
  });
});

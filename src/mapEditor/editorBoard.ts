import { Board } from '../core/board';
import { Terrain } from '../core/terrain';
import { BoardSize } from '../types/index';

const SIZE_MAP: Record<BoardSize, number> = { small: 12, medium: 16, large: 20 };

export function createBlankBoard(boardSize: BoardSize): Board {
  const s = SIZE_MAP[boardSize];
  const board = new Board(s, s);
  for (let q = 0; q < s; q++)
    for (let r = 0; r < s; r++)
      board.setCell({ coord: { q, r }, terrain: Terrain.Grass, settlement: undefined });
  return board;
}

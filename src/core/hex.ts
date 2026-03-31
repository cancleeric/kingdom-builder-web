export function getNeighbors(row: number, col: number, boardSize: number): { row: number; col: number }[] {
  const isOdd = row % 2 !== 0;
  const dirs = isOdd
    ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
    : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return dirs
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row: r, col: c }) => isValidCell(r, c, boardSize));
}

export function isValidCell(row: number, col: number, boardSize: number): boolean {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  const isOdd = r1 % 2 !== 0;
  const dirs = isOdd
    ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
    : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return dirs.some(([dr, dc]) => r1 + dr === r2 && c1 + dc === c2);
}

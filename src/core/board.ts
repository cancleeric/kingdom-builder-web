import type { HexCell, HexCoord, TerrainType } from '../types';
import { hexNeighbors, hexEquals } from './hex';
import { isPlaceable } from './terrain';

export function createBoard(): HexCell[] {
  const cells: HexCell[] = [];
  const size = 10;
  for (let q = -size; q <= size; q++) {
    const r1 = Math.max(-size, -q - size);
    const r2 = Math.min(size, -q + size);
    for (let r = r1; r <= r2; r++) {
      const terrain = getDefaultTerrain(q, r);
      cells.push({ coord: { q, r }, terrain, settlement: null, hasLocation: false });
    }
  }
  return cells;
}

function getDefaultTerrain(q: number, r: number): TerrainType {
  const s = -q - r;
  const abs_q = Math.abs(q);
  const abs_r = Math.abs(r);
  const abs_s = Math.abs(s);
  if (abs_q > 8 || abs_r > 8 || abs_s > 8) return 'mountain';
  if (abs_q <= 1 && abs_r <= 1 && abs_s <= 1) return 'castle';
  const hash = ((q * 7 + r * 13) % 17 + 17) % 17;
  const terrains: TerrainType[] = ['grass', 'forest', 'desert', 'flower', 'canyon'];
  if (abs_q === 0 || abs_r === 0 || abs_s === 0) return 'water';
  return terrains[hash % terrains.length];
}

export function getCell(board: HexCell[], coord: HexCoord): HexCell | undefined {
  return board.find(c => hexEquals(c.coord, coord));
}

export function canPlace(board: HexCell[], coord: HexCoord, terrain: TerrainType, playerId: number): boolean {
  const cell = getCell(board, coord);
  if (!cell) return false;
  if (cell.terrain !== terrain) return false;
  if (!isPlaceable(cell.terrain)) return false;
  if (cell.settlement !== null) return false;

  const playerHasAdjacentSettlement = board.some(c => {
    if (c.settlement !== playerId) return false;
    const neighbors = hexNeighbors(c.coord);
    return neighbors.some(n => hexEquals(n, coord));
  });

  if (playerHasAdjacentSettlement) return true;

  const playerSettlementsOnBoard = board.filter(c => c.settlement === playerId);
  const hasAdjacentToSameTerrain = playerSettlementsOnBoard.some(c => {
    const neighbors = hexNeighbors(c.coord);
    return neighbors.some(n => {
      const neighborCell = getCell(board, n);
      return neighborCell?.terrain === terrain;
    });
  });

  if (hasAdjacentToSameTerrain) return false;

  return true;
}

export function getValidPlacements(board: HexCell[], terrain: TerrainType, playerId: number): HexCoord[] {
  return board
    .filter(cell => canPlace(board, cell.coord, terrain, playerId))
    .map(cell => cell.coord);
}

export function placeSettlement(board: HexCell[], coord: HexCoord, playerId: number): HexCell[] {
  return board.map(cell =>
    hexEquals(cell.coord, coord)
      ? { ...cell, settlement: playerId }
      : cell
  );
}

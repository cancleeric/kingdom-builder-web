import { Terrain, Location } from './terrain';

/**
 * A single cell in a quadrant template
 */
export interface QuadrantCell {
  terrain: Terrain;
  location?: Location;
}

/**
 * A 10×10 grid of quadrant cells, indexed as [row][col] (row = r, col = q)
 */
export type QuadrantGrid = QuadrantCell[][];

/**
 * A named quadrant template representing one 10×10 board section
 */
export interface QuadrantTemplate {
  id: string;
  name: string;
  grid: QuadrantGrid;
}

// Helper factory functions for readability
const G = (): QuadrantCell => ({ terrain: Terrain.Grass });
const F = (): QuadrantCell => ({ terrain: Terrain.Forest });
const D = (): QuadrantCell => ({ terrain: Terrain.Desert });
const FL = (): QuadrantCell => ({ terrain: Terrain.Flower });
const C = (): QuadrantCell => ({ terrain: Terrain.Canyon });
const W = (): QuadrantCell => ({ terrain: Terrain.Water });
const M = (): QuadrantCell => ({ terrain: Terrain.Mountain });
const Ca = (t: Terrain): QuadrantCell => ({ terrain: t, location: Location.Castle });

/**
 * The pool of available quadrant templates.
 * Each quadrant is a 10×10 grid of cells.
 * Every quadrant contains at least 2 Castle hexes.
 */
export const QUADRANT_TEMPLATES: QuadrantTemplate[] = [
  {
    id: 'A',
    name: 'Forest Realm',
    grid: [
      // row 0
      [M(),  F(),  F(),  F(),  F(),  F(),  F(),  M(),  M(),  M()],
      // row 1
      [M(),  F(),  F(),  F(),  F(),  F(),  G(),  G(),  M(),  M()],
      // row 2
      [F(),  F(),  Ca(Terrain.Forest), F(), F(),  G(),  G(),  G(),  G(),  M()],
      // row 3
      [F(),  F(),  F(),  F(),  G(),  G(),  G(),  G(),  G(),  M()],
      // row 4
      [F(),  F(),  F(),  G(),  G(),  W(),  W(),  G(),  G(),  G()],
      // row 5
      [F(),  F(),  G(),  G(),  W(),  W(),  G(),  G(),  G(),  G()],
      // row 6
      [F(),  G(),  G(),  G(),  G(),  G(),  G(),  G(),  G(),  G()],
      // row 7
      [M(),  G(),  G(),  G(),  G(),  G(),  Ca(Terrain.Grass), G(), G(), G()],
      // row 8
      [M(),  M(),  G(),  G(),  G(),  G(),  G(),  G(),  G(),  G()],
      // row 9
      [M(),  M(),  M(),  G(),  G(),  G(),  G(),  G(),  G(),  M()],
    ],
  },
  {
    id: 'B',
    name: 'Desert Canyon',
    grid: [
      // row 0
      [M(),  M(),  M(),  D(),  D(),  D(),  D(),  C(),  C(),  M()],
      // row 1
      [M(),  D(),  D(),  D(),  D(),  C(),  C(),  C(),  M(),  M()],
      // row 2
      [D(),  D(),  D(),  D(),  Ca(Terrain.Canyon), C(), C(), C(), M(), M()],
      // row 3
      [D(),  D(),  D(),  C(),  C(),  C(),  C(),  C(),  M(),  M()],
      // row 4
      [D(),  D(),  C(),  C(),  C(),  C(),  C(),  M(),  M(),  M()],
      // row 5
      [D(),  D(),  C(),  C(),  C(),  C(),  M(),  M(),  G(),  G()],
      // row 6
      [D(),  D(),  C(),  C(),  M(),  M(),  G(),  G(),  G(),  G()],
      // row 7
      [D(),  D(),  C(),  M(),  G(),  G(),  G(),  Ca(Terrain.Grass), G(), G()],
      // row 8
      [D(),  D(),  M(),  G(),  G(),  G(),  G(),  G(),  G(),  G()],
      // row 9
      [M(),  M(),  M(),  G(),  G(),  G(),  G(),  G(),  G(),  M()],
    ],
  },
  {
    id: 'C',
    name: 'Flower Meadows',
    grid: [
      // row 0
      [M(),  M(),  M(),  FL(), FL(), FL(), FL(), FL(), M(),  M()],
      // row 1
      [M(),  FL(), FL(), FL(), FL(), FL(), FL(), M(),  G(),  M()],
      // row 2
      [FL(), FL(), FL(), Ca(Terrain.Flower), FL(), FL(), G(), G(), G(), M()],
      // row 3
      [FL(), FL(), FL(), FL(), FL(), G(),  G(),  G(),  G(),  M()],
      // row 4
      [FL(), FL(), FL(), FL(), G(),  G(),  G(),  G(),  G(),  G()],
      // row 5
      [FL(), FL(), FL(), G(),  G(),  G(),  G(),  G(),  D(),  D()],
      // row 6
      [FL(), FL(), G(),  G(),  G(),  G(),  D(),  D(),  D(),  D()],
      // row 7
      [M(),  FL(), G(),  G(),  G(),  D(),  D(),  Ca(Terrain.Desert), D(), D()],
      // row 8
      [M(),  M(),  G(),  G(),  D(),  D(),  D(),  D(),  D(),  D()],
      // row 9
      [M(),  M(),  M(),  G(),  D(),  D(),  D(),  D(),  D(),  M()],
    ],
  },
  {
    id: 'D',
    name: 'Mountain Pass',
    grid: [
      // row 0
      [M(),  M(),  M(),  M(),  M(),  M(),  M(),  M(),  M(),  M()],
      // row 1
      [M(),  G(),  G(),  G(),  G(),  G(),  F(),  F(),  F(),  M()],
      // row 2
      [M(),  G(),  G(),  G(),  G(),  F(),  F(),  F(),  F(),  M()],
      // row 3
      [M(),  G(),  G(),  Ca(Terrain.Grass), G(), F(), F(), F(), F(), M()],
      // row 4
      [M(),  G(),  G(),  G(),  F(),  F(),  W(),  W(),  F(),  M()],
      // row 5
      [M(),  G(),  G(),  F(),  F(),  W(),  W(),  F(),  F(),  M()],
      // row 6
      [M(),  G(),  G(),  F(),  F(),  F(),  F(),  C(),  C(),  M()],
      // row 7
      [M(),  G(),  G(),  F(),  F(),  F(),  C(),  Ca(Terrain.Canyon), C(), M()],
      // row 8
      [M(),  G(),  G(),  G(),  F(),  F(),  C(),  C(),  C(),  M()],
      // row 9
      [M(),  M(),  M(),  M(),  M(),  M(),  M(),  M(),  M(),  M()],
    ],
  },
];

/**
 * Rotate a quadrant grid by the given angle (clockwise).
 * The grid is indexed as [row][col] (10×10).
 *
 * Rotation math for a 10×10 matrix (N = 10):
 *   0°:   new[r][q] = old[r][q]
 *   90°:  new[r][q] = old[N-1-q][r]
 *  180°:  new[r][q] = old[N-1-r][N-1-q]
 *  270°:  new[r][q] = old[q][N-1-r]
 */
export function rotateQuadrant(
  grid: QuadrantGrid,
  rotation: 0 | 90 | 180 | 270,
): QuadrantGrid {
  const N = 10;
  const newGrid: QuadrantGrid = Array.from({ length: N }, () =>
    new Array<QuadrantCell>(N),
  );

  for (let r = 0; r < N; r++) {
    for (let q = 0; q < N; q++) {
      let src: QuadrantCell;
      switch (rotation) {
        case 0:
          src = grid[r][q];
          break;
        case 90:
          src = grid[N - 1 - q][r];
          break;
        case 180:
          src = grid[N - 1 - r][N - 1 - q];
          break;
        case 270:
          src = grid[q][N - 1 - r];
          break;
      }
      newGrid[r][q] = { ...src };
    }
  }

  return newGrid;
}

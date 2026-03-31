import { Terrain, Location } from './terrain';
import { Board } from './board';
import type { HexCell } from '../types';

/**
 * A 10×10 hex terrain array representing one quadrant of the board.
 * Indexed as grid[r][q] where r is the row (0–9) and q is the column (0–9).
 */
export type QuadrantTemplate = Terrain[][];

/**
 * A named quadrant board tile with associated terrain data
 */
export interface Quadrant {
  id: string;
  name: string;
  terrain: QuadrantTemplate;
}

// Terrain shorthand aliases for compact data definitions
const G = Terrain.Grass;
const F = Terrain.Forest;
const D = Terrain.Desert;
const W = Terrain.Water;
const M = Terrain.Mountain;
const Fl = Terrain.Flower;
const C = Terrain.Canyon;

/**
 * All available quadrant board tiles.
 * At least 4 are required; 8 are provided for greater variety.
 */
export const QUADRANTS: Quadrant[] = [
  {
    id: 'forest-grove',
    name: 'Forest Grove',
    terrain: [
      [G, F, F, G, F, F, G, F, G, M],
      [F, F, G, F, F, G, F, G, F, G],
      [G, F, F, F, G, F, F, F, G, F],
      [F, W, W, F, F, G, F, F, F, G],
      [G, W, F, F, G, F, G, F, F, F],
      [G, F, F, G, F, F, G, F, F, M],
      [F, F, G, F, G, F, F, G, F, G],
      [G, F, F, G, F, F, G, F, G, F],
      [M, F, G, F, G, G, F, G, F, F],
      [G, G, F, G, F, G, F, F, G, G],
    ],
  },
  {
    id: 'desert-dunes',
    name: 'Desert Dunes',
    terrain: [
      [D, D, C, D, D, C, D, D, C, D],
      [D, C, D, D, C, D, D, C, D, D],
      [C, D, D, C, D, D, C, D, D, M],
      [D, D, C, D, W, W, D, D, C, D],
      [D, C, D, D, W, D, D, C, D, D],
      [C, D, D, C, D, D, C, D, D, C],
      [D, D, D, D, C, D, D, D, D, D],
      [D, C, D, D, D, C, D, D, C, D],
      [D, D, C, D, D, D, C, D, D, D],
      [C, D, D, D, C, D, D, C, D, D],
    ],
  },
  {
    id: 'flower-fields',
    name: 'Flower Fields',
    terrain: [
      [Fl, G, Fl, Fl, G, Fl, G, Fl, G, Fl],
      [G, Fl, G, Fl, Fl, G, Fl, G, Fl, G],
      [Fl, Fl, G, G, Fl, Fl, G, G, Fl, Fl],
      [G, Fl, Fl, G, G, Fl, Fl, G, G, Fl],
      [Fl, G, Fl, Fl, G, W, W, Fl, G, G],
      [G, G, Fl, G, Fl, W, Fl, G, Fl, Fl],
      [Fl, Fl, G, Fl, Fl, G, Fl, Fl, G, G],
      [G, Fl, G, G, Fl, G, G, Fl, G, Fl],
      [Fl, G, Fl, Fl, G, Fl, G, Fl, G, Fl],
      [G, Fl, G, G, Fl, G, Fl, G, Fl, G],
    ],
  },
  {
    id: 'mountain-valley',
    name: 'Mountain Valley',
    terrain: [
      [M, M, G, G, F, G, G, M, M, M],
      [M, G, G, F, F, F, G, G, M, M],
      [G, G, F, F, G, F, F, G, G, M],
      [G, F, F, G, G, G, F, F, G, G],
      [F, F, G, G, W, W, G, G, F, F],
      [F, G, G, G, W, G, G, G, F, F],
      [G, G, F, F, G, G, F, F, G, G],
      [M, G, G, F, F, G, G, G, G, M],
      [M, M, G, G, F, F, G, G, M, M],
      [M, M, M, G, G, G, G, M, M, M],
    ],
  },
  {
    id: 'grassland',
    name: 'Grassland',
    terrain: [
      [G, G, G, G, F, G, G, G, G, G],
      [G, G, F, G, G, G, F, G, G, G],
      [G, F, G, G, G, G, G, F, G, G],
      [G, G, G, F, G, G, G, G, G, G],
      [F, G, G, G, G, W, G, G, G, F],
      [G, G, G, G, W, W, G, G, G, G],
      [G, G, F, G, G, G, G, F, G, G],
      [G, F, G, G, G, G, G, G, F, G],
      [G, G, G, G, F, G, G, G, G, G],
      [G, G, G, F, G, G, F, G, G, G],
    ],
  },
  {
    id: 'canyon-lands',
    name: 'Canyon Lands',
    terrain: [
      [C, C, D, C, D, D, C, D, C, C],
      [C, D, C, D, C, D, D, C, D, C],
      [D, C, D, C, D, C, D, D, C, D],
      [C, D, W, W, D, D, C, D, D, C],
      [D, D, W, D, C, D, D, C, D, D],
      [C, C, D, D, D, C, D, D, C, C],
      [D, C, D, C, D, D, C, D, C, D],
      [C, D, C, D, C, D, D, C, D, C],
      [D, D, C, C, D, C, D, C, D, D],
      [C, D, D, C, C, D, C, D, D, C],
    ],
  },
  {
    id: 'lakeside',
    name: 'Lakeside',
    terrain: [
      [G, G, F, G, G, G, F, G, G, G],
      [G, F, G, G, W, W, G, G, F, G],
      [F, G, G, W, W, W, W, G, G, F],
      [G, G, W, W, G, G, W, W, G, G],
      [G, W, W, G, G, G, G, W, W, G],
      [G, W, G, G, F, G, G, G, W, G],
      [G, G, G, G, G, F, G, G, G, G],
      [F, G, G, G, G, G, G, G, G, F],
      [G, G, F, G, G, G, F, G, G, G],
      [G, G, G, F, G, F, G, G, G, G],
    ],
  },
  {
    id: 'highland',
    name: 'Highland',
    terrain: [
      [M, M, M, G, G, G, G, M, M, M],
      [M, M, G, G, F, F, G, G, M, M],
      [M, G, G, F, F, F, F, G, G, M],
      [G, G, F, F, G, G, F, F, G, G],
      [G, F, F, G, C, C, G, F, F, G],
      [G, F, G, G, C, G, G, G, F, G],
      [G, G, F, G, G, G, G, F, G, G],
      [M, G, G, G, F, F, G, G, G, M],
      [M, M, G, G, G, G, G, G, M, M],
      [M, M, M, G, G, G, M, M, M, M],
    ],
  },
];

/**
 * Rotate a 10×10 quadrant by the given angle (clockwise).
 *
 * The grid is indexed as grid[r][q]:
 *   - 90°  CW: new[r][c] = old[N-1-c][r]
 *   - 180°:    new[r][c] = old[N-1-r][N-1-c]
 *   - 270° CW: new[r][c] = old[c][N-1-r]
 */
export function rotateQuadrant(
  quadrant: QuadrantTemplate,
  rotation: 0 | 90 | 180 | 270
): QuadrantTemplate {
  const N = 10;

  if (rotation === 0) {
    return quadrant.map(row => [...row]);
  }

  const result: QuadrantTemplate = Array.from({ length: N }, () =>
    new Array<Terrain>(N)
  );

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (rotation === 90) {
        result[r][c] = quadrant[N - 1 - c][r];
      } else if (rotation === 180) {
        result[r][c] = quadrant[N - 1 - r][N - 1 - c];
      } else {
        // 270°
        result[r][c] = quadrant[c][N - 1 - r];
      }
    }
  }

  return result;
}

/**
 * Randomly select `count` unique quadrants from the available pool.
 * Uses a Fisher-Yates shuffle to ensure an unbiased selection.
 */
export function selectRandomQuadrants(count: number = 4): Quadrant[] {
  if (count > QUADRANTS.length) {
    throw new Error(
      `Cannot select ${count} quadrants from ${QUADRANTS.length} available`
    );
  }

  const pool = [...QUADRANTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Assemble four 10×10 quadrant terrain grids into a 20×20 Board.
 * Castle locations are added at fixed interior positions in each quadrant.
 *
 * @param nw - Northwest quadrant terrain (top-left)
 * @param ne - Northeast quadrant terrain (top-right)
 * @param sw - Southwest quadrant terrain (bottom-left)
 * @param se - Southeast quadrant terrain (bottom-right)
 */
export function assembleBoard(
  nw: QuadrantTemplate,
  ne: QuadrantTemplate,
  sw: QuadrantTemplate,
  se: QuadrantTemplate
): Board {
  const board = new Board(20, 20);

  const quadrants = [
    { data: nw, offsetQ: 0, offsetR: 0 },
    { data: ne, offsetQ: 10, offsetR: 0 },
    { data: sw, offsetQ: 0, offsetR: 10 },
    { data: se, offsetQ: 10, offsetR: 10 },
  ];

  quadrants.forEach(({ data, offsetQ, offsetR }) => {
    for (let r = 0; r < 10; r++) {
      for (let q = 0; q < 10; q++) {
        const coord = { q: q + offsetQ, r: r + offsetR };
        const terrain = data[r]?.[q] ?? Terrain.Grass;

        const cell: HexCell = { coord, terrain, settlement: undefined };
        board.setCell(cell);
      }
    }
  });

  // Place castles at fixed interior positions within each quadrant
  const castlePositions = [
    { q: 3, r: 3 },   // NW quadrant
    { q: 16, r: 3 },  // NE quadrant
    { q: 3, r: 16 },  // SW quadrant
    { q: 16, r: 16 }, // SE quadrant
  ];

  castlePositions.forEach(pos => {
    const cell = board.getCell(pos);
    if (cell) {
      cell.location = Location.Castle;
    }
  });

  return board;
}

/**
 * Create a random 20×20 board by selecting and rotating 4 quadrant tiles.
 * Each call produces a different board configuration.
 */
export function createRandomBoard(): Board {
  const ROTATIONS: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

  const selected = selectRandomQuadrants(4);
  const [nw, ne, sw, se] = selected.map(quadrant =>
    rotateQuadrant(
      quadrant.terrain,
      ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)]
    )
  );

  return assembleBoard(nw, ne, sw, se);
}

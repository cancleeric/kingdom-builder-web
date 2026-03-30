import { Terrain, Location } from './terrain';

/**
 * A single cell in a quadrant template
 */
export interface QuadrantCell {
  terrain: Terrain;
  location?: Location;
}

/**
 * A 10×10 grid of QuadrantCells (grid[row][col])
 */
export type QuadrantGrid = QuadrantCell[][];

/**
 * A named quadrant template (one of four board pieces)
 */
export interface QuadrantTemplate {
  id: string;
  name: string;
  grid: QuadrantGrid;
}

export type Rotation = 0 | 90 | 180 | 270;

const QUADRANT_SIZE = 10;

// ─── cell helpers ────────────────────────────────────────────────────────────

const G  = (): QuadrantCell => ({ terrain: Terrain.Grass });
const Fo = (): QuadrantCell => ({ terrain: Terrain.Forest });
const D  = (): QuadrantCell => ({ terrain: Terrain.Desert });
const Fl = (): QuadrantCell => ({ terrain: Terrain.Flower });
const Ca = (): QuadrantCell => ({ terrain: Terrain.Canyon });
const W  = (): QuadrantCell => ({ terrain: Terrain.Water });
const M  = (): QuadrantCell => ({ terrain: Terrain.Mountain });
const Cs = (t: Terrain): QuadrantCell => ({ terrain: t, location: Location.Castle });

// ─── Quadrant templates ───────────────────────────────────────────────────────

/**
 * Quadrant A – Forest Realm
 * Dominant terrains: Forest, Grass; accents: Water, Mountain
 * Contains 2 Castles
 */
const forestRealm: QuadrantTemplate = {
  id: 'A',
  name: 'Forest Realm',
  grid: [
    // row 0
    [M(),  M(),  G(),  G(),  Fo(), Fo(), G(),  G(),  M(),  M() ],
    // row 1
    [M(),  G(),  G(),  Fo(), Fo(), Fo(), G(),  G(),  G(),  M() ],
    // row 2
    [G(),  G(),  Fo(), Fo(), Fo(), G(),  G(),  G(),  G(),  G() ],
    // row 3
    [G(),  Fo(), Fo(), G(),  G(),  G(),  W(),  W(),  G(),  G() ],
    // row 4
    [Fo(), Fo(), G(),  G(),  G(),  W(),  W(),  G(),  G(),  G() ],
    // row 5
    [Fo(), G(),  G(),  G(),  W(),  W(),  G(),  Cs(Terrain.Grass), G(), G() ],
    // row 6
    [G(),  G(),  G(),  W(),  W(),  G(),  G(),  G(),  Fo(), Fo()],
    // row 7
    [G(),  G(),  G(),  G(),  G(),  G(),  Fo(), Fo(), Fo(), Fo()],
    // row 8
    [Cs(Terrain.Grass), G(), G(), G(), G(), Fo(), Fo(), Fo(), G(), G() ],
    // row 9
    [G(),  G(),  G(),  G(),  Fo(), Fo(), Fo(), G(),  G(),  G() ],
  ],
};

/**
 * Quadrant B – Desert Canyon
 * Dominant terrains: Desert, Canyon; accents: Mountain, Grass
 * Contains 2 Castles
 */
const desertCanyon: QuadrantTemplate = {
  id: 'B',
  name: 'Desert Canyon',
  grid: [
    // row 0
    [M(),  M(),  Ca(), Ca(), D(),  D(),  Ca(), M(),  M(),  M() ],
    // row 1
    [M(),  Ca(), Ca(), D(),  D(),  D(),  Ca(), Ca(), M(),  M() ],
    // row 2
    [Ca(), Ca(), D(),  D(),  D(),  D(),  Ca(), Ca(), G(),  M() ],
    // row 3
    [Ca(), D(),  D(),  D(),  D(),  Ca(), Ca(), G(),  G(),  G() ],
    // row 4
    [D(),  D(),  D(),  D(),  Ca(), Ca(), G(),  G(),  G(),  G() ],
    // row 5
    [D(),  D(),  D(),  Ca(), Ca(), G(),  G(),  Cs(Terrain.Desert), G(), G() ],
    // row 6
    [D(),  D(),  Ca(), Ca(), G(),  G(),  G(),  G(),  D(),  D() ],
    // row 7
    [G(),  G(),  Ca(), G(),  G(),  G(),  D(),  D(),  D(),  D() ],
    // row 8
    [G(),  G(),  G(),  G(),  D(),  D(),  D(),  D(),  Ca(), G() ],
    // row 9
    [Cs(Terrain.Desert), G(), G(), D(), D(), D(), Ca(), Ca(), G(), G() ],
  ],
};

/**
 * Quadrant C – Flower Meadows
 * Dominant terrains: Flower, Grass; accents: Water, Mountain
 * Contains 2 Castles
 */
const flowerMeadows: QuadrantTemplate = {
  id: 'C',
  name: 'Flower Meadows',
  grid: [
    // row 0
    [M(),  M(),  G(),  G(),  Fl(), Fl(), G(),  G(),  M(),  M() ],
    // row 1
    [M(),  G(),  G(),  Fl(), Fl(), Fl(), G(),  G(),  W(),  M() ],
    // row 2
    [G(),  G(),  Fl(), Fl(), Fl(), G(),  G(),  W(),  W(),  G() ],
    // row 3
    [G(),  Fl(), Fl(), Fl(), G(),  G(),  W(),  W(),  G(),  G() ],
    // row 4
    [Fl(), Fl(), Fl(), G(),  G(),  W(),  W(),  G(),  G(),  G() ],
    // row 5
    [Fl(), Fl(), G(),  G(),  W(),  W(),  G(),  Cs(Terrain.Grass), G(), G() ],
    // row 6
    [G(),  G(),  G(),  W(),  W(),  G(),  G(),  G(),  Fl(), Fl()],
    // row 7
    [G(),  G(),  G(),  G(),  G(),  G(),  Fl(), Fl(), Fl(), Fl()],
    // row 8
    [Cs(Terrain.Grass), G(), G(), G(), Fl(), Fl(), Fl(), G(), G(), G() ],
    // row 9
    [G(),  G(),  G(),  Fl(), Fl(), Fl(), G(),  G(),  G(),  G() ],
  ],
};

/**
 * Quadrant D – Mountain Pass
 * Dominant terrains: Mountain, Canyon; accents: Desert, Grass
 * Contains 2 Castles
 */
const mountainPass: QuadrantTemplate = {
  id: 'D',
  name: 'Mountain Pass',
  grid: [
    // row 0
    [M(),  M(),  M(),  Ca(), Ca(), M(),  M(),  M(),  M(),  M() ],
    // row 1
    [M(),  M(),  Ca(), Ca(), Ca(), Ca(), M(),  M(),  M(),  M() ],
    // row 2
    [M(),  Ca(), Ca(), Ca(), Ca(), Ca(), Ca(), M(),  M(),  G() ],
    // row 3
    [Ca(), Ca(), Ca(), Ca(), D(),  D(),  Ca(), G(),  G(),  G() ],
    // row 4
    [Ca(), Ca(), D(),  D(),  D(),  D(),  G(),  G(),  G(),  G() ],
    // row 5
    [D(),  D(),  D(),  D(),  G(),  G(),  G(),  Cs(Terrain.Canyon), G(), G() ],
    // row 6
    [D(),  D(),  D(),  G(),  G(),  G(),  G(),  G(),  Ca(), Ca()],
    // row 7
    [G(),  G(),  G(),  G(),  G(),  Ca(), Ca(), Ca(), Ca(), M() ],
    // row 8
    [Cs(Terrain.Desert), G(), G(), G(), Ca(), Ca(), M(), M(), M(), M() ],
    // row 9
    [G(),  G(),  G(),  Ca(), Ca(), M(),  M(),  M(),  M(),  M() ],
  ],
};

/**
 * All available quadrant templates
 */
export const QUADRANT_TEMPLATES: QuadrantTemplate[] = [
  forestRealm,
  desertCanyon,
  flowerMeadows,
  mountainPass,
];

// ─── Rotation logic ───────────────────────────────────────────────────────────

/**
 * Rotate a quadrant grid 90° clockwise once.
 * new[c][N-1-r] = old[r][c]
 */
function rotateOnce(grid: QuadrantGrid): QuadrantGrid {
  const N = QUADRANT_SIZE;
  const result: QuadrantGrid = Array.from({ length: N }, () =>
    new Array<QuadrantCell>(N)
  );
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = { ...grid[r][c] };
    }
  }
  return result;
}

/**
 * Rotate a quadrant grid clockwise by the given angle (0 / 90 / 180 / 270 degrees).
 * The returned grid is always a new copy.
 */
export function rotateQuadrant(grid: QuadrantGrid, rotation: Rotation): QuadrantGrid {
  // Always return a deep copy for 0°
  let result = grid.map(row => row.map(cell => ({ ...cell })));
  const times = rotation / 90;
  for (let i = 0; i < times; i++) {
    result = rotateOnce(result);
  }
  return result;
}

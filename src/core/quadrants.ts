/**
 * Modular quadrant map system for Kingdom Builder (R39)
 *
 * Each quadrant is a 10×10 rectangular grid of hex cells stored as layout[r][q].
 * Rotation is implemented as rectangular 2D matrix rotation (not hex axial rotation),
 * which keeps the quadrant bounded within [0,9]×[0,9] after rotation.
 *
 * Rotation convention (visual, grid coordinates, N=size-1=9):
 *   rot0 (0°):    (q, r) → (q, r)           — identity
 *   rot1 (90° CW):  (q, r) → (N-r, q)       — transpose + flip rows
 *   rot2 (180°):  (q, r) → (N-q, N-r)       — flip both axes
 *   rot3 (270° CW): (q, r) → (r, N-q)       — transpose + flip cols
 *
 * Note: the original plan referenced hex axial rotation formulae
 * (-q-r, q) etc., which are valid for infinite hex maps but cause
 * unbounded coordinates when applied to a 10×10 sub-grid.
 * We use 2D matrix rotation here for bounded quadrant assembly.
 */

import { Terrain } from './terrain';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

/** Rotation index — 0=0°, 1=90°CW, 2=180°, 3=270°CW */
export type QuadrantRotation = 0 | 1 | 2 | 3;

/** Grid size for each quadrant (always 10×10). */
const N = 9; // max index = size - 1

/**
 * Quadrant template definition.
 * layout: 10×10 terrain grid — layout[r][q] (row-major, r=row, q=col)
 * castle: local coord for the Castle hex (q,r ∈ 0..9)
 * locationSlots: 2 location slots (positions only; type assigned at assembly time)
 */
export interface QuadrantTemplate {
  id: string;
  name: string;
  /** [10][10] — outer index is r, inner index is q */
  layout: Terrain[][];
  castle: { q: number; r: number };
  locationSlots: [
    { q: number; r: number },
    { q: number; r: number },
  ];
}

/**
 * A chosen quadrant instance (template + rotation) recorded for seed replay.
 */
export interface QuadrantInstance {
  templateId: string;
  rotation: QuadrantRotation;
}

// ────────────────────────────────────────────────────────────────
// Rotation helpers
// ────────────────────────────────────────────────────────────────

/**
 * Rotate a (q, r) grid coordinate within a 10×10 quadrant.
 * This is 2D matrix rotation of a rectangular grid — keeps output in [0, N].
 *
 * Verified math for (q, r) = (col, row):
 *   rot0 (0°):      (q, r)
 *   rot1 (90° CW):  (N-r, q)
 *   rot2 (180°):    (N-q, N-r)
 *   rot3 (270° CW): (r, N-q)
 */
export function rotateLocalCoord(
  q: number,
  r: number,
  rotation: QuadrantRotation,
): { q: number; r: number } {
  switch (rotation) {
    case 0:
      return { q, r };
    case 1:
      return { q: N - r, r: q };    // 90° CW
    case 2:
      return { q: N - q, r: N - r }; // 180°
    case 3:
      return { q: r, r: N - q };    // 270° CW
  }
}

/**
 * Normalize a set of coords so the minimum q and r become 0.
 * Not strictly needed for bounded grid rotation (output is already in [0,N]),
 * but kept as a utility for potential use in tests / future rotations.
 */
export function normalizeCoords<T extends { q: number; r: number }>(
  cells: T[],
): T[] {
  if (cells.length === 0) return cells;
  const minQ = Math.min(...cells.map((c) => c.q));
  const minR = Math.min(...cells.map((c) => c.r));
  return cells.map((c) => ({ ...c, q: c.q - minQ, r: c.r - minR }));
}

// ────────────────────────────────────────────────────────────────
// 8 Quadrant Templates
// ────────────────────────────────────────────────────────────────
//
// Design principles:
//  - Each quadrant has a dominant terrain (visual + strategic identity)
//  - EVERY quadrant contains ALL 5 buildable terrains (G/F/D/L/C) >= 3 cells each,
//    so ANY combination of 4 quadrants will pass the >= 5-per-terrain playability check
//  - Mountain sparingly inside (0-3 cells), buildable >= 60 per quadrant
//  - 2 location slots per quadrant, spread away from castle and borders
//  - Outer row r=0 is full Mountain (border), outer col q=9 side terrain fades to Grass
//    so that adjacent quadrant seams form a natural visual boundary

const G = Terrain.Grass;
const F = Terrain.Forest;
const D = Terrain.Desert;
const L = Terrain.Flower; // fLower
const C = Terrain.Canyon;
const W = Terrain.Water;
const M = Terrain.Mountain;

/**
 * Q1 — 翠林草原 (Verdant Forest Meadow)
 * Dominant: Forest (~35) + Grass (~25) | Accents: D(4), L(4), C(3), W(4)
 * Castle: (2,2) | Slots: (6,4), (4,7)
 */
const Q1_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, F, F, G, G, F, F, G, D, G],
  [M, F, F, F, G, G, F, F, D, G],
  [M, G, F, F, F, G, G, F, W, G],
  [M, G, G, F, F, F, G, W, W, L],
  [M, F, G, G, F, F, F, G, W, L],
  [M, F, F, G, D, F, G, G, C, L],
  [M, G, F, F, G, G, F, F, C, L],
  [M, G, G, F, F, G, G, F, C, G],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q2 — 赤砂荒漠 (Red Sand Desert)
 * Dominant: Desert (~38) | Accents: C(10), G(10), F(4), L(4), W(2)
 * Castle: (7,2) | Slots: (3,5), (6,7)
 */
const Q2_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, D, D, D, C, D, D, D, D, F],
  [M, D, D, D, D, C, D, D, D, F],
  [M, C, D, D, D, D, C, D, D, F],
  [M, D, C, D, L, D, D, D, C, F],
  [M, D, D, D, D, D, C, D, D, G],
  [M, D, D, C, D, D, D, D, D, G],
  [M, D, D, D, D, C, D, D, G, G],
  [M, C, D, L, D, D, D, G, W, L],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q3 — 花海平野 (Flower Field Plains)
 * Dominant: Flower (~35) + Grass (~20) | Accents: D(4), F(4), C(3), W(2)
 * Castle: (2,7) | Slots: (5,3), (7,6)
 */
const Q3_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, L, L, G, L, L, G, G, D, G],
  [M, G, L, L, L, G, L, L, D, G],
  [M, L, G, L, L, L, G, L, G, G],
  [M, L, L, G, G, L, L, G, L, F],
  [M, G, L, L, G, L, L, L, G, F],
  [M, L, G, G, L, G, L, G, L, F],
  [M, G, L, L, L, G, G, L, C, G],
  [M, C, G, L, G, L, G, G, W, G],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q4 — 峽谷迷宮 (Canyon Labyrinth)
 * Dominant: Canyon (~38) | Accents: D(8), G(10), F(4), L(4), W(2)
 * Castle: (7,7) | Slots: (3,4), (5,6)
 */
const Q4_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, C, C, D, C, C, D, C, C, F],
  [M, C, D, C, C, D, C, C, D, F],
  [M, D, C, C, D, C, C, D, C, F],
  [M, C, D, C, C, C, D, C, L, G],
  [M, C, C, D, G, C, C, C, D, L],
  [M, D, C, C, C, G, C, D, C, G],
  [M, C, C, D, C, C, G, C, C, G],
  [M, C, G, C, C, L, C, G, W, G],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q5 — 森林湖泊 (Forest Lake)
 * Dominant: Forest (~35) + Water(6) | Accents: D(4), L(4), C(3), G(16)
 * Castle: (2,7) | Slots: (5,3), (7,5)
 */
const Q5_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, F, F, F, G, F, F, F, D, G],
  [M, F, W, F, F, G, F, F, D, G],
  [M, F, W, W, F, F, G, F, G, G],
  [M, G, W, W, F, F, F, G, F, L],
  [M, F, G, W, F, G, F, F, G, L],
  [M, F, F, G, G, F, F, F, C, G],
  [M, G, F, F, F, F, G, F, C, G],
  [M, F, G, F, F, G, F, G, C, L],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q6 — 沙漠綠洲 (Desert Oasis)
 * Dominant: Desert (~30) + Grass (~25) | Accents: F(4), L(6), C(3), W(3)
 * Castle: (7,2) | Slots: (2,5), (5,7)
 */
const Q6_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, D, G, D, D, G, D, D, F, G],
  [M, D, D, G, D, D, G, D, F, G],
  [M, G, D, D, D, G, D, D, F, G],
  [M, D, D, G, L, D, D, G, D, G],
  [M, D, G, D, D, L, G, D, D, C],
  [M, G, D, D, G, D, D, L, G, C],
  [M, D, D, G, D, D, G, D, W, G],
  [M, G, D, D, D, G, D, D, W, L],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q7 — 花丘高地 (Flower Hill Highlands)
 * Dominant: Flower (~35) | Accents: M(2), G(20), D(4), F(4), C(3)
 * Castle: (7,7) | Slots: (3,3), (5,6)
 */
const Q7_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, L, L, G, L, M, L, L, D, G],
  [M, L, G, L, L, L, M, L, D, G],
  [M, G, L, L, G, L, L, G, L, G],
  [M, L, L, G, L, L, G, L, L, F],
  [M, L, G, L, L, G, L, L, G, F],
  [M, G, L, L, G, L, L, G, L, F],
  [M, L, L, G, L, G, L, L, G, G],
  [M, G, L, L, G, L, G, G, C, G],
  [M, G, G, G, G, G, G, G, G, G],
];

/**
 * Q8 — 草原水鄉 (Grassland Waterway)
 * Dominant: Grass (~45) | Accents: F(8), W(5), D(4), L(4), C(3)
 * Castle: (2,2) | Slots: (6,5), (4,7)
 */
const Q8_LAYOUT: Terrain[][] = [
  [M, M, M, M, M, M, M, M, M, M],
  [M, G, G, G, F, G, G, G, D, G],
  [M, G, G, F, G, G, F, G, D, G],
  [M, G, F, G, G, F, G, G, W, G],
  [M, G, G, G, L, G, F, W, W, G],
  [M, F, G, G, F, G, G, W, G, G],
  [M, G, G, G, G, G, G, G, C, G],
  [M, G, F, G, G, G, G, F, C, G],
  [M, G, G, G, F, G, G, G, C, L],
  [M, G, G, G, G, G, G, G, G, G],
];

// ────────────────────────────────────────────────────────────────
// Export template registry
// ────────────────────────────────────────────────────────────────

export const QUADRANT_TEMPLATES: QuadrantTemplate[] = [
  {
    id: 'Q1',
    name: '翠林草原',
    layout: Q1_LAYOUT,
    castle: { q: 2, r: 2 },
    locationSlots: [{ q: 6, r: 4 }, { q: 4, r: 7 }],
  },
  {
    id: 'Q2',
    name: '赤砂荒漠',
    layout: Q2_LAYOUT,
    castle: { q: 7, r: 2 },
    locationSlots: [{ q: 3, r: 5 }, { q: 6, r: 7 }],
  },
  {
    id: 'Q3',
    name: '花海平野',
    layout: Q3_LAYOUT,
    castle: { q: 2, r: 7 },
    locationSlots: [{ q: 5, r: 3 }, { q: 7, r: 6 }],
  },
  {
    id: 'Q4',
    name: '峽谷迷宮',
    layout: Q4_LAYOUT,
    castle: { q: 7, r: 7 },
    locationSlots: [{ q: 3, r: 4 }, { q: 5, r: 6 }],
  },
  {
    id: 'Q5',
    name: '森林湖泊',
    layout: Q5_LAYOUT,
    castle: { q: 2, r: 7 },
    locationSlots: [{ q: 6, r: 2 }, { q: 3, r: 5 }],
  },
  {
    id: 'Q6',
    name: '沙漠綠洲',
    layout: Q6_LAYOUT,
    castle: { q: 7, r: 2 },
    locationSlots: [{ q: 2, r: 5 }, { q: 5, r: 7 }],
  },
  {
    id: 'Q7',
    name: '花丘高地',
    layout: Q7_LAYOUT,
    castle: { q: 7, r: 7 },
    locationSlots: [{ q: 3, r: 3 }, { q: 5, r: 6 }],
  },
  {
    id: 'Q8',
    name: '草原水鄉',
    layout: Q8_LAYOUT,
    castle: { q: 2, r: 2 },
    locationSlots: [{ q: 6, r: 5 }, { q: 4, r: 7 }],
  },
];

// ────────────────────────────────────────────────────────────────
// Expanded quadrant cell list (for assembly)
// ────────────────────────────────────────────────────────────────

export interface QuadrantCell {
  q: number;
  r: number;
  terrain: Terrain;
}

/**
 * Expand a template's layout into a flat list of cells and apply rotation.
 * With 2D grid rotation the output coordinates remain in [0, N], so no
 * normalization step is required.
 */
export function expandAndRotateTemplate(
  template: QuadrantTemplate,
  rotation: QuadrantRotation,
): {
  cells: QuadrantCell[];
  castle: { q: number; r: number };
  locationSlots: [{ q: number; r: number }, { q: number; r: number }];
} {
  // 1. Flatten layout into raw cells
  const raw: QuadrantCell[] = [];
  for (let r = 0; r < 10; r++) {
    for (let q = 0; q < 10; q++) {
      raw.push({ q, r, terrain: template.layout[r][q] });
    }
  }

  // 2. Rotate all cells (output stays within [0,9])
  const rotatedCells = raw.map((c) => {
    const { q, r } = rotateLocalCoord(c.q, c.r, rotation);
    return { q, r, terrain: c.terrain };
  });

  // 3. Rotate castle and slot coordinates (same transformation)
  const castle = rotateLocalCoord(template.castle.q, template.castle.r, rotation);
  const slot0 = rotateLocalCoord(template.locationSlots[0].q, template.locationSlots[0].r, rotation);
  const slot1 = rotateLocalCoord(template.locationSlots[1].q, template.locationSlots[1].r, rotation);

  return {
    cells: rotatedCells,
    castle,
    locationSlots: [slot0, slot1],
  };
}

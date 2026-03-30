import { Board } from './board';
import { QUADRANT_TEMPLATES, QuadrantTemplate, QuadrantGrid, Rotation, rotateQuadrant } from './quadrant';
import { HexCell } from '../types';
import { AxialCoord } from './hex';

const QUADRANT_SIZE = 10;
const ROTATIONS: Rotation[] = [0, 90, 180, 270];

/**
 * A quadrant template paired with the rotation that will be applied when assembling
 */
export interface SelectedQuadrant {
  template: QuadrantTemplate;
  rotation: Rotation;
}

/**
 * Select `count` distinct quadrant templates at random (without replacement)
 * and assign each a random rotation.
 *
 * @param count  Number of quadrants to select (default: 4)
 * @returns      Array of { template, rotation } pairs
 * @throws       RangeError if count exceeds the number of available templates
 */
export function selectRandomQuadrants(count: number = 4): SelectedQuadrant[] {
  if (count > QUADRANT_TEMPLATES.length) {
    throw new RangeError(
      `Cannot select ${count} quadrants from a pool of ${QUADRANT_TEMPLATES.length}`
    );
  }

  // Fisher-Yates shuffle on a copy of the template array
  const pool = [...QUADRANT_TEMPLATES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).map(template => ({
    template,
    rotation: ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)],
  }));
}

/**
 * Assemble a 20×20 Board from exactly 4 rotated quadrant grids.
 *
 * Placement order:
 *   quadrants[0] → NW (q: 0–9,  r: 0–9)
 *   quadrants[1] → NE (q: 10–19, r: 0–9)
 *   quadrants[2] → SW (q: 0–9,  r: 10–19)
 *   quadrants[3] → SE (q: 10–19, r: 10–19)
 *
 * Each rotated grid is a QuadrantGrid where grid[row][col] corresponds to the
 * cell at axial coordinate { q: col + offsetQ, r: row + offsetR }.
 */
export function assembleBoard(
  quadrants: [QuadrantGrid, QuadrantGrid, QuadrantGrid, QuadrantGrid]
): Board {
  const board = new Board(20, 20);

  const offsets: { offsetQ: number; offsetR: number }[] = [
    { offsetQ: 0,  offsetR: 0  }, // NW
    { offsetQ: 10, offsetR: 0  }, // NE
    { offsetQ: 0,  offsetR: 10 }, // SW
    { offsetQ: 10, offsetR: 10 }, // SE
  ];

  quadrants.forEach((grid, idx) => {
    const { offsetQ, offsetR } = offsets[idx];
    for (let r = 0; r < QUADRANT_SIZE; r++) {
      for (let c = 0; c < QUADRANT_SIZE; c++) {
        const quadCell = grid[r][c];
        const coord: AxialCoord = { q: c + offsetQ, r: r + offsetR };
        const cell: HexCell = {
          coord,
          terrain: quadCell.terrain,
          location: quadCell.location,
        };
        board.setCell(cell);
      }
    }
  });

  return board;
}

/**
 * Create a random 20×20 board by selecting 4 distinct quadrant templates,
 * rotating each randomly, and assembling them together.
 *
 * Replaces `createDefaultBoard()` for game initialisation.
 */
export function createRandomBoard(): Board {
  const selected = selectRandomQuadrants(4);
  const rotatedGrids = selected.map(({ template, rotation }) =>
    rotateQuadrant(template.grid, rotation)
  ) as [QuadrantGrid, QuadrantGrid, QuadrantGrid, QuadrantGrid];
  return assembleBoard(rotatedGrids);
}

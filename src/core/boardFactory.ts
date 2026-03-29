import { Board } from './board';
import {
  QuadrantTemplate,
  rotateQuadrant,
  QUADRANT_TEMPLATES,
} from './quadrant';
import { HexCell } from '../types';

/**
 * A quadrant template paired with the rotation to apply when assembling the board.
 */
export interface SelectedQuadrant {
  template: QuadrantTemplate;
  rotation: 0 | 90 | 180 | 270;
}

/**
 * The four board positions and their q/r offsets.
 */
const QUADRANT_POSITIONS = [
  { offsetQ: 0, offsetR: 0 },   // NW
  { offsetQ: 10, offsetR: 0 },  // NE
  { offsetQ: 0, offsetR: 10 },  // SW
  { offsetQ: 10, offsetR: 10 }, // SE
] as const;

const ROTATIONS: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];

/**
 * Randomly select `count` distinct quadrant templates from the pool,
 * each with a random rotation.
 */
export function selectRandomQuadrants(count: number = 4): SelectedQuadrant[] {
  const available = [...QUADRANT_TEMPLATES];
  const selected: SelectedQuadrant[] = [];

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const [template] = available.splice(idx, 1);
    const rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
    selected.push({ template, rotation });
  }

  return selected;
}

/**
 * Assemble a 20×20 Board from four SelectedQuadrant entries.
 * The quadrants are placed in NW, NE, SW, SE order.
 */
export function assembleBoard(quadrants: SelectedQuadrant[]): Board {
  const board = new Board(20, 20);

  quadrants.forEach((selected, i) => {
    const { template, rotation } = selected;
    const rotatedGrid = rotateQuadrant(template.grid, rotation);
    const { offsetQ, offsetR } = QUADRANT_POSITIONS[i];

    for (let r = 0; r < 10; r++) {
      for (let q = 0; q < 10; q++) {
        const cell = rotatedGrid[r][q];
        const hexCell: HexCell = {
          coord: { q: q + offsetQ, r: r + offsetR },
          terrain: cell.terrain,
          location: cell.location,
          settlement: undefined,
        };
        board.setCell(hexCell);
      }
    }
  });

  return board;
}

/**
 * Create a randomised 20×20 board by selecting 4 random quadrants
 * (each with a random rotation) and assembling them.
 */
export function createRandomBoard(): Board {
  const quadrants = selectRandomQuadrants(4);
  return assembleBoard(quadrants);
}

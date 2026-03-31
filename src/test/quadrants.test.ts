import { describe, it, expect } from 'vitest';
import {
  QUADRANT_TEMPLATES,
  rotateQuadrant,
  selectRandomQuadrants,
  assembleBoard,
  createRandomBoard,
} from '../core/quadrants';
import { TerrainType } from '../types';

const VALID_TERRAINS: TerrainType[] = ['grass', 'forest', 'desert', 'flower', 'canyon', 'water', 'mountain', 'castle'];

describe('QUADRANT_TEMPLATES', () => {
  it('has at least 4 templates', () => {
    expect(QUADRANT_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('each template is 10x10', () => {
    for (const q of QUADRANT_TEMPLATES) {
      expect(q.terrain.length).toBe(10);
      for (const row of q.terrain) {
        expect(row.length).toBe(10);
      }
    }
  });

  it('each cell has a valid terrain type', () => {
    for (const q of QUADRANT_TEMPLATES) {
      for (const row of q.terrain) {
        for (const cell of row) {
          expect(VALID_TERRAINS).toContain(cell);
        }
      }
    }
  });
});

describe('rotateQuadrant', () => {
  const q = QUADRANT_TEMPLATES[0];

  it('returns same terrain for 0 rotation', () => {
    const rotated = rotateQuadrant(q, 0);
    expect(rotated.terrain).toEqual(q.terrain);
  });

  it('correctly rotates 90 degrees', () => {
    const rotated = rotateQuadrant(q, 90);
    // new[j][9-i] = old[i][j], so rotated[0][9] = old[0][0]
    expect(rotated.terrain[0][9]).toBe(q.terrain[0][0]);
    expect(rotated.terrain[9][9]).toBe(q.terrain[0][9]);
    expect(rotated.terrain[0][0]).toBe(q.terrain[9][0]);
  });

  it('correctly rotates 180 degrees', () => {
    const rotated = rotateQuadrant(q, 180);
    // new[9-i][9-j] = old[i][j], so rotated[9][9] = old[0][0]
    expect(rotated.terrain[9][9]).toBe(q.terrain[0][0]);
    expect(rotated.terrain[0][0]).toBe(q.terrain[9][9]);
  });

  it('correctly rotates 270 degrees', () => {
    const rotated = rotateQuadrant(q, 270);
    // new[9-j][i] = old[i][j], so rotated[9][0] = old[0][0]
    expect(rotated.terrain[9][0]).toBe(q.terrain[0][0]);
    expect(rotated.terrain[0][0]).toBe(q.terrain[0][9]);
  });

  it('rotating 360 degrees returns original', () => {
    const r90 = rotateQuadrant(q, 90);
    const r180 = rotateQuadrant(r90, 90);
    const r270 = rotateQuadrant(r180, 90);
    const r360 = rotateQuadrant(r270, 90);
    expect(r360.terrain).toEqual(q.terrain);
  });
});

describe('selectRandomQuadrants', () => {
  it('returns requested count', () => {
    const result = selectRandomQuadrants(4);
    expect(result.length).toBe(4);
  });

  it('returns unique quadrants', () => {
    const result = selectRandomQuadrants(4);
    const ids = result.map(q => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(4);
  });

  it('works for count less than or equal to QUADRANT_TEMPLATES.length', () => {
    const result = selectRandomQuadrants(2);
    expect(result.length).toBe(2);
    const ids = result.map(q => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(2);
  });
});

describe('assembleBoard', () => {
  const quadrants = QUADRANT_TEMPLATES.slice(0, 4).map(q => rotateQuadrant(q, 0));

  it('returns 20x20 board', () => {
    const board = assembleBoard(quadrants);
    expect(board.length).toBe(20);
    for (const row of board) {
      expect(row.length).toBe(20);
    }
  });

  it('places quadrants in correct positions', () => {
    const board = assembleBoard(quadrants);
    expect(board[0][0].terrain).toBe(quadrants[0].terrain[0][0]);
    expect(board[0][19].terrain).toBe(quadrants[1].terrain[0][9]);
    expect(board[19][0].terrain).toBe(quadrants[2].terrain[9][0]);
    expect(board[19][19].terrain).toBe(quadrants[3].terrain[9][9]);
  });

  it('top-left quadrant is quadrants[0]', () => {
    const board = assembleBoard(quadrants);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        expect(board[r][c].terrain).toBe(quadrants[0].terrain[r][c]);
      }
    }
  });

  it('top-right quadrant is quadrants[1]', () => {
    const board = assembleBoard(quadrants);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        expect(board[r][c + 10].terrain).toBe(quadrants[1].terrain[r][c]);
      }
    }
  });

  it('bottom-left quadrant is quadrants[2]', () => {
    const board = assembleBoard(quadrants);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        expect(board[r + 10][c].terrain).toBe(quadrants[2].terrain[r][c]);
      }
    }
  });

  it('bottom-right quadrant is quadrants[3]', () => {
    const board = assembleBoard(quadrants);
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        expect(board[r + 10][c + 10].terrain).toBe(quadrants[3].terrain[r][c]);
      }
    }
  });
});

describe('createRandomBoard', () => {
  it('returns 20x20 board', () => {
    const board = createRandomBoard();
    expect(board.length).toBe(20);
    for (const row of board) {
      expect(row.length).toBe(20);
    }
  });

  it('produces different boards on consecutive calls (probabilistic)', () => {
    let different = false;
    const board1 = createRandomBoard();
    for (let i = 0; i < 5; i++) {
      const board2 = createRandomBoard();
      if (JSON.stringify(board1) !== JSON.stringify(board2)) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('all cells have valid terrain types', () => {
    const board = createRandomBoard();
    for (const row of board) {
      for (const cell of row) {
        expect(VALID_TERRAINS).toContain(cell.terrain);
      }
    }
  });
});

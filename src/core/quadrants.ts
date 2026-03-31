import { QuadrantTemplate, BoardState, HexCell, TerrainType, Rotation } from '../types';

function makeTerrain(rows: string[]): TerrainType[][] {
  const map: Record<string, TerrainType> = {
    G: 'grass', F: 'forest', D: 'desert', L: 'flower',
    C: 'canyon', W: 'water', M: 'mountain', K: 'castle',
  };
  return rows.map(row => row.split('').map(ch => map[ch]));
}

export const QUADRANT_TEMPLATES: QuadrantTemplate[] = [
  {
    id: 'q1',
    name: 'Verdant Hills',
    terrain: makeTerrain([
      'GGGGFFDDCC',
      'GGGGFFDDCC',
      'GGGFFFDDCC',
      'GGFFLLDDWW',
      'GFFLLLDDWW',
      'FFLLLLCCWW',
      'FLLLLCCCMM',
      'LLLLCCCKMM',
      'LLLCCCMMMM',
      'LLCCCCMMMM',
    ]),
  },
  {
    id: 'q2',
    name: 'Desert Wastes',
    terrain: makeTerrain([
      'DDDDCCCCGG',
      'DDDDDCCCGG',
      'DDDDDDCCGG',
      'DDDDDCCGGG',
      'DDDDCCGGGG',
      'MMMDDCCGGG',
      'MMMDCCGGFF',
      'MMMKCCFFFF',
      'WWWWWCFFFF',
      'WWWWWWFFLL',
    ]),
  },
  {
    id: 'q3',
    name: 'Forest Lake',
    terrain: makeTerrain([
      'FFFFLLLLCC',
      'FFFFLLLLCC',
      'FFFFLLLCCC',
      'FFFLLLCCCC',
      'FFLLLCCCDD',
      'FLLLWWWDDD',
      'FLLWWWWDDD',
      'LLWWWWKDDD',
      'MMWWWWDDDD',
      'MMMMWDDDDD',
    ]),
  },
  {
    id: 'q4',
    name: 'Canyon Peaks',
    terrain: makeTerrain([
      'CCCCCMMMMM',
      'CCCCMMMMMM',
      'CCCMMMMMMM',
      'CCKMMMGGGW',
      'CCCMMGGGWW',
      'CCCCGGGGWW',
      'DDDCGGFFWW',
      'DDDDGFFFLW',
      'DDDLLFFFLL',
      'DDLLLFFFFF',
    ]),
  },
  {
    id: 'q5',
    name: 'Misty Marshes',
    terrain: makeTerrain([
      'WWWWWGGGGG',
      'WWWWGGGGGG',
      'WWWGGGGGFF',
      'WWGGGGFFFF',
      'WGGGFFFFLL',
      'GGFFFLLLLC',
      'GGFFLLLCCC',
      'GFFLLLKCCC',
      'FFLLLDDDCC',
      'FLLLDDDCCC',
    ]),
  },
];

export function rotateQuadrant(quadrant: QuadrantTemplate, rotation: Rotation): QuadrantTemplate {
  if (rotation === 0) {
    return { ...quadrant, terrain: quadrant.terrain.map(row => [...row]) };
  }

  const size = 10;
  const old = quadrant.terrain;
  const newTerrain: TerrainType[][] = Array.from({ length: size }, () => new Array(size).fill('grass' as TerrainType));

  if (rotation === 90) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newTerrain[j][size - 1 - i] = old[i][j];
      }
    }
  } else if (rotation === 180) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newTerrain[size - 1 - i][size - 1 - j] = old[i][j];
      }
    }
  } else if (rotation === 270) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newTerrain[size - 1 - j][i] = old[i][j];
      }
    }
  }

  return { ...quadrant, terrain: newTerrain };
}

export function selectRandomQuadrants(count: number): QuadrantTemplate[] {
  const shuffled = [...QUADRANT_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function assembleBoard(quadrants: QuadrantTemplate[]): BoardState {
  const board: BoardState = [];
  for (let r = 0; r < 20; r++) {
    const row: HexCell[] = [];
    for (let c = 0; c < 20; c++) {
      let qIdx: number;
      let qRow: number;
      let qCol: number;
      if (r < 10 && c < 10) { qIdx = 0; qRow = r; qCol = c; }
      else if (r < 10 && c >= 10) { qIdx = 1; qRow = r; qCol = c - 10; }
      else if (r >= 10 && c < 10) { qIdx = 2; qRow = r - 10; qCol = c; }
      else { qIdx = 3; qRow = r - 10; qCol = c - 10; }
      const terrain = quadrants[qIdx].terrain[qRow][qCol];
      row.push({ row: r, col: c, terrain, hasCastle: terrain === 'castle' });
    }
    board.push(row);
  }
  return board;
}

export function createRandomBoard(): BoardState {
  const quadrants = selectRandomQuadrants(4);
  const rotations: Rotation[] = [0, 90, 180, 270];
  const rotated = quadrants.map(q => {
    const rotation = rotations[Math.floor(Math.random() * 4)];
    return rotateQuadrant(q, rotation);
  });
  return assembleBoard(rotated);
}

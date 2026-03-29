import type { HexCoord, HexCell, Terrain } from '../types';

// Hex grid pixel coordinates (pointy-top orientation)
export const HEX_SIZE = 32; // pixels from center to corner

export function hexToPixel(
  coord: HexCoord,
  size: number = HEX_SIZE
): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = size * ((3 / 2) * coord.r);
  return { x, y };
}

export function pixelToHex(
  x: number,
  y: number,
  size: number = HEX_SIZE
): HexCoord {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  return hexRound({ q, r });
}

export function hexRound(coord: { q: number; r: number }): HexCoord {
  const s = -coord.q - coord.r;
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  return directions.map((d) => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export const TERRAIN_COLORS: Record<Terrain, string> = {
  grass: '#7ec850',
  forest: '#2d7d32',
  desert: '#e8c96a',
  flower: '#e91e8c',
  canyon: '#bf6020',
  water: '#4fc3f7',
  mountain: '#9e9e9e',
  castle: '#8d6e63',
  location: '#ffd700',
};

export const TERRAIN_LABELS: Record<Terrain, string> = {
  grass: '草地',
  forest: '森林',
  desert: '沙漠',
  flower: '花田',
  canyon: '峽谷',
  water: '水域',
  mountain: '山脈',
  castle: '城堡',
  location: '地點',
};

export const BUILDABLE_TERRAINS: Terrain[] = [
  'grass',
  'forest',
  'desert',
  'flower',
  'canyon',
];

export function isBuildable(terrain: Terrain): boolean {
  return BUILDABLE_TERRAINS.includes(terrain);
}

// Generate a simple demo board (10x10 offset grid)
export function generateDemoBoard(): HexCell[] {
  const cells: HexCell[] = [];
  const terrains: Terrain[] = [
    'grass',
    'forest',
    'desert',
    'flower',
    'canyon',
    'water',
    'mountain',
  ];

  for (let r = -5; r <= 5; r++) {
    const qMin = -5 - Math.min(0, r);
    const qMax = 5 - Math.max(0, r);
    for (let q = qMin; q <= qMax; q++) {
      const terrainIndex = Math.abs((q * 3 + r * 7) % terrains.length);
      const terrain = terrains[terrainIndex];
      // Add some location tiles
      const isLocation = (q + r) % 7 === 0 && terrain !== 'water' && terrain !== 'mountain';
      cells.push({
        coord: { q, r },
        terrain: isLocation ? 'location' : terrain,
        hasSettlement: false,
        isLocation,
      });
    }
  }

  return cells;
}

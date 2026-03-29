/**
 * Hexagonal Grid System using Axial Coordinates
 * Based on: https://www.redblobgames.com/grids/hexagons/
 * 
 * Using pointy-top orientation for hex tiles
 */

export interface AxialCoord {
  q: number; // column
  r: number; // row
}

export interface PixelCoord {
  x: number;
  y: number;
}

// Hex size for rendering
export const HEX_SIZE = 30;

// Six directions for neighbors (pointy-top orientation)
export const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
];

/**
 * Get the neighbor hex in a given direction
 */
export function hexNeighbor(hex: AxialCoord, direction: number): AxialCoord {
  const dir = HEX_DIRECTIONS[direction];
  return { q: hex.q + dir.q, r: hex.r + dir.r };
}

/**
 * Get all six neighbors of a hex
 */
export function hexNeighbors(hex: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map((_, i) => hexNeighbor(hex, i));
}

/**
 * Convert axial coordinates to pixel coordinates (pointy-top)
 */
export function axialToPixel(hex: AxialCoord, size: number = HEX_SIZE): PixelCoord {
  const x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
  const y = size * (3 / 2 * hex.r);
  return { x, y };
}

/**
 * Convert pixel coordinates to axial coordinates (pointy-top)
 */
export function pixelToAxial(pixel: PixelCoord, size: number = HEX_SIZE): AxialCoord {
  const q = (Math.sqrt(3) / 3 * pixel.x - 1 / 3 * pixel.y) / size;
  const r = (2 / 3 * pixel.y) / size;
  return hexRound({ q, r });
}

/**
 * Convert axial to cube coordinates
 */
export function axialToCube(hex: AxialCoord): { x: number; y: number; z: number } {
  const x = hex.q;
  const z = hex.r;
  const y = -x - z;
  return { x, y, z };
}

/**
 * Round fractional cube coordinates to nearest hex
 */
export function hexRound(hex: AxialCoord): AxialCoord {
  const cube = axialToCube(hex);
  
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

/**
 * Calculate Manhattan distance between two hexes
 */
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  );
}

/**
 * Check if two hexes are equal
 */
export function hexEquals(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Convert hex to string key for maps/sets
 */
export function hexToKey(hex: AxialCoord): string {
  return `${hex.q},${hex.r}`;
}

/**
 * Parse hex key back to coordinates
 */
export function keyToHex(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Get polygon points for rendering a hex (pointy-top)
 */
export function hexCorners(hex: AxialCoord, size: number = HEX_SIZE): PixelCoord[] {
  const center = axialToPixel(hex, size);
  const corners: PixelCoord[] = [];
  
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  
  return corners;
}

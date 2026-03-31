/**
 * Axial coordinate system for hexagonal grids
 * q = column, r = row
 */
export interface AxialCoord {
  q: number;
  r: number;
}

/**
 * Pixel coordinate for rendering
 */
export interface PixelCoord {
  x: number;
  y: number;
}

export const HEX_SIZE = 30;

/**
 * The 6 neighbor directions in axial coordinates (pointy-top)
 */
export const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/**
 * Get the neighbor hex in the given direction
 */
export function hexNeighbor(hex: AxialCoord, direction: number): AxialCoord {
  const dir = HEX_DIRECTIONS[direction % 6];
  return { q: hex.q + dir.q, r: hex.r + dir.r };
}

/**
 * Get all 6 neighbors of a hex
 */
export function hexNeighbors(hex: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map(dir => ({ q: hex.q + dir.q, r: hex.r + dir.r }));
}

/**
 * Convert axial coordinates to pixel coordinates (pointy-top layout)
 */
export function axialToPixel(hex: AxialCoord): PixelCoord {
  const x = HEX_SIZE * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = HEX_SIZE * (3 / 2) * hex.r;
  return { x, y };
}

/**
 * Convert pixel coordinates to axial coordinates
 */
export function pixelToAxial(pixel: PixelCoord): AxialCoord {
  const q = (pixel.x * (Math.sqrt(3) / 3) - pixel.y / 3) / HEX_SIZE;
  const r = (pixel.y * (2 / 3)) / HEX_SIZE;
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
 * Round fractional axial coordinates to the nearest hex
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
 * Calculate the distance between two hexes
 */
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const cubeA = axialToCube(a);
  const cubeB = axialToCube(b);
  return (
    Math.max(
      Math.abs(cubeA.x - cubeB.x),
      Math.abs(cubeA.y - cubeB.y),
      Math.abs(cubeA.z - cubeB.z)
    )
  );
}

/**
 * Check if two hex coordinates are equal
 */
export function hexEquals(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

/**
 * Convert axial coordinate to a string key for use in Maps
 */
export function hexToKey(hex: AxialCoord): string {
  return `${hex.q},${hex.r}`;
}

/**
 * Convert a string key back to axial coordinates
 */
export function keyToHex(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Get the 6 corner pixel coordinates of a hex (pointy-top)
 */
export function hexCorners(center: PixelCoord): PixelCoord[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    return {
      x: center.x + HEX_SIZE * Math.cos(angleRad),
      y: center.y + HEX_SIZE * Math.sin(angleRad),
    };
  });
}

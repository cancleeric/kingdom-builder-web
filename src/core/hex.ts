import type { Hex } from '../types';

// Convert axial to cube coordinates
export function axialToCube(hex: Hex): { x: number; y: number; z: number } {
  return { x: hex.q, y: -hex.q - hex.r, z: hex.r };
}

// Hex distance (cube coordinate distance)
export function hexDistance(a: Hex, b: Hex): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return (
    (Math.abs(ac.x - bc.x) + Math.abs(ac.y - bc.y) + Math.abs(ac.z - bc.z)) /
    2
  );
}

// Six neighbor directions in axial coordinates
export const HEX_DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

// Get all 6 neighbors of a hex
export function hexNeighbors(hex: Hex): Hex[] {
  return HEX_DIRECTIONS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

// Check if two hexes are equal
export function hexEqual(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

// Convert hex to a string key for map lookups
export function hexKey(hex: Hex): string {
  return `${hex.q},${hex.r}`;
}

// Convert pixel position to hex (pointy-top hexes)
export function pixelToHex(
  x: number,
  y: number,
  size: number,
  origin: { x: number; y: number }
): Hex {
  const relX = x - origin.x;
  const relY = y - origin.y;
  const q = ((Math.sqrt(3) / 3) * relX - (1 / 3) * relY) / size;
  const r = ((2 / 3) * relY) / size;
  return hexRound({ q, r });
}

// Round fractional hex to nearest hex
export function hexRound(hex: { q: number; r: number }): Hex {
  let q = Math.round(hex.q);
  let r = Math.round(hex.r);
  const s = Math.round(-hex.q - hex.r);
  const qDiff = Math.abs(q - hex.q);
  const rDiff = Math.abs(r - hex.r);
  const sDiff = Math.abs(s - (-hex.q - hex.r));
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

// Convert hex to pixel position (pointy-top hexes)
export function hexToPixel(
  hex: Hex,
  size: number,
  origin: { x: number; y: number }
): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = size * ((3 / 2) * hex.r);
  return { x: x + origin.x, y: y + origin.y };
}

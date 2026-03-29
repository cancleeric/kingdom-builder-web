import type { HexCoord } from '../types';

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
  ];
  return directions.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexEquals(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const x = size * (3 / 2) * coord.q;
  const y = size * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

export function hexCorners(center: { x: number; y: number }, size: number): { x: number; y: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i);
    return {
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    };
  });
}

export interface HexCoord {
  q: number
  r: number
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs((a.q + a.r) - (b.q + b.r))
  )
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const directions = [
    { q: 1, r: 0 }, { q: -1, r: 0 },
    { q: 0, r: 1 }, { q: 0, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 },
  ]
  return directions.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }))
}

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`
}

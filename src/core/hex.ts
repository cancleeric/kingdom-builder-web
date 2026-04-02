import type { HexCoordinate } from '../types/game'

const HEX_DIRECTIONS: HexCoordinate[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

export function hexKey({ q, r }: HexCoordinate): string {
  return `${q},${r}`
}

export function getNeighbors(hex: HexCoordinate): HexCoordinate[] {
  return HEX_DIRECTIONS.map((direction) => ({
    q: hex.q + direction.q,
    r: hex.r + direction.r,
  }))
}

export function createHexes(radius: number): HexCoordinate[] {
  const result: HexCoordinate[] = []

  for (let q = -radius; q <= radius; q += 1) {
    const r1 = Math.max(-radius, -q - radius)
    const r2 = Math.min(radius, -q + radius)

    for (let r = r1; r <= r2; r += 1) {
      result.push({ q, r })
    }
  }

  return result
}

export function axialToPixel(hex: HexCoordinate, size: number) {
  const x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r)
  const y = size * ((3 / 2) * hex.r)

  return { x, y }
}

export function buildHexPolygonPoints(hex: HexCoordinate, size: number): string {
  const center = axialToPixel(hex, size)

  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30)
    const x = center.x + size * Math.cos(angle)
    const y = center.y + size * Math.sin(angle)

    return `${x},${y}`
  }).join(' ')
}
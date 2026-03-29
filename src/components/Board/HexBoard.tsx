import { useGameStore } from '../../store/gameStore'
import { TERRAIN_COLORS } from '../../core/terrain'
import { getValidPlacements } from '../../core/rules'
import type { HexCoord } from '../../core/hex'

const HEX_SIZE = 30
const BOARD_COLS = 10
const BOARD_ROWS = 10

function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3/2 * q)
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  return { x: x + 160, y: y + 50 }
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i)
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b']

export default function HexBoard() {
  const board = useGameStore(state => state.board)
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex)
  const currentTerrain = useGameStore(state => state.currentTerrain)
  const placeSettlement = useGameStore(state => state.placeSettlement)

  const validPlacements = currentTerrain
    ? getValidPlacements(board, currentPlayerIndex, currentTerrain)
    : []

  const isValid = (coord: HexCoord) =>
    validPlacements.some(v => v.q === coord.q && v.r === coord.r)

  const cells = Array.from(board.values())
  const width = HEX_SIZE * 3 * BOARD_COLS + 160
  const height = HEX_SIZE * Math.sqrt(3) * BOARD_ROWS + 100

  return (
    <div className="overflow-auto" data-testid="hex-board">
      <svg
        width={width}
        height={height}
        style={{ display: 'block', margin: 'auto' }}
      >
        {cells.map(cell => {
          const { q, r } = cell.coord
          const { x, y } = hexToPixel(q, r)
          const pts = hexPoints(x, y, HEX_SIZE - 2)
          const valid = isValid(cell.coord)
          const color = TERRAIN_COLORS[cell.terrain]
          const key = `${q},${r}`

          return (
            <g
              key={key}
              onClick={() => {
                if (valid && cell.owner === null) {
                  placeSettlement(q, r)
                }
              }}
              style={{ cursor: valid && cell.owner === null ? 'pointer' : 'default' }}
              data-testid={`hex-${q}-${r}`}
              data-terrain={cell.terrain}
              data-valid={valid ? 'true' : 'false'}
              data-owner={cell.owner !== null ? cell.owner : ''}
            >
              <polygon
                points={pts}
                fill={cell.owner !== null ? PLAYER_COLORS[cell.owner] || color : color}
                stroke={valid ? '#ffffff' : '#374151'}
                strokeWidth={valid ? 2 : 1}
                opacity={0.9}
              />
              {cell.terrain === 'location' && cell.hasLocationTile && (
                <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#1f2937">
                  🏛
                </text>
              )}
              {cell.terrain === 'castle' && (
                <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#fff">
                  🏰
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

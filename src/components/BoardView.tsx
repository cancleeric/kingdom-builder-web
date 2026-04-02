import { axialToPixel, buildHexPolygonPoints } from '../core/hex'
import { TERRAIN_META } from '../core/terrain'
import { useGameStore } from '../store/gameStore'
import type { Tile } from '../types/game'

interface BoardViewProps {
  board: Tile[]
  legalMoves: Tile[]
}

const HEX_SIZE = 34
const VIEW_BOX = '-260 -250 520 500'

export function BoardView({ board, legalMoves }: BoardViewProps) {
  const placeOnBoard = useGameStore((state) => state.placeOnBoard)
  const legalMoveIds = new Set(legalMoves.map((tile) => tile.id))
  const hasLegalMoves = legalMoveIds.size > 0

  return (
    <div>
      <div className="board-frame">
        <svg className="board-svg" viewBox={VIEW_BOX} role="img" aria-label="Kingdom Builder board">
          {board.map((tile) => {
            const terrainMeta = TERRAIN_META[tile.terrain]
            const center = axialToPixel(tile, HEX_SIZE)
            const isLegal = legalMoveIds.has(tile.id)
            const isBlocked = hasLegalMoves && !isLegal && !tile.hasSettlement
            const baseOpacity = tile.terrain === 'water' || tile.terrain === 'mountain' ? 0.7 : 1
            const fillOpacity = isBlocked ? baseOpacity * 0.42 : baseOpacity

            return (
              <g key={tile.id} transform="translate(0 0)">
                <polygon
                  points={buildHexPolygonPoints(tile, HEX_SIZE)}
                  fill={terrainMeta.color}
                  stroke={isLegal ? '#ffe8a3' : 'rgba(33, 25, 15, 0.38)'}
                  strokeWidth={isLegal ? 4 : 1.5}
                  opacity={fillOpacity}
                  onClick={() => placeOnBoard(tile.id)}
                  style={{ cursor: isLegal ? 'pointer' : 'not-allowed' }}
                />

                {isLegal ? (
                  <polygon
                    points={buildHexPolygonPoints(tile, HEX_SIZE - 6)}
                    fill="rgba(255, 248, 201, 0.34)"
                    stroke="rgba(255, 248, 201, 0.85)"
                    strokeWidth={1.5}
                    style={{ pointerEvents: 'none' }}
                  />
                ) : null}

                {tile.castle ? (
                  <rect
                    x={center.x - 8}
                    y={center.y - 24}
                    width={16}
                    height={16}
                    rx={3}
                    fill="#f8f4dd"
                    stroke="#4f3c1f"
                    strokeWidth={2}
                  />
                ) : null}

                {tile.hasSettlement ? (
                  <g>
                    <rect
                      x={center.x - 10}
                      y={center.y - 10}
                      width={20}
                      height={18}
                      rx={3}
                      fill="#f8f1e3"
                      stroke="#6b341d"
                      strokeWidth={2}
                    />
                    <polygon
                      points={`${center.x - 12},${center.y - 2} ${center.x},${center.y - 16} ${center.x + 12},${center.y - 2}`}
                      fill="#8c4b2f"
                    />
                  </g>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="board-legend">
        <span className="terrain-chip" style={{ ['--chip-color' as string]: '#ffe8a3' }}>
          highlighted = legal
        </span>
        <span className="terrain-chip" style={{ ['--chip-color' as string]: '#f8f4dd' }}>
          dimmed = blocked
        </span>
        <span className="terrain-chip" style={{ ['--chip-color' as string]: '#6f4e37' }}>
          square tower = castle
        </span>
      </div>
    </div>
  )
}
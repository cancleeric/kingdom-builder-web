import { useGameStore } from '../../store/gameStore'
import HexBoard from '../Board/HexBoard'
import { TERRAIN_LABELS, TERRAIN_COLORS } from '../../core/terrain'

export default function GamePage() {
  const players = useGameStore(state => state.players)
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex)
  const currentTerrain = useGameStore(state => state.currentTerrain)
  const placementsThisTurn = useGameStore(state => state.placementsThisTurn)
  const endTurn = useGameStore(state => state.endTurn)
  const undo = useGameStore(state => state.undo)
  const history = useGameStore(state => state.history)

  const currentPlayer = players[currentPlayerIndex]
  const terrainColor = currentTerrain ? TERRAIN_COLORS[currentTerrain] : '#fff'
  const terrainLabel = currentTerrain ? TERRAIN_LABELS[currentTerrain] : ''

  const canEndTurn = placementsThisTurn >= 3

  return (
    <div className="flex flex-col min-h-screen p-4" data-testid="game-page">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-yellow-400">Kingdom Builder</h1>
          <div data-testid="current-player" className="text-gray-300">
            現在輪到：<span className="font-bold text-white">{currentPlayer?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: terrainColor }}
          />
          <div data-testid="current-terrain" className="font-medium">
            {terrainLabel}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4" data-testid="players-panel">
        {players.map(p => (
          <div
            key={p.id}
            className={`flex-1 p-3 rounded-lg border ${p.id === currentPlayerIndex ? 'border-yellow-400 bg-gray-700' : 'border-gray-600 bg-gray-800'}`}
            data-testid={`player-panel-${p.id}`}
          >
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-gray-400">
              房屋: <span data-testid={`settlements-${p.id}`}>{p.settlements}</span>
            </div>
            {p.locationTiles.length > 0 && (
              <div className="text-xs text-yellow-400 mt-1" data-testid={`location-tiles-${p.id}`}>
                地點板塊: {p.locationTiles.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-2 text-sm text-gray-400">
        本回合已放置：<span data-testid="placements-count">{placementsThisTurn}</span>/3
      </div>

      <div className="flex-1">
        <HexBoard />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => undo()}
          disabled={history.length === 0}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded-lg"
          data-testid="undo-btn"
        >
          Undo
        </button>
        <button
          onClick={() => endTurn()}
          disabled={!canEndTurn}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium"
          data-testid="end-turn-btn"
        >
          結束回合
        </button>
      </div>
    </div>
  )
}

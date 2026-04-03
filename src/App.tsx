import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import type { PlayerConfig, BotDifficulty } from './store/gameStore'
import { HexGrid } from './components/Board/HexGrid'
import { GameOver } from './components/Game/GameOver'
import { GamePhase } from './types'
import { getTerrainName } from './core/terrain'
import { Location } from './core/terrain'
import { scoreCastle, scoreObjectiveCard } from './core/scoring'

const LOCATION_EMOJI: Record<Location, string> = {
  [Location.Castle]: '🏰',
  [Location.Farm]:   '🌾',
  [Location.Harbor]: '⚓',
  [Location.Oasis]:  '🌴',
  [Location.Tower]:  '🗼',
  [Location.Paddock]:'🐎',
  [Location.Barn]:   '🏚',
  [Location.Oracle]: '🔮',
  [Location.Tavern]: '🍺',
}

// ── Setup Screen ────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (count: number, configs: PlayerConfig[]) => void }) {
  const [playerCount, setPlayerCount] = useState(2)
  const [configs, setConfigs] = useState<PlayerConfig[]>([
    { name: 'Player 1', type: 'human' },
    { name: 'Player 2', type: 'human' },
    { name: 'Player 3', type: 'human' },
    { name: 'Player 4', type: 'human' },
  ])

  const updateConfig = (index: number, patch: Partial<PlayerConfig>) => {
    setConfigs(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStart(playerCount, configs.slice(0, playerCount))
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50" data-testid="setup-screen">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Kingdom Builder</h1>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Game Setup</h2>

          {/* Player count */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPlayerCount(n)}
                  className={`flex-1 py-2 rounded font-bold border-2 transition ${
                    playerCount === n
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                  data-testid={`player-count-${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Per-player configuration */}
          <div className="space-y-4 mb-6">
            {Array.from({ length: playerCount }, (_, i) => {
              const cfg = configs[i]
              return (
                <div key={i} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-700 w-20">{`Player ${i + 1}`}</span>
                    {/* Human / Bot toggle */}
                    <div className="flex rounded overflow-hidden border border-gray-300">
                      <button
                        type="button"
                        onClick={() => updateConfig(i, { type: 'human' })}
                        className={`px-3 py-1 text-sm font-medium transition ${
                          cfg.type === 'human'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        data-testid={`player-${i + 1}-human`}
                      >
                        Human
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig(i, { type: 'bot', difficulty: cfg.difficulty ?? 'normal' })
                        }
                        className={`px-3 py-1 text-sm font-medium transition ${
                          cfg.type === 'bot'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        data-testid={`player-${i + 1}-bot`}
                      >
                        Bot
                      </button>
                    </div>

                    {/* Difficulty selector (bot only) */}
                    {cfg.type === 'bot' && (
                      <select
                        value={cfg.difficulty ?? 'normal'}
                        onChange={e =>
                          updateConfig(i, { difficulty: e.target.value as BotDifficulty })
                        }
                        className="ml-auto text-sm border border-gray-300 rounded px-2 py-1"
                        data-testid={`player-${i + 1}-difficulty`}
                      >
                        <option value="easy">Easy</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard</option>
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
            data-testid="start-game-btn"
          >
            Start Game
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main App ────────────────────────────────────────

function App() {
  const {
    board,
    players,
    playerConfigs,
    currentPlayerIndex,
    phase,
    currentTerrainCard,
    remainingPlacements,
    validPlacements,
    selectedCell,
    objectiveCards,
    finalScores,
    activeTile,
    tileMoveSources,
    tileMoveFrom,
    tileMoveDestinations,
    isBotThinking,
    initGame,
    drawTerrainCard,
    placeSettlement,
    endTurn,
    selectCell,
    activateTile,
    cancelTile,
    applyTilePlacement,
    selectTileMoveSource,
    applyTileMove,
  } = useGameStore()

  // Show setup screen while in Setup phase
  if (phase === GamePhase.Setup) {
    return (
      <SetupScreen
        onStart={(count, configs) => initGame(count, configs)}
      />
    )
  }


  const currentPlayer = players[currentPlayerIndex]

  const handleCellClick = (coord: { q: number; r: number }) => {
    if (activeTile) {
      const isMoveTile =
        activeTile === Location.Paddock || activeTile === Location.Barn

      if (isMoveTile) {
        if (!tileMoveFrom) {
          // First click: select source
          selectTileMoveSource(coord)
        } else {
          // Second click: execute move
          applyTileMove(coord)
        }
      } else {
        applyTilePlacement(coord)
      }
    } else if (phase === GamePhase.PlaceSettlements) {
      placeSettlement(coord)
    }
  }

  const liveScores = players.map(p => ({
    playerId: p.id,
    castle: board ? scoreCastle(board, p.id) : 0,
    objectives: objectiveCards.map(card => ({
      card,
      score: board ? scoreObjectiveCard(card, board, p.id) : 0,
    })),
  }))

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50" data-testid="game-page">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Kingdom Builder</h1>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Board */}
        <div className="flex-1 relative">
          {players.length > 0 && (
            <HexGrid
              board={board}
              validPlacements={
                activeTile && (activeTile === Location.Paddock || activeTile === Location.Barn)
                  ? (tileMoveFrom ? tileMoveDestinations : tileMoveSources)
                  : validPlacements
              }
              selectedCell={selectedCell}
              players={players}
              onCellClick={handleCellClick}
              onCellSelect={selectCell}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          {/* Current Player Info */}
          {currentPlayer && (
            <div
              className="mb-4 p-4 rounded-lg border-2"
              style={{ borderColor: currentPlayer.color }}
            >
              <h2 className="text-xl font-bold mb-2">Current Player</h2>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <span className="font-semibold" data-testid="current-player-name">{currentPlayer.name}</span>
                {playerConfigs[currentPlayerIndex]?.type === 'bot' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                    🤖 Bot
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600" data-testid="current-player-remaining">
                Settlements Remaining: {currentPlayer.remainingSettlements}
              </p>
              {isBotThinking && (
                <p className="text-sm text-purple-600 italic mt-1" data-testid="bot-thinking">
                  🤖 AI is thinking…
                </p>
              )}
            </div>
          )}

          {/* Game Phase */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Phase</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p className="font-medium" data-testid="game-phase">{phase}</p>
            </div>
          </div>

          {/* Terrain Card */}
          {currentTerrainCard && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Terrain</h3>
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-2xl font-bold" data-testid="current-terrain">
                  {getTerrainName(currentTerrainCard.terrain)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Placements left: <span data-testid="remaining-placements">{remainingPlacements}</span>
                </p>
              </div>
            </div>
          )}

          {/* Objective Cards */}
          {objectiveCards.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Objectives</h3>
              <div className="flex flex-wrap gap-1">
                {objectiveCards.map(card => (
                  <span
                    key={card}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {card}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location Tiles (current player) */}
          {currentPlayer && currentPlayer.tiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Your Tiles</h3>
              <div className="space-y-1">
                {currentPlayer.tiles.map((tile, idx) => (
                  <div
                    key={`${tile.location}-${idx}`}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <span className="text-sm">
                      {LOCATION_EMOJI[tile.location]} {tile.location}
                    </span>
                    <div className="flex gap-1">
                      {!tile.usedThisTurn &&
                        (phase === GamePhase.PlaceSettlements ||
                          phase === GamePhase.EndTurn) && (
                          <button
                            className={`px-2 py-0.5 text-xs rounded font-semibold ${
                              activeTile === tile.location
                                ? 'bg-orange-500 text-white'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            onClick={() =>
                              activeTile === tile.location
                                ? cancelTile()
                                : activateTile(tile.location)
                            }
                          >
                            {activeTile === tile.location ? 'Cancel' : 'Use'}
                          </button>
                        )}
                      {tile.usedThisTurn && (
                        <span className="text-xs text-gray-400 italic">Used</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {activeTile && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                  {activeTile === Location.Paddock || activeTile === Location.Barn
                    ? tileMoveFrom
                      ? 'Click a highlighted destination to move.'
                      : 'Click a highlighted settlement to move.'
                    : 'Click a highlighted cell to place.'}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Actions</h3>

            {phase === GamePhase.DrawCard && playerConfigs[currentPlayerIndex]?.type !== 'bot' && (
              <button
                onClick={drawTerrainCard}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition"
                data-testid="draw-card-btn"
              >
                Draw Terrain Card
              </button>
            )}

            {phase === GamePhase.DrawCard && playerConfigs[currentPlayerIndex]?.type === 'bot' && (
              <button
                onClick={drawTerrainCard}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition"
                data-testid="draw-card-btn"
              >
                Draw Card (Bot Turn)
              </button>
            )}

            {phase === GamePhase.PlaceSettlements && !activeTile && !isBotThinking && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-sm">
                  Click a highlighted hex to place a settlement.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {remainingPlacements} placement
                  {remainingPlacements !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}

            {phase === GamePhase.EndTurn && !isBotThinking && (
              <button
                onClick={endTurn}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition"
                data-testid="end-turn-btn"
              >
                End Turn
              </button>
            )}
          </div>

          {/* Live Scores */}
          {players.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Live Scores</h3>
              <div className="space-y-2">
                {liveScores.map(ps => {
                  const p = players.find(pl => pl.id === ps.playerId)
                  const total =
                    ps.castle + ps.objectives.reduce((s, o) => s + o.score, 0)
                  return (
                    <div
                      key={ps.playerId}
                      className="p-2 rounded border"
                      style={{ borderColor: p?.color ?? '#ccc' }}
                      data-testid={`live-score-${ps.playerId}`}
                    >
                      <div className="flex justify-between text-sm font-medium">
                        <span>{p?.name}</span>
                        <span data-testid={`live-score-total-${ps.playerId}`}>{total} pts</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        🏰 {ps.castle} |{' '}
                        {ps.objectives.map(o => `${o.card}: ${o.score}`).join(' | ')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Players list */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Players</h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded border-2 ${
                    index === currentPlayerIndex ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  style={{ borderColor: player.color }}
                  data-testid={`player-panel-${player.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-800"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.name}</span>
                    {playerConfigs[index]?.type === 'bot' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded-full">🤖</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Placed: {player.settlements.length} | Remaining:{' '}
                    <span data-testid={`remaining-settlements-${player.id}`}>{player.remainingSettlements}</span>
                  </p>
                  {player.tiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5" data-testid={`location-tiles-${player.id}`}>
                      Tiles:{' '}
                      {player.tiles.map(t => LOCATION_EMOJI[t.location]).join(' ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Game Over overlay */}
      {phase === GamePhase.GameOver && finalScores.length > 0 && (
        <GameOver
          finalScores={finalScores}
          players={players}
          objectiveCards={objectiveCards}
          onNewGame={() => {
            // Return to Setup screen for new game configuration
            initGame(players.length, playerConfigs)
          }}
        />
      )}
    </div>
  )
}

export default App

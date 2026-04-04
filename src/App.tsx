import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HexGrid } from './components/Board/HexGrid'
import { GameOver } from './components/Game/GameOver'
import { GameLog } from './components/Game/GameLog'
import { BottomDrawer } from './components/Mobile/BottomDrawer'
import { GameSetup } from './components/Game/GameSetup'
import { GamePhase } from './types'
import type { PlayerConfig } from './types'
import { getTerrainName } from './core/terrain'
import { Location } from './core/terrain'
import { scoreCastle, scoreObjectiveCard } from './core/scoring'
import { initAudio, playSound, isMuted, setMuted, SoundType } from './utils/soundEngine'
import { InstallPrompt } from './components/InstallPrompt'

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

function App() {
  const [muted, setMutedState] = useState(isMuted);
  const [gameStarted, setGameStarted] = useState(false);

  const {
    board,
    players,
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
    history,
    canUndo,
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
    undoLastAction,
  } = useGameStore()

  // Bottom drawer state (mobile only)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleStart = (configs: PlayerConfig[]) => {
    initGame(configs);
    setGameStarted(true);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    // Re-init audio on first unmute interaction
    if (!next) initAudio();
  };

  const currentPlayer = players[currentPlayerIndex]

  // Play game over sound when phase changes to GameOver
  useEffect(() => {
    if (phase === GamePhase.GameOver) {
      playSound(SoundType.GAME_OVER);
    }
  }, [phase]);

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
      initAudio();
      placeSettlement(coord)
      playSound(SoundType.PLACE);
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

  const handleEscape = () => {
    selectCell(null);
  };

  const handleRestart = () => {
    setGameStarted(false);
  };

  // Compose a live-region announcement for screen readers on turn changes
  const liveAnnouncement = currentPlayer
    ? `${currentPlayer.name}'s turn — ${phase}${
        currentTerrainCard
          ? `, terrain: ${getTerrainName(currentTerrainCard.terrain)}, placements remaining: ${remainingPlacements}`
          : ''
      }`
    : '';

  if (!gameStarted) {
    return <GameSetup onStart={handleStart} />;
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <InstallPrompt />
      {/* Hidden ARIA live region for screen-reader turn announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between">
        <h1 className="text-xl sm:text-3xl font-bold">Kingdom Builder</h1>
        <div className="flex items-center gap-2">
          {/* Mobile: show current player name in header */}
          {currentPlayer && (
            <div className="flex items-center gap-2 sm:hidden">
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span className="text-sm font-semibold">{currentPlayer.name}</span>
            </div>
          )}
          <button
            onClick={handleToggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-500 transition text-xl"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Board – always visible, takes all space on mobile */}
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
              onEscape={handleEscape}
            />
          )}
        </div>

        {/* Sidebar – hidden on mobile (< md), visible on md+ */}
        <aside className="hidden md:flex w-80 bg-white shadow-lg p-6 overflow-y-auto flex-col gap-0" aria-label="Game information">
          {/* Current Player Info */}
          {currentPlayer && (
            <section
              aria-label={`Current player: ${currentPlayer.name}`}
              className="mb-4 p-4 rounded-lg border-2"
              style={{ borderColor: currentPlayer.color }}
            >
              <h2 className="text-xl font-bold mb-2">Current Player</h2>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                  aria-hidden="true"
                />
                <span className="font-semibold">{currentPlayer.name}</span>
                {currentPlayer.isBot && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    🤖 {currentPlayer.difficulty}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Settlements Remaining: {currentPlayer.remainingSettlements}
              </p>
            </section>
          )}

          {/* Game Phase */}
          <section className="mb-4" aria-label="Game phase">
            <h3 className="text-lg font-semibold mb-2">Phase</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p className="font-medium">{phase}</p>
            </div>
          </section>

          {/* Terrain Card */}
          {currentTerrainCard && (
            <section className="mb-4" aria-label="Current terrain card" role="region">
              <h3 className="text-lg font-semibold mb-2">Terrain</h3>
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-2xl font-bold">
                  {getTerrainName(currentTerrainCard.terrain)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Placements left: {remainingPlacements}
                </p>
              </div>
            </section>
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
          <section className="mb-4" aria-label="Actions">
            <h3 className="text-lg font-semibold mb-2">Actions</h3>

            {phase === GamePhase.DrawCard && (
              <button
                onClick={drawTerrainCard}
                aria-label="Draw terrain card to start your turn"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Draw Terrain Card
              </button>
            )}

            {phase === GamePhase.PlaceSettlements && !activeTile && (
              <div
                role="status"
                className="p-3 bg-yellow-100 border border-yellow-400 rounded"
              >
                <p className="text-sm">
                  Click or press Enter on a highlighted hex to place a settlement.
                  Use arrow keys to navigate the board. Press Escape to deselect.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {remainingPlacements} placement
                  {remainingPlacements !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}

            {(phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
              <button
                onClick={undoLastAction}
                disabled={!canUndo}
                className={`w-full mt-2 font-bold py-2 px-4 rounded transition border ${
                  canUndo
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                }`}
              >
              Undo
              </button>
            )}

            {phase === GamePhase.EndTurn && (
              <button
                onClick={endTurn}
                aria-label="End your turn and pass to the next player"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition mt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                End Turn
              </button>
            )}
          </section>

          {/* Operation Log */}
          <GameLog history={history} players={players} />

          {/* Live Scores */}
          {players.length > 0 && phase !== GamePhase.Setup && (
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
                    >
                      <div className="flex justify-between text-sm font-medium">
                        <span>{p?.name}</span>
                        <span>{total} pts</span>
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
          <section aria-label="Players">
            <h3 className="text-lg font-semibold mb-2">Players</h3>
            <ul role="list" className="space-y-2">
              {players.map((player, index) => (
                <li
                  key={player.id}
                  role="listitem"
                  aria-label={`${player.name}: ${player.settlements.length} placed, ${player.remainingSettlements} remaining${index === currentPlayerIndex ? ', current player' : ''}`}
                  className={`p-3 rounded border-2 ${
                    index === currentPlayerIndex ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  style={{ borderColor: player.color }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-800"
                      style={{ backgroundColor: player.color }}
                      aria-hidden="true"
                    />
<<<<<<< HEAD
                    <span className="font-medium">
                      {player.name}
                      {index === currentPlayerIndex && (
                        <span className="ml-2 text-xs font-normal text-blue-600">(current)</span>
                      )}
                    </span>
=======
                    <span className="font-medium">{player.name}</span>
                    {player.isBot && (
                      <span className="text-xs text-gray-500">🤖</span>
                    )}
>>>>>>> 2014a73 (feat: Implement Greedy Bot AI opponent with Easy/Normal/Hard difficulty)
                  </div>
                  <p className="text-xs text-gray-600">
                    Placed: {player.settlements.length} | Remaining:{' '}
                    {player.remainingSettlements}
                  </p>
                  {player.tiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tiles:{' '}
                      {player.tiles.map(t => LOCATION_EMOJI[t.location]).join(' ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* Mobile Bottom Drawer – visible on < md only */}
      <div className="md:hidden">
        <BottomDrawer
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen(o => !o)}
          phase={phase}
          currentPlayer={currentPlayer}
          currentTerrainCard={currentTerrainCard}
          remainingPlacements={remainingPlacements}
          activeTile={activeTile}
          tileMoveFrom={tileMoveFrom}
          canUndo={canUndo}
          history={history}
          onDrawCard={drawTerrainCard}
          onEndTurn={endTurn}
          onUndo={undoLastAction}
          onActivateTile={activateTile}
          onCancelTile={cancelTile}
        />
      </div>

      {/* Game Over overlay */}
      {phase === GamePhase.GameOver && finalScores.length > 0 && (
        <GameOver
          finalScores={finalScores}
          players={players}
          objectiveCards={objectiveCards}
          onNewGame={handleRestart}
        />
      )}
    </div>
  )
}

export default App

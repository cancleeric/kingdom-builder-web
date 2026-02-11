import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { HexGrid } from './components/Board/HexGrid'
import { GamePhase } from './types'
import { getTerrainName } from './core/terrain'

function App() {
  const {
    board,
    players,
    currentPlayerIndex,
    phase,
    currentTerrainCard,
    remainingPlacements,
    validPlacements,
    selectedCell,
    initGame,
    drawTerrainCard,
    placeSettlement,
    endTurn,
    selectCell,
  } = useGameStore();

  // Initialize game on mount
  useEffect(() => {
    initGame(2); // Start with 2 players for testing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPlayer = players[currentPlayerIndex];

  const handleDrawCard = () => {
    drawTerrainCard();
  };

  const handlePlaceSettlement = (coord: { q: number; r: number }) => {
    placeSettlement(coord);
  };

  const handleEndTurn = () => {
    endTurn();
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
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
              validPlacements={validPlacements}
              selectedCell={selectedCell}
              players={players}
              onCellClick={handlePlaceSettlement}
              onCellSelect={selectCell}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          {/* Current Player Info */}
          {currentPlayer && (
            <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: currentPlayer.color }}>
              <h2 className="text-xl font-bold mb-2">Current Player</h2>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <span className="font-semibold">{currentPlayer.name}</span>
              </div>
              <p className="text-sm text-gray-600">
                Settlements Remaining: {currentPlayer.remainingSettlements}
              </p>
            </div>
          )}

          {/* Game Phase */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Game Phase</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p className="font-medium">{phase}</p>
            </div>
          </div>

          {/* Terrain Card */}
          {currentTerrainCard && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Current Terrain</h3>
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-2xl font-bold">
                  {getTerrainName(currentTerrainCard.terrain)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Placements Remaining: {remainingPlacements}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Actions</h3>
            
            {phase === GamePhase.DrawCard && (
              <button
                onClick={handleDrawCard}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition"
              >
                Draw Terrain Card
              </button>
            )}

            {phase === GamePhase.PlaceSettlements && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-sm">
                  Click on a highlighted hex to place a settlement.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {remainingPlacements} placement{remainingPlacements !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}

            {phase === GamePhase.EndTurn && (
              <button
                onClick={handleEndTurn}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition"
              >
                End Turn
              </button>
            )}

            {phase === GamePhase.GameOver && (
              <div className="p-3 bg-red-100 border border-red-400 rounded">
                <p className="font-bold">Game Over!</p>
              </div>
            )}
          </div>

          {/* Players List */}
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
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-800"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Placed: {player.settlements.length} | Remaining: {player.remainingSettlements}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App


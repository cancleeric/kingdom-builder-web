import { useGameStore } from './store/gameStore';
import { Board } from './components/Board';
import { TERRAIN_COLORS } from './core/terrain';

function App() {
  const { players, currentPlayer, currentTerrain, placementsLeft, phase, drawCard, endTurn } = useGameStore();
  const player = players.find(p => p.id === currentPlayer)!;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Kingdom Builder</h1>
      <div className="flex gap-4 mb-4 items-center">
        <div>
          <span className="font-bold">{player.name}</span>
          <span className="ml-2 text-gray-300">Houses: {player.houses}</span>
        </div>
        {currentTerrain && (
          <div className="flex items-center gap-2">
            <div
              style={{ width: 24, height: 24, backgroundColor: TERRAIN_COLORS[currentTerrain], borderRadius: 4 }}
            />
            <span className="capitalize">{currentTerrain}</span>
            <span className="text-gray-400">({placementsLeft} left)</span>
          </div>
        )}
        {phase === 'draw' && (
          <button onClick={drawCard} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Draw Card
          </button>
        )}
        {phase === 'place' && (
          <button onClick={endTurn} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700">
            End Turn
          </button>
        )}
      </div>
      <Board />
    </div>
  );
}

export default App;

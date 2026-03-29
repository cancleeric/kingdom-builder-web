import { useGameStore } from './store/gameStore'
import SetupPage from './components/Setup/SetupPage'
import GamePage from './components/Game/GamePage'
import GameOver from './components/Game/GameOver'

function App() {
  const phase = useGameStore(state => state.phase)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {phase === 'setup' && <SetupPage />}
      {phase === 'playing' && <GamePage />}
      {phase === 'gameover' && <GameOver />}
    </div>
  )
}

export default App

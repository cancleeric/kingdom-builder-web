import { useState } from 'react'
import './App.css'
import { ContinueGameBanner } from './components/UI/ContinueGameBanner'
import { useGameStore } from './store/gameStore'

function App() {
  const { gameState, saveNow, clearSaveData } = useGameStore()
  const [gameStarted, setGameStarted] = useState(false)

  const handleContinue = () => setGameStarted(true)
  const handleNewGame = () => setGameStarted(true)

  return (
    <div className="app">
      <h1>Kingdom Builder</h1>

      {!gameStarted ? (
        <ContinueGameBanner
          onContinue={handleContinue}
          onNewGame={handleNewGame}
        />
      ) : (
        <div className="game-area">
          <p>
            回合 {gameState.turn}｜玩家：
            {gameState.players[gameState.currentPlayerId]?.name}
          </p>
          <p>階段：{gameState.phase}</p>
          <div className="game-actions">
            <button onClick={saveNow}>儲存</button>
            <button
              onClick={() => {
                clearSaveData()
                setGameStarted(false)
              }}
              style={{ color: 'red' }}
            >
              清除存檔
            </button>
            <button onClick={() => setGameStarted(false)}>回主選單</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

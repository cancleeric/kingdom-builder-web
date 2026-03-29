import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export default function SetupPage() {
  const startGame = useGameStore(state => state.startGame)
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2'])
  const [seed, setSeed] = useState(42)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const seedParam = params.get('seed')
    if (seedParam) {
      setSeed(parseInt(seedParam, 10))
    }
  }, [])

  const handleStart = () => {
    const names = playerNames.filter(n => n.trim())
    if (names.length < 2) return
    startGame(names, seed)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8" data-testid="setup-page">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">Kingdom Builder</h1>
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">遊戲設定</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">玩家名稱</h3>
          {playerNames.map((name, i) => (
            <div key={i} className="mb-3">
              <label className="block text-sm text-gray-400 mb-1">
                玩家 {i + 1}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  const updated = [...playerNames]
                  updated[i] = e.target.value
                  setPlayerNames(updated)
                }}
                className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                data-testid={`player-name-${i + 1}`}
              />
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">隨機種子 (Seed)</label>
          <input
            type="number"
            value={seed}
            onChange={e => setSeed(parseInt(e.target.value, 10) || 42)}
            className="w-full px-3 py-2 bg-gray-700 rounded text-white"
            data-testid="seed-input"
          />
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors"
          data-testid="start-game-btn"
        >
          開始遊戲
        </button>
      </div>
    </div>
  )
}

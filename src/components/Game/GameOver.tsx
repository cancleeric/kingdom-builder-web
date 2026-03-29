import { useGameStore } from '../../store/gameStore'

export default function GameOver() {
  const scores = useGameStore(state => state.scores)
  const resetGame = useGameStore(state => state.resetGame)

  const sorted = [...scores].sort((a, b) => b.total - a.total)
  const winner = sorted[0]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8" data-testid="gameover-modal">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">遊戲結束！</h1>
        {winner && (
          <p className="text-xl mb-6 text-gray-300">
            🏆 勝者：<span className="text-white font-bold">{winner.name}</span>
          </p>
        )}

        <div className="space-y-3 mb-8" data-testid="scores-list">
          {sorted.map((score, i) => (
            <div
              key={score.player}
              className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
              data-testid={`score-row-${score.player}`}
            >
              <span className="font-medium">
                {i + 1}. {score.name}
              </span>
              <div className="text-right">
                <div className="font-bold text-yellow-400">
                  <span data-testid={`score-total-${score.player}`}>{score.total}</span> 分
                </div>
                <div className="text-xs text-gray-400">
                  城堡: {score.castleBonus} | 房屋: {score.settlementCount}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={resetGame}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg"
          data-testid="play-again-btn"
        >
          再玩一次
        </button>
      </div>
    </div>
  )
}

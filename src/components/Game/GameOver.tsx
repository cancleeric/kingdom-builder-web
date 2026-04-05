import { PlayerScore } from '../../types';
import { ObjectiveCard } from '../../core/scoring';
import { Player } from '../../types';

interface GameOverProps {
  finalScores: PlayerScore[];
  players: Player[];
  objectiveCards: ObjectiveCard[];
  onNewGame: () => void;
}

export function GameOver({
  finalScores,
  players,
  objectiveCards,
  onNewGame,
}: GameOverProps) {
  const sorted = [...finalScores].sort((a, b) => b.totalScore - a.totalScore);
  const getPlayer = (id: number) => players.find(p => p.id === id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-2 dark:text-white">🏆 Game Over!</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Final Rankings</p>

        {/* Ranking list */}
        <div className="space-y-3 mb-6">
          {sorted.map((score, index) => {
            const player = getPlayer(score.playerId);
            const medal = ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
            return (
              <div
                key={score.playerId}
                className="flex items-center gap-3 p-3 rounded-lg border-2"
                style={{ borderColor: player?.color ?? '#ccc' }}
              >
                <span className="text-2xl">{medal}</span>
                <div
                  className="w-5 h-5 rounded-full border border-gray-800 dark:border-gray-200 shrink-0"
                  style={{ backgroundColor: player?.color ?? '#ccc' }}
                />
                <div className="flex-1">
                  <p className="font-semibold dark:text-gray-100">{player?.name ?? `Player ${score.playerId}`}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-0.5">
                    <p>🏰 Castle: {score.castleScore} pts</p>
                    {score.objectiveScores.map(({ card, score: s }) => (
                      <p key={card}>
                        🎯 {card}: {s} pts
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold dark:text-white">{score.totalScore}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">pts</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Objective cards used */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Objective Cards</p>
          <div className="flex flex-wrap gap-2">
            {objectiveCards.map(card => (
              <span
                key={card}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
              >
                {card}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onNewGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

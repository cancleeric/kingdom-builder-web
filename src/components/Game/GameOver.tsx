import React from 'react';
import { PlayerScore } from '../../types';
import { ObjectiveCard } from '../../core/scoring';
import { Player } from '../../types';
import { useTranslation } from 'react-i18next';
import { tObjective } from '../../i18n/formatters';

interface GameOverProps {
  finalScores: PlayerScore[];
  players: Player[];
  objectiveCards: ObjectiveCard[];
  onNewGame: () => void;
}

export const GameOver = React.memo(function GameOver({
  finalScores,
  players,
  objectiveCards,
  onNewGame,
}: GameOverProps) {
  const { t } = useTranslation();
  const sorted = [...finalScores].sort((a, b) => b.totalScore - a.totalScore);
  const getPlayer = (id: number) => players.find(p => p.id === id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-2">{t('gameOver.heading')}</h2>
        <p className="text-gray-600 text-center mb-6">{t('gameOver.finalRankings')}</p>

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
                  className="w-5 h-5 rounded-full border border-gray-800 shrink-0"
                  style={{ backgroundColor: player?.color ?? '#ccc' }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{player?.name ?? t('common.player', { number: score.playerId })}</p>
                  <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                    <p>{t('gameOver.castleScore', { score: score.castleScore })}</p>
                    {score.objectiveScores.map(({ card, score: s }) => (
                      <p key={card}>
                        {t('gameOver.objectiveScore', { card: tObjective(t, card), score: s })}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{score.totalScore}</p>
                  <p className="text-xs text-gray-500">{t('common.pointsShort')}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Objective cards used */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-1">{t('gameOver.objectiveCards')}</p>
          <div className="flex flex-wrap gap-2">
            {objectiveCards.map(card => (
              <span
                key={card}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tObjective(t, card)}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onNewGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          {t('gameOver.newGame')}
        </button>
      </div>
    </div>
  );
});

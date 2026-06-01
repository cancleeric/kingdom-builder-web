import React from 'react';
import { PlayerScore } from '../../types';
import { ObjectiveCard } from '../../core/scoring';
import { Player } from '../../types';
import { useTranslation } from 'react-i18next';
import { tObjective } from '../../i18n/formatters';

const SCORE_SEGMENT_COLORS = [
  'var(--color-wine-600)',
  'var(--color-ink-green-600)',
  'var(--color-amber-600)',
  'var(--color-player-blue)',
];

function scoreSegmentWidth(score: number, maxScore: number): string {
  if (score <= 0 || maxScore <= 0) return '0%';
  return `${(score / maxScore) * 100}%`;
}

interface GameOverProps {
  finalScores: PlayerScore[];
  players: Player[];
  objectiveCards: ObjectiveCard[];
  onNewGame: () => void;
  onOpenLeaderboard?: () => void;
  onOpenReplay?: () => void;
}

export const GameOver = React.memo(function GameOver({
  finalScores,
  players,
  objectiveCards,
  onNewGame,
  onOpenLeaderboard,
  onOpenReplay,
}: GameOverProps) {
  const { t } = useTranslation();
  const sorted = [...finalScores].sort((a, b) => b.totalScore - a.totalScore);
  const getPlayer = (id: number) => players.find(p => p.id === id);
  const maxTotalScore = Math.max(...sorted.map(score => score.totalScore), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start sm:items-center justify-center z-50 overflow-y-auto p-4">
      <div
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8"
        style={{ width: 'min(32rem, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
      >
        <h2 className="text-3xl font-bold text-center mb-2">{t('gameOver.heading')}</h2>
        <p className="text-gray-600 text-center mb-6">{t('gameOver.finalRankings')}</p>

        {/* Ranking list */}
        <div className="space-y-3 mb-6" role="list" aria-label={t('gameOver.finalRankings')}>
          {sorted.map((score, index) => {
            const player = getPlayer(score.playerId);
            const medal = ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`;
            const playerName = player?.name ?? t('common.player', { number: score.playerId });
            const segments = [
              {
                key: 'castle',
                label: t('gameOver.castleSegment'),
                score: score.castleScore,
                color: SCORE_SEGMENT_COLORS[0],
              },
              ...score.objectiveScores.map(({ card, score: objectiveScore }, objectiveIndex) => ({
                key: card,
                label: tObjective(t, card),
                score: objectiveScore,
                color: SCORE_SEGMENT_COLORS[(objectiveIndex + 1) % SCORE_SEGMENT_COLORS.length],
              })),
            ];
            return (
              <div
                key={score.playerId}
                data-testid="final-score-row"
                role="listitem"
                className="flex items-start gap-3 p-3 rounded-lg border-2"
                style={{ borderColor: player?.color ?? '#ccc' }}
              >
                <span className="text-2xl">{medal}</span>
                <div
                  className="w-5 h-5 rounded-full border border-gray-800 shrink-0"
                  style={{ backgroundColor: player?.color ?? '#ccc' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{playerName}</p>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100" role="presentation">
                    <div
                      className="flex h-full"
                      data-testid={`score-bar-${score.playerId}`}
                      role="list"
                      aria-label={t('gameOver.scoreBarAriaLabel', {
                        player: playerName,
                        score: score.totalScore,
                      })}
                      style={{ width: scoreSegmentWidth(score.totalScore, maxTotalScore) }}
                    >
                      {segments.map(segment => (
                        <div
                          key={segment.key}
                          role="listitem"
                          tabIndex={segment.score > 0 ? 0 : -1}
                          aria-label={t('gameOver.scoreSegmentAriaLabel', {
                            player: playerName,
                            label: segment.label,
                            score: segment.score,
                          })}
                          className="h-full shrink-0 outline-none transition-opacity focus:opacity-80"
                          style={{
                            width: scoreSegmentWidth(segment.score, score.totalScore),
                            backgroundColor: segment.color,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {segments.map(segment => (
                      <p key={segment.key} className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span>{t('gameOver.segmentScore', { label: segment.label, score: segment.score })}</span>
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
          <div className="flex flex-wrap gap-2" role="list" aria-label={t('gameOver.objectiveCards')}>
            {objectiveCards.map(card => (
              <span
                key={card}
                role="listitem"
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tObjective(t, card)}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onNewGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {t('gameOver.newGame')}
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {t('leaderboard.open')}
          </button>
          <button
            onClick={onOpenReplay}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {t('replay.watchReplay')}
          </button>
        </div>
      </div>
    </div>
  );
});

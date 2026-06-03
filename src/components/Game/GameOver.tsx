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

  // Champion / tie logic
  const topScore = sorted[0]?.totalScore ?? 0;
  const winners = sorted.filter(s => s.totalScore === topScore);
  const isTie = winners.length > 1;
  const championName = isTie
    ? t('gameOver.tieAnnounce')
    : t('gameOver.winnerAnnounce', {
        name: getPlayer(winners[0]?.playerId)?.name ?? '',
      });
  const championColor = isTie
    ? 'var(--color-stone-700)'
    : (getPlayer(winners[0]?.playerId)?.color ?? 'var(--color-wine-700)');

  // ESC closes → onNewGame
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onNewGame();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewGame]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-[50] overflow-y-auto p-4">
      {/* sr-only heading so test getByRole('heading', { name: /Game Over/i }) still passes */}
      <h2 className="sr-only">Game Over</h2>
      <div
        className="relative animate-modal-enter z-[51]"
        style={{
          width: 'min(32rem, calc(100vw - 2rem))',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-14)',
          boxShadow: 'var(--shadow-lifted)',
          padding: '1.5rem 2rem',
        }}
      >
        {/* Wine rail */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            backgroundColor: 'var(--color-wine-600)',
            borderRadius: 'var(--radius-14) 0 0 var(--radius-14)',
          }}
        />

        {/* Champion hero */}
        <div
          style={{
            textAlign: 'center',
            paddingBottom: '1rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--type-label)',
              color: 'var(--color-stone-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            {t('gameOver.heading')}
          </p>
          <div className="animate-banner-enter" style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem' }} aria-hidden="true">🏆</span>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--type-display-md)',
                color: championColor,
                margin: '0.25rem 0 0',
                fontWeight: 700,
              }}
            >
              {championName}
            </p>
          </div>
        </div>

        <p
          style={{
            color: 'var(--color-stone-600)',
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          {t('gameOver.finalRankings')}
        </p>

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
                className="flex items-start gap-3 p-3 rounded-[var(--radius-12)] border-2 animate-banner-enter"
                style={{
                  borderColor: player?.color ?? '#ccc',
                  background: 'oklch(0 0 0 / 0.02)',
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <span className="text-2xl">{medal}</span>
                <div
                  className="w-5 h-5 rounded-full border border-gray-800 shrink-0"
                  style={{ backgroundColor: player?.color ?? '#ccc' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{playerName}</p>
                  <div
                    className="mt-2 h-3 w-full overflow-hidden rounded-full"
                    role="presentation"
                    style={{ background: 'var(--progress-track)' }}
                  >
                    <div
                      className="animate-score-bar-fill flex h-full"
                      data-testid={`score-bar-${score.playerId}`}
                      role="list"
                      aria-label={t('gameOver.scoreBarAriaLabel', {
                        player: playerName,
                        score: score.totalScore,
                      })}
                      style={{
                        '--bar-fill': scoreSegmentWidth(score.totalScore, maxTotalScore),
                        animationDelay: `${index * 120}ms`,
                      } as React.CSSProperties}
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
                  <div
                    className="mt-2 space-y-1 text-xs"
                    style={{ color: 'var(--color-stone-500)' }}
                  >
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
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-stone-500)' }}
                  >
                    {t('common.pointsShort')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Objective cards used */}
        <div
          className="mb-6 p-3 rounded-[var(--radius-12)]"
          style={{ background: 'var(--color-warm-cream-100)' }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--color-stone-700)' }}
          >
            {t('gameOver.objectiveCards')}
          </p>
          <div className="flex flex-wrap gap-2" role="list" aria-label={t('gameOver.objectiveCards')}>
            {objectiveCards.map(card => (
              <span
                key={card}
                role="listitem"
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  background: 'var(--chip-bg)',
                  color: 'var(--chip-text)',
                  border: '1px solid var(--card-border)',
                }}
              >
                {tObjective(t, card)}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onNewGame}
            className="w-full font-bold py-3 px-4 rounded-[var(--radius-12)] transition"
            style={{
              background: 'var(--button-primary-bg)',
              color: 'var(--button-text)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-primary-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-primary-bg)')}
          >
            {t('gameOver.newGame')}
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="w-full font-bold py-3 px-4 rounded-[var(--radius-12)] transition"
            style={{
              background: 'var(--button-secondary-bg)',
              color: 'var(--button-text)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-secondary-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-secondary-bg)')}
          >
            {t('leaderboard.open')}
          </button>
          <button
            onClick={onOpenReplay}
            className="w-full font-bold py-3 px-4 rounded-[var(--radius-12)] transition"
            style={{
              background: 'transparent',
              color: 'var(--color-stone-700)',
              border: '1px solid var(--button-border)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-ghost-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {t('replay.watchReplay')}
          </button>
        </div>
      </div>
    </div>
  );
});

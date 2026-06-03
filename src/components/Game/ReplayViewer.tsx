import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReplayRecord } from '../../types';
import type { GameAction } from '../../types/history';
import { tLocation, tObjective } from '../../i18n/formatters';

interface ReplayViewerProps {
  replay: ReplayRecord;
  onBack: () => void;
}

function describeAction(t: ReturnType<typeof useTranslation>['t'], action: GameAction): string {
  switch (action.type) {
    case 'PLACE_SETTLEMENT':
      if (action.hex) {
        return t('replay.actionPlaceSettlement', { q: action.hex.q, r: action.hex.r });
      }
      return t('replay.actionUnknown');
    case 'TILE_PLACEMENT':
      if (action.hex && action.tile) {
        return t('replay.actionUseTile', {
          tile: tLocation(t, action.tile),
          q: action.hex.q,
          r: action.hex.r,
        });
      }
      return t('replay.actionUnknown');
    case 'TILE_MOVE':
      if (action.fromHex && action.toHex) {
        return t('replay.actionMoveSettlement', {
          fromQ: action.fromHex.q,
          fromR: action.fromHex.r,
          toQ: action.toHex.q,
          toR: action.toHex.r,
        });
      }
      return t('replay.actionUnknown');
    default:
      return t('replay.actionUnknown');
  }
}

export const ReplayViewer = React.memo(function ReplayViewer({ replay, onBack }: ReplayViewerProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  const { history, players, finalScores, objectiveCards } = replay;
  const total = history.length;

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const getPlayerName = useCallback(
    (playerId: number) => players.find((p) => p.id === playerId)?.name ?? `Player ${playerId}`,
    [players]
  );

  const getPlayerColor = useCallback(
    (playerId: number) => players.find((p) => p.id === playerId)?.color ?? '#ccc',
    [players]
  );

  const currentAction: GameAction | undefined = history[stepIndex];

  const dateLabel = new Date(replay.date).toLocaleDateString();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: 'var(--color-wine-600)', outlineColor: 'var(--color-wine-600)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-wine-700)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-wine-600)')}
          aria-label={t('replay.backToList')}
        >
          {t('replay.backToList')}
        </button>
        <h3 className="text-lg font-semibold">{t('replay.replayOf', { date: dateLabel })}</h3>
      </div>

      {/* Winner & players summary */}
      <div
        className="mb-4 p-3 rounded-lg border"
        style={{
          background: 'var(--color-amber-100)',
          borderColor: 'var(--color-amber-700)',
        }}
      >
        <p
          className="font-semibold mb-1"
          style={{ color: 'var(--color-amber-700)' }}
        >
          {t('replay.winner', { name: replay.winnerName })}
        </p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
              style={{ borderColor: p.color }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border"
                style={{ backgroundColor: p.color, borderColor: 'var(--color-stone-600)' }}
                aria-hidden="true"
              />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>{t('replay.noActions')}</p>
      ) : (
        <>
          {/* Step counter */}
          <p className="text-sm mb-2 text-center" style={{ color: 'var(--color-stone-500)' }}>
            {t('replay.stepOf', { current: stepIndex + 1, total })}
          </p>

          {/* Current action card */}
          {currentAction && (
            <div
              className="mb-4 p-4 border-2 rounded-lg"
              style={{
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-soft)',
                borderColor: getPlayerColor(currentAction.playerId),
              }}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-xs mb-1" style={{ color: 'var(--color-stone-500)' }}>
                {t('replay.actionTurn', { turn: currentAction.turnNumber })}
              </p>
              <p className="font-semibold text-base mb-1">
                {t('replay.actionPlayer', { player: getPlayerName(currentAction.playerId) })}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-stone-700)' }}>
                {describeAction(t, currentAction)}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="flex-1 py-2 px-4 rounded font-semibold text-sm transition border"
              style={
                stepIndex === 0
                  ? {
                      background: 'var(--color-warm-cream-200)',
                      color: 'var(--color-stone-400)',
                      borderColor: 'var(--card-border)',
                      cursor: 'not-allowed',
                    }
                  : {
                      background: 'var(--color-surface)',
                      color: 'var(--color-wine-600)',
                      borderColor: 'var(--color-wine-600)',
                    }
              }
              onMouseEnter={e => {
                if (stepIndex !== 0) {
                  e.currentTarget.style.background = 'var(--color-warm-cream-200)';
                }
              }}
              onMouseLeave={e => {
                if (stepIndex !== 0) {
                  e.currentTarget.style.background = 'var(--color-surface)';
                }
              }}
              aria-label={t('replay.previous')}
            >
              {t('replay.previous')}
            </button>
            <button
              onClick={goNext}
              disabled={stepIndex === total - 1}
              className="flex-1 py-2 px-4 rounded font-semibold text-sm transition border"
              style={
                stepIndex === total - 1
                  ? {
                      background: 'var(--color-warm-cream-200)',
                      color: 'var(--color-stone-400)',
                      borderColor: 'var(--card-border)',
                      cursor: 'not-allowed',
                    }
                  : {
                      background: 'var(--button-primary-bg)',
                      color: 'var(--button-text)',
                      borderColor: 'var(--color-wine-600)',
                    }
              }
              onMouseEnter={e => {
                if (stepIndex !== total - 1) {
                  e.currentTarget.style.background = 'var(--button-primary-bg-hover)';
                }
              }}
              onMouseLeave={e => {
                if (stepIndex !== total - 1) {
                  e.currentTarget.style.background = 'var(--button-primary-bg)';
                }
              }}
              aria-label={t('replay.next')}
            >
              {t('replay.next')}
            </button>
          </div>

          {/* All actions list (mini timeline) */}
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-1" role="list" aria-label={t('replay.heading')}>
              {history.map((action, idx) => {
                const isActive = idx === stepIndex;
                const pName = getPlayerName(action.playerId);
                const pColor = getPlayerColor(action.playerId);
                return (
                  <li key={idx}>
                    <button
                      onClick={() => setStepIndex(idx)}
                      className="w-full text-left flex items-start gap-2 p-2 rounded text-sm transition border"
                      style={
                        isActive
                          ? {
                              background: 'var(--color-warm-cream-200)',
                              borderColor: 'var(--card-border)',
                            }
                          : {
                              background: 'transparent',
                              borderColor: 'transparent',
                            }
                      }
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--color-warm-cream-200)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 border"
                        style={{ backgroundColor: pColor, borderColor: 'var(--color-stone-600)' }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{pName}</span>
                        <span className="text-xs ml-2" style={{ color: 'var(--color-stone-500)' }}>
                          {t('replay.actionTurn', { turn: action.turnNumber })}
                        </span>
                        <span className="block truncate" style={{ color: 'var(--color-stone-600)' }}>
                          {describeAction(t, action)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {/* Final scores */}
      <div
        className="mt-4 pt-4 border-t"
        style={{ borderTopColor: 'var(--card-border)' }}
      >
        <h4 className="text-sm font-semibold mb-2">{t('replay.finalScores')}</h4>
        <div className="space-y-1">
          {[...finalScores]
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((score) => {
              const pColor = getPlayerColor(score.playerId);
              const pName = getPlayerName(score.playerId);
              return (
                <div
                  key={score.playerId}
                  className="flex items-center justify-between text-sm px-2 py-1 rounded border"
                  style={{ borderColor: pColor }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border shrink-0"
                      style={{ backgroundColor: pColor, borderColor: 'var(--color-stone-600)' }}
                      aria-hidden="true"
                    />
                    {pName}
                  </span>
                  <span className="font-semibold">
                    {score.totalScore} {t('common.pointsShort')}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Objectives used */}
        {objectiveCards.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {objectiveCards.map((card) => (
              <span
                key={card}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}
              >
                {tObjective(t, card)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

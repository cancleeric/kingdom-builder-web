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
          className="text-sm text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          aria-label={t('replay.backToList')}
        >
          {t('replay.backToList')}
        </button>
        <h3 className="text-lg font-semibold">{t('replay.replayOf', { date: dateLabel })}</h3>
      </div>

      {/* Winner & players summary */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="font-semibold text-amber-800 mb-1">{t('replay.winner', { name: replay.winnerName })}</p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
              style={{ borderColor: p.color }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-gray-600"
                style={{ backgroundColor: p.color }}
                aria-hidden="true"
              />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-gray-500 text-sm">{t('replay.noActions')}</p>
      ) : (
        <>
          {/* Step counter */}
          <p className="text-sm text-gray-500 mb-2 text-center">
            {t('replay.stepOf', { current: stepIndex + 1, total })}
          </p>

          {/* Current action card */}
          {currentAction && (
            <div
              className="mb-4 p-4 bg-white border-2 rounded-lg shadow-sm"
              style={{ borderColor: getPlayerColor(currentAction.playerId) }}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-xs text-gray-500 mb-1">
                {t('replay.actionTurn', { turn: currentAction.turnNumber })}
              </p>
              <p className="font-semibold text-base mb-1">
                {t('replay.actionPlayer', { player: getPlayerName(currentAction.playerId) })}
              </p>
              <p className="text-sm text-gray-700">
                {describeAction(t, currentAction)}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition border ${
                stepIndex === 0
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-400'
              }`}
              aria-label={t('replay.previous')}
            >
              {t('replay.previous')}
            </button>
            <button
              onClick={goNext}
              disabled={stepIndex === total - 1}
              className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition border ${
                stepIndex === total - 1
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
              }`}
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
                      className={`w-full text-left flex items-start gap-2 p-2 rounded text-sm transition ${
                        isActive ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 border border-gray-600"
                        style={{ backgroundColor: pColor }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{pName}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {t('replay.actionTurn', { turn: action.turnNumber })}
                        </span>
                        <span className="block text-gray-600 truncate">
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
      <div className="mt-4 pt-4 border-t border-gray-200">
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
                      className="w-2.5 h-2.5 rounded-full inline-block border border-gray-600 shrink-0"
                      style={{ backgroundColor: pColor }}
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
              <span key={card} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tObjective(t, card)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

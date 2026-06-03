import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ReplayRecord } from '../../types';

interface ReplayListProps {
  replays: ReplayRecord[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ReplayList = React.memo(function ReplayList({
  replays,
  onSelect,
  onDelete,
}: ReplayListProps) {
  const { t } = useTranslation();

  if (replays.length === 0) {
    return (
      <p
        className="text-sm text-center py-4"
        style={{ color: 'var(--color-stone-500)' }}
      >
        {t('replay.empty')}
      </p>
    );
  }

  return (
    <ul className="space-y-2" role="list" aria-label={t('replay.heading')}>
      {replays.map((replay) => {
        const dateLabel = new Date(replay.date).toLocaleDateString();
        return (
          <li
            key={replay.id}
            className="rounded-lg p-3 flex flex-col gap-2 transition"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--card-border)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-warm-cream-200)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {t('replay.winner', { name: replay.winnerName })}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-stone-500)' }}>{dateLabel}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {replay.players.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border"
                      style={{ borderColor: p.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block border"
                        style={{ backgroundColor: p.color, borderColor: 'var(--color-stone-600)' }}
                        aria-hidden="true"
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => onSelect(replay.id)}
                  className="text-xs font-medium py-1 px-3 rounded transition"
                  style={{
                    background: 'var(--button-primary-bg)',
                    color: 'var(--button-text)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-primary-bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-primary-bg)')}
                  aria-label={`${t('replay.viewReplay')} – ${dateLabel}`}
                >
                  {t('replay.viewReplay')}
                </button>
                <button
                  onClick={() => onDelete(replay.id)}
                  className="text-xs font-medium py-1 px-3 rounded transition border"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-danger)',
                    borderColor: 'var(--color-danger)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.95 0.02 20 / 0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
                  aria-label={`${t('replay.deleteReplay')} – ${dateLabel}`}
                >
                  {t('replay.deleteReplay')}
                </button>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-stone-400)' }}>
              {t('replay.actionCount', { count: replay.history.length })}
            </p>
          </li>
        );
      })}
    </ul>
  );
});

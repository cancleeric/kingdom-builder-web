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
    return <p className="text-gray-500 text-sm text-center py-4">{t('replay.empty')}</p>;
  }

  return (
    <ul className="space-y-2" role="list" aria-label={t('replay.heading')}>
      {replays.map((replay) => {
        const dateLabel = new Date(replay.date).toLocaleDateString();
        return (
          <li
            key={replay.id}
            className="border rounded-lg p-3 flex flex-col gap-2 bg-white hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {t('replay.winner', { name: replay.winnerName })}
                </p>
                <p className="text-xs text-gray-500">{dateLabel}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {replay.players.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border"
                      style={{ borderColor: p.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block border border-gray-600"
                        style={{ backgroundColor: p.color }}
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
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded transition"
                  aria-label={`${t('replay.viewReplay')} – ${dateLabel}`}
                >
                  {t('replay.viewReplay')}
                </button>
                <button
                  onClick={() => onDelete(replay.id)}
                  className="text-xs bg-white hover:bg-red-50 text-red-500 border border-red-300 font-medium py-1 px-3 rounded transition"
                  aria-label={`${t('replay.deleteReplay')} – ${dateLabel}`}
                >
                  {t('replay.deleteReplay')}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {replay.history.length} {replay.history.length === 1 ? 'action' : 'actions'}
            </p>
          </li>
        );
      })}
    </ul>
  );
});

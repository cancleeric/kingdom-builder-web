import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSeasonStore } from '../../store/seasonStore';
import type { Season } from '../../store/seasonStore';

interface SeasonHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

function RewardBadge({ tier }: { tier: Season['rewardTier'] }) {
  const { t } = useTranslation();
  if (!tier) return <span className="text-xs text-gray-400">{t('season.noReward')}</span>;
  const label =
    tier === 'gold'
      ? t('season.rewardGold')
      : tier === 'silver'
        ? t('season.rewardSilver')
        : t('season.rewardBronze');
  const colorClass =
    tier === 'gold'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : tier === 'silver'
        ? 'bg-gray-100 text-gray-700 border-gray-300'
        : 'bg-orange-100 text-orange-800 border-orange-300';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
      {label}
    </span>
  );
}

export const SeasonHistory = React.memo(function SeasonHistory({
  isOpen,
  onClose,
}: SeasonHistoryProps) {
  const { t, i18n } = useTranslation();
  const seasonHistory = useSeasonStore((s) => s.seasonHistory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">{t('season.historyTab')}</h3>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            {t('leaderboard.close')}
          </button>
        </div>

        {seasonHistory.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('season.historyEmpty')}</p>
        ) : (
          <ol className="space-y-3">
            {[...seasonHistory].reverse().map((season) => (
              <li key={season.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{season.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(season.startDate).toLocaleDateString(i18n.language)} —{' '}
                      {new Date(season.endDate).toLocaleDateString(i18n.language)}
                    </p>
                    {season.myRank !== null && (
                      <p className="text-xs text-gray-600 mt-1">
                        {t('season.myRank', { rank: season.myRank })}
                        {' · '}
                        {t('season.myBestScore', { score: season.myBestScore })}
                      </p>
                    )}
                  </div>
                  <RewardBadge tier={season.rewardTier} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
});

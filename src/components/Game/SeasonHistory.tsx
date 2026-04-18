import { useTranslation } from 'react-i18next';
import { useSeasonStore } from '../../store/seasonStore';
import type { Season, RewardTier } from '../../store/seasonStore';

const REWARD_LABEL_KEY: Record<NonNullable<RewardTier>, string> = {
  gold: 'season.rewardGold',
  silver: 'season.rewardSilver',
  bronze: 'season.rewardBronze',
};

const REWARD_COLOR: Record<NonNullable<RewardTier>, string> = {
  gold: 'bg-yellow-100 text-yellow-800',
  silver: 'bg-gray-100 text-gray-700',
  bronze: 'bg-orange-100 text-orange-700',
};

function SeasonCard({ season, isCurrent = false }: { season: Season; isCurrent?: boolean }) {
  const { t, i18n } = useTranslation();

  const rewardKey = season.rewardTier ? REWARD_LABEL_KEY[season.rewardTier] : null;
  const rewardColor = season.rewardTier ? REWARD_COLOR[season.rewardTier] : 'bg-gray-50 text-gray-400';

  return (
    <div className={`border rounded-lg p-4 ${isCurrent ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <span className="font-bold text-base">{season.label}</span>
          {isCurrent && (
            <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {t('season.currentSeason')}
            </span>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rewardColor}`}>
          {rewardKey ? t(rewardKey) : t('season.noReward')}
        </span>
      </div>

      <div className="text-sm text-gray-600 flex flex-wrap gap-3">
        <span>
          {t('season.myBestScore', { score: season.myBestScore })}
        </span>
        <span>
          {season.myRank !== null
            ? t('season.myRank', { rank: season.myRank })
            : t('season.noRank')}
        </span>
      </div>

      <div className="text-xs text-gray-400 mt-1">
        {new Date(season.startDate).toLocaleDateString(i18n.language)}
        {' — '}
        {new Date(season.endDate).toLocaleDateString(i18n.language)}
      </div>

      {season.rankings.length > 0 && (
        <ol className="mt-3 space-y-1">
          {season.rankings.slice(0, 5).map((entry, index) => (
            <li key={`${entry.playerName}-${entry.date}-${index}`} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {t('season.rank', { rank: index + 1 })} {entry.playerName}
              </span>
              <span className="font-semibold">{t('season.score', { score: entry.score })}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface SeasonHistoryProps {
  onClose: () => void;
}

export function SeasonHistory({ onClose }: SeasonHistoryProps) {
  const { t } = useTranslation();
  const currentSeason = useSeasonStore((s) => s.currentSeason);
  const history = useSeasonStore((s) => s.history);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="text-2xl font-bold">{t('season.heading')}</h3>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            aria-label={t('season.close')}
          >
            {t('season.close')}
          </button>
        </div>

        <div className="space-y-4">
          <SeasonCard season={currentSeason} isCurrent />

          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('season.historyEmpty')}</p>
          ) : (
            history.map((season) => (
              <SeasonCard key={season.id} season={season} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { getTopEntries, getObjectiveComboKey, useLeaderboardStore } from '../../store/leaderboardStore';
import { useSeasonStore } from '../../store/seasonStore';
import type { RewardTier } from '../../store/seasonStore';
import { tObjective } from '../../i18n/formatters';
import type { ObjectiveCard } from '../../core/scoring';
import { daysUntilReset } from '../../store/seasonStore';

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

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal = React.memo(function LeaderboardModal({
  isOpen,
  onClose,
}: LeaderboardModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'local' | 'global' | 'season' | 'seasonHistory'>('local');
  const [objectiveFilter, setObjectiveFilter] = useState('__all__');
  const { localEntries, globalEntries, clearLocalEntries } = useLeaderboardStore(
    useShallow((state) => ({
      localEntries: state.localEntries,
      globalEntries: state.globalEntries,
      clearLocalEntries: state.clearLocalEntries,
    }))
  );
  const currentSeason = useSeasonStore((s) => s.currentSeason);
  const seasonHistory = useSeasonStore((s) => s.history);

  const objectiveOptions = useMemo(() => {
    const combos = new Set(localEntries.map((entry) => getObjectiveComboKey(entry.objectiveCards)));
    return ['__all__', ...Array.from(combos).filter((combo) => combo !== '__all__')];
  }, [localEntries]);

  const displayedEntries = useMemo(() => {
    const source = activeTab === 'local' ? localEntries : globalEntries;
    return getTopEntries(source, objectiveFilter);
  }, [activeTab, globalEntries, localEntries, objectiveFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-2xl font-bold">{t('leaderboard.heading')}</h3>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            aria-label={t('leaderboard.close')}
          >
            {t('leaderboard.close')}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1.5 text-sm rounded-full font-semibold ${
              activeTab === 'local'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('leaderboard.localTab')}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 text-sm rounded-full font-semibold ${
              activeTab === 'global'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('leaderboard.globalTab')}
          </button>
          <button
            onClick={() => setActiveTab('season')}
            className={`px-3 py-1.5 text-sm rounded-full font-semibold ${
              activeTab === 'season'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('season.currentSeason')}
          </button>
          <button
            onClick={() => setActiveTab('seasonHistory')}
            className={`px-3 py-1.5 text-sm rounded-full font-semibold ${
              activeTab === 'seasonHistory'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('season.seasonHistory')}
          </button>
        </div>

        {/* Objective filter — only for local/global tabs */}
        {(activeTab === 'local' || activeTab === 'global') && (
          <div className="mb-4">
            <label className="text-sm text-gray-600 mr-2" htmlFor="objective-filter">
              {t('leaderboard.filterByObjective')}
            </label>
            <select
              id="objective-filter"
              value={objectiveFilter}
              onChange={(event) => setObjectiveFilter(event.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {objectiveOptions.map((combo) => (
                <option key={combo} value={combo}>
                  {combo === '__all__'
                    ? t('leaderboard.filterAll')
                    : combo
                        .split('|')
                        .map((card) => tObjective(t, card as ObjectiveCard))
                        .join(' · ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Local / Global leaderboard entries */}
        {(activeTab === 'local' || activeTab === 'global') && (
          <>
            {displayedEntries.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('leaderboard.empty')}</p>
            ) : (
              <ol className="space-y-2 mb-4">
                {displayedEntries.map((entry, index) => (
                  <li
                    key={`${entry.playerName}-${entry.date}-${index}`}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          #{index + 1} · {entry.playerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('leaderboard.meta', {
                            date: new Date(entry.date).toLocaleDateString(i18n.language),
                            playerCount: entry.playerCount,
                          })}
                        </p>
                      </div>
                      <p className="text-xl font-bold">
                        {entry.score} {t('common.pointsShort')}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex justify-end">
              <button
                onClick={clearLocalEntries}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                {t('leaderboard.clearLocal')}
              </button>
            </div>
          </>
        )}

        {/* Current Season tab */}
        {activeTab === 'season' && (
          <div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-indigo-800">{currentSeason.label}</span>
                <span className="text-sm text-indigo-600">
                  {t('season.daysLeft', { count: daysUntilReset(new Date()), days: daysUntilReset(new Date()) })}
                </span>
              </div>
              <div className="text-sm text-indigo-700 flex gap-4">
                <span>{t('season.myBestScore', { score: currentSeason.myBestScore })}</span>
                <span>
                  {currentSeason.myRank !== null
                    ? t('season.myRank', { rank: currentSeason.myRank })
                    : t('season.noRank')}
                </span>
                {currentSeason.rewardTier && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${REWARD_COLOR[currentSeason.rewardTier]}`}>
                    {t(REWARD_LABEL_KEY[currentSeason.rewardTier])}
                  </span>
                )}
              </div>
            </div>
            {currentSeason.rankings.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('season.empty')}</p>
            ) : (
              <ol className="space-y-2">
                {currentSeason.rankings.slice(0, 10).map((entry, index) => (
                  <li
                    key={`${entry.playerName}-${entry.date}-${index}`}
                    className="border rounded-lg p-3 bg-gray-50 flex justify-between"
                  >
                    <div>
                      <p className="font-semibold">#{index + 1} · {entry.playerName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString(i18n.language)} · {entry.playerCount}P
                      </p>
                    </div>
                    <p className="text-xl font-bold">{entry.score} {t('common.pointsShort')}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Season History tab */}
        {activeTab === 'seasonHistory' && (
          <div className="space-y-4">
            {seasonHistory.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('season.historyEmpty')}</p>
            ) : (
              seasonHistory.map((season) => {
                const rewardKey = season.rewardTier ? REWARD_LABEL_KEY[season.rewardTier] : null;
                const rewardColor = season.rewardTier ? REWARD_COLOR[season.rewardTier] : 'bg-gray-50 text-gray-400';
                return (
                  <div key={season.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold">{season.label}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rewardColor}`}>
                        {rewardKey ? t(rewardKey) : t('season.noReward')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex gap-3">
                      <span>{t('season.myBestScore', { score: season.myBestScore })}</span>
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
                    {season.rankings.slice(0, 3).map((entry, idx) => (
                      <div key={`${entry.playerName}-${idx}`} className="flex justify-between text-sm mt-1">
                        <span className="text-gray-700">#{idx + 1} {entry.playerName}</span>
                        <span className="font-semibold">{entry.score} {t('common.pointsShort')}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
});

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { getTopEntries, getObjectiveComboKey, useLeaderboardStore } from '../../store/leaderboardStore';
import { useSeasonStore } from '../../store/seasonStore';
import { tObjective } from '../../i18n/formatters';
import type { ObjectiveCard } from '../../core/scoring';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal = React.memo(function LeaderboardModal({
  isOpen,
  onClose,
}: LeaderboardModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'local' | 'global' | 'season'>('season');
  const [objectiveFilter, setObjectiveFilter] = useState('__all__');
  const { localEntries, globalEntries, clearLocalEntries } = useLeaderboardStore(
    useShallow((state) => ({
      localEntries: state.localEntries,
      globalEntries: state.globalEntries,
      clearLocalEntries: state.clearLocalEntries,
    }))
  );
  const currentSeason = useSeasonStore((s) => s.currentSeason);

  const objectiveOptions = useMemo(() => {
    const combos = new Set(localEntries.map((entry) => getObjectiveComboKey(entry.objectiveCards)));
    return ['__all__', ...Array.from(combos).filter((combo) => combo !== '__all__')];
  }, [localEntries]);

  const displayedEntries = useMemo(() => {
    if (activeTab === 'season') {
      return (currentSeason?.rankings ?? []).slice(0, 10);
    }
    const source = activeTab === 'local' ? localEntries : globalEntries;
    return getTopEntries(source, objectiveFilter);
  }, [activeTab, globalEntries, localEntries, objectiveFilter, currentSeason]);

  if (!isOpen) return null;

  const tabClass = (tab: typeof activeTab) =>
    `px-3 py-1.5 text-sm rounded-full font-semibold ${
      activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

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
          <button onClick={() => setActiveTab('season')} className={tabClass('season')}>
            {t('season.seasonTab')}
          </button>
          <button onClick={() => setActiveTab('local')} className={tabClass('local')}>
            {t('leaderboard.localTab')}
          </button>
          <button onClick={() => setActiveTab('global')} className={tabClass('global')}>
            {t('leaderboard.globalTab')}
          </button>
        </div>

        {/* Season header info */}
        {activeTab === 'season' && currentSeason && (
          <div className="mb-3 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-800 flex flex-wrap gap-2 items-center">
            <span className="font-semibold">{currentSeason.label}</span>
            {currentSeason.myRank !== null && (
              <>
                <span className="text-indigo-400">·</span>
                <span>{t('season.myRank', { rank: currentSeason.myRank })}</span>
                <span className="text-indigo-400">·</span>
                <span>{t('season.myBestScore', { score: currentSeason.myBestScore })}</span>
              </>
            )}
            {currentSeason.rewardTier && (
              <>
                <span className="text-indigo-400">·</span>
                <span className="font-semibold">
                  {currentSeason.rewardTier === 'gold'
                    ? t('season.rewardGold')
                    : currentSeason.rewardTier === 'silver'
                      ? t('season.rewardSilver')
                      : t('season.rewardBronze')}
                </span>
              </>
            )}
          </div>
        )}

        {/* Objective filter (not shown for season tab) */}
        {activeTab !== 'season' && (
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

        {displayedEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {activeTab === 'season' ? t('season.empty') : t('leaderboard.empty')}
          </p>
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

        {activeTab !== 'season' && (
          <div className="flex justify-end">
            <button
              onClick={clearLocalEntries}
              className="text-sm font-semibold text-red-600 hover:text-red-700"
            >
              {t('leaderboard.clearLocal')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

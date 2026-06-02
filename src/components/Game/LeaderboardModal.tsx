import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { getTopEntries, getObjectiveComboKey, useLeaderboardStore } from '../../store/leaderboardStore';
import { useSeasonStore } from '../../store/seasonStore';
import { tObjective } from '../../i18n/formatters';
import type { ObjectiveCard } from '../../core/scoring';
import { ModalFrame } from '../UI/ModalFrame';

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

  const tabStyle = (tab: typeof activeTab): React.CSSProperties =>
    activeTab === tab
      ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)' }
      : { backgroundColor: 'var(--color-stone-100)', color: 'var(--color-stone-700)' };

  const footer =
    activeTab !== 'season' ? (
      <button
        onClick={clearLocalEntries}
        className="text-sm font-semibold"
        style={{ color: 'var(--color-danger)' }}
      >
        {t('leaderboard.clearLocal')}
      </button>
    ) : undefined;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('leaderboard.heading')}
      title={t('leaderboard.heading')}
      footer={footer}
    >
      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab('season')}
          className="px-3 py-1.5 text-sm rounded-full font-semibold transition"
          style={tabStyle('season')}
        >
          {t('season.seasonTab')}
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className="px-3 py-1.5 text-sm rounded-full font-semibold transition"
          style={tabStyle('local')}
        >
          {t('leaderboard.localTab')}
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className="px-3 py-1.5 text-sm rounded-full font-semibold transition"
          style={tabStyle('global')}
        >
          {t('leaderboard.globalTab')}
        </button>
      </div>

      {/* Season header info bar */}
      {activeTab === 'season' && currentSeason && (
        <div
          className="mb-3 p-3 rounded-lg text-sm flex flex-wrap gap-2 items-center"
          style={{
            backgroundColor: 'var(--color-stone-100)',
            color: 'var(--color-text)',
            border: '1px solid var(--card-border)',
          }}
        >
          <span className="font-semibold">{currentSeason.label}</span>
          {currentSeason.myRank !== null && (
            <>
              <span style={{ color: 'var(--color-stone-400)' }}>·</span>
              <span>{t('season.myRank', { rank: currentSeason.myRank })}</span>
              <span style={{ color: 'var(--color-stone-400)' }}>·</span>
              <span>{t('season.myBestScore', { score: currentSeason.myBestScore })}</span>
            </>
          )}
          {currentSeason.rewardTier && (
            <>
              <span style={{ color: 'var(--color-stone-400)' }}>·</span>
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

      {/* Objective filter — hidden on season tab */}
      {activeTab !== 'season' && (
        <div className="mb-4">
          <label
            className="text-sm mr-2"
            htmlFor="objective-filter"
            style={{ color: 'var(--color-stone-600)' }}
          >
            {t('leaderboard.filterByObjective')}
          </label>
          <select
            id="objective-filter"
            value={objectiveFilter}
            onChange={(event) => setObjectiveFilter(event.target.value)}
            className="rounded px-2 py-1 text-sm"
            style={{ border: '1px solid var(--card-border)' }}
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

      {/* Entries list */}
      {displayedEntries.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>
          {activeTab === 'season' ? t('season.empty') : t('leaderboard.empty')}
        </p>
      ) : (
        <ol className="space-y-2">
          {displayedEntries.map((entry, index) => (
            <li
              key={`${entry.playerName}-${entry.date}-${index}`}
              className="rounded-lg p-3"
              style={{
                border: '1px solid var(--card-border)',
                backgroundColor: 'var(--color-warm-cream-50)',
              }}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    #{index + 1} · {entry.playerName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-stone-500)' }}>
                    {t('leaderboard.meta', {
                      date: new Date(entry.date).toLocaleDateString(i18n.language),
                      playerCount: entry.playerCount,
                    })}
                  </p>
                </div>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {entry.score} {t('common.pointsShort')}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </ModalFrame>
  );
});

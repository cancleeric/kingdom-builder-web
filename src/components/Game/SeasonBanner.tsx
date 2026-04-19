import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSeasonStore } from '../../store/seasonStore';

interface SeasonBannerProps {
  onOpenLeaderboard?: () => void;
}

export const SeasonBanner = React.memo(function SeasonBanner({
  onOpenLeaderboard,
}: SeasonBannerProps) {
  const { t } = useTranslation();
  const currentSeason = useSeasonStore((s) => s.currentSeason);

  const daysLeft = useMemo(() => {
    if (!currentSeason) return 0;
    const end = new Date(currentSeason.endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentSeason]);

  if (!currentSeason) return null;

  const rewardLabel =
    currentSeason.rewardTier === 'gold'
      ? t('season.rewardGold')
      : currentSeason.rewardTier === 'silver'
        ? t('season.rewardSilver')
        : currentSeason.rewardTier === 'bronze'
          ? t('season.rewardBronze')
          : null;

  return (
    <div className="bg-indigo-700 text-white text-sm px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{currentSeason.label}</span>
        <span className="text-indigo-200">·</span>
        <span className="text-indigo-200">
          {t('season.daysLeft', { count: daysLeft })}
        </span>
        {rewardLabel && (
          <>
            <span className="text-indigo-200">·</span>
            <span className="font-semibold">{rewardLabel}</span>
          </>
        )}
      </div>
      {onOpenLeaderboard && (
        <button
          onClick={onOpenLeaderboard}
          className="text-xs bg-indigo-500 hover:bg-indigo-400 px-2 py-1 rounded border border-indigo-400 font-semibold whitespace-nowrap"
        >
          {t('season.open')}
        </button>
      )}
    </div>
  );
});

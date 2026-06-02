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
    <div
      className="text-sm px-4 py-2 flex items-center justify-between gap-2 flex-wrap"
      style={{
        backgroundColor: 'var(--color-wine-600)',
        color: 'var(--color-stone-100)',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{currentSeason.label}</span>
        <span style={{ opacity: 0.7 }}>·</span>
        <span style={{ opacity: 0.85 }}>
          {daysLeft === 1
            ? t('season.daysLeft', { count: daysLeft })
            : t('season.daysLeft_plural', { count: daysLeft })}
        </span>
        {rewardLabel && (
          <>
            <span style={{ opacity: 0.7 }}>·</span>
            <span className="font-semibold">{rewardLabel}</span>
          </>
        )}
      </div>
      {onOpenLeaderboard && (
        <button
          onClick={onOpenLeaderboard}
          className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap transition"
          style={{
            backgroundColor: 'var(--button-primary-bg)',
            color: 'var(--button-text)',
            border: '1px solid var(--color-stone-100)',
            opacity: 0.9,
          }}
        >
          {t('season.open')}
        </button>
      )}
    </div>
  );
});

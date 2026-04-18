import { useTranslation } from 'react-i18next';
import { useSeasonStore } from '../../store/seasonStore';
import { daysUntilReset } from '../../store/seasonStore';

const REWARD_BADGE: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

interface SeasonBannerProps {
  onOpenSeasonPanel?: () => void;
}

export function SeasonBanner({ onOpenSeasonPanel }: SeasonBannerProps) {
  const { t } = useTranslation();
  const currentSeason = useSeasonStore((s) => s.currentSeason);

  const days = daysUntilReset(new Date());
  const badge = currentSeason.rewardTier ? REWARD_BADGE[currentSeason.rewardTier] : null;

  return (
    <div
      className="flex items-center gap-2 bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-indigo-600 transition"
      onClick={onOpenSeasonPanel}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpenSeasonPanel?.();
      }}
      aria-label={`${t('season.heading')} — ${currentSeason.label}`}
    >
      <span className="font-semibold">🏆 {currentSeason.label}</span>
      <span className="text-indigo-200 hidden sm:inline">
        {t('season.daysLeft', { count: days, days })}
      </span>
      {badge && <span title={currentSeason.rewardTier ?? ''}>{badge}</span>}
    </div>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModalFrame } from '../UI/ModalFrame';
import { useSeasonStore } from '../../store/seasonStore';
import type { Season } from '../../store/seasonStore';
import { formatSeasonLabel } from '../../i18n/formatters';

interface SeasonHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

function RewardBadge({ tier }: { tier: Season['rewardTier'] }) {
  const { t } = useTranslation();

  if (!tier) {
    return (
      <span className="text-xs" style={{ color: 'var(--color-stone-400)' }}>
        {t('season.noReward')}
      </span>
    );
  }

  const label =
    tier === 'gold'
      ? t('season.rewardGold')
      : tier === 'silver'
        ? t('season.rewardSilver')
        : t('season.rewardBronze');

  const style: React.CSSProperties =
    tier === 'gold'
      ? {
          backgroundColor: 'var(--color-stone-100)',
          color: 'var(--color-wine-600)',
          border: '1px solid var(--color-wine-600)',
        }
      : tier === 'silver'
        ? {
            backgroundColor: 'var(--color-stone-100)',
            color: 'var(--color-stone-700)',
            border: '1px solid var(--color-stone-400)',
          }
        : {
            backgroundColor: 'var(--color-stone-100)',
            color: 'var(--color-stone-600)',
            border: '1px solid var(--color-stone-300)',
          };

  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={style}
    >
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

  const reversedHistory = [...seasonHistory].reverse();

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title={t('season.historyTab')}
      ariaLabel={t('season.historyTab')}
    >
      {reversedHistory.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-stone-500)' }}>
          {t('season.historyEmpty')}
        </p>
      ) : (
        <ol className="space-y-3">
          {reversedHistory.map((season) => (
            <li
              key={season.id}
              className="rounded-lg p-4"
              style={{
                border: '1px solid var(--card-border)',
                backgroundColor: 'var(--color-warm-cream-50)',
              }}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                    {formatSeasonLabel(t, i18n.language, season.id)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone-500)' }}>
                    {new Date(season.startDate).toLocaleDateString(i18n.language)} —{' '}
                    {new Date(season.endDate).toLocaleDateString(i18n.language)}
                  </p>
                  {season.myRank !== null && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-stone-600)' }}>
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
    </ModalFrame>
  );
});

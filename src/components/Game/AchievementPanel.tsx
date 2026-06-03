import { useTranslation } from 'react-i18next';
import { useAchievementStore, getUnlockedCount } from '../../store/achievementStore';
import { ModalFrame } from '../UI/ModalFrame';
import { AchievementBadge } from '../icons/AchievementBadge';
import { AchievementIcon } from '../icons/AchievementIcon';

interface AchievementPanelProps {
  onClose: () => void;
}

export function AchievementPanel({ onClose }: AchievementPanelProps) {
  const { t } = useTranslation();
  const achievements = useAchievementStore((s) => s.achievements);
  const unlockedCount = getUnlockedCount(achievements);
  const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

  const kicker = t('achievement.progress', {
    unlocked: unlockedCount,
    total: achievements.length,
  });

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      ariaLabel={t('achievement.panelLabel')}
      title={t('achievement.heading')}
      kicker={kicker}
      headerIcon={<AchievementIcon size={20} />}
    >
      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {achievements.map((a) => (
          <div
            key={a.id}
            className="rounded-xl p-4 flex flex-col items-center text-center gap-2 transition"
            style={{
              border: `2px solid ${a.unlocked ? 'var(--color-amber-400)' : 'var(--card-border)'}`,
              backgroundColor: a.unlocked ? 'oklch(0.97 0.02 80)' : 'var(--color-warm-cream-50)',
              opacity: a.unlocked ? 1 : 0.5,
            }}
            aria-label={
              a.unlocked
                ? t('achievement.unlockedAria', { title: t(`achievement.items.${a.id}.title`) })
                : t('achievement.lockedAria', { title: t(`achievement.items.${a.id}.title`) })
            }
          >
            <AchievementBadge
              iconKey={a.icon}
              unlocked={a.unlocked}
              isDark={isDark}
              size={56}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
              {t(`achievement.items.${a.id}.title`)}
            </span>
            <span className="text-xs leading-tight" style={{ color: 'var(--color-stone-500)' }}>
              {t(`achievement.items.${a.id}.description`)}
            </span>
            {a.unlocked && a.unlockedAt && (
              <span className="text-xs font-medium" style={{ color: 'var(--color-amber-700)' }}>
                {t('achievement.unlockedOn', {
                  date: new Date(a.unlockedAt).toLocaleDateString(),
                })}
              </span>
            )}
            {!a.unlocked && (
              <span className="text-xs italic" style={{ color: 'var(--color-stone-400)' }}>
                {t('achievement.locked')}
              </span>
            )}
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}

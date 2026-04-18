import { useTranslation } from 'react-i18next';
import { useAchievementStore, getUnlockedCount } from '../../store/achievementStore';

interface AchievementPanelProps {
  onClose: () => void;
}

export function AchievementPanel({ onClose }: AchievementPanelProps) {
  const { t } = useTranslation();
  const achievements = useAchievementStore((s) => s.achievements);
  const unlockedCount = getUnlockedCount(achievements);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('achievement.panelLabel')}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-2xl font-bold">{t('achievement.heading')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('achievement.progress', {
                unlocked: unlockedCount,
                total: achievements.length,
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('achievement.close')}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border-2 p-4 flex flex-col items-center text-center gap-2 transition ${
                a.unlocked
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50 opacity-50 grayscale'
              }`}
              aria-label={
                a.unlocked
                  ? t('achievement.unlockedAria', { title: t(`achievement.items.${a.id}.title`) })
                  : t('achievement.lockedAria', { title: t(`achievement.items.${a.id}.title`) })
              }
            >
              <span className="text-4xl" aria-hidden="true">
                {a.icon}
              </span>
              <span className="text-sm font-semibold leading-tight">
                {t(`achievement.items.${a.id}.title`)}
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                {t(`achievement.items.${a.id}.description`)}
              </span>
              {a.unlocked && a.unlockedAt && (
                <span className="text-xs text-yellow-600 font-medium">
                  {t('achievement.unlockedOn', {
                    date: new Date(a.unlockedAt).toLocaleDateString(),
                  })}
                </span>
              )}
              {!a.unlocked && (
                <span className="text-xs text-gray-400 italic">{t('achievement.locked')}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

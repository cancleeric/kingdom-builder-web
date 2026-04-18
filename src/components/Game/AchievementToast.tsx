import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAchievementStore } from '../../store/achievementStore';

const TOAST_DURATION_MS = 4000;

export function AchievementToast() {
  const { t } = useTranslation();
  const toastQueue = useAchievementStore((s) => s.toastQueue);
  const dismissToast = useAchievementStore((s) => s.dismissToast);

  const currentId = toastQueue[0];

  useEffect(() => {
    if (!currentId) return;
    const timer = setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentId, dismissToast]);

  if (!currentId) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-in"
    >
      <div className="bg-yellow-400 text-yellow-900 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3 max-w-xs">
        <span className="text-3xl" aria-hidden="true">🏅</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {t('achievement.unlocked')}
          </p>
          <p className="font-bold text-sm leading-tight">
            {t(`achievement.items.${currentId}.title`)}
          </p>
          <p className="text-xs opacity-75 leading-tight mt-0.5">
            {t(`achievement.items.${currentId}.description`)}
          </p>
        </div>
      </div>
    </div>
  );
}

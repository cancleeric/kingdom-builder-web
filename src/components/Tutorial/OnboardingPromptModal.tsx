import { useTranslation } from 'react-i18next';

interface OnboardingPromptModalProps {
  isOpen: boolean;
  onStartTutorial: () => void;
  onSkip: () => void;
}

/**
 * OnboardingPromptModal — shown to first-time players after game start.
 *
 * Asks whether the player wants a quick tutorial.
 * - "Show Me How" → starts tutorial
 * - "Skip for Now" → marks tutorial completed (permanent, no re-prompt)
 *
 * z-index: z-[80] — above TutorialOverlay (z-[70]) and ModalFrame coachmark (z-[70])
 * Tailwind v4: all colours via CSS design tokens (no v3 three-part syntax)
 */
export function OnboardingPromptModal({
  isOpen,
  onStartTutorial,
  onSkip,
}: OnboardingPromptModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[79]"
        style={{ backgroundColor: 'oklch(0 0 0 / 0.55)' }}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('tutorial.onboardingPrompt.title')}
        className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      >
        <div
          className="relative w-full max-w-sm rounded-[var(--radius-14)] overflow-hidden animate-modal-enter"
          style={{
            backgroundColor: 'var(--color-surface)',
            boxShadow: 'var(--shadow-lifted)',
            border: '1px solid var(--card-border)',
          }}
        >
          {/* 4px wine accent rail */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 4,
              backgroundColor: 'var(--color-wine-600)',
              borderTopLeftRadius: 'var(--radius-14)',
              borderBottomLeftRadius: 'var(--radius-14)',
            }}
          />

          {/* Content */}
          <div className="px-6 py-6" style={{ paddingLeft: '1.75rem' }}>
            {/* Crown icon */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" aria-hidden="true">👑</span>
              <h2
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--type-display-sm)',
                  lineHeight: 'var(--line-height-display)',
                  color: 'var(--color-text)',
                }}
              >
                {t('tutorial.onboardingPrompt.title')}
              </h2>
            </div>

            <p
              className="mb-6 text-sm"
              style={{
                color: 'var(--color-stone-600)',
                lineHeight: 'var(--line-height-body)',
              }}
            >
              {t('tutorial.onboardingPrompt.description')}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={onSkip}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
                style={{
                  border: '1px solid var(--card-border)',
                  color: 'var(--color-stone-600)',
                  backgroundColor: 'transparent',
                }}
              >
                {t('tutorial.onboardingPrompt.skipButton')}
              </button>
              <button
                onClick={onStartTutorial}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-text)',
                }}
              >
                {t('tutorial.onboardingPrompt.startButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

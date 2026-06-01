import { useEffect, useCallback, useState } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../store/tutorialStore';
import { useTranslation } from 'react-i18next';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function stepIdToI18nKey(stepId: string): string {
  return stepId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function findTutorialTarget(targetElement?: string): HTMLElement | null {
  if (!targetElement) return null;
  return (
    document.querySelector<HTMLElement>(`[data-tutorial-target="${targetElement}"]`) ??
    document.getElementById(targetElement) ??
    document.querySelector<HTMLElement>(targetElement)
  );
}

export function TutorialOverlay() {
  const { t } = useTranslation();
  const { isActive, currentStepIndex, nextStep, prevStep, completeTutorial, dismissTutorial } =
    useTutorialStore();
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const step = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissTutorial();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) completeTutorial();
        else nextStep();
      }
      if (e.key === 'ArrowLeft' && !isFirstStep) prevStep();
    },
    [dismissTutorial, nextStep, prevStep, completeTutorial, isLastStep, isFirstStep]
  );

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleKeyDown]);

  useEffect(() => {
    if (!isActive || !step?.targetElement) {
      return;
    }

    let frameId = 0;

    const updateSpotlight = () => {
      const target = findTutorialTarget(step.targetElement);
      if (!target) {
        setSpotlightRect(null);
        return;
      }

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      frameId = window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          setSpotlightRect(null);
          return;
        }

        const padding = 8;
        setSpotlightRect({
          top: Math.max(8, rect.top - padding),
          left: Math.max(8, rect.left - padding),
          width: Math.min(window.innerWidth - Math.max(8, rect.left - padding) - 8, rect.width + padding * 2),
          height: Math.min(window.innerHeight - Math.max(8, rect.top - padding) - 8, rect.height + padding * 2),
        });
      });
    };

    frameId = window.requestAnimationFrame(updateSpotlight);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [isActive, step]);

  if (!isActive || !step) return null;

  const progress = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;
  const stepI18nKey = stepIdToI18nKey(step.id);
  const translatedTitle = t(`tutorial.steps.${stepI18nKey}.title`, { defaultValue: step.title });
  const translatedDescription = t(`tutorial.steps.${stepI18nKey}.description`, { defaultValue: step.description });
  const shouldShowActionHint = step.advanceOn !== undefined && step.advanceOn !== 'none';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tutorial.dialogLabel')}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="absolute inset-0 bg-black/65 pointer-events-none" aria-hidden="true" />
      {step.targetElement && spotlightRect && (
        <div
          data-testid="tutorial-spotlight"
          aria-hidden="true"
          className="fixed rounded-xl border-4 border-yellow-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.5),0_0_24px_rgba(250,204,21,0.9)] transition-all duration-200"
          style={spotlightRect}
        />
      )}

      {/* Tooltip card – stop propagation so clicks inside don't close */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          aria-label={t('tutorial.close')}
          onClick={dismissTutorial}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition text-lg"
        >
          ✕
        </button>

        {/* Step icon + title */}
        <div className="flex items-center gap-3">
          {step.icon && (
            <span className="text-3xl" aria-hidden="true">
              {step.icon}
            </span>
          )}
          <h2 className="text-xl font-bold text-gray-800">{translatedTitle}</h2>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed">{translatedDescription}</p>

        {shouldShowActionHint && (
          <p className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            {t('tutorial.performHighlightedAction')}
          </p>
        )}

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5" aria-hidden="true">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step counter + navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {t('tutorial.stepCounter', { current: currentStepIndex + 1, total: TUTORIAL_STEPS.length })}
          </span>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                {t('tutorial.back')}
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={completeTutorial}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
              >
                {t('tutorial.finish')}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                {t('tutorial.next')}
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-gray-400 text-center">
          {t('tutorial.keyboardHint')}
        </p>
      </div>
    </div>
  );
}

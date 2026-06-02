import { useEffect, useCallback, useState } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../store/tutorialStore';
import { useTranslation } from 'react-i18next';
import { ModalFrame } from '../UI/ModalFrame';
import type { ArrowDirection } from '../UI/ModalFrame';

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

/**
 * Derive arrow pointer direction from spotlight rect vs viewport centre.
 * The tooltip card sits near screen centre, so we point toward the spotlight.
 */
function deriveArrowDirection(rect: SpotlightRect): ArrowDirection {
  const viewportCentreX = window.innerWidth / 2;
  const viewportCentreY = window.innerHeight / 2;
  const spotlightCentreX = rect.left + rect.width / 2;
  const spotlightCentreY = rect.top + rect.height / 2;

  const dx = spotlightCentreX - viewportCentreX;
  const dy = spotlightCentreY - viewportCentreY;

  // Point the arrow toward the spotlight
  if (Math.abs(dx) > Math.abs(dy)) {
    return { side: dx > 0 ? 'right' : 'left', offsetPct: 50 };
  }
  return { side: dy > 0 ? 'bottom' : 'top', offsetPct: 50 };
}

export function TutorialOverlay() {
  const { t } = useTranslation();
  const { isActive, currentStepIndex, nextStep, prevStep, completeTutorial, dismissTutorial } =
    useTutorialStore();
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const step = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // ESC → dismissTutorial (tutorial's ESC is dismiss, not close — kept here, not in useModal)
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

  // Spotlight rect calculation — preserved verbatim
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

  const arrowDirection: ArrowDirection | undefined = spotlightRect
    ? deriveArrowDirection(spotlightRect)
    : undefined;

  return (
    <>
      {/* Full-screen dimming layer (pointer-events none so clicks pass through to spotlight) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[50] bg-black/65 pointer-events-none"
      />

      {/* Spotlight cutout */}
      {step.targetElement && spotlightRect && (
        <div
          data-testid="tutorial-spotlight"
          aria-hidden="true"
          className="fixed rounded-xl border-4 border-yellow-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.5),0_0_24px_rgba(250,204,21,0.9)] transition-all duration-200 z-[60]"
          style={spotlightRect}
        />
      )}

      {/* Tooltip card via ModalFrame coachmark variant */}
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
          <ModalFrame
            isOpen
            onClose={dismissTutorial}
            ariaLabel={t('tutorial.dialogLabel')}
            title={translatedTitle}
            headerIcon={step.icon}
            variant="coachmark"
            arrowDirection={arrowDirection}
            disableEscClose
          >
            {/* Description */}
            <div className="flex flex-col gap-4">
              <p style={{ color: 'var(--color-stone-600)', lineHeight: 'var(--line-height-body)' }}>
                {translatedDescription}
              </p>

              {shouldShowActionHint && (
                <p
                  className="text-sm font-semibold rounded-lg px-3 py-2"
                  style={{
                    color: 'var(--color-player-blue)',
                    backgroundColor: 'oklch(0.96 0.015 252)',
                    border: '1px solid oklch(0.88 0.02 252)',
                  }}
                >
                  {t('tutorial.performHighlightedAction')}
                </p>
              )}

              {/* Progress bar */}
              <div
                className="w-full rounded-full h-1.5"
                style={{ backgroundColor: 'var(--progress-track)' }}
                aria-hidden="true"
              >
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: 'var(--progress-fill)' }}
                />
              </div>

              {/* Step counter + navigation */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-stone-400)' }}>
                  {t('tutorial.stepCounter', { current: currentStepIndex + 1, total: TUTORIAL_STEPS.length })}
                </span>

                <div className="flex gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition"
                      style={{
                        border: '1px solid var(--card-border)',
                        color: 'var(--color-stone-600)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {t('tutorial.back')}
                    </button>
                  )}

                  {isLastStep ? (
                    <button
                      onClick={completeTutorial}
                      className="px-5 py-2 rounded-lg text-sm font-semibold transition"
                      style={{
                        backgroundColor: 'var(--color-ink-green-600)',
                        color: 'var(--button-text)',
                      }}
                    >
                      {t('tutorial.finish')}
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="px-5 py-2 rounded-lg text-sm font-semibold transition"
                      style={{
                        backgroundColor: 'var(--button-primary-bg)',
                        color: 'var(--button-text)',
                      }}
                    >
                      {t('tutorial.next')}
                    </button>
                  )}
                </div>
              </div>

              {/* Keyboard hint */}
              <p className="text-xs text-center" style={{ color: 'var(--color-stone-400)' }}>
                {t('tutorial.keyboardHint')}
              </p>
            </div>
          </ModalFrame>
        </div>
      </div>
    </>
  );
}

import { useEffect, useCallback } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../store/tutorialStore';

export function TutorialOverlay() {
  const { isActive, currentStepIndex, nextStep, prevStep, completeTutorial, dismissTutorial } =
    useTutorialStore();

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

  if (!isActive || !step) return null;

  const progress = ((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    /* Semi-transparent backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={dismissTutorial}
    >
      {/* Tooltip card – stop propagation so clicks inside don't close */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          aria-label="Close tutorial"
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
          <h2 className="text-xl font-bold text-gray-800">{step.title}</h2>
        </div>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed">{step.description}</p>

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
            Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
          </span>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={completeTutorial}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
              >
                Finish 🎉
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-gray-400 text-center">
          Press left/right arrow keys to navigate · Esc to close
        </p>
      </div>
    </div>
  );
}

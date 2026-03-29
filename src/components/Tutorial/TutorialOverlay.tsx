import React, { useEffect, useRef } from 'react';
import { useTutorialStore } from '../../store/tutorialStore';
import type { TutorialStep } from '../../types/tutorial';

interface TutorialOverlayProps {
  /** Optional CSS class applied to the overlay wrapper */
  className?: string;
}

/**
 * TutorialOverlay renders a semi-transparent backdrop over the entire game
 * and a floating tooltip panel that guides the player through tutorial steps.
 * It is rendered only when the tutorial is active.
 */
const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ className = '' }) => {
  const {
    isActive,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    getCurrentStep,
    getTotalSteps,
  } = useTutorialStore();

  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep: TutorialStep | null = getCurrentStep();
  const totalSteps = getTotalSteps();
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  /** Position the tooltip near the target element when it exists. */
  useEffect(() => {
    if (!isActive || !currentStep?.targetElementId || !tooltipRef.current) return;

    const target = document.getElementById(currentStep.targetElementId);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const position = currentStep.tooltipPosition ?? 'bottom';

    const OFFSET = 16;
    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipEl.offsetHeight - OFFSET;
        left = targetRect.left + targetRect.width / 2 - tooltipEl.offsetWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + OFFSET;
        left = targetRect.left + targetRect.width / 2 - tooltipEl.offsetWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipEl.offsetHeight / 2;
        left = targetRect.left - tooltipEl.offsetWidth - OFFSET;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipEl.offsetHeight / 2;
        left = targetRect.right + OFFSET;
        break;
    }

    // Keep tooltip within viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(8, Math.min(left, vw - tooltipEl.offsetWidth - 8));
    top = Math.max(8, Math.min(top, vh - tooltipEl.offsetHeight - 8));

    tooltipEl.style.position = 'fixed';
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }, [isActive, currentStep, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`教學步驟 ${currentStep.stepNumber}：${currentStep.title}`}
      className={`tutorial-overlay ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* Tooltip panel — pointer events re-enabled */}
      <div
        ref={tooltipRef}
        data-testid="tutorial-tooltip"
        style={{
          pointerEvents: 'auto',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          padding: '24px',
          maxWidth: '420px',
          width: '90vw',
          zIndex: 1001,
        }}
      >
        {/* Step counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            data-testid="step-counter"
            style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}
          >
            步驟 {currentStep.stepNumber} / {totalSteps}
          </span>
          <button
            onClick={skipTutorial}
            aria-label="跳過教學"
            data-testid="skip-button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h2
          data-testid="step-title"
          style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '12px',
            color: '#f8fafc',
          }}
        >
          {currentStep.title}
        </h2>

        {/* Description (supports newline characters) */}
        <p
          data-testid="step-description"
          style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#cbd5e1',
            whiteSpace: 'pre-line',
            marginBottom: '20px',
          }}
        >
          {currentStep.description}
        </p>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          {steps.map((_, idx) => (
            <span
              key={idx}
              aria-hidden="true"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: idx === currentStepIndex ? '#3b82f6' : '#475569',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Previous */}
          {!isFirstStep && (
            <button
              onClick={prevStep}
              aria-label="上一步"
              data-testid="prev-button"
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #475569',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ← 上一步
            </button>
          )}

          {/* Next / Finish */}
          <button
            onClick={handleNext}
            aria-label={isLastStep ? '完成教學' : '下一步'}
            data-testid="next-button"
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isLastStep ? '#10b981' : '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {isLastStep ? '🎉 完成教學' : '下一步 →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;

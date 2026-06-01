import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TutorialOverlay } from './TutorialOverlay';
import { TUTORIAL_STEPS, useTutorialStore } from '../../store/tutorialStore';

function setTutorialStep(stepId: string): void {
  const stepIndex = TUTORIAL_STEPS.findIndex((step) => step.id === stepId);
  expect(stepIndex).toBeGreaterThanOrEqual(0);
  act(() => {
    useTutorialStore.setState({ isActive: true, currentStepIndex: stepIndex, hasCompleted: false });
  });
}

describe('TutorialOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    useTutorialStore.setState({ isActive: false, currentStepIndex: 0, hasCompleted: false });
  });

  it('renders a spotlight around the current target element', async () => {
    render(
      <>
        <button data-tutorial-target="draw-card-button">Draw Terrain Card</button>
        <TutorialOverlay />
      </>
    );

    const target = screen.getByRole('button', { name: 'Draw Terrain Card' });
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 30,
      y: 40,
      top: 40,
      left: 30,
      right: 150,
      bottom: 80,
      width: 120,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);

    setTutorialStep('terrain-card');

    expect(await screen.findByTestId('tutorial-spotlight')).toBeTruthy();
    expect(screen.getByText('Perform the highlighted action to continue automatically.')).toBeTruthy();
  });

  it('falls back to the default step copy when a target is absent', () => {
    setTutorialStep('welcome');
    render(<TutorialOverlay />);

    expect(screen.getByRole('dialog', { name: 'Tutorial' })).toBeTruthy();
    expect(screen.queryByTestId('tutorial-spotlight')).toBeNull();
  });
});

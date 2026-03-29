import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import TutorialOverlay from '../components/Tutorial/TutorialOverlay';
import { useTutorialStore } from '../store/tutorialStore';
import { TUTORIAL_STEPS } from '../store/tutorialSteps';

beforeEach(() => {
  act(() => {
    useTutorialStore.setState({
      isActive: false,
      currentStepIndex: 0,
      steps: TUTORIAL_STEPS,
      isCompleted: false,
    });
  });
});

describe('TutorialOverlay', () => {
  it('renders nothing when tutorial is inactive', () => {
    const { container } = render(<TutorialOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the overlay when tutorial is active', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays the title and description of the current step', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    expect(screen.getByTestId('step-title')).toHaveTextContent(TUTORIAL_STEPS[0].title);
    expect(screen.getByTestId('step-description')).toHaveTextContent(
      TUTORIAL_STEPS[0].description.slice(0, 20)
    );
  });

  it('shows the step counter correctly', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    expect(screen.getByTestId('step-counter')).toHaveTextContent(`1 / ${TUTORIAL_STEPS.length}`);
  });

  it('does not show prev button on the first step', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    expect(screen.queryByTestId('prev-button')).not.toBeInTheDocument();
  });

  it('shows prev button when not on the first step', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 2 });
    });
    render(<TutorialOverlay />);
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
  });

  it('next button advances to step 2', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByTestId('next-button'));
    expect(useTutorialStore.getState().currentStepIndex).toBe(1);
  });

  it('prev button goes back one step', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 3 });
    });
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByTestId('prev-button'));
    expect(useTutorialStore.getState().currentStepIndex).toBe(2);
  });

  it('skip button sets isActive to false', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByTestId('skip-button'));
    expect(useTutorialStore.getState().isActive).toBe(false);
  });

  it('last step next button shows "完成教學" text', () => {
    act(() => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: TUTORIAL_STEPS.length - 1,
      });
    });
    render(<TutorialOverlay />);
    expect(screen.getByTestId('next-button')).toHaveTextContent('完成教學');
  });

  it('last step next button completes the tutorial', () => {
    act(() => {
      useTutorialStore.setState({
        isActive: true,
        currentStepIndex: TUTORIAL_STEPS.length - 1,
      });
    });
    render(<TutorialOverlay />);
    fireEvent.click(screen.getByTestId('next-button'));
    const state = useTutorialStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isCompleted).toBe(true);
  });

  it('has correct aria attributes for accessibility', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    render(<TutorialOverlay />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label');
  });
});

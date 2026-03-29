import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { useTutorialStore } from '../store/tutorialStore';
import { TUTORIAL_STEPS } from '../store/tutorialSteps';

// Reset Zustand store state between tests
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

describe('tutorialStore — startTutorial', () => {
  it('sets isActive to true and resets to step 0', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    const state = useTutorialStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.currentStepIndex).toBe(0);
  });
});

describe('tutorialStore — nextStep', () => {
  it('advances currentStepIndex by 1', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().nextStep();
    });
    expect(useTutorialStore.getState().currentStepIndex).toBe(1);
  });

  it('advances through all steps sequentially', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
    });
    const total = TUTORIAL_STEPS.length;
    for (let i = 0; i < total - 1; i++) {
      act(() => {
        useTutorialStore.getState().nextStep();
      });
      expect(useTutorialStore.getState().currentStepIndex).toBe(i + 1);
    }
  });

  it('calls completeTutorial when on the last step', () => {
    const completeSpy = vi.spyOn(useTutorialStore.getState(), 'completeTutorial');
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: TUTORIAL_STEPS.length - 1 });
      useTutorialStore.getState().nextStep();
    });
    expect(completeSpy).toHaveBeenCalled();
    completeSpy.mockRestore();
  });

  it('sets isActive false and isCompleted true after last step', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: TUTORIAL_STEPS.length - 1 });
      useTutorialStore.getState().nextStep();
    });
    const state = useTutorialStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isCompleted).toBe(true);
  });
});

describe('tutorialStore — prevStep', () => {
  it('decrements currentStepIndex by 1', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 3 });
      useTutorialStore.getState().prevStep();
    });
    expect(useTutorialStore.getState().currentStepIndex).toBe(2);
  });

  it('does not go below 0', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 0 });
      useTutorialStore.getState().prevStep();
    });
    expect(useTutorialStore.getState().currentStepIndex).toBe(0);
  });
});

describe('tutorialStore — skipTutorial', () => {
  it('sets isActive to false without marking as completed', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().nextStep();
      useTutorialStore.getState().skipTutorial();
    });
    const state = useTutorialStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isCompleted).toBe(false);
    expect(state.currentStepIndex).toBe(0);
  });
});

describe('tutorialStore — completeTutorial', () => {
  it('sets isCompleted true and isActive false', () => {
    act(() => {
      useTutorialStore.getState().startTutorial();
      useTutorialStore.getState().completeTutorial();
    });
    const state = useTutorialStore.getState();
    expect(state.isCompleted).toBe(true);
    expect(state.isActive).toBe(false);
  });
});

describe('tutorialStore — resetTutorial', () => {
  it('clears isCompleted flag', () => {
    act(() => {
      useTutorialStore.setState({ isCompleted: true });
      useTutorialStore.getState().resetTutorial();
    });
    expect(useTutorialStore.getState().isCompleted).toBe(false);
  });
});

describe('tutorialStore — getCurrentStep', () => {
  it('returns null when tutorial is inactive', () => {
    act(() => {
      useTutorialStore.setState({ isActive: false, currentStepIndex: 0 });
    });
    expect(useTutorialStore.getState().getCurrentStep()).toBeNull();
  });

  it('returns the correct step when active', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 2 });
    });
    const step = useTutorialStore.getState().getCurrentStep();
    expect(step).not.toBeNull();
    expect(step?.id).toBe(TUTORIAL_STEPS[2].id);
  });

  it('returns null for out-of-range index', () => {
    act(() => {
      useTutorialStore.setState({ isActive: true, currentStepIndex: 999 });
    });
    expect(useTutorialStore.getState().getCurrentStep()).toBeNull();
  });
});

describe('tutorialStore — getTotalSteps', () => {
  it('returns the length of the steps array', () => {
    expect(useTutorialStore.getState().getTotalSteps()).toBe(TUTORIAL_STEPS.length);
  });
});

describe('TUTORIAL_STEPS data', () => {
  it('has exactly 6 steps', () => {
    expect(TUTORIAL_STEPS).toHaveLength(6);
  });

  it('each step has required fields', () => {
    for (const step of TUTORIAL_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.stepNumber).toBeGreaterThan(0);
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.allowedActions).toContain('next');
    }
  });

  it('stepNumbers are sequential 1-6', () => {
    TUTORIAL_STEPS.forEach((step, idx) => {
      expect(step.stepNumber).toBe(idx + 1);
    });
  });

  it('all steps allow "skip" action except none', () => {
    for (const step of TUTORIAL_STEPS) {
      expect(step.allowedActions).toContain('skip');
    }
  });
});

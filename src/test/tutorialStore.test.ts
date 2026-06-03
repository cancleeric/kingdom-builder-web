/**
 * Unit tests for tutorialStore
 *
 * Tests cover:
 *  - startTutorial activates the tutorial at step 0
 *  - nextStep advances through steps
 *  - prevStep goes back (clamped at 0)
 *  - goToStep sets an arbitrary step (clamped)
 *  - completeTutorial / dismissTutorial deactivate overlay
 *  - completing the last step via nextStep marks hasCompleted and closes overlay
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTutorialStore, TUTORIAL_STEPS } from '../store/tutorialStore';

// ── localStorage mock ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// ────────────────────────────────────────────────────────────────────────────

describe('tutorialStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state before each test
    useTutorialStore.setState({
      isActive: false,
      currentStepIndex: 0,
      hasCompleted: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts inactive at step 0', () => {
    const { isActive, currentStepIndex } = useTutorialStore.getState();
    expect(isActive).toBe(false);
    expect(currentStepIndex).toBe(0);
  });

  it('startTutorial activates overlay at step 0', () => {
    useTutorialStore.getState().startTutorial();
    const { isActive, currentStepIndex } = useTutorialStore.getState();
    expect(isActive).toBe(true);
    expect(currentStepIndex).toBe(0);
  });

  it('nextStep advances to the next step', () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().nextStep();
    expect(useTutorialStore.getState().currentStepIndex).toBe(1);
  });

  it('prevStep goes back (clamped at 0)', () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().prevStep(); // already at 0 → stays 0
    expect(useTutorialStore.getState().currentStepIndex).toBe(0);

    useTutorialStore.getState().nextStep();
    useTutorialStore.getState().nextStep();
    useTutorialStore.getState().prevStep();
    expect(useTutorialStore.getState().currentStepIndex).toBe(1);
  });

  it('goToStep sets an arbitrary step (clamped)', () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().goToStep(5);
    expect(useTutorialStore.getState().currentStepIndex).toBe(5);

    useTutorialStore.getState().goToStep(-1);
    expect(useTutorialStore.getState().currentStepIndex).toBe(0);

    useTutorialStore.getState().goToStep(9999);
    expect(useTutorialStore.getState().currentStepIndex).toBe(TUTORIAL_STEPS.length - 1);
  });

  it('dismissTutorial deactivates AND marks completion (Bug 1 fix)', () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().dismissTutorial();
    const { isActive, hasCompleted } = useTutorialStore.getState();
    expect(isActive).toBe(false);
    expect(hasCompleted).toBe(true);
    expect(localStorageMock.getItem('tutorialCompleted')).toBe('true');
  });

  it('dismissTutorial writes tutorialCompleted to localStorage', () => {
    useTutorialStore.getState().startTutorial();
    expect(localStorageMock.getItem('tutorialCompleted')).toBeNull();
    useTutorialStore.getState().dismissTutorial();
    expect(localStorageMock.getItem('tutorialCompleted')).toBe('true');
  });

  it('dismissTutorial sets isActive to false', () => {
    useTutorialStore.getState().startTutorial();
    expect(useTutorialStore.getState().isActive).toBe(true);
    useTutorialStore.getState().dismissTutorial();
    expect(useTutorialStore.getState().isActive).toBe(false);
  });

  it('completeTutorial deactivates and persists to localStorage', () => {
    useTutorialStore.getState().startTutorial();
    useTutorialStore.getState().completeTutorial();
    const { isActive, hasCompleted } = useTutorialStore.getState();
    expect(isActive).toBe(false);
    expect(hasCompleted).toBe(true);
    expect(localStorageMock.getItem('tutorialCompleted')).toBe('true');
  });

  it('nextStep on last step completes the tutorial', () => {
    useTutorialStore.getState().startTutorial();
    // Advance to the last step
    useTutorialStore.getState().goToStep(TUTORIAL_STEPS.length - 1);
    useTutorialStore.getState().nextStep();

    const { isActive, hasCompleted } = useTutorialStore.getState();
    expect(isActive).toBe(false);
    expect(hasCompleted).toBe(true);
    expect(localStorageMock.getItem('tutorialCompleted')).toBe('true');
  });

  it('advanceTutorialIf advances only when the current step trigger matches', () => {
    useTutorialStore.getState().startTutorial();
    const terrainCardStep = TUTORIAL_STEPS.findIndex((step) => step.id === 'terrain-card');
    useTutorialStore.getState().goToStep(terrainCardStep);

    useTutorialStore.getState().advanceTutorialIf('placeSettlement');
    expect(useTutorialStore.getState().currentStepIndex).toBe(terrainCardStep);

    useTutorialStore.getState().advanceTutorialIf('drawCard');
    expect(useTutorialStore.getState().currentStepIndex).toBe(terrainCardStep + 1);
  });

  it('advanceTutorialIf ignores triggers while inactive', () => {
    const terrainCardStep = TUTORIAL_STEPS.findIndex((step) => step.id === 'terrain-card');
    useTutorialStore.getState().goToStep(terrainCardStep);

    useTutorialStore.getState().advanceTutorialIf('drawCard');

    expect(useTutorialStore.getState().currentStepIndex).toBe(terrainCardStep);
  });

  it('TUTORIAL_STEPS has at least one step with required fields', () => {
    expect(TUTORIAL_STEPS.length).toBeGreaterThan(0);
    for (const step of TUTORIAL_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
    }
  });

  it('defines interactive tutorial triggers for core game actions', () => {
    expect(TUTORIAL_STEPS.find((step) => step.id === 'terrain-card')?.advanceOn).toBe('drawCard');
    expect(TUTORIAL_STEPS.find((step) => step.id === 'placement-rules')?.advanceOn).toBe('placeSettlement');
    expect(TUTORIAL_STEPS.find((step) => step.id === 'turn-flow')?.advanceOn).toBe('endTurn');
  });
});

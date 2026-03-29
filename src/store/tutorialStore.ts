import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TutorialStep } from '../types/tutorial';
import { TUTORIAL_STEPS } from './tutorialSteps';

const TUTORIAL_COMPLETED_KEY = 'tutorialCompleted';

interface TutorialStore {
  /** Whether tutorial mode is currently active */
  isActive: boolean;
  /** Index of the currently displayed step (0-based) */
  currentStepIndex: number;
  /** The full list of tutorial steps */
  steps: TutorialStep[];
  /** Whether the tutorial has been completed at least once */
  isCompleted: boolean;

  /** Start the tutorial from step 0 */
  startTutorial: () => void;
  /** Advance to the next step (marks complete if on last step) */
  nextStep: () => void;
  /** Go back to the previous step */
  prevStep: () => void;
  /** Skip / exit the tutorial without completing */
  skipTutorial: () => void;
  /** Mark the tutorial as fully completed and exit */
  completeTutorial: () => void;
  /** Reset the completion flag so the tutorial can be replayed */
  resetTutorial: () => void;

  /** Convenience getter: the currently active TutorialStep object */
  getCurrentStep: () => TutorialStep | null;
  /** Convenience getter: total number of steps */
  getTotalSteps: () => number;
}

export const useTutorialStore = create<TutorialStore>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStepIndex: 0,
      steps: TUTORIAL_STEPS,
      isCompleted: false,

      startTutorial: () =>
        set({
          isActive: true,
          currentStepIndex: 0,
        }),

      nextStep: () => {
        const { currentStepIndex, steps } = get();
        const lastIndex = steps.length - 1;

        if (currentStepIndex >= lastIndex) {
          // On the final step — mark complete
          get().completeTutorial();
        } else {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      skipTutorial: () =>
        set({
          isActive: false,
          currentStepIndex: 0,
        }),

      completeTutorial: () => {
        // Persist completion flag to localStorage via the persist middleware key below.
        set({
          isActive: false,
          isCompleted: true,
          currentStepIndex: 0,
        });
      },

      resetTutorial: () =>
        set({
          isCompleted: false,
          currentStepIndex: 0,
        }),

      getCurrentStep: () => {
        const { steps, currentStepIndex, isActive } = get();
        if (!isActive || currentStepIndex < 0 || currentStepIndex >= steps.length) {
          return null;
        }
        return steps[currentStepIndex];
      },

      getTotalSteps: () => get().steps.length,
    }),
    {
      name: TUTORIAL_COMPLETED_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist completion state and current step index, not the full steps array
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        currentStepIndex: state.currentStepIndex,
      }),
    }
  )
);

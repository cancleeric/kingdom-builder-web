import { create } from 'zustand';
import type { TutorialStep } from '../types';

// ────────────────────────────────────────────────────
// Tutorial step definitions
// ────────────────────────────────────────────────────

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kingdom Builder!',
    description:
      'This tutorial will walk you through the basics of the game. Kingdom Builder is a strategy game where you build settlements across a hex-grid kingdom. Click "Next" to continue.',
    icon: '👑',
    advanceOn: 'none',
  },
  {
    id: 'board',
    title: 'The Game Board',
    description:
      'The board is made up of hexagonal tiles with different terrain types: Grass 🌿, Forest 🌲, Desert 🏜️, Flowers 🌸, Canyon 🪨, Water 💧, and impassable Mountains ⛰️. You can only place settlements on buildable terrain (not Water or Mountain).',
    icon: '🗺️',
    advanceOn: 'none',
  },
  {
    id: 'castles',
    title: 'Castles & Location Tiles',
    description:
      'Yellow Castle 🏰 hexes are special scoring positions — being adjacent to a castle at game end earns bonus points. Special Location Tile hexes (Farm, Oasis, Tower…) grant powerful abilities when you place a settlement next to them.',
    icon: '🏰',
    advanceOn: 'none',
  },
  {
    id: 'terrain-card',
    title: 'Terrain Cards',
    description:
      'At the start of each turn you draw a Terrain Card. The card tells you which terrain type you must place your 3 settlements on this turn. You cannot choose — the card decides! Click "Draw Terrain Card" to start your turn.',
    icon: '🃏',
    targetElement: 'draw-card-button',
    advanceOn: 'none',
  },
  {
    id: 'placement-rules',
    title: 'Placement Rules',
    description:
      "You must place exactly 3 settlements on the terrain shown on your card. If you already have a settlement adjacent to valid terrain, you MUST place next to your existing settlement (adjacency rule). The highlighted cells show where you can legally place.",
    icon: '📏',
    advanceOn: 'none',
  },
  {
    id: 'location-tile-gain',
    title: 'Gaining Location Tiles',
    description:
      'When you place a settlement directly adjacent to a Location Tile hex, you automatically receive that tile and add it to your collection. Location tiles can be used once per turn for special actions like moving settlements.',
    icon: '🎴',
    advanceOn: 'none',
  },
  {
    id: 'objectives',
    title: 'Objective Cards',
    description:
      'Three Objective Cards are revealed at the start of the game. These cards describe special scoring conditions — for example, scoring points for each settlement in the largest connected group, or for settlements near castles. All players score the same objectives!',
    icon: '🎯',
    targetElement: 'objectives-section',
    advanceOn: 'none',
  },
  {
    id: 'turn-flow',
    title: 'Turn Flow',
    description:
      '1️⃣ Draw a Terrain Card → 2️⃣ Place 3 settlements on matching terrain (following adjacency rules) → 3️⃣ End your turn. Optionally use a Location Tile ability before ending. Repeat until all settlements are placed!',
    icon: '🔄',
    advanceOn: 'none',
  },
  {
    id: 'scoring',
    title: 'Scoring & Winning',
    description:
      'When all players have placed all 40 settlements, the game ends. Scores are tallied from Castle adjacency, Objective Cards, and any bonus tiles. The player with the most points wins!',
    icon: '🏆',
    advanceOn: 'none',
  },
  {
    id: 'done',
    title: "You're Ready to Play!",
    description:
      "That covers the essentials. Start a new game and apply what you've learned. Good luck, Kingdom Builder! You can revisit this tutorial any time from the Game Setup screen.",
    icon: '🎉',
    advanceOn: 'none',
  },
];

const TUTORIAL_COMPLETED_KEY = 'tutorialCompleted';

// ────────────────────────────────────────────────────
// State shape
// ────────────────────────────────────────────────────

export interface TutorialState {
  /** Whether the tutorial overlay is currently visible */
  isActive: boolean;
  /** Index of the currently shown step */
  currentStepIndex: number;
  /** Whether the player has ever completed the tutorial */
  hasCompleted: boolean;

  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  completeTutorial: () => void;
  dismissTutorial: () => void;
}

// ────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────

function markCompleted(): Pick<TutorialState, 'isActive' | 'currentStepIndex' | 'hasCompleted'> {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  return { isActive: false, currentStepIndex: 0, hasCompleted: true };
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isActive: false,
  currentStepIndex: 0,
  hasCompleted: localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true',

  startTutorial: () =>
    set({ isActive: true, currentStepIndex: 0 }),

  nextStep: () =>
    set((state) => {
      const next = state.currentStepIndex + 1;
      if (next >= TUTORIAL_STEPS.length) {
        return markCompleted();
      }
      return { currentStepIndex: next };
    }),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    })),

  goToStep: (index: number) =>
    set({ currentStepIndex: Math.max(0, Math.min(index, TUTORIAL_STEPS.length - 1)) }),

  completeTutorial: () => set(markCompleted),

  dismissTutorial: () =>
    set({ isActive: false }),
}));

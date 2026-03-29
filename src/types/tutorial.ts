/** Terrain types used on the Kingdom Builder board */
export type TerrainType =
  | 'grass'
  | 'canyon'
  | 'desert'
  | 'flower'
  | 'forest'
  | 'water'
  | 'mountain'
  | 'castle'
  | 'location';

/** A single step in the interactive tutorial */
export interface TutorialStep {
  /** Unique identifier for the step */
  id: string;
  /** Step number (1-based) */
  stepNumber: number;
  /** Short title displayed in the overlay header */
  title: string;
  /** Descriptive text explaining the concept */
  description: string;
  /** Hex coordinates of cells to highlight on the board (optional) */
  highlightCells?: Array<{ q: number; r: number }>;
  /** CSS selector or element id to point the tooltip arrow at (optional) */
  targetElementId?: string;
  /** Tooltip arrow direction relative to the target element */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Which user actions are permitted during this step */
  allowedActions: TutorialAction[];
}

/** Actions the player can perform during a tutorial step */
export type TutorialAction =
  | 'next'       // advance to next step
  | 'prev'       // go back to previous step
  | 'skip'       // skip the entire tutorial
  | 'place'      // place a settlement on the board
  | 'draw_card'; // draw a terrain card

/** Overall state of the tutorial mode */
export interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  isCompleted: boolean;
}

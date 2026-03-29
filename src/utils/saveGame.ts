import type { GameState } from '../types/game';

export const SAVE_KEY = 'kingdom-builder-save';
export const CURRENT_SAVE_VERSION = 1;

// The schema stored in localStorage
export interface SaveSchema {
  saveVersion: number;
  savedAt: string; // ISO timestamp
  state: GameState;
}

/**
 * Serialize and persist the current GameState to localStorage.
 */
export function saveGame(state: GameState): void {
  const save: SaveSchema = {
    saveVersion: CURRENT_SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

/**
 * Load and deserialize a saved GameState from localStorage.
 * Returns null if no save exists or version mismatches (save is cleared).
 */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const save: SaveSchema = JSON.parse(raw) as SaveSchema;

    if (save.saveVersion !== CURRENT_SAVE_VERSION) {
      clearSave();
      return null;
    }

    return save.state;
  } catch {
    clearSave();
    return null;
  }
}

/**
 * Remove the save from localStorage.
 */
export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Return the full SaveSchema (with metadata) without validating version.
 * Useful for displaying timestamp in the UI.
 */
export function getSaveMetadata(): SaveSchema | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveSchema;
  } catch {
    return null;
  }
}

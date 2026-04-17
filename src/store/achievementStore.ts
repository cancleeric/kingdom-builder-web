import { create } from 'zustand';
import type { Achievement, AchievementProgress } from '../types/achievement';

const LOCAL_STORAGE_KEY = 'kingdom-builder-achievements';

// ────────────────────────────────────────────────────
// Achievement definitions
// ────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  icon: string;
  /**
   * Returns true when this achievement should be unlocked.
   * Called after every relevant game event with the latest progress snapshot
   * and per-game values.
   */
  check: (progress: AchievementProgress, game: GameEventData) => boolean;
}

/** Data passed in from a game event for achievement evaluation. */
export interface GameEventData {
  /** true when the local/human player won the game */
  isWinner: boolean;
  /** Highest score achieved by ANY human player this game */
  topScore: number;
  /** Number of turns played in this game */
  turnsPlayed: number;
  /** Number of location tiles owned by the winning human player at game end */
  tilesAtEnd: number;
  /** Total settlements placed by ALL human players in this game */
  settlementsThisGame: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_win',
    icon: '🏆',
    check: (p) => p.totalGamesWon >= 1,
  },
  {
    id: 'win_5',
    icon: '🥇',
    check: (p) => p.totalGamesWon >= 5,
  },
  {
    id: 'win_10',
    icon: '👑',
    check: (p) => p.totalGamesWon >= 10,
  },
  {
    id: 'first_game',
    icon: '🎲',
    check: (p) => p.totalGamesPlayed >= 1,
  },
  {
    id: 'play_5',
    icon: '🎮',
    check: (p) => p.totalGamesPlayed >= 5,
  },
  {
    id: 'play_20',
    icon: '📅',
    check: (p) => p.totalGamesPlayed >= 20,
  },
  {
    id: 'score_50',
    icon: '⭐',
    check: (_p, g) => g.topScore >= 50,
  },
  {
    id: 'score_100',
    icon: '💫',
    check: (_p, g) => g.topScore >= 100,
  },
  {
    id: 'settlements_100',
    icon: '🏘️',
    check: (p) => p.totalSettlementsPlaced >= 100,
  },
  {
    id: 'settlements_500',
    icon: '🌆',
    check: (p) => p.totalSettlementsPlaced >= 500,
  },
  {
    id: 'turns_50',
    icon: '⏳',
    check: (p) => p.totalTurnsPlayed >= 50,
  },
  {
    id: 'tile_collector',
    icon: '🗺️',
    check: (_p, g) => g.tilesAtEnd >= 3,
  },
];

// ────────────────────────────────────────────────────
// Zustand store shape
// ────────────────────────────────────────────────────

export interface AchievementState {
  achievements: Achievement[];
  progress: AchievementProgress;
  /** IDs queued for the toast notification (FIFO). */
  toastQueue: string[];

  /**
   * Call at game-end to record progress and unlock any newly earned achievements.
   */
  recordGameEnd: (data: GameEventData) => void;

  /** Remove the first item from the toast queue (after it has been displayed). */
  dismissToast: () => void;

  /** Reset all achievement data (useful for testing). */
  reset: () => void;
}

// ────────────────────────────────────────────────────
// Persistence helpers
// ────────────────────────────────────────────────────

interface PersistedData {
  achievements: Achievement[];
  progress: AchievementProgress;
}

function isValidProgress(value: unknown): value is AchievementProgress {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<AchievementProgress>;
  return (
    typeof p.totalGamesPlayed === 'number' &&
    typeof p.totalGamesWon === 'number' &&
    typeof p.totalSettlementsPlaced === 'number' &&
    typeof p.totalTurnsPlayed === 'number'
  );
}

function isValidAchievement(value: unknown): value is Achievement {
  if (!value || typeof value !== 'object') return false;
  const a = value as Partial<Achievement>;
  return (
    typeof a.id === 'string' &&
    typeof a.icon === 'string' &&
    typeof a.unlocked === 'boolean'
  );
}

function makeDefaultProgress(): AchievementProgress {
  return {
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    totalSettlementsPlaced: 0,
    totalTurnsPlayed: 0,
  };
}

function makeDefaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => ({
    id: def.id,
    icon: def.icon,
    unlocked: false,
  }));
}

function loadFromStorage(): { achievements: Achievement[]; progress: AchievementProgress } {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return { achievements: makeDefaultAchievements(), progress: makeDefaultProgress() };

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    const progress = isValidProgress(parsed.progress)
      ? parsed.progress
      : makeDefaultProgress();

    // Merge persisted achievements with current definitions (handles new achievements)
    const persistedMap = new Map<string, Achievement>(
      Array.isArray(parsed.achievements)
        ? parsed.achievements
            .filter(isValidAchievement)
            .map((a) => [a.id, a])
        : []
    );

    const achievements = ACHIEVEMENT_DEFS.map((def) => {
      const persisted = persistedMap.get(def.id);
      if (persisted) return persisted;
      return { id: def.id, icon: def.icon, unlocked: false };
    });

    return { achievements, progress };
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return { achievements: makeDefaultAchievements(), progress: makeDefaultProgress() };
  }
}

function saveToStorage(achievements: Achievement[], progress: AchievementProgress): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ achievements, progress }));
}

// ────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────

const { achievements: initialAchievements, progress: initialProgress } = loadFromStorage();

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: initialAchievements,
  progress: initialProgress,
  toastQueue: [],

  recordGameEnd: (data) => {
    const state = get();

    // Update cumulative progress
    const updatedProgress: AchievementProgress = {
      totalGamesPlayed: state.progress.totalGamesPlayed + 1,
      totalGamesWon: state.progress.totalGamesWon + (data.isWinner ? 1 : 0),
      totalSettlementsPlaced:
        state.progress.totalSettlementsPlaced + data.settlementsThisGame,
      totalTurnsPlayed: state.progress.totalTurnsPlayed + data.turnsPlayed,
    };

    const now = new Date().toISOString();
    const newlyUnlocked: string[] = [];

    const updatedAchievements = state.achievements.map((a) => {
      if (a.unlocked) return a;
      const def = ACHIEVEMENT_DEFS.find((d) => d.id === a.id);
      if (!def) return a;
      if (def.check(updatedProgress, data)) {
        newlyUnlocked.push(a.id);
        return { ...a, unlocked: true, unlockedAt: now };
      }
      return a;
    });

    saveToStorage(updatedAchievements, updatedProgress);

    set({
      achievements: updatedAchievements,
      progress: updatedProgress,
      toastQueue: [...state.toastQueue, ...newlyUnlocked],
    });
  },

  dismissToast: () => {
    set((state) => ({ toastQueue: state.toastQueue.slice(1) }));
  },

  reset: () => {
    const achievements = makeDefaultAchievements();
    const progress = makeDefaultProgress();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ achievements, progress, toastQueue: [] });
  },
}));

/** Returns the count of unlocked achievements. */
export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}

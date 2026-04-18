import { create } from 'zustand';
import type { Season, SeasonEntry, RankTier } from '../types/season';
import { RANK_THRESHOLDS } from '../types/season';

const STORAGE_KEY = 'kingdom-builder-season';
const SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_HISTORY = 3;
const TOP_DISPLAY_COUNT = 10;

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

/** Derive a human-readable season name from its start date. */
function makeSeasonName(startDate: string): string {
  const d = new Date(startDate);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `Season ${year}-${month}`;
}

/** Create a new season starting now. */
function createNewSeason(): Season {
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + SEASON_DURATION_MS).toISOString();
  return {
    name: makeSeasonName(startDate),
    startDate,
    endDate,
    entries: [],
    archived: false,
  };
}

/** Compute rank tier from a score. */
export function getRankTier(score: number): RankTier {
  if (score >= RANK_THRESHOLDS.Gold) return 'Gold';
  if (score >= RANK_THRESHOLDS.Silver) return 'Silver';
  if (score >= RANK_THRESHOLDS.Bronze) return 'Bronze';
  return 'Iron';
}

/** Sort entries by score descending (ties broken by gamesWon descending). */
function sortEntries(entries: SeasonEntry[]): SeasonEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.gamesWon - a.gamesWon;
  });
}

/** Get top N entries from a leaderboard. */
export function getTopSeasonEntries(entries: SeasonEntry[]): SeasonEntry[] {
  return sortEntries(entries).slice(0, TOP_DISPLAY_COUNT);
}

/** Get 1-based rank of a player by name, or -1 if not found. */
export function getPlayerRank(entries: SeasonEntry[], playerName: string): number {
  const sorted = sortEntries(entries);
  const idx = sorted.findIndex((e) => e.playerName === playerName);
  return idx === -1 ? -1 : idx + 1;
}

// ────────────────────────────────────────────────────
// Persistence
// ────────────────────────────────────────────────────

interface PersistedData {
  currentSeason: Season;
  history: Season[];
}

function isValidEntry(value: unknown): value is SeasonEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Partial<SeasonEntry>;
  return (
    typeof e.playerName === 'string' &&
    typeof e.score === 'number' &&
    Number.isFinite(e.score) &&
    typeof e.gamesPlayed === 'number' &&
    typeof e.gamesWon === 'number'
  );
}

function isValidSeason(value: unknown): value is Season {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Season>;
  return (
    typeof s.name === 'string' &&
    typeof s.startDate === 'string' &&
    typeof s.endDate === 'string' &&
    Array.isArray(s.entries) &&
    typeof s.archived === 'boolean'
  );
}

function loadFromStorage(): PersistedData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { currentSeason: createNewSeason(), history: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    const currentSeason =
      isValidSeason(parsed.currentSeason) ? parsed.currentSeason : createNewSeason();
    currentSeason.entries = Array.isArray(currentSeason.entries)
      ? currentSeason.entries.filter(isValidEntry)
      : [];

    const history = Array.isArray(parsed.history)
      ? parsed.history.filter(isValidSeason).map((s) => ({
          ...s,
          entries: Array.isArray(s.entries) ? s.entries.filter(isValidEntry) : [],
        }))
      : [];

    return { currentSeason, history };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { currentSeason: createNewSeason(), history: [] };
  }
}

function saveToStorage(currentSeason: Season, history: Season[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentSeason, history }));
}

// ────────────────────────────────────────────────────
// Store shape
// ────────────────────────────────────────────────────

export interface SeasonState {
  currentSeason: Season;
  /** Archived seasons, newest first, capped at MAX_HISTORY. */
  history: Season[];

  /**
   * Record a game result for the given player in the current season.
   * If the season has expired, archives it and starts a new one first.
   */
  recordGameResult: (playerName: string, score: number, isWinner: boolean) => void;

  /**
   * Force-check whether the current season has ended and rotate if needed.
   * Safe to call on app load to handle seasons that expired while app was closed.
   */
  checkAndRotateSeason: () => void;

  /** Reset all season data (useful for testing). */
  reset: () => void;
}

// ────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────

const { currentSeason: initialSeason, history: initialHistory } = loadFromStorage();

export const useSeasonStore = create<SeasonState>((set, get) => ({
  currentSeason: initialSeason,
  history: initialHistory,

  recordGameResult: (playerName, score, isWinner) => {
    // Rotate season first if needed
    get().checkAndRotateSeason();

    set((state) => {
      const season = state.currentSeason;
      const existingIdx = season.entries.findIndex((e) => e.playerName === playerName);
      let updatedEntries: SeasonEntry[];

      if (existingIdx === -1) {
        updatedEntries = [
          ...season.entries,
          {
            playerName,
            score,
            gamesPlayed: 1,
            gamesWon: isWinner ? 1 : 0,
          },
        ];
      } else {
        updatedEntries = season.entries.map((e, idx) =>
          idx === existingIdx
            ? {
                ...e,
                score: e.score + score,
                gamesPlayed: e.gamesPlayed + 1,
                gamesWon: e.gamesWon + (isWinner ? 1 : 0),
              }
            : e
        );
      }

      const updatedSeason: Season = { ...season, entries: updatedEntries };
      saveToStorage(updatedSeason, state.history);
      return { currentSeason: updatedSeason };
    });
  },

  checkAndRotateSeason: () => {
    set((state) => {
      const now = Date.now();
      const seasonEnd = new Date(state.currentSeason.endDate).getTime();
      if (now <= seasonEnd) return state; // season still active

      // Archive current season
      const archivedSeason: Season = { ...state.currentSeason, archived: true };
      const newHistory = [archivedSeason, ...state.history].slice(0, MAX_HISTORY);
      const newSeason = createNewSeason();
      saveToStorage(newSeason, newHistory);
      return { currentSeason: newSeason, history: newHistory };
    });
  },

  reset: () => {
    const currentSeason = createNewSeason();
    const history: Season[] = [];
    localStorage.removeItem(STORAGE_KEY);
    set({ currentSeason, history });
  },
}));

import { create } from 'zustand';

// ────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────

export type RewardTier = 'gold' | 'silver' | 'bronze' | null;

export interface SeasonEntry {
  playerName: string;
  score: number;
  date: string;
  playerCount: number;
}

export interface Season {
  /** Format: "2026-04" */
  id: string;
  /** Human-readable label, e.g. "Season 2026-04" */
  label: string;
  startDate: string;
  endDate: string;
  rankings: SeasonEntry[];
  myBestScore: number;
  myRank: number | null;
  rewardTier: RewardTier;
}

const CURRENT_KEY = 'kingdom-season-current';
const HISTORY_KEY = 'kingdom-seasons-history';
const MAX_HISTORY = 6;
const MAX_SEASON_ENTRIES = 100;

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

/** Returns the season id for a given date: "YYYY-MM" */
export function getSeasonId(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns the ISO8601 start of a month-season. */
export function getSeasonStart(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

/** Returns the ISO8601 end of a month-season (last ms of last day). */
export function getSeasonEnd(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
}

/** Human-readable label for a season id. */
export function getSeasonLabel(id: string): string {
  return `Season ${id}`;
}

/** Days remaining until the end of the current month from `now`. */
export function daysUntilReset(now: Date): number {
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const msLeft = endOfMonth.getTime() - now.getTime();
  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}

/** Compute reward tier based on my rank among total entries. */
export function computeRewardTier(myRank: number | null, totalEntries: number): RewardTier {
  if (myRank === null || totalEntries === 0) return null;
  const percentile = myRank / totalEntries;
  if (percentile <= 0.1) return 'gold';
  if (percentile <= 0.3) return 'silver';
  if (percentile <= 0.5) return 'bronze';
  return null;
}

/** Sort entries by score descending, then by date descending, trim to limit. */
function sortAndTrim(entries: SeasonEntry[], limit = MAX_SEASON_ENTRIES): SeasonEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, limit);
}

/** Create a blank season for the given date. */
function makeSeason(now: Date): Season {
  const id = getSeasonId(now);
  return {
    id,
    label: getSeasonLabel(id),
    startDate: getSeasonStart(now),
    endDate: getSeasonEnd(now),
    rankings: [],
    myBestScore: 0,
    myRank: null,
    rewardTier: null,
  };
}

// ────────────────────────────────────────────────────
// Validation helpers
// ────────────────────────────────────────────────────

function isValidEntry(value: unknown): value is SeasonEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Partial<SeasonEntry>;
  return (
    typeof e.playerName === 'string' &&
    typeof e.score === 'number' &&
    Number.isFinite(e.score) &&
    typeof e.date === 'string' &&
    typeof e.playerCount === 'number'
  );
}

function isValidSeason(value: unknown): value is Season {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Season>;
  return (
    typeof s.id === 'string' &&
    typeof s.label === 'string' &&
    typeof s.startDate === 'string' &&
    typeof s.endDate === 'string' &&
    Array.isArray(s.rankings) &&
    typeof s.myBestScore === 'number' &&
    (s.myRank === null || typeof s.myRank === 'number')
  );
}

// ────────────────────────────────────────────────────
// localStorage helpers
// ────────────────────────────────────────────────────

function loadCurrentSeason(): Season | null {
  const raw = localStorage.getItem(CURRENT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSeason(parsed)) return null;
    // Sanitize rankings
    const season = parsed as Season;
    season.rankings = season.rankings.filter(isValidEntry);
    return season;
  } catch {
    localStorage.removeItem(CURRENT_KEY);
    return null;
  }
}

function loadSeasonHistory(): Season[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSeason) as Season[];
  } catch {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
}

function persistCurrentSeason(season: Season): void {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(season));
}

function persistHistory(history: Season[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────

export interface SeasonState {
  currentSeason: Season;
  history: Season[];

  /**
   * Call when a game ends with the human player's best score and all player scores
   * (including bots). Checks for season rotation first.
   */
  recordSeasonScore: (myScore: number, allEntries: SeasonEntry[]) => void;

  /** Manually trigger a season check / rotation (called at app startup). */
  checkAndRotateSeason: () => void;

  /** Reset all season data (useful for testing). */
  reset: () => void;
}

// ────────────────────────────────────────────────────
// Initialise
// ────────────────────────────────────────────────────

function initState(): { currentSeason: Season; history: Season[] } {
  const now = new Date();
  const currentId = getSeasonId(now);
  const stored = loadCurrentSeason();
  const history = loadSeasonHistory();

  if (stored && stored.id === currentId) {
    return { currentSeason: stored, history };
  }

  // Season has changed – archive the stored season (if any) and reset
  let newHistory = history;
  if (stored) {
    newHistory = [stored, ...history].slice(0, MAX_HISTORY);
    persistHistory(newHistory);
  }

  const fresh = makeSeason(now);
  persistCurrentSeason(fresh);
  return { currentSeason: fresh, history: newHistory };
}

const { currentSeason: initSeason, history: initHistory } = initState();

export const useSeasonStore = create<SeasonState>((set, get) => ({
  currentSeason: initSeason,
  history: initHistory,

  checkAndRotateSeason: () => {
    const now = new Date();
    const currentId = getSeasonId(now);
    const { currentSeason, history } = get();

    if (currentSeason.id === currentId) return;

    // Archive and reset
    const newHistory = [currentSeason, ...history].slice(0, MAX_HISTORY);
    const fresh = makeSeason(now);
    persistHistory(newHistory);
    persistCurrentSeason(fresh);
    set({ currentSeason: fresh, history: newHistory });
  },

  recordSeasonScore: (myScore, allEntries) => {
    // First check rotation
    const now = new Date();
    const currentId = getSeasonId(now);
    let { currentSeason, history } = get();

    if (currentSeason.id !== currentId) {
      // Rotate first
      const newHistory = [currentSeason, ...history].slice(0, MAX_HISTORY);
      const fresh = makeSeason(now);
      persistHistory(newHistory);
      currentSeason = fresh;
      history = newHistory;
    }

    // Merge new entries into rankings
    const merged = sortAndTrim([...currentSeason.rankings, ...allEntries]);

    // Update myBestScore and myRank
    const newMyBest = Math.max(currentSeason.myBestScore, myScore);
    const myRank = merged.findIndex((e) => e.score <= newMyBest) + 1 || null;
    const rewardTier = computeRewardTier(myRank, merged.length);

    const updated: Season = {
      ...currentSeason,
      rankings: merged,
      myBestScore: newMyBest,
      myRank,
      rewardTier,
    };

    persistCurrentSeason(updated);
    set({ currentSeason: updated, history });
  },

  reset: () => {
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem(HISTORY_KEY);
    const fresh = makeSeason(new Date());
    persistCurrentSeason(fresh);
    set({ currentSeason: fresh, history: [] });
  },
}));

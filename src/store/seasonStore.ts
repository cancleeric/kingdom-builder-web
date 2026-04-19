import { create } from 'zustand';
import type { LeaderboardEntry } from './leaderboardStore';

export const SEASON_CURRENT_KEY = 'kingdom-season-current';
export const SEASON_HISTORY_KEY = 'kingdom-seasons-history';
const MAX_HISTORY_SEASONS = 6;

export type RewardTier = 'gold' | 'silver' | 'bronze' | null;

export interface Season {
  /** Format: "2026-04" */
  id: string;
  /** Human-readable label, e.g. "April 2026 Season" */
  label: string;
  startDate: string;
  endDate: string;
  rankings: LeaderboardEntry[];
  myBestScore: number;
  myRank: number | null;
  rewardTier: RewardTier;
}

interface SeasonState {
  currentSeason: Season | null;
  seasonHistory: Season[];
  /** Call once on app startup to rotate season if the calendar month has changed. */
  checkAndRotateSeason: () => void;
  /** Record a new score entry for the current season. */
  recordScore: (entry: LeaderboardEntry) => void;
}

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

function currentMonthId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function seasonLabel(id: string): string {
  const [year, month] = id.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  // Produce "April 2026 Season" in English; i18n formatting happens in components.
  return date.toLocaleString('en', { month: 'long', year: 'numeric' }) + ' Season';
}

function monthStart(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01T00:00:00.000Z`;
}

function monthEnd(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const lastDay = new Date(y, m + 1, 0); // last day of month
  const dd = String(lastDay.getDate()).padStart(2, '0');
  const mm = String(m + 1).padStart(2, '0');
  return `${y}-${mm}-${dd}T23:59:59.999Z`;
}

/** Compute reward tier based on percentile rank (1-indexed). */
export function computeRewardTier(rank: number | null, total: number): RewardTier {
  if (rank === null || total === 0) return null;
  const percentile = rank / total;
  if (percentile <= 0.1) return 'gold';
  if (percentile <= 0.3) return 'silver';
  if (percentile <= 0.5) return 'bronze';
  return null;
}

/** Sort and find the best score for a given player name, plus their rank. */
function computePersonalStats(
  entries: LeaderboardEntry[],
  playerName: string
): { myBestScore: number; myRank: number | null; rewardTier: RewardTier } {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const myEntries = sorted.filter((e) => e.playerName === playerName);
  const myBestScore = myEntries.length > 0 ? myEntries[0].score : 0;
  const myRank =
    myEntries.length > 0 ? sorted.findIndex((e) => e.playerName === playerName) + 1 : null;
  const rewardTier = computeRewardTier(myRank, sorted.length);
  return { myBestScore, myRank, rewardTier };
}

function makeFreshSeason(now: Date = new Date()): Season {
  const id = currentMonthId(now);
  return {
    id,
    label: seasonLabel(id),
    startDate: monthStart(now),
    endDate: monthEnd(now),
    rankings: [],
    myBestScore: 0,
    myRank: null,
    rewardTier: null,
  };
}

// ──────────────────────────────────────────────────
// Persistence helpers
// ──────────────────────────────────────────────────

function isValidSeason(value: unknown): value is Season {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Season>;
  return (
    typeof s.id === 'string' &&
    typeof s.label === 'string' &&
    typeof s.startDate === 'string' &&
    typeof s.endDate === 'string' &&
    Array.isArray(s.rankings)
  );
}

function loadCurrentSeason(): Season | null {
  try {
    const raw = localStorage.getItem(SEASON_CURRENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidSeason(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadSeasonHistory(): Season[] {
  try {
    const raw = localStorage.getItem(SEASON_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSeason);
  } catch {
    return [];
  }
}

function persistCurrentSeason(season: Season): void {
  localStorage.setItem(SEASON_CURRENT_KEY, JSON.stringify(season));
}

function persistHistory(history: Season[]): void {
  localStorage.setItem(SEASON_HISTORY_KEY, JSON.stringify(history));
}

// ──────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────

export const useSeasonStore = create<SeasonState>((set, get) => ({
  currentSeason: loadCurrentSeason(),
  seasonHistory: loadSeasonHistory(),

  checkAndRotateSeason: () => {
    const now = new Date();
    const thisMonthId = currentMonthId(now);
    const { currentSeason } = get();

    if (!currentSeason) {
      // First launch — create a fresh season
      const fresh = makeFreshSeason(now);
      persistCurrentSeason(fresh);
      set({ currentSeason: fresh });
      return;
    }

    if (currentSeason.id === thisMonthId) {
      // Still the same month — no rotation needed
      return;
    }

    // Month has changed → archive old season, start new one
    const history = get().seasonHistory;
    const archived = [...history, currentSeason].slice(-MAX_HISTORY_SEASONS);
    const fresh = makeFreshSeason(now);
    persistCurrentSeason(fresh);
    persistHistory(archived);
    set({ currentSeason: fresh, seasonHistory: archived });
  },

  recordScore: (entry: LeaderboardEntry) => {
    const { currentSeason } = get();
    const season = currentSeason ?? makeFreshSeason();

    const updatedRankings = [...season.rankings, entry].sort((a, b) => b.score - a.score);
    const { myBestScore, myRank, rewardTier } = computePersonalStats(
      updatedRankings,
      entry.playerName
    );

    const updated: Season = {
      ...season,
      rankings: updatedRankings,
      myBestScore,
      myRank,
      rewardTier,
    };

    persistCurrentSeason(updated);
    set({ currentSeason: updated });
  },
}));

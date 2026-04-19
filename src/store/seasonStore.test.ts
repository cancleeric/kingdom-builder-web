import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeRewardTier,
  SEASON_CURRENT_KEY,
  SEASON_HISTORY_KEY,
  useSeasonStore,
} from './seasonStore';
import type { LeaderboardEntry } from './leaderboardStore';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

function makeEntry(playerName: string, score: number, date = '2026-04-01T00:00:00.000Z'): LeaderboardEntry {
  return { playerName, score, date, playerCount: 2, objectiveCards: [] };
}

function resetStore() {
  localStorage.clear();
  useSeasonStore.setState({ currentSeason: null, seasonHistory: [] });
}

// ──────────────────────────────────────────────────
// computeRewardTier
// ──────────────────────────────────────────────────

describe('computeRewardTier', () => {
  it('returns gold for top 10%', () => {
    expect(computeRewardTier(1, 10)).toBe('gold');
    expect(computeRewardTier(1, 100)).toBe('gold');
    expect(computeRewardTier(10, 100)).toBe('gold');
  });

  it('returns silver for ranks 11–30% of total', () => {
    expect(computeRewardTier(11, 100)).toBe('silver');
    expect(computeRewardTier(30, 100)).toBe('silver');
  });

  it('returns bronze for ranks 31–50% of total', () => {
    expect(computeRewardTier(31, 100)).toBe('bronze');
    expect(computeRewardTier(50, 100)).toBe('bronze');
  });

  it('returns null for ranks below 50%', () => {
    expect(computeRewardTier(51, 100)).toBeNull();
    expect(computeRewardTier(100, 100)).toBeNull();
  });

  it('returns null when rank is null', () => {
    expect(computeRewardTier(null, 10)).toBeNull();
  });

  it('returns null when total is 0', () => {
    expect(computeRewardTier(1, 0)).toBeNull();
  });
});

// ──────────────────────────────────────────────────
// checkAndRotateSeason
// ──────────────────────────────────────────────────

describe('checkAndRotateSeason', () => {
  beforeEach(resetStore);

  it('creates a fresh season on first call', () => {
    useSeasonStore.getState().checkAndRotateSeason();
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason).not.toBeNull();
    expect(currentSeason?.rankings).toEqual([]);
    const stored = localStorage.getItem(SEASON_CURRENT_KEY);
    expect(stored).not.toBeNull();
  });

  it('does not rotate when still in the same month', () => {
    useSeasonStore.getState().checkAndRotateSeason();
    const first = useSeasonStore.getState().currentSeason;

    // Call again — same month
    useSeasonStore.getState().checkAndRotateSeason();
    const second = useSeasonStore.getState().currentSeason;

    expect(second?.id).toBe(first?.id);
    expect(useSeasonStore.getState().seasonHistory).toHaveLength(0);
  });

  it('archives the old season and creates a new one on month change', () => {
    // Simulate April season
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T00:00:00Z'));
    useSeasonStore.getState().checkAndRotateSeason();
    const aprilSeason = useSeasonStore.getState().currentSeason;
    expect(aprilSeason?.id).toBe('2026-04');

    // Advance to May
    vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));
    useSeasonStore.getState().checkAndRotateSeason();
    const maySeason = useSeasonStore.getState().currentSeason;
    expect(maySeason?.id).toBe('2026-05');

    const history = useSeasonStore.getState().seasonHistory;
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('2026-04');

    const storedHistory = JSON.parse(localStorage.getItem(SEASON_HISTORY_KEY) ?? '[]') as Array<{ id: string }>;
    expect(storedHistory).toHaveLength(1);
    expect(storedHistory[0].id).toBe('2026-04');

    vi.useRealTimers();
  });

  it('caps history at 6 seasons', () => {
    vi.useFakeTimers();

    for (let month = 1; month <= 8; month++) {
      vi.setSystemTime(new Date(`2026-${String(month).padStart(2, '0')}-01T00:00:00Z`));
      useSeasonStore.getState().checkAndRotateSeason();
    }

    const history = useSeasonStore.getState().seasonHistory;
    expect(history.length).toBe(6);
    // Should keep the 6 most recent archived seasons (months 2–7)
    expect(history[0].id).toBe('2026-02');
    expect(history[5].id).toBe('2026-07');

    vi.useRealTimers();
  });
});

// ──────────────────────────────────────────────────
// recordScore
// ──────────────────────────────────────────────────

describe('recordScore', () => {
  beforeEach(() => {
    resetStore();
    useSeasonStore.getState().checkAndRotateSeason();
  });

  it('adds an entry to the current season rankings', () => {
    useSeasonStore.getState().recordScore(makeEntry('Alice', 80));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason?.rankings).toHaveLength(1);
    expect(currentSeason?.rankings[0].playerName).toBe('Alice');
  });

  it('keeps rankings sorted by score descending', () => {
    useSeasonStore.getState().recordScore(makeEntry('Bob', 50));
    useSeasonStore.getState().recordScore(makeEntry('Alice', 90));
    useSeasonStore.getState().recordScore(makeEntry('Carol', 70));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason?.rankings.map((e) => e.score)).toEqual([90, 70, 50]);
  });

  it('persists updated season to localStorage', () => {
    useSeasonStore.getState().recordScore(makeEntry('Alice', 42));
    const stored = JSON.parse(localStorage.getItem(SEASON_CURRENT_KEY) ?? 'null') as { rankings: Array<{ score: number }> } | null;
    expect(stored?.rankings).toHaveLength(1);
    expect(stored?.rankings[0].score).toBe(42);
  });

  it('computes gold reward tier when sole player is top 10%', () => {
    // With 10 players in rankings, rank 1 → top 10% → gold
    for (let i = 0; i < 9; i++) {
      useSeasonStore.getState().recordScore(makeEntry(`Player${i}`, i + 1));
    }
    useSeasonStore.getState().recordScore(makeEntry('TopPlayer', 100));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason?.myRank).toBe(1);
    expect(currentSeason?.myBestScore).toBe(100);
    expect(currentSeason?.rewardTier).toBe('gold');
  });
});

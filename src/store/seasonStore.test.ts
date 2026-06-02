import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSeasonStore, computeRewardTier, SEASON_CURRENT_KEY, SEASON_HISTORY_KEY } from './seasonStore';
import type { LeaderboardEntry } from './leaderboardStore';
import { ObjectiveCard } from '../core/scoring';

function resetStore() {
  localStorage.clear();
  useSeasonStore.setState({ currentSeason: null, seasonHistory: [] });
}

function makeEntry(playerName: string, score: number): LeaderboardEntry {
  return {
    playerName,
    score,
    date: new Date().toISOString(),
    playerCount: 2,
    objectiveCards: [ObjectiveCard.Fisherman],
  };
}

// ──────────────────────────────────────────────────
// computeRewardTier (pure function)
// ──────────────────────────────────────────────────

describe('computeRewardTier', () => {
  it('returns null when rank is null', () => {
    expect(computeRewardTier(null, 10)).toBe(null);
  });

  it('returns null when total is 0', () => {
    expect(computeRewardTier(1, 0)).toBe(null);
  });

  it('returns gold for top 10%', () => {
    // rank 1 out of 10 → 10% exactly → gold
    expect(computeRewardTier(1, 10)).toBe('gold');
  });

  it('returns silver for top 30%', () => {
    // rank 3 out of 10 → 30% exactly → silver
    expect(computeRewardTier(3, 10)).toBe('silver');
  });

  it('returns bronze for top 50%', () => {
    // rank 5 out of 10 → 50% exactly → bronze
    expect(computeRewardTier(5, 10)).toBe('bronze');
  });

  it('returns null for rank beyond 50%', () => {
    // rank 6 out of 10 → 60% → null
    expect(computeRewardTier(6, 10)).toBe(null);
  });
});

// ──────────────────────────────────────────────────
// checkAndRotateSeason
// ──────────────────────────────────────────────────

describe('checkAndRotateSeason', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a fresh season on first call', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-06-15T12:00:00Z'));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason).not.toBeNull();
    expect(currentSeason?.id).toBe('2026-06');
    expect(currentSeason?.rankings).toHaveLength(0);
    vi.useRealTimers();
  });

  it('does not reset when called again in the same month', () => {
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-06-10T00:00:00Z'));
    useSeasonStore.getState().recordScore(makeEntry('Alice', 50));
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-06-20T00:00:00Z'));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason?.rankings).toHaveLength(1);
  });

  it('archives the old season and creates a new one on month change', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T00:00:00Z'));
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-04-15T00:00:00Z'));
    const aprilSeason = useSeasonStore.getState().currentSeason;
    expect(aprilSeason?.id).toBe('2026-04');

    // Advance to May
    vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-05-01T00:00:00Z'));
    const maySeason = useSeasonStore.getState().currentSeason;
    expect(maySeason?.id).toBe('2026-05');

    const history = useSeasonStore.getState().seasonHistory;
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('2026-04');

    const storedHistory = JSON.parse(
      localStorage.getItem(SEASON_HISTORY_KEY) ?? '[]'
    ) as Array<{ id: string }>;
    expect(storedHistory).toHaveLength(1);
    expect(storedHistory[0].id).toBe('2026-04');

    vi.useRealTimers();
  });

  it('caps history at 6 seasons (append then slice)', () => {
    vi.useFakeTimers();

    for (let month = 1; month <= 8; month++) {
      const dateStr = `2026-${String(month).padStart(2, '0')}-01T00:00:00Z`;
      vi.setSystemTime(new Date(dateStr));
      useSeasonStore.getState().checkAndRotateSeason(new Date(dateStr));
    }

    const history = useSeasonStore.getState().seasonHistory;
    // Months 1–7 archived; month 8 is current. History capped to 6 → months 2–7
    expect(history.length).toBe(6);
    expect(history[0].id).toBe('2026-02');
    expect(history[5].id).toBe('2026-07');

    vi.useRealTimers();
  });

  it('handles year boundary (2026-12 → 2027-01)', () => {
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-12-15T00:00:00Z'));
    expect(useSeasonStore.getState().currentSeason?.id).toBe('2026-12');

    useSeasonStore.getState().checkAndRotateSeason(new Date('2027-01-01T00:00:00Z'));
    expect(useSeasonStore.getState().currentSeason?.id).toBe('2027-01');
    expect(useSeasonStore.getState().seasonHistory[0].id).toBe('2026-12');
  });
});

// ──────────────────────────────────────────────────
// recordScore
// ──────────────────────────────────────────────────

describe('recordScore', () => {
  beforeEach(() => {
    resetStore();
    useSeasonStore.getState().checkAndRotateSeason(new Date('2026-06-01T00:00:00Z'));
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
    const stored = JSON.parse(
      localStorage.getItem(SEASON_CURRENT_KEY) ?? 'null'
    ) as { rankings: Array<{ score: number }> } | null;
    expect(stored?.rankings).toHaveLength(1);
    expect(stored?.rankings[0].score).toBe(42);
  });

  it('computes gold reward tier when sole player is top 10%', () => {
    // 10 players total — rank 1 → exactly 10% → gold
    for (let i = 0; i < 9; i++) {
      useSeasonStore.getState().recordScore(makeEntry(`Player${i}`, i + 1));
    }
    useSeasonStore.getState().recordScore(makeEntry('TopPlayer', 100));
    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason?.myRank).toBe(1);
    expect(currentSeason?.myBestScore).toBe(100);
    expect(currentSeason?.rewardTier).toBe('gold');
  });

  it('updates myRank and myBestScore correctly', () => {
    useSeasonStore.getState().recordScore(makeEntry('Alice', 60));
    useSeasonStore.getState().recordScore(makeEntry('Bob', 80));
    useSeasonStore.getState().recordScore(makeEntry('Alice', 40));
    const { currentSeason } = useSeasonStore.getState();
    // Alice's best score is 60; Bob has 80 so Alice is rank 2
    expect(currentSeason?.myBestScore).toBe(60);
    expect(currentSeason?.myRank).toBe(2);
  });
});

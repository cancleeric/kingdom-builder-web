import { beforeEach, describe, expect, it } from 'vitest';
import {
  getSeasonId,
  getSeasonLabel,
  daysUntilReset,
  computeRewardTier,
  useSeasonStore,
  type Season,
} from './seasonStore';

const CURRENT_KEY = 'kingdom-season-current';
const HISTORY_KEY = 'kingdom-seasons-history';

describe('season utilities', () => {
  it('getSeasonId returns YYYY-MM format', () => {
    expect(getSeasonId(new Date('2026-04-18T10:00:00Z'))).toBe('2026-04');
    expect(getSeasonId(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
    expect(getSeasonId(new Date('2025-12-31T23:59:59Z'))).toBe('2025-12');
  });

  it('getSeasonLabel returns human-readable label', () => {
    expect(getSeasonLabel('2026-04')).toBe('Season 2026-04');
  });

  it('daysUntilReset returns positive days', () => {
    const midMonth = new Date('2026-04-15T12:00:00');
    const days = daysUntilReset(midMonth);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(31);
  });

  it('daysUntilReset returns 1 on last day of month', () => {
    const lastDay = new Date('2026-04-30T12:00:00');
    expect(daysUntilReset(lastDay)).toBe(1);
  });

  describe('computeRewardTier', () => {
    it('returns gold for top 10%', () => {
      expect(computeRewardTier(1, 100)).toBe('gold');
      expect(computeRewardTier(10, 100)).toBe('gold');
    });

    it('returns silver for ranks 11-30 out of 100', () => {
      expect(computeRewardTier(11, 100)).toBe('silver');
      expect(computeRewardTier(30, 100)).toBe('silver');
    });

    it('returns bronze for ranks 31-50 out of 100', () => {
      expect(computeRewardTier(31, 100)).toBe('bronze');
      expect(computeRewardTier(50, 100)).toBe('bronze');
    });

    it('returns null below top 50%', () => {
      expect(computeRewardTier(51, 100)).toBeNull();
      expect(computeRewardTier(100, 100)).toBeNull();
    });

    it('returns null when myRank is null', () => {
      expect(computeRewardTier(null, 10)).toBeNull();
    });

    it('returns null when totalEntries is 0', () => {
      expect(computeRewardTier(1, 0)).toBeNull();
    });
  });
});

describe('useSeasonStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSeasonStore.getState().reset();
  });

  it('initializes with the current month season', () => {
    const { currentSeason } = useSeasonStore.getState();
    const expectedId = getSeasonId(new Date());
    expect(currentSeason.id).toBe(expectedId);
    expect(currentSeason.rankings).toEqual([]);
    expect(currentSeason.myBestScore).toBe(0);
    expect(currentSeason.myRank).toBeNull();
    expect(currentSeason.rewardTier).toBeNull();
  });

  it('persists current season to localStorage', () => {
    const raw = localStorage.getItem(CURRENT_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { id: string };
    expect(parsed.id).toBe(getSeasonId(new Date()));
  });

  it('recordSeasonScore adds entries and updates myBestScore', () => {
    const store = useSeasonStore.getState();
    store.recordSeasonScore(42, [
      { playerName: 'Alice', score: 42, date: new Date().toISOString(), playerCount: 2 },
      { playerName: 'Bob', score: 35, date: new Date().toISOString(), playerCount: 2 },
    ]);

    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason.rankings).toHaveLength(2);
    expect(currentSeason.rankings[0].score).toBe(42);
    expect(currentSeason.myBestScore).toBe(42);
    expect(currentSeason.myRank).toBe(1);
  });

  it('myBestScore only increases, never decreases', () => {
    const store = useSeasonStore.getState();
    store.recordSeasonScore(80, [
      { playerName: 'Alice', score: 80, date: new Date().toISOString(), playerCount: 1 },
    ]);
    store.recordSeasonScore(30, [
      { playerName: 'Alice', score: 30, date: new Date().toISOString(), playerCount: 1 },
    ]);

    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason.myBestScore).toBe(80);
  });

  it('computes correct rewardTier when there are enough players', () => {
    const store = useSeasonStore.getState();
    // Add 10 players; my score (rank 1) should be gold
    const entries = Array.from({ length: 10 }, (_, i) => ({
      playerName: `P${i}`,
      score: 100 - i * 5,
      date: new Date().toISOString(),
      playerCount: 10,
    }));
    store.recordSeasonScore(100, entries);

    const { currentSeason } = useSeasonStore.getState();
    expect(currentSeason.rewardTier).toBe('gold');
  });

  it('archives current season and resets when month changes', () => {
    const store = useSeasonStore.getState();

    // Simulate an old season in the store state (as if loaded from a previous month)
    const oldSeason = {
      id: '2026-03',
      label: 'Season 2026-03',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-31T23:59:59.999Z',
      rankings: [
        { playerName: 'Alice', score: 70, date: '2026-03-15T10:00:00Z', playerCount: 2 },
      ],
      myBestScore: 70,
      myRank: 1,
      rewardTier: 'gold' as const,
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(oldSeason));
    // Also set the store state to the old season (simulating stale in-memory state)
    useSeasonStore.setState({ currentSeason: oldSeason });

    // Calling checkAndRotateSeason should detect the mismatch and archive
    store.checkAndRotateSeason();

    const { currentSeason, history } = useSeasonStore.getState();
    const expectedId = getSeasonId(new Date());
    expect(currentSeason.id).toBe(expectedId);
    expect(currentSeason.rankings).toEqual([]);
    // Archived season in history
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('limits history to 6 seasons', () => {
    // Pre-populate history with 6 seasons
    const oldHistory = Array.from({ length: 6 }, (_, i) => ({
      id: `2025-${String(i + 1).padStart(2, '0')}`,
      label: `Season 2025-${String(i + 1).padStart(2, '0')}`,
      startDate: new Date(2025, i, 1).toISOString(),
      endDate: new Date(2025, i + 1, 0, 23, 59, 59, 999).toISOString(),
      rankings: [],
      myBestScore: 0,
      myRank: null,
      rewardTier: null,
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(oldHistory));

    // Simulate old season in current
    const oldSeason = {
      id: '2025-07',
      label: 'Season 2025-07',
      startDate: new Date(2025, 6, 1).toISOString(),
      endDate: new Date(2025, 7, 0, 23, 59, 59, 999).toISOString(),
      rankings: [],
      myBestScore: 0,
      myRank: null,
      rewardTier: null,
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(oldSeason));

    useSeasonStore.getState().checkAndRotateSeason();

    const { history } = useSeasonStore.getState();
    expect(history.length).toBeLessThanOrEqual(6);
  });

  it('reset clears all data', () => {
    useSeasonStore.getState().recordSeasonScore(50, [
      { playerName: 'Alice', score: 50, date: new Date().toISOString(), playerCount: 1 },
    ]);
    useSeasonStore.getState().reset();

    const { currentSeason, history } = useSeasonStore.getState();
    expect(currentSeason.rankings).toEqual([]);
    expect(currentSeason.myBestScore).toBe(0);
    expect(history).toEqual([]);
  });

  it('handles season rotation when recordSeasonScore detects a new month', () => {
    // Inject an old season
    const oldId = '2026-01';
    const oldSeason = {
      id: oldId,
      label: `Season ${oldId}`,
      startDate: new Date(2026, 0, 1).toISOString(),
      endDate: new Date(2026, 1, 0, 23, 59, 59, 999).toISOString(),
      rankings: [
        { playerName: 'OldPlayer', score: 50, date: '2026-01-15T00:00:00Z', playerCount: 1 },
      ],
      myBestScore: 50,
      myRank: 1,
      rewardTier: 'gold',
    };
    localStorage.setItem(CURRENT_KEY, JSON.stringify(oldSeason));
    // Manually update store to old season state (simulating stale state)
    useSeasonStore.setState({ currentSeason: oldSeason as Season });

    // Record a score for the current month
    useSeasonStore.getState().recordSeasonScore(60, [
      { playerName: 'NewPlayer', score: 60, date: new Date().toISOString(), playerCount: 1 },
    ]);

    const { currentSeason, history } = useSeasonStore.getState();
    const expectedId = getSeasonId(new Date());
    expect(currentSeason.id).toBe(expectedId);
    expect(currentSeason.rankings).toHaveLength(1);
    expect(history.some((s) => s.id === oldId)).toBe(true);
  });
});

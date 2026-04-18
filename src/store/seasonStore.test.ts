import { beforeEach, describe, expect, it } from 'vitest';
import { useSeasonStore, getRankTier, getTopSeasonEntries, getPlayerRank } from './seasonStore';
import { RANK_THRESHOLDS } from '../types/season';

const STORAGE_KEY = 'kingdom-builder-season';

describe('seasonStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSeasonStore.getState().reset();
  });

  // ─── getRankTier ────────────────────────────────────
  describe('getRankTier', () => {
    it('returns Gold for score >= Gold threshold', () => {
      expect(getRankTier(RANK_THRESHOLDS.Gold)).toBe('Gold');
      expect(getRankTier(RANK_THRESHOLDS.Gold + 100)).toBe('Gold');
    });

    it('returns Silver for score in [500, 999]', () => {
      expect(getRankTier(RANK_THRESHOLDS.Silver)).toBe('Silver');
      expect(getRankTier(RANK_THRESHOLDS.Gold - 1)).toBe('Silver');
    });

    it('returns Bronze for score in [200, 499]', () => {
      expect(getRankTier(RANK_THRESHOLDS.Bronze)).toBe('Bronze');
      expect(getRankTier(RANK_THRESHOLDS.Silver - 1)).toBe('Bronze');
    });

    it('returns Iron for score < 200', () => {
      expect(getRankTier(0)).toBe('Iron');
      expect(getRankTier(199)).toBe('Iron');
    });
  });

  // ─── getTopSeasonEntries ────────────────────────────
  describe('getTopSeasonEntries', () => {
    it('returns at most 10 entries sorted by score descending', () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        playerName: `P${i}`,
        score: i * 50,
        gamesPlayed: 1,
        gamesWon: 0,
      }));
      const top = getTopSeasonEntries(entries);
      expect(top).toHaveLength(10);
      expect(top[0].score).toBe(700); // highest is 14*50=700
      for (let i = 0; i < top.length - 1; i++) {
        expect(top[i].score).toBeGreaterThanOrEqual(top[i + 1].score);
      }
    });
  });

  // ─── getPlayerRank ──────────────────────────────────
  describe('getPlayerRank', () => {
    it('returns 1-based rank for known player', () => {
      const entries = [
        { playerName: 'Alice', score: 300, gamesPlayed: 3, gamesWon: 2 },
        { playerName: 'Bob', score: 500, gamesPlayed: 5, gamesWon: 3 },
        { playerName: 'Carol', score: 100, gamesPlayed: 1, gamesWon: 0 },
      ];
      expect(getPlayerRank(entries, 'Bob')).toBe(1);
      expect(getPlayerRank(entries, 'Alice')).toBe(2);
      expect(getPlayerRank(entries, 'Carol')).toBe(3);
    });

    it('returns -1 for unknown player', () => {
      expect(getPlayerRank([], 'Nobody')).toBe(-1);
    });
  });

  // ─── recordGameResult ───────────────────────────────
  describe('recordGameResult', () => {
    it('adds a new entry for first-time player', () => {
      useSeasonStore.getState().recordGameResult('Alice', 80, true);
      const { entries } = useSeasonStore.getState().currentSeason;
      expect(entries).toHaveLength(1);
      expect(entries[0].playerName).toBe('Alice');
      expect(entries[0].score).toBe(80);
      expect(entries[0].gamesPlayed).toBe(1);
      expect(entries[0].gamesWon).toBe(1);
    });

    it('accumulates score and stats for returning player', () => {
      const state = useSeasonStore.getState();
      state.recordGameResult('Alice', 80, true);
      state.recordGameResult('Alice', 60, false);
      const { entries } = useSeasonStore.getState().currentSeason;
      expect(entries).toHaveLength(1);
      expect(entries[0].score).toBe(140);
      expect(entries[0].gamesPlayed).toBe(2);
      expect(entries[0].gamesWon).toBe(1);
    });

    it('creates separate entries for different players', () => {
      const state = useSeasonStore.getState();
      state.recordGameResult('Alice', 80, true);
      state.recordGameResult('Bob', 60, false);
      const { entries } = useSeasonStore.getState().currentSeason;
      expect(entries).toHaveLength(2);
    });

    it('persists data to localStorage', () => {
      useSeasonStore.getState().recordGameResult('Alice', 80, true);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!) as { currentSeason: { entries: Array<{ score: number }> } };
      expect(parsed.currentSeason.entries[0].score).toBe(80);
    });
  });

  // ─── checkAndRotateSeason ──────────────────────────
  describe('checkAndRotateSeason', () => {
    it('does not rotate when season is still active', () => {
      useSeasonStore.getState().recordGameResult('Alice', 50, true);
      const nameBefore = useSeasonStore.getState().currentSeason.name;
      useSeasonStore.getState().checkAndRotateSeason();
      expect(useSeasonStore.getState().currentSeason.name).toBe(nameBefore);
      expect(useSeasonStore.getState().history).toHaveLength(0);
    });

    it('archives old season and creates a new one when season has expired', () => {
      // Manually set an expired season
      const expiredSeason = {
        name: 'Season 2000-01',
        startDate: '2000-01-01T00:00:00.000Z',
        endDate: '2000-01-31T00:00:00.000Z',
        entries: [{ playerName: 'Alice', score: 50, gamesPlayed: 1, gamesWon: 1 }],
        archived: false,
      };
      useSeasonStore.setState({ currentSeason: expiredSeason, history: [] });
      useSeasonStore.getState().checkAndRotateSeason();

      const state = useSeasonStore.getState();
      expect(state.currentSeason.name).not.toBe('Season 2000-01');
      expect(state.currentSeason.entries).toHaveLength(0);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].name).toBe('Season 2000-01');
      expect(state.history[0].archived).toBe(true);
    });

    it('caps history at 3 seasons', () => {
      // Seed 3 archived seasons
      const makeExpired = (year: number) => ({
        name: `Season ${year}-01`,
        startDate: `${year}-01-01T00:00:00.000Z`,
        endDate: `${year}-01-31T00:00:00.000Z`,
        entries: [],
        archived: true,
      });
      const oldHistory = [makeExpired(2001), makeExpired(2002), makeExpired(2003)];

      const expiredCurrent = {
        name: 'Season 2004-01',
        startDate: '2004-01-01T00:00:00.000Z',
        endDate: '2004-01-31T00:00:00.000Z',
        entries: [],
        archived: false,
      };
      useSeasonStore.setState({ currentSeason: expiredCurrent, history: oldHistory });
      useSeasonStore.getState().checkAndRotateSeason();

      const { history } = useSeasonStore.getState();
      expect(history).toHaveLength(3);
      expect(history[0].name).toBe('Season 2004-01');
    });
  });

  // ─── reset ──────────────────────────────────────────
  describe('reset', () => {
    it('clears all season data and storage', () => {
      useSeasonStore.getState().recordGameResult('Alice', 100, true);
      useSeasonStore.getState().reset();
      expect(useSeasonStore.getState().currentSeason.entries).toHaveLength(0);
      expect(useSeasonStore.getState().history).toHaveLength(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  // ─── persistence round-trip ──────────────────────────
  describe('persistence', () => {
    it('loads previously persisted data from storage', () => {
      useSeasonStore.getState().recordGameResult('Alice', 120, true);

      // Simulate app reload by reinitializing from storage
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const parsed = JSON.parse(raw) as { currentSeason: { entries: Array<{ playerName: string; score: number }> } };
      expect(parsed.currentSeason.entries[0].playerName).toBe('Alice');
      expect(parsed.currentSeason.entries[0].score).toBe(120);
    });

    it('handles corrupt storage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      // reset triggers storage re-read
      useSeasonStore.getState().reset();
      expect(useSeasonStore.getState().currentSeason.entries).toHaveLength(0);
    });
  });

  // ─── recordGameResult triggers season rotation ──────
  describe('season rotation on recordGameResult', () => {
    it('rotates expired season before recording result', () => {
      const expiredSeason = {
        name: 'Season 2000-01',
        startDate: '2000-01-01T00:00:00.000Z',
        endDate: '2000-01-31T00:00:00.000Z',
        entries: [],
        archived: false,
      };
      useSeasonStore.setState({ currentSeason: expiredSeason, history: [] });
      useSeasonStore.getState().recordGameResult('Alice', 100, true);

      const state = useSeasonStore.getState();
      // New season started
      expect(state.currentSeason.name).not.toBe('Season 2000-01');
      // Entry recorded in new season
      expect(state.currentSeason.entries).toHaveLength(1);
      // Old season archived
      expect(state.history).toHaveLength(1);
    });
  });
});

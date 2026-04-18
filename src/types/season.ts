// ────────────────────────────────────────────────────
// Season types
// ────────────────────────────────────────────────────

/** Rank tier based on cumulative season score. */
export type RankTier = 'Gold' | 'Silver' | 'Bronze' | 'Iron';

/** Score thresholds for each rank tier. */
export const RANK_THRESHOLDS: Record<RankTier, number> = {
  Gold: 1000,
  Silver: 500,
  Bronze: 200,
  Iron: 0,
};

/** Badge/title awarded at season end based on tier. */
export const RANK_BADGES: Record<RankTier, string> = {
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
  Iron: '⚔️',
};

/** A player's entry in the season leaderboard. */
export interface SeasonEntry {
  playerName: string;
  /** Cumulative score for the season. */
  score: number;
  /** Number of games played this season. */
  gamesPlayed: number;
  /** Number of games won this season. */
  gamesWon: number;
}

/** A fully resolved season (active or archived). */
export interface Season {
  /** Human-readable name, e.g. "Season 2026-04". */
  name: string;
  /** ISO date string for season start. */
  startDate: string;
  /** ISO date string for season end (startDate + 30 days). */
  endDate: string;
  /** Leaderboard entries for this season, sorted by score descending. */
  entries: SeasonEntry[];
  /** Whether this season has ended and been archived. */
  archived: boolean;
}

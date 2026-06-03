import type { AchievementIconKey } from '../components/icons/AchievementBadge';

/**
 * A single achievement definition and its runtime state.
 */
export interface Achievement {
  /** Unique identifier */
  id: string;
  /** SVG icon key for AchievementBadge */
  icon: AchievementIconKey;
  /** Whether the player has unlocked this achievement */
  unlocked: boolean;
  /** ISO timestamp of when the achievement was unlocked */
  unlockedAt?: string;
}

/**
 * Cross-game progress counters used to evaluate achievement conditions.
 */
export interface AchievementProgress {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalSettlementsPlaced: number;
  totalTurnsPlayed: number;
}

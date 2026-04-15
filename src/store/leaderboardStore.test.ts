import { beforeEach, describe, expect, it } from 'vitest';
import { ObjectiveCard } from '../core/scoring';
import { BotDifficulty, type Player, type PlayerScore } from '../types';
import { useLeaderboardStore } from './leaderboardStore';

const LOCAL_KEY = 'kingdom-builder-leaderboard';

function makePlayers(): Player[] {
  return [
    {
      id: 1,
      name: 'Alice',
      color: '#f00',
      settlements: [],
      remainingSettlements: 0,
      tiles: [],
      isBot: false,
      difficulty: BotDifficulty.Medium,
    },
    {
      id: 2,
      name: 'Bob',
      color: '#0f0',
      settlements: [],
      remainingSettlements: 0,
      tiles: [],
      isBot: false,
      difficulty: BotDifficulty.Medium,
    },
  ];
}

function makeScores(a: number, b: number): PlayerScore[] {
  return [
    { playerId: 1, castleScore: 0, objectiveScores: [], totalScore: a },
    { playerId: 2, castleScore: 0, objectiveScores: [], totalScore: b },
  ];
}

describe('leaderboardStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeaderboardStore.getState().refresh();
    useLeaderboardStore.setState({ localEntries: [] });
  });

  it('submits and persists local leaderboard entries', () => {
    useLeaderboardStore
      .getState()
      .submitGameScores(makeScores(42, 60), makePlayers(), [ObjectiveCard.Citizens]);

    const localEntries = useLeaderboardStore.getState().localEntries;
    expect(localEntries).toHaveLength(2);
    expect(localEntries[0].playerName).toBe('Bob');
    expect(localEntries[0].score).toBe(60);
    expect(localEntries[0].playerCount).toBe(2);
    expect(localEntries[0].objectiveCards).toEqual([ObjectiveCard.Citizens]);

    const persisted = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as Array<{ score: number }>;
    expect(persisted).toHaveLength(2);
    expect(persisted[0].score).toBe(60);
  });

  it('keeps at most 50 local records ordered by score descending', () => {
    const state = useLeaderboardStore.getState();
    for (let i = 0; i < 60; i++) {
      state.submitGameScores(
        makeScores(100 - i, 100 - i - 1),
        makePlayers(),
        [ObjectiveCard.Farmers]
      );
    }

    const localEntries = useLeaderboardStore.getState().localEntries;
    expect(localEntries).toHaveLength(50);
    expect(localEntries[0].score).toBe(100);
    expect(localEntries.at(-1)?.score).toBe(76);
  });

  it('clears local leaderboard records', () => {
    useLeaderboardStore
      .getState()
      .submitGameScores(makeScores(10, 20), makePlayers(), [ObjectiveCard.Hermits]);
    expect(useLeaderboardStore.getState().localEntries.length).toBeGreaterThan(0);

    useLeaderboardStore.getState().clearLocalEntries();
    expect(useLeaderboardStore.getState().localEntries).toEqual([]);
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });
});

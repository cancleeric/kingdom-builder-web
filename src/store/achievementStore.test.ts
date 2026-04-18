import { beforeEach, describe, expect, it } from 'vitest';
import { useAchievementStore, getUnlockedCount } from './achievementStore';
import type { GameEventData } from './achievementStore';

const LOCAL_KEY = 'kingdom-builder-achievements';

function makeGameData(overrides: Partial<GameEventData> = {}): GameEventData {
  return {
    isWinner: false,
    topScore: 0,
    turnsPlayed: 5,
    tilesAtEnd: 0,
    settlementsThisGame: 10,
    ...overrides,
  };
}

describe('achievementStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAchievementStore.getState().reset();
  });

  it('initialises with all achievements locked', () => {
    const { achievements, progress } = useAchievementStore.getState();
    expect(achievements.every((a) => !a.unlocked)).toBe(true);
    expect(progress.totalGamesPlayed).toBe(0);
    expect(progress.totalGamesWon).toBe(0);
  });

  it('unlocks first_game after the first game ends', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData());
    const { achievements } = useAchievementStore.getState();
    const a = achievements.find((x) => x.id === 'first_game');
    expect(a?.unlocked).toBe(true);
    expect(a?.unlockedAt).toBeDefined();
  });

  it('does NOT unlock first_win when player loses', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: false }));
    const { achievements } = useAchievementStore.getState();
    const a = achievements.find((x) => x.id === 'first_win');
    expect(a?.unlocked).toBe(false);
  });

  it('unlocks first_win when player wins', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    const { achievements } = useAchievementStore.getState();
    const a = achievements.find((x) => x.id === 'first_win');
    expect(a?.unlocked).toBe(true);
  });

  it('accumulates totalGamesPlayed across multiple calls', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData());
    useAchievementStore.getState().recordGameEnd(makeGameData());
    expect(useAchievementStore.getState().progress.totalGamesPlayed).toBe(2);
  });

  it('accumulates totalGamesWon only for winning games', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: false }));
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    expect(useAchievementStore.getState().progress.totalGamesWon).toBe(2);
  });

  it('unlocks win_5 after 5 wins', () => {
    for (let i = 0; i < 5; i++) {
      useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    }
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'win_5');
    expect(a?.unlocked).toBe(true);
  });

  it('unlocks play_5 after 5 games', () => {
    for (let i = 0; i < 5; i++) {
      useAchievementStore.getState().recordGameEnd(makeGameData());
    }
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'play_5');
    expect(a?.unlocked).toBe(true);
  });

  it('unlocks score_50 when topScore >= 50', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ topScore: 55 }));
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'score_50');
    expect(a?.unlocked).toBe(true);
  });

  it('does NOT unlock score_100 when topScore < 100', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ topScore: 99 }));
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'score_100');
    expect(a?.unlocked).toBe(false);
  });

  it('unlocks score_100 when topScore >= 100', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ topScore: 120 }));
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'score_100');
    expect(a?.unlocked).toBe(true);
  });

  it('unlocks tile_collector when tilesAtEnd >= 3', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ tilesAtEnd: 3 }));
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'tile_collector');
    expect(a?.unlocked).toBe(true);
  });

  it('accumulates totalSettlementsPlaced across games', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ settlementsThisGame: 40 }));
    useAchievementStore.getState().recordGameEnd(makeGameData({ settlementsThisGame: 40 }));
    useAchievementStore.getState().recordGameEnd(makeGameData({ settlementsThisGame: 40 }));
    expect(useAchievementStore.getState().progress.totalSettlementsPlaced).toBe(120);
  });

  it('unlocks settlements_100 once total >= 100', () => {
    for (let i = 0; i < 4; i++) {
      useAchievementStore.getState().recordGameEnd(makeGameData({ settlementsThisGame: 30 }));
    }
    const a = useAchievementStore.getState().achievements.find((x) => x.id === 'settlements_100');
    expect(a?.unlocked).toBe(true);
  });

  it('queues newly unlocked achievements as toasts', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData());
    const { toastQueue } = useAchievementStore.getState();
    // first_game should be in the queue
    expect(toastQueue).toContain('first_game');
  });

  it('dismissToast removes the first item', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData());
    const queueBefore = useAchievementStore.getState().toastQueue.length;
    useAchievementStore.getState().dismissToast();
    const queueAfter = useAchievementStore.getState().toastQueue.length;
    expect(queueAfter).toBe(queueBefore - 1);
  });

  it('does not re-unlock an already unlocked achievement', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData());
    const firstUnlockTime = useAchievementStore
      .getState()
      .achievements.find((a) => a.id === 'first_game')?.unlockedAt;

    // advance time slightly
    useAchievementStore.getState().recordGameEnd(makeGameData());
    const secondUnlockTime = useAchievementStore
      .getState()
      .achievements.find((a) => a.id === 'first_game')?.unlockedAt;

    expect(secondUnlockTime).toBe(firstUnlockTime);
  });

  it('persists progress to localStorage', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as {
      progress: { totalGamesPlayed: number };
    };
    expect(stored.progress.totalGamesPlayed).toBe(1);
  });

  it('reset clears all data and removes localStorage entry', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true }));
    useAchievementStore.getState().reset();
    const { achievements, progress } = useAchievementStore.getState();
    expect(achievements.every((a) => !a.unlocked)).toBe(true);
    expect(progress.totalGamesPlayed).toBe(0);
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it('getUnlockedCount returns correct count', () => {
    useAchievementStore.getState().recordGameEnd(makeGameData({ isWinner: true, topScore: 60 }));
    const count = getUnlockedCount(useAchievementStore.getState().achievements);
    // Should have unlocked: first_game, first_win, score_50 at minimum
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

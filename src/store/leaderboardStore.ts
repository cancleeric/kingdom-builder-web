import { create } from 'zustand';
import type { ObjectiveCard } from '../core/scoring';
import type { Player, PlayerScore } from '../types';
import { useSeasonStore } from './seasonStore';

const LOCAL_STORAGE_KEY = 'kingdom-builder-leaderboard';
const GLOBAL_STORAGE_KEY = 'kingdom-builder-global-leaderboard';
const MAX_RECORDS = 50;
const TOP_DISPLAY_COUNT = 10;

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  date: string;
  playerCount: number;
  objectiveCards: ObjectiveCard[];
}

interface LeaderboardState {
  localEntries: LeaderboardEntry[];
  globalEntries: LeaderboardEntry[];
  submitGameScores: (
    finalScores: PlayerScore[],
    players: Player[],
    objectiveCards: ObjectiveCard[]
  ) => void;
  clearLocalEntries: () => void;
  refresh: () => void;
}

function isValidEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<LeaderboardEntry>;
  return (
    typeof entry.playerName === 'string' &&
    typeof entry.score === 'number' &&
    Number.isFinite(entry.score) &&
    typeof entry.date === 'string' &&
    typeof entry.playerCount === 'number' &&
    Number.isFinite(entry.playerCount) &&
    Array.isArray(entry.objectiveCards)
  );
}

function safeReadStorage(key: string): LeaderboardEntry[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(key);
      return [];
    }
    const valid = parsed.filter(isValidEntry);
    if (valid.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(valid));
    }
    return valid;
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function sortAndTrim(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, MAX_RECORDS);
}

function persistEntries(key: string, entries: LeaderboardEntry[]): void {
  localStorage.setItem(key, JSON.stringify(entries));
}

function makeInitialGlobalEntries(): LeaderboardEntry[] {
  const defaultEntries: LeaderboardEntry[] = [
    {
      playerName: 'Aria',
      score: 132,
      date: '2026-04-01T00:00:00.000Z',
      playerCount: 4,
      objectiveCards: [],
    },
    {
      playerName: 'Bram',
      score: 126,
      date: '2026-04-01T00:00:00.000Z',
      playerCount: 3,
      objectiveCards: [],
    },
    {
      playerName: 'Cora',
      score: 121,
      date: '2026-04-01T00:00:00.000Z',
      playerCount: 4,
      objectiveCards: [],
    },
  ];
  return sortAndTrim([...safeReadStorage(GLOBAL_STORAGE_KEY), ...defaultEntries]);
}

export function getObjectiveComboKey(objectiveCards: ObjectiveCard[]): string {
  return objectiveCards.length > 0 ? objectiveCards.join('|') : '__all__';
}

export function getTopEntries(
  entries: LeaderboardEntry[],
  objectiveCombo?: string
): LeaderboardEntry[] {
  const filtered =
    objectiveCombo && objectiveCombo !== '__all__'
      ? entries.filter((entry) => getObjectiveComboKey(entry.objectiveCards) === objectiveCombo)
      : entries;
  return sortAndTrim(filtered).slice(0, TOP_DISPLAY_COUNT);
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  localEntries: sortAndTrim(safeReadStorage(LOCAL_STORAGE_KEY)),
  globalEntries: makeInitialGlobalEntries(),

  submitGameScores: (finalScores, players, objectiveCards) => {
    const playerById = new Map(players.map((player) => [player.id, player]));
    const now = new Date().toISOString();

    const newEntries = finalScores.map<LeaderboardEntry>((score) => ({
      playerName: playerById.get(score.playerId)?.name ?? `Player ${score.playerId}`,
      score: score.totalScore,
      date: now,
      playerCount: players.length,
      objectiveCards: [...objectiveCards],
    }));

    // Feed each entry into the season store
    const { recordScore } = useSeasonStore.getState();
    for (const entry of newEntries) {
      recordScore(entry);
    }

    set((state) => {
      const localEntries = sortAndTrim([...state.localEntries, ...newEntries]);
      const globalEntries = sortAndTrim([...state.globalEntries, ...newEntries]);
      persistEntries(LOCAL_STORAGE_KEY, localEntries);
      persistEntries(GLOBAL_STORAGE_KEY, globalEntries);
      return { localEntries, globalEntries };
    });
  },

  clearLocalEntries: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ localEntries: [] });
  },

  refresh: () => {
    const localEntries = sortAndTrim(safeReadStorage(LOCAL_STORAGE_KEY));
    const globalEntries = makeInitialGlobalEntries();
    persistEntries(GLOBAL_STORAGE_KEY, globalEntries);
    set({ localEntries, globalEntries });
  },
}));

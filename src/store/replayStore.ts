import { create } from 'zustand';
import type { ReplayRecord } from '../types';

const LOCAL_STORAGE_KEY = 'kingdom-builder-replays';
const MAX_REPLAYS = 20;

// ────────────────────────────────────────────────────
// Persistence helpers
// ────────────────────────────────────────────────────

function isValidReplayRecord(value: unknown): value is ReplayRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<ReplayRecord>;
  return (
    typeof r.id === 'string' &&
    typeof r.date === 'string' &&
    typeof r.winnerName === 'string' &&
    Array.isArray(r.players) &&
    Array.isArray(r.history) &&
    Array.isArray(r.finalScores) &&
    Array.isArray(r.objectiveCards)
  );
}

function safeReadStorage(): ReplayRecord[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return [];
    }
    const valid = parsed.filter(isValidReplayRecord);
    if (valid.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return [];
  }
}

function persistReplays(replays: ReplayRecord[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(replays));
}

/** Keep only the newest MAX_REPLAYS entries (sorted newest-first). */
function trimReplays(replays: ReplayRecord[]): ReplayRecord[] {
  return [...replays]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_REPLAYS);
}

// ────────────────────────────────────────────────────
// Store shape
// ────────────────────────────────────────────────────

interface ReplayState {
  /** All saved replay records, newest first. */
  replays: ReplayRecord[];
  /** Currently selected replay being viewed (null = list view). */
  selectedReplayId: string | null;

  /** Save a completed game as a replay record. */
  saveReplay: (record: Omit<ReplayRecord, 'id' | 'date'>) => void;
  /** Delete a replay by id. */
  deleteReplay: (id: string) => void;
  /** Select a replay to view. */
  selectReplay: (id: string | null) => void;
  /** Clear all replays. */
  clearReplays: () => void;
}

export const useReplayStore = create<ReplayState>((set) => ({
  replays: trimReplays(safeReadStorage()),
  selectedReplayId: null,

  saveReplay: (record) => {
    const newReplay: ReplayRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    set((state) => {
      const replays = trimReplays([newReplay, ...state.replays]);
      persistReplays(replays);
      return { replays };
    });
  },

  deleteReplay: (id) => {
    set((state) => {
      const replays = state.replays.filter((r) => r.id !== id);
      persistReplays(replays);
      const selectedReplayId = state.selectedReplayId === id ? null : state.selectedReplayId;
      return { replays, selectedReplayId };
    });
  },

  selectReplay: (id) => {
    set({ selectedReplayId: id });
  },

  clearReplays: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({ replays: [], selectedReplayId: null });
  },
}));

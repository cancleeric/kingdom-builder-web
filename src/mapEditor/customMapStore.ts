import { create } from 'zustand';
import { CustomMapRecord, CustomMapPayload } from './types';
import { encode, decode } from './codec';

const STORAGE_KEY = 'kingdom-custom-maps';
const MAX_MAPS = 10;
const MAX_NAME_LENGTH = 40;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface CustomMapState {
  maps: CustomMapRecord[];
  addMap: (name: string, payload: CustomMapPayload) => CustomMapRecord | null;
  updateMapName: (id: string, name: string) => void;
  deleteMap: (id: string) => void;
  getMap: (id: string) => CustomMapRecord | undefined;
  importFromShareCode: (code: string) => CustomMapRecord | null;
  exportShareCode: (id: string) => string | null;
  _loadFromStorage: () => void;
  _persist: () => void;
}

export const useCustomMapStore = create<CustomMapState>((set, get) => ({
  maps: [],

  addMap(name: string, payload: CustomMapPayload): CustomMapRecord | null {
    const { maps } = get();
    if (maps.length >= MAX_MAPS) return null;

    const record: CustomMapRecord = {
      id: generateId(),
      name: name.slice(0, MAX_NAME_LENGTH),
      createdAt: new Date().toISOString(),
      mapData: payload,
    };

    set({ maps: [...maps, record] });
    get()._persist();
    return record;
  },

  updateMapName(id: string, name: string): void {
    set(state => ({
      maps: state.maps.map(m =>
        m.id === id ? { ...m, name: name.slice(0, MAX_NAME_LENGTH) } : m
      ),
    }));
    get()._persist();
  },

  deleteMap(id: string): void {
    set(state => ({ maps: state.maps.filter(m => m.id !== id) }));
    get()._persist();
  },

  getMap(id: string): CustomMapRecord | undefined {
    return get().maps.find(m => m.id === id);
  },

  importFromShareCode(code: string): CustomMapRecord | null {
    const payload = decode(code);
    if (payload === null) return null;
    return get().addMap('Imported Map', payload);
  },

  exportShareCode(id: string): string | null {
    const record = get().getMap(id);
    if (!record) return null;
    return encode(record.mapData);
  },

  _loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        set({ maps: parsed as CustomMapRecord[] });
      }
    } catch {
      set({ maps: [] });
    }
  },

  _persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().maps));
    } catch {
      // silent
    }
  },
}));

useCustomMapStore.getState()._loadFromStorage();

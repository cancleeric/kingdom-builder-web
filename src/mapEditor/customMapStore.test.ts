import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomMapStore } from './customMapStore';
import { encode } from './codec';
import { Terrain } from '../core/terrain';
import { CustomMapPayload } from './types';

const samplePayload: CustomMapPayload = {
  v: 1,
  w: 12,
  h: 12,
  cells: [{ q: 0, r: 0, terrain: Terrain.Grass }],
};

function resetStore() {
  localStorage.clear();
  useCustomMapStore.setState({ maps: [] });
}

describe('customMapStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addMap', () => {
    it('should add one map and return the record', () => {
      const result = useCustomMapStore.getState().addMap('My Map', samplePayload);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('My Map');
      expect(useCustomMapStore.getState().maps).toHaveLength(1);
    });

    it('should return null when adding the 11th map (limit 10)', () => {
      const store = useCustomMapStore.getState();
      for (let i = 0; i < 10; i++) {
        store.addMap(`Map ${i}`, samplePayload);
      }
      const result = useCustomMapStore.getState().addMap('Map 11', samplePayload);
      expect(result).toBeNull();
      expect(useCustomMapStore.getState().maps).toHaveLength(10);
    });
  });

  describe('deleteMap', () => {
    it('should reduce count by 1 when deleting existing map', () => {
      const store = useCustomMapStore.getState();
      const record = store.addMap('To Delete', samplePayload);
      expect(useCustomMapStore.getState().maps).toHaveLength(1);
      useCustomMapStore.getState().deleteMap(record!.id);
      expect(useCustomMapStore.getState().maps).toHaveLength(0);
    });

    it('should not throw when deleting non-existent id', () => {
      expect(() => useCustomMapStore.getState().deleteMap('non-existent-id')).not.toThrow();
    });
  });

  describe('importFromShareCode', () => {
    it('should add a map when valid share code provided', () => {
      const code = encode(samplePayload);
      const result = useCustomMapStore.getState().importFromShareCode(code);
      expect(result).not.toBeNull();
      expect(useCustomMapStore.getState().maps).toHaveLength(1);
    });

    it('should return null and not change maps for invalid code', () => {
      const result = useCustomMapStore.getState().importFromShareCode('INVALID_CODE');
      expect(result).toBeNull();
      expect(useCustomMapStore.getState().maps).toHaveLength(0);
    });
  });

  describe('exportShareCode', () => {
    it('should return string with KB-v1- prefix for existing map', () => {
      const record = useCustomMapStore.getState().addMap('Export Me', samplePayload);
      const code = useCustomMapStore.getState().exportShareCode(record!.id);
      expect(code).not.toBeNull();
      expect(code!).toMatch(/^KB-v1-/);
    });

    it('should return null for non-existent id', () => {
      const code = useCustomMapStore.getState().exportShareCode('no-such-id');
      expect(code).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should write to localStorage after addMap', () => {
      useCustomMapStore.getState().addMap('Persist Test', samplePayload);
      const raw = localStorage.getItem('kingdom-custom-maps');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });

    it('_loadFromStorage should rebuild maps from localStorage', () => {
      useCustomMapStore.getState().addMap('Load Test', samplePayload);
      // Reset in-memory state only
      useCustomMapStore.setState({ maps: [] });
      expect(useCustomMapStore.getState().maps).toHaveLength(0);
      // Reload from storage
      useCustomMapStore.getState()._loadFromStorage();
      expect(useCustomMapStore.getState().maps).toHaveLength(1);
      expect(useCustomMapStore.getState().maps[0].name).toBe('Load Test');
    });

    it('bad JSON in localStorage should produce empty maps without throwing', () => {
      localStorage.setItem('kingdom-custom-maps', 'NOT_VALID_JSON{{{');
      expect(() => useCustomMapStore.getState()._loadFromStorage()).not.toThrow();
      expect(useCustomMapStore.getState().maps).toHaveLength(0);
    });
  });
});

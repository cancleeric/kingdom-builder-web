import { describe, it, expect } from 'vitest';
import { encode, decode } from './codec';
import { Terrain, Location } from '../core/terrain';
import { CustomMapPayload } from './types';

const samplePayload: CustomMapPayload = {
  v: 1,
  w: 12,
  h: 12,
  cells: [
    { q: 0, r: 0, terrain: Terrain.Grass },
    { q: 1, r: 0, terrain: Terrain.Forest, location: Location.Castle },
  ],
};

const emptyPayload: CustomMapPayload = {
  v: 1,
  w: 16,
  h: 16,
  cells: [],
};

describe('encode', () => {
  it('should produce a string starting with KB-v1-', () => {
    const code = encode(samplePayload);
    expect(code).toMatch(/^KB-v1-/);
  });

  it('should produce only valid Base64 chars after prefix', () => {
    const code = encode(samplePayload);
    const b64 = code.slice('KB-v1-'.length);
    expect(b64).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('empty cells round-trip should produce valid prefix', () => {
    const code = encode(emptyPayload);
    expect(code).toMatch(/^KB-v1-/);
  });
});

describe('decode — happy path', () => {
  it('should round-trip samplePayload', () => {
    const code = encode(samplePayload);
    const result = decode(code);
    expect(result).toEqual(samplePayload);
  });

  it('should round-trip emptyPayload', () => {
    const code = encode(emptyPayload);
    const result = decode(code);
    expect(result).toEqual(emptyPayload);
  });
});

describe('decode — security guards', () => {
  it('empty string → null', () => {
    expect(decode('')).toBeNull();
  });

  it('wrong prefix KB-v2- → null', () => {
    const code = encode(samplePayload).replace('KB-v1-', 'KB-v2-');
    expect(decode(code)).toBeNull();
  });

  it('exceeds 50000 char limit → null', () => {
    const longCode = 'KB-v1-' + 'A'.repeat(50001);
    expect(decode(longCode)).toBeNull();
  });

  it('valid Base64 but not JSON → null', () => {
    const notJson = 'KB-v1-' + btoa('this is not json');
    expect(decode(notJson)).toBeNull();
  });

  it('v !== 1 → null', () => {
    const bad = { ...samplePayload, v: 2 };
    const json = JSON.stringify(bad);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    const code = 'KB-v1-' + btoa(binary);
    expect(decode(code)).toBeNull();
  });

  it('w not in [12,16,20] → null', () => {
    const bad = { ...samplePayload, w: 10 };
    const json = JSON.stringify(bad);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    const code = 'KB-v1-' + btoa(binary);
    expect(decode(code)).toBeNull();
  });

  it('invalid terrain → null', () => {
    const bad: Record<string, unknown> = {
      v: 1,
      w: 12,
      h: 12,
      cells: [{ q: 0, r: 0, terrain: 'InvalidTerrain' }],
    };
    const json = JSON.stringify(bad);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    const code = 'KB-v1-' + btoa(binary);
    expect(decode(code)).toBeNull();
  });

  it('invalid location → null', () => {
    const bad: Record<string, unknown> = {
      v: 1,
      w: 12,
      h: 12,
      cells: [{ q: 0, r: 0, terrain: Terrain.Grass, location: 'NotALocation' }],
    };
    const json = JSON.stringify(bad);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    const code = 'KB-v1-' + btoa(binary);
    expect(decode(code)).toBeNull();
  });

  it('cells not array → null', () => {
    const bad: Record<string, unknown> = { v: 1, w: 12, h: 12, cells: 'not-array' };
    const json = JSON.stringify(bad);
    const bytes = new TextEncoder().encode(json);
    const binary = String.fromCharCode(...bytes);
    const code = 'KB-v1-' + btoa(binary);
    expect(decode(code)).toBeNull();
  });

  it('null as any → null (no throw)', () => {
    expect(() => decode(null as unknown as string)).not.toThrow();
    expect(decode(null as unknown as string)).toBeNull();
  });
});

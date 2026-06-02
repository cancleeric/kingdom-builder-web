import { Terrain, Location } from '../core/terrain';
import { CustomMapPayload } from './types';

const PREFIX = 'KB-v1-';
const MAX_B64_LENGTH = 50000;
const VALID_SIZES = [12, 16, 20];
const B64_REGEX = /^[A-Za-z0-9+/=]+$/;

export function encode(payload: CustomMapPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const binary = String.fromCharCode(...bytes);
  return PREFIX + btoa(binary);
}

export function decode(shareCode: unknown): CustomMapPayload | null {
  try {
    // 1. type check
    if (typeof shareCode !== 'string') return null;

    // 2. prefix check
    if (!shareCode.startsWith(PREFIX)) return null;

    const b64 = shareCode.slice(PREFIX.length);

    // 3. size check BEFORE JSON.parse (DoS防禦)
    if (b64.length > MAX_B64_LENGTH) return null;

    // 4. whitelist regex check
    if (!B64_REGEX.test(b64)) return null;

    // 5. decode
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    // 6. schema validation
    const { v, w, h, cells } = parsed;

    if (v !== 1) return null;
    if (!VALID_SIZES.includes(w)) return null;
    if (!VALID_SIZES.includes(h)) return null;
    if (!Array.isArray(cells)) return null;

    const validTerrains = new Set(Object.values(Terrain));
    const validLocations = new Set(Object.values(Location));

    for (const cell of cells) {
      if (typeof cell.q !== 'number') return null;
      if (typeof cell.r !== 'number') return null;
      if (!validTerrains.has(cell.terrain)) return null;
      if (cell.location !== undefined && !validLocations.has(cell.location)) return null;
    }

    // 7. pass
    return parsed as CustomMapPayload;
  } catch {
    return null;
  }
}

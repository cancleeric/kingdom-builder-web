import { Board } from '../core/board';
import { CustomMapPayload } from './types';

/**
 * Converts a CustomMapPayload into a Board instance.
 * settlement is always set to undefined (map editor stores no settlements).
 */
export function payloadToBoard(payload: CustomMapPayload): Board {
  const b = new Board(payload.w, payload.h);
  payload.cells.forEach(c =>
    b.setCell({ coord: { q: c.q, r: c.r }, terrain: c.terrain, location: c.location, settlement: undefined })
  );
  return b;
}

import { describe, it, expect } from 'vitest';
import { payloadToBoard } from './payloadToBoard';
import { Terrain, Location } from '../core/terrain';
import { CustomMapPayload } from './types';

const samplePayload: CustomMapPayload = {
  v: 1,
  w: 12,
  h: 12,
  cells: [
    { q: 0, r: 0, terrain: Terrain.Grass },
    { q: 1, r: 0, terrain: Terrain.Desert, location: Location.Oasis },
    { q: 0, r: 1, terrain: Terrain.Forest },
  ],
};

describe('payloadToBoard', () => {
  it('creates a Board with correct dimensions', () => {
    const board = payloadToBoard(samplePayload);
    expect(board.width).toBe(12);
    expect(board.height).toBe(12);
  });

  it('sets cells with correct terrain', () => {
    const board = payloadToBoard(samplePayload);
    const cell = board.getCell({ q: 0, r: 0 });
    expect(cell).toBeDefined();
    expect(cell!.terrain).toBe(Terrain.Grass);
  });

  it('sets cells with correct location', () => {
    const board = payloadToBoard(samplePayload);
    const cell = board.getCell({ q: 1, r: 0 });
    expect(cell).toBeDefined();
    expect(cell!.terrain).toBe(Terrain.Desert);
    expect(cell!.location).toBe(Location.Oasis);
  });

  it('always sets settlement to undefined', () => {
    const board = payloadToBoard(samplePayload);
    for (const cell of board.getAllCells()) {
      expect(cell.settlement).toBeUndefined();
    }
  });

  it('cell without location has undefined location', () => {
    const board = payloadToBoard(samplePayload);
    const cell = board.getCell({ q: 0, r: 1 });
    expect(cell).toBeDefined();
    expect(cell!.location).toBeUndefined();
  });
});

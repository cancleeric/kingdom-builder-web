import { describe, it, expect } from 'vitest';
import { computeMove } from '../workers/aiWorker';
import type { AIComputeRequest } from '../workers/aiWorker';

describe('AI Worker heuristic', () => {
  it('returns null when there are no valid placements', () => {
    const req: AIComputeRequest = { cells: [], validPlacements: [], playerId: 1 };
    expect(computeMove(req).coord).toBeNull();
  });

  it('returns the first valid placement when no settlements exist', () => {
    const req: AIComputeRequest = {
      cells: [],
      validPlacements: [{ q: 2, r: 3 }, { q: 4, r: 1 }],
      playerId: 1,
    };
    expect(computeMove(req).coord).toEqual({ q: 2, r: 3 });
  });

  it('prefers a placement adjacent to an existing settlement', () => {
    // Settlement at (0, 0); valid at (1, 0) which is a direct neighbor, and (5, 5) which is far.
    const req: AIComputeRequest = {
      cells: [{ q: 0, r: 0, terrain: 'Grass', settlement: 1 }],
      validPlacements: [{ q: 5, r: 5 }, { q: 1, r: 0 }],
      playerId: 1,
    };
    expect(computeMove(req).coord).toEqual({ q: 1, r: 0 });
  });
});

/**
 * AI Worker — runs AI move computation off the main thread.
 *
 * Message protocol:
 *   Incoming  { type: 'COMPUTE_MOVE', payload: AIComputeRequest }
 *   Outgoing  { type: 'MOVE_RESULT',  payload: AIComputeResult }
 *           | { type: 'ERROR',        payload: string }
 */

export interface AIComputeRequest {
  /** Serialized board cells: [{ q, r, terrain, settlement? }] */
  cells: Array<{
    q: number;
    r: number;
    terrain: string;
    settlement?: number;
  }>;
  /** Valid placements for the AI player */
  validPlacements: Array<{ q: number; r: number }>;
  /** Player ID of the AI */
  playerId: number;
}

export interface AIComputeResult {
  /** Chosen coordinate, or null if no valid move */
  coord: { q: number; r: number } | null;
}

/**
 * Naïve AI strategy: pick the first valid placement.
 * Replace this function with a smarter heuristic / minimax as needed.
 *
 * Exported for unit testing outside of the worker context.
 */
export function computeMove(req: AIComputeRequest): AIComputeResult {
  if (req.validPlacements.length === 0) {
    return { coord: null };
  }
  // Simple heuristic: prefer placements adjacent to existing settlements.
  const ownSettlements = req.cells.filter(c => c.settlement === req.playerId);
  const neighborKeys = new Set<string>();
  for (const s of ownSettlements) {
    const dirs = [
      { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
      { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
    ];
    for (const d of dirs) {
      neighborKeys.add(`${s.q + d.q},${s.r + d.r}`);
    }
  }

  const adjacent = req.validPlacements.find(p => neighborKeys.has(`${p.q},${p.r}`));
  return { coord: adjacent ?? req.validPlacements[0] };
}

self.addEventListener('message', (event: MessageEvent) => {
  const { type, payload } = event.data as { type: string; payload: AIComputeRequest };
  if (type === 'COMPUTE_MOVE') {
    try {
      const result = computeMove(payload);
      self.postMessage({ type: 'MOVE_RESULT', payload: result });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: String(err) });
    }
  }
});

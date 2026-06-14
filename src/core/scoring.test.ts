import { describe, it, expect } from 'vitest';
import { Board } from './board';
import { Terrain, Location } from './terrain';
import {
  scoreCastle,
  scoreFisherman,
  scoreMiners,
  scoreKnights,
  scoreFarmers,
  scoreMerchants,
  scoreDiscoverers,
  scoreHermits,
  scoreCitizens,
  scoreLords,
  scoreWorkers,
  getConnectedGroups,
  calculatePlayerScore,
  selectObjectiveCards,
  scoreObjectiveCard,
  ObjectiveCard,
  ALL_OBJECTIVE_CARDS,
} from './scoring';

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function makeCell(
  q: number,
  r: number,
  terrain: Terrain,
  location?: Location,
  settlement?: number
) {
  return { coord: { q, r }, terrain, location, settlement };
}

// ────────────────────────────────────────────────────
// getConnectedGroups
// ────────────────────────────────────────────────────

describe('getConnectedGroups', () => {
  it('returns one group for a single settlement', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));

    const groups = getConnectedGroups(board, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(1);
  });

  it('groups adjacent settlements together', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    const groups = getConnectedGroups(board, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it('separates non-adjacent settlements into different groups', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));

    const groups = getConnectedGroups(board, 1);
    expect(groups).toHaveLength(2);
  });

  it('returns empty for player with no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 2));

    const groups = getConnectedGroups(board, 1);
    expect(groups).toHaveLength(0);
  });

  it('does not include other players settlements in the group', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 2)); // different player

    const groups = getConnectedGroups(board, 1);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(1);
  });
});

// ────────────────────────────────────────────────────
// scoreCastle (always-active castle scoring)
// ────────────────────────────────────────────────────

describe('scoreCastle', () => {
  it('gives 3 pts per settlement adjacent to a castle', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(0, 1, Terrain.Grass, undefined, 1));

    expect(scoreCastle(board, 1)).toBe(6);
  });

  it('returns 0 when no settlements are adjacent to castles', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));

    expect(scoreCastle(board, 1)).toBe(0);
  });

  it('counts each settlement only once even if adjacent to multiple castles', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(2, 0, Terrain.Grass, Location.Castle));
    // Settlement at (1,0) is adjacent to both castles but should count once per castle
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    // (1,0) is adjacent to both (0,0) and (2,0) castles → 3 × 2? No — each
    // settlement scores 3 pts if adjacent to ANY castle; multiple adjacencies
    // don't multiply. Let's verify the implementation:
    // The loop checks if any neighbor is a castle → one check per settlement.
    expect(scoreCastle(board, 1)).toBe(3);
  });
});

// ────────────────────────────────────────────────────
// Fisherman
// ────────────────────────────────────────────────────

describe('scoreFisherman', () => {
  it('gives 2 pts per group touching water', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Water));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // adjacent to water
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 1)); // connected to (1,0)

    expect(scoreFisherman(board, 1)).toBe(2); // one group, touches water
  });

  it('gives 0 when no settlements touch water', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));

    expect(scoreFisherman(board, 1)).toBe(0);
  });

  it('scores each group independently', () => {
    const board = new Board(10, 10);
    // Group 1 near water
    board.setCell(makeCell(0, 0, Terrain.Water));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    // Group 2 near water
    board.setCell(makeCell(5, 0, Terrain.Water));
    board.setCell(makeCell(6, 0, Terrain.Grass, undefined, 1));

    expect(scoreFisherman(board, 1)).toBe(4); // two groups, each worth 2
  });
});

// ────────────────────────────────────────────────────
// Miners
// ────────────────────────────────────────────────────

describe('scoreMiners', () => {
  it('gives 2 pts per settlement adjacent to mountain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Mountain));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(0, 1, Terrain.Grass, undefined, 1));

    expect(scoreMiners(board, 1)).toBe(4);
  });

  it('returns 0 when no settlements are adjacent to mountain', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));

    expect(scoreMiners(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// Knights (longest horizontal chain)
// ────────────────────────────────────────────────────

describe('scoreKnights', () => {
  it('scores the length of the longest horizontal run', () => {
    const board = new Board(10, 10);
    // Horizontal run of 3: q=2,3,4 at r=0
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(3, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(4, 0, Terrain.Grass, undefined, 1));
    // Isolated at a different row
    board.setCell(makeCell(0, 2, Terrain.Grass, undefined, 1));

    expect(scoreKnights(board, 1)).toBe(3);
  });

  it('returns 0 when player has no settlements', () => {
    const board = new Board(10, 10);
    expect(scoreKnights(board, 1)).toBe(0);
  });

  it('handles non-consecutive settlements in the same row', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 1)); // gap at q=1

    expect(scoreKnights(board, 1)).toBe(1); // longest chain = 1
  });
});

// ────────────────────────────────────────────────────
// Farmers (best quadrant)
// ────────────────────────────────────────────────────

describe('scoreFarmers', () => {
  it('returns the settlement count of the best quadrant', () => {
    const board = new Board(20, 20);
    // 3 settlements in NW quadrant (q<10, r<10)
    board.setCell(makeCell(1, 1, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 1, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(3, 1, Terrain.Grass, undefined, 1));
    // 1 settlement in NE quadrant
    board.setCell(makeCell(11, 1, Terrain.Grass, undefined, 1));

    expect(scoreFarmers(board, 1)).toBe(3);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(20, 20);
    expect(scoreFarmers(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// Merchants (unique terrain types)
// ────────────────────────────────────────────────────

describe('scoreMerchants', () => {
  it('counts unique terrain types among all settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Forest, undefined, 1));
    board.setCell(makeCell(2, 0, Terrain.Desert, undefined, 1));

    expect(scoreMerchants(board, 1)).toBe(3);
  });

  it('does not double-count the same terrain type', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    expect(scoreMerchants(board, 1)).toBe(1);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(10, 10);
    expect(scoreMerchants(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// Discoverers (distinct rows with settlements)
// ────────────────────────────────────────────────────

describe('scoreDiscoverers', () => {
  it('scores 1 per distinct row that contains at least one settlement', () => {
    const board = new Board(10, 10);
    // 3 distinct rows: r=0, r=3, r=7
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(2, 3, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 7, Terrain.Grass, undefined, 1));

    expect(scoreDiscoverers(board, 1)).toBe(3);
  });

  it('multiple settlements in the same row count only once', () => {
    const board = new Board(10, 10);
    // 2 settlements both at r=0, plus 1 at r=2 → 2 distinct rows
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(3, 2, Terrain.Grass, undefined, 1));

    expect(scoreDiscoverers(board, 1)).toBe(2);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(10, 10);
    expect(scoreDiscoverers(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// Hermits (isolated settlements)
// ────────────────────────────────────────────────────

describe('scoreHermits', () => {
  it('gives 3 pts per isolated settlement', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // isolated
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1)); // isolated

    expect(scoreHermits(board, 1)).toBe(6);
  });

  it('gives 0 to connected settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // adjacent

    expect(scoreHermits(board, 1)).toBe(0);
  });

  it('mixes isolated and connected correctly', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // isolated
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(6, 5, Terrain.Grass, undefined, 1)); // adjacent to (5,5)

    expect(scoreHermits(board, 1)).toBe(3); // only (0,0) is isolated
  });
});

// ────────────────────────────────────────────────────
// Citizens (same as castle scoring)
// ────────────────────────────────────────────────────

describe('scoreCitizens', () => {
  it('mirrors castle scoring', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    expect(scoreCitizens(board, 1)).toBe(scoreCastle(board, 1));
  });
});

// ────────────────────────────────────────────────────
// Lords (quadrant occupancy)
// ────────────────────────────────────────────────────

describe('scoreLords', () => {
  it('gives 3 pts per occupied quadrant', () => {
    const board = new Board(20, 20);
    // One settlement in each quadrant
    board.setCell(makeCell(1, 1, Terrain.Grass, undefined, 1));   // NW
    board.setCell(makeCell(11, 1, Terrain.Grass, undefined, 1));  // NE
    board.setCell(makeCell(1, 11, Terrain.Grass, undefined, 1));  // SW
    board.setCell(makeCell(11, 11, Terrain.Grass, undefined, 1)); // SE

    expect(scoreLords(board, 1)).toBe(12); // 4 × 3
  });

  it('scores partial quadrant occupation', () => {
    const board = new Board(20, 20);
    board.setCell(makeCell(1, 1, Terrain.Grass, undefined, 1));  // NW only

    expect(scoreLords(board, 1)).toBe(3);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(20, 20);
    expect(scoreLords(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// Workers (adjacent to any Location tile or Castle)
// ────────────────────────────────────────────────────

describe('scoreWorkers', () => {
  it('scores 1 for each settlement adjacent to a Location tile', () => {
    const board = new Board(10, 10);
    // Farm at (1,0); settlements at (0,0) and (2,0) are both adjacent
    board.setCell(makeCell(1, 0, Terrain.Grass, Location.Farm));
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1)); // adjacent to Farm
    board.setCell(makeCell(2, 0, Terrain.Grass, undefined, 1)); // adjacent to Farm

    expect(scoreWorkers(board, 1)).toBe(2);
  });

  it('scores 1 for each settlement adjacent to a Castle', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1)); // adjacent to Castle
    board.setCell(makeCell(0, 1, Terrain.Grass, undefined, 1)); // adjacent to Castle

    expect(scoreWorkers(board, 1)).toBe(2);
  });

  it('settlement not adjacent to any location scores 0', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1)); // isolated, no location nearby

    expect(scoreWorkers(board, 1)).toBe(0);
  });

  it('settlement adjacent to multiple locations still counts as 1', () => {
    const board = new Board(10, 10);
    // Two locations at (0,0) and (2,0), settlement at (1,0) adjacent to both
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(2, 0, Terrain.Grass, Location.Farm));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    expect(scoreWorkers(board, 1)).toBe(1);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    expect(scoreWorkers(board, 1)).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// scoreObjectiveCard dispatcher
// ────────────────────────────────────────────────────

describe('scoreObjectiveCard', () => {
  it('dispatches to the correct scoring function', () => {
    const board = new Board(10, 10);
    // Settlements at r=0 and r=5 → 2 distinct rows for Discoverers
    board.setCell(makeCell(0, 0, Terrain.Grass, undefined, 1));
    board.setCell(makeCell(5, 5, Terrain.Grass, undefined, 1));

    // Discoverers: 2 distinct rows → 2 pts
    expect(scoreObjectiveCard(ObjectiveCard.Discoverers, board, 1)).toBe(2);
    // Hermits: 2 isolated → 6 pts
    expect(scoreObjectiveCard(ObjectiveCard.Hermits, board, 1)).toBe(6);
  });
});

// ────────────────────────────────────────────────────
// calculatePlayerScore
// ────────────────────────────────────────────────────

describe('calculatePlayerScore', () => {
  it('sums castle score and objective card scores', () => {
    const board = new Board(10, 10);
    board.setCell(makeCell(0, 0, Terrain.Grass, Location.Castle));
    board.setCell(makeCell(1, 0, Terrain.Grass, undefined, 1));

    // Castle: 3 pts (settlement at (1,0) adjacent to Castle at (0,0))
    // Workers: 1 pt (settlement at (1,0) adjacent to Castle location)
    const total = calculatePlayerScore(board, 1, [ObjectiveCard.Workers]);
    expect(total).toBe(4);
  });

  it('returns 0 for player with no settlements', () => {
    const board = new Board(10, 10);
    const total = calculatePlayerScore(board, 1, [
      ObjectiveCard.Workers,
      ObjectiveCard.Hermits,
    ]);
    expect(total).toBe(0);
  });
});

// ────────────────────────────────────────────────────
// selectObjectiveCards
// ────────────────────────────────────────────────────

describe('selectObjectiveCards', () => {
  it('returns exactly 3 cards by default', () => {
    const cards = selectObjectiveCards();
    expect(cards).toHaveLength(3);
  });

  it('returns unique cards', () => {
    const cards = selectObjectiveCards();
    const unique = new Set(cards);
    expect(unique.size).toBe(3);
  });

  it('returns cards from the full set', () => {
    const cards = selectObjectiveCards();
    for (const card of cards) {
      expect(ALL_OBJECTIVE_CARDS).toContain(card);
    }
  });

  it('can select a custom count', () => {
    const cards = selectObjectiveCards(5);
    expect(cards).toHaveLength(5);
    expect(new Set(cards).size).toBe(5);
  });
});

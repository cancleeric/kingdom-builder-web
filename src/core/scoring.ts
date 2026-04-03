/**
 * Scoring system for Kingdom Builder
 *
 * Includes:
 * - Castle adjacency scoring (always applied, 3 pts per adjacent settlement)
 * - 10 objective cards (3 randomly selected per game)
 */

import { AxialCoord, hexNeighbors, hexToKey } from './hex';
import { Board } from './board';
import { Terrain, Location } from './terrain';

// ────────────────────────────────────────────────────
// Objective card definitions
// ────────────────────────────────────────────────────

export enum ObjectiveCard {
  Fisherman = 'Fisherman',
  Miners = 'Miners',
  Knights = 'Knights',
  Farmers = 'Farmers',
  Merchants = 'Merchants',
  Rangers = 'Rangers',
  Hermits = 'Hermits',
  Citizens = 'Citizens',
  Lords = 'Lords',
  Shepherds = 'Shepherds',
}

/** All available objective cards (10 total) */
export const ALL_OBJECTIVE_CARDS: ObjectiveCard[] = Object.values(ObjectiveCard);

// ────────────────────────────────────────────────────
// Helper: connected groups (BFS)
// ────────────────────────────────────────────────────

/**
 * Returns all connected groups of a player's settlements.
 * Each group is an array of AxialCoord where each cell has
 * the player's settlement and is adjacent to at least one other
 * cell in the group.
 */
export function getConnectedGroups(board: Board, playerId: number): AxialCoord[][] {
  const settlements = board.getPlayerSettlements(playerId);
  const visited = new Set<string>();
  const groups: AxialCoord[][] = [];

  for (const cell of settlements) {
    const key = hexToKey(cell.coord);
    if (visited.has(key)) continue;

    // BFS
    const group: AxialCoord[] = [];
    const queue: AxialCoord[] = [cell.coord];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      for (const neighbor of hexNeighbors(current)) {
        const nKey = hexToKey(neighbor);
        if (!visited.has(nKey)) {
          const nCell = board.getCell(neighbor);
          if (nCell?.settlement === playerId) {
            visited.add(nKey);
            queue.push(neighbor);
          }
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

// ────────────────────────────────────────────────────
// Helper: quadrant classification
// ────────────────────────────────────────────────────

/** Returns 0=NW, 1=NE, 2=SW, 3=SE for a given coordinate based on board dimensions */
export function getQuadrant(coord: AxialCoord, boardWidth: number = 20, boardHeight: number = 20): number {
  const midQ = boardWidth / 2;
  const midR = boardHeight / 2;
  const q = coord.q < midQ ? 0 : 1; // 0=west, 1=east
  const r = coord.r < midR ? 0 : 1; // 0=north, 1=south
  return r * 2 + q; // 0=NW,1=NE,2=SW,3=SE
}

// ────────────────────────────────────────────────────
// Castle scoring (always applied)
// ────────────────────────────────────────────────────

/**
 * Score settlements adjacent to Castle location hexes.
 * Each such settlement is worth 3 points.
 */
export function scoreCastle(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  let score = 0;

  for (const cell of settlements) {
    const adjacentToCastle = hexNeighbors(cell.coord).some(neighbor => {
      const nCell = board.getCell(neighbor);
      return nCell?.location === Location.Castle;
    });
    if (adjacentToCastle) score += 3;
  }

  return score;
}

// ────────────────────────────────────────────────────
// Objective card scoring functions
// ────────────────────────────────────────────────────

/**
 * Fisherman: Each connected group of settlements that is adjacent to
 * at least one Water cell scores 2 points.
 */
export function scoreFisherman(board: Board, playerId: number): number {
  const groups = getConnectedGroups(board, playerId);
  let score = 0;

  for (const group of groups) {
    const touchesWater = group.some(coord =>
      hexNeighbors(coord).some(neighbor => {
        const cell = board.getCell(neighbor);
        return cell?.terrain === Terrain.Water;
      })
    );
    if (touchesWater) score += 2;
  }

  return score;
}

/**
 * Miners: Each settlement adjacent to a Mountain cell scores 2 points.
 */
export function scoreMiners(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  let score = 0;

  for (const cell of settlements) {
    const adjacentToMountain = hexNeighbors(cell.coord).some(neighbor => {
      const nCell = board.getCell(neighbor);
      return nCell?.terrain === Terrain.Mountain;
    });
    if (adjacentToMountain) score += 2;
  }

  return score;
}

/**
 * Knights: The longest horizontal consecutive chain of settlements
 * (same r, consecutive q values) scores 1 point per settlement in the chain.
 */
export function scoreKnights(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  if (settlements.length === 0) return 0;

  // Group settlements by r coordinate
  const byRow = new Map<number, number[]>();
  for (const cell of settlements) {
    const row = byRow.get(cell.coord.r) ?? [];
    row.push(cell.coord.q);
    byRow.set(cell.coord.r, row);
  }

  let maxChain = 0;

  for (const qs of byRow.values()) {
    qs.sort((a, b) => a - b);
    let chain = 1;
    let best = 1;
    for (let i = 1; i < qs.length; i++) {
      if (qs[i] === qs[i - 1] + 1) {
        chain++;
        if (chain > best) best = chain;
      } else {
        chain = 1;
      }
    }
    if (best > maxChain) maxChain = best;
  }

  return maxChain;
}

/**
 * Farmers: The quadrant where the player has the most settlements
 * contributes 1 point per settlement in that quadrant.
 */
export function scoreFarmers(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  const counts = [0, 0, 0, 0];

  for (const cell of settlements) {
    counts[getQuadrant(cell.coord, board.width, board.height)]++;
  }

  return Math.max(...counts);
}

/**
 * Merchants: 1 point per unique terrain type among all the player's
 * settlement cells (the terrain the settlement is built on).
 */
export function scoreMerchants(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  const terrainTypes = new Set<Terrain>();

  for (const cell of settlements) {
    terrainTypes.add(cell.terrain);
  }

  return terrainTypes.size;
}

/**
 * Rangers: The longest vertical consecutive chain of settlements
 * (same q, consecutive r values) scores 1 point per settlement.
 */
export function scoreRangers(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  if (settlements.length === 0) return 0;

  // Group settlements by q coordinate
  const byCol = new Map<number, number[]>();
  for (const cell of settlements) {
    const col = byCol.get(cell.coord.q) ?? [];
    col.push(cell.coord.r);
    byCol.set(cell.coord.q, col);
  }

  let maxChain = 0;

  for (const rs of byCol.values()) {
    rs.sort((a, b) => a - b);
    let chain = 1;
    let best = 1;
    for (let i = 1; i < rs.length; i++) {
      if (rs[i] === rs[i - 1] + 1) {
        chain++;
        if (chain > best) best = chain;
      } else {
        chain = 1;
      }
    }
    if (best > maxChain) maxChain = best;
  }

  return maxChain;
}

/**
 * Hermits: Each isolated settlement (no adjacent settlement from the same player)
 * scores 3 points.
 */
export function scoreHermits(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  let score = 0;

  for (const cell of settlements) {
    const hasAdjacentFriend = hexNeighbors(cell.coord).some(neighbor => {
      const nCell = board.getCell(neighbor);
      return nCell?.settlement === playerId;
    });
    if (!hasAdjacentFriend) score += 3;
  }

  return score;
}

/**
 * Citizens: Each settlement adjacent to a Castle location hex scores 3 points.
 * (Same as the always-applied castle scoring, available as an objective card.)
 */
export function scoreCitizens(board: Board, playerId: number): number {
  return scoreCastle(board, playerId);
}

/**
 * Lords: Each quadrant (NW, NE, SW, SE) that contains at least 1 player
 * settlement scores 3 points.
 */
export function scoreLords(board: Board, playerId: number): number {
  const settlements = board.getPlayerSettlements(playerId);
  const occupiedQuadrants = new Set<number>();

  for (const cell of settlements) {
    occupiedQuadrants.add(getQuadrant(cell.coord, board.width, board.height));
  }

  return occupiedQuadrants.size * 3;
}

/**
 * Shepherds: Each connected group of settlements scores 3 points.
 */
export function scoreShepherds(board: Board, playerId: number): number {
  const groups = getConnectedGroups(board, playerId);
  return groups.length * 3;
}

// ────────────────────────────────────────────────────
// Score dispatcher
// ────────────────────────────────────────────────────

/**
 * Calculate the score for a specific objective card for a given player.
 */
export function scoreObjectiveCard(
  card: ObjectiveCard,
  board: Board,
  playerId: number
): number {
  switch (card) {
    case ObjectiveCard.Fisherman:  return scoreFisherman(board, playerId);
    case ObjectiveCard.Miners:     return scoreMiners(board, playerId);
    case ObjectiveCard.Knights:    return scoreKnights(board, playerId);
    case ObjectiveCard.Farmers:    return scoreFarmers(board, playerId);
    case ObjectiveCard.Merchants:  return scoreMerchants(board, playerId);
    case ObjectiveCard.Rangers:    return scoreRangers(board, playerId);
    case ObjectiveCard.Hermits:    return scoreHermits(board, playerId);
    case ObjectiveCard.Citizens:   return scoreCitizens(board, playerId);
    case ObjectiveCard.Lords:      return scoreLords(board, playerId);
    case ObjectiveCard.Shepherds:  return scoreShepherds(board, playerId);
  }
}

/**
 * Calculate the total score for a player given 3 objective cards.
 * Total = castle score + sum of 3 objective card scores.
 */
export function calculatePlayerScore(
  board: Board,
  playerId: number,
  objectiveCards: ObjectiveCard[]
): number {
  const castle = scoreCastle(board, playerId);
  const objectives = objectiveCards.reduce(
    (sum, card) => sum + scoreObjectiveCard(card, board, playerId),
    0
  );
  return castle + objectives;
}

/**
 * Randomly select 3 objective cards for a game.
 * @param count - number of cards to select
 * @param rng - optional seeded random number generator (defaults to Math.random)
 */
export function selectObjectiveCards(count: number = 3, rng: () => number = Math.random): ObjectiveCard[] {
  const shuffled = [...ALL_OBJECTIVE_CARDS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

import type { GameState, Cell, ObjectiveType } from '../types';
import { hexNeighbors, hexEqual } from './hex';

// Calculate score for a player
export function calculateScore(state: GameState, playerId: number): number {
  let score = 0;

  for (const objective of state.objectives) {
    score += scoreObjective(state, playerId, objective);
  }

  // Castle adjacency bonus: 3 points per settlement adjacent to a castle
  score += scoreCastleAdjacency(state, playerId);

  return score;
}

// Score castle adjacency: 3 points per settlement adjacent to a castle
export function scoreCastleAdjacency(state: GameState, playerId: number): number {
  const castles = state.cells.filter((c) => c.hasCastle);
  const playerCells = state.cells.filter((c) => c.owner === playerId);
  let score = 0;

  for (const castle of castles) {
    for (const cell of playerCells) {
      if (hexNeighbors(castle.hex).some((n) => hexEqual(n, cell.hex))) {
        score += 3;
      }
    }
  }

  return score;
}

// Score a single objective for a player
export function scoreObjective(
  state: GameState,
  playerId: number,
  objective: ObjectiveType
): number {
  const playerCells = state.cells.filter((c) => c.owner === playerId);

  switch (objective) {
    case 'fisherman':
      // 2 points for each connected group that touches water
      return scoreConnectedGroupsTouchingTerrain(state, playerId, 'water') * 2;

    case 'miner':
      // 2 points for each connected group that touches mountain
      return scoreConnectedGroupsTouchingTerrain(state, playerId, 'mountain') * 2;

    case 'knight':
      // 1 point for each settlement in the longest horizontal row
      return scoreLongestRow(playerCells);

    case 'lords':
      // 1 point per settlement in rows that the player has the most settlements in
      return scoreLords(state, playerId);

    case 'farmers':
      // 1 point per settlement adjacent to a grassland hex
      return scoreAdjacentToTerrain(state, playerId, 'grassland');

    case 'hermits':
      // 3 points for each isolated settlement (no neighbors owned by player)
      return scoreHermits(state, playerId) * 3;

    case 'merchants':
      // 1 point per location tile type collected by the player
      return state.players.find((p) => p.id === playerId)?.locationTiles.length ?? 0;

    case 'discoverers':
      // 1 point per quadrant that has at least one settlement
      return scoreDiscoverers(state, playerId);

    case 'builders':
      // 2 points per connected group of settlements
      return getConnectedGroups(state.cells, playerId).length * 2;

    case 'shepherds':
      // 1 point for each settlement on canyon terrain
      return playerCells.filter((c) => c.terrain === 'canyon').length;

    default:
      return 0;
  }
}

// Get connected groups of player's settlements
export function getConnectedGroups(cells: Cell[], playerId: number): Cell[][] {
  const playerCells = cells.filter((c) => c.owner === playerId);
  const visited = new Set<string>();
  const groups: Cell[][] = [];

  for (const cell of playerCells) {
    const key = `${cell.hex.q},${cell.hex.r}`;
    if (visited.has(key)) continue;

    const group: Cell[] = [];
    const queue = [cell];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currKey = `${curr.hex.q},${curr.hex.r}`;
      if (visited.has(currKey)) continue;
      visited.add(currKey);
      group.push(curr);

      for (const neighbor of hexNeighbors(curr.hex)) {
        const neighborCell = cells.find(
          (c) => c.owner === playerId && hexEqual(c.hex, neighbor)
        );
        if (neighborCell && !visited.has(`${neighbor.q},${neighbor.r}`)) {
          queue.push(neighborCell);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

// Score connected groups touching a given terrain
function scoreConnectedGroupsTouchingTerrain(
  state: GameState,
  playerId: number,
  terrain: string
): number {
  const groups = getConnectedGroups(state.cells, playerId);
  let count = 0;

  for (const group of groups) {
    const touches = group.some((cell) =>
      hexNeighbors(cell.hex).some((n) => {
        const nc = state.cells.find((c) => hexEqual(c.hex, n));
        return nc?.terrain === terrain;
      })
    );
    if (touches) count++;
  }

  return count;
}

// Score longest horizontal row for knight
function scoreLongestRow(playerCells: Cell[]): number {
  if (playerCells.length === 0) return 0;

  const rowMap = new Map<number, number[]>();
  for (const cell of playerCells) {
    const row = rowMap.get(cell.hex.r) ?? [];
    row.push(cell.hex.q);
    rowMap.set(cell.hex.r, row);
  }

  let maxLen = 0;
  for (const qs of rowMap.values()) {
    maxLen = Math.max(maxLen, qs.length);
  }

  return maxLen;
}

// Score lords: points for rows where player has most settlements
function scoreLords(state: GameState, playerId: number): number {
  const allRows = new Set(state.cells.map((c) => c.hex.r));
  let score = 0;

  for (const row of allRows) {
    const playerCount = state.cells.filter(
      (c) => c.owner === playerId && c.hex.r === row
    ).length;
    const maxByOther = Math.max(
      ...state.players
        .filter((p) => p.id !== playerId)
        .map((p) => state.cells.filter((c) => c.owner === p.id && c.hex.r === row).length),
      0
    );
    if (playerCount > maxByOther) {
      score += playerCount;
    }
  }

  return score;
}

// Score settlements adjacent to a terrain
function scoreAdjacentToTerrain(
  state: GameState,
  playerId: number,
  terrain: string
): number {
  const playerCells = state.cells.filter((c) => c.owner === playerId);
  let score = 0;

  for (const cell of playerCells) {
    if (
      hexNeighbors(cell.hex).some((n) => {
        const nc = state.cells.find((c) => hexEqual(c.hex, n));
        return nc?.terrain === terrain;
      })
    ) {
      score++;
    }
  }

  return score;
}

// Score hermits: isolated settlements
function scoreHermits(state: GameState, playerId: number): number {
  const playerCells = state.cells.filter((c) => c.owner === playerId);
  let count = 0;

  for (const cell of playerCells) {
    const isolated = !hexNeighbors(cell.hex).some((n) =>
      playerCells.some((p) => hexEqual(p.hex, n))
    );
    if (isolated) count++;
  }

  return count;
}

// Score discoverers: unique quadrants with settlements
function scoreDiscoverers(state: GameState, playerId: number): number {
  const playerCells = state.cells.filter((c) => c.owner === playerId);
  const quadrants = new Set<string>();

  for (const cell of playerCells) {
    const qid = `${Math.floor(cell.hex.q / 10)},${Math.floor(cell.hex.r / 10)}`;
    quadrants.add(qid);
  }

  return quadrants.size;
}

// Calculate incremental score gain for placing a settlement at a hex
export function calculateScoreGain(state: GameState, hex: { q: number; r: number }, playerId: number): number {
  const before = calculateScore(state, playerId);

  // Simulate placing on this hex
  const simulatedCells = state.cells.map((c) =>
    hexEqual(c.hex, hex) ? { ...c, owner: playerId } : c
  );
  const simulatedState = { ...state, cells: simulatedCells };
  const after = calculateScore(simulatedState, playerId);

  return after - before;
}

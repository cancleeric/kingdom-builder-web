/**
 * Location tile system for Kingdom Builder
 *
 * Each of the 8 special location types grants a tile with a special ability.
 * Tiles are acquired when a player places a settlement adjacent to the
 * location hex (each location can only be acquired once).
 *
 * Tile abilities (official rules). [Phase 1] = aligned to official in this PR;
 * [Phase 2 TODO] = still old behaviour, to be aligned next PR.
 *   Farm    – [Phase 1] place 1 extra settlement on a Grass cell (adjacent-if-possible)
 *   Oasis   – [Phase 1] place 1 extra settlement on a Desert cell (adjacent-if-possible)
 *   Tower   – [Phase 1] place 1 extra settlement on a board-edge cell (adjacent-if-possible)
 *   Oracle  – [Phase 1] place 1 extra settlement on the terrain shown on your terrain card (adjacent-if-possible)
 *   Tavern  – [Phase 1] place 1 extra settlement at the end of a horizontal row of ≥3 of your settlements
 *   Harbor  – [Phase 2 TODO] official: move 1 settlement onto a Water cell; currently still places near water
 *   Paddock – [Phase 2 TODO] official: move exactly 2 hexes in a straight line; currently moves ≤2 any direction
 *   Barn    – [Phase 2 TODO] official: move to terrain card's terrain; currently moves to settlement's own terrain
 */

import { AxialCoord, hexNeighbors, hexDistance, hexToKey } from './hex';
import { Board } from './board';
import { Terrain, Location, isBuildable } from './terrain';

// ────────────────────────────────────────────────────
// Tile acquisition
// ────────────────────────────────────────────────────

/**
 * After placing a settlement at `placedAt`, determine which location tiles
 * (excluding Castle) the player should now acquire.
 *
 * A tile is acquired when the placed settlement is adjacent to a location
 * hex AND that location has not yet been acquired by any player.
 *
 * @param board             Current board state
 * @param placedAt          The coordinate where the new settlement was placed
 * @param acquiredLocations Set of hex keys already acquired by any player
 * @returns Array of Location values newly acquired
 */
export function checkTileAcquisition(
  board: Board,
  placedAt: AxialCoord,
  acquiredLocations: Set<string>
): Location[] {
  const acquired: Location[] = [];

  for (const neighbor of hexNeighbors(placedAt)) {
    const cell = board.getCell(neighbor);
    if (
      cell?.location &&
      cell.location !== Location.Castle &&
      !acquiredLocations.has(hexToKey(neighbor))
    ) {
      acquired.push(cell.location);
    }
  }

  return acquired;
}

// ────────────────────────────────────────────────────
// Adjacent-if-possible helper (used by location tiles)
// ────────────────────────────────────────────────────

/**
 * Official rule: if any candidate cell is adjacent to the player's existing
 * settlements, return only those adjacent candidates; otherwise return all
 * candidates (fallback – never returns empty when candidates is non-empty).
 *
 * ⛔ This helper is ONLY for location tiles.
 *    Do NOT use it for the main placement (getValidPlacements).
 */
export function applyAdjacentIfPossible(
  board: Board,
  candidates: AxialCoord[],
  playerId: number
): AxialCoord[] {
  const playerSettlements = board.getPlayerSettlements(playerId);
  if (playerSettlements.length === 0) return candidates;

  // Build a set of coord-keys that are neighbours of any existing settlement
  const neighbourKeys = new Set<string>();
  for (const cell of playerSettlements) {
    for (const n of hexNeighbors(cell.coord)) {
      neighbourKeys.add(hexToKey(n));
    }
  }

  const adjacent = candidates.filter(c => neighbourKeys.has(hexToKey(c)));
  return adjacent.length > 0 ? adjacent : candidates;
}

// ────────────────────────────────────────────────────
// Tile ability: extra placement helpers
// ────────────────────────────────────────────────────

/**
 * Farm: Grass cells (adjacent-if-possible).
 */
export function getFarmPlacements(board: Board, playerId: number): AxialCoord[] {
  const candidates = board
    .getCellsByTerrain(Terrain.Grass)
    .filter(cell => cell.settlement === undefined)
    .map(cell => cell.coord);
  return applyAdjacentIfPossible(board, candidates, playerId);
}

/**
 * Harbor: any unoccupied buildable cell that is adjacent to at least one Water cell.
 */
export function getHarborPlacements(board: Board): AxialCoord[] {
  return board
    .getAllCells()
    .filter(cell =>
      isBuildable(cell.terrain) &&
      cell.settlement === undefined &&
      hexNeighbors(cell.coord).some(n => board.getCell(n)?.terrain === Terrain.Water)
    )
    .map(cell => cell.coord);
}

/**
 * Oasis: Desert cells (adjacent-if-possible).
 */
export function getOasisPlacements(board: Board, playerId: number): AxialCoord[] {
  const candidates = board
    .getCellsByTerrain(Terrain.Desert)
    .filter(cell => cell.settlement === undefined)
    .map(cell => cell.coord);
  return applyAdjacentIfPossible(board, candidates, playerId);
}

/**
 * Tower: board-edge cells only (any buildable terrain, adjacent-if-possible).
 * A cell is on the board edge if at least one hex neighbour lies outside the
 * map (i.e. board.getCell returns undefined for that neighbour).
 * ⛔ The old "adjacent to Mountain" condition has been removed per official rules.
 */
export function getTowerPlacements(board: Board, playerId: number): AxialCoord[] {
  const candidates = board
    .getAllCells()
    .filter(cell => {
      if (!isBuildable(cell.terrain) || cell.settlement !== undefined) return false;
      // Board edge = at least one neighbour is outside the map
      return hexNeighbors(cell.coord).some(n => !board.getCell(n));
    })
    .map(cell => cell.coord);
  return applyAdjacentIfPossible(board, candidates, playerId);
}

/**
 * Oracle: cells matching the terrain on the current terrain card
 * (adjacent-if-possible).
 *
 * @param currentTerrain  The terrain shown on the drawn terrain card this turn.
 */
export function getOraclePlacements(
  board: Board,
  playerId: number,
  currentTerrain: Terrain
): AxialCoord[] {
  const candidates = board
    .getCellsByTerrain(currentTerrain)
    .filter(cell => cell.settlement === undefined && isBuildable(cell.terrain))
    .map(cell => cell.coord);
  return applyAdjacentIfPossible(board, candidates, playerId);
}

/**
 * Tavern: the cell immediately beyond each end of every horizontal run
 * (same r, consecutive q) of the player's settlements, where the run has
 * at least 3 settlements.
 *
 * Official rule: only a run of ≥3 consecutive settlements qualifies.
 * Only cells that exist on the board, are buildable, and are unoccupied qualify.
 */
export function getTavernPlacements(board: Board, playerId: number): AxialCoord[] {
  const settlements = board.getPlayerSettlements(playerId);
  if (settlements.length === 0) return [];

  // Group by row (r value)
  const byRow = new Map<number, number[]>();
  for (const cell of settlements) {
    const row = byRow.get(cell.coord.r) ?? [];
    row.push(cell.coord.q);
    byRow.set(cell.coord.r, row);
  }

  const result = new Set<string>();

  for (const [rStr, qs] of byRow.entries()) {
    const r = Number(rStr);
    qs.sort((a, b) => a - b);

    // Find consecutive runs within this row
    let runStart = 0;
    for (let i = 0; i <= qs.length; i++) {
      const isEnd = i === qs.length || (i > 0 && qs[i] !== qs[i - 1] + 1);
      if (isEnd && i > 0) {
        // run is qs[runStart..i-1]
        const runLength = i - runStart;
        if (runLength >= 3) {
          // Official rule: only runs of ≥3 consecutive settlements qualify
          const qMin = qs[runStart];
          const qMax = qs[i - 1];

          for (const candidate of [{ q: qMin - 1, r }, { q: qMax + 1, r }]) {
            const cell = board.getCell(candidate);
            if (cell && isBuildable(cell.terrain) && cell.settlement === undefined) {
              result.add(hexToKey(candidate));
            }
          }
        }

        runStart = i;
      }
    }
  }

  return Array.from(result).map(key => {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
  });
}

/**
 * Get valid extra-placement positions for a placement-type tile.
 * Returns an empty array for movement tiles (Paddock, Barn).
 *
 * @param currentTerrain  Required for Oracle (the terrain shown on the drawn
 *                        terrain card).  Ignored by other placement tiles.
 */
export function getExtraPlacementPositions(
  location: Location,
  board: Board,
  playerId: number,
  currentTerrain?: Terrain
): AxialCoord[] {
  switch (location) {
    case Location.Farm:    return getFarmPlacements(board, playerId);
    case Location.Harbor:  return getHarborPlacements(board);
    case Location.Oasis:   return getOasisPlacements(board, playerId);
    case Location.Tower:   return getTowerPlacements(board, playerId);
    case Location.Oracle:
      if (currentTerrain === undefined) return [];
      return getOraclePlacements(board, playerId, currentTerrain);
    case Location.Tavern:  return getTavernPlacements(board, playerId);
    default:               return [];
  }
}

// ────────────────────────────────────────────────────
// Tile ability: movement helpers
// ────────────────────────────────────────────────────

/**
 * For a given settlement position, return all cells the settlement
 * can be moved to for the Paddock tile (up to 2 hexes away, any buildable
 * unoccupied cell, must be a different cell).
 */
export function getPaddockDestinations(
  board: Board,
  from: AxialCoord
): AxialCoord[] {
  const fromCell = board.getCell(from);
  if (!fromCell) return [];

  return board
    .getAllCells()
    .filter(cell =>
      isBuildable(cell.terrain) &&
      cell.settlement === undefined &&
      hexDistance(from, cell.coord) > 0 &&
      hexDistance(from, cell.coord) <= 2
    )
    .map(cell => cell.coord);
}

/**
 * For a given settlement position, return all cells the settlement can be
 * moved to for the Barn tile (any unoccupied cell with the same terrain type,
 * anywhere on the board).
 */
export function getBarnDestinations(board: Board, from: AxialCoord): AxialCoord[] {
  const fromCell = board.getCell(from);
  if (!fromCell) return [];
  const terrain = fromCell.terrain;

  return board
    .getCellsByTerrain(terrain)
    .filter(cell => cell.settlement === undefined)
    .map(cell => cell.coord);
}

/**
 * Returns all valid moves for a movement tile (Paddock or Barn).
 * Each entry describes one source settlement and its possible destinations.
 */
export function getMovementOptions(
  location: Location,
  board: Board,
  playerId: number
): { from: AxialCoord; destinations: AxialCoord[] }[] {
  const playerSettlements = board.getPlayerSettlements(playerId);
  const options: { from: AxialCoord; destinations: AxialCoord[] }[] = [];

  for (const cell of playerSettlements) {
    let destinations: AxialCoord[];

    if (location === Location.Paddock) {
      destinations = getPaddockDestinations(board, cell.coord);
    } else if (location === Location.Barn) {
      destinations = getBarnDestinations(board, cell.coord);
    } else {
      continue;
    }

    if (destinations.length > 0) {
      options.push({ from: cell.coord, destinations });
    }
  }

  return options;
}

/**
 * Execute a movement tile action: move a player's settlement from `from` to `to`.
 * Validates the move is legal before executing.
 * Returns true on success, false if the move is invalid.
 */
export function executeMoveTile(
  location: Location,
  board: Board,
  playerId: number,
  from: AxialCoord,
  to: AxialCoord
): boolean {
  const fromCell = board.getCell(from);
  const toCell = board.getCell(to);

  if (!fromCell || fromCell.settlement !== playerId) return false;
  if (!toCell || toCell.settlement !== undefined) return false;
  if (!isBuildable(toCell.terrain)) return false;

  let valid = false;
  if (location === Location.Paddock) {
    const dist = hexDistance(from, to);
    valid = dist > 0 && dist <= 2;
  } else if (location === Location.Barn) {
    valid = fromCell.terrain === toCell.terrain;
  }

  if (!valid) return false;

  fromCell.settlement = undefined;
  toCell.settlement = playerId;
  return true;
}

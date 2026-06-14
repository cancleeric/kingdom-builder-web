/**
 * Location tile system for Kingdom Builder
 *
 * Each of the 8 special location types grants a tile with a special ability.
 * Tiles are acquired when a player places a settlement adjacent to the
 * location hex (each location can only be acquired once).
 *
 * Tile abilities (official rules). [Phase 1] = aligned to official in Phase 1 PR;
 * [Phase 2] = aligned to official in this PR.
 *   Farm    – [Phase 1] place 1 extra settlement on a Grass cell (adjacent-if-possible)
 *   Oasis   – [Phase 1] place 1 extra settlement on a Desert cell (adjacent-if-possible)
 *   Tower   – [Phase 1] place 1 extra settlement on a board-edge cell (adjacent-if-possible)
 *   Oracle  – [Phase 1] place 1 extra settlement on the terrain shown on your terrain card (adjacent-if-possible)
 *   Tavern  – [Phase 1] place 1 extra settlement at the end of a horizontal row of ≥3 of your settlements
 *   Harbor  – [Phase 2] move 1 existing settlement onto a Water cell (adjacent-if-possible to your other settlements; bypasses isBuildable)
 *   Paddock – [Phase 2] move exactly 2 hexes in one of the 6 straight hex directions (can jump over occupied cells)
 *   Barn    – [Phase 2] move 1 settlement to the terrain of the current terrain card (adjacent-if-possible)
 */

import { AxialCoord, hexNeighbors, hexToKey, HEX_DIRECTIONS } from './hex';
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
 * @deprecated Harbor is now a movement tile (Phase 2). This function is no longer
 * called by getExtraPlacementPositions or any active code path. Kept for backwards
 * compatibility with external callers / old tests only.
 *
 * Harbor (old, incorrect): any unoccupied buildable cell adjacent to at least one Water cell.
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
 * Harbor (Phase 2, official): Returns all unoccupied Water cells the player can
 * move a settlement onto.  Any Water cell that is unoccupied is valid as a
 * destination (isBuildable is intentionally NOT checked — Water is the only
 * terrain that bypasses that gate).
 *
 * adjacent-if-possible is applied AFTER computing destinations, using a virtual
 * "from" exclusion: we consider the player's settlements excluding the one being
 * moved.  In practice getMovementOptions handles the per-from iteration, and
 * applyAdjacentIfPossible is called per `from` with a temporary board view.
 *
 * @param board     Current board state
 * @param from      The settlement being moved (used only to exclude it from
 *                  the adjacency check — the source cell will be vacated)
 * @param playerId  The moving player (for adjacent-if-possible)
 */
export function getHarborDestinations(
  board: Board,
  from: AxialCoord,
  playerId: number
): AxialCoord[] {
  const fromKey = hexToKey(from);

  // All unoccupied Water cells (bypasses isBuildable)
  const candidates = board
    .getCellsByTerrain(Terrain.Water)
    .filter(cell => cell.settlement === undefined)
    .map(cell => cell.coord);

  if (candidates.length === 0) return [];

  // Build adjacency set from player settlements, excluding the `from` cell
  // (since it will be vacated once moved)
  const playerSettlements = board
    .getPlayerSettlements(playerId)
    .filter(cell => hexToKey(cell.coord) !== fromKey);

  if (playerSettlements.length === 0) {
    // No other settlements → no adjacency constraint, return all Water candidates
    return candidates;
  }

  const neighbourKeys = new Set<string>();
  for (const cell of playerSettlements) {
    for (const n of hexNeighbors(cell.coord)) {
      neighbourKeys.add(hexToKey(n));
    }
  }

  const adjacent = candidates.filter(c => neighbourKeys.has(hexToKey(c)));
  return adjacent.length > 0 ? adjacent : candidates;
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
 * Returns an empty array for movement tiles (Harbor, Paddock, Barn).
 *
 * Harbor is now a movement tile (Phase 2) and therefore no longer appears here.
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
    case Location.Oasis:   return getOasisPlacements(board, playerId);
    case Location.Tower:   return getTowerPlacements(board, playerId);
    case Location.Oracle:
      if (currentTerrain === undefined) return [];
      return getOraclePlacements(board, playerId, currentTerrain);
    case Location.Tavern:  return getTavernPlacements(board, playerId);
    // Harbor, Paddock, Barn are movement tiles → return empty
    default:               return [];
  }
}

// ────────────────────────────────────────────────────
// Tile ability: movement helpers
// ────────────────────────────────────────────────────

/**
 * Paddock (Phase 2, official): For a given settlement position, return all cells
 * the settlement can be moved to.  The settlement moves exactly 2 hexes in one
 * of the 6 straight hex directions (jumping over any occupied intermediate cell).
 *
 * Only destinations that exist on the board, are buildable, and are unoccupied
 * are returned.
 */
export function getPaddockDestinations(
  board: Board,
  from: AxialCoord
): AxialCoord[] {
  const fromCell = board.getCell(from);
  if (!fromCell) return [];

  const destinations: AxialCoord[] = [];

  for (const dir of HEX_DIRECTIONS) {
    const dest: AxialCoord = { q: from.q + dir.q * 2, r: from.r + dir.r * 2 };
    const destCell = board.getCell(dest);
    if (destCell && isBuildable(destCell.terrain) && destCell.settlement === undefined) {
      destinations.push(dest);
    }
  }

  return destinations;
}

/**
 * Barn (Phase 2, official): For a given settlement position, return all cells
 * the settlement can be moved to.  The destination terrain must match the
 * **current terrain card** (not the settlement's own terrain).
 *
 * adjacent-if-possible is applied so that destinations adjacent to the player's
 * other settlements are preferred.
 *
 * @param board           Current board state
 * @param from            The settlement being moved
 * @param currentTerrain  The terrain shown on the current terrain card
 * @param playerId        The moving player (for adjacent-if-possible)
 */
export function getBarnDestinations(
  board: Board,
  from: AxialCoord,
  currentTerrain: Terrain,
  playerId: number
): AxialCoord[] {
  const fromCell = board.getCell(from);
  if (!fromCell) return [];

  const candidates = board
    .getCellsByTerrain(currentTerrain)
    .filter(cell => cell.settlement === undefined && hexToKey(cell.coord) !== hexToKey(from))
    .map(cell => cell.coord);

  return applyAdjacentIfPossible(board, candidates, playerId);
}

/**
 * Returns all valid moves for a movement tile (Harbor, Paddock, or Barn).
 * Each entry describes one source settlement and its possible destinations.
 *
 * @param location        The tile being activated
 * @param board           Current board state
 * @param playerId        The moving player
 * @param currentTerrain  Required for Barn (terrain card terrain); ignored by others
 */
export function getMovementOptions(
  location: Location,
  board: Board,
  playerId: number,
  currentTerrain?: Terrain
): { from: AxialCoord; destinations: AxialCoord[] }[] {
  const playerSettlements = board.getPlayerSettlements(playerId);
  const options: { from: AxialCoord; destinations: AxialCoord[] }[] = [];

  for (const cell of playerSettlements) {
    let destinations: AxialCoord[];

    if (location === Location.Harbor) {
      destinations = getHarborDestinations(board, cell.coord, playerId);
    } else if (location === Location.Paddock) {
      destinations = getPaddockDestinations(board, cell.coord);
    } else if (location === Location.Barn) {
      if (currentTerrain === undefined) continue;
      destinations = getBarnDestinations(board, cell.coord, currentTerrain, playerId);
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
 *
 * @param location        The tile being activated
 * @param board           Current board state
 * @param playerId        The moving player
 * @param from            Source cell (must have player's settlement)
 * @param to              Destination cell
 * @param currentTerrain  Required for Barn validation (terrain card terrain)
 */
export function executeMoveTile(
  location: Location,
  board: Board,
  playerId: number,
  from: AxialCoord,
  to: AxialCoord,
  currentTerrain?: Terrain
): boolean {
  const fromCell = board.getCell(from);
  const toCell = board.getCell(to);

  if (!fromCell || fromCell.settlement !== playerId) return false;
  if (!toCell || toCell.settlement !== undefined) return false;

  let valid = false;

  if (location === Location.Harbor) {
    // Harbor bypasses isBuildable — destination must be a Water cell
    valid = toCell.terrain === Terrain.Water;
  } else if (location === Location.Paddock) {
    // Must be buildable
    if (!isBuildable(toCell.terrain)) return false;
    // Exactly 2 steps in one straight hex direction
    valid = HEX_DIRECTIONS.some(
      dir => to.q === from.q + dir.q * 2 && to.r === from.r + dir.r * 2
    );
  } else if (location === Location.Barn) {
    // Must be buildable
    if (!isBuildable(toCell.terrain)) return false;
    // Destination terrain must match the current terrain card
    if (currentTerrain === undefined) return false;
    valid = toCell.terrain === currentTerrain;
  }

  if (!valid) return false;

  fromCell.settlement = undefined;
  toCell.settlement = playerId;
  return true;
}

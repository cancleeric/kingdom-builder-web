/**
 * Kingdom Builder — pure-function move implementations for the engine adapter.
 *
 * Every function here is a `MoveFn<KingdomG>`:
 *   (state: KingdomG, ctx: GameContext, payload?: unknown) => KingdomG
 *
 * ⛔ MUST NOT mutate the incoming `state` or any nested object on it.
 *    Always return a NEW KingdomG with structural sharing where the object
 *    was not modified, and a new reference where it was.
 *
 * Board clone semantics:
 *   `Board.cells` is a `Map<string, HexCell>`.  HexCell is a mutable object
 *   (its `settlement` field is written by Board.placeSettlement).  A correct
 *   immutable copy therefore requires:
 *     1. A new Board instance (same width/height).
 *     2. A new Map whose VALUES are shallow-copied HexCell objects.
 *     3. Forwarded `meta` reference (read-only for replay; not mutated here).
 */

import type { GameContext } from '@hd/game-kit/engine';
import { Board } from '../core/board';
import type { AxialCoord } from '../core/hex';
import { hexToKey, hexEquals } from '../core/hex';
import { Location, isBuildable, drawCard, shuffleDeck, createTerrainDeck } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import {
  getExtraPlacementPositions,
  getMovementOptions,
} from '../core/location';
import { GamePhase } from '../types';
import type { Player } from '../types';
import type { UndoSnapshot } from '../types/history';
import type { KingdomG } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Deep-copy a Board: each HexCell is shallow-cloned so mutations to the copy
 * cannot bleed back into the original.
 */
function cloneBoard(board: Board): Board {
  const nb = new Board(board.width, board.height);
  nb.cells = new Map(
    Array.from(board.cells.entries()).map(([k, v]) => [k, { ...v }])
  );
  if (board.meta) nb.meta = board.meta; // meta is read-only; safe to share
  return nb;
}

/** Shallow-clone a Player (deep-clone `settlements`, `tiles` arrays). */
function clonePlayer(p: Player): Player {
  return {
    ...p,
    settlements: [...p.settlements],
    tiles: p.tiles.map(t => ({ ...t })),
  };
}

/** Clone the players array, returning a new array with fresh Player objects. */
function clonePlayers(players: Player[]): Player[] {
  return players.map(clonePlayer);
}

/**
 * After placing a settlement, check adjacent hexes for unclaimed Location
 * tiles and append them to the player's tiles list.
 * Mutates the NEW cloned player and returns updated acquiredLocations arrays.
 */
function applyTileAcquisition(
  board: Board,
  coord: AxialCoord,
  player: Player,
  acquiredLocations: string[]
): {
  updatedAcquiredLocations: string[];
  acquiredLocationKeys: string[];
  acquiredTileLocs: Location[];
} {
  const updated = [...acquiredLocations];
  const acquiredSet = new Set(updated);
  const acquiredLocationKeys: string[] = [];
  const acquiredTileLocs: Location[] = [];

  const neighbors: AxialCoord[] = [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q,     r: coord.r + 1 },
    { q: coord.q,     r: coord.r - 1 },
    { q: coord.q + 1, r: coord.r - 1 },
    { q: coord.q - 1, r: coord.r + 1 },
  ];

  for (const neighbor of neighbors) {
    const cell = board.getCell(neighbor);
    const key = hexToKey(neighbor);
    if (
      cell?.location &&
      cell.location !== Location.Castle &&
      !acquiredSet.has(key)
    ) {
      updated.push(key);
      acquiredSet.add(key);
      acquiredLocationKeys.push(key);
      acquiredTileLocs.push(cell.location);
      player.tiles.push({ location: cell.location, usedThisTurn: false });
    }
  }

  return { updatedAcquiredLocations: updated, acquiredLocationKeys, acquiredTileLocs };
}

/** Reset tile-related state fields to their neutral values. */
function resetTileFields() {
  return {
    activeTile: null as Location | null,
    tileMoveSources: [] as AxialCoord[],
    tileMoveFrom: null as AxialCoord | null,
    tileMoveDestinations: [] as AxialCoord[],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: drawTerrainCard
// ────────────────────────────────────────────────────────────────────────────

/**
 * Draw the top terrain card from the deck.
 * Phase: DrawCard → PlaceSettlements (or EndTurn if no valid placements exist).
 */
export function drawTerrainCard(G: KingdomG, _ctx: GameContext): KingdomG {
  if (G.phase !== GamePhase.DrawCard) {
    throw new Error('drawTerrainCard: not in DrawCard phase');
  }

  let deckResult = drawCard(G.deck);
  let deck = deckResult.remainingDeck;
  let card = deckResult.card;

  if (!card) {
    const fresh = shuffleDeck(createTerrainDeck());
    const refill = drawCard(fresh);
    card = refill.card;
    deck = refill.remainingDeck;
  }

  const currentPlayer = G.players[G.currentPlayerIndex];
  const validCount = card
    ? getValidPlacements(G.board, card.terrain, currentPlayer.id, []).length
    : 0;

  const nextPhase = validCount === 0
    ? GamePhase.EndTurn
    : GamePhase.PlaceSettlements;

  return {
    ...G,
    currentTerrainCard: card,
    deck,
    phase: nextPhase,
    remainingPlacements: 3,
    placementsThisTurn: [],
    undoStack: [],
    canUndo: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: placeSettlement
// ────────────────────────────────────────────────────────────────────────────

/**
 * Place a settlement at `payload` (AxialCoord).
 * Throws on invalid placement so the engine records ok:false.
 * Phase: stays in PlaceSettlements or → EndTurn when done.
 */
export function placeSettlement(
  G: KingdomG,
  _ctx: GameContext,
  payload?: unknown
): KingdomG {
  if (G.phase !== GamePhase.PlaceSettlements) {
    throw new Error('placeSettlement: not in PlaceSettlements phase');
  }
  if (!G.currentTerrainCard) {
    throw new Error('placeSettlement: no terrain card drawn');
  }

  const coord = payload as AxialCoord;
  if (typeof coord?.q !== 'number' || typeof coord?.r !== 'number') {
    throw new Error('placeSettlement: payload must be AxialCoord { q, r }');
  }

  const currentPlayer = G.players[G.currentPlayerIndex];

  const validCoords = getValidPlacements(
    G.board,
    G.currentTerrainCard.terrain,
    currentPlayer.id,
    G.placementsThisTurn
  );
  if (!validCoords.some(v => hexEquals(v, coord))) {
    throw new Error(`placeSettlement: invalid placement at ${coord.q},${coord.r}`);
  }

  // Clone board and place settlement on the copy
  const newBoard = cloneBoard(G.board);
  const cell = newBoard.getCell(coord);
  if (!cell || cell.settlement !== undefined) {
    throw new Error('placeSettlement: cell not available');
  }
  cell.settlement = currentPlayer.id;

  // Clone players; mutate only the current player's copy
  const newPlayers = clonePlayers(G.players);
  const newCurrentPlayer = newPlayers[G.currentPlayerIndex];
  newCurrentPlayer.settlements.push(coord);
  newCurrentPlayer.remainingSettlements--;

  const updatedPlacementsThisTurn = [...G.placementsThisTurn, coord];

  const { updatedAcquiredLocations, acquiredLocationKeys, acquiredTileLocs } =
    applyTileAcquisition(newBoard, coord, newCurrentPlayer, G.acquiredLocations);

  const snapshot: UndoSnapshot = {
    type: 'PLACE_SETTLEMENT',
    coord,
    previousRemainingPlacements: G.remainingPlacements,
    previousPhase: G.phase,
    acquiredLocationKeys,
    acquiredTileLocs,
    previousPlacementsThisTurn: G.placementsThisTurn,
  };

  const newRemaining = G.remainingPlacements - 1;
  const enableUndo = G.gameOptions.enableUndo;

  if (newRemaining === 0) {
    return {
      ...G,
      board: newBoard,
      players: newPlayers,
      remainingPlacements: 0,
      phase: GamePhase.EndTurn,
      placementsThisTurn: updatedPlacementsThisTurn,
      acquiredLocations: updatedAcquiredLocations,
      undoStack: [...G.undoStack, snapshot],
      canUndo: enableUndo,
      ...resetTileFields(),
    };
  }

  // Check if next valid placements exist
  const nextValid = getValidPlacements(
    newBoard,
    G.currentTerrainCard.terrain,
    currentPlayer.id,
    updatedPlacementsThisTurn
  );

  if (nextValid.length === 0) {
    return {
      ...G,
      board: newBoard,
      players: newPlayers,
      remainingPlacements: newRemaining,
      phase: GamePhase.EndTurn,
      placementsThisTurn: updatedPlacementsThisTurn,
      acquiredLocations: updatedAcquiredLocations,
      undoStack: [...G.undoStack, snapshot],
      canUndo: enableUndo,
      ...resetTileFields(),
    };
  }

  return {
    ...G,
    board: newBoard,
    players: newPlayers,
    remainingPlacements: newRemaining,
    placementsThisTurn: updatedPlacementsThisTurn,
    acquiredLocations: updatedAcquiredLocations,
    undoStack: [...G.undoStack, snapshot],
    canUndo: enableUndo,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: endTurn
// ────────────────────────────────────────────────────────────────────────────

/**
 * End the current player's turn.
 * Phase: EndTurn → DrawCard (for next player), or → GameOver.
 */
export function endTurn(G: KingdomG, _ctx: GameContext): KingdomG {
  if (G.phase !== GamePhase.EndTurn) {
    throw new Error('endTurn: not in EndTurn phase');
  }

  const nextPlayerIndex = (G.currentPlayerIndex + 1) % G.players.length;
  const nextTurnNumber = G.turnNumber + 1;

  // Reset tile usage on all players
  const newPlayers = clonePlayers(G.players);
  for (const p of newPlayers) {
    for (const t of p.tiles) {
      t.usedThisTurn = false;
    }
  }

  // Check game-over conditions
  const boardFull = !G.board.getAllCells().some(
    cell => isBuildable(cell.terrain) && cell.settlement === undefined
  );
  const anyEmpty = G.players.some(p => p.remainingSettlements <= 0);

  if (anyEmpty || boardFull) {
    return {
      ...G,
      players: newPlayers,
      phase: GamePhase.GameOver,
      currentPlayerIndex: nextPlayerIndex,
      currentTerrainCard: null,
      turnNumber: nextTurnNumber,
      canUndo: false,
      undoStack: [],
      ...resetTileFields(),
    };
  }

  return {
    ...G,
    players: newPlayers,
    currentPlayerIndex: nextPlayerIndex,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    turnNumber: nextTurnNumber,
    canUndo: false,
    undoStack: [],
    ...resetTileFields(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: activateTile
// ────────────────────────────────────────────────────────────────────────────

/**
 * Activate a location tile ability.
 * payload: Location (string enum value)
 */
export function activateTile(
  G: KingdomG,
  _ctx: GameContext,
  payload?: unknown
): KingdomG {
  const location = payload as Location;
  if (!Object.values(Location).includes(location)) {
    throw new Error(`activateTile: invalid location "${String(payload)}"`);
  }

  const currentPlayer = G.players[G.currentPlayerIndex];
  const tile = currentPlayer.tiles.find(
    t => t.location === location && !t.usedThisTurn
  );
  if (!tile) {
    throw new Error(`activateTile: player has no unused tile for location "${location}"`);
  }

  const isMovementTile =
    location === Location.Harbor ||
    location === Location.Paddock ||
    location === Location.Barn;

  if (isMovementTile) {
    const options = getMovementOptions(
      location,
      G.board,
      currentPlayer.id,
      G.currentTerrainCard?.terrain
    );
    return {
      ...G,
      activeTile: location,
      tileMoveSources: options.map(o => o.from),
      tileMoveFrom: null,
      tileMoveDestinations: [],
    };
  }

  // Placement-type tile: we set activeTile so applyTilePlacement knows which
  // tile is active; the valid coords are computed fresh inside applyTilePlacement.
  return {
    ...G,
    activeTile: location,
    tileMoveSources: [],
    tileMoveFrom: null,
    tileMoveDestinations: [],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: cancelTile
// ────────────────────────────────────────────────────────────────────────────

/** Cancel an active tile activation. */
export function cancelTile(G: KingdomG, _ctx: GameContext): KingdomG {
  return {
    ...G,
    ...resetTileFields(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: applyTilePlacement
// ────────────────────────────────────────────────────────────────────────────

/**
 * Place a settlement via a placement-type tile (Farm, Oasis, Tower, Oracle, Tavern).
 * payload: AxialCoord
 */
export function applyTilePlacement(
  G: KingdomG,
  _ctx: GameContext,
  payload?: unknown
): KingdomG {
  if (!G.activeTile) {
    throw new Error('applyTilePlacement: no tile activated');
  }

  const coord = payload as AxialCoord;
  if (typeof coord?.q !== 'number' || typeof coord?.r !== 'number') {
    throw new Error('applyTilePlacement: payload must be AxialCoord { q, r }');
  }

  const currentPlayer = G.players[G.currentPlayerIndex];
  const tileLocation = G.activeTile;

  // Validate the coord is a valid placement for this tile
  const validCoords = getExtraPlacementPositions(
    tileLocation,
    G.board,
    currentPlayer.id,
    G.currentTerrainCard?.terrain
  );
  const isValid = validCoords.some(v => v.q === coord.q && v.r === coord.r);
  if (!isValid) {
    throw new Error(
      `applyTilePlacement: coord ${coord.q},${coord.r} not valid for tile ${tileLocation}`
    );
  }

  // Clone board and place
  const newBoard = cloneBoard(G.board);
  const cell = newBoard.getCell(coord);
  if (!cell || cell.settlement !== undefined) {
    throw new Error('applyTilePlacement: cell not available');
  }
  cell.settlement = currentPlayer.id;

  const newPlayers = clonePlayers(G.players);
  const newCurrentPlayer = newPlayers[G.currentPlayerIndex];
  newCurrentPlayer.settlements.push(coord);
  newCurrentPlayer.remainingSettlements--;

  // Mark tile as used
  const tileIdx = newCurrentPlayer.tiles.findIndex(
    t => t.location === tileLocation && !t.usedThisTurn
  );
  if (tileIdx !== -1) {
    newCurrentPlayer.tiles[tileIdx] = {
      ...newCurrentPlayer.tiles[tileIdx],
      usedThisTurn: true,
    };
  }

  const { updatedAcquiredLocations, acquiredLocationKeys, acquiredTileLocs } =
    applyTileAcquisition(newBoard, coord, newCurrentPlayer, G.acquiredLocations);

  const snapshot: UndoSnapshot = {
    type: 'TILE_PLACEMENT',
    coord,
    previousRemainingPlacements: G.remainingPlacements,
    previousPhase: G.phase,
    acquiredLocationKeys,
    acquiredTileLocs,
    tileUsed: tileLocation,
    tileUsedIndex: tileIdx !== -1 ? tileIdx : undefined,
    previousPlacementsThisTurn: G.placementsThisTurn,
  };

  return {
    ...G,
    board: newBoard,
    players: newPlayers,
    acquiredLocations: updatedAcquiredLocations,
    undoStack: [...G.undoStack, snapshot],
    canUndo: G.gameOptions.enableUndo,
    ...resetTileFields(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: selectTileMoveSource
// ────────────────────────────────────────────────────────────────────────────

/**
 * Select the settlement to move (movement-type tiles: Harbor, Paddock, Barn).
 * payload: AxialCoord (the settlement's current position)
 */
export function selectTileMoveSource(
  G: KingdomG,
  _ctx: GameContext,
  payload?: unknown
): KingdomG {
  if (!G.activeTile) {
    throw new Error('selectTileMoveSource: no tile activated');
  }

  const from = payload as AxialCoord;
  if (typeof from?.q !== 'number' || typeof from?.r !== 'number') {
    throw new Error('selectTileMoveSource: payload must be AxialCoord { q, r }');
  }

  const currentPlayer = G.players[G.currentPlayerIndex];
  const options = getMovementOptions(
    G.activeTile,
    G.board,
    currentPlayer.id,
    G.currentTerrainCard?.terrain
  );
  const option = options.find(o => o.from.q === from.q && o.from.r === from.r);
  if (!option) {
    throw new Error(`selectTileMoveSource: no valid move from ${from.q},${from.r}`);
  }

  return {
    ...G,
    tileMoveFrom: from,
    tileMoveDestinations: option.destinations,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: applyTileMove
// ────────────────────────────────────────────────────────────────────────────

/**
 * Execute a movement tile: move settlement from tileMoveFrom to payload coord.
 * payload: AxialCoord (destination)
 */
export function applyTileMove(
  G: KingdomG,
  _ctx: GameContext,
  payload?: unknown
): KingdomG {
  if (!G.activeTile || !G.tileMoveFrom) {
    throw new Error('applyTileMove: no tile activated or no source selected');
  }

  const to = payload as AxialCoord;
  if (typeof to?.q !== 'number' || typeof to?.r !== 'number') {
    throw new Error('applyTileMove: payload must be AxialCoord { q, r }');
  }

  const fromCoord = G.tileMoveFrom;
  const tileLocation = G.activeTile;
  const currentPlayer = G.players[G.currentPlayerIndex];

  // Validate destination
  const isValidDest = G.tileMoveDestinations.some(d => d.q === to.q && d.r === to.r);
  if (!isValidDest) {
    throw new Error(`applyTileMove: destination ${to.q},${to.r} is not valid`);
  }

  // Clone board and execute move
  const newBoard = cloneBoard(G.board);
  const fromCell = newBoard.getCell(fromCoord);
  const toCell = newBoard.getCell(to);

  if (!fromCell || fromCell.settlement !== currentPlayer.id) {
    throw new Error('applyTileMove: source cell does not have player settlement');
  }
  if (!toCell || toCell.settlement !== undefined) {
    throw new Error('applyTileMove: destination cell not available');
  }

  fromCell.settlement = undefined;
  toCell.settlement = currentPlayer.id;

  const newPlayers = clonePlayers(G.players);
  const newCurrentPlayer = newPlayers[G.currentPlayerIndex];

  // Update settlements array
  const fromKey = hexToKey(fromCoord);
  const idx = newCurrentPlayer.settlements.findIndex(s => hexToKey(s) === fromKey);
  if (idx !== -1) {
    newCurrentPlayer.settlements = [
      ...newCurrentPlayer.settlements.slice(0, idx),
      to,
      ...newCurrentPlayer.settlements.slice(idx + 1),
    ];
  }

  // Mark tile as used
  const tileIdx = newCurrentPlayer.tiles.findIndex(
    t => t.location === tileLocation && !t.usedThisTurn
  );
  if (tileIdx !== -1) {
    newCurrentPlayer.tiles[tileIdx] = {
      ...newCurrentPlayer.tiles[tileIdx],
      usedThisTurn: true,
    };
  }

  const snapshot: UndoSnapshot = {
    type: 'TILE_MOVE',
    fromCoord,
    toCoord: to,
    previousRemainingPlacements: G.remainingPlacements,
    previousPhase: G.phase,
    acquiredLocationKeys: [],
    acquiredTileLocs: [],
    tileUsed: tileLocation,
    tileUsedIndex: tileIdx !== -1 ? tileIdx : undefined,
    movedSettlementIdx: idx !== -1 ? idx : undefined,
    previousPlacementsThisTurn: G.placementsThisTurn,
  };

  return {
    ...G,
    board: newBoard,
    players: newPlayers,
    undoStack: [...G.undoStack, snapshot],
    canUndo: G.gameOptions.enableUndo,
    ...resetTileFields(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Move: undoLastAction
// ────────────────────────────────────────────────────────────────────────────

/** Undo the most recent undoable action this turn. */
export function undoLastAction(G: KingdomG, _ctx: GameContext): KingdomG {
  if (!G.canUndo || G.undoStack.length === 0) {
    throw new Error('undoLastAction: no action to undo');
  }

  const snap = G.undoStack[G.undoStack.length - 1];
  const newStack = G.undoStack.slice(0, -1);
  const enableUndo = G.gameOptions.enableUndo;

  if (snap.type === 'PLACE_SETTLEMENT' && snap.coord) {
    const newBoard = cloneBoard(G.board);
    const cell = newBoard.getCell(snap.coord);
    if (cell) cell.settlement = undefined;

    const coordKey = hexToKey(snap.coord);
    const newPlayers = clonePlayers(G.players);
    const currentPlayer = newPlayers[G.currentPlayerIndex];
    currentPlayer.settlements = currentPlayer.settlements.filter(
      s => hexToKey(s) !== coordKey
    );
    currentPlayer.remainingSettlements++;

    if (snap.acquiredTileLocs.length > 0) {
      currentPlayer.tiles = currentPlayer.tiles.slice(
        0,
        currentPlayer.tiles.length - snap.acquiredTileLocs.length
      );
    }

    const restoredAcquired = G.acquiredLocations.filter(
      key => !snap.acquiredLocationKeys.includes(key)
    );
    const restoredPlacementsThisTurn =
      snap.previousPlacementsThisTurn ?? G.placementsThisTurn.slice(0, -1);

    return {
      ...G,
      board: newBoard,
      players: newPlayers,
      remainingPlacements: snap.previousRemainingPlacements,
      phase: snap.previousPhase,
      acquiredLocations: restoredAcquired,
      placementsThisTurn: restoredPlacementsThisTurn,
      undoStack: newStack,
      canUndo: enableUndo && newStack.length > 0,
    };
  }

  if (snap.type === 'TILE_PLACEMENT' && snap.coord) {
    const newBoard = cloneBoard(G.board);
    const cell = newBoard.getCell(snap.coord);
    if (cell) cell.settlement = undefined;

    const coordKey = hexToKey(snap.coord);
    const newPlayers = clonePlayers(G.players);
    const currentPlayer = newPlayers[G.currentPlayerIndex];
    currentPlayer.settlements = currentPlayer.settlements.filter(
      s => hexToKey(s) !== coordKey
    );
    currentPlayer.remainingSettlements++;

    if (snap.tileUsed) {
      const usedTile =
        snap.tileUsedIndex !== undefined
          ? currentPlayer.tiles[snap.tileUsedIndex]
          : currentPlayer.tiles.find(t => t.location === snap.tileUsed);
      if (usedTile) usedTile.usedThisTurn = false;
    }

    if (snap.acquiredTileLocs.length > 0) {
      currentPlayer.tiles = currentPlayer.tiles.slice(
        0,
        currentPlayer.tiles.length - snap.acquiredTileLocs.length
      );
    }

    const restoredAcquired = G.acquiredLocations.filter(
      key => !snap.acquiredLocationKeys.includes(key)
    );
    const restoredPlacementsThisTurn =
      snap.previousPlacementsThisTurn ?? G.placementsThisTurn;

    return {
      ...G,
      board: newBoard,
      players: newPlayers,
      remainingPlacements: snap.previousRemainingPlacements,
      phase: snap.previousPhase,
      acquiredLocations: restoredAcquired,
      placementsThisTurn: restoredPlacementsThisTurn,
      undoStack: newStack,
      canUndo: enableUndo && newStack.length > 0,
      ...resetTileFields(),
    };
  }

  if (snap.type === 'TILE_MOVE' && snap.fromCoord && snap.toCoord) {
    const newBoard = cloneBoard(G.board);
    const toCell = newBoard.getCell(snap.toCoord);
    if (toCell) toCell.settlement = undefined;
    const fromCell = newBoard.getCell(snap.fromCoord);

    const newPlayers = clonePlayers(G.players);
    const currentPlayer = newPlayers[G.currentPlayerIndex];
    if (fromCell) fromCell.settlement = currentPlayer.id;

    if (snap.movedSettlementIdx !== undefined) {
      currentPlayer.settlements = [
        ...currentPlayer.settlements.slice(0, snap.movedSettlementIdx),
        snap.fromCoord,
        ...currentPlayer.settlements.slice(snap.movedSettlementIdx + 1),
      ];
    }

    if (snap.tileUsed) {
      const usedTile =
        snap.tileUsedIndex !== undefined
          ? currentPlayer.tiles[snap.tileUsedIndex]
          : currentPlayer.tiles.find(t => t.location === snap.tileUsed);
      if (usedTile) usedTile.usedThisTurn = false;
    }

    const restoredPlacementsThisTurn =
      snap.previousPlacementsThisTurn ?? G.placementsThisTurn;

    return {
      ...G,
      board: newBoard,
      players: newPlayers,
      remainingPlacements: snap.previousRemainingPlacements,
      phase: snap.previousPhase,
      placementsThisTurn: restoredPlacementsThisTurn,
      undoStack: newStack,
      canUndo: enableUndo && newStack.length > 0,
      ...resetTileFields(),
    };
  }

  throw new Error(`undoLastAction: unknown snapshot type "${snap.type}"`);
}

import type { Cell, Hex, TerrainType, GameState, LocationTileType } from '../types';
import { hexNeighbors, hexEqual } from './hex';

// Non-buildable terrain types
export const NON_BUILDABLE: TerrainType[] = ['mountain', 'water'];

// Find cell by hex position
export function findCell(cells: Cell[], hex: Hex): Cell | undefined {
  return cells.find((c) => hexEqual(c.hex, hex));
}

// Get all valid placement hexes for the current player given a terrain type
export function getValidPlacements(state: GameState): Hex[] {
  const { cells, currentPlayer, currentTerrain } = state;
  if (!currentTerrain) return [];

  const terrain = currentTerrain;
  const playerCells = cells.filter((c) => c.owner === currentPlayer);

  // Buildable cells of the current terrain that are empty
  const terrainCells = cells.filter(
    (c) => c.terrain === terrain && c.owner === null && !NON_BUILDABLE.includes(c.terrain)
  );

  if (playerCells.length === 0) {
    // No restrictions, can place on any matching terrain
    return terrainCells.map((c) => c.hex);
  }

  // Must be adjacent to an existing settlement if possible
  const adjacentToPlayer = terrainCells.filter((c) =>
    hexNeighbors(c.hex).some((n) =>
      playerCells.some((p) => hexEqual(p.hex, n))
    )
  );

  if (adjacentToPlayer.length > 0) {
    return adjacentToPlayer.map((c) => c.hex);
  }

  // If no adjacent cells of the terrain, can place anywhere on that terrain
  return terrainCells.map((c) => c.hex);
}

// Check if a placement is valid
export function isValidPlacement(state: GameState, hex: Hex): boolean {
  const valid = getValidPlacements(state);
  return valid.some((h) => hexEqual(h, hex));
}

// Apply a placement to a copy of the state (immutable)
export function applyPlacement(state: GameState, hex: Hex): GameState {
  const cells = state.cells.map((c) => {
    if (!hexEqual(c.hex, hex)) return c;
    return { ...c, owner: state.currentPlayer };
  });

  // Check if placing on a location tile grants it
  const cell = findCell(cells, hex);
  let players = state.players;
  if (cell?.hasLocationTile && !cell.locationTileClaimed) {
    const tile = cell.hasLocationTile as LocationTileType;
    // Check adjacency: does any neighbor of the new placement belong to this player?
    // Actually in Kingdom Builder: placing next to a location tile grants it
    // We check if any neighbor of the location tile cell belongs to the player
    const tileCell = cells.find((c) => hexEqual(c.hex, hex));
    if (tileCell && tileCell.hasLocationTile) {
      players = players.map((p) =>
        p.id === state.currentPlayer
          ? { ...p, locationTiles: [...p.locationTiles, tile] }
          : p
      );
      cells[cells.indexOf(tileCell)] = { ...tileCell, locationTileClaimed: true };
    }
  }

  // Check if adjacent to unclaimed location tile
  const updatedCells = cells.map((c) => {
    if (!hexEqual(c.hex, hex)) {
      // Check if this is an unclaimed location tile adjacent to the new placement
      if (
        c.hasLocationTile &&
        !c.locationTileClaimed &&
        hexNeighbors(hex).some((n) => hexEqual(n, c.hex))
      ) {
        const tile = c.hasLocationTile;
        players = players.map((p) =>
          p.id === state.currentPlayer && !p.locationTiles.includes(tile)
            ? { ...p, locationTiles: [...p.locationTiles, tile] }
            : p
        );
        return { ...c, locationTileClaimed: true };
      }
      return c;
    }
    return { ...c, owner: state.currentPlayer };
  });

  const placementsThisTurn = state.placementsThisTurn + 1;
  return {
    ...state,
    cells: updatedCells,
    players,
    placementsThisTurn,
  };
}

// Draw next terrain card
export function drawTerrain(state: GameState): GameState {
  if (state.terrainDeck.length === 0) {
    // Reshuffle (use all buildable types)
    const deck = shuffleDeck(buildTerrainDeck());
    return { ...state, terrainDeck: deck.slice(1), currentTerrain: deck[0] };
  }
  const [next, ...rest] = state.terrainDeck;
  return { ...state, currentTerrain: next, terrainDeck: rest };
}

// Build a terrain deck (5 copies of each buildable terrain)
export function buildTerrainDeck(): TerrainType[] {
  const buildable: TerrainType[] = ['grassland', 'forest', 'desert', 'flower', 'canyon'];
  const deck: TerrainType[] = [];
  for (const t of buildable) {
    for (let i = 0; i < 5; i++) deck.push(t);
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck<T>(deck: T[]): T[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Advance to next player's turn
export function advanceTurn(state: GameState): GameState {
  const nextPlayer = (state.currentPlayer + 1) % state.players.length;
  return {
    ...state,
    currentPlayer: nextPlayer,
    placementsThisTurn: 0,
    currentTerrain: null,
  };
}

// Build board cells for a standard game (20x20 area, 4 quadrants)
export function buildStandardBoard(seed?: number): Cell[] {
  // Use a seeded approach for quadrant arrangement
  const quadrantLayouts = getQuadrantLayouts(seed);
  const cells: Cell[] = [];

  // Place 4 quadrants in a 2x2 arrangement
  const quadrantOffsets: Hex[] = [
    { q: 0, r: 0 },    // top-left
    { q: 10, r: 0 },   // top-right
    { q: 0, r: 10 },   // bottom-left
    { q: 10, r: 10 },  // bottom-right
  ];

  for (let qi = 0; qi < 4; qi++) {
    const layout = quadrantLayouts[qi];
    const offset = quadrantOffsets[qi];
    for (const cell of layout) {
      cells.push({
        ...cell,
        hex: { q: cell.hex.q + offset.q, r: cell.hex.r + offset.r },
      });
    }
  }

  return cells;
}

// Generate quadrant layouts (10x10 hex grids)
function getQuadrantLayouts(seed?: number): Cell[][] {
  // We'll create 4 different quadrant types and shuffle them
  const templates = [
    buildQuadrant('grassland', 'forest', seed),
    buildQuadrant('desert', 'flower', seed ? seed + 1 : undefined),
    buildQuadrant('forest', 'canyon', seed ? seed + 2 : undefined),
    buildQuadrant('canyon', 'grassland', seed ? seed + 3 : undefined),
  ];

  if (seed !== undefined) {
    // Deterministic shuffle using seed
    return deterministicShuffle(templates, seed);
  }

  const indices = shuffleDeck([0, 1, 2, 3]);
  return indices.map((i) => templates[i]);
}

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build a 10x10 quadrant with given primary and secondary terrain
function buildQuadrant(
  primary: TerrainType,
  secondary: TerrainType,
  seed?: number
): Cell[] {
  const cells: Cell[] = [];
  const rng = makeRng(seed ?? Math.random() * 1000);

  for (let q = 0; q < 10; q++) {
    for (let r = 0; r < 10; r++) {
      // Skip some hexes based on hex grid shape (rectangular region)
      // Place mountain/water in some areas, locations in corners
      let terrain: TerrainType;
      const roll = rng();

      if (q === 0 && r === 0) {
        terrain = 'water'; // corner water
      } else if (q >= 8 && r >= 8) {
        terrain = 'mountain'; // corner mountain
      } else if (roll < 0.1) {
        terrain = 'water';
      } else if (roll < 0.2) {
        terrain = 'mountain';
      } else if (roll < 0.5) {
        terrain = primary;
      } else if (roll < 0.8) {
        terrain = secondary;
      } else {
        // Mix in other terrains
        const others: TerrainType[] = ['grassland', 'forest', 'desert', 'flower', 'canyon'];
        terrain = others[Math.floor(rng() * others.length)];
      }

      const hasCastle = q === 5 && r === 5; // Center castle
      const hasLocationTile = getLocationTile(q, r, rng);

      cells.push({
        hex: { q, r },
        terrain,
        owner: null,
        hasCastle,
        hasLocationTile,
        locationTileClaimed: false,
      });
    }
  }

  return cells;
}

function getLocationTile(_q: number, _r: number, rng: () => number): LocationTileType | null {
  // Place location tiles at some positions (5% chance)
  const tiles: LocationTileType[] = [
    'farm', 'harbor', 'temple', 'tower', 'oracle', 'oasis', 'tavern', 'barn',
  ];
  if (rng() < 0.05) {
    return tiles[Math.floor(rng() * tiles.length)];
  }
  return null;
}

// Simple LCG random number generator
function makeRng(seed: number): () => number {
  let s = Math.floor(seed) || 42;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

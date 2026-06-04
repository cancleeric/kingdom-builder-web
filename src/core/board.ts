import { AxialCoord, hexToKey } from './hex';
import { Terrain, Location, isBuildable } from './terrain';
import { HexCell, BoardSize } from '../types';
import {
  QUADRANT_TEMPLATES,
  QuadrantInstance,
  QuadrantRotation,
  expandAndRotateTemplate,
} from './quadrants';
import { setGlobalSeed, getRandom } from '../utils/seededRandom';

// ────────────────────────────────────────────────────────────────
// BoardMeta — stored for seed replay (does NOT affect gameplay)
// ────────────────────────────────────────────────────────────────

export interface BoardMeta {
  mapSeed: number;
  quadrantInstances: QuadrantInstance[]; // [NW, NE, SW, SE]
}

/**
 * Board class managing the hex grid
 */
export class Board {
  public cells: Map<string, HexCell>;
  public readonly width: number;
  public readonly height: number;
  /** Optional generation metadata — used for seed replay only, not gameplay */
  public meta?: BoardMeta;

  constructor(width: number = 20, height: number = 20) {
    this.width = width;
    this.height = height;
    this.cells = new Map();
  }

  /**
   * Set a cell on the board
   */
  setCell(cell: HexCell): void {
    const key = hexToKey(cell.coord);
    this.cells.set(key, cell);
  }

  /**
   * Get a cell from the board
   */
  getCell(coord: AxialCoord): HexCell | undefined {
    const key = hexToKey(coord);
    return this.cells.get(key);
  }

  /**
   * Check if a coordinate is on the board
   */
  hasCell(coord: AxialCoord): boolean {
    const key = hexToKey(coord);
    return this.cells.has(key);
  }

  /**
   * Get all cells on the board
   */
  getAllCells(): HexCell[] {
    return Array.from(this.cells.values());
  }

  /**
   * Place a settlement on a cell
   */
  placeSettlement(coord: AxialCoord, playerId: number): boolean {
    const cell = this.getCell(coord);
    if (!cell || cell.settlement !== undefined) {
      return false;
    }

    cell.settlement = playerId;
    return true;
  }

  /**
   * Check if a cell has a settlement
   */
  hasSettlement(coord: AxialCoord): boolean {
    const cell = this.getCell(coord);
    return cell?.settlement !== undefined;
  }

  /**
   * Get settlement owner at a coordinate
   */
  getSettlement(coord: AxialCoord): number | undefined {
    return this.getCell(coord)?.settlement;
  }

  /**
   * Get all cells with a specific terrain type
   */
  getCellsByTerrain(terrain: Terrain): HexCell[] {
    return this.getAllCells().filter(cell => cell.terrain === terrain);
  }

  /**
   * Get all cells with settlements from a specific player
   */
  getPlayerSettlements(playerId: number): HexCell[] {
    return this.getAllCells().filter(cell => cell.settlement === playerId);
  }
}

/**
 * Serialize a board to a plain object (for JSON persistence).
 * meta is included as an optional field for seed replay; its absence does
 * not affect deserialization (old saves remain fully compatible).
 */
export function serializeBoard(board: Board): {
  width: number;
  height: number;
  cells: [string, HexCell][];
  meta?: BoardMeta;
} {
  return {
    width: board.width,
    height: board.height,
    cells: Array.from(board.cells.entries()),
    ...(board.meta ? { meta: board.meta } : {}),
  };
}

/**
 * Deserialize a board from a plain object.
 * Works with both old saves (no meta) and new saves (with meta).
 */
export function deserializeBoard(data: {
  width: number;
  height: number;
  cells: [string, HexCell][];
  meta?: BoardMeta;
}): Board {
  const board = new Board(data.width, data.height);
  board.cells = new Map(data.cells);
  if (data.meta) board.meta = data.meta;
  return board;
}

// ────────────────────────────────────────────────────────────────
// createModularBoard — R39 modular quadrant map
// ────────────────────────────────────────────────────────────────

/** 8 location types distributed evenly across the 4×2 slots, shuffled per game. */
const ALL_LOCATION_TYPES: Location[] = [
  Location.Farm,
  Location.Harbor,
  Location.Oasis,
  Location.Tower,
  Location.Paddock,
  Location.Barn,
  Location.Oracle,
  Location.Tavern,
];

/** Fisher-Yates shuffle using the global seeded RNG. */
function seededShuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(getRandom() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Validate that the assembled board is playable. */
function validateBoardPlayability(board: Board): boolean {
  const cells = board.getAllCells();

  // 1. Sufficient buildable cells (2 players × 40 settlements)
  const buildable = cells.filter((c) => isBuildable(c.terrain));
  if (buildable.length < 200) return false;

  // 2. Each buildable terrain >= 5 cells
  const buildableTerrains = [
    Terrain.Grass,
    Terrain.Forest,
    Terrain.Desert,
    Terrain.Flower,
    Terrain.Canyon,
  ];
  for (const t of buildableTerrains) {
    if (cells.filter((c) => c.terrain === t).length < 5) return false;
  }

  // 3. Exactly 4 castles present
  const castles = cells.filter((c) => c.location === Location.Castle);
  if (castles.length !== 4) return false;

  // 4. Each castle in a different quadrant (NW/NE/SW/SE)
  const castleQuadrants = new Set(
    castles.map(
      (c) =>
        `${c.coord.q < 10 ? 'W' : 'E'}${c.coord.r < 10 ? 'N' : 'S'}`,
    ),
  );
  if (castleQuadrants.size !== 4) return false;

  // 5. All 8 non-castle location types present
  const locationTypes = new Set(
    cells
      .filter((c) => c.location && c.location !== Location.Castle)
      .map((c) => c.location),
  );
  if (locationTypes.size !== 8) return false;

  return true;
}

/**
 * Create a modular 20×20 board by randomly selecting 4 quadrant templates
 * from the 8 available, rotating each, and assembling them.
 *
 * Location assignment uses method (b): after assembly, all 8 location types
 * are shuffled and assigned to the 8 slots (2 per quadrant) — guaranteeing
 * every game has all 8 location abilities but in different positions.
 *
 * @param options.seed  Deterministic seed for replay. If omitted, uses Date.now().
 */
export function createModularBoard(options?: { seed?: number }): Board {
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const seed = (options?.seed ?? Date.now()) + attempt;
    setGlobalSeed(seed);

    // 1. Shuffle templates and pick first 4
    const shuffledTemplates = seededShuffle(QUADRANT_TEMPLATES);
    const chosen = shuffledTemplates.slice(0, 4);

    // 2. Pick random rotations for each chosen quadrant
    const rotations: QuadrantRotation[] = chosen.map(
      () => Math.floor(getRandom() * 4) as QuadrantRotation,
    );

    // 3. Shuffle all 8 location types for slot assignment
    const shuffledLocations = seededShuffle(ALL_LOCATION_TYPES);

    // 4. Assemble board
    const board = new Board(20, 20);

    const quadrantOffsets = [
      { offsetQ: 0, offsetR: 0 },   // NW
      { offsetQ: 10, offsetR: 0 },  // NE
      { offsetQ: 0, offsetR: 10 },  // SW
      { offsetQ: 10, offsetR: 10 }, // SE
    ];

    const instances: QuadrantInstance[] = [];

    for (let qi = 0; qi < 4; qi++) {
      const template = chosen[qi];
      const rotation = rotations[qi];
      const { offsetQ, offsetR } = quadrantOffsets[qi];

      instances.push({ templateId: template.id, rotation });

      const { cells, castle, locationSlots } = expandAndRotateTemplate(
        template,
        rotation,
      );

      // Place terrain cells
      for (const c of cells) {
        const coord: AxialCoord = { q: c.q + offsetQ, r: c.r + offsetR };
        const cell: HexCell = { coord, terrain: c.terrain, settlement: undefined };
        board.setCell(cell);
      }

      // Place castle
      const castleCoord: AxialCoord = {
        q: castle.q + offsetQ,
        r: castle.r + offsetR,
      };
      const castleCell = board.getCell(castleCoord);
      if (castleCell) {
        castleCell.location = Location.Castle;
        // Castles must be buildable — override Mountain if template placed castle on Mountain
        if (!isBuildable(castleCell.terrain)) {
          castleCell.terrain = Terrain.Grass;
        }
      }

      // Place the 2 location slots for this quadrant (method b: assigned from shuffled list).
      // We intentionally allow overwriting non-Castle locations to guarantee all 8 types appear.
      const slotCoords = [locationSlots[0], locationSlots[1]];
      for (let si = 0; si < 2; si++) {
        const locType = shuffledLocations[qi * 2 + si];
        const slotCoord: AxialCoord = {
          q: slotCoords[si].q + offsetQ,
          r: slotCoords[si].r + offsetR,
        };
        const slotCell = board.getCell(slotCoord);
        // Do not overwrite a Castle, but overwrite any other existing location or empty
        if (slotCell && slotCell.location !== Location.Castle) {
          slotCell.location = locType;
          // Location tiles must be on buildable terrain
          if (!isBuildable(slotCell.terrain)) {
            slotCell.terrain = Terrain.Grass;
          }
        }
      }
    }

    // 5. Validate playability
    if (validateBoardPlayability(board)) {
      board.meta = { mapSeed: seed, quadrantInstances: instances };
      return board;
    }
  }

  // If all retries exhausted, fall back to createBoardForSize('large') as safety net
  // (should not happen with well-designed templates)
  console.warn('[createModularBoard] All retries exhausted, falling back to static board');
  return createBoardForSize('large');
}

/**
 * Create a default board with a simple configuration
 * This creates a basic quadrant-based layout
 */
export function createDefaultBoard(): Board {
  const board = new Board(20, 20);

  // Create a simple pattern for testing
  // Using offset coordinates that work well for display
  for (let q = 0; q < 20; q++) {
    for (let r = 0; r < 20; r++) {
      const coord: AxialCoord = { q, r };

      // Determine terrain based on position
      let terrain: Terrain;

      // Border mountains
      if (q === 0 || r === 0 || q === 19 || r === 19) {
        terrain = Terrain.Mountain;
      }
      // Water bodies
      else if ((q === 5 && r >= 5 && r <= 10) || (q === 14 && r >= 9 && r <= 14)) {
        terrain = Terrain.Water;
      }
      // Quadrant-based terrains
      else if (q < 10 && r < 10) {
        // Northwest quadrant - mostly grass and forest
        terrain = (q + r) % 3 === 0 ? Terrain.Forest : Terrain.Grass;
      }
      else if (q >= 10 && r < 10) {
        // Northeast quadrant - desert and canyon
        terrain = (q + r) % 3 === 0 ? Terrain.Canyon : Terrain.Desert;
      }
      else if (q < 10 && r >= 10) {
        // Southwest quadrant - flower and grass
        terrain = (q + r) % 3 === 0 ? Terrain.Flower : Terrain.Grass;
      }
      else {
        // Southeast quadrant - mixed
        terrain = [Terrain.Grass, Terrain.Forest, Terrain.Desert, Terrain.Flower, Terrain.Canyon][(q + r) % 5];
      }

      const cell: HexCell = {
        coord,
        terrain,
        settlement: undefined,
      };

      // Add location tiles at strategic positions
      // Castles at the four quadrant corners
      if ((q === 3 && r === 3) || (q === 16 && r === 3) || (q === 3 && r === 16) || (q === 16 && r === 16)) {
        cell.location = Location.Castle;
      }
      // Location tiles spread across the board
      else if (q === 7 && r === 7) cell.location = Location.Farm;
      else if (q === 6 && r === 6) cell.location = Location.Harbor;
      else if (q === 14 && r === 5) cell.location = Location.Oasis;
      else if (q === 9 && r === 4) cell.location = Location.Tower;
      else if (q === 8 && r === 12) cell.location = Location.Paddock;
      else if (q === 13 && r === 13) cell.location = Location.Barn;
      else if (q === 4 && r === 13) cell.location = Location.Oracle;
      else if (q === 15 && r === 8) cell.location = Location.Tavern;

      board.setCell(cell);
    }
  }

  return board;
}

/**
 * Create a board from quadrant configurations
 * Each quadrant is 10x10
 */
export function createBoardFromQuadrants(
  nw: Terrain[][],
  ne: Terrain[][],
  sw: Terrain[][],
  se: Terrain[][]
): Board {
  const board = new Board(20, 20);

  const quadrants = [
    { data: nw, offsetQ: 0, offsetR: 0 },
    { data: ne, offsetQ: 10, offsetR: 0 },
    { data: sw, offsetQ: 0, offsetR: 10 },
    { data: se, offsetQ: 10, offsetR: 10 },
  ];

  quadrants.forEach(({ data, offsetQ, offsetR }) => {
    for (let q = 0; q < 10; q++) {
      for (let r = 0; r < 10; r++) {
        const coord: AxialCoord = { q: q + offsetQ, r: r + offsetR };
        const terrain = data[r]?.[q] || Terrain.Grass;

        const cell: HexCell = {
          coord,
          terrain,
          settlement: undefined,
        };

        board.setCell(cell);
      }
    }
  });

  return board;
}

const BOARD_SIZE_MAP: Record<BoardSize, number> = {
  small: 12,
  medium: 16,
  large: 20,
};

/**
 * Create a board scaled to the requested size preset.
 * - small  → 12×12
 * - medium → 16×16
 * - large  → 20×20 (same layout as createDefaultBoard)
 */
export function createBoardForSize(boardSize: BoardSize = 'large'): Board {
  const size = BOARD_SIZE_MAP[boardSize];
  const board = new Board(size, size);
  const last = size - 1;
  const mid = Math.floor(size / 2);

  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size; r++) {
      const coord: AxialCoord = { q, r };

      let terrain: Terrain;

      // Border mountains
      if (q === 0 || r === 0 || q === last || r === last) {
        terrain = Terrain.Mountain;
      }
      // Scaled water bodies
      else if (
        (q === Math.floor(size * 0.25) &&
          r >= Math.floor(size * 0.25) &&
          r <= Math.floor(size * 0.5)) ||
        (q === Math.floor(size * 0.7) &&
          r >= Math.floor(size * 0.45) &&
          r <= Math.floor(size * 0.7))
      ) {
        terrain = Terrain.Water;
      }
      // Quadrant-based terrains
      else if (q < mid && r < mid) {
        terrain = (q + r) % 3 === 0 ? Terrain.Forest : Terrain.Grass;
      } else if (q >= mid && r < mid) {
        terrain = (q + r) % 3 === 0 ? Terrain.Canyon : Terrain.Desert;
      } else if (q < mid && r >= mid) {
        terrain = (q + r) % 3 === 0 ? Terrain.Flower : Terrain.Grass;
      } else {
        terrain =
          [
            Terrain.Grass,
            Terrain.Forest,
            Terrain.Desert,
            Terrain.Flower,
            Terrain.Canyon,
          ][(q + r) % 5];
      }

      const cell: HexCell = { coord, terrain, settlement: undefined };

      // Scale castle positions proportionally
      const castlePos = Math.floor(size * 0.15);
      const castleFar = Math.floor(size * 0.8);

      if (
        (q === castlePos && r === castlePos) ||
        (q === castleFar && r === castlePos) ||
        (q === castlePos && r === castleFar) ||
        (q === castleFar && r === castleFar)
      ) {
        cell.location = Location.Castle;
      } else if (
        q === Math.floor(size * 0.35) &&
        r === Math.floor(size * 0.35)
      ) {
        cell.location = Location.Farm;
      } else if (
        q === Math.floor(size * 0.3) &&
        r === Math.floor(size * 0.3)
      ) {
        cell.location = Location.Harbor;
      } else if (
        q === Math.floor(size * 0.7) &&
        r === Math.floor(size * 0.25)
      ) {
        cell.location = Location.Oasis;
      } else if (
        q === Math.floor(size * 0.45) &&
        r === Math.floor(size * 0.2)
      ) {
        cell.location = Location.Tower;
      } else if (
        q === Math.floor(size * 0.4) &&
        r === Math.floor(size * 0.6)
      ) {
        cell.location = Location.Paddock;
      } else if (
        q === Math.floor(size * 0.65) &&
        r === Math.floor(size * 0.65)
      ) {
        cell.location = Location.Barn;
      } else if (
        q === Math.floor(size * 0.2) &&
        r === Math.floor(size * 0.65)
      ) {
        cell.location = Location.Oracle;
      } else if (
        q === Math.floor(size * 0.75) &&
        r === Math.floor(size * 0.4)
      ) {
        cell.location = Location.Tavern;
      }

      board.setCell(cell);
    }
  }

  return board;
}

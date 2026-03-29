import { AxialCoord, hexToKey } from './hex';
import { Terrain, Location } from './terrain';
import { HexCell } from '../types';

/**
 * Board class managing the hex grid
 */
export class Board {
  private cells: Map<string, HexCell>;
  public readonly width: number;
  public readonly height: number;

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
      
      // Add some castles at strategic positions
      if ((q === 3 && r === 3) || (q === 16 && r === 3) || (q === 3 && r === 16) || (q === 16 && r === 16)) {
        cell.location = Location.Castle;
      }
      
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

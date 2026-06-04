import { describe, it, expect } from 'vitest';
import {
  QUADRANT_TEMPLATES,
  rotateLocalCoord,
  expandAndRotateTemplate,
  normalizeCoords,
  QuadrantRotation,
} from './quadrants';
import { Terrain } from './terrain';
import { createModularBoard, serializeBoard, deserializeBoard } from './board';
import { Location } from './terrain';

// ──────────────────────────────────────────────
// rotateLocalCoord
// ──────────────────────────────────────────────

describe('rotateLocalCoord', () => {
  it('rot0 (0°) leaves coordinate unchanged', () => {
    expect(rotateLocalCoord(3, 5, 0)).toEqual({ q: 3, r: 5 });
    expect(rotateLocalCoord(0, 0, 0)).toEqual({ q: 0, r: 0 });
    expect(rotateLocalCoord(9, 9, 0)).toEqual({ q: 9, r: 9 });
  });

  it('rot1 (90° CW) applies (N-r, q) where N=9', () => {
    // (3,5) → (N-5, 3) = (4, 3)
    expect(rotateLocalCoord(3, 5, 1)).toEqual({ q: 4, r: 3 });
    // (0,0) → (9, 0)
    expect(rotateLocalCoord(0, 0, 1)).toEqual({ q: 9, r: 0 });
    // (9,9) → (0, 9)
    expect(rotateLocalCoord(9, 9, 1)).toEqual({ q: 0, r: 9 });
  });

  it('rot2 (180°) applies (N-q, N-r) where N=9', () => {
    // (3,5) → (6, 4)
    expect(rotateLocalCoord(3, 5, 2)).toEqual({ q: 6, r: 4 });
    // (0,0) → (9, 9)
    expect(rotateLocalCoord(0, 0, 2)).toEqual({ q: 9, r: 9 });
    // (9,9) → (0, 0)
    expect(rotateLocalCoord(9, 9, 2)).toEqual({ q: 0, r: 0 });
  });

  it('rot3 (270° CW) applies (r, N-q) where N=9', () => {
    // (3,5) → (5, 6)
    expect(rotateLocalCoord(3, 5, 3)).toEqual({ q: 5, r: 6 });
    // (0,0) → (0, 9)
    expect(rotateLocalCoord(0, 0, 3)).toEqual({ q: 0, r: 9 });
    // (9,9) → (9, 0)
    expect(rotateLocalCoord(9, 9, 3)).toEqual({ q: 9, r: 0 });
  });

  it('4 rotations of same point produce 4 distinct values', () => {
    // (3,2) is asymmetric so all 4 rotations give different coords
    const results = ([0, 1, 2, 3] as QuadrantRotation[]).map((r) =>
      rotateLocalCoord(3, 2, r),
    );
    const keys = results.map((p) => `${p.q},${p.r}`);
    expect(new Set(keys).size).toBe(4);
  });

  it('rot1 then rot3 is identity (90° CW + 270° CW = 360°)', () => {
    // Applying rot1 then rot3 should return original coords
    const { q: q1, r: r1 } = rotateLocalCoord(3, 2, 1);
    const { q: q0, r: r0 } = rotateLocalCoord(q1, r1, 3);
    expect(q0).toBe(3);
    expect(r0).toBe(2);
  });

  it('rot2 applied twice is identity (180° + 180° = 360°)', () => {
    const { q: q1, r: r1 } = rotateLocalCoord(4, 7, 2);
    const { q: q0, r: r0 } = rotateLocalCoord(q1, r1, 2);
    expect(q0).toBe(4);
    expect(r0).toBe(7);
  });
});

// ──────────────────────────────────────────────
// normalizeCoords
// ──────────────────────────────────────────────

describe('normalizeCoords', () => {
  it('shifts so min q and r become 0', () => {
    const input = [
      { q: -3, r: -2 },
      { q: 0, r: 1 },
      { q: 2, r: -2 },
    ];
    const result = normalizeCoords(input);
    expect(Math.min(...result.map((c) => c.q))).toBe(0);
    expect(Math.min(...result.map((c) => c.r))).toBe(0);
  });

  it('returns empty array unchanged', () => {
    expect(normalizeCoords([])).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// expandAndRotateTemplate
// ──────────────────────────────────────────────

describe('expandAndRotateTemplate', () => {
  for (const template of QUADRANT_TEMPLATES) {
    for (const rotation of [0, 1, 2, 3] as QuadrantRotation[]) {
      it(`${template.id} rot${rotation}: 100 cells, no duplicate coords`, () => {
        const { cells } = expandAndRotateTemplate(template, rotation);

        // Exactly 100 cells (10×10)
        expect(cells).toHaveLength(100);

        // No duplicate coordinates
        const coordKeys = new Set(cells.map((c) => `${c.q},${c.r}`));
        expect(coordKeys.size).toBe(100);
      });

      it(`${template.id} rot${rotation}: all coords within [0,9]`, () => {
        const { cells } = expandAndRotateTemplate(template, rotation);
        for (const c of cells) {
          expect(c.q).toBeGreaterThanOrEqual(0);
          expect(c.q).toBeLessThanOrEqual(9);
          expect(c.r).toBeGreaterThanOrEqual(0);
          expect(c.r).toBeLessThanOrEqual(9);
        }
      });

      it(`${template.id} rot${rotation}: terrain values are valid Terrain enum`, () => {
        const { cells } = expandAndRotateTemplate(template, rotation);
        const validTerrains = new Set(Object.values(Terrain));
        for (const c of cells) {
          expect(validTerrains.has(c.terrain)).toBe(true);
        }
      });

      it(`${template.id} rot${rotation}: castle coord is within normalized bounds`, () => {
        const { cells, castle } = expandAndRotateTemplate(template, rotation);
        const maxQ = Math.max(...cells.map((c) => c.q));
        const maxR = Math.max(...cells.map((c) => c.r));
        expect(castle.q).toBeGreaterThanOrEqual(0);
        expect(castle.r).toBeGreaterThanOrEqual(0);
        expect(castle.q).toBeLessThanOrEqual(maxQ);
        expect(castle.r).toBeLessThanOrEqual(maxR);
      });

      it(`${template.id} rot${rotation}: both location slots within normalized bounds`, () => {
        const { cells, locationSlots } = expandAndRotateTemplate(template, rotation);
        const maxQ = Math.max(...cells.map((c) => c.q));
        const maxR = Math.max(...cells.map((c) => c.r));
        for (const slot of locationSlots) {
          expect(slot.q).toBeGreaterThanOrEqual(0);
          expect(slot.r).toBeGreaterThanOrEqual(0);
          expect(slot.q).toBeLessThanOrEqual(maxQ);
          expect(slot.r).toBeLessThanOrEqual(maxR);
        }
      });
    }
  }
});

// ──────────────────────────────────────────────
// QUADRANT_TEMPLATES integrity
// ──────────────────────────────────────────────

describe('QUADRANT_TEMPLATES integrity', () => {
  it('has exactly 8 templates', () => {
    expect(QUADRANT_TEMPLATES).toHaveLength(8);
  });

  it('all template IDs are unique', () => {
    const ids = QUADRANT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(8);
  });

  for (const template of QUADRANT_TEMPLATES) {
    it(`${template.id} layout is 10×10`, () => {
      expect(template.layout).toHaveLength(10);
      for (const row of template.layout) {
        expect(row).toHaveLength(10);
      }
    });

    it(`${template.id} has >= 60 buildable cells`, () => {
      let buildable = 0;
      for (const row of template.layout) {
        for (const t of row) {
          if (t !== Terrain.Mountain && t !== Terrain.Water) buildable++;
        }
      }
      expect(buildable).toBeGreaterThanOrEqual(60);
    });

    it(`${template.id} castle coord in [0,9]`, () => {
      expect(template.castle.q).toBeGreaterThanOrEqual(0);
      expect(template.castle.q).toBeLessThanOrEqual(9);
      expect(template.castle.r).toBeGreaterThanOrEqual(0);
      expect(template.castle.r).toBeLessThanOrEqual(9);
    });

    it(`${template.id} location slots coords in [0,9]`, () => {
      for (const slot of template.locationSlots) {
        expect(slot.q).toBeGreaterThanOrEqual(0);
        expect(slot.q).toBeLessThanOrEqual(9);
        expect(slot.r).toBeGreaterThanOrEqual(0);
        expect(slot.r).toBeLessThanOrEqual(9);
      }
    });
  }
});

// ──────────────────────────────────────────────
// createModularBoard
// ──────────────────────────────────────────────

describe('createModularBoard', () => {
  it('creates a 20×20 board (400 cells)', () => {
    const board = createModularBoard({ seed: 1001 });
    expect(board.width).toBe(20);
    expect(board.height).toBe(20);
    expect(board.getAllCells()).toHaveLength(400);
  });

  it('has exactly 4 Castle locations', () => {
    const board = createModularBoard({ seed: 1002 });
    const castles = board.getAllCells().filter((c) => c.location === Location.Castle);
    expect(castles).toHaveLength(4);
  });

  it('has all 4 castles in different quadrants (NW/NE/SW/SE)', () => {
    const board = createModularBoard({ seed: 1003 });
    const castles = board.getAllCells().filter((c) => c.location === Location.Castle);
    const quadrants = new Set(
      castles.map(
        (c) =>
          `${c.coord.q < 10 ? 'W' : 'E'}${c.coord.r < 10 ? 'N' : 'S'}`,
      ),
    );
    expect(quadrants.size).toBe(4);
  });

  it('has all 8 non-castle location types', () => {
    const board = createModularBoard({ seed: 1004 });
    const locationTypes = new Set(
      board
        .getAllCells()
        .filter((c) => c.location && c.location !== Location.Castle)
        .map((c) => c.location),
    );
    expect(locationTypes.size).toBe(8);
    // Verify each type
    const expected = [
      Location.Farm,
      Location.Harbor,
      Location.Oasis,
      Location.Tower,
      Location.Paddock,
      Location.Barn,
      Location.Oracle,
      Location.Tavern,
    ];
    for (const loc of expected) {
      expect(locationTypes.has(loc)).toBe(true);
    }
  });

  it('passes playability: >= 200 buildable cells', () => {
    const board = createModularBoard({ seed: 1005 });
    const buildable = board
      .getAllCells()
      .filter((c) => c.terrain !== Terrain.Mountain && c.terrain !== Terrain.Water);
    expect(buildable.length).toBeGreaterThanOrEqual(200);
  });

  it('passes playability: all 5 buildable terrains >= 5 each', () => {
    const board = createModularBoard({ seed: 1006 });
    const cells = board.getAllCells();
    const buildableTerrains = [
      Terrain.Grass,
      Terrain.Forest,
      Terrain.Desert,
      Terrain.Flower,
      Terrain.Canyon,
    ];
    for (const t of buildableTerrains) {
      const count = cells.filter((c) => c.terrain === t).length;
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });

  it('same seed produces identical board (seed replay)', () => {
    const seed = 42000;
    const b1 = createModularBoard({ seed });
    const b2 = createModularBoard({ seed });

    const cells1 = b1.getAllCells().sort((a, b) => {
      if (a.coord.q !== b.coord.q) return a.coord.q - b.coord.q;
      return a.coord.r - b.coord.r;
    });
    const cells2 = b2.getAllCells().sort((a, b) => {
      if (a.coord.q !== b.coord.q) return a.coord.q - b.coord.q;
      return a.coord.r - b.coord.r;
    });

    expect(JSON.stringify(cells1)).toBe(JSON.stringify(cells2));
  });

  it('different seeds produce different boards', () => {
    const boards = [1, 2, 3, 4, 5].map((s) => {
      const b = createModularBoard({ seed: s * 999 });
      // Sample a few cells to compare
      return b.getAllCells().map((c) => c.terrain).join(',');
    });

    const unique = new Set(boards);
    // At least 3 distinct layouts among 5 seeds
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });

  it('stores meta with seed and 4 quadrantInstances', () => {
    const seed = 77777;
    const board = createModularBoard({ seed });
    expect(board.meta).toBeDefined();
    expect(board.meta!.mapSeed).toBe(seed);
    expect(board.meta!.quadrantInstances).toHaveLength(4);
  });

  it('all quadrantInstance templateIds are from QUADRANT_TEMPLATES', () => {
    const board = createModularBoard({ seed: 55555 });
    const validIds = new Set(QUADRANT_TEMPLATES.map((t) => t.id));
    for (const inst of board.meta!.quadrantInstances) {
      expect(validIds.has(inst.templateId)).toBe(true);
    }
  });

  it('all quadrantInstance rotations are 0-3', () => {
    const board = createModularBoard({ seed: 33333 });
    for (const inst of board.meta!.quadrantInstances) {
      expect([0, 1, 2, 3]).toContain(inst.rotation);
    }
  });

  it('no cells have undefined terrain', () => {
    const board = createModularBoard({ seed: 11111 });
    for (const cell of board.getAllCells()) {
      expect(cell.terrain).toBeDefined();
    }
  });

  it('no settlements placed on initial board', () => {
    const board = createModularBoard({ seed: 22222 });
    const occupied = board.getAllCells().filter((c) => c.settlement !== undefined);
    expect(occupied).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// Serialization / legacy save compatibility
// ──────────────────────────────────────────────

describe('serializeBoard / deserializeBoard', () => {
  it('round-trips a modular board including meta', () => {
    const seed = 98765;
    const original = createModularBoard({ seed });
    const serialized = serializeBoard(original);
    const restored = deserializeBoard(serialized);

    expect(restored.width).toBe(original.width);
    expect(restored.height).toBe(original.height);
    expect(restored.getAllCells()).toHaveLength(original.getAllCells().length);
    expect(restored.meta?.mapSeed).toBe(seed);
    expect(restored.meta?.quadrantInstances).toHaveLength(4);
  });

  it('deserializes old save without meta (backwards compat)', () => {
    // Simulate a legacy save: no meta field
    const legacySave = {
      width: 20,
      height: 20,
      cells: [
        ['0,0', { coord: { q: 0, r: 0 }, terrain: Terrain.Grass, settlement: undefined }],
      ] as [string, import('../types').HexCell][],
      // no meta field
    };

    // Should not throw
    const board = deserializeBoard(legacySave);
    expect(board.meta).toBeUndefined();
    expect(board.getAllCells()).toHaveLength(1);
  });

  it('location data survives serialization round-trip', () => {
    const original = createModularBoard({ seed: 12345 });
    const serialized = serializeBoard(original);
    const restored = deserializeBoard(serialized);

    const origCastles = original
      .getAllCells()
      .filter((c) => c.location === Location.Castle)
      .map((c) => `${c.coord.q},${c.coord.r}`)
      .sort();

    const restCastles = restored
      .getAllCells()
      .filter((c) => c.location === Location.Castle)
      .map((c) => `${c.coord.q},${c.coord.r}`)
      .sort();

    expect(restCastles).toEqual(origCastles);
  });
});

// ──────────────────────────────────────────────
// Multiple game map diversity (playability spot-check)
// ──────────────────────────────────────────────

describe('map diversity across games', () => {
  it('5 games with different seeds all pass playability', () => {
    for (let seed = 100; seed <= 500; seed += 100) {
      const board = createModularBoard({ seed });
      const cells = board.getAllCells();

      // Buildable cells
      const buildable = cells.filter(
        (c) => c.terrain !== Terrain.Mountain && c.terrain !== Terrain.Water,
      );
      expect(buildable.length).toBeGreaterThanOrEqual(200);

      // 4 castles
      const castles = cells.filter((c) => c.location === Location.Castle);
      expect(castles).toHaveLength(4);

      // 8 location types
      const locationTypes = new Set(
        cells
          .filter((c) => c.location && c.location !== Location.Castle)
          .map((c) => c.location),
      );
      expect(locationTypes.size).toBe(8);
    }
  });

  it('castle positions differ between at least 3 of 5 seeds', () => {
    const seeds = [111, 222, 333, 444, 555];
    const castlePatterns = seeds.map((seed) => {
      const board = createModularBoard({ seed });
      return board
        .getAllCells()
        .filter((c) => c.location === Location.Castle)
        .map((c) => `${c.coord.q},${c.coord.r}`)
        .sort()
        .join('|');
    });
    const unique = new Set(castlePatterns);
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });
});

import { describe, it, expect } from 'vitest';
import { Board, createDefaultBoard, serializeBoard, deserializeBoard } from '../core/board';
import { Terrain } from '../core/terrain';
import type { HexCell } from '../types';

describe('Board Persistence', () => {
    it('serializes and deserializes board.cells Map correctly', () => {
        const board = new Board(10, 10);

        // Add some cells
        const cell1: HexCell = {
            coord: { q: 0, r: 0 },
            terrain: Terrain.Grass,
            settlement: undefined,
        };
        const cell2: HexCell = {
            coord: { q: 1, r: 1 },
            terrain: Terrain.Forest,
            settlement: 1,
        };

        board.setCell(cell1);
        board.setCell(cell2);

        // Serialize
        const json = serializeBoard(board);

        // Should have correct shape
        expect(json).toHaveProperty('width', 10);
        expect(json).toHaveProperty('height', 10);
        expect(json).toHaveProperty('cells');
        expect(Array.isArray(json.cells)).toBe(true);
        expect(json.cells.length).toBe(2);

        // Deserialize
        const restored = deserializeBoard(json);

        // Should have same dimensions
        expect(restored.width).toBe(10);
        expect(restored.height).toBe(10);

        // Should have same cells
        const restoredCell1 = restored.getCell({ q: 0, r: 0 });
        expect(restoredCell1).toBeDefined();
        expect(restoredCell1?.terrain).toBe(Terrain.Grass);
        expect(restoredCell1?.settlement).toBeUndefined();

        const restoredCell2 = restored.getCell({ q: 1, r: 1 });
        expect(restoredCell2).toBeDefined();
        expect(restoredCell2?.terrain).toBe(Terrain.Forest);
        expect(restoredCell2?.settlement).toBe(1);

        // Should be able to use board methods
        expect(restored.getAllCells().length).toBe(2);
        expect(restored.hasCell({ q: 0, r: 0 })).toBe(true);
        expect(restored.hasCell({ q: 2, r: 2 })).toBe(false);
    });

    it('handles full game board serialization', () => {
        const board = createDefaultBoard();
        const originalCellCount = board.getAllCells().length;

        // Place some settlements
        board.placeSettlement({ q: 5, r: 5 }, 1);
        board.placeSettlement({ q: 6, r: 6 }, 2);

        // Serialize and deserialize
        const json = serializeBoard(board);
        const restored = deserializeBoard(json);

        // Cell count should match
        expect(restored.getAllCells().length).toBe(originalCellCount);

        // Settlements should be preserved
        expect(restored.getSettlement({ q: 5, r: 5 })).toBe(1);
        expect(restored.getSettlement({ q: 6, r: 6 })).toBe(2);

        // Board methods should work
        expect(restored.getPlayerSettlements(1).length).toBe(1);
        expect(restored.getPlayerSettlements(2).length).toBe(1);
    });

    it('survives JSON.stringify/parse cycle', () => {
        const board = createDefaultBoard();
        board.placeSettlement({ q: 3, r: 3 }, 1);

        // Serialize to JSON string (like localStorage)
        const json = serializeBoard(board);
        const jsonString = JSON.stringify(json);

        // Parse back
        const parsed = JSON.parse(jsonString);
        const restored = deserializeBoard(parsed);

        // Should still work
        expect(restored.getCell({ q: 3, r: 3 })?.settlement).toBe(1);
        expect(restored.getAllCells().length).toBeGreaterThan(0);
    });
});

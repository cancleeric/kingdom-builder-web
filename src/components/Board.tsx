import { useGameStore } from '../store/gameStore';
import { TERRAIN_COLORS } from '../core/terrain';
import { HexCell } from '../types';

const CELL_SIZE = 24;
const HEX_W = CELL_SIZE;
const HEX_H = CELL_SIZE * 0.866;

export function Board() {
  const { board, validPlacements, placeHouse, phase } = useGameStore();

  return (
    <div className="overflow-auto" style={{ maxHeight: '80vh' }}>
      <div style={{ position: 'relative', width: 20 * HEX_W + HEX_W / 2, height: 20 * HEX_H }}>
        {board.map((row, ri) =>
          row.map((cell: HexCell, ci) => {
            const isValid = phase === 'place' && validPlacements.some(v => v.row === ri && v.col === ci);
            const x = ci * HEX_W + (ri % 2 === 1 ? HEX_W / 2 : 0);
            const y = ri * HEX_H;
            return (
              <div
                key={`${ri}-${ci}`}
                onClick={() => isValid && placeHouse(ri, ci)}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: HEX_W - 1,
                  height: HEX_H - 1,
                  backgroundColor: TERRAIN_COLORS[cell.terrain],
                  border: isValid ? '2px solid white' : '1px solid rgba(0,0,0,0.2)',
                  cursor: isValid ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                }}
              >
                {cell.hasHouse && (
                  <span style={{ color: cell.playerId === 1 ? 'red' : 'blue' }}>⌂</span>
                )}
                {cell.terrain === 'castle' && !cell.hasHouse && <span>🏰</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

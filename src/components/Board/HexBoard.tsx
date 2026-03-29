import React, { useMemo, useCallback } from 'react';
import type { Cell, Hex } from '../../types';
import { hexToPixel, hexEqual } from '../../core/hex';

interface HexBoardProps {
  cells: Cell[];
  validPlacements: Hex[];
  playerColors: string[];
  onCellClick: (hex: Hex) => void;
  size?: number;
}

const HEX_SIZE = 18;
const BOARD_ORIGIN = { x: 400, y: 300 };

const TERRAIN_COLORS: Record<string, string> = {
  grassland: '#7ec850',
  forest: '#2d6a4f',
  desert: '#e9c46a',
  flower: '#f4a261',
  canyon: '#e76f51',
  mountain: '#6b7280',
  water: '#60a5fa',
};

function hexPolygon(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i + 30); // pointy-top
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

export const HexBoard: React.FC<HexBoardProps> = ({
  cells,
  validPlacements,
  playerColors,
  onCellClick,
}) => {
  const hexElements = useMemo(() => {
    return cells.map((cell) => {
      const { x, y } = hexToPixel(cell.hex, HEX_SIZE, BOARD_ORIGIN);
      const isValid = validPlacements.some((h) => hexEqual(h, cell.hex));
      const hasOwner = cell.owner !== null;
      const color = hasOwner
        ? playerColors[cell.owner!]
        : TERRAIN_COLORS[cell.terrain] ?? '#ccc';

      const points = hexPolygon(x, y, HEX_SIZE - 1);

      return (
        <g
          key={`${cell.hex.q},${cell.hex.r}`}
          onClick={isValid ? () => onCellClick(cell.hex) : undefined}
          style={{ cursor: isValid ? 'pointer' : 'default' }}
        >
          <polygon
            points={points}
            fill={color}
            stroke={isValid ? '#fbbf24' : '#00000022'}
            strokeWidth={isValid ? 2.5 : 0.5}
            opacity={hasOwner ? 1 : 0.85}
          />
          {cell.hasCastle && (
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} style={{ pointerEvents: 'none' }}>
              🏰
            </text>
          )}
          {cell.hasLocationTile && !cell.locationTileClaimed && (
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} style={{ pointerEvents: 'none' }}>
              ⭐
            </text>
          )}
          {isValid && !hasOwner && (
            <polygon
              points={hexPolygon(x, y, HEX_SIZE * 0.5)}
              fill="#fbbf2466"
              stroke="none"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </g>
      );
    });
  }, [cells, validPlacements, playerColors, onCellClick]);

  return (
    <svg
      width="800"
      height="600"
      viewBox="0 0 800 600"
      className="border border-gray-200 rounded-xl bg-slate-100"
    >
      {hexElements}
    </svg>
  );
};

// Responsive wrapper
export const HexBoardWrapper: React.FC<HexBoardProps> = ({ onCellClick, ...rest }) => {
  const handleClick = useCallback(
    (hex: Hex) => onCellClick(hex),
    [onCellClick]
  );

  return (
    <div className="overflow-auto">
      <HexBoard {...rest} onCellClick={handleClick} />
    </div>
  );
};

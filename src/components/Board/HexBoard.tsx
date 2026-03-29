import React from 'react';
import type { HexCell, HexCoord } from '../../types';
import type { PlayerColor } from '../../types/setup';
import { hexToPixel, hexCorners } from '../../core/hex';
import { getTerrainColor } from '../../core/terrain';

const HEX_SIZE = 30;

const PLAYER_COLORS: Record<PlayerColor, string> = {
  orange: '#F97316',
  blue: '#3B82F6',
  white: '#F3F4F6',
  black: '#111827',
};

interface HexBoardProps {
  board: HexCell[];
  validMoves: HexCoord[];
  playerColors: Record<number, PlayerColor>;
  onCellClick: (coord: HexCoord) => void;
}

export function HexBoard({ board, validMoves, playerColors, onCellClick }: HexBoardProps) {
  const offset = { x: 400, y: 300 };

  const isValidMove = (coord: HexCoord) =>
    validMoves.some(v => v.q === coord.q && v.r === coord.r);

  const cells = board.filter(c => {
    const { x, y } = hexToPixel(c.coord, HEX_SIZE);
    return Math.abs(x) < 380 && Math.abs(y) < 280;
  });

  return (
    <svg
      width="800"
      height="600"
      className="border border-gray-300 rounded-xl bg-blue-50"
      viewBox="0 0 800 600"
    >
      {cells.map(cell => {
        const center = hexToPixel(cell.coord, HEX_SIZE);
        const cx = center.x + offset.x;
        const cy = center.y + offset.y;
        const corners = hexCorners({ x: cx, y: cy }, HEX_SIZE - 1);
        const points = corners.map(c => `${c.x},${c.y}`).join(' ');
        const valid = isValidMove(cell.coord);
        const fillColor = getTerrainColor(cell.terrain);

        return (
          <g
            key={`${cell.coord.q},${cell.coord.r}`}
            onClick={() => onCellClick(cell.coord)}
            className={valid ? 'cursor-pointer' : 'cursor-default'}
          >
            <polygon
              points={points}
              fill={fillColor}
              stroke={valid ? '#FFD700' : '#666'}
              strokeWidth={valid ? 2 : 0.5}
              opacity={0.9}
            />
            {cell.settlement !== null && (
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={PLAYER_COLORS[playerColors[cell.settlement] ?? 'orange']}
                stroke="#333"
                strokeWidth={1}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

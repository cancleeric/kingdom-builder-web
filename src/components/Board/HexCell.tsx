import React from 'react';
import { hexCorners, HEX_SIZE } from '../../core/hex';
import { HexCell as HexCellType } from '../../types';
import { getTerrainColor } from '../../core/terrain';

interface HexCellProps {
  cell: HexCellType;
  isValid: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isNewlyPlaced: boolean;
  playerColor?: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const HexCell: React.FC<HexCellProps> = ({
  cell,
  isValid,
  isSelected,
  isHovered,
  isNewlyPlaced,
  playerColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const corners = hexCorners(cell.coord, HEX_SIZE);
  const points = corners.map(c => `${c.x},${c.y}`).join(' ');
  
  const terrainColor = getTerrainColor(cell.terrain);
  
  // Determine fill color
  let fillColor = terrainColor;
  if (isHovered && isValid) {
    fillColor = '#FFFF99'; // Light yellow for hover
  }
  
  // Determine stroke
  let strokeColor = '#333';
  let strokeWidth = 1;
  
  if (isValid) {
    strokeColor = '#00FF00'; // Green for valid placements
    strokeWidth = 2;
  }
  
  if (isSelected) {
    strokeColor = '#FF00FF'; // Magenta for selected
    strokeWidth = 3;
  }

  // CSS classes for valid-hex highlight animation
  const polygonClassName = isValid ? 'hex-highlight-valid' : undefined;

  // Center of the hex cell (used for settlement and location markers)
  const cx = corners[0].x - HEX_SIZE;
  const cy = corners[0].y;

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: isValid ? 'pointer' : (cell.settlement !== undefined ? 'default' : 'not-allowed') }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
        className={polygonClassName}
        style={{ transition: 'fill 150ms ease-out' }}
      />
      
      {/* Show location marker if present */}
      {cell.location && (
        <text
          x={cx}
          y={cy}
          fontSize="10"
          fill="#000"
          fontWeight="bold"
          textAnchor="middle"
        >
          {cell.location[0]}
        </text>
      )}
      
      {/* Show settlement marker if present */}
      {cell.settlement !== undefined && playerColor && (
        <circle
          cx={cx}
          cy={cy}
          r={HEX_SIZE * 0.4}
          fill={playerColor}
          stroke="#000"
          strokeWidth={2}
          className={isNewlyPlaced ? 'settlement-new' : undefined}
        />
      )}
    </g>
  );
};

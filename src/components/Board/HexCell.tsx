import React from 'react';
import { hexCorners, HEX_SIZE } from '../../core/hex';
import { HexCell as HexCellType } from '../../types';
import { getTerrainColor } from '../../core/terrain';

interface HexCellProps {
  cell: HexCellType;
  isValid: boolean;
  isSelected: boolean;
  isHovered: boolean;
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

  // Build CSS class list for the hex polygon
  const polygonClasses = [
    isValid ? 'hex-valid-transition' : '',
    isValid && isHovered ? 'hex-valid-hovered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Cursor: pointer for valid placements, not-allowed for occupied cells, default otherwise
  let cursor = 'default';
  if (isValid) {
    cursor = 'pointer';
  } else if (cell.settlement !== undefined) {
    cursor = 'not-allowed';
  }

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
        className={polygonClasses}
      />
      
      {/* Show location marker if present */}
      {cell.location && (
        <text
          x={corners[0].x - HEX_SIZE}
          y={corners[0].y}
          fontSize="10"
          fill="#000"
          fontWeight="bold"
          textAnchor="middle"
        >
          {cell.location[0]}
        </text>
      )}
      
      {/* Show settlement marker if present – CSS animation plays on mount */}
      {cell.settlement !== undefined && playerColor && (
        <circle
          className="settlement-drop"
          cx={corners[0].x - HEX_SIZE}
          cy={corners[0].y}
          r={HEX_SIZE * 0.4}
          fill={playerColor}
          stroke="#000"
          strokeWidth={2}
        />
      )}
    </g>
  );
};

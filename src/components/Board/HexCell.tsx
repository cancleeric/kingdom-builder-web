import React from 'react';
import { hexCorners, HEX_SIZE } from '../../core/hex';
import { HexCell as HexCellType } from '../../types';
import { getTerrainColor, getTerrainName } from '../../core/terrain';
import '../../styles/animations.css';

interface HexCellProps {
  cell: HexCellType;
  isValid: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isRecentlyPlaced?: boolean;
  playerColor?: string;
  playerName?: string;
  tabIndex: number;
  onClick: () => void;
  /** Called on touchend when the touch was a tap (no significant movement). */
  onTap: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => void;
  cellRef?: (el: SVGGElement | null) => void;
}

export const HexCell: React.FC<HexCellProps> = ({
  cell,
  isValid,
  isSelected,
  isHovered,
  isRecentlyPlaced = false,
  playerColor,
  playerName,
  tabIndex,
  onClick,
  onTap,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onKeyDown,
  cellRef,
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

  // Touch tap: stopPropagation so the container's touchEnd doesn't also fire onClick
  const handleTouchEnd = (e: React.TouchEvent<SVGGElement>) => {
    e.stopPropagation();
    onTap();
  };

  // Build descriptive aria-label
  const terrainName = getTerrainName(cell.terrain);
  let ariaLabel = `Q${cell.coord.q} R${cell.coord.r} — ${terrainName}`;
  if (cell.settlement !== undefined && playerName) {
    ariaLabel += `, ${playerName} settlement`;
  }
  if (isValid) {
    ariaLabel += ', valid placement';
  }

  return (
    <g
      ref={cellRef}
      role="gridcell"
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-disabled={!isValid}
      onClick={onClick}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      style={{ cursor: isValid ? 'pointer' : 'default' }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
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

      {/* Show settlement marker if present */}
      {cell.settlement !== undefined && playerColor && (
        <circle
          cx={corners[0].x - HEX_SIZE}
          cy={corners[0].y}
          r={HEX_SIZE * 0.4}
          fill={playerColor}
          stroke="#000"
          strokeWidth={2}
          className={isRecentlyPlaced ? 'animate-settlement-drop' : undefined}
        />
      )}
    </g>
  );
};

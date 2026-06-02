import React from 'react';
import { hexCorners, HEX_SIZE } from '../../core/hex';
import { HexCell as HexCellType } from '../../types';
import { getTerrainColor } from '../../core/terrain';
import '../../styles/animations.css';
import { useTranslation } from 'react-i18next';
import { tTerrain } from '../../i18n/formatters';
import { SettlementMarker } from './SettlementMarker';
import { LocationMarker } from './LocationMarker';

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

export const HexCell: React.FC<HexCellProps> = React.memo(({
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
  const { t } = useTranslation();
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
  const terrainName = tTerrain(t, cell.terrain);
  let ariaLabel = `Q${cell.coord.q} R${cell.coord.r} — ${terrainName}`;
  if (cell.settlement !== undefined && playerName) {
    ariaLabel += `, ${t('board.settlementSuffix', { player: playerName })}`;
  }
  if (isValid) {
    ariaLabel += `, ${t('board.validPlacementSuffix')}`;
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
        <LocationMarker
          cx={corners[0].x - HEX_SIZE}
          cy={corners[0].y}
          location={cell.location}
          hasSettlement={cell.settlement !== undefined}
        />
      )}

      {/* Show settlement marker if present */}
      {cell.settlement !== undefined && playerColor && (
        <SettlementMarker
          cx={corners[0].x - HEX_SIZE}
          cy={corners[0].y}
          playerColor={playerColor}
          isRecentlyPlaced={isRecentlyPlaced}
        />
      )}
    </g>
  );
});

HexCell.displayName = 'HexCell';

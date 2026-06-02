import React from 'react';
import { hexCorners, HEX_SIZE, axialToPixel } from '../../core/hex';
import { HexCell as HexCellType } from '../../types';
import { getTerrainColor, getTerrainGradientId } from '../../core/terrain';
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
  const gradientId = getTerrainGradientId(cell.terrain);

  // Determine fill color:
  // - hover on valid cell → #FFFF99 direct hex（hover 優先，跳過 gradient）
  // - otherwise → url(#grad-{terrain}) 共用漸層
  const isHoverHighlight = isHovered && isValid;
  const fillColor = isHoverHighlight ? '#FFFF99' : `url(#${gradientId})`;

  // terrainColor kept for reference (used by hover path via getTerrainColor)
  void terrainColor;

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

  // 計算 hex 中心（供 motif <use> 定位）
  // corners[0].x - HEX_SIZE = axialToPixel center.x（與 SettlementMarker/LocationMarker 相同）
  const center = axialToPixel(cell.coord, HEX_SIZE);
  // motif symbol viewBox="0 0 52 60"，以中心為錨定：x = cx - 26，y = cy - 30
  const motifX = center.x - 26;
  const motifY = center.y - 30;

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
      {/* 底色漸層 polygon（hover 時用直值 #FFFF99，非 hover 用共用 gradient） */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
      />

      {/* 頂部受光 sheen（hover 高亮時隱藏，避免蓋掉黃色） */}
      {!isHoverHighlight && (
        <polygon
          points={points}
          fill="url(#sheen-top)"
          stroke="none"
          pointerEvents="none"
        />
      )}

      {/* 立體地形 motif 層（草叢/林冠/沙丘/花朵/岩裂/波光/雪峰）
          套 center-feather-mask：中心羽化透明，留棋子/icon 空間
          pointerEvents="none" 不擋點擊 */}
      {!isHoverHighlight && (
        <use
          href={`#motif-${cell.terrain}`}
          x={motifX}
          y={motifY}
          width={52}
          height={60}
          mask="url(#center-feather-mask)"
          pointerEvents="none"
        />
      )}

      {/* Vignette 暗角（邊緣暗角加強立體地塊厚度感，hover 時隱藏） */}
      {!isHoverHighlight && (
        <polygon
          points={points}
          fill="url(#vignette-grad)"
          stroke="none"
          pointerEvents="none"
        />
      )}

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

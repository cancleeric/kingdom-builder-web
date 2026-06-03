import React from 'react';
import { hexCorners, HEX_SIZE, axialToPixel } from '../../core/hex';
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
  isFocused?: boolean;
  isRecentlyPlaced?: boolean;
  isBotPlacement?: boolean;
  /** R30: true for 400ms when an invalid click lands on this cell */
  isInvalidFlash?: boolean;
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

/**
 * 確定性 hash，依 (q,r) 輸出 'a' | 'b' | 'c'。
 * 同格每次渲染相同，相鄰格儘量不同（避免壁紙感）。
 */
function terrainVariant(q: number, r: number): 'a' | 'b' | 'c' {
  const h = ((q * 1619 + r * 31337) >>> 0) % 3;
  return (['a', 'b', 'c'] as const)[h];
}

/**
 * 確定性旋轉/位移抖動（seeded by coord）。
 * 打破 motif 壁紙感，相鄰同類磚有肉眼可見差異。
 */
function cellJitter(q: number, r: number): { rotate: number; dx: number; dy: number } {
  const seed = ((q * 7193 + r * 1013) >>> 0);
  const rotate = ((seed % 60) - 30) * 0.5;   // ±15deg
  const dx = ((seed >> 4) % 7) - 3;           // ±3px
  const dy = ((seed >> 8) % 7) - 3;           // ±3px
  return { rotate, dx, dy };
}

export const HexCell: React.FC<HexCellProps> = React.memo(({
  cell,
  isValid,
  isSelected,
  isHovered,
  isFocused = false,
  isRecentlyPlaced = false,
  isBotPlacement = false,
  isInvalidFlash = false,
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

  // terrainColor kept for reference (used by hover path via getTerrainColor)
  void terrainColor;

  // Determine variant (a/b/c) by coord hash
  const variant = terrainVariant(cell.coord.q, cell.coord.r);
  const gradientId = `grad-${cell.terrain}-${variant}`;

  // Determine fill color:
  // - hover on valid cell → #FFFF99 direct hex（hover 優先，跳過 gradient）
  // - otherwise → url(#grad-{terrain}-{variant}) 共用漸層變體
  const isHoverHighlight = isHovered && isValid;
  const fillColor = isHoverHighlight ? '#FFFF99' : `url(#${gradientId})`;

  // Determine stroke（主題色，取代原 debug 螢光綠/洋紅）
  let strokeColor = '#3a2c20';   // 暖深褐格線（取代冷灰 #333，融入木桌/羊皮紙）
  let strokeWidth = 1;

  if (isValid) {
    strokeColor = '#E8B84B';     // 琥珀金：可放置（取代螢光綠 #00FF00，清楚但不刺眼）
    strokeWidth = 2.5;
  }

  if (isSelected) {
    strokeColor = '#B5341F';     // 酒紅橘：選中（取代洋紅 #FF00FF）
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
  const center = axialToPixel(cell.coord, HEX_SIZE);
  // motif symbol viewBox="0 0 52 60"，以中心為錨定：x = cx - 26，y = cy - 30
  const motifX = center.x - 26;
  const motifY = center.y - 30;

  // 確定性抖動（rotate ±15deg + dx/dy ±3px），打破壁紙感
  const jitter = cellJitter(cell.coord.q, cell.coord.r);

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
      className={isInvalidFlash ? 'animate-hex-invalid-shake' : undefined}
      style={{ cursor: isValid ? 'pointer' : 'default' }}
    >
      {/* 底色漸層 polygon（hover 時用直值 #FFFF99，非 hover 用共用 gradient 變體） */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={0.9}
      />

      {/* 左上柔光疊層：給平磚微景深（方向感），非球面 */}
      {!isHoverHighlight && (
        <polygon
          points={points}
          fill="url(#light-overlay)"
          pointerEvents="none"
        />
      )}

      {/* 升級地形 motif（草叢/雲朵樹冠/結構仙人掌/花瓣花/岩層/水波/不規則山峰）
          套 center-feather-mask：中心羽化透明，留棋子/icon 空間
          jitter 抖動：確定性 rotate ±15deg + dx/dy ±3px，打破壁紙
          pointerEvents="none" 不擋點擊 */}
      {!isHoverHighlight && (
        <use
          href={`#motif-${cell.terrain}-${variant}`}
          x={motifX + jitter.dx}
          y={motifY + jitter.dy}
          width={52}
          height={60}
          mask="url(#center-feather-mask)"
          transform={`rotate(${jitter.rotate}, ${center.x}, ${center.y})`}
          pointerEvents="none"
        />
      )}

      {/* 六角形 focus ring（鍵盤導覽）：深底+金環雙線，任何地形上都清楚可見，取代矩形 outline */}
      {isFocused && (
        <>
          <polygon points={points} fill="none" stroke="#1a1410" strokeWidth={5} opacity={0.85} pointerEvents="none" />
          <polygon points={points} fill="none" stroke="#FFD24A" strokeWidth={2.5} pointerEvents="none" />
        </>
      )}

      {/* R30: invalid click red stroke flash overlay */}
      {isInvalidFlash && (
        <polygon
          points={points}
          fill="none"
          stroke="#CC2200"
          strokeWidth={3.5}
          opacity={0}
          pointerEvents="none"
          className="animate-hex-invalid-flash"
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
          isBotPlacement={isBotPlacement}
        />
      )}
    </g>
  );
});

HexCell.displayName = 'HexCell';

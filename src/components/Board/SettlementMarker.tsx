import React from 'react';

interface SettlementMarkerProps {
  cx: number;
  cy: number;
  playerColor: string;
  isRecentlyPlaced?: boolean;
}

/**
 * 2.5D 彩色聚落棋子（R24-B 升級）
 *
 * 層次（由底至頂）：
 *   1. 地面投影橢圓（rgba(0,0,0,0.28)）
 *   2. 牆側面（playerColor + rgba(0,0,0,0.30) overlay）
 *   3. 牆正面（playerColor）
 *   4. 屋頂側面（playerColor + rgba(0,0,0,0.25) overlay）
 *   5. 屋頂頂面（playerColor + rgba(255,255,255,0.18) overlay）
 *   6. 門（深色）
 *
 * playerColor 以 JSX prop fill={playerColor} 傳入，
 * 不使用 CSS var（Tailwind v4 SVG attr 限制）。
 * 暗化側面用 opacity overlay，不需 hex darken helper。
 * drop-shadow 加強至 0 2px 3px rgba(0,0,0,0.50)。
 *
 * 外形尺寸保持在 ~14×17px 安全區內（HEX_SIZE=30，安全半徑15px）。
 */
export const SettlementMarker: React.FC<SettlementMarkerProps> = ({
  cx,
  cy,
  playerColor,
  isRecentlyPlaced,
}) => {
  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      pointerEvents="none"
      className={isRecentlyPlaced ? 'animate-settlement-drop' : undefined}
    >
      {/* Ring radiate: expands outward and fades (only when recently placed) */}
      {isRecentlyPlaced && (
        <circle
          cx={0}
          cy={0}
          r={0}
          fill="none"
          stroke={playerColor}
          strokeWidth={2}
          className="animate-settlement-ring"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 地面投影橢圓（坐在地形上的感覺） */}
      <ellipse
        cx={0}
        cy={8.5}
        rx={6}
        ry={2}
        fill="rgba(0,0,0,0.28)"
      />

      {/* 主體 + drop-shadow */}
      <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.50))">

        {/* ── 牆側面（左側，2.5D 感） ────────────────────────────────── */}
        {/* 側面底色 */}
        <rect x={-7} y={0} width={2} height={8} fill={playerColor} />
        {/* 側面暗化 overlay */}
        <rect x={-7} y={0} width={2} height={8} fill="rgba(0,0,0,0.30)" />

        {/* ── 牆正面 ─────────────────────────────────────────────────── */}
        <rect x={-5} y={0} width={11} height={8} fill={playerColor} />
        {/* 牆正面微暗下緣線 */}
        <line x1={-5} y1={8} x2={6} y2={8} stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />

        {/* ── 屋頂側面（左側斜切，2.5D） ─────────────────────────────── */}
        {/* 側面底色 */}
        <polygon points="-7,0 -5,0 -5,-9 -7,-7" fill={playerColor} />
        {/* 側面暗化 overlay */}
        <polygon points="-7,0 -5,0 -5,-9 -7,-7" fill="rgba(0,0,0,0.25)" />

        {/* ── 屋頂頂面 ───────────────────────────────────────────────── */}
        {/* 頂面底色 */}
        <polygon points="-7,-7 -5,-9 7,0 6,0 -5,0" fill={playerColor} />
        <polygon points="-5,-9 7,-9 7,0 -5,0" fill={playerColor} />
        {/* 頂面亮化 overlay（顯得比牆面亮一截） */}
        <polygon points="-7,-7 -5,-9 7,-9 7,0 6,0 -5,0" fill="rgba(255,255,255,0.18)" />

        {/* ── 門（深色矩形） ──────────────────────────────────────────── */}
        <rect x={-1.8} y={3} width={3.6} height={5} rx={0.5} fill="#1a1a1a" />

      </g>
    </g>
  );
};

SettlementMarker.displayName = 'SettlementMarker';

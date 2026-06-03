/**
 * BoardFrameOverlay — R24-C 棋盤環境框裝飾
 *
 * position: absolute; inset: 0; pointer-events: none; z-index: 10
 * 不攔截任何 pan/zoom/click 事件，純視覺疊加。
 *
 * 包含：
 * - CSS border 羊皮紙框 + inset shadow 磨損暗角
 * - 四角銅角扣 SVG（L 型 + 3 鉚釘，scale 複用同一 path）
 *
 * ⚠️ SVG presentation attr（fill/stroke）不接受 CSS var()，全用字面 hex 色值。
 */

import React from 'react';

const CORNER_SIZE = 40;

interface CornerBracketProps {
  style: React.CSSProperties;
  /** SVG <g> 的 transform（旋轉/翻轉） */
  svgTransform: string;
}

// 單個銅角扣 SVG。四角透過不同 svgTransform 複用。
const CornerBracket: React.FC<CornerBracketProps> = ({ style, svgTransform }) => (
  <svg
    width={CORNER_SIZE}
    height={CORNER_SIZE}
    viewBox="0 0 40 40"
    style={{
      position: 'absolute',
      pointerEvents: 'none',
      overflow: 'visible',
      ...style,
    }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="copper-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D4A030" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
    </defs>
    <g transform={svgTransform}>
      {/* 角架 L 型 */}
      <path
        d="M2,2 L2,36 L10,36 L10,12 L36,12 L36,2 Z"
        fill="url(#copper-grad)"
        stroke="#7A5C10"
        strokeWidth="0.8"
      />
      {/* 鉚釘 1（主角落） */}
      <circle cx="6" cy="6" r="2.5" fill="#D4A030" stroke="#8B6914" strokeWidth="0.6" />
      {/* 鉚釘 2（下臂） */}
      <circle cx="6" cy="28" r="1.8" fill="#C49028" stroke="#7A5C10" strokeWidth="0.5" />
      {/* 鉚釘 3（右臂） */}
      <circle cx="28" cy="6" r="1.8" fill="#C49028" stroke="#7A5C10" strokeWidth="0.5" />
    </g>
  </svg>
);

function BoardFrameOverlayInner() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        // 羊皮紙仿舊邊框（視覺，不佔 layout 空間）
        border: '10px solid oklch(0.65 0.05 70 / 0.85)',
        // 磨損暗角 inset shadow
        boxShadow:
          'inset 0 0 20px oklch(0.42 0.03 70 / 0.35), inset 0 0 8px oklch(0.35 0.04 65 / 0.25)',
      }}
    >
      {/* 左上角 — 無旋轉 */}
      <CornerBracket
        svgTransform="translate(0,0)"
        style={{ top: -10, left: -10 }}
      />
      {/* 右上角 — 水平鏡像（scaleX -1，translate 補回） */}
      <CornerBracket
        svgTransform="translate(40,0) scale(-1,1)"
        style={{ top: -10, right: -10 }}
      />
      {/* 左下角 — 垂直鏡像 */}
      <CornerBracket
        svgTransform="translate(0,40) scale(1,-1)"
        style={{ bottom: -10, left: -10 }}
      />
      {/* 右下角 — 180° (scaleX -1, scaleY -1) */}
      <CornerBracket
        svgTransform="translate(40,40) scale(-1,-1)"
        style={{ bottom: -10, right: -10 }}
      />
    </div>
  );
}

export const BoardFrameOverlay = React.memo(BoardFrameOverlayInner);

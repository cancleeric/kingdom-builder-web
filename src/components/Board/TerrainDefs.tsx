/**
 * TerrainDefs — 共用 SVG <defs> 集中管理
 *
 * R24-A 工藝美術版：
 * - 21 個地形 linearGradient（7 地形 × A/B/C 明度變體）
 *   方向左上→右下（x1=0.15 y1=0 x2=0.85 y2=1），模擬方向光微景深（非球面）
 * - light-overlay：左上柔光疊層，疊底色上方給平磚微景深
 * - grain-overlay feTurbulence filter：套在容器 <g> 層一次（O(1) 效能方案）
 * - center-feather-mask：中心羽化遮罩（r≈15px 安全區留棋子）
 * - 21 個升級手繪 motif symbol（7 地形 × A/B/C）
 *
 * ⚠️ SVG presentation attr 不吃 CSS var() → 全部用實際色值 #RRGGBB
 * ⚠️ 所有定義只在此處出現一次，HexCell 只透過 url(#...) / <use> 引用
 */

import React from 'react';

// HEX_SIZE = 30，pointy-top。
// Symbol viewBox 對齊六邊形 bounding box：W ≈ 2*30*sin60° ≈ 52，H = 2*30 = 60
const MOTIF_W = 52;
const MOTIF_H = 60;
const MOTIF_VB = `0 0 ${MOTIF_W} ${MOTIF_H}`;

export const TerrainDefs: React.FC = () => (
  <defs>
    {/* ══════════════════════════════════════════════════════════════════════
        21 個地形底色 linearGradient（7 地形 × A/B/C 明度變體）
        方向：左上→右下（x1=0.15 y1=0 x2=0.85 y2=1），模擬方向光微景深
        A（亮）/ B（中）/ C（暗），明度差 ±10–15%
        ══════════════════════════════════════════════════════════════════════ */}

    {/* 草原 Grass — 基底 #7ABF5E */}
    <linearGradient id="grad-Grass-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#92D470" />
      <stop offset="100%" stopColor="#6AAF4E" />
    </linearGradient>
    <linearGradient id="grad-Grass-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#7ABF5E" />
      <stop offset="100%" stopColor="#5EAF44" />
    </linearGradient>
    <linearGradient id="grad-Grass-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#68A84E" />
      <stop offset="100%" stopColor="#509838" />
    </linearGradient>

    {/* 森林 Forest — 基底 #2D7A2D */}
    <linearGradient id="grad-Forest-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#357A35" />
      <stop offset="100%" stopColor="#205220" />
    </linearGradient>
    <linearGradient id="grad-Forest-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#2D7A2D" />
      <stop offset="100%" stopColor="#1A5A1A" />
    </linearGradient>
    <linearGradient id="grad-Forest-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#226222" />
      <stop offset="100%" stopColor="#124512" />
    </linearGradient>

    {/* 沙漠 Desert — 基底 #E8A84A */}
    <linearGradient id="grad-Desert-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#F0B85A" />
      <stop offset="100%" stopColor="#D09040" />
    </linearGradient>
    <linearGradient id="grad-Desert-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#E8A84A" />
      <stop offset="100%" stopColor="#C89038" />
    </linearGradient>
    <linearGradient id="grad-Desert-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#D89838" />
      <stop offset="100%" stopColor="#B87828" />
    </linearGradient>

    {/* 花田 Flower — 基底 #F06080 */}
    <linearGradient id="grad-Flower-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#F87898" />
      <stop offset="100%" stopColor="#E04870" />
    </linearGradient>
    <linearGradient id="grad-Flower-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#F06080" />
      <stop offset="100%" stopColor="#D84868" />
    </linearGradient>
    <linearGradient id="grad-Flower-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#D85070" />
      <stop offset="100%" stopColor="#C03860" />
    </linearGradient>

    {/* 峽谷 Canyon — 基底 #C05020 */}
    <linearGradient id="grad-Canyon-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#D06030" />
      <stop offset="100%" stopColor="#A84018" />
    </linearGradient>
    <linearGradient id="grad-Canyon-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#C05020" />
      <stop offset="100%" stopColor="#9C3C14" />
    </linearGradient>
    <linearGradient id="grad-Canyon-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#A84418" />
      <stop offset="100%" stopColor="#8A300C" />
    </linearGradient>

    {/* 水域 Water — 基底 #3A74B0 */}
    <linearGradient id="grad-Water-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#4A84C0" />
      <stop offset="100%" stopColor="#2C64A0" />
    </linearGradient>
    <linearGradient id="grad-Water-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#3A74B0" />
      <stop offset="100%" stopColor="#2A5C98" />
    </linearGradient>
    <linearGradient id="grad-Water-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#2E64A0" />
      <stop offset="100%" stopColor="#1E4C88" />
    </linearGradient>

    {/* 山脈 Mountain — 基底 #888888 */}
    <linearGradient id="grad-Mountain-a" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#9C9C9C" />
      <stop offset="100%" stopColor="#787878" />
    </linearGradient>
    <linearGradient id="grad-Mountain-b" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#888888" />
      <stop offset="100%" stopColor="#686868" />
    </linearGradient>
    <linearGradient id="grad-Mountain-c" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#787878" />
      <stop offset="100%" stopColor="#585858" />
    </linearGradient>

    {/* ── 左上柔光疊層（light-overlay）
        套在底色 polygon 上方、motif 下方，給平磚方向感（非球面）
        左上 18% 白 → 中 4% 白 → 右下 8% 黑 ── */}
    <linearGradient id="light-overlay" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.04" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
    </linearGradient>

    {/* ── feTurbulence 顆粒 grain filter（容器層套用一次，O(1) 效能方案）
        套在 HexGrid 容器 <g> 而非每格，402 格共用一次計算 ── */}
    <filter id="grain-overlay" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3"
                    stitchTiles="stitch" result="noiseOut" seed={42} />
      <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise" />
      <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
      <feComposite in="blended" in2="SourceGraphic" operator="in" />
    </filter>

    {/* ── Feather center mask：中心透明（留棋子 r≈15 空間），邊緣不透明（顯示 motif）
        R24 微調過渡更自然（0→40% 全透明，65% 半透，100% 幾乎不透）── */}
    <radialGradient id="feather-mask-grad" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
    </radialGradient>

    <mask id="center-feather-mask">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#feather-mask-grad)" />
    </mask>

    {/* ══════════════════════════════════════════════════════════════════════
        21 個升級手繪 motif symbol（7 地形 × A/B/C）
        viewBox="0 0 52 60"，中心 (26,30)，半徑 15px 安全區不放元素
        筆觸色比底色深 20–30%，線寬 1.2–2px
        套 center-feather-mask，中心自然淡出
        ══════════════════════════════════════════════════════════════════════ */}

    {/* ────────── 草原 Grass ──────────
        草簇（短線叢，筆觸感）+ 野花（有花瓣形，非圓點）
        A: 左+右草叢 + 3 朵黃白花，B: 中間偏右草叢 + 2 朵花，C: 分散草叢 + 4 朵花 */}

    {/* Grass-a：草簇左、右各一叢 + 3 朵野花 */}
    <symbol id="motif-Grass-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 左草叢 */}
      <g opacity="0.9">
        <path d="M7,54 L8,44 L9,54" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M9,54 L11,42 L13,54" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M11,54 L10,46 L13,52" stroke="#4EA04E" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M8,54 L7,48 L6,53" stroke="#4EA04E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      {/* 右草叢 */}
      <g opacity="0.9">
        <path d="M39,54 L40,44 L41,54" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M41,54 L43,42 L45,54" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M43,54 L42,47 L45,52" stroke="#4EA04E" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
      {/* 野花 1（黃色，左下）—— 橢圓花瓣 */}
      <g transform="translate(6,47)">
        <ellipse cx="0" cy="-3.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" />
        <ellipse cx="3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(60,3,-1.5)" />
        <ellipse cx="3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(120,3,1.5)" />
        <ellipse cx="0" cy="3.5" rx="1.8" ry="2.8" fill="#EEC83A" opacity="0.9" />
        <ellipse cx="-3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-120,-3,1.5)" />
        <ellipse cx="-3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-60,-3,-1.5)" />
        <circle cx="0" cy="0" r="1.8" fill="#E8880A" />
      </g>
      {/* 野花 2（白色，右下） */}
      <g transform="translate(46,46)">
        <ellipse cx="0" cy="-3" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.95" />
        <ellipse cx="2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(60,2.6,-1.5)" />
        <ellipse cx="2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(120,2.6,1.5)" />
        <ellipse cx="0" cy="3" rx="1.6" ry="2.5" fill="#E8E8DC" opacity="0.9" />
        <ellipse cx="-2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-120,-2.6,1.5)" />
        <ellipse cx="-2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-60,-2.6,-1.5)" />
        <circle cx="0" cy="0" r="1.5" fill="#F5C83A" />
      </g>
      {/* 野花 3（淡黃，中右）—— 小花 */}
      <g transform="translate(35,56)">
        <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" />
        <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(60,2.2,-1.2)" />
        <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(120,2.2,1.2)" />
        <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#EEC83A" opacity="0.85" />
        <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(-120,-2.2,1.2)" />
        <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(-60,-2.2,-1.2)" />
        <circle cx="0" cy="0" r="1.4" fill="#E8880A" />
      </g>
    </symbol>

    {/* Grass-b：中央偏左草叢 + 2 朵花（位置差異） */}
    <symbol id="motif-Grass-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 左草叢（略偏）*/}
      <g opacity="0.9">
        <path d="M5,55 L7,43 L9,55" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M9,55 L10,41 L12,55" stroke="#3A8C3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M12,55 L11,45 L14,53" stroke="#4EA04E" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </g>
      {/* 右草叢（更靠邊）*/}
      <g opacity="0.85">
        <path d="M40,55 L41,45 L43,55" stroke="#3A8C3A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M43,55 L44,42 L46,55" stroke="#3A8C3A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M45,54 L44,48 L47,53" stroke="#4EA04E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M41,55 L40,49 L38,54" stroke="#4EA04E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      {/* 底部草 */}
      <g opacity="0.7">
        <path d="M22,57 L23,50 L24,57" stroke="#3A8C3A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M27,57 L28,49 L30,57" stroke="#4EA04E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      {/* 野花 1（白，右上區） */}
      <g transform="translate(43,47)">
        <ellipse cx="0" cy="-3" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.95" />
        <ellipse cx="2.6" cy="-1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(60,2.6,-1.5)" />
        <ellipse cx="2.6" cy="1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(120,2.6,1.5)" />
        <ellipse cx="0" cy="3" rx="1.5" ry="2.4" fill="#E8E8D0" opacity="0.9" />
        <ellipse cx="-2.6" cy="1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(-120,-2.6,1.5)" />
        <ellipse cx="-2.6" cy="-1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(-60,-2.6,-1.5)" />
        <circle cx="0" cy="0" r="1.5" fill="#F0C020" />
      </g>
      {/* 野花 2（黃，左下） */}
      <g transform="translate(9,55)">
        <ellipse cx="0" cy="-2.8" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.92" />
        <ellipse cx="2.4" cy="-1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(60,2.4,-1.4)" />
        <ellipse cx="2.4" cy="1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(120,2.4,1.4)" />
        <ellipse cx="0" cy="2.8" rx="1.5" ry="2.3" fill="#ECC030" opacity="0.88" />
        <ellipse cx="-2.4" cy="1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(-120,-2.4,1.4)" />
        <ellipse cx="-2.4" cy="-1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(-60,-2.4,-1.4)" />
        <circle cx="0" cy="0" r="1.5" fill="#DC8010" />
      </g>
    </symbol>

    {/* Grass-c：散佈三叢 + 4 朵花（最豐富） */}
    <symbol id="motif-Grass-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 左草叢 */}
      <g opacity="0.88">
        <path d="M5,56 L6,45 L8,56" stroke="#3A8C3A" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M8,56 L9,43 L11,56" stroke="#3A8C3A" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M7,56 L6,49 L5,55" stroke="#4EA04E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      {/* 中右草叢 */}
      <g opacity="0.88">
        <path d="M32,56 L33,44 L35,56" stroke="#3A8C3A" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M35,56 L37,42 L38,56" stroke="#3A8C3A" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M34,55 L33,47 L32,54" stroke="#4EA04E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      {/* 右邊零散草 */}
      <g opacity="0.75">
        <path d="M44,55 L45,47 L46,55" stroke="#3A8C3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M46,55 L47,49 L48,54" stroke="#4EA04E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      {/* 花 1 黃（左下） */}
      <g transform="translate(8,52)">
        <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.95" />
        <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(60,2.2,-1.2)" />
        <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(120,2.2,1.2)" />
        <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#ECC030" opacity="0.9" />
        <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(-120,-2.2,1.2)" />
        <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(-60,-2.2,-1.2)" />
        <circle cx="0" cy="0" r="1.4" fill="#E08010" />
      </g>
      {/* 花 2 白（中） */}
      <g transform="translate(22,54)">
        <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.92" />
        <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(60,2.2,-1.2)" />
        <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(120,2.2,1.2)" />
        <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#E8E4C8" opacity="0.88" />
        <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(-120,-2.2,1.2)" />
        <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(-60,-2.2,-1.2)" />
        <circle cx="0" cy="0" r="1.4" fill="#F0BC20" />
      </g>
      {/* 花 3 淡黃（右） */}
      <g transform="translate(40,50)">
        <ellipse cx="0" cy="-2.2" rx="1.3" ry="2" fill="#FAE060" opacity="0.9" />
        <ellipse cx="2" cy="-1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(60,2,-1)" />
        <ellipse cx="2" cy="1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(120,2,1)" />
        <ellipse cx="0" cy="2.2" rx="1.3" ry="2" fill="#ECD050" opacity="0.85" />
        <ellipse cx="-2" cy="1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(-120,-2,1)" />
        <ellipse cx="-2" cy="-1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(-60,-2,-1)" />
        <circle cx="0" cy="0" r="1.3" fill="#E08820" />
      </g>
      {/* 花 4 白（右下） */}
      <g transform="translate(46,55)">
        <ellipse cx="0" cy="-2.2" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.9" />
        <ellipse cx="1.9" cy="-1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(60,1.9,-1.1)" />
        <ellipse cx="1.9" cy="1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(120,1.9,1.1)" />
        <ellipse cx="0" cy="2.2" rx="1.3" ry="2" fill="#ECE8D0" opacity="0.85" />
        <ellipse cx="-1.9" cy="1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(-120,-1.9,1.1)" />
        <ellipse cx="-1.9" cy="-1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(-60,-1.9,-1.1)" />
        <circle cx="0" cy="0" r="1.3" fill="#F0B818" />
      </g>
    </symbol>

    {/* ────────── 森林 Forest ──────────
        雲朵形樹冠（連圓 path，非三角形）+ 樹幹一截 + 落葉幾片
        A: 2 棵前景+1 後景，B: 3 棵不同高度，C: 2 棵+更多落葉 */}

    {/* Forest-a：左+右前景樹（雲朵冠）+ 中後景小樹 + 落葉 */}
    <symbol id="motif-Forest-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 後景小樹（略灰）*/}
      <g opacity="0.55">
        <rect x="24" y="34" width="3" height="8" fill="#1A4C1A" />
        <path d="M25.5,20 C20,20 17,24 17,28 C17,30 18,32 20,33 C18,33 16,35 16,37 C16,39 18,40 20,40 C18,40 21,34 25.5,34 C30,34 33,40 31,40 C33,40 35,39 35,37 C35,35 33,33 31,33 C33,32 34,30 34,28 C34,24 31,20 25.5,20 Z"
          fill="#1E5C1E" />
      </g>
      {/* 左前景樹 */}
      <rect x="7" y="36" width="3.5" height="10" fill="#1A3C1A" opacity="0.9" />
      <path d="M8.75,18 C4,18 2,22 2,26 C2,28.5 3.2,30.5 5,31.5 C3,31.5 1.5,33.5 1.5,35.5 C1.5,37.5 3,39 5,39 C3.5,39 8.75,37 8.75,37 C8.75,37 14,39 12.5,39 C14.5,39 16,37.5 16,35.5 C16,33.5 14.5,31.5 12.5,31.5 C14.3,30.5 15.5,28.5 15.5,26 C15.5,22 13.5,18 8.75,18 Z"
        fill="#1E641E" opacity="0.92" />
      {/* 右前景樹 */}
      <rect x="39" y="36" width="3.5" height="10" fill="#1A3C1A" opacity="0.9" />
      <path d="M40.75,16 C36,16 34,20 34,24 C34,26.5 35.2,28.5 37,29.5 C35,29.5 33.5,31.5 33.5,33.5 C33.5,35.5 35,37 37,37 C35.5,37 40.75,35 40.75,35 C40.75,35 46,37 44.5,37 C46.5,37 48,35.5 48,33.5 C48,31.5 46.5,29.5 44.5,29.5 C46.3,28.5 47.5,26.5 47.5,24 C47.5,20 45.5,16 40.75,16 Z"
        fill="#165C16" opacity="0.95" />
      {/* 落葉 */}
      <ellipse cx="18" cy="44" rx="2.5" ry="1.5" fill="#3A7A1A" opacity="0.7" transform="rotate(-15,18,44)" />
      <ellipse cx="32" cy="46" rx="2" ry="1.2" fill="#2E6A14" opacity="0.65" transform="rotate(20,32,46)" />
      <ellipse cx="24" cy="48" rx="1.8" ry="1" fill="#3A7A1A" opacity="0.6" transform="rotate(-8,24,48)" />
    </symbol>

    {/* Forest-b：三棵高低不同的雲朵樹 */}
    <symbol id="motif-Forest-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 左小樹 */}
      <rect x="6" y="38" width="3" height="8" fill="#1A3C1A" opacity="0.85" />
      <path d="M7.5,24 C4,24 2,27 2,30 C2,32 3,33.5 4.5,34 C3,34 2,35.5 2,37 C2,38.5 3,39.5 4.5,39.5 C3.5,39.5 7.5,38 7.5,38 C7.5,38 11.5,39.5 10.5,39.5 C12,39.5 13,38.5 13,37 C13,35.5 12,34 10.5,34 C12,33.5 13,32 13,30 C13,27 11,24 7.5,24 Z"
        fill="#226222" opacity="0.88" />
      {/* 中央高樹（最高，前景） */}
      <rect x="22.5" y="34" width="4" height="12" fill="#142814" opacity="0.95" />
      <path d="M24.5,12 C19,12 16,17 16,21 C16,24 17.5,26 19.5,27 C17,27 15,29.5 15,32 C15,34.5 17,36.5 19.5,36.5 C17.5,36.5 24.5,34 24.5,34 C24.5,34 31.5,36.5 29.5,36.5 C32,36.5 34,34.5 34,32 C34,29.5 32,27 29.5,27 C31.5,26 33,24 33,21 C33,17 30,12 24.5,12 Z"
        fill="#1A5A1A" opacity="0.97" />
      {/* 右中樹 */}
      <rect x="40" y="37" width="3.5" height="9" fill="#1A3C1A" opacity="0.88" />
      <path d="M41.75,20 C37.5,20 35.5,24 35.5,27.5 C35.5,29.5 36.5,31 38,31.5 C36.5,31.5 35.5,33 35.5,34.5 C35.5,36 36.5,37 38,37 C36.8,37 41.75,35.5 41.75,35.5 C41.75,35.5 46.7,37 45.5,37 C47,37 48,36 48,34.5 C48,33 47,31.5 45.5,31.5 C47,31 48,29.5 48,27.5 C48,24 46,20 41.75,20 Z"
        fill="#1E6020" opacity="0.92" />
      {/* 落葉 */}
      <ellipse cx="16" cy="45" rx="2.2" ry="1.3" fill="#2E6A14" opacity="0.68" transform="rotate(25,16,45)" />
      <ellipse cx="36" cy="47" rx="2.5" ry="1.4" fill="#3A7A1A" opacity="0.65" transform="rotate(-18,36,47)" />
    </symbol>

    {/* Forest-c：2 棵樹冠 + 豐富落葉 */}
    <symbol id="motif-Forest-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 左前景樹（較矮，樹冠寬） */}
      <rect x="7" y="38" width="4" height="10" fill="#1A3C1A" opacity="0.9" />
      <path d="M9,17 C3.5,17 1,21.5 1,25.5 C1,28 2.5,30 4.5,31 C2.5,31 0.5,33 0.5,35 C0.5,37 2,38.5 4.5,38.5 C2.8,38.5 9,37 9,37 C9,37 15.2,38.5 13.5,38.5 C16,38.5 17.5,37 17.5,35 C17.5,33 15.5,31 13.5,31 C15.5,30 17,28 17,25.5 C17,21.5 14.5,17 9,17 Z"
        fill="#1E6422" opacity="0.93" />
      {/* 右前景樹（略高） */}
      <rect x="39" y="36" width="4" height="12" fill="#142814" opacity="0.9" />
      <path d="M41,14 C35.5,14 33,18.5 33,22.5 C33,25 34.5,27 36.5,28 C34.5,28 32.5,30 32.5,32 C32.5,34 34,35.5 36.5,35.5 C34.8,35.5 41,34 41,34 C41,34 47.2,35.5 45.5,35.5 C48,35.5 49.5,34 49.5,32 C49.5,30 47.5,28 45.5,28 C47.5,27 49,25 49,22.5 C49,18.5 46.5,14 41,14 Z"
        fill="#185A1A" opacity="0.95" />
      {/* 豐富落葉 */}
      <ellipse cx="19" cy="44" rx="2.8" ry="1.5" fill="#3A7A1A" opacity="0.72" transform="rotate(-22,19,44)" />
      <ellipse cx="28" cy="47" rx="2.2" ry="1.2" fill="#2E6A14" opacity="0.65" transform="rotate(12,28,47)" />
      <ellipse cx="36" cy="45" rx="2" ry="1.1" fill="#3A7A1A" opacity="0.6" transform="rotate(30,36,45)" />
      <ellipse cx="14" cy="48" rx="1.6" ry="0.9" fill="#224C12" opacity="0.55" transform="rotate(-5,14,48)" />
      <ellipse cx="44" cy="48" rx="1.8" ry="1" fill="#2E6014" opacity="0.58" transform="rotate(-25,44,48)" />
    </symbol>

    {/* ────────── 沙漠 Desert ──────────
        沙紋弧線（3–4 條）+ 仙人掌（縮小 ~40%、霧綠低飽和、每格 1 個、偏磚邊）+ 碎石
        A: 左偏小仙人掌+沙紋+碎石，B: 右偏小仙人掌+沙紋+碎石，C: 偏右小仙人掌+沙紋 */}

    {/* Desert-a：左偏小仙人掌 + 3 條沙紋 + 2 碎石 */}
    <symbol id="motif-Desert-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 沙紋弧線 */}
      <path d="M5,44 Q12,41 19,44 Q26,41 33,44 Q40,41 47,44"
        stroke="#A87828" strokeWidth="1.4" fill="none" opacity="0.65" />
      <path d="M4,50 Q12,47 20,50 Q28,47 36,50 Q43,47 48,50"
        stroke="#9A6C20" strokeWidth="1.3" fill="none" opacity="0.6" />
      <path d="M7,56 Q15,53 23,56 Q31,53 39,56 Q44,53 48,56"
        stroke="#8C6018" strokeWidth="1.1" fill="none" opacity="0.5" />
      {/* 左偏小仙人掌（縮 ~40%，霧綠，偏左磚邊，opacity 0.7） */}
      <g transform="translate(9,38) scale(0.6)" opacity="0.7">
        {/* 主幹 */}
        <rect x="-3.5" y="0" width="7" height="18" rx="3.5" fill="#6B8E5A" />
        {/* 右側臂 */}
        <path d="M3.5,5 Q11,3 12,9 Q13,14 9,14" stroke="#6B8E5A" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="8" y="8" width="5" height="7" rx="2.5" fill="#6B8E5A" />
        {/* 頂刺 */}
        <line x1="0" y1="0" x2="0" y2="-3" stroke="#4E6E40" strokeWidth="1.2" />
        <line x1="-3" y1="2" x2="-5" y2="0" stroke="#4E6E40" strokeWidth="1" />
      </g>
      {/* 碎石 */}
      <ellipse cx="7" cy="52" rx="3.5" ry="2" fill="#8A5818" opacity="0.6" transform="rotate(10,7,52)" />
      <ellipse cx="44" cy="54" rx="2.8" ry="1.6" fill="#7A4E14" opacity="0.55" transform="rotate(-8,44,54)" />
    </symbol>

    {/* Desert-b：右偏小仙人掌 + 4 條沙紋 + 3 碎石 */}
    <symbol id="motif-Desert-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 沙紋（稍微不同弧度）*/}
      <path d="M4,42 Q11,39 18,42 Q25,38 32,42 Q39,39 46,42"
        stroke="#A87828" strokeWidth="1.4" fill="none" opacity="0.62" />
      <path d="M3,48 Q11,44 20,48 Q28,45 36,48 Q43,45 49,48"
        stroke="#9A6C20" strokeWidth="1.3" fill="none" opacity="0.58" />
      <path d="M5,54 Q13,51 22,54 Q30,51 38,54 Q44,52 48,54"
        stroke="#8C6018" strokeWidth="1.1" fill="none" opacity="0.5" />
      <path d="M9,58 Q17,55 26,58 Q34,55 42,58"
        stroke="#7A5414" strokeWidth="0.9" fill="none" opacity="0.42" />
      {/* 右偏小仙人掌（縮 ~40%，霧綠，偏右磚邊，opacity 0.7） */}
      <g transform="translate(40,36) scale(0.6)" opacity="0.7">
        {/* 主幹 */}
        <rect x="-3.5" y="0" width="7" height="20" rx="3.5" fill="#7D9471" />
        {/* 左側臂 */}
        <path d="M-3.5,6 Q-12,4 -13,11 Q-14,16 -10,16" stroke="#7D9471" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="-15" y="10" width="5" height="7" rx="2.5" fill="#7D9471" />
        {/* 頂刺 */}
        <line x1="0" y1="0" x2="0" y2="-3" stroke="#5A7050" strokeWidth="1.2" />
        <line x1="3.5" y1="2" x2="5.5" y2="0" stroke="#5A7050" strokeWidth="1" />
      </g>
      {/* 3 碎石 */}
      <ellipse cx="7" cy="50" rx="3" ry="1.8" fill="#8A5818" opacity="0.58" transform="rotate(15,7,50)" />
      <ellipse cx="46" cy="52" rx="2.5" ry="1.5" fill="#7A4E14" opacity="0.55" transform="rotate(-12,46,52)" />
      <ellipse cx="12" cy="56" rx="2" ry="1.2" fill="#704815" opacity="0.48" transform="rotate(5,12,56)" />
    </symbol>

    {/* Desert-c：右偏小仙人掌（單棵）+ 沙紋 + 碎石 */}
    <symbol id="motif-Desert-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 沙紋 */}
      <path d="M4,46 Q11,43 18,46 Q25,42 32,46 Q39,43 46,46"
        stroke="#A07020" strokeWidth="1.3" fill="none" opacity="0.6" />
      <path d="M5,52 Q13,49 21,52 Q29,49 37,52 Q43,50 48,52"
        stroke="#927018" strokeWidth="1.2" fill="none" opacity="0.55" />
      <path d="M8,58 Q16,55 25,58 Q33,55 41,58"
        stroke="#845E14" strokeWidth="1" fill="none" opacity="0.45" />
      {/* 單棵右偏小仙人掌（縮 ~40%，霧綠，opacity 0.7） */}
      <g transform="translate(38,32) scale(0.6)" opacity="0.7">
        {/* 主幹 */}
        <rect x="-3" y="0" width="6" height="20" rx="3" fill="#6B8E5A" />
        {/* 右側臂 */}
        <path d="M3,5 Q10,3 11,9" stroke="#6B8E5A" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="8" y="7" width="4" height="6" rx="2" fill="#6B8E5A" />
        {/* 左側臂 */}
        <path d="M-3,9 Q-9,7 -9,13" stroke="#6B8E5A" strokeWidth="4" fill="none" strokeLinecap="round" />
        <rect x="-11" y="11" width="4" height="5" rx="2" fill="#6B8E5A" />
        {/* 頂刺 */}
        <line x1="0" y1="0" x2="0" y2="-3" stroke="#4E6E40" strokeWidth="1.2" />
      </g>
      {/* 碎石 */}
      <ellipse cx="12" cy="54" rx="3" ry="1.7" fill="#8A5818" opacity="0.55" transform="rotate(-8,12,54)" />
    </symbol>

    {/* ────────── 花田 Flower ──────────
        有花瓣的俯視小花（橢圓花瓣，非圓圈），3–5 朵
        A: 紅/紫/黃 3 朵，B: 紅/黃/橘 4 朵，C: 紫/粉/黃 5 朵 */}

    {/* Flower-a：紅/紫/黃 3 朵 */}
    <symbol id="motif-Flower-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 花 1（紅色，左下） */}
      <g transform="translate(10,48)">
        <ellipse cx="0" cy="-4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.95" />
        <ellipse cx="3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(60,3.8,-2)" />
        <ellipse cx="3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(120,3.8,2)" />
        <ellipse cx="0" cy="4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.9" />
        <ellipse cx="-3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(-120,-3.8,2)" />
        <ellipse cx="-3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(-60,-3.8,-2)" />
        <circle cx="0" cy="0" r="2.5" fill="#FFE840" />
      </g>
      {/* 花 2（紫色，右下） */}
      <g transform="translate(40,46)">
        <ellipse cx="0" cy="-4" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.95" />
        <ellipse cx="3.8" cy="-2" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.92" transform="rotate(60,3.8,-2)" />
        <ellipse cx="3.8" cy="2" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.92" transform="rotate(120,3.8,2)" />
        <ellipse cx="0" cy="4" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.9" />
        <ellipse cx="-3.8" cy="2" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.92" transform="rotate(-120,-3.8,2)" />
        <ellipse cx="-3.8" cy="-2" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.92" transform="rotate(-60,-3.8,-2)" />
        <circle cx="0" cy="0" r="2.5" fill="#FFE840" />
      </g>
      {/* 花 3（黃色，中下小）*/}
      <g transform="translate(25,53)">
        <ellipse cx="0" cy="-3.2" rx="2" ry="3" fill="#F0CC20" opacity="0.93" />
        <ellipse cx="3" cy="-1.6" rx="2" ry="3" fill="#E8BC18" opacity="0.9" transform="rotate(60,3,-1.6)" />
        <ellipse cx="3" cy="1.6" rx="2" ry="3" fill="#F0CC20" opacity="0.9" transform="rotate(120,3,1.6)" />
        <ellipse cx="0" cy="3.2" rx="2" ry="3" fill="#E8BC18" opacity="0.88" />
        <ellipse cx="-3" cy="1.6" rx="2" ry="3" fill="#F0CC20" opacity="0.9" transform="rotate(-120,-3,1.6)" />
        <ellipse cx="-3" cy="-1.6" rx="2" ry="3" fill="#E8BC18" opacity="0.9" transform="rotate(-60,-3,-1.6)" />
        <circle cx="0" cy="0" r="2" fill="#A05808" />
      </g>
    </symbol>

    {/* Flower-b：紅/橘/黃/淡粉 4 朵（位置分散）*/}
    <symbol id="motif-Flower-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 花 1（橘紅，左） */}
      <g transform="translate(7,50)">
        <ellipse cx="0" cy="-3.5" rx="2.2" ry="3.2" fill="#F04820" opacity="0.95" />
        <ellipse cx="3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#E84018" opacity="0.92" transform="rotate(60,3.2,-1.8)" />
        <ellipse cx="3.2" cy="1.8" rx="2.2" ry="3.2" fill="#F04820" opacity="0.92" transform="rotate(120,3.2,1.8)" />
        <ellipse cx="0" cy="3.5" rx="2.2" ry="3.2" fill="#E84018" opacity="0.9" />
        <ellipse cx="-3.2" cy="1.8" rx="2.2" ry="3.2" fill="#F04820" opacity="0.92" transform="rotate(-120,-3.2,1.8)" />
        <ellipse cx="-3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#E84018" opacity="0.92" transform="rotate(-60,-3.2,-1.8)" />
        <circle cx="0" cy="0" r="2.2" fill="#FFE030" />
      </g>
      {/* 花 2（金黃，右）*/}
      <g transform="translate(44,44)">
        <ellipse cx="0" cy="-3.8" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.95" />
        <ellipse cx="3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.92" transform="rotate(60,3.5,-1.9)" />
        <ellipse cx="3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.92" transform="rotate(120,3.5,1.9)" />
        <ellipse cx="0" cy="3.8" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.9" />
        <ellipse cx="-3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.92" transform="rotate(-120,-3.5,1.9)" />
        <ellipse cx="-3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.92" transform="rotate(-60,-3.5,-1.9)" />
        <circle cx="0" cy="0" r="2.3" fill="#884810" />
      </g>
      {/* 花 3（紅，右下）*/}
      <g transform="translate(38,53)">
        <ellipse cx="0" cy="-3" rx="2" ry="2.8" fill="#DC2850" opacity="0.93" />
        <ellipse cx="2.8" cy="-1.5" rx="2" ry="2.8" fill="#CC2048" opacity="0.9" transform="rotate(60,2.8,-1.5)" />
        <ellipse cx="2.8" cy="1.5" rx="2" ry="2.8" fill="#DC2850" opacity="0.9" transform="rotate(120,2.8,1.5)" />
        <ellipse cx="0" cy="3" rx="2" ry="2.8" fill="#CC2048" opacity="0.88" />
        <ellipse cx="-2.8" cy="1.5" rx="2" ry="2.8" fill="#DC2850" opacity="0.9" transform="rotate(-120,-2.8,1.5)" />
        <ellipse cx="-2.8" cy="-1.5" rx="2" ry="2.8" fill="#CC2048" opacity="0.9" transform="rotate(-60,-2.8,-1.5)" />
        <circle cx="0" cy="0" r="2" fill="#FFE030" />
      </g>
      {/* 花 4（淡粉，左下）*/}
      <g transform="translate(15,54)">
        <ellipse cx="0" cy="-2.8" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.9" />
        <ellipse cx="2.5" cy="-1.4" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.88" transform="rotate(60,2.5,-1.4)" />
        <ellipse cx="2.5" cy="1.4" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.88" transform="rotate(120,2.5,1.4)" />
        <ellipse cx="0" cy="2.8" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.86" />
        <ellipse cx="-2.5" cy="1.4" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.88" transform="rotate(-120,-2.5,1.4)" />
        <ellipse cx="-2.5" cy="-1.4" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.88" transform="rotate(-60,-2.5,-1.4)" />
        <circle cx="0" cy="0" r="1.8" fill="#FFD830" />
      </g>
    </symbol>

    {/* Flower-c：紫/粉/黃/粉橘/深紅 5 朵（最豐富）*/}
    <symbol id="motif-Flower-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 花 1（深紫，左）*/}
      <g transform="translate(6,46)">
        <ellipse cx="0" cy="-3.5" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.95" />
        <ellipse cx="3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.92" transform="rotate(60,3.2,-1.8)" />
        <ellipse cx="3.2" cy="1.8" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.92" transform="rotate(120,3.2,1.8)" />
        <ellipse cx="0" cy="3.5" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.9" />
        <ellipse cx="-3.2" cy="1.8" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.92" transform="rotate(-120,-3.2,1.8)" />
        <ellipse cx="-3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.92" transform="rotate(-60,-3.2,-1.8)" />
        <circle cx="0" cy="0" r="2.2" fill="#FFE030" />
      </g>
      {/* 花 2（桃粉，右上）*/}
      <g transform="translate(43,42)">
        <ellipse cx="0" cy="-3.8" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.95" />
        <ellipse cx="3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#E06090" opacity="0.92" transform="rotate(60,3.5,-1.9)" />
        <ellipse cx="3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.92" transform="rotate(120,3.5,1.9)" />
        <ellipse cx="0" cy="3.8" rx="2.4" ry="3.5" fill="#E06090" opacity="0.9" />
        <ellipse cx="-3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.92" transform="rotate(-120,-3.5,1.9)" />
        <ellipse cx="-3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#E06090" opacity="0.92" transform="rotate(-60,-3.5,-1.9)" />
        <circle cx="0" cy="0" r="2.3" fill="#FFE840" />
      </g>
      {/* 花 3（黃，左下）*/}
      <g transform="translate(12,54)">
        <ellipse cx="0" cy="-3" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.93" />
        <ellipse cx="2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.9" transform="rotate(60,2.8,-1.5)" />
        <ellipse cx="2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.9" transform="rotate(120,2.8,1.5)" />
        <ellipse cx="0" cy="3" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.88" />
        <ellipse cx="-2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.9" transform="rotate(-120,-2.8,1.5)" />
        <ellipse cx="-2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.9" transform="rotate(-60,-2.8,-1.5)" />
        <circle cx="0" cy="0" r="1.9" fill="#904010" />
      </g>
      {/* 花 4（橘粉，右下）*/}
      <g transform="translate(40,52)">
        <ellipse cx="0" cy="-3" rx="1.9" ry="2.8" fill="#F09050" opacity="0.92" />
        <ellipse cx="2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#E88040" opacity="0.9" transform="rotate(60,2.8,-1.5)" />
        <ellipse cx="2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F09050" opacity="0.9" transform="rotate(120,2.8,1.5)" />
        <ellipse cx="0" cy="3" rx="1.9" ry="2.8" fill="#E88040" opacity="0.88" />
        <ellipse cx="-2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F09050" opacity="0.9" transform="rotate(-120,-2.8,1.5)" />
        <ellipse cx="-2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#E88040" opacity="0.9" transform="rotate(-60,-2.8,-1.5)" />
        <circle cx="0" cy="0" r="1.9" fill="#FFE030" />
      </g>
      {/* 花 5（深紅，中下）*/}
      <g transform="translate(26,55)">
        <ellipse cx="0" cy="-2.5" rx="1.6" ry="2.3" fill="#C01840" opacity="0.9" />
        <ellipse cx="2.3" cy="-1.2" rx="1.6" ry="2.3" fill="#B01038" opacity="0.88" transform="rotate(60,2.3,-1.2)" />
        <ellipse cx="2.3" cy="1.2" rx="1.6" ry="2.3" fill="#C01840" opacity="0.88" transform="rotate(120,2.3,1.2)" />
        <ellipse cx="0" cy="2.5" rx="1.6" ry="2.3" fill="#B01038" opacity="0.85" />
        <ellipse cx="-2.3" cy="1.2" rx="1.6" ry="2.3" fill="#C01840" opacity="0.88" transform="rotate(-120,-2.3,1.2)" />
        <ellipse cx="-2.3" cy="-1.2" rx="1.6" ry="2.3" fill="#B01038" opacity="0.88" transform="rotate(-60,-2.3,-1.2)" />
        <circle cx="0" cy="0" r="1.6" fill="#FFD820" />
      </g>
    </symbol>

    {/* ────────── 峽谷 Canyon ──────────
        沉積岩層（3–4 條水平分層線，略帶弧度）+ 谷底 V 形暗區 + 兩側岩壁色塊
        A: 4 條岩層 + 淺 V 谷，B: 3 條岩層 + 深 V 谷，C: 不等距岩層 + 中 V 谷 */}

    {/* Canyon-a：4 條岩層 + 淺 V 谷 */}
    <symbol id="motif-Canyon-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 左岩壁色塊 */}
      <polygon points="4,54 12,20 20,20 18,54" fill="#7A3010" opacity="0.78" />
      {/* 右岩壁色塊 */}
      <polygon points="48,54 40,20 32,20 34,54" fill="#7A3010" opacity="0.78" />
      {/* V 谷暗區（淺）*/}
      <path d="M18,54 L26,38 L34,54 Z" fill="#401808" opacity="0.55" />
      {/* 岩層線（4 條，略帶弧度）*/}
      <path d="M5,32 Q11,30 18,32" stroke="#C06838" strokeWidth="1.3" fill="none" opacity="0.72" />
      <path d="M5,39 Q11,37 18,39" stroke="#B85E30" strokeWidth="1.2" fill="none" opacity="0.68" />
      <path d="M5,46 Q11,44 18,46" stroke="#A85428" strokeWidth="1.1" fill="none" opacity="0.62" />
      <path d="M5,51 Q12,49 18,51" stroke="#9A4C22" strokeWidth="0.9" fill="none" opacity="0.55" />
      <path d="M34,32 Q41,30 47,32" stroke="#C06838" strokeWidth="1.3" fill="none" opacity="0.72" />
      <path d="M34,39 Q41,37 47,39" stroke="#B85E30" strokeWidth="1.2" fill="none" opacity="0.68" />
      <path d="M34,46 Q41,44 47,46" stroke="#A85428" strokeWidth="1.1" fill="none" opacity="0.62" />
      <path d="M34,51 Q40,49 47,51" stroke="#9A4C22" strokeWidth="0.9" fill="none" opacity="0.55" />
      {/* 縫隙裂線 */}
      <line x1="26" y1="20" x2="26" y2="38" stroke="#2A0C00" strokeWidth="2" opacity="0.45" />
    </symbol>

    {/* Canyon-b：3 條岩層 + 深 V 谷 */}
    <symbol id="motif-Canyon-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 左岩壁（稍窄）*/}
      <polygon points="3,54 13,18 22,18 20,54" fill="#6A280C" opacity="0.82" />
      {/* 右岩壁 */}
      <polygon points="49,54 39,18 30,18 32,54" fill="#6A280C" opacity="0.82" />
      {/* V 谷暗區（深）*/}
      <path d="M20,54 L26,32 L32,54 Z" fill="#300A00" opacity="0.7" />
      {/* 岩層線（3 條，間距較大）*/}
      <path d="M4,30 Q10,28 19,30" stroke="#C86030" strokeWidth="1.4" fill="none" opacity="0.75" />
      <path d="M4,40 Q10,38 19,40" stroke="#B85828" strokeWidth="1.3" fill="none" opacity="0.7" />
      <path d="M4,50 Q11,48 19,50" stroke="#A85020" strokeWidth="1.1" fill="none" opacity="0.62" />
      <path d="M33,30 Q42,28 48,30" stroke="#C86030" strokeWidth="1.4" fill="none" opacity="0.75" />
      <path d="M33,40 Q42,38 48,40" stroke="#B85828" strokeWidth="1.3" fill="none" opacity="0.7" />
      <path d="M33,50 Q41,48 48,50" stroke="#A85020" strokeWidth="1.1" fill="none" opacity="0.62" />
      {/* 裂縫 */}
      <line x1="26" y1="18" x2="26" y2="32" stroke="#1E0800" strokeWidth="2.5" opacity="0.5" />
      {/* 岩壁細紋 */}
      <path d="M6,24 Q9,22 12,24" stroke="#E08048" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M38,24 Q41,22 44,24" stroke="#E08048" strokeWidth="0.8" fill="none" opacity="0.5" />
    </symbol>

    {/* Canyon-c：不等距岩層 + 中 V 谷 */}
    <symbol id="motif-Canyon-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 左岩壁 */}
      <polygon points="5,54 14,22 21,22 19,54" fill="#722C10" opacity="0.80" />
      {/* 右岩壁 */}
      <polygon points="47,54 38,22 31,22 33,54" fill="#722C10" opacity="0.80" />
      {/* V 谷（中等深度）*/}
      <path d="M19,54 L26,40 L33,54 Z" fill="#380E02" opacity="0.62" />
      {/* 岩層（不等距：緊-鬆-中）*/}
      <path d="M6,27 Q12,25 19,27" stroke="#CA6432" strokeWidth="1.3" fill="none" opacity="0.72" />
      <path d="M6,33 Q12,31 19,33" stroke="#BA5C2A" strokeWidth="1.2" fill="none" opacity="0.68" />
      <path d="M6,43 Q12,41 19,43" stroke="#AA5222" strokeWidth="1.1" fill="none" opacity="0.64" />
      <path d="M6,50 Q12,48 19,50" stroke="#9A4A1A" strokeWidth="0.9" fill="none" opacity="0.56" />
      <path d="M33,27 Q40,25 46,27" stroke="#CA6432" strokeWidth="1.3" fill="none" opacity="0.72" />
      <path d="M33,33 Q40,31 46,33" stroke="#BA5C2A" strokeWidth="1.2" fill="none" opacity="0.68" />
      <path d="M33,43 Q40,41 46,43" stroke="#AA5222" strokeWidth="1.1" fill="none" opacity="0.64" />
      <path d="M33,50 Q40,48 46,50" stroke="#9A4A1A" strokeWidth="0.9" fill="none" opacity="0.56" />
      {/* 裂縫 */}
      <line x1="26" y1="22" x2="26" y2="40" stroke="#280800" strokeWidth="2" opacity="0.48" />
    </symbol>

    {/* ────────── 水域 Water ──────────
        流動水波（S/弧形多層，3–5 條）+ 光斑（短白弧線，opacity 0.6）+ 泡沫點
        A: 4 條波紋 + 2 光斑 + 2 泡沫，B: 5 條波紋 + 3 光斑，C: 3 大波紋 + 豐富泡沫 */}

    {/* Water-a：4 條波 + 2 光斑 + 2 泡沫 */}
    <symbol id="motif-Water-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 深色底層波（較寬）*/}
      <path d="M4,38 Q10,34 16,38 Q22,34 28,38 Q34,34 40,38 Q46,34 50,38"
        stroke="#4896D0" strokeWidth="2" fill="none" opacity="0.7" />
      {/* 中色波 */}
      <path d="M3,44 Q9,40 16,44 Q23,40 30,44 Q37,40 44,44 Q49,41 50,44"
        stroke="#58A0D8" strokeWidth="1.8" fill="none" opacity="0.68" />
      {/* 淺色波 */}
      <path d="M4,50 Q11,46 19,50 Q27,46 35,50 Q42,46 48,50"
        stroke="#68AADC" strokeWidth="1.5" fill="none" opacity="0.62" />
      {/* 最下波（細）*/}
      <path d="M7,56 Q14,52 22,56 Q30,52 38,56 Q43,53 47,56"
        stroke="#5898D0" strokeWidth="1.2" fill="none" opacity="0.52" />
      {/* 光斑（短白弧，opacity 0.6）*/}
      <path d="M9,41 Q12,39 15,41" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M34,47 Q38,45 42,47" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round" />
      {/* 泡沫點 */}
      <circle cx="22" cy="43" r="1.5" fill="#FFFFFF" opacity="0.45" />
      <circle cx="44" cy="51" r="1.2" fill="#FFFFFF" opacity="0.4" />
    </symbol>

    {/* Water-b：5 條波 + 3 光斑（波紋弧度不同）*/}
    <symbol id="motif-Water-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 5 條波紋（更密，弧度大）*/}
      <path d="M3,36 Q8,32 14,36 Q20,32 26,36 Q32,32 38,36 Q44,32 50,36"
        stroke="#4A90CC" strokeWidth="2" fill="none" opacity="0.72" />
      <path d="M2,41 Q8,37 15,41 Q22,37 29,41 Q36,37 43,41 Q48,38 51,41"
        stroke="#5498D4" strokeWidth="1.8" fill="none" opacity="0.68" />
      <path d="M2,46 Q8,42 16,46 Q24,42 32,46 Q40,42 48,46"
        stroke="#5CA0D8" strokeWidth="1.6" fill="none" opacity="0.64" />
      <path d="M3,51 Q10,47 18,51 Q26,47 34,51 Q42,47 49,51"
        stroke="#60A4DA" strokeWidth="1.4" fill="none" opacity="0.58" />
      <path d="M6,56 Q13,52 21,56 Q29,52 37,56 Q43,53 48,56"
        stroke="#5898CC" strokeWidth="1.1" fill="none" opacity="0.5" />
      {/* 光斑 */}
      <path d="M7,38 Q10,36 13,38" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.62" strokeLinecap="round" />
      <path d="M28,43 Q32,41 36,43" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.58" strokeLinecap="round" />
      <path d="M16,53 Q19,51 22,53" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.52" strokeLinecap="round" />
      {/* 泡沫 */}
      <circle cx="40" cy="39" r="1.5" fill="#FFFFFF" opacity="0.42" />
    </symbol>

    {/* Water-c：3 大寬波 + 豐富泡沫光斑 */}
    <symbol id="motif-Water-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 3 條大波（振幅大，線寬粗）*/}
      <path d="M2,38 Q8,32 15,38 Q22,32 29,38 Q36,32 43,38 Q48,33 51,38"
        stroke="#4488C4" strokeWidth="2.5" fill="none" opacity="0.7" />
      <path d="M2,47 Q9,41 17,47 Q25,41 33,47 Q41,41 49,47"
        stroke="#4C92CC" strokeWidth="2.2" fill="none" opacity="0.65" />
      <path d="M3,56 Q11,50 20,56 Q29,50 38,56 Q44,52 49,56"
        stroke="#5498D0" strokeWidth="1.8" fill="none" opacity="0.58" />
      {/* 光斑（多）*/}
      <path d="M6,41 Q9,39 12,41" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.65" strokeLinecap="round" />
      <path d="M22,35 Q25,33 28,35" stroke="#FFFFFF" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M38,44 Q42,42 46,44" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.58" strokeLinecap="round" />
      {/* 豐富泡沫 */}
      <circle cx="18" cy="43" r="1.8" fill="#FFFFFF" opacity="0.45" />
      <circle cx="34" cy="51" r="1.5" fill="#FFFFFF" opacity="0.42" />
      <circle cx="44" cy="42" r="1.2" fill="#FFFFFF" opacity="0.38" />
      <circle cx="10" cy="52" r="1" fill="#FFFFFF" opacity="0.35" />
    </symbol>

    {/* ────────── 山脈 Mountain ──────────
        不規則稜線山峰（path 折線輪廓，非等腰三角）+ 積雪冠（不規則白色 path）+ 山腳碎石
        A: 左高右低不規則雙峰，B: 中央單主峰，C: 三峰錯落 */}

    {/* Mountain-a：左高右低不規則雙峰 */}
    <symbol id="motif-Mountain-a" viewBox={MOTIF_VB} overflow="visible">
      {/* 左峰暗面（不規則） */}
      <path d="M4,54 L8,42 L12,36 L14,20 L16,36 L18,30 L20,52 Z" fill="#5A5A5A" opacity="0.88" />
      {/* 左峰亮面 */}
      <path d="M14,20 L16,36 L18,30 L22,52 L28,52 Z" fill="#A8A8A8" opacity="0.88" />
      {/* 右峰暗面（較矮）*/}
      <path d="M28,52 L30,42 L33,28 L35,42 L37,36 L40,52 Z" fill="#5A5A5A" opacity="0.85" />
      {/* 右峰亮面 */}
      <path d="M33,28 L35,42 L37,36 L44,52 L28,52 Z" fill="#9A9A9A" opacity="0.85" />
      {/* 左峰積雪（不規則）*/}
      <path d="M14,20 L11,26 L13,24 L15,27 L17,23 L19,27 L18,30 L16,36 Z" fill="#F0F0F0" opacity="0.95" />
      {/* 右峰積雪（小）*/}
      <path d="M33,28 L31,32 L33,30 L35,33 L36,30 L35,42 Z" fill="#EBEBEB" opacity="0.9" />
      {/* 山腳碎石 */}
      <ellipse cx="7" cy="54" rx="3" ry="1.5" fill="#484848" opacity="0.55" transform="rotate(8,7,54)" />
      <ellipse cx="45" cy="54" rx="2.5" ry="1.3" fill="#484848" opacity="0.5" transform="rotate(-5,45,54)" />
      <ellipse cx="26" cy="54" rx="2" ry="1.1" fill="#505050" opacity="0.48" />
    </symbol>

    {/* Mountain-b：中央高主峰 + 右側小峰 */}
    <symbol id="motif-Mountain-b" viewBox={MOTIF_VB} overflow="visible">
      {/* 右側小峰 */}
      <path d="M32,52 L36,36 L38,30 L40,36 L44,52 Z" fill="#686868" opacity="0.8" />
      <path d="M38,30 L40,36 L42,32 L44,52 Z" fill="#A0A0A0" opacity="0.78" />
      <path d="M38,30 L36,33 L38,31 L40,34 Z" fill="#E8E8E8" opacity="0.85" />
      {/* 主峰暗面 */}
      <path d="M4,54 L9,40 L13,30 L16,16 L18,30 L20,24 L22,52 Z" fill="#545454" opacity="0.92" />
      {/* 主峰亮面 */}
      <path d="M16,16 L18,30 L20,24 L24,52 L32,52 Z" fill="#AEAEAE" opacity="0.92" />
      {/* 主峰積雪（不規則斑）*/}
      <path d="M16,16 L13,22 L15,20 L17,24 L19,20 L21,25 L20,28 L18,30 L16,24 Z" fill="#F4F4F4" opacity="0.96" />
      {/* 山腳碎石 */}
      <ellipse cx="8" cy="54" rx="3.5" ry="1.8" fill="#484848" opacity="0.55" transform="rotate(12,8,54)" />
      <ellipse cx="28" cy="53" rx="2.2" ry="1.2" fill="#505050" opacity="0.48" transform="rotate(-3,28,53)" />
      <circle cx="46" cy="53" r="1.5" fill="#484848" opacity="0.45" />
    </symbol>

    {/* Mountain-c：三峰錯落（稜線各異）*/}
    <symbol id="motif-Mountain-c" viewBox={MOTIF_VB} overflow="visible">
      {/* 後景小峰（淡）*/}
      <path d="M20,52 L23,40 L26,24 L29,40 L32,52 Z" fill="#787878" opacity="0.65" />
      <path d="M26,24 L24,30 L26,27 L28,31 Z" fill="#E8E8E8" opacity="0.75" />
      {/* 左峰 */}
      <path d="M2,54 L6,42 L9,34 L11,22 L13,34 L16,28 L18,52 Z" fill="#525252" opacity="0.9" />
      <path d="M11,22 L13,34 L16,28 L20,52 L18,52 Z" fill="#ACACAC" opacity="0.9" />
      <path d="M11,22 L9,27 L11,25 L13,28 L14,25 L13,34 Z" fill="#F0F0F0" opacity="0.94" />
      {/* 右峰（最高）*/}
      <path d="M34,54 L37,38 L39,26 L41,14 L43,26 L45,20 L48,54 Z" fill="#4E4E4E" opacity="0.92" />
      <path d="M41,14 L43,26 L45,20 L48,54 Z" fill="#B0B0B0" opacity="0.9" />
      <path d="M41,14 L38,20 L40,18 L42,22 L43,18 L45,22 L43,26 L41,20 Z" fill="#F2F2F2" opacity="0.96" />
      {/* 碎石 */}
      <ellipse cx="5" cy="54" rx="2.5" ry="1.3" fill="#484848" opacity="0.52" transform="rotate(10,5,54)" />
      <ellipse cx="31" cy="54" rx="2" ry="1.1" fill="#505050" opacity="0.48" transform="rotate(-5,31,54)" />
      <circle cx="47" cy="54" r="1.4" fill="#484848" opacity="0.45" />
    </symbol>

  </defs>
);

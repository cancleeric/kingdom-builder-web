/**
 * TerrainDefs — 共用 SVG <defs> 集中管理
 *
 * R14 扁平化版本（對應 claude.ai/design R12）：
 * - 7 個地形 linearGradient：2-stop near-flat，上方略亮 / 下方略暗，無球面立體感
 * - 移除：sheen-top / vignette-grad / hex-vignette filter（三大塑膠感來源）
 * - 保留：center-feather-mask（中心留白給棋子 / icon）
 * - 7 個 <symbol> motif：全平塗，無 gradient / 無球面陰影
 *
 * ⚠️ 所有定義只在此處出現一次，HexCell 只透過 url(#...) / <use> 引用。
 */

import React from 'react';

// HEX_SIZE = 30，pointy-top。
// Symbol viewBox 對齊六邊形 bounding box：W ≈ 2*30*sin60° ≈ 52，H = 2*30 = 60
const MOTIF_W = 52;
const MOTIF_H = 60;
const MOTIF_VB = `0 0 ${MOTIF_W} ${MOTIF_H}`;

export const TerrainDefs: React.FC = () => (
  <defs>
    {/* ── 地形底色 linearGradient（near-flat，上方略亮／下方略暗，2-stop） ── */}

    {/* 草原 Grass：底色 #90EE90，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Grass" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#96F096" />
      <stop offset="100%" stopColor="#88E088" />
    </linearGradient>

    {/* 森林 Forest：底色 #228B22，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Forest" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#269426" />
      <stop offset="100%" stopColor="#1E7E1E" />
    </linearGradient>

    {/* 沙漠 Desert：底色 #F4A460，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Desert" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#F6AC68" />
      <stop offset="100%" stopColor="#E89450" />
    </linearGradient>

    {/* 花田 Flower：底色 #FFB6C1，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Flower" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFBEC8" />
      <stop offset="100%" stopColor="#F0A0AE" />
    </linearGradient>

    {/* 峽谷 Canyon：底色 #D2691E，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Canyon" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#D87224" />
      <stop offset="100%" stopColor="#C05E16" />
    </linearGradient>

    {/* 水域 Water：底色 #4682B4，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Water" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#4C8ABE" />
      <stop offset="100%" stopColor="#3E74A4" />
    </linearGradient>

    {/* 山脈 Mountain：底色 #909090，g0 提亮 4% → g1 壓暗 5% */}
    <linearGradient id="grad-Mountain" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#989898" />
      <stop offset="100%" stopColor="#848484" />
    </linearGradient>

    {/* ── Feather center mask：中心透明（留棋子 r≈14 空間），邊緣不透明（顯示 motif） ── */}
    <radialGradient id="feather-mask-grad" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.92" />
    </radialGradient>

    <mask id="center-feather-mask">
      <rect x="0" y="0" width="100%" height="100%" fill="url(#feather-mask-grad)" />
    </mask>

    {/* ══════════════════════════════════════════════
        7 地形 <symbol> motif（viewBox 0 0 52 60，pointy-top hex 外框）
        R14 平塗版：無 gradient / 無球面陰影，純平塗色塊 + 平塗線條。
        套 center-feather-mask 使中心自然淡出。
        ══════════════════════════════════════════════ */}

    {/* 草原 motif：平塗草葉，三叢散布下半區 */}
    <symbol id="motif-Grass" viewBox={MOTIF_VB} overflow="visible">
      {/* 左草叢 */}
      <g opacity="0.85">
        <path d="M7,52 L8,45 L9,52" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M9,52 L11,43 L13,52" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M11,52 L10,47 L13,52" stroke="#5CB85C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      {/* 中央草叢 */}
      <g opacity="0.85">
        <path d="M22,54 L23,46 L25,54" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M25,54 L26,44 L28,54" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M27,54 L26,48 L29,54" stroke="#5CB85C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
      {/* 右草叢 */}
      <g opacity="0.85">
        <path d="M38,52 L39,45 L41,52" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M41,52 L43,43 L44,52" stroke="#4A9E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M43,52 L42,47 L45,52" stroke="#5CB85C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    </symbol>

    {/* 森林 motif：平塗林冠杉樹，三棵純平塗三角 */}
    <symbol id="motif-Forest" viewBox={MOTIF_VB} overflow="visible">
      {/* 左杉樹 */}
      <polygon points="14,26 8,44 20,44" fill="#1A5C1A" opacity="0.9" />
      <polygon points="14,34 8,48 20,48" fill="#1A5C1A" opacity="0.85" />
      {/* 中央杉樹（較高） */}
      <polygon points="26,18 19,40 33,40" fill="#155A15" opacity="0.95" />
      <polygon points="26,30 18,50 34,50" fill="#155A15" opacity="0.88" />
      {/* 右杉樹 */}
      <polygon points="38,26 32,44 44,44" fill="#1A5C1A" opacity="0.9" />
      <polygon points="38,34 32,48 44,48" fill="#1A5C1A" opacity="0.85" />
    </symbol>

    {/* 沙漠 motif：平塗沙紋線（橫向波浪線條，無立體沙丘） */}
    <symbol id="motif-Desert" viewBox={MOTIF_VB} overflow="visible">
      <path d="M8,40 Q14,37 20,40 Q26,37 32,40 Q38,37 44,40"
        stroke="#C4803A" strokeWidth="1.4" fill="none" opacity="0.7" />
      <path d="M6,45 Q13,42 20,45 Q26,42 33,45 Q40,42 46,45"
        stroke="#C4803A" strokeWidth="1.4" fill="none" opacity="0.65" />
      <path d="M8,50 Q15,47 22,50 Q28,47 35,50 Q41,47 46,50"
        stroke="#A0612A" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M12,55 Q19,52 26,55 Q33,52 40,55"
        stroke="#A0612A" strokeWidth="1" fill="none" opacity="0.5" />
    </symbol>

    {/* 花田 motif：平塗花朵，三朵純平塗花瓣+黃心 */}
    <symbol id="motif-Flower" viewBox={MOTIF_VB} overflow="visible">
      {/* 花 1（左下） */}
      <g transform="translate(12,46)">
        <circle cx="0" cy="-4" r="3" fill="#FF9BA8" opacity="0.9" />
        <circle cx="3.5" cy="-2" r="3" fill="#FFB6C1" opacity="0.88" />
        <circle cx="3.5" cy="2" r="3" fill="#FF9BA8" opacity="0.88" />
        <circle cx="0" cy="4" r="3" fill="#FFB6C1" opacity="0.88" />
        <circle cx="-3.5" cy="2" r="3" fill="#FF9BA8" opacity="0.88" />
        <circle cx="-3.5" cy="-2" r="3" fill="#FFB6C1" opacity="0.88" />
        <circle cx="0" cy="0" r="2.5" fill="#FFE030" opacity="1" />
      </g>
      {/* 花 2（右下） */}
      <g transform="translate(40,44)">
        <circle cx="0" cy="-4" r="3" fill="#FFB6C1" opacity="0.9" />
        <circle cx="3.5" cy="-2" r="3" fill="#FF9BA8" opacity="0.88" />
        <circle cx="3.5" cy="2" r="3" fill="#FFB6C1" opacity="0.88" />
        <circle cx="0" cy="4" r="3" fill="#FF9BA8" opacity="0.88" />
        <circle cx="-3.5" cy="2" r="3" fill="#FFB6C1" opacity="0.88" />
        <circle cx="-3.5" cy="-2" r="3" fill="#FF9BA8" opacity="0.88" />
        <circle cx="0" cy="0" r="2.5" fill="#FFE030" opacity="1" />
      </g>
      {/* 花 3（中下，略小） */}
      <g transform="translate(26,50)">
        <circle cx="0" cy="-3.2" r="2.4" fill="#FF9BA8" opacity="0.88" />
        <circle cx="2.8" cy="-1.6" r="2.4" fill="#FFB6C1" opacity="0.88" />
        <circle cx="2.8" cy="1.6" r="2.4" fill="#FF9BA8" opacity="0.88" />
        <circle cx="0" cy="3.2" r="2.4" fill="#FFB6C1" opacity="0.88" />
        <circle cx="-2.8" cy="1.6" r="2.4" fill="#FF9BA8" opacity="0.88" />
        <circle cx="-2.8" cy="-1.6" r="2.4" fill="#FFB6C1" opacity="0.88" />
        <circle cx="0" cy="0" r="2" fill="#FFE030" opacity="1" />
      </g>
    </symbol>

    {/* 峽谷 motif：平塗岩壁色塊 + 平塗裂縫線，無球面陰影 */}
    <symbol id="motif-Canyon" viewBox={MOTIF_VB} overflow="visible">
      {/* 左岩壁 */}
      <polygon points="6,52 14,22 22,22 20,52" fill="#8B3A10" opacity="0.82" />
      {/* 右岩壁 */}
      <polygon points="46,52 38,22 30,22 32,52" fill="#8B3A10" opacity="0.82" />
      {/* 中央谷底色塊 */}
      <rect x="20" y="36" width="12" height="16" fill="#5A2000" opacity="0.6" rx="1" />
      {/* 岩理橫紋（平塗線） */}
      <path d="M7,36 L20,34" stroke="#C06030" strokeWidth="1" fill="none" opacity="0.65" />
      <path d="M7,42 L20,40" stroke="#C06030" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M7,48 L20,46" stroke="#C06030" strokeWidth="0.8" fill="none" opacity="0.55" />
      <path d="M32,34 L45,36" stroke="#C06030" strokeWidth="1" fill="none" opacity="0.65" />
      <path d="M32,40 L45,42" stroke="#C06030" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M32,46 L45,48" stroke="#C06030" strokeWidth="0.8" fill="none" opacity="0.55" />
      {/* 垂直裂縫 */}
      <line x1="26" y1="22" x2="26" y2="52" stroke="#3A1500" strokeWidth="2.5" opacity="0.5" />
    </symbol>

    {/* 水域 motif：平塗波紋線（無深水底層 / 無反光高光） */}
    <symbol id="motif-Water" viewBox={MOTIF_VB} overflow="visible">
      <path d="M8,40 Q14,37 20,40 Q26,37 32,40 Q38,37 44,40"
        stroke="#7ABCE8" strokeWidth="1.4" fill="none" opacity="0.75" />
      <path d="M6,45 Q13,42 20,45 Q26,42 33,45 Q40,42 46,45"
        stroke="#7ABCE8" strokeWidth="1.4" fill="none" opacity="0.7" />
      <path d="M8,50 Q15,47 22,50 Q29,47 36,50 Q42,47 46,50"
        stroke="#5FA0D0" strokeWidth="1.2" fill="none" opacity="0.65" />
      <path d="M12,55 Q18,52 24,55 Q30,52 36,55"
        stroke="#5FA0D0" strokeWidth="1" fill="none" opacity="0.55" />
    </symbol>

    {/* 山脈 motif：平塗雙峰（兩色平塗面 + 平塗白雪冠，無球面陰影） */}
    <symbol id="motif-Mountain" viewBox={MOTIF_VB} overflow="visible">
      {/* 左峰暗面 */}
      <polygon points="6,52 16,22 20,52" fill="#606060" opacity="0.9" />
      {/* 左峰亮面 */}
      <polygon points="16,22 26,52 20,52" fill="#ABABAB" opacity="0.9" />
      {/* 右峰暗面 */}
      <polygon points="46,52 36,20 32,52" fill="#606060" opacity="0.9" />
      {/* 右峰亮面 */}
      <polygon points="36,20 26,52 32,52" fill="#ABABAB" opacity="0.9" />
      {/* 左峰白雪冠（平塗） */}
      <polygon points="16,22 13,31 16,29 19,31" fill="#F5F5F5" opacity="0.95" />
      {/* 右峰白雪冠（平塗） */}
      <polygon points="36,20 33,29 36,27 39,29" fill="#F5F5F5" opacity="0.95" />
    </symbol>
  </defs>
);

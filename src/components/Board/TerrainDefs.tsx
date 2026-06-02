/**
 * TerrainDefs — 共用 SVG <defs> 集中管理
 *
 * 包含：
 * - 7 個地形 linearGradient（底色漸層，objectBoundingBox 自適應每格）
 * - 輔助 radialGradient（sheen / vignette 暗角）
 * - 1 個 feather-mask-grad + center-feather-mask（中心留白給棋子 / icon）
 * - 7 個 <symbol> motif（草叢 / 林冠 / 沙丘 / 花朵 / 岩裂 / 波光 / 雪峰）
 * - 1 個 hex-vignette filter（邊緣暗角）
 *
 * ⚠️ 所有定義只在此處出現一次，HexCell 只透過 url(#...) / <use> 引用。
 * 效能：400 格棋盤 400 個 <use> 引用 vs 每格 inline 重複定義。
 *
 * TODO: dark variant — add prefers-color-scheme media query for dark gradient ids
 */

import React from 'react';

// HEX_SIZE = 30，pointy-top。
// Symbol viewBox 對齊六邊形 bounding box：W ≈ 2*30*sin60° ≈ 52，H = 2*30 = 60
const MOTIF_W = 52;
const MOTIF_H = 60;
const MOTIF_VB = `0 0 ${MOTIF_W} ${MOTIF_H}`;

export const TerrainDefs: React.FC = () => (
  <defs>
    {/* ── 地形底色 linearGradient（objectBoundingBox → 自適應格子大小） ── */}

    {/* 草原 Grass：#90EE90 (亮) → #5CB85C (暗) */}
    <linearGradient id="grad-Grass" x1="0.2" y1="0" x2="0.8" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#B5F0B5" />
      <stop offset="45%" stopColor="#90EE90" />
      <stop offset="100%" stopColor="#4A9E4A" />
    </linearGradient>

    {/* 森林 Forest：#3CB83C (亮) → #1A5C1A (暗) */}
    <linearGradient id="grad-Forest" x1="0.2" y1="0" x2="0.8" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#4FC44F" />
      <stop offset="40%" stopColor="#228B22" />
      <stop offset="100%" stopColor="#0F4A0F" />
    </linearGradient>

    {/* 沙漠 Desert：#FCCB7A (受光金黃) → #C4803A (背陰) */}
    <linearGradient id="grad-Desert" x1="0.15" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFDFA0" />
      <stop offset="35%" stopColor="#F4A460" />
      <stop offset="100%" stopColor="#A0612A" />
    </linearGradient>

    {/* 花田 Flower：#FFD6DC (亮) → #E07888 (暗) */}
    <linearGradient id="grad-Flower" x1="0.2" y1="0" x2="0.8" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFE4EA" />
      <stop offset="45%" stopColor="#FFB6C1" />
      <stop offset="100%" stopColor="#D4606E" />
    </linearGradient>

    {/* 峽谷 Canyon：#E07A3A (受光) → #7A3A10 (深陰裂縫) */}
    <linearGradient id="grad-Canyon" x1="0.2" y1="0" x2="0.8" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#E89050" />
      <stop offset="40%" stopColor="#D2691E" />
      <stop offset="100%" stopColor="#7A3A0A" />
    </linearGradient>

    {/* 水域 Water：#7AACD6 (淺層) → #1A4A82 (深層) */}
    <linearGradient id="grad-Water" x1="0.3" y1="0" x2="0.7" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#A0C8E8" />
      <stop offset="40%" stopColor="#4682B4" />
      <stop offset="100%" stopColor="#1A3E78" />
    </linearGradient>

    {/* 山脈 Mountain：#C0C0C0 (受光) → #404040 (陰暗坡) */}
    <linearGradient id="grad-Mountain" x1="0.25" y1="0" x2="0.75" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#D8D8D8" />
      <stop offset="35%" stopColor="#909090" />
      <stop offset="100%" stopColor="#383838" />
    </linearGradient>

    {/* ── 頂部 sheen（受光高光覆蓋，疊在漸層上方） ── */}
    <linearGradient id="sheen-top" x1="0.5" y1="0" x2="0.5" y2="0.45" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>

    {/* ── Vignette 暗角（邊緣向中心透明） ── */}
    <radialGradient id="vignette-grad" cx="0.5" cy="0.5" r="0.55" gradientUnits="objectBoundingBox">
      <stop offset="60%" stopColor="#000000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
    </radialGradient>

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

    {/* ── 暗角 filter（polygon 層用） ── */}
    <filter id="hex-vignette" x="-5%" y="-5%" width="110%" height="110%">
      <feFlood floodColor="#000000" floodOpacity="0.22" result="flood" />
      <feComposite in="flood" in2="SourceGraphic" operator="in" result="vignetteFlood" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="vignetteFlood" />
      </feMerge>
    </filter>

    {/* ══════════════════════════════════════════════
        7 地形 <symbol> motif（viewBox 0 0 52 60，pointy-top hex 外框）
        每個 symbol 為立體紋理層，套 center-feather-mask 使中心自然淡出。
        ══════════════════════════════════════════════ */}

    {/* 草原 motif：三層草叢（陰影/受光/高光），散布於下半區 */}
    <symbol id="motif-Grass" viewBox={MOTIF_VB} overflow="visible">
      {/* 底部草叢陰影層 */}
      <g opacity="0.55">
        <ellipse cx="10" cy="52" rx="5" ry="2.5" fill="#2E7D2E" />
        <ellipse cx="26" cy="54" rx="5.5" ry="2.5" fill="#2E7D2E" />
        <ellipse cx="42" cy="51" rx="5" ry="2.5" fill="#2E7D2E" />
      </g>
      {/* 草叢受光層 */}
      <g opacity="0.9">
        {/* 左草叢 */}
        <path d="M7,50 Q8,44 9,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M9,50 Q11,42 12,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M11,50 Q10,46 13,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        {/* 中央草叢 */}
        <path d="M22,52 Q23,45 24,52" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M24,52 Q26,43 27,52" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M26,52 Q25,47 28,52" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        {/* 右草叢 */}
        <path d="M38,50 Q39,44 40,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M40,50 Q42,42 43,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
        <path d="M42,50 Q41,46 44,50" stroke="#5CB85C" strokeWidth="1.4" fill="none" />
      </g>
      {/* 高光草尖（白帶綠） */}
      <g opacity="0.7">
        <path d="M9,50 Q10,41 11,48" stroke="#C8FFCA" strokeWidth="0.8" fill="none" />
        <path d="M24,52 Q25,42 26,50" stroke="#C8FFCA" strokeWidth="0.8" fill="none" />
        <path d="M40,50 Q41,41 42,48" stroke="#C8FFCA" strokeWidth="0.8" fill="none" />
      </g>
    </symbol>

    {/* 森林 motif：俯瞰林冠杉樹，分亮面/暗面+立體投影+深色林間陰影 */}
    <symbol id="motif-Forest" viewBox={MOTIF_VB} overflow="visible">
      {/* 林間深色陰影地面 */}
      <ellipse cx="26" cy="54" rx="18" ry="4" fill="#0A2E0A" opacity="0.45" />
      {/* 杉樹投影 */}
      <ellipse cx="14" cy="50" rx="5" ry="2" fill="#0F3E0F" opacity="0.5" />
      <ellipse cx="26" cy="52" rx="6" ry="2.5" fill="#0F3E0F" opacity="0.5" />
      <ellipse cx="38" cy="50" rx="5" ry="2" fill="#0F3E0F" opacity="0.5" />
      {/* 左杉樹（暗面） */}
      <polygon points="14,24 9,40 19,40" fill="#1A5C1A" opacity="0.95" />
      <polygon points="14,32 8,44 20,44" fill="#1A5C1A" opacity="0.95" />
      {/* 左杉樹（亮面） */}
      <polygon points="14,24 14,40 19,40" fill="#3AA83A" opacity="0.9" />
      {/* 高光 */}
      <polygon points="14,24 13,30 15,30" fill="#70E070" opacity="0.7" />
      {/* 中央杉樹（暗面） */}
      <polygon points="26,18 20,38 32,38" fill="#155A15" opacity="0.95" />
      <polygon points="26,28 19,46 33,46" fill="#155A15" opacity="0.95" />
      {/* 中央亮面 */}
      <polygon points="26,18 26,38 32,38" fill="#3BB83B" opacity="0.9" />
      <polygon points="26,28 26,46 33,46" fill="#3BB83B" opacity="0.85" />
      {/* 中央高光 */}
      <polygon points="26,18 25,26 27,26" fill="#80F080" opacity="0.7" />
      {/* 右杉樹（暗面） */}
      <polygon points="38,24 33,40 43,40" fill="#1A5C1A" opacity="0.95" />
      <polygon points="38,32 32,44 44,44" fill="#1A5C1A" opacity="0.95" />
      {/* 右杉樹（亮面） */}
      <polygon points="38,24 38,40 43,40" fill="#3AA83A" opacity="0.9" />
      {/* 高光 */}
      <polygon points="38,24 37,30 39,30" fill="#70E070" opacity="0.65" />
    </symbol>

    {/* 沙漠 motif：立體沙丘（受光 crest→背陰 trough）+ 風蝕沙痕 */}
    <symbol id="motif-Desert" viewBox={MOTIF_VB} overflow="visible">
      {/* 沙丘底部暗調 */}
      <ellipse cx="26" cy="50" rx="22" ry="7" fill="#7A4010" opacity="0.35" />
      {/* 第一道沙丘 */}
      <path d="M4,46 Q14,34 26,36 Q38,34 48,46 Q38,44 26,46 Q14,44 4,46 Z"
        fill="#C4803A" opacity="0.8" />
      {/* 沙丘受光 crest */}
      <path d="M8,40 Q18,30 26,32 Q34,30 44,40"
        stroke="#FFDFA0" strokeWidth="1.5" fill="none" opacity="0.9" />
      <path d="M10,38 Q18,29 26,31 Q34,29 42,38"
        stroke="#FFEDCA" strokeWidth="0.8" fill="none" opacity="0.65" />
      {/* 第二道低沙丘 */}
      <path d="M6,52 Q16,44 26,46 Q36,44 46,52 Q36,50 26,52 Q16,50 6,52 Z"
        fill="#A0612A" opacity="0.6" />
      {/* 風蝕沙痕（細線） */}
      <path d="M12,48 Q20,45 26,47 Q32,45 40,48" stroke="#E8C07A" strokeWidth="0.7" fill="none" opacity="0.7" />
      <path d="M15,50 Q22,47 26,49 Q30,47 37,50" stroke="#E8C07A" strokeWidth="0.6" fill="none" opacity="0.6" />
      <path d="M10,50 Q18,47 26,49" stroke="#FFDFA0" strokeWidth="0.5" fill="none" opacity="0.5" />
    </symbol>

    {/* 花田 motif：草地底 + 立體花朵（花瓣漸層+白高光+黃心） */}
    <symbol id="motif-Flower" viewBox={MOTIF_VB} overflow="visible">
      {/* 草地底色補丁 */}
      <ellipse cx="26" cy="53" rx="20" ry="5" fill="#7ABF7A" opacity="0.3" />
      {/* 花 1（左下） */}
      <g transform="translate(12,46)">
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.9" transform="rotate(-30)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.9" transform="rotate(30)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.85" transform="rotate(90)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.85" transform="rotate(150)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.85" transform="rotate(-90)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.85" transform="rotate(-150)" />
        {/* 白高光花瓣邊 */}
        <ellipse cx="0" cy="-3" rx="1.2" ry="2" fill="#FFFFFF" opacity="0.4" transform="rotate(-30)" />
        {/* 黃心 */}
        <circle cx="0" cy="0" r="2.2" fill="#FFE030" />
        <circle cx="0" cy="0" r="1.2" fill="#FFC000" />
      </g>
      {/* 花 2（右下） */}
      <g transform="translate(40,44)">
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.9" transform="rotate(0)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.88" transform="rotate(60)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.85" transform="rotate(120)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.88" transform="rotate(180)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FFB6C1" opacity="0.85" transform="rotate(240)" />
        <ellipse cx="0" cy="-3" rx="2.5" ry="4" fill="#FF9BA8" opacity="0.88" transform="rotate(300)" />
        <ellipse cx="0" cy="-3" rx="1.2" ry="2" fill="#FFFFFF" opacity="0.38" transform="rotate(0)" />
        <circle cx="0" cy="0" r="2.2" fill="#FFE030" />
        <circle cx="0" cy="0" r="1.2" fill="#FFC000" />
      </g>
      {/* 花 3（中下，略小） */}
      <g transform="translate(26,50)">
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FF9BA8" opacity="0.88" transform="rotate(45)" />
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FFB6C1" opacity="0.85" transform="rotate(105)" />
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FF9BA8" opacity="0.88" transform="rotate(165)" />
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FFB6C1" opacity="0.85" transform="rotate(225)" />
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FF9BA8" opacity="0.88" transform="rotate(285)" />
        <ellipse cx="0" cy="-2.5" rx="2" ry="3.2" fill="#FFB6C1" opacity="0.85" transform="rotate(345)" />
        <circle cx="0" cy="0" r="1.8" fill="#FFE030" />
      </g>
    </symbol>

    {/* 峽谷 motif：受光層岩漸層 + 深邃陰影裂縫 + 雙面立體岩塊 */}
    <symbol id="motif-Canyon" viewBox={MOTIF_VB} overflow="visible">
      {/* 底部深陰影（深谷） */}
      <path d="M18,55 Q26,48 34,55 Q26,58 18,55 Z" fill="#3A1A00" opacity="0.7" />
      {/* 左側岩壁（暗面） */}
      <path d="M4,30 L14,20 L18,35 L14,55 L6,50 Z" fill="#8B3A10" opacity="0.85" />
      {/* 左側岩壁（受光面） */}
      <path d="M14,20 L22,18 L22,38 L18,55 L14,55 L18,35 Z" fill="#E08040" opacity="0.9" />
      {/* 左岩高光稜線 */}
      <path d="M14,20 L22,18" stroke="#F0C080" strokeWidth="1.2" opacity="0.85" />
      {/* 右側岩壁（暗面） */}
      <path d="M48,30 L38,20 L34,35 L38,55 L46,50 Z" fill="#8B3A10" opacity="0.85" />
      {/* 右側岩壁（受光面） */}
      <path d="M38,20 L30,18 L30,38 L34,55 L38,55 L34,35 Z" fill="#D07030" opacity="0.88" />
      {/* 右岩高光稜線 */}
      <path d="M38,20 L30,18" stroke="#F0C080" strokeWidth="1.2" opacity="0.8" />
      {/* 裂縫陰影（垂直深縫） */}
      <path d="M24,22 Q26,34 25,55 Q26,34 28,22" fill="#3A1500" opacity="0.55" />
      {/* 岩理橫紋 */}
      <path d="M6,38 Q15,34 22,36" stroke="#A05020" strokeWidth="0.7" fill="none" opacity="0.6" />
      <path d="M30,34 Q37,32 46,36" stroke="#A05020" strokeWidth="0.7" fill="none" opacity="0.6" />
      <path d="M6,44 Q15,40 22,42" stroke="#A05020" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M30,40 Q37,38 46,42" stroke="#A05020" strokeWidth="0.6" fill="none" opacity="0.5" />
    </symbol>

    {/* 水域 motif：水面深淺漸層 + 波光粼粼白高光 + 通透 sheen */}
    <symbol id="motif-Water" viewBox={MOTIF_VB} overflow="visible">
      {/* 深水底層 */}
      <ellipse cx="26" cy="48" rx="20" ry="9" fill="#1A3E78" opacity="0.4" />
      {/* 波紋層 1 */}
      <path d="M8,44 Q14,40 20,44 Q26,40 32,44 Q38,40 44,44"
        stroke="#7ABCE8" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M6,48 Q13,44 20,48 Q26,44 33,48 Q40,44 46,48"
        stroke="#7ABCE8" strokeWidth="1.2" fill="none" opacity="0.65" />
      <path d="M10,52 Q17,48 24,52 Q30,48 37,52 Q42,48 46,52"
        stroke="#5FA0D0" strokeWidth="1" fill="none" opacity="0.6" />
      {/* 波光粼粼白高光（短亮線） */}
      <line x1="14" y1="42" x2="18" y2="42" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.75" strokeLinecap="round" />
      <line x1="28" y1="40" x2="32" y2="40" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
      <line x1="20" y1="46" x2="23" y2="46" stroke="#FFFFFF" strokeWidth="1" opacity="0.65" strokeLinecap="round" />
      <line x1="34" y1="44" x2="37" y2="44" stroke="#FFFFFF" strokeWidth="1" opacity="0.65" strokeLinecap="round" />
      <line x1="12" y1="50" x2="15" y2="50" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.55" strokeLinecap="round" />
      <line x1="38" y1="48" x2="41" y2="48" stroke="#FFFFFF" strokeWidth="0.9" opacity="0.55" strokeLinecap="round" />
      {/* 通透 sheen 頂部 */}
      <path d="M12,40 Q26,34 40,40 Q26,38 12,40 Z" fill="#FFFFFF" opacity="0.1" />
    </symbol>

    {/* 山脈 motif：受光/陰暗雙坡 + 岩理脊線 + 積雪白尖高光 */}
    <symbol id="motif-Mountain" viewBox={MOTIF_VB} overflow="visible">
      {/* 山麓暗影 */}
      <path d="M6,52 L16,30 L26,52 Z" fill="#282828" opacity="0.5" />
      <path d="M26,52 L36,28 L46,52 Z" fill="#282828" opacity="0.5" />
      {/* 左峰暗面（左坡） */}
      <path d="M6,52 L16,22 L20,38 L18,52 Z" fill="#505050" opacity="0.92" />
      {/* 左峰受光面（右坡） */}
      <path d="M16,22 L26,38 L24,52 L18,52 L20,38 Z" fill="#B0B0B0" opacity="0.9" />
      {/* 右峰暗面 */}
      <path d="M46,52 L36,20 L32,36 L34,52 Z" fill="#505050" opacity="0.92" />
      {/* 右峰受光面 */}
      <path d="M36,20 L26,36 L28,52 L34,52 L32,36 Z" fill="#C0C0C0" opacity="0.9" />
      {/* 岩理脊線 */}
      <path d="M16,22 L20,38" stroke="#888888" strokeWidth="0.8" opacity="0.7" />
      <path d="M36,20 L32,36" stroke="#888888" strokeWidth="0.8" opacity="0.7" />
      <path d="M10,42 Q14,38 18,42" stroke="#888888" strokeWidth="0.6" fill="none" opacity="0.55" />
      <path d="M34,40 Q38,36 42,40" stroke="#888888" strokeWidth="0.6" fill="none" opacity="0.55" />
      {/* 積雪白尖（左峰） */}
      <path d="M16,22 L13,30 L16,28 L19,30 Z" fill="#FFFFFF" opacity="0.92" />
      <path d="M16,22 L15,26 L16,25 L17,26 Z" fill="#FFFFFF" opacity="0.98" />
      {/* 積雪白尖（右峰） */}
      <path d="M36,20 L33,28 L36,26 L39,28 Z" fill="#FFFFFF" opacity="0.92" />
      <path d="M36,20 L35,24 L36,23 L37,24 Z" fill="#FFFFFF" opacity="0.98" />
    </symbol>
  </defs>
);

/**
 * motifTextures.ts — R36 Phase 2b-1
 *
 * 21 個地形 motif SVG string 轉 DataURL，供 Pixi Assets.load 預載。
 *
 * 規則：
 * - 靜態字串，不在執行期 parse DOM
 * - encodeURIComponent (不用 btoa)，避免 `#` hex 色值截斷 DataURL
 * - feather-mask defs 打包進每個 SVG
 * - key 格式：`${Terrain}-${variant}`（Grass-a / Grass-b / Grass-c）
 */

// ──────────────────────────────────────────────────────────────────────────────
// SVG 組裝工具
// ──────────────────────────────────────────────────────────────────────────────

/** feather-mask defs (radialGradient + mask)，來自 TerrainDefs.tsx 第 158 行 */
const FEATHER_DEFS = `
  <radialGradient id="feather-mask-grad"
    cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="40%"  stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="65%"  stop-color="#FFFFFF" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95"/>
  </radialGradient>
  <mask id="center-feather-mask">
    <rect x="0" y="0" width="100%" height="100%"
          fill="url(#feather-mask-grad)"/>
  </mask>
`;

function buildMotifSvgString(symbolInnerHTML: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 60" width="52" height="60"><defs>${FEATHER_DEFS}</defs><g mask="url(#center-feather-mask)">${symbolInnerHTML}</g></svg>`;
}

function svgStringToDataUrl(svgStr: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// 21 個 motif symbol innerHTML（從 TerrainDefs.tsx 硬編碼，JSX camelCase → SVG kebab-case）
// ──────────────────────────────────────────────────────────────────────────────

const MOTIF_SVG_STRINGS: Record<string, string> = {

  // ──────────── Grass ────────────

  'Grass-a': buildMotifSvgString(`
    <g opacity="0.9">
      <path d="M7,54 L8,44 L9,54" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M9,54 L11,42 L13,54" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M11,54 L10,46 L13,52" stroke="#4EA04E" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M8,54 L7,48 L6,53" stroke="#4EA04E" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>
    <g opacity="0.9">
      <path d="M39,54 L40,44 L41,54" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M41,54 L43,42 L45,54" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M43,54 L42,47 L45,52" stroke="#4EA04E" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </g>
    <g transform="translate(6,47)">
      <ellipse cx="0" cy="-3.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95"/>
      <ellipse cx="3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(60,3,-1.5)"/>
      <ellipse cx="3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(120,3,1.5)"/>
      <ellipse cx="0" cy="3.5" rx="1.8" ry="2.8" fill="#EEC83A" opacity="0.9"/>
      <ellipse cx="-3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-120,-3,1.5)"/>
      <ellipse cx="-3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-60,-3,-1.5)"/>
      <circle cx="0" cy="0" r="1.8" fill="#E8880A"/>
    </g>
    <g transform="translate(46,46)">
      <ellipse cx="0" cy="-3" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.95"/>
      <ellipse cx="2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(60,2.6,-1.5)"/>
      <ellipse cx="2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(120,2.6,1.5)"/>
      <ellipse cx="0" cy="3" rx="1.6" ry="2.5" fill="#E8E8DC" opacity="0.9"/>
      <ellipse cx="-2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-120,-2.6,1.5)"/>
      <ellipse cx="-2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-60,-2.6,-1.5)"/>
      <circle cx="0" cy="0" r="1.5" fill="#F5C83A"/>
    </g>
    <g transform="translate(35,56)">
      <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88"/>
      <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(60,2.2,-1.2)"/>
      <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(120,2.2,1.2)"/>
      <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#EEC83A" opacity="0.85"/>
      <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(-120,-2.2,1.2)"/>
      <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F5D84A" opacity="0.88" transform="rotate(-60,-2.2,-1.2)"/>
      <circle cx="0" cy="0" r="1.4" fill="#E8880A"/>
    </g>
  `),

  'Grass-b': buildMotifSvgString(`
    <g opacity="0.9">
      <path d="M5,55 L7,43 L9,55" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M9,55 L10,41 L12,55" stroke="#3A8C3A" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M12,55 L11,45 L14,53" stroke="#4EA04E" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </g>
    <g opacity="0.85">
      <path d="M40,55 L41,45 L43,55" stroke="#3A8C3A" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M43,55 L44,42 L46,55" stroke="#3A8C3A" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M45,54 L44,48 L47,53" stroke="#4EA04E" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M41,55 L40,49 L38,54" stroke="#4EA04E" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>
    <g opacity="0.7">
      <path d="M22,57 L23,50 L24,57" stroke="#3A8C3A" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M27,57 L28,49 L30,57" stroke="#4EA04E" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </g>
    <g transform="translate(43,47)">
      <ellipse cx="0" cy="-3" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.95"/>
      <ellipse cx="2.6" cy="-1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(60,2.6,-1.5)"/>
      <ellipse cx="2.6" cy="1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(120,2.6,1.5)"/>
      <ellipse cx="0" cy="3" rx="1.5" ry="2.4" fill="#E8E8D0" opacity="0.9"/>
      <ellipse cx="-2.6" cy="1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(-120,-2.6,1.5)"/>
      <ellipse cx="-2.6" cy="-1.5" rx="1.5" ry="2.4" fill="#F5F0E0" opacity="0.9" transform="rotate(-60,-2.6,-1.5)"/>
      <circle cx="0" cy="0" r="1.5" fill="#F0C020"/>
    </g>
    <g transform="translate(9,55)">
      <ellipse cx="0" cy="-2.8" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.92"/>
      <ellipse cx="2.4" cy="-1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(60,2.4,-1.4)"/>
      <ellipse cx="2.4" cy="1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(120,2.4,1.4)"/>
      <ellipse cx="0" cy="2.8" rx="1.5" ry="2.3" fill="#ECC030" opacity="0.88"/>
      <ellipse cx="-2.4" cy="1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(-120,-2.4,1.4)"/>
      <ellipse cx="-2.4" cy="-1.4" rx="1.5" ry="2.3" fill="#F8D040" opacity="0.9" transform="rotate(-60,-2.4,-1.4)"/>
      <circle cx="0" cy="0" r="1.5" fill="#DC8010"/>
    </g>
  `),

  'Grass-c': buildMotifSvgString(`
    <g opacity="0.88">
      <path d="M5,56 L6,45 L8,56" stroke="#3A8C3A" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M8,56 L9,43 L11,56" stroke="#3A8C3A" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M7,56 L6,49 L5,55" stroke="#4EA04E" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>
    <g opacity="0.88">
      <path d="M32,56 L33,44 L35,56" stroke="#3A8C3A" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M35,56 L37,42 L38,56" stroke="#3A8C3A" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <path d="M34,55 L33,47 L32,54" stroke="#4EA04E" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </g>
    <g opacity="0.75">
      <path d="M44,55 L45,47 L46,55" stroke="#3A8C3A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M46,55 L47,49 L48,54" stroke="#4EA04E" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    </g>
    <g transform="translate(8,52)">
      <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.95"/>
      <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(60,2.2,-1.2)"/>
      <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(120,2.2,1.2)"/>
      <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#ECC030" opacity="0.9"/>
      <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(-120,-2.2,1.2)"/>
      <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F8D848" opacity="0.92" transform="rotate(-60,-2.2,-1.2)"/>
      <circle cx="0" cy="0" r="1.4" fill="#E08010"/>
    </g>
    <g transform="translate(22,54)">
      <ellipse cx="0" cy="-2.5" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.92"/>
      <ellipse cx="2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(60,2.2,-1.2)"/>
      <ellipse cx="2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(120,2.2,1.2)"/>
      <ellipse cx="0" cy="2.5" rx="1.4" ry="2.2" fill="#E8E4C8" opacity="0.88"/>
      <ellipse cx="-2.2" cy="1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(-120,-2.2,1.2)"/>
      <ellipse cx="-2.2" cy="-1.2" rx="1.4" ry="2.2" fill="#F2EED8" opacity="0.9" transform="rotate(-60,-2.2,-1.2)"/>
      <circle cx="0" cy="0" r="1.4" fill="#F0BC20"/>
    </g>
    <g transform="translate(40,50)">
      <ellipse cx="0" cy="-2.2" rx="1.3" ry="2" fill="#FAE060" opacity="0.9"/>
      <ellipse cx="2" cy="-1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(60,2,-1)"/>
      <ellipse cx="2" cy="1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(120,2,1)"/>
      <ellipse cx="0" cy="2.2" rx="1.3" ry="2" fill="#ECD050" opacity="0.85"/>
      <ellipse cx="-2" cy="1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(-120,-2,1)"/>
      <ellipse cx="-2" cy="-1" rx="1.3" ry="2" fill="#FAE060" opacity="0.88" transform="rotate(-60,-2,-1)"/>
      <circle cx="0" cy="0" r="1.3" fill="#E08820"/>
    </g>
    <g transform="translate(46,55)">
      <ellipse cx="0" cy="-2.2" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.9"/>
      <ellipse cx="1.9" cy="-1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(60,1.9,-1.1)"/>
      <ellipse cx="1.9" cy="1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(120,1.9,1.1)"/>
      <ellipse cx="0" cy="2.2" rx="1.3" ry="2" fill="#ECE8D0" opacity="0.85"/>
      <ellipse cx="-1.9" cy="1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(-120,-1.9,1.1)"/>
      <ellipse cx="-1.9" cy="-1.1" rx="1.3" ry="2" fill="#F8F4E0" opacity="0.88" transform="rotate(-60,-1.9,-1.1)"/>
      <circle cx="0" cy="0" r="1.3" fill="#F0B818"/>
    </g>
  `),

  // ──────────── Forest ────────────

  'Forest-a': buildMotifSvgString(`
    <g opacity="0.55">
      <rect x="24" y="34" width="3" height="8" fill="#1A4C1A"/>
      <path d="M25.5,20 C20,20 17,24 17,28 C17,30 18,32 20,33 C18,33 16,35 16,37 C16,39 18,40 20,40 C18,40 21,34 25.5,34 C30,34 33,40 31,40 C33,40 35,39 35,37 C35,35 33,33 31,33 C33,32 34,30 34,28 C34,24 31,20 25.5,20 Z" fill="#1E5C1E"/>
    </g>
    <rect x="7" y="36" width="3.5" height="10" fill="#1A3C1A" opacity="0.9"/>
    <path d="M8.75,18 C4,18 2,22 2,26 C2,28.5 3.2,30.5 5,31.5 C3,31.5 1.5,33.5 1.5,35.5 C1.5,37.5 3,39 5,39 C3.5,39 8.75,37 8.75,37 C8.75,37 14,39 12.5,39 C14.5,39 16,37.5 16,35.5 C16,33.5 14.5,31.5 12.5,31.5 C14.3,30.5 15.5,28.5 15.5,26 C15.5,22 13.5,18 8.75,18 Z" fill="#1E641E" opacity="0.92"/>
    <rect x="39" y="36" width="3.5" height="10" fill="#1A3C1A" opacity="0.9"/>
    <path d="M40.75,16 C36,16 34,20 34,24 C34,26.5 35.2,28.5 37,29.5 C35,29.5 33.5,31.5 33.5,33.5 C33.5,35.5 35,37 37,37 C35.5,37 40.75,35 40.75,35 C40.75,35 46,37 44.5,37 C46.5,37 48,35.5 48,33.5 C48,31.5 46.5,29.5 44.5,29.5 C46.3,28.5 47.5,26.5 47.5,24 C47.5,20 45.5,16 40.75,16 Z" fill="#165C16" opacity="0.95"/>
    <ellipse cx="18" cy="44" rx="2.5" ry="1.5" fill="#3A7A1A" opacity="0.7" transform="rotate(-15,18,44)"/>
    <ellipse cx="32" cy="46" rx="2" ry="1.2" fill="#2E6A14" opacity="0.65" transform="rotate(20,32,46)"/>
    <ellipse cx="24" cy="48" rx="1.8" ry="1" fill="#3A7A1A" opacity="0.6" transform="rotate(-8,24,48)"/>
  `),

  'Forest-b': buildMotifSvgString(`
    <rect x="6" y="38" width="3" height="8" fill="#1A3C1A" opacity="0.85"/>
    <path d="M7.5,24 C4,24 2,27 2,30 C2,32 3,33.5 4.5,34 C3,34 2,35.5 2,37 C2,38.5 3,39.5 4.5,39.5 C3.5,39.5 7.5,38 7.5,38 C7.5,38 11.5,39.5 10.5,39.5 C12,39.5 13,38.5 13,37 C13,35.5 12,34 10.5,34 C12,33.5 13,32 13,30 C13,27 11,24 7.5,24 Z" fill="#226222" opacity="0.88"/>
    <rect x="22.5" y="34" width="4" height="12" fill="#142814" opacity="0.95"/>
    <path d="M24.5,12 C19,12 16,17 16,21 C16,24 17.5,26 19.5,27 C17,27 15,29.5 15,32 C15,34.5 17,36.5 19.5,36.5 C17.5,36.5 24.5,34 24.5,34 C24.5,34 31.5,36.5 29.5,36.5 C32,36.5 34,34.5 34,32 C34,29.5 32,27 29.5,27 C31.5,26 33,24 33,21 C33,17 30,12 24.5,12 Z" fill="#1A5A1A" opacity="0.97"/>
    <rect x="40" y="37" width="3.5" height="9" fill="#1A3C1A" opacity="0.88"/>
    <path d="M41.75,20 C37.5,20 35.5,24 35.5,27.5 C35.5,29.5 36.5,31 38,31.5 C36.5,31.5 35.5,33 35.5,34.5 C35.5,36 36.5,37 38,37 C36.8,37 41.75,35.5 41.75,35.5 C41.75,35.5 46.7,37 45.5,37 C47,37 48,36 48,34.5 C48,33 47,31.5 45.5,31.5 C47,31 48,29.5 48,27.5 C48,24 46,20 41.75,20 Z" fill="#1E6020" opacity="0.92"/>
    <ellipse cx="16" cy="45" rx="2.2" ry="1.3" fill="#2E6A14" opacity="0.68" transform="rotate(25,16,45)"/>
    <ellipse cx="36" cy="47" rx="2.5" ry="1.4" fill="#3A7A1A" opacity="0.65" transform="rotate(-18,36,47)"/>
  `),

  'Forest-c': buildMotifSvgString(`
    <rect x="7" y="38" width="4" height="10" fill="#1A3C1A" opacity="0.9"/>
    <path d="M9,17 C3.5,17 1,21.5 1,25.5 C1,28 2.5,30 4.5,31 C2.5,31 0.5,33 0.5,35 C0.5,37 2,38.5 4.5,38.5 C2.8,38.5 9,37 9,37 C9,37 15.2,38.5 13.5,38.5 C16,38.5 17.5,37 17.5,35 C17.5,33 15.5,31 13.5,31 C15.5,30 17,28 17,25.5 C17,21.5 14.5,17 9,17 Z" fill="#1E6422" opacity="0.93"/>
    <rect x="39" y="36" width="4" height="12" fill="#142814" opacity="0.9"/>
    <path d="M41,14 C35.5,14 33,18.5 33,22.5 C33,25 34.5,27 36.5,28 C34.5,28 32.5,30 32.5,32 C32.5,34 34,35.5 36.5,35.5 C34.8,35.5 41,34 41,34 C41,34 47.2,35.5 45.5,35.5 C48,35.5 49.5,34 49.5,32 C49.5,30 47.5,28 45.5,28 C47.5,27 49,25 49,22.5 C49,18.5 46.5,14 41,14 Z" fill="#185A1A" opacity="0.95"/>
    <ellipse cx="19" cy="44" rx="2.8" ry="1.5" fill="#3A7A1A" opacity="0.72" transform="rotate(-22,19,44)"/>
    <ellipse cx="28" cy="47" rx="2.2" ry="1.2" fill="#2E6A14" opacity="0.65" transform="rotate(12,28,47)"/>
    <ellipse cx="36" cy="45" rx="2" ry="1.1" fill="#3A7A1A" opacity="0.6" transform="rotate(30,36,45)"/>
    <ellipse cx="14" cy="48" rx="1.6" ry="0.9" fill="#224C12" opacity="0.55" transform="rotate(-5,14,48)"/>
    <ellipse cx="44" cy="48" rx="1.8" ry="1" fill="#2E6014" opacity="0.58" transform="rotate(-25,44,48)"/>
  `),

  // ──────────── Desert ────────────

  'Desert-a': buildMotifSvgString(`
    <path d="M5,44 Q12,41 19,44 Q26,41 33,44 Q40,41 47,44" stroke="#A87828" stroke-width="1.4" fill="none" opacity="0.65"/>
    <path d="M4,50 Q12,47 20,50 Q28,47 36,50 Q43,47 48,50" stroke="#9A6C20" stroke-width="1.3" fill="none" opacity="0.6"/>
    <path d="M7,56 Q15,53 23,56 Q31,53 39,56 Q44,53 48,56" stroke="#8C6018" stroke-width="1.1" fill="none" opacity="0.5"/>
    <g transform="translate(9,38) scale(0.6)" opacity="0.7">
      <rect x="-3.5" y="0" width="7" height="18" rx="3.5" fill="#6B8E5A"/>
      <path d="M3.5,5 Q11,3 12,9 Q13,14 9,14" stroke="#6B8E5A" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="8" y="8" width="5" height="7" rx="2.5" fill="#6B8E5A"/>
      <line x1="0" y1="0" x2="0" y2="-3" stroke="#4E6E40" stroke-width="1.2"/>
      <line x1="-3" y1="2" x2="-5" y2="0" stroke="#4E6E40" stroke-width="1"/>
    </g>
    <ellipse cx="7" cy="52" rx="3.5" ry="2" fill="#8A5818" opacity="0.6" transform="rotate(10,7,52)"/>
    <ellipse cx="44" cy="54" rx="2.8" ry="1.6" fill="#7A4E14" opacity="0.55" transform="rotate(-8,44,54)"/>
  `),

  'Desert-b': buildMotifSvgString(`
    <path d="M4,42 Q11,39 18,42 Q25,38 32,42 Q39,39 46,42" stroke="#A87828" stroke-width="1.4" fill="none" opacity="0.62"/>
    <path d="M3,48 Q11,44 20,48 Q28,45 36,48 Q43,45 49,48" stroke="#9A6C20" stroke-width="1.3" fill="none" opacity="0.58"/>
    <path d="M5,54 Q13,51 22,54 Q30,51 38,54 Q44,52 48,54" stroke="#8C6018" stroke-width="1.1" fill="none" opacity="0.5"/>
    <path d="M9,58 Q17,55 26,58 Q34,55 42,58" stroke="#7A5414" stroke-width="0.9" fill="none" opacity="0.42"/>
    <g transform="translate(40,36) scale(0.6)" opacity="0.7">
      <rect x="-3.5" y="0" width="7" height="20" rx="3.5" fill="#7D9471"/>
      <path d="M-3.5,6 Q-12,4 -13,11 Q-14,16 -10,16" stroke="#7D9471" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="-15" y="10" width="5" height="7" rx="2.5" fill="#7D9471"/>
      <line x1="0" y1="0" x2="0" y2="-3" stroke="#5A7050" stroke-width="1.2"/>
      <line x1="3.5" y1="2" x2="5.5" y2="0" stroke="#5A7050" stroke-width="1"/>
    </g>
    <ellipse cx="7" cy="50" rx="3" ry="1.8" fill="#8A5818" opacity="0.58" transform="rotate(15,7,50)"/>
    <ellipse cx="46" cy="52" rx="2.5" ry="1.5" fill="#7A4E14" opacity="0.55" transform="rotate(-12,46,52)"/>
    <ellipse cx="12" cy="56" rx="2" ry="1.2" fill="#704815" opacity="0.48" transform="rotate(5,12,56)"/>
  `),

  'Desert-c': buildMotifSvgString(`
    <path d="M4,46 Q11,43 18,46 Q25,42 32,46 Q39,43 46,46" stroke="#A07020" stroke-width="1.3" fill="none" opacity="0.6"/>
    <path d="M5,52 Q13,49 21,52 Q29,49 37,52 Q43,50 48,52" stroke="#927018" stroke-width="1.2" fill="none" opacity="0.55"/>
    <path d="M8,58 Q16,55 25,58 Q33,55 41,58" stroke="#845E14" stroke-width="1" fill="none" opacity="0.45"/>
    <g transform="translate(38,32) scale(0.6)" opacity="0.7">
      <rect x="-3" y="0" width="6" height="20" rx="3" fill="#6B8E5A"/>
      <path d="M3,5 Q10,3 11,9" stroke="#6B8E5A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="8" y="7" width="4" height="6" rx="2" fill="#6B8E5A"/>
      <path d="M-3,9 Q-9,7 -9,13" stroke="#6B8E5A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="-11" y="11" width="4" height="5" rx="2" fill="#6B8E5A"/>
      <line x1="0" y1="0" x2="0" y2="-3" stroke="#4E6E40" stroke-width="1.2"/>
    </g>
    <ellipse cx="12" cy="54" rx="3" ry="1.7" fill="#8A5818" opacity="0.55" transform="rotate(-8,12,54)"/>
  `),

  // ──────────── Flower ────────────

  'Flower-a': buildMotifSvgString(`
    <g transform="translate(10,48)">
      <ellipse cx="0" cy="-4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.95"/>
      <ellipse cx="3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(60,3.8,-2)"/>
      <ellipse cx="3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(120,3.8,2)"/>
      <ellipse cx="0" cy="4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.9"/>
      <ellipse cx="-3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(-120,-3.8,2)"/>
      <ellipse cx="-3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(-60,-3.8,-2)"/>
      <circle cx="0" cy="0" r="2.5" fill="#FFE840"/>
    </g>
    <g transform="translate(40,46)">
      <ellipse cx="0" cy="-4" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.95"/>
      <ellipse cx="3.8" cy="-2" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.92" transform="rotate(60,3.8,-2)"/>
      <ellipse cx="3.8" cy="2" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.92" transform="rotate(120,3.8,2)"/>
      <ellipse cx="0" cy="4" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.9"/>
      <ellipse cx="-3.8" cy="2" rx="2.5" ry="3.8" fill="#9050D0" opacity="0.92" transform="rotate(-120,-3.8,2)"/>
      <ellipse cx="-3.8" cy="-2" rx="2.5" ry="3.8" fill="#8040C0" opacity="0.92" transform="rotate(-60,-3.8,-2)"/>
      <circle cx="0" cy="0" r="2.5" fill="#FFE840"/>
    </g>
    <g transform="translate(25,53)">
      <ellipse cx="0" cy="-3.2" rx="2" ry="3" fill="#F0CC20" opacity="0.93"/>
      <ellipse cx="3" cy="-1.6" rx="2" ry="3" fill="#E8BC18" opacity="0.9" transform="rotate(60,3,-1.6)"/>
      <ellipse cx="3" cy="1.6" rx="2" ry="3" fill="#F0CC20" opacity="0.9" transform="rotate(120,3,1.6)"/>
      <ellipse cx="0" cy="3.2" rx="2" ry="3" fill="#E8BC18" opacity="0.88"/>
      <ellipse cx="-3" cy="1.6" rx="2" ry="3" fill="#F0CC20" opacity="0.9" transform="rotate(-120,-3,1.6)"/>
      <ellipse cx="-3" cy="-1.6" rx="2" ry="3" fill="#E8BC18" opacity="0.9" transform="rotate(-60,-3,-1.6)"/>
      <circle cx="0" cy="0" r="2" fill="#A05808"/>
    </g>
  `),

  'Flower-b': buildMotifSvgString(`
    <g transform="translate(7,50)">
      <ellipse cx="0" cy="-3.5" rx="2.2" ry="3.2" fill="#F04820" opacity="0.95"/>
      <ellipse cx="3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#E84018" opacity="0.92" transform="rotate(60,3.2,-1.8)"/>
      <ellipse cx="3.2" cy="1.8" rx="2.2" ry="3.2" fill="#F04820" opacity="0.92" transform="rotate(120,3.2,1.8)"/>
      <ellipse cx="0" cy="3.5" rx="2.2" ry="3.2" fill="#E84018" opacity="0.9"/>
      <ellipse cx="-3.2" cy="1.8" rx="2.2" ry="3.2" fill="#F04820" opacity="0.92" transform="rotate(-120,-3.2,1.8)"/>
      <ellipse cx="-3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#E84018" opacity="0.92" transform="rotate(-60,-3.2,-1.8)"/>
      <circle cx="0" cy="0" r="2.2" fill="#FFE030"/>
    </g>
    <g transform="translate(44,44)">
      <ellipse cx="0" cy="-3.8" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.95"/>
      <ellipse cx="3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.92" transform="rotate(60,3.5,-1.9)"/>
      <ellipse cx="3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.92" transform="rotate(120,3.5,1.9)"/>
      <ellipse cx="0" cy="3.8" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.9"/>
      <ellipse cx="-3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F8C020" opacity="0.92" transform="rotate(-120,-3.5,1.9)"/>
      <ellipse cx="-3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#F0B818" opacity="0.92" transform="rotate(-60,-3.5,-1.9)"/>
      <circle cx="0" cy="0" r="2.3" fill="#884810"/>
    </g>
    <g transform="translate(38,53)">
      <ellipse cx="0" cy="-3" rx="2" ry="2.8" fill="#DC2850" opacity="0.93"/>
      <ellipse cx="2.8" cy="-1.5" rx="2" ry="2.8" fill="#CC2048" opacity="0.9" transform="rotate(60,2.8,-1.5)"/>
      <ellipse cx="2.8" cy="1.5" rx="2" ry="2.8" fill="#DC2850" opacity="0.9" transform="rotate(120,2.8,1.5)"/>
      <ellipse cx="0" cy="3" rx="2" ry="2.8" fill="#CC2048" opacity="0.88"/>
      <ellipse cx="-2.8" cy="1.5" rx="2" ry="2.8" fill="#DC2850" opacity="0.9" transform="rotate(-120,-2.8,1.5)"/>
      <ellipse cx="-2.8" cy="-1.5" rx="2" ry="2.8" fill="#CC2048" opacity="0.9" transform="rotate(-60,-2.8,-1.5)"/>
      <circle cx="0" cy="0" r="2" fill="#FFE030"/>
    </g>
    <g transform="translate(15,54)">
      <ellipse cx="0" cy="-2.8" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.9"/>
      <ellipse cx="2.5" cy="-1.4" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.88" transform="rotate(60,2.5,-1.4)"/>
      <ellipse cx="2.5" cy="1.4" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.88" transform="rotate(120,2.5,1.4)"/>
      <ellipse cx="0" cy="2.8" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.86"/>
      <ellipse cx="-2.5" cy="1.4" rx="1.8" ry="2.6" fill="#F0A0C0" opacity="0.88" transform="rotate(-120,-2.5,1.4)"/>
      <ellipse cx="-2.5" cy="-1.4" rx="1.8" ry="2.6" fill="#E890B0" opacity="0.88" transform="rotate(-60,-2.5,-1.4)"/>
      <circle cx="0" cy="0" r="1.8" fill="#FFD830"/>
    </g>
  `),

  'Flower-c': buildMotifSvgString(`
    <g transform="translate(6,46)">
      <ellipse cx="0" cy="-3.5" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.95"/>
      <ellipse cx="3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.92" transform="rotate(60,3.2,-1.8)"/>
      <ellipse cx="3.2" cy="1.8" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.92" transform="rotate(120,3.2,1.8)"/>
      <ellipse cx="0" cy="3.5" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.9"/>
      <ellipse cx="-3.2" cy="1.8" rx="2.2" ry="3.2" fill="#7030B8" opacity="0.92" transform="rotate(-120,-3.2,1.8)"/>
      <ellipse cx="-3.2" cy="-1.8" rx="2.2" ry="3.2" fill="#6828A8" opacity="0.92" transform="rotate(-60,-3.2,-1.8)"/>
      <circle cx="0" cy="0" r="2.2" fill="#FFE030"/>
    </g>
    <g transform="translate(43,42)">
      <ellipse cx="0" cy="-3.8" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.95"/>
      <ellipse cx="3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#E06090" opacity="0.92" transform="rotate(60,3.5,-1.9)"/>
      <ellipse cx="3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.92" transform="rotate(120,3.5,1.9)"/>
      <ellipse cx="0" cy="3.8" rx="2.4" ry="3.5" fill="#E06090" opacity="0.9"/>
      <ellipse cx="-3.5" cy="1.9" rx="2.4" ry="3.5" fill="#F070A0" opacity="0.92" transform="rotate(-120,-3.5,1.9)"/>
      <ellipse cx="-3.5" cy="-1.9" rx="2.4" ry="3.5" fill="#E06090" opacity="0.92" transform="rotate(-60,-3.5,-1.9)"/>
      <circle cx="0" cy="0" r="2.3" fill="#FFE840"/>
    </g>
    <g transform="translate(12,54)">
      <ellipse cx="0" cy="-3" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.93"/>
      <ellipse cx="2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.9" transform="rotate(60,2.8,-1.5)"/>
      <ellipse cx="2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.9" transform="rotate(120,2.8,1.5)"/>
      <ellipse cx="0" cy="3" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.88"/>
      <ellipse cx="-2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F4D028" opacity="0.9" transform="rotate(-120,-2.8,1.5)"/>
      <ellipse cx="-2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#ECC020" opacity="0.9" transform="rotate(-60,-2.8,-1.5)"/>
      <circle cx="0" cy="0" r="1.9" fill="#904010"/>
    </g>
    <g transform="translate(40,52)">
      <ellipse cx="0" cy="-3" rx="1.9" ry="2.8" fill="#F09050" opacity="0.92"/>
      <ellipse cx="2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#E88040" opacity="0.9" transform="rotate(60,2.8,-1.5)"/>
      <ellipse cx="2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F09050" opacity="0.9" transform="rotate(120,2.8,1.5)"/>
      <ellipse cx="0" cy="3" rx="1.9" ry="2.8" fill="#E88040" opacity="0.88"/>
      <ellipse cx="-2.8" cy="1.5" rx="1.9" ry="2.8" fill="#F09050" opacity="0.9" transform="rotate(-120,-2.8,1.5)"/>
      <ellipse cx="-2.8" cy="-1.5" rx="1.9" ry="2.8" fill="#E88040" opacity="0.9" transform="rotate(-60,-2.8,-1.5)"/>
      <circle cx="0" cy="0" r="1.9" fill="#FFE030"/>
    </g>
    <g transform="translate(26,55)">
      <ellipse cx="0" cy="-2.5" rx="1.6" ry="2.3" fill="#C01840" opacity="0.9"/>
      <ellipse cx="2.3" cy="-1.2" rx="1.6" ry="2.3" fill="#B01038" opacity="0.88" transform="rotate(60,2.3,-1.2)"/>
      <ellipse cx="2.3" cy="1.2" rx="1.6" ry="2.3" fill="#C01840" opacity="0.88" transform="rotate(120,2.3,1.2)"/>
      <ellipse cx="0" cy="2.5" rx="1.6" ry="2.3" fill="#B01038" opacity="0.85"/>
      <ellipse cx="-2.3" cy="1.2" rx="1.6" ry="2.3" fill="#C01840" opacity="0.88" transform="rotate(-120,-2.3,1.2)"/>
      <ellipse cx="-2.3" cy="-1.2" rx="1.6" ry="2.3" fill="#B01038" opacity="0.88" transform="rotate(-60,-2.3,-1.2)"/>
      <circle cx="0" cy="0" r="1.6" fill="#FFD820"/>
    </g>
  `),

  // ──────────── Canyon ────────────

  'Canyon-a': buildMotifSvgString(`
    <polygon points="4,54 12,20 20,20 18,54" fill="#7A3010" opacity="0.78"/>
    <polygon points="48,54 40,20 32,20 34,54" fill="#7A3010" opacity="0.78"/>
    <path d="M18,54 L26,38 L34,54 Z" fill="#401808" opacity="0.55"/>
    <path d="M5,32 Q11,30 18,32" stroke="#C06838" stroke-width="1.3" fill="none" opacity="0.72"/>
    <path d="M5,39 Q11,37 18,39" stroke="#B85E30" stroke-width="1.2" fill="none" opacity="0.68"/>
    <path d="M5,46 Q11,44 18,46" stroke="#A85428" stroke-width="1.1" fill="none" opacity="0.62"/>
    <path d="M5,51 Q12,49 18,51" stroke="#9A4C22" stroke-width="0.9" fill="none" opacity="0.55"/>
    <path d="M34,32 Q41,30 47,32" stroke="#C06838" stroke-width="1.3" fill="none" opacity="0.72"/>
    <path d="M34,39 Q41,37 47,39" stroke="#B85E30" stroke-width="1.2" fill="none" opacity="0.68"/>
    <path d="M34,46 Q41,44 47,46" stroke="#A85428" stroke-width="1.1" fill="none" opacity="0.62"/>
    <path d="M34,51 Q40,49 47,51" stroke="#9A4C22" stroke-width="0.9" fill="none" opacity="0.55"/>
    <line x1="26" y1="20" x2="26" y2="38" stroke="#2A0C00" stroke-width="2" opacity="0.45"/>
  `),

  'Canyon-b': buildMotifSvgString(`
    <polygon points="3,54 13,18 22,18 20,54" fill="#6A280C" opacity="0.82"/>
    <polygon points="49,54 39,18 30,18 32,54" fill="#6A280C" opacity="0.82"/>
    <path d="M20,54 L26,32 L32,54 Z" fill="#300A00" opacity="0.7"/>
    <path d="M4,30 Q10,28 19,30" stroke="#C86030" stroke-width="1.4" fill="none" opacity="0.75"/>
    <path d="M4,40 Q10,38 19,40" stroke="#B85828" stroke-width="1.3" fill="none" opacity="0.7"/>
    <path d="M4,50 Q11,48 19,50" stroke="#A85020" stroke-width="1.1" fill="none" opacity="0.62"/>
    <path d="M33,30 Q42,28 48,30" stroke="#C86030" stroke-width="1.4" fill="none" opacity="0.75"/>
    <path d="M33,40 Q42,38 48,40" stroke="#B85828" stroke-width="1.3" fill="none" opacity="0.7"/>
    <path d="M33,50 Q41,48 48,50" stroke="#A85020" stroke-width="1.1" fill="none" opacity="0.62"/>
    <line x1="26" y1="18" x2="26" y2="32" stroke="#1E0800" stroke-width="2.5" opacity="0.5"/>
    <path d="M6,24 Q9,22 12,24" stroke="#E08048" stroke-width="0.8" fill="none" opacity="0.5"/>
    <path d="M38,24 Q41,22 44,24" stroke="#E08048" stroke-width="0.8" fill="none" opacity="0.5"/>
  `),

  'Canyon-c': buildMotifSvgString(`
    <polygon points="5,54 14,22 21,22 19,54" fill="#722C10" opacity="0.80"/>
    <polygon points="47,54 38,22 31,22 33,54" fill="#722C10" opacity="0.80"/>
    <path d="M19,54 L26,40 L33,54 Z" fill="#380E02" opacity="0.62"/>
    <path d="M6,27 Q12,25 19,27" stroke="#CA6432" stroke-width="1.3" fill="none" opacity="0.72"/>
    <path d="M6,33 Q12,31 19,33" stroke="#BA5C2A" stroke-width="1.2" fill="none" opacity="0.68"/>
    <path d="M6,43 Q12,41 19,43" stroke="#AA5222" stroke-width="1.1" fill="none" opacity="0.64"/>
    <path d="M6,50 Q12,48 19,50" stroke="#9A4A1A" stroke-width="0.9" fill="none" opacity="0.56"/>
    <path d="M33,27 Q40,25 46,27" stroke="#CA6432" stroke-width="1.3" fill="none" opacity="0.72"/>
    <path d="M33,33 Q40,31 46,33" stroke="#BA5C2A" stroke-width="1.2" fill="none" opacity="0.68"/>
    <path d="M33,43 Q40,41 46,43" stroke="#AA5222" stroke-width="1.1" fill="none" opacity="0.64"/>
    <path d="M33,50 Q40,48 46,50" stroke="#9A4A1A" stroke-width="0.9" fill="none" opacity="0.56"/>
    <line x1="26" y1="22" x2="26" y2="40" stroke="#280800" stroke-width="2" opacity="0.48"/>
  `),

  // ──────────── Water ────────────

  'Water-a': buildMotifSvgString(`
    <path d="M4,38 Q10,34 16,38 Q22,34 28,38 Q34,34 40,38 Q46,34 50,38" stroke="#4896D0" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M3,44 Q9,40 16,44 Q23,40 30,44 Q37,40 44,44 Q49,41 50,44" stroke="#58A0D8" stroke-width="1.8" fill="none" opacity="0.68"/>
    <path d="M4,50 Q11,46 19,50 Q27,46 35,50 Q42,46 48,50" stroke="#68AADC" stroke-width="1.5" fill="none" opacity="0.62"/>
    <path d="M7,56 Q14,52 22,56 Q30,52 38,56 Q43,53 47,56" stroke="#5898D0" stroke-width="1.2" fill="none" opacity="0.52"/>
    <path d="M9,41 Q12,39 15,41" stroke="#FFFFFF" stroke-width="1.8" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M34,47 Q38,45 42,47" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round"/>
    <circle cx="22" cy="43" r="1.5" fill="#FFFFFF" opacity="0.45"/>
    <circle cx="44" cy="51" r="1.2" fill="#FFFFFF" opacity="0.4"/>
  `),

  'Water-b': buildMotifSvgString(`
    <path d="M3,36 Q8,32 14,36 Q20,32 26,36 Q32,32 38,36 Q44,32 50,36" stroke="#4A90CC" stroke-width="2" fill="none" opacity="0.72"/>
    <path d="M2,41 Q8,37 15,41 Q22,37 29,41 Q36,37 43,41 Q48,38 51,41" stroke="#5498D4" stroke-width="1.8" fill="none" opacity="0.68"/>
    <path d="M2,46 Q8,42 16,46 Q24,42 32,46 Q40,42 48,46" stroke="#5CA0D8" stroke-width="1.6" fill="none" opacity="0.64"/>
    <path d="M3,51 Q10,47 18,51 Q26,47 34,51 Q42,47 49,51" stroke="#60A4DA" stroke-width="1.4" fill="none" opacity="0.58"/>
    <path d="M6,56 Q13,52 21,56 Q29,52 37,56 Q43,53 48,56" stroke="#5898CC" stroke-width="1.1" fill="none" opacity="0.5"/>
    <path d="M7,38 Q10,36 13,38" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.62" stroke-linecap="round"/>
    <path d="M28,43 Q32,41 36,43" stroke="#FFFFFF" stroke-width="1.8" fill="none" opacity="0.58" stroke-linecap="round"/>
    <path d="M16,53 Q19,51 22,53" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.52" stroke-linecap="round"/>
    <circle cx="40" cy="39" r="1.5" fill="#FFFFFF" opacity="0.42"/>
  `),

  'Water-c': buildMotifSvgString(`
    <path d="M2,38 Q8,32 15,38 Q22,32 29,38 Q36,32 43,38 Q48,33 51,38" stroke="#4488C4" stroke-width="2.5" fill="none" opacity="0.7"/>
    <path d="M2,47 Q9,41 17,47 Q25,41 33,47 Q41,41 49,47" stroke="#4C92CC" stroke-width="2.2" fill="none" opacity="0.65"/>
    <path d="M3,56 Q11,50 20,56 Q29,50 38,56 Q44,52 49,56" stroke="#5498D0" stroke-width="1.8" fill="none" opacity="0.58"/>
    <path d="M6,41 Q9,39 12,41" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.65" stroke-linecap="round"/>
    <path d="M22,35 Q25,33 28,35" stroke="#FFFFFF" stroke-width="1.8" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M38,44 Q42,42 46,44" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity="0.58" stroke-linecap="round"/>
    <circle cx="18" cy="43" r="1.8" fill="#FFFFFF" opacity="0.45"/>
    <circle cx="34" cy="51" r="1.5" fill="#FFFFFF" opacity="0.42"/>
    <circle cx="44" cy="42" r="1.2" fill="#FFFFFF" opacity="0.38"/>
    <circle cx="10" cy="52" r="1" fill="#FFFFFF" opacity="0.35"/>
  `),

  // ──────────── Mountain ────────────

  'Mountain-a': buildMotifSvgString(`
    <path d="M4,54 L8,42 L12,36 L14,20 L16,36 L18,30 L20,52 Z" fill="#5A5A5A" opacity="0.88"/>
    <path d="M14,20 L16,36 L18,30 L22,52 L28,52 Z" fill="#A8A8A8" opacity="0.88"/>
    <path d="M28,52 L30,42 L33,28 L35,42 L37,36 L40,52 Z" fill="#5A5A5A" opacity="0.85"/>
    <path d="M33,28 L35,42 L37,36 L44,52 L28,52 Z" fill="#9A9A9A" opacity="0.85"/>
    <path d="M14,20 L11,26 L13,24 L15,27 L17,23 L19,27 L18,30 L16,36 Z" fill="#F0F0F0" opacity="0.95"/>
    <path d="M33,28 L31,32 L33,30 L35,33 L36,30 L35,42 Z" fill="#EBEBEB" opacity="0.9"/>
    <ellipse cx="7" cy="54" rx="3" ry="1.5" fill="#484848" opacity="0.55" transform="rotate(8,7,54)"/>
    <ellipse cx="45" cy="54" rx="2.5" ry="1.3" fill="#484848" opacity="0.5" transform="rotate(-5,45,54)"/>
    <ellipse cx="26" cy="54" rx="2" ry="1.1" fill="#505050" opacity="0.48"/>
  `),

  'Mountain-b': buildMotifSvgString(`
    <path d="M32,52 L36,36 L38,30 L40,36 L44,52 Z" fill="#686868" opacity="0.8"/>
    <path d="M38,30 L40,36 L42,32 L44,52 Z" fill="#A0A0A0" opacity="0.78"/>
    <path d="M38,30 L36,33 L38,31 L40,34 Z" fill="#E8E8E8" opacity="0.85"/>
    <path d="M4,54 L9,40 L13,30 L16,16 L18,30 L20,24 L22,52 Z" fill="#545454" opacity="0.92"/>
    <path d="M16,16 L18,30 L20,24 L24,52 L32,52 Z" fill="#AEAEAE" opacity="0.92"/>
    <path d="M16,16 L13,22 L15,20 L17,24 L19,20 L21,25 L20,28 L18,30 L16,24 Z" fill="#F4F4F4" opacity="0.96"/>
    <ellipse cx="8" cy="54" rx="3.5" ry="1.8" fill="#484848" opacity="0.55" transform="rotate(12,8,54)"/>
    <ellipse cx="28" cy="53" rx="2.2" ry="1.2" fill="#505050" opacity="0.48" transform="rotate(-3,28,53)"/>
    <circle cx="46" cy="53" r="1.5" fill="#484848" opacity="0.45"/>
  `),

  'Mountain-c': buildMotifSvgString(`
    <path d="M20,52 L23,40 L26,24 L29,40 L32,52 Z" fill="#787878" opacity="0.65"/>
    <path d="M26,24 L24,30 L26,27 L28,31 Z" fill="#E8E8E8" opacity="0.75"/>
    <path d="M2,54 L6,42 L9,34 L11,22 L13,34 L16,28 L18,52 Z" fill="#525252" opacity="0.9"/>
    <path d="M11,22 L13,34 L16,28 L20,52 L18,52 Z" fill="#ACACAC" opacity="0.9"/>
    <path d="M11,22 L9,27 L11,25 L13,28 L14,25 L13,34 Z" fill="#F0F0F0" opacity="0.94"/>
    <path d="M34,54 L37,38 L39,26 L41,14 L43,26 L45,20 L48,54 Z" fill="#4E4E4E" opacity="0.92"/>
    <path d="M41,14 L43,26 L45,20 L48,54 Z" fill="#B0B0B0" opacity="0.9"/>
    <path d="M41,14 L38,20 L40,18 L42,22 L43,18 L45,22 L43,26 L41,20 Z" fill="#F2F2F2" opacity="0.96"/>
    <ellipse cx="5" cy="54" rx="2.5" ry="1.3" fill="#484848" opacity="0.52" transform="rotate(10,5,54)"/>
    <ellipse cx="31" cy="54" rx="2" ry="1.1" fill="#505050" opacity="0.48" transform="rotate(-5,31,54)"/>
    <circle cx="47" cy="54" r="1.4" fill="#484848" opacity="0.45"/>
  `),

};

// ──────────────────────────────────────────────────────────────────────────────
// 導出 DataURL map
// ──────────────────────────────────────────────────────────────────────────────

export const MOTIF_DATA_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(MOTIF_SVG_STRINGS).map(([k, v]) => [k, svgStringToDataUrl(v)])
);

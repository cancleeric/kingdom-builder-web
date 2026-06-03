// SOURCE: TerrainDefs.tsx（R24-A A 變體）— 色值同步義務
// 若 TerrainDefs.tsx 的 A 變體 gradient stops 或 motif 有異動，必須同步更新此檔
// 棋盤端零改動：TerrainDefs.tsx / HexCell.tsx / HexGrid.tsx 均未動
//
// 方案(b)：Swatch 自帶 inline <defs>，所有 ID 加 sw-{terrain}- 前綴，確保不與棋盤 ID 衝突。
// 棋盤用 grad-{Terrain}-{a/b/c}、motif-{Terrain}-{a/b/c}、light-overlay、center-feather-mask、grain-overlay
// Swatch 用 sw-{Terrain}-grad / sw-{Terrain}-overlay / sw-{Terrain}-feather-grad / sw-{Terrain}-mask / sw-{Terrain}-motif

import React from 'react';

interface TerrainSwatchProps {
  terrain: string; // 'Grass' | 'Forest' | 'Desert' | 'Flower' | 'Canyon' | 'Water' | 'Mountain'
  size?: number;   // 外框正方形邊長，預設 56
}

// pointy-top hex，HEX_SIZE=18，SVG center=(24,24)
// 頂點公式：angle = 90 + 60*i（pointy-top），x = cx + r*cos(angle), y = cy + r*sin(angle)
const HEX_SIZE = 18;
const CX = 24;
const CY = 24;

function computeHexPoints(r: number, cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 90 + 60 * i; // pointy-top：從頂點開始
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

const HEX_POINTS = computeHexPoints(HEX_SIZE, CX, CY);

export const TerrainSwatch: React.FC<TerrainSwatchProps> = ({ terrain, size = 56 }) => {
  // uid prefix 確保 ID 不與棋盤衝突
  const uid = `sw-${terrain}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        {/* ── 地形底色 gradient（A 變體，從 TerrainDefs.tsx 忠實複製）── */}
        <TerrainGradient uid={uid} terrain={terrain} />

        {/* ── light-overlay：左上柔光疊層（與棋盤相同參數）── */}
        <linearGradient id={`${uid}-overlay`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
        </linearGradient>

        {/* ── center-feather-mask（與棋盤相同參數）── */}
        <radialGradient id={`${uid}-feather-grad`} cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="40%"  stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="65%"  stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
        </radialGradient>
        <mask id={`${uid}-mask`}>
          <rect x="0" y="0" width="48" height="48" fill={`url(#${uid}-feather-grad)`} />
        </mask>

        {/* ── motif symbol（A 變體，從 TerrainDefs.tsx 忠實複製）── */}
        <TerrainMotif uid={uid} terrain={terrain} />
      </defs>

      {/* 底色 */}
      <polygon
        points={HEX_POINTS}
        fill={`url(#${uid}-grad)`}
        stroke="#00000022"
        strokeWidth="0.5"
      />

      {/* light overlay */}
      <polygon points={HEX_POINTS} fill={`url(#${uid}-overlay)`} />

      {/* motif（縮放至約 31×36，置中於 48×48 viewBox）*/}
      {/* motif viewBox=0 0 52 60，原始尺寸 52×60；縮比 ~0.6 → 31.2×36。置中：x=24-15.6=8.4, y=24-18=6 */}
      <use
        href={`#${uid}-motif`}
        x={CX - 15.6}
        y={CY - 18}
        width={31.2}
        height={36}
        mask={`url(#${uid}-mask)`}
      />
    </svg>
  );
};

// ── 各地形 A 變體 linearGradient（從 TerrainDefs.tsx 直接複製 stop 色值）──

function TerrainGradient({ uid, terrain }: { uid: string; terrain: string }) {
  // 共用方向：x1="0.15" y1="0" x2="0.85" y2="1"（與棋盤一致）
  const gradId = `${uid}-grad`;
  const gradProps = {
    id: gradId,
    x1: '0.15', y1: '0', x2: '0.85', y2: '1',
    gradientUnits: 'objectBoundingBox' as const,
  };

  switch (terrain) {
    case 'Grass':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#92D470" />
          <stop offset="100%" stopColor="#6AAF4E" />
        </linearGradient>
      );
    case 'Forest':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#357A35" />
          <stop offset="100%" stopColor="#205220" />
        </linearGradient>
      );
    case 'Desert':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#F0B85A" />
          <stop offset="100%" stopColor="#D09040" />
        </linearGradient>
      );
    case 'Flower':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#F87898" />
          <stop offset="100%" stopColor="#E04870" />
        </linearGradient>
      );
    case 'Canyon':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#D06030" />
          <stop offset="100%" stopColor="#A84018" />
        </linearGradient>
      );
    case 'Water':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#4A84C0" />
          <stop offset="100%" stopColor="#2C64A0" />
        </linearGradient>
      );
    case 'Mountain':
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#9C9C9C" />
          <stop offset="100%" stopColor="#787878" />
        </linearGradient>
      );
    default:
      return (
        <linearGradient {...gradProps}>
          <stop offset="0%"   stopColor="#888888" />
          <stop offset="100%" stopColor="#666666" />
        </linearGradient>
      );
  }
}

// ── 各地形 A 變體 motif symbol（從 TerrainDefs.tsx motif-{terrain}-a 直接複製）──

function TerrainMotif({ uid, terrain }: { uid: string; terrain: string }) {
  const symId = `${uid}-motif`;
  const symProps = {
    id: symId,
    viewBox: '0 0 52 60',
    overflow: 'visible' as const,
  };

  switch (terrain) {

    // ── Grass-a：草簇左、右各一叢 + 3 朵野花 ──
    case 'Grass':
      return (
        <symbol {...symProps}>
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
          {/* 野花 1（黃色，左下）*/}
          <g transform="translate(6,47)">
            <ellipse cx="0" cy="-3.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" />
            <ellipse cx="3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(60,3,-1.5)" />
            <ellipse cx="3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(120,3,1.5)" />
            <ellipse cx="0" cy="3.5" rx="1.8" ry="2.8" fill="#EEC83A" opacity="0.9" />
            <ellipse cx="-3" cy="1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-120,-3,1.5)" />
            <ellipse cx="-3" cy="-1.5" rx="1.8" ry="2.8" fill="#F5D84A" opacity="0.95" transform="rotate(-60,-3,-1.5)" />
            <circle cx="0" cy="0" r="1.8" fill="#E8880A" />
          </g>
          {/* 野花 2（白色，右下）*/}
          <g transform="translate(46,46)">
            <ellipse cx="0" cy="-3" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.95" />
            <ellipse cx="2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(60,2.6,-1.5)" />
            <ellipse cx="2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(120,2.6,1.5)" />
            <ellipse cx="0" cy="3" rx="1.6" ry="2.5" fill="#E8E8DC" opacity="0.9" />
            <ellipse cx="-2.6" cy="1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-120,-2.6,1.5)" />
            <ellipse cx="-2.6" cy="-1.5" rx="1.6" ry="2.5" fill="#F0F0E8" opacity="0.9" transform="rotate(-60,-2.6,-1.5)" />
            <circle cx="0" cy="0" r="1.5" fill="#F5C83A" />
          </g>
          {/* 野花 3（淡黃，中右）*/}
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
      );

    // ── Forest-a：左+右前景樹（雲朵冠）+ 中後景小樹 + 落葉 ──
    case 'Forest':
      return (
        <symbol {...symProps}>
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
      );

    // ── Desert-a：左偏小仙人掌 + 3 條沙紋 + 2 碎石 ──
    case 'Desert':
      return (
        <symbol {...symProps}>
          {/* 沙紋弧線 */}
          <path d="M5,44 Q12,41 19,44 Q26,41 33,44 Q40,41 47,44"
            stroke="#A87828" strokeWidth="1.4" fill="none" opacity="0.65" />
          <path d="M4,50 Q12,47 20,50 Q28,47 36,50 Q43,47 48,50"
            stroke="#9A6C20" strokeWidth="1.3" fill="none" opacity="0.6" />
          <path d="M7,56 Q15,53 23,56 Q31,53 39,56 Q44,53 48,56"
            stroke="#8C6018" strokeWidth="1.1" fill="none" opacity="0.5" />
          {/* 左偏小仙人掌（縮 ~40%，霧綠，偏左磚邊，opacity 0.7）*/}
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
      );

    // ── Flower-a：紅/紫/黃 3 朵 ──
    case 'Flower':
      return (
        <symbol {...symProps}>
          {/* 花 1（紅色，左下）*/}
          <g transform="translate(10,48)">
            <ellipse cx="0" cy="-4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.95" />
            <ellipse cx="3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(60,3.8,-2)" />
            <ellipse cx="3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(120,3.8,2)" />
            <ellipse cx="0" cy="4" rx="2.5" ry="3.8" fill="#E83060" opacity="0.9" />
            <ellipse cx="-3.8" cy="2" rx="2.5" ry="3.8" fill="#D02050" opacity="0.92" transform="rotate(-120,-3.8,2)" />
            <ellipse cx="-3.8" cy="-2" rx="2.5" ry="3.8" fill="#E83060" opacity="0.92" transform="rotate(-60,-3.8,-2)" />
            <circle cx="0" cy="0" r="2.5" fill="#FFE840" />
          </g>
          {/* 花 2（紫色，右下）*/}
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
      );

    // ── Canyon-a：4 條岩層 + 淺 V 谷 ──
    case 'Canyon':
      return (
        <symbol {...symProps}>
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
      );

    // ── Water-a：4 條波 + 2 光斑 + 2 泡沫 ──
    case 'Water':
      return (
        <symbol {...symProps}>
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
      );

    // ── Mountain-a：左高右低不規則雙峰 ──
    case 'Mountain':
      return (
        <symbol {...symProps}>
          {/* 左峰暗面（不規則）*/}
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
      );

    default:
      return (
        <symbol {...symProps}>
          <circle cx="26" cy="30" r="10" fill="#888888" opacity="0.5" />
        </symbol>
      );
  }
}

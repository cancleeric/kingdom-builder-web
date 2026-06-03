
// ────────────────────────────────────────────────────
// AchievementIconKey union type（exportしてstore/typesで使用）
// ────────────────────────────────────────────────────
export type AchievementIconKey =
  | 'trophy'
  | 'medal_gold'
  | 'crown'
  | 'dice'
  | 'gamepad'
  | 'calendar'
  | 'star'
  | 'star_burst'
  | 'village'
  | 'city'
  | 'hourglass'
  | 'compass';

interface AchievementBadgeProps {
  iconKey: AchievementIconKey;
  unlocked: boolean;
  size?: number;
  isDark?: boolean;
}

// ────────────────────────────────────────────────────
// 配色（全字面 hex，不用 CSS var）
// ────────────────────────────────────────────────────
function getColors(unlocked: boolean, isDark: boolean) {
  if (unlocked) {
    if (isDark) {
      return {
        shieldFill: '#2a1f16',
        shieldStroke: '#f0cc7a',
        innerRim: '#b89040',
        symbolColor: '#c87080',
        highlight: 'rgba(255,255,255,0.12)',
      };
    }
    return {
      shieldFill: '#f5efe0',
      shieldStroke: '#a07828',
      innerRim: '#c9a84c',
      symbolColor: '#7b2d3a',
      highlight: 'rgba(255,255,255,0.35)',
    };
  }
  // 鎖定態
  if (isDark) {
    return {
      shieldFill: '#2a2a2a',
      shieldStroke: '#555555',
      innerRim: '#444444',
      symbolColor: '#666666',
      highlight: 'none',
    };
  }
  return {
    shieldFill: '#e8e8e8',
    shieldStroke: '#a0a0a0',
    innerRim: '#c0c0c0',
    symbolColor: '#b0b0b0',
    highlight: 'none',
  };
}

// ────────────────────────────────────────────────────
// 內符號：各 iconKey 的 SVG 內容（以盾心為中心，約 20×22 座標範圍）
// 盾中心約 (28, 34)，內符號繪製在 (16..40, 22..46) 範圍內
// ────────────────────────────────────────────────────
function renderSymbol(iconKey: AchievementIconKey, color: string) {
  switch (iconKey) {
    // ── trophy：縮版杯身（複用 TrophyIcon 幾何，無把手）
    case 'trophy':
      return (
        <g>
          {/* 冠形杯口 3 尖頂 */}
          <path
            d="M19 27 L21.5 21 L24 25 L28 19 L32 25 L34.5 21 L37 27 Z"
            fill={color}
          />
          {/* 冠帶 */}
          <rect x="18" y="26.5" width="20" height="4" rx="1" fill={color} />
          {/* 杯身 */}
          <path d="M19 30 L37 30 L35 40 L21 40 Z" fill={color} opacity="0.85" />
          {/* 杯腳 */}
          <rect x="26" y="40" width="4" height="4" fill={color} />
          {/* 底座 */}
          <rect x="21" y="44" width="14" height="3" rx="1.5" fill={color} opacity="0.7" />
          {/* 中央裝飾 */}
          <line x1="28" y1="32" x2="28" y2="38" stroke={color} strokeWidth="0.6" opacity="0.5" />
          <line x1="24" y1="35" x2="32" y2="35" stroke={color} strokeWidth="0.6" opacity="0.5" />
          {/* 尖頂明珠 */}
          <circle cx="21.5" cy="20" r="1.2" fill={color} />
          <circle cx="28"   cy="18" r="1.4" fill={color} />
          <circle cx="34.5" cy="20" r="1.2" fill={color} />
        </g>
      );

    // ── medal_gold：圓牌 + 綬帶頂（複用 MedalIcon rank=1）
    case 'medal_gold':
      return (
        <g>
          {/* 綬帶頂 V 形 */}
          <path
            d="M23 27 L28 21 L33 27"
            fill={color}
            stroke={color}
            strokeWidth="0.8"
          />
          {/* 圓形主牌 */}
          <circle cx="28" cy="38" r="10" fill={color} />
          {/* 內圓細線 */}
          <circle cx="28" cy="38" r="7.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
          {/* 數字 1 */}
          <text
            x="28"
            y="42"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#f5efe0"
            fontFamily="system-ui, sans-serif"
          >
            1
          </text>
          {/* 微光點 */}
          <circle cx="22" cy="32" r="2" fill="white" opacity="0.15" />
        </g>
      );

    // ── crown：皇冠（3 尖頂 + 底帶 + 寶石）
    case 'crown':
      return (
        <g>
          {/* 3 尖頂 + 谷 */}
          <path d="M18 42 L18 30 L22 35 L28 22 L34 35 L38 30 L38 42 Z" fill={color} />
          {/* 底帶 */}
          <rect x="17" y="41" width="22" height="5" rx="1.5" fill={color} />
          {/* 寶石裝飾 */}
          <circle cx="28" cy="43.5" r="1.5" fill={color} opacity="0.5" />
          <circle cx="21" cy="43.5" r="1"   fill={color} opacity="0.4" />
          <circle cx="35" cy="43.5" r="1"   fill={color} opacity="0.4" />
          {/* 尖頂明珠 */}
          <circle cx="22" cy="33.5" r="1.3" fill={color} opacity="0.7" />
          <circle cx="28" cy="21"   r="1.6" fill={color} opacity="0.8" />
          <circle cx="34" cy="33.5" r="1.3" fill={color} opacity="0.7" />
        </g>
      );

    // ── dice：骰子（圓角正方 + 5 點）
    case 'dice':
      return (
        <g>
          <rect x="18" y="22" width="20" height="20" rx="3" fill={color} />
          {/* 五點骰（梅花型）：左上、右上、中、左下、右下 */}
          <circle cx="22" cy="26" r="1.5" fill="#f5efe0" opacity="0.8" />
          <circle cx="34" cy="26" r="1.5" fill="#f5efe0" opacity="0.8" />
          <circle cx="28" cy="32" r="1.5" fill="#f5efe0" opacity="0.8" />
          <circle cx="22" cy="38" r="1.5" fill="#f5efe0" opacity="0.8" />
          <circle cx="34" cy="38" r="1.5" fill="#f5efe0" opacity="0.8" />
        </g>
      );

    // ── gamepad：簡化手把（橢圓 + 十字鍵 + 2 按鈕）
    case 'gamepad':
      return (
        <g>
          {/* 主體橢圓 */}
          <ellipse cx="28" cy="34" rx="12" ry="8" fill={color} />
          {/* 十字鍵（左側） */}
          <rect x="18" y="32.5" width="6" height="3" rx="0.8" fill="#f5efe0" opacity="0.75" />
          <rect x="20.5" y="30" width="3" height="6" rx="0.8" fill="#f5efe0" opacity="0.75" />
          {/* 兩顆按鈕（右側） */}
          <circle cx="34" cy="32" r="1.8" fill="#f5efe0" opacity="0.75" />
          <circle cx="37" cy="35" r="1.8" fill="#f5efe0" opacity="0.75" />
          {/* 中央頂部凸起 */}
          <ellipse cx="28" cy="27" rx="4" ry="2.5" fill={color} />
          <ellipse cx="28" cy="41" rx="4" ry="2.5" fill={color} />
        </g>
      );

    // ── calendar：日曆（圓角方 + 橫線 + 頂部釘環）
    case 'calendar':
      return (
        <g>
          {/* 主體 */}
          <rect x="18" y="25" width="20" height="20" rx="2.5" fill={color} />
          {/* 頂帶（深色橫條） */}
          <rect x="18" y="25" width="20" height="6" rx="2.5" fill={color} opacity="0.65" />
          {/* 釘環左右 */}
          <rect x="22" y="22" width="2.5" height="5" rx="1.2" fill={color} />
          <rect x="31.5" y="22" width="2.5" height="5" rx="1.2" fill={color} />
          {/* 日期線條（3 行） */}
          <line x1="21" y1="35" x2="35" y2="35" stroke="#f5efe0" strokeWidth="1.2" opacity="0.7" />
          <line x1="21" y1="39" x2="35" y2="39" stroke="#f5efe0" strokeWidth="1.2" opacity="0.7" />
          <line x1="21" y1="43" x2="30" y2="43" stroke="#f5efe0" strokeWidth="1.2" opacity="0.5" />
        </g>
      );

    // ── star：五角星（1 path）
    case 'star':
      return (
        <g>
          <path
            d="M28 20 L30.4 27.2 L38 27.2 L32 31.8 L34.4 39 L28 34.4 L21.6 39 L24 31.8 L18 27.2 L25.6 27.2 Z"
            fill={color}
          />
        </g>
      );

    // ── star_burst：八角爆炸星（1 path）
    case 'star_burst':
      return (
        <g>
          <path
            d="M28 19 L30 25.5 L36 22 L32.5 28 L39 30 L32.5 32 L36 38 L30 34.5 L28 41 L26 34.5 L20 38 L23.5 32 L17 30 L23.5 28 L20 22 L26 25.5 Z"
            fill={color}
          />
          <circle cx="28" cy="30" r="2.5" fill="#f5efe0" opacity="0.3" />
        </g>
      );

    // ── village：3 棟房子（三角屋頂 + 方形主體）
    case 'village':
      return (
        <g>
          {/* 左小屋 */}
          <rect x="17" y="36" width="8" height="9" fill={color} />
          <path d="M16 37 L21 28 L26 37 Z" fill={color} />
          {/* 右小屋 */}
          <rect x="31" y="36" width="8" height="9" fill={color} />
          <path d="M30 37 L35 28 L40 37 Z" fill={color} />
          {/* 中大屋（前景） */}
          <rect x="22" y="34" width="12" height="11" fill={color} />
          <path d="M20 35 L28 23 L36 35 Z" fill={color} />
          {/* 門 */}
          <rect x="26" y="39" width="4" height="6" rx="0.8" fill="#f5efe0" opacity="0.4" />
        </g>
      );

    // ── city：城市輪廓（4 棟高低樓 + 底線）
    case 'city':
      return (
        <g>
          {/* 底線 */}
          <rect x="17" y="46" width="22" height="2" fill={color} />
          {/* 樓 1（左，矮） */}
          <rect x="17" y="38" width="5" height="8" fill={color} />
          <rect x="18" y="36" width="1.5" height="3" fill={color} />
          <rect x="20.5" y="36" width="1.5" height="3" fill={color} />
          {/* 樓 2（中左，高） */}
          <rect x="23" y="28" width="6" height="18" fill={color} />
          <rect x="24" y="26" width="1.5" height="3" fill={color} />
          <rect x="26.5" y="26" width="1.5" height="3" fill={color} />
          {/* 樓 3（中右，中）*/}
          <rect x="30" y="33" width="5" height="13" fill={color} />
          <rect x="31" y="31" width="1.5" height="3" fill={color} />
          <rect x="33" y="31" width="1.5" height="3" fill={color} />
          {/* 樓 4（右，矮） */}
          <rect x="36" y="39" width="4" height="7" fill={color} />
          {/* 窗（各棟一個） */}
          <rect x="25" y="31" width="2" height="3" rx="0.5" fill="#f5efe0" opacity="0.35" />
          <rect x="31.5" y="36" width="2" height="3" rx="0.5" fill="#f5efe0" opacity="0.35" />
        </g>
      );

    // ── hourglass：沙漏（上下三角 + 腰線 + 沙粒）
    case 'hourglass':
      return (
        <g>
          {/* 外框上下橫桿 */}
          <rect x="19" y="20" width="18" height="3" rx="1.5" fill={color} />
          <rect x="19" y="45" width="18" height="3" rx="1.5" fill={color} />
          {/* 上半沙（往腰部收縮的梯形） */}
          <path d="M20 23 L36 23 L30 34 L26 34 Z" fill={color} opacity="0.9" />
          {/* 下半沙（從腰部擴張） */}
          <path d="M26 34 L30 34 L36 45 L20 45 Z" fill={color} opacity="0.7" />
          {/* 腰部 */}
          <line x1="24" y1="34" x2="32" y2="34" stroke={color} strokeWidth="1.5" />
          {/* 沙粒堆（下方底部） */}
          <ellipse cx="28" cy="43.5" rx="5" ry="1.5" fill="#f5efe0" opacity="0.25" />
        </g>
      );

    // ── compass：羅盤（外圓 + 4 方位刻 + 指針菱形）
    case 'compass':
      return (
        <g>
          {/* 外圓 */}
          <circle cx="28" cy="32" r="11" fill={color} />
          {/* 內圓（鏤空感） */}
          <circle cx="28" cy="32" r="8" fill="#f5efe0" opacity="0.15" />
          {/* 4 方位短刻線 */}
          <line x1="28" y1="21" x2="28" y2="24" stroke="#f5efe0" strokeWidth="1.5" opacity="0.8" />
          <line x1="28" y1="40" x2="28" y2="43" stroke="#f5efe0" strokeWidth="1.5" opacity="0.8" />
          <line x1="17" y1="32" x2="20" y2="32" stroke="#f5efe0" strokeWidth="1.5" opacity="0.8" />
          <line x1="36" y1="32" x2="39" y2="32" stroke="#f5efe0" strokeWidth="1.5" opacity="0.8" />
          {/* 指針菱形（N 白 + S 暗） */}
          <path d="M28 23 L30.5 32 L28 36 L25.5 32 Z" fill="white" opacity="0.85" />
          <path d="M28 36 L30.5 32 L28 41 L25.5 32 Z" fill={color} opacity="0.5" />
          {/* 中心點 */}
          <circle cx="28" cy="32" r="1.5" fill="#f5efe0" opacity="0.9" />
        </g>
      );

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────
// AchievementBadge 元件
// ────────────────────────────────────────────────────
export function AchievementBadge({
  iconKey,
  unlocked,
  size = 56,
  isDark = false,
}: AchievementBadgeProps) {
  const c = getColors(unlocked, isDark);

  return (
    <svg
      viewBox="0 0 56 64"
      width={size}
      height={size}
      style={{ display: 'block' }}
      aria-hidden="true"
      role="img"
    >
      {/* ── 盾形外框 ── */}
      <path
        d="M28 2 L52 10 L52 34 Q52 52 28 62 Q4 52 4 34 L4 10 Z"
        fill={c.shieldFill}
        stroke={c.shieldStroke}
        strokeWidth="2.5"
      />

      {/* ── 盾面裝飾：內框細線 ── */}
      <path
        d="M28 7 L47 14 L47 33 Q47 48 28 57 Q9 48 9 33 L9 14 Z"
        fill="none"
        stroke={c.innerRim}
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* ── 解鎖高光點（右上角，增質感） ── */}
      {unlocked && c.highlight !== 'none' && (
        <circle cx="43" cy="14" r="4" fill={c.highlight} />
      )}

      {/* ── 內符號（盾心區域） ── */}
      {renderSymbol(iconKey, c.symbolColor)}
    </svg>
  );
}

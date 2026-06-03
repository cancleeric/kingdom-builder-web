interface KingdomCrestProps {
  /** lg = desktop 120×140 | sm = mobile 84×98 */
  size?: 'lg' | 'sm';
  isDark?: boolean;
  style?: React.CSSProperties;
}

export function KingdomCrest({ size = 'lg', isDark = false, style }: KingdomCrestProps) {
  // 配色：字面 hex，不用 CSS var（SVG presentation attr 吃不到 var）
  const wine     = isDark ? '#c87080' : '#7b2d3a';
  const gold     = isDark ? '#f0cc7a' : '#c9a84c';
  const shieldBg = isDark ? '#2a1f16' : '#f5efe0';
  const castleFill = wine;
  const castleOpacity = isDark ? 0.90 : 0.85;
  const bannerFill = isDark ? '#5a1e28' : '#7b2d3a';

  // 內框路徑（盾型略縮 4px，作金色細線）
  const innerShield = 'M14 14 L106 14 L106 88 Q106 124 60 134 Q14 124 14 88 Z';

  const width  = size === 'lg' ? 120 : 84;
  const height = size === 'lg' ? 140 : 98;

  return (
    <svg
      viewBox="0 0 120 140"
      width={width}
      height={height}
      style={{ display: 'block', pointerEvents: 'none', ...style }}
      aria-hidden="true"
      role="img"
    >
      {/* ── 盾底填充 ── */}
      <path
        d="M10 10 L110 10 L110 88 Q110 128 60 138 Q10 128 10 88 Z"
        fill={shieldBg}
        stroke="none"
      />

      {/* ── 盾上 1/3 分線 ── */}
      <line x1="12" y1="48" x2="108" y2="48" stroke={gold} strokeWidth="0.8" opacity="0.7" />

      {/* ── 城堡剪影（盾下半段） ── */}
      {/* 左塔 */}
      <rect x="22" y="62" width="18" height="30" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 左塔齒堞 3 個 */}
      <rect x="22" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="29" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="36" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 右塔 */}
      <rect x="80" y="62" width="18" height="30" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 右塔齒堞 3 個 */}
      <rect x="80" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="87" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="94" y="57" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 中體 */}
      <rect x="36" y="70" width="48" height="22" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 中體齒堞 3 個 */}
      <rect x="41" y="65" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="55" y="65" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      <rect x="69" y="65" width="5"  height="7" fill={castleFill} fillOpacity={castleOpacity} />
      {/* 城門拱（鏤空效果：用 shieldBg 填充蓋回） */}
      <path
        d="M51 92 L51 78 Q60 72 69 78 L69 92 Z"
        fill={shieldBg}
      />

      {/* ── 皇冠（盾上半段中央，尖頂冠 + 寶石 + 明珠） ── */}
      {/* 冠身：3 尖頂 + 谷（非矩形塊，讀作皇冠） */}
      <path d="M39 32 L46 18 L53 27 L60 14 L67 27 L74 18 L81 32 Z" fill={gold} />
      {/* 冠帶 */}
      <rect x="37" y="31" width="46" height="8" rx="2" fill={gold} />
      {/* 冠帶寶石（酒紅） */}
      <circle cx="60" cy="35" r="2.4" fill={wine} />
      <circle cx="48" cy="35" r="1.5" fill={wine} opacity="0.8" />
      <circle cx="72" cy="35" r="1.5" fill={wine} opacity="0.8" />
      {/* 尖頂明珠（金，酒紅細描邊增辨識） */}
      <circle cx="46" cy="16" r="2.8" fill={gold} stroke={wine} strokeWidth="0.5" />
      <circle cx="60" cy="12" r="3.2" fill={gold} stroke={wine} strokeWidth="0.5" />
      <circle cx="74" cy="16" r="2.8" fill={gold} stroke={wine} strokeWidth="0.5" />

      {/* ── 盾外框雙線 ── */}
      {/* 外描邊（酒紅，粗） */}
      <path
        d="M10 10 L110 10 L110 88 Q110 128 60 138 Q10 128 10 88 Z"
        fill="none"
        stroke={wine}
        strokeWidth="3.5"
      />
      {/* 內描邊（金色，細） */}
      <path
        d={innerShield}
        fill="none"
        stroke={gold}
        strokeWidth="1"
      />

      {/* ── 四角月桂卷紋（純 stroke） ── */}
      {/* 左上 */}
      <path d="M12 12 Q4 8 4 16 Q4 24 12 22" fill="none" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      {/* 右上 */}
      <path d="M108 12 Q116 8 116 16 Q116 24 108 22" fill="none" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      {/* 左下（靠盾底弧） */}
      <path d="M22 112 Q12 118 16 128 Q20 136 28 132" fill="none" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      {/* 右下 */}
      <path d="M98 112 Q108 118 104 128 Q100 136 92 132" fill="none" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />

      {/* ── 底部綬帶 ── */}
      <path
        d="M22 126 Q60 138 98 126 L98 132 Q60 146 22 132 Z"
        fill={bannerFill}
        stroke={gold}
        strokeWidth="1"
      />

      {/* 綬帶中央裝飾點 */}
      <circle cx="60" cy="130" r="2" fill={gold} opacity="0.8" />
      <circle cx="48" cy="130" r="1.2" fill={gold} opacity="0.5" />
      <circle cx="72" cy="130" r="1.2" fill={gold} opacity="0.5" />
    </svg>
  );
}

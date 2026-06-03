
interface MedalIconProps {
  rank: 1 | 2 | 3;
  size?: number;
  isDark?: boolean;
}

export function MedalIcon({ rank, size = 36, isDark = false }: MedalIconProps) {
  // 全字面 hex，不用 var()（SVG presentation attr 吃不到 CSS var）
  // Light / Dark 配色
  const config = {
    1: {
      medalFill:   isDark ? '#f0cc7a' : '#c9a84c',
      rimColor:    isDark ? '#c4a030' : '#a07828',
      innerRim:    isDark ? '#fff8dc' : '#ffe082',
      ribbonEdge:  isDark ? '#c4a030' : '#a07828',
      textColor:   isDark ? '#7b2d3a' : '#7b2d3a',
    },
    2: {
      medalFill:   isDark ? '#cfd8dc' : '#b0bec5',
      rimColor:    isDark ? '#90a4ae' : '#78909c',
      innerRim:    isDark ? '#f5f5f5' : '#eceff1',
      ribbonEdge:  isDark ? '#90a4ae' : '#78909c',
      textColor:   isDark ? '#37474f' : '#455a64',
    },
    3: {
      medalFill:   isDark ? '#c4834a' : '#a0672a',
      rimColor:    isDark ? '#9e6030' : '#7a4d18',
      innerRim:    isDark ? '#ffe0b2' : '#ffcc80',
      ribbonEdge:  isDark ? '#9e6030' : '#7a4d18',
      textColor:   isDark ? '#f5efe0' : '#f5efe0',
    },
  } as const;

  const c = config[rank];

  return (
    <svg
      viewBox="0 0 40 48"
      width={size}
      height={size}
      style={{ display: 'block' }}
      aria-hidden="true"
      role="img"
    >
      {/* ① 綬帶頂（V 形） */}
      <path
        d="M12 12 L20 4 L28 12"
        fill={c.medalFill}
        stroke={c.ribbonEdge}
        strokeWidth="1"
      />

      {/* ② 圓形主牌面 */}
      <circle
        cx="20"
        cy="28"
        r="16"
        fill={c.medalFill}
        stroke={c.rimColor}
        strokeWidth="2"
      />

      {/* ③ 內圓細線（一圈裝飾） */}
      <circle
        cx="20"
        cy="28"
        r="12.5"
        fill="none"
        stroke={c.innerRim}
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* ④ 名次數字 */}
      <text
        x="20"
        y="33"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={c.textColor}
        fontFamily="system-ui, sans-serif"
      >
        {rank}
      </text>

      {/* ⑤ 微光點（牌面左上，增質感） */}
      <circle cx="13" cy="21" r="3" fill="white" opacity="0.18" />
    </svg>
  );
}

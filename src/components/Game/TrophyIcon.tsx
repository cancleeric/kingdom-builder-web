import React from 'react';

interface TrophyIconProps {
  size?: number;
  isDark?: boolean;
  className?: string;
}

export function TrophyIcon({ size = 64, isDark = false, className }: TrophyIconProps) {
  // 全字面 hex，不用 var()（SVG presentation attr 吃不到 CSS var）
  const wine    = isDark ? '#c87080' : '#7b2d3a';
  const gold    = isDark ? '#f0cc7a' : '#c9a84c';
  const cupBody = isDark ? '#b06070' : '#8a3345';
  const base    = isDark ? '#2a1f16' : '#f5efe0';

  return (
    <svg
      viewBox="0 0 80 88"
      width={size}
      height={size}
      style={{ display: 'block' }}
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* ① 冠形杯口（3 尖頂，呼應 KingdomCrest 皇冠） */}
      <path
        d="M20 28 L26 14 L33 24 L40 10 L47 24 L54 14 L60 28 Z"
        fill={gold}
      />

      {/* ② 冠帶（杯口腰線） */}
      <rect x="18" y="27" width="44" height="7" rx="2" fill={gold} />
      {/* 冠帶寶石：中央大顆 + 左右小顆 */}
      <circle cx="40" cy="30.5" r="2.2" fill={wine} />
      <circle cx="28" cy="30.5" r="1.4" fill={wine} opacity="0.8" />
      <circle cx="52" cy="30.5" r="1.4" fill={wine} opacity="0.8" />

      {/* ③ 杯身（上窄下寬梯形） */}
      <path d="M22 34 L58 34 L54 56 L26 56 Z" fill={cupBody} />

      {/* ④ 左把手（桂枝風格，純 stroke） */}
      <path
        d="M22 36 Q6 36 6 48 Q6 58 18 58"
        fill="none"
        stroke={gold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* ④ 右把手 */}
      <path
        d="M58 36 Q74 36 74 48 Q74 58 62 58"
        fill="none"
        stroke={gold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ⑤ 杯腳（細頸） */}
      <rect x="36" y="56" width="8" height="10" fill={gold} />

      {/* ⑥ 底座 */}
      <rect x="24" y="66" width="32" height="7" rx="3" fill={base} stroke={gold} strokeWidth="1.2" />

      {/* ⑦ 桂冠葉裝飾（左右各 2 片，純 stroke） */}
      {/* 左葉上 */}
      <path
        d="M20 40 Q10 36 11 44 Q12 50 20 48"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* 左葉下 */}
      <path
        d="M20 46 Q8 44 10 52 Q12 58 20 55"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* 右葉上 */}
      <path
        d="M60 40 Q70 36 69 44 Q68 50 60 48"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* 右葉下 */}
      <path
        d="M60 46 Q72 44 70 52 Q68 58 60 55"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* ⑧ 杯身中央刻紋（十字 + 圓環，呼應寶石語言） */}
      <line x1="40" y1="39" x2="40" y2="51" stroke={gold} strokeWidth="0.8" opacity="0.6" />
      <line x1="33" y1="45" x2="47" y2="45" stroke={gold} strokeWidth="0.8" opacity="0.6" />
      <circle cx="40" cy="45" r="2" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.7" />

      {/* 尖頂明珠（呼應 KingdomCrest，有酒紅細描邊） */}
      <circle cx="26" cy="12" r="2"   fill={gold} stroke={wine} strokeWidth="0.5" />
      <circle cx="40" cy="8"  r="2.4" fill={gold} stroke={wine} strokeWidth="0.5" />
      <circle cx="54" cy="12" r="2"   fill={gold} stroke={wine} strokeWidth="0.5" />
    </svg>
  );
}

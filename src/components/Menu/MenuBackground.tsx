/**
 * MenuBackground — R26 主選單氛圍背景
 * 三層絕對定位，全部 pointer-events: none
 *
 * 層 0 (z=0): 羅盤底紋（desktop only）
 * 層 1 (z=1): Vignette 暈影（CSS token）
 * 層 2 (z=2): 城堡天際線剪影（底部）
 */

interface MenuBackgroundProps {
  isDark?: boolean;
}

export function MenuBackground({ isDark = false }: MenuBackgroundProps) {
  const skylineFill = isDark ? '#e8a0a8' : '#7b2d3a';
  const compassStroke = '#7b2d3a';

  return (
    <>
      {/* ── 層 0：羅盤底紋（desktop only） ── */}
      <div
        className="hidden sm:block"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480,
          height: 480,
          opacity: isDark ? 0.025 : 0.03,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <svg viewBox="0 0 480 480" width="480" height="480" aria-hidden="true">
          {/* 外圓環 */}
          <circle cx="240" cy="240" r="230" fill="none" stroke={compassStroke} strokeWidth="1.5" />
          <circle cx="240" cy="240" r="210" fill="none" stroke={compassStroke} strokeWidth="0.8" />
          {/* 16 方位射線 */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * Math.PI * 2) / 16;
            const len = i % 4 === 0 ? 200 : i % 2 === 0 ? 180 : 160;
            return (
              <line
                key={i}
                x1={240 + Math.cos(angle) * 30}
                y1={240 + Math.sin(angle) * 30}
                x2={240 + Math.cos(angle) * len}
                y2={240 + Math.sin(angle) * len}
                stroke={compassStroke}
                strokeWidth={i % 4 === 0 ? 1.2 : 0.7}
              />
            );
          })}
          {/* 內圓 */}
          <circle cx="240" cy="240" r="40" fill="none" stroke="#c9a84c" strokeWidth="1" />
          <circle cx="240" cy="240" r="8"  fill="#c9a84c" opacity="0.5" />
        </svg>
      </div>

      {/* ── 層 1：Vignette 暈影 ── */}
      {/* dark mode 由 tokens.css [data-theme=dark] 覆蓋 --menu-vignette-light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'var(--menu-vignette-light)',
        }}
      />

      {/* ── 層 2：城堡天際線剪影（底部） ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="xMidYMax slice"
          width="100%"
          style={{
            display: 'block',
            opacity: 'var(--menu-skyline-opacity-light)',
          }}
          aria-hidden="true"
        >
          {/* 遠山左 */}
          <path
            d="M0 145 Q150 120 300 130 Q400 122 500 132 L500 160 L0 160 Z"
            fill={skylineFill}
          />
          {/* 遠山右 */}
          <path
            d="M940 130 Q1100 118 1300 128 Q1380 122 1440 126 L1440 160 L940 160 Z"
            fill={skylineFill}
          />
          {/* 地基丘陵 */}
          <path
            d="M0 160 Q200 135 400 148 Q600 133 800 142 Q1000 132 1200 143 Q1320 137 1440 134 L1440 160 Z"
            fill={skylineFill}
          />
          {/* 前景丘陵（稍亮疊加感） */}
          <path
            d="M0 150 Q360 138 720 145 Q1080 138 1440 143 L1440 160 L0 160 Z"
            fill={skylineFill}
            fillOpacity="0.15"
          />

          {/* ── 左側小塔 ── */}
          <rect x="140" y="105" width="28" height="45" fill={skylineFill} />
          {/* 左塔齒堞 */}
          <rect x="140" y="100" width="6" height="7" fill={skylineFill} />
          <rect x="149" y="100" width="6" height="7" fill={skylineFill} />
          <rect x="158" y="100" width="6" height="7" fill={skylineFill} />
          {/* 左塔門 */}
          <rect x="151" y="130" width="6" height="20" fill={skylineFill} fillOpacity="0.4" />

          {/* ── 右側小塔 ── */}
          <rect x="1272" y="105" width="28" height="45" fill={skylineFill} />
          {/* 右塔齒堞 */}
          <rect x="1272" y="100" width="6" height="7" fill={skylineFill} />
          <rect x="1281" y="100" width="6" height="7" fill={skylineFill} />
          <rect x="1290" y="100" width="6" height="7" fill={skylineFill} />
          {/* 右塔門 */}
          <rect x="1283" y="130" width="6" height="20" fill={skylineFill} fillOpacity="0.4" />

          {/* ── 中央主城 ── */}
          {/* 左側塔 */}
          <rect x="606" y="80" width="38" height="60" fill={skylineFill} />
          {/* 左塔齒堞 */}
          <rect x="606" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="616" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="626" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="636" y="74" width="7" height="8" fill={skylineFill} />

          {/* 右側塔 */}
          <rect x="796" y="80" width="38" height="60" fill={skylineFill} />
          {/* 右塔齒堞 */}
          <rect x="796" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="806" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="816" y="74" width="7" height="8" fill={skylineFill} />
          <rect x="826" y="74" width="7" height="8" fill={skylineFill} />

          {/* 中體 */}
          <rect x="632" y="90" width="176" height="50" fill={skylineFill} />

          {/* 中央主塔（最高） */}
          <rect x="692" y="55" width="56" height="85" fill={skylineFill} />
          {/* 主塔齒堞 */}
          <rect x="692" y="48" width="9"  height="9" fill={skylineFill} />
          <rect x="704" y="48" width="9"  height="9" fill={skylineFill} />
          <rect x="716" y="48" width="9"  height="9" fill={skylineFill} />
          <rect x="728" y="48" width="9"  height="9" fill={skylineFill} />
          <rect x="740" y="48" width="9"  height="9" fill={skylineFill} />

          {/* 城門拱洞（鏤空，用低 opacity 矩形+弧表示） */}
          <rect  x="712" y="115" width="16" height="25" fill={skylineFill} fillOpacity="0.25" />
          <ellipse cx="720" cy="115" rx="8" ry="5" fill={skylineFill} fillOpacity="0.25" />
        </svg>
      </div>
    </>
  );
}

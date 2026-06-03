import React from 'react';

/**
 * PieceDefs — R24-B 棋子 2.5D 彩色 SVG defs
 *
 * 包含：
 *   - piece-drop-shadow filter（共用）
 *   - 9 種地點棋子 linearGradient
 *   - 9 個 <symbol id="piece-{location}"> viewBox="0 0 28 28" overflow="visible"
 *
 * 注意：SVG attr 不吃 CSS var，所有 fill/stroke/stop-color 均使用 hardcode hex。
 * 此元件只需插入 Board SVG 一次（HexGrid），所有 LocationMarker 以 <use href="#piece-{location}"> 引用。
 */
export const PieceDefs: React.FC = () => (
  <defs>
    {/* ── 共用投影 filter ─────────────────────────────────────────────────── */}
    <filter id="piece-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.45" />
    </filter>

    {/* ── Castle 灰石城堡漸層 ────────────────────────────────────────────── */}
    <linearGradient id="grad-castle-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#9e9e9e" />
      <stop offset="100%" stopColor="#707070" />
    </linearGradient>
    <linearGradient id="grad-castle-tower" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8a8a8a" />
      <stop offset="100%" stopColor="#606060" />
    </linearGradient>

    {/* ── Farm 農場漸層 ──────────────────────────────────────────────────── */}
    <linearGradient id="grad-farm-wall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#c4894a" />
      <stop offset="100%" stopColor="#a06830" />
    </linearGradient>
    <linearGradient id="grad-farm-roof" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#c04040" />
      <stop offset="100%" stopColor="#882020" />
    </linearGradient>

    {/* ── Oasis 綠洲漸層 ─────────────────────────────────────────────────── */}
    <linearGradient id="grad-oasis-water" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#5aaee0" />
      <stop offset="100%" stopColor="#3a8fc8" />
    </linearGradient>

    {/* ── Tower 塔樓漸層（圓柱左亮右暗） ────────────────────────────────── */}
    <linearGradient id="grad-tower-body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#b0b0b0" />
      <stop offset="60%" stopColor="#909090" />
      <stop offset="100%" stopColor="#585858" />
    </linearGradient>

    {/* ── Harbor 港口漸層 ─────────────────────────────────────────────────── */}
    <linearGradient id="grad-harbor-water" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#6098c8" />
      <stop offset="100%" stopColor="#4682b4" />
    </linearGradient>
    <linearGradient id="grad-harbor-dock" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#b0804a" />
      <stop offset="100%" stopColor="#a0703a" />
    </linearGradient>

    {/* ── Paddock 牧場漸層 ────────────────────────────────────────────────── */}
    <linearGradient id="grad-paddock-grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#72a040" />
      <stop offset="100%" stopColor="#5a8a30" />
    </linearGradient>

    {/* ── Barn 穀倉漸層 ──────────────────────────────────────────────────── */}
    <linearGradient id="grad-barn-wall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#c09050" />
      <stop offset="100%" stopColor="#b07840" />
    </linearGradient>
    <linearGradient id="grad-barn-roof-top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#a03030" />
      <stop offset="100%" stopColor="#903030" />
    </linearGradient>
    <linearGradient id="grad-barn-roof-mid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#b84040" />
      <stop offset="100%" stopColor="#b04040" />
    </linearGradient>

    {/* ── Oracle 神廟漸層 ─────────────────────────────────────────────────── */}
    <linearGradient id="grad-oracle-pediment" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#d4b040" />
      <stop offset="100%" stopColor="#a07020" />
    </linearGradient>

    {/* ── Tavern 酒館漸層 ─────────────────────────────────────────────────── */}
    <linearGradient id="grad-tavern-wall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#d0a060" />
      <stop offset="100%" stopColor="#c49050" />
    </linearGradient>
    <linearGradient id="grad-tavern-roof" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#7a4818" />
      <stop offset="100%" stopColor="#6a4010" />
    </linearGradient>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-castle（城堡）
        viewBox 28×28，overflow="visible" 確保投影不被裁切
        結構：地面投影橢圓 → 城牆正面 → 兩側塔樓 → 鋸齒城垛 → 城門 → 酒紅旗
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-castle" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25" rx="11" ry="3.5" fill="#2a2a2a" opacity="0.3" />
      {/* 城牆正面 */}
      <rect x="5" y="14" width="18" height="9" fill="url(#grad-castle-wall)" />
      {/* 側面（2.5D 側面暗色） */}
      <rect x="3" y="15" width="2.5" height="8" fill="#606060" />
      <rect x="22.5" y="15" width="2.5" height="8" fill="#606060" />
      {/* 左塔樓 */}
      <rect x="3" y="10" width="7" height="13" fill="url(#grad-castle-tower)" />
      {/* 右塔樓 */}
      <rect x="18" y="10" width="7" height="13" fill="url(#grad-castle-tower)" />
      {/* 城垛（左塔） */}
      <rect x="3" y="8" width="1.8" height="3" fill="#8a8a8a" />
      <rect x="5.6" y="8" width="1.8" height="3" fill="#8a8a8a" />
      <rect x="8.2" y="8" width="1.8" height="3" fill="#8a8a8a" />
      {/* 城垛（右塔） */}
      <rect x="18" y="8" width="1.8" height="3" fill="#8a8a8a" />
      <rect x="20.6" y="8" width="1.8" height="3" fill="#8a8a8a" />
      <rect x="23.2" y="8" width="1.8" height="3" fill="#8a8a8a" />
      {/* 城垛（城牆頂） */}
      <rect x="10.5" y="12" width="1.5" height="2.5" fill="#8a8a8a" />
      <rect x="13" y="12" width="1.5" height="2.5" fill="#8a8a8a" />
      <rect x="15.5" y="12" width="1.5" height="2.5" fill="#8a8a8a" />
      {/* 城門 */}
      <rect x="11.5" y="18" width="5" height="5" rx="2" fill="#3a2a1a" />
      {/* 塔窗 */}
      <rect x="5.5" y="12" width="2" height="2.5" fill="#2a2a2a" />
      <rect x="20.5" y="12" width="2" height="2.5" fill="#2a2a2a" />
      {/* 酒紅旗（左塔頂） */}
      <polygon points="6.5,8 6.5,4 10,6" fill="#8b1a1a" />
      {/* 投影 filter */}
      <rect x="3" y="8" width="22" height="15" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-farm（農場）
        結構：地面投影橢圓 → 側牆 → 正面牆 → 屋頂斜面 → 門 → 窗
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-farm" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3" />
      {/* 側面牆（2.5D 左側） */}
      <rect x="3" y="16" width="4" height="9" fill="#a06830" />
      {/* 正面牆 */}
      <rect x="7" y="16" width="18" height="9" fill="url(#grad-farm-wall)" />
      {/* 屋頂側面（2.5D） */}
      <polygon points="3,16 7,16 7,10 5,8" fill="#882020" />
      {/* 屋頂斜面正面 */}
      <polygon points="7,16 25,16 25,10 14,6 7,10" fill="url(#grad-farm-roof)" />
      {/* 屋脊線 */}
      <line x1="7" y1="10" x2="25" y2="10" stroke="#661818" strokeWidth="0.8" />
      {/* 門 */}
      <rect x="12" y="20" width="5" height="5" rx="1" fill="#5a3010" />
      {/* 窗 */}
      <rect x="8.5" y="18" width="2.5" height="2.5" rx="0.3" fill="#f0e8d0" />
      <rect x="19" y="18" width="2.5" height="2.5" rx="0.3" fill="#f0e8d0" />
      {/* 投影 */}
      <rect x="3" y="6" width="22" height="19" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-oasis（綠洲）
        結構：水面橢圓（帶水波） → 棕櫚樹幹 → 棕櫚葉
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-oasis" viewBox="0 0 28 28" overflow="visible">
      {/* 水面（地面本身） */}
      <ellipse cx="14" cy="22" rx="11" ry="4.5" fill="url(#grad-oasis-water)" />
      {/* 水波線 */}
      <path d="M8,21 Q11,19.5 14,21 Q17,22.5 20,21" fill="none" stroke="#78c8f0" strokeWidth="0.8" opacity="0.7" />
      <path d="M9,22.5 Q12,21.5 15,22.5 Q17.5,23.5 19,22.5" fill="none" stroke="#78c8f0" strokeWidth="0.6" opacity="0.5" />
      {/* 投影（樹幹） */}
      <ellipse cx="15" cy="23" rx="3" ry="1.2" fill="#1a4a1a" opacity="0.3" />
      {/* 樹幹（略偏，微傾） */}
      <path d="M14,22 Q14.5,18 15,14 Q15.3,10 15.5,8" stroke="#8b5e3c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* 棕櫚葉（右） */}
      <path d="M15.5,8 Q20,5 23,7" stroke="#2d6a20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M15.5,8 Q21,8 22,11" stroke="#2d6a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 棕櫚葉（左） */}
      <path d="M15.5,8 Q11,5 8,8" stroke="#2d6a20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M15.5,8 Q10,9 9,12" stroke="#2d6a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 棕櫚葉（上） */}
      <path d="M15.5,8 Q15,4 14,2" stroke="#3a8030" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* 葉端小點 */}
      <circle cx="23" cy="7" r="1.2" fill="#2d6a20" />
      <circle cx="8" cy="8" r="1.2" fill="#2d6a20" />
      {/* 投影 filter */}
      <ellipse cx="14" cy="22" rx="11" ry="4.5" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-tower（瞭望塔）
        結構：地面投影橢圓 → 塔身圓柱 → 塔頂錐形 → 箭孔 → 石縫
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-tower" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25.5" rx="7" ry="2.5" fill="#2a2a2a" opacity="0.3" />
      {/* 塔身（圓柱，用 rect + 弧線表現） */}
      <rect x="9" y="12" width="10" height="13" rx="5" fill="url(#grad-tower-body)" />
      {/* 塔底橢圓（坐地感） */}
      <ellipse cx="14" cy="25" rx="5" ry="1.5" fill="#606060" />
      {/* 塔身石縫 */}
      <line x1="9.5" y1="16" x2="18.5" y2="16" stroke="#808080" strokeWidth="0.5" />
      <line x1="9.5" y1="19" x2="18.5" y2="19" stroke="#808080" strokeWidth="0.5" />
      <line x1="9.5" y1="22" x2="18.5" y2="22" stroke="#808080" strokeWidth="0.5" />
      {/* 箭孔 */}
      <rect x="12.5" y="14" width="1.5" height="3" rx="0.5" fill="#2a2a2a" />
      <rect x="12.5" y="20" width="1.5" height="2.5" rx="0.5" fill="#2a2a2a" />
      {/* 塔頂錐形 */}
      <polygon points="9,12 19,12 16,6 12,6" fill="#686868" />
      <polygon points="9,12 12,6 10,12" fill="#505050" />
      {/* 塔頂尖 */}
      <polygon points="12,6 16,6 14,2" fill="#404040" />
      {/* 城垛（塔頂） */}
      <rect x="9.5" y="10" width="1.5" height="2.5" fill="#585858" />
      <rect x="12" y="10" width="1.5" height="2.5" fill="#585858" />
      <rect x="14.5" y="10" width="1.5" height="2.5" fill="#585858" />
      <rect x="17" y="10" width="1.5" height="2.5" fill="#585858" />
      {/* 投影 */}
      <rect x="9" y="2" width="10" height="23" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-harbor（港口）
        結構：水面橢圓 → 碼頭平台 → 碼頭側面 → 木樁 → 繩索
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-harbor" viewBox="0 0 28 28" overflow="visible">
      {/* 水面底 */}
      <ellipse cx="14" cy="22" rx="12" ry="5" fill="url(#grad-harbor-water)" />
      {/* 水波線 */}
      <path d="M7,21 Q10,19.5 13,21 Q16,22.5 19,21" fill="none" stroke="#8ab8e0" strokeWidth="0.8" opacity="0.7" />
      <path d="M5,23 Q9,21.5 13,23 Q17,24.5 21,23" fill="none" stroke="#8ab8e0" strokeWidth="0.6" opacity="0.5" />
      {/* 碼頭側面 */}
      <rect x="7" y="17" width="3" height="6" fill="#704020" />
      {/* 碼頭平台 */}
      <rect x="7" y="13" width="15" height="5" rx="1" fill="url(#grad-harbor-dock)" />
      {/* 木板紋路 */}
      <line x1="10" y1="13" x2="10" y2="18" stroke="#886030" strokeWidth="0.6" />
      <line x1="14" y1="13" x2="14" y2="18" stroke="#886030" strokeWidth="0.6" />
      <line x1="18" y1="13" x2="18" y2="18" stroke="#886030" strokeWidth="0.6" />
      {/* 木樁（水邊） */}
      <circle cx="8.5" cy="20.5" r="1.5" fill="#5a3010" />
      <circle cx="12.5" cy="21.5" r="1.5" fill="#5a3010" />
      <circle cx="19.5" cy="20.5" r="1.5" fill="#5a3010" />
      {/* 繩索 */}
      <path d="M8.5,20 Q10.5,18 12.5,21" fill="none" stroke="#d4b87a" strokeWidth="0.8" />
      <path d="M12.5,21 Q16,18.5 19.5,20" fill="none" stroke="#d4b87a" strokeWidth="0.8" />
      {/* 護欄柱 */}
      <rect x="7.5" y="11" width="1.2" height="3" fill="#c09060" />
      <rect x="21" y="11" width="1.2" height="3" fill="#c09060" />
      {/* 投影 */}
      <ellipse cx="14" cy="22" rx="12" ry="5" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-paddock（牧場）
        結構：地面投影橢圓 → 草地面 → 圍欄柵
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-paddock" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="24.5" rx="12" ry="3.5" fill="#2a2a2a" opacity="0.3" />
      {/* 草地面（橢圓） */}
      <ellipse cx="14" cy="21" rx="11" ry="4.5" fill="url(#grad-paddock-grass)" />
      {/* 草地質感弧線 */}
      <path d="M7,21 Q10,19.5 13,20.5 Q16,21.5 20,20.5" fill="none" stroke="#82b848" strokeWidth="0.8" opacity="0.6" />
      {/* 圍欄橫桿（上） */}
      <line x1="5" y1="17" x2="23" y2="17" stroke="#a06030" strokeWidth="1.5" strokeLinecap="round" />
      {/* 圍欄橫桿（下） */}
      <line x1="5" y1="20" x2="23" y2="20" stroke="#a06030" strokeWidth="1.5" strokeLinecap="round" />
      {/* 圍欄垂直柱 */}
      <rect x="4.5" y="15" width="2" height="8" rx="0.5" fill="#8a5028" />
      <rect x="9.5" y="15.5" width="1.8" height="7" rx="0.5" fill="#8a5028" />
      <rect x="14.5" y="15" width="1.8" height="8" rx="0.5" fill="#8a5028" />
      <rect x="19.5" y="15" width="1.8" height="8" rx="0.5" fill="#8a5028" />
      <rect x="23.5" y="15" width="2" height="8" rx="0.5" fill="#8a5028" />
      {/* 草叢 */}
      <path d="M10,18.5 Q10.5,16 11,18.5" fill="none" stroke="#50a020" strokeWidth="0.8" />
      <path d="M16,18 Q16.5,15.5 17,18" fill="none" stroke="#50a020" strokeWidth="0.8" />
      {/* 投影 */}
      <ellipse cx="14" cy="22" rx="11" ry="4.5" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-barn（穀倉）
        結構：地面投影橢圓 → 側牆 → 正面牆 → 多層折屋頂 → 門 → 圓窗
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-barn" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3" />
      {/* 側牆（2.5D 左側） */}
      <rect x="3" y="15" width="4" height="10" fill="#906030" />
      {/* 正面牆 */}
      <rect x="7" y="15" width="18" height="10" fill="url(#grad-barn-wall)" />
      {/* 下層屋頂側面 */}
      <polygon points="3,15 7,15 7,11 4,9" fill="#882020" />
      {/* 下層屋頂正面（次層） */}
      <polygon points="7,15 25,15 25,11 14,8 7,11" fill="url(#grad-barn-roof-mid)" />
      {/* 上層屋頂側面 */}
      <polygon points="5,12 9,12 9,9 6,7" fill="#701818" />
      {/* 上層屋頂正面（最上層） */}
      <polygon points="9,12 23,12 23,9 14,5 9,9" fill="url(#grad-barn-roof-top)" />
      {/* 屋脊線 */}
      <line x1="9" y1="9" x2="23" y2="9" stroke="#701818" strokeWidth="0.8" />
      {/* 大門（拱形） */}
      <rect x="12" y="19" width="5" height="6" rx="2" fill="#5a3010" />
      {/* 圓窗（兩側） */}
      <circle cx="9.5" cy="17.5" r="1.5" fill="#f0e8d0" stroke="#906030" strokeWidth="0.5" />
      <circle cx="20.5" cy="17.5" r="1.5" fill="#f0e8d0" stroke="#906030" strokeWidth="0.5" />
      {/* 投影 */}
      <rect x="3" y="5" width="22" height="20" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-oracle（神廟/預言所）
        結構：地面投影橢圓 → 台階 → 列柱 → 頂楣樑 → 三角楣
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-oracle" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25.5" rx="12" ry="3" fill="#2a2a2a" opacity="0.3" />
      {/* 台階 3 層（由寬到窄） */}
      <rect x="3" y="22" width="22" height="3" rx="0.5" fill="#d4cfc0" />
      <rect x="5" y="19.5" width="18" height="3" rx="0.5" fill="#dcd8ca" />
      <rect x="7" y="17" width="14" height="3" rx="0.5" fill="#e8e4d8" />
      {/* 台階側面 */}
      <rect x="3" y="22" width="2" height="3" fill="#b8b4a8" />
      <rect x="5" y="19.5" width="2" height="3" fill="#c0bcb0" />
      {/* 列柱 4 根（立體：亮面+暗面） */}
      <rect x="8" y="10" width="2.5" height="7.5" fill="#f0ece0" />
      <rect x="8" y="10" width="0.8" height="7.5" fill="#e0dcd0" />
      <rect x="12" y="10" width="2.5" height="7.5" fill="#f0ece0" />
      <rect x="12" y="10" width="0.8" height="7.5" fill="#e0dcd0" />
      <rect x="16" y="10" width="2.5" height="7.5" fill="#f0ece0" />
      <rect x="16" y="10" width="0.8" height="7.5" fill="#e0dcd0" />
      <rect x="19.5" y="10" width="2.5" height="7.5" fill="#f0ece0" />
      <rect x="19.5" y="10" width="0.8" height="7.5" fill="#e0dcd0" />
      {/* 頂楣樑（橫梁） */}
      <rect x="7" y="9" width="14" height="1.5" fill="#c8c0b0" />
      {/* 三角楣（金黃） */}
      <polygon points="7,9 21,9 14,4" fill="url(#grad-oracle-pediment)" />
      {/* 三角楣邊線 */}
      <polygon points="7,9 21,9 14,4" fill="none" stroke="#907818" strokeWidth="0.5" />
      {/* 神廟外輪廓陰影（底部） */}
      <rect x="7" y="9" width="14" height="11" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>

    {/* ═══════════════════════════════════════════════════════════════════════
        Symbol: piece-tavern（酒館）
        結構：地面投影橢圓 → 側牆 → 正面牆 → 屋頂 → 門廊 → 招牌 → 窗（燈黃）
    ═══════════════════════════════════════════════════════════════════════ */}
    <symbol id="piece-tavern" viewBox="0 0 28 28" overflow="visible">
      {/* 地面投影橢圓 */}
      <ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3" />
      {/* 側牆（2.5D 左側） */}
      <rect x="3" y="15" width="4" height="10" fill="#b07840" />
      {/* 正面牆 */}
      <rect x="7" y="15" width="18" height="10" fill="url(#grad-tavern-wall)" />
      {/* 屋頂側面（2.5D） */}
      <polygon points="3,15 7,15 7,10 4,8" fill="#5a3408" />
      {/* 屋頂斜面 */}
      <polygon points="7,15 25,15 25,10 14,7 7,10" fill="url(#grad-tavern-roof)" />
      {/* 屋脊線 */}
      <line x1="7" y1="10" x2="25" y2="10" stroke="#4a2c06" strokeWidth="0.8" />
      {/* 煙囪 */}
      <rect x="19" y="7" width="3" height="5" fill="#888070" />
      <rect x="18.5" y="7" width="4" height="1.2" fill="#706860" />
      {/* 門（木門） */}
      <rect x="12.5" y="19.5" width="4.5" height="5.5" rx="0.5" fill="#5a3010" />
      <rect x="13" y="20" width="1.5" height="2.5" fill="#7a4818" />
      <rect x="15.5" y="20" width="1.5" height="2.5" fill="#7a4818" />
      {/* 窗（燈黃透光） */}
      <rect x="8" y="17" width="3" height="3" rx="0.3" fill="#f0d060" opacity="0.9" />
      <rect x="20.5" y="17" width="3" height="3" rx="0.3" fill="#f0d060" opacity="0.9" />
      {/* 窗框 */}
      <rect x="8" y="17" width="3" height="3" rx="0.3" fill="none" stroke="#8a5828" strokeWidth="0.5" />
      <rect x="20.5" y="17" width="3" height="3" rx="0.3" fill="none" stroke="#8a5828" strokeWidth="0.5" />
      {/* 招牌（掛在牆上） */}
      <rect x="10" y="12" width="9" height="3" rx="0.5" fill="#3a2010" />
      <rect x="10.5" y="12.4" width="4" height="0.8" fill="#d4c080" />
      <rect x="10.5" y="13.6" width="6" height="0.8" fill="#d4c080" />
      {/* 招牌掛鉤 */}
      <line x1="11.5" y1="12" x2="11.5" y2="10.5" stroke="#806040" strokeWidth="0.7" />
      <line x1="17.5" y1="12" x2="17.5" y2="10.5" stroke="#806040" strokeWidth="0.7" />
      {/* 投影 */}
      <rect x="3" y="7" width="22" height="18" fill="none" filter="url(#piece-drop-shadow)" />
    </symbol>
  </defs>
);

PieceDefs.displayName = 'PieceDefs';

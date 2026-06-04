/**
 * pieceTextures.ts — R36 Phase 2b-2
 *
 * 9 種地點 piece SVG string 轉 DataURL，供 Pixi Assets.load 預載。
 *
 * 規則：
 * - 靜態字串，不在執行期 parse DOM
 * - encodeURIComponent（不用 btoa），避免 # hex 色值截斷 DataURL
 * - 每個 piece SVG 必須打包：piece-drop-shadow filter + 該 piece 專屬 linearGradient
 * - SVG 屬性 kebab-case（stop-color / flood-color / stroke-width 等），⛔ 不用 JSX camelCase
 * - viewBox="0 0 28 28" + overflow="visible"（drop shadow 不被裁）
 * - key 格式：Location enum 值（PascalCase），例 'Castle' / 'Farm' / ...
 */

// ──────────────────────────────────────────────────────────────────────────────
// 共用：drop-shadow filter（每個 piece SVG 都要含一份）
// JSX floodColor/floodOpacity → kebab-case flood-color/flood-opacity
// ──────────────────────────────────────────────────────────────────────────────

const DROP_SHADOW_FILTER = `<filter id="piece-drop-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.45"/></filter>`;

function buildPieceSvgString(defsContent: string, bodyHTML: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" overflow="visible"><defs>${defsContent}</defs>${bodyHTML}</svg>`;
}

function svgStringToDataUrl(svgStr: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// 9 個 piece SVG strings
// bodyHTML = PieceDefs.tsx 對應 <symbol> 的子元素，camelCase → kebab-case
// ──────────────────────────────────────────────────────────────────────────────

const PIECE_SVG_STRINGS: Record<string, string> = {

  // ── Castle 灰石城堡 ──────────────────────────────────────────────────────────
  // gradient: grad-castle-wall (x2=0 y2=1), grad-castle-tower (x2=0 y2=1)
  Castle: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-castle-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9e9e9e"/><stop offset="100%" stop-color="#707070"/></linearGradient>`
    + `<linearGradient id="grad-castle-tower" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a8a8a"/><stop offset="100%" stop-color="#606060"/></linearGradient>`,
    // symbol innerHTML — JSX camelCase 全改 kebab-case
    `<ellipse cx="14" cy="25" rx="11" ry="3.5" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="5" y="14" width="18" height="9" fill="url(#grad-castle-wall)"/>`
    + `<rect x="3" y="15" width="2.5" height="8" fill="#606060"/>`
    + `<rect x="22.5" y="15" width="2.5" height="8" fill="#606060"/>`
    + `<rect x="3" y="10" width="7" height="13" fill="url(#grad-castle-tower)"/>`
    + `<rect x="18" y="10" width="7" height="13" fill="url(#grad-castle-tower)"/>`
    + `<rect x="3" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="5.6" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="8.2" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="18" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="20.6" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="23.2" y="8" width="1.8" height="3" fill="#8a8a8a"/>`
    + `<rect x="10.5" y="12" width="1.5" height="2.5" fill="#8a8a8a"/>`
    + `<rect x="13" y="12" width="1.5" height="2.5" fill="#8a8a8a"/>`
    + `<rect x="15.5" y="12" width="1.5" height="2.5" fill="#8a8a8a"/>`
    + `<rect x="11.5" y="18" width="5" height="5" rx="2" fill="#3a2a1a"/>`
    + `<rect x="5.5" y="12" width="2" height="2.5" fill="#2a2a2a"/>`
    + `<rect x="20.5" y="12" width="2" height="2.5" fill="#2a2a2a"/>`
    + `<polygon points="6.5,8 6.5,4 10,6" fill="#8b1a1a"/>`
    + `<rect x="3" y="8" width="22" height="15" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Farm 農場 ────────────────────────────────────────────────────────────────
  // gradient: grad-farm-wall (x2=1 y2=0), grad-farm-roof (x2=1 y2=1)
  Farm: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-farm-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c4894a"/><stop offset="100%" stop-color="#a06830"/></linearGradient>`
    + `<linearGradient id="grad-farm-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c04040"/><stop offset="100%" stop-color="#882020"/></linearGradient>`,
    `<ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="3" y="16" width="4" height="9" fill="#a06830"/>`
    + `<rect x="7" y="16" width="18" height="9" fill="url(#grad-farm-wall)"/>`
    + `<polygon points="3,16 7,16 7,10 5,8" fill="#882020"/>`
    + `<polygon points="7,16 25,16 25,10 14,6 7,10" fill="url(#grad-farm-roof)"/>`
    + `<line x1="7" y1="10" x2="25" y2="10" stroke="#661818" stroke-width="0.8"/>`
    + `<rect x="12" y="20" width="5" height="5" rx="1" fill="#5a3010"/>`
    + `<rect x="8.5" y="18" width="2.5" height="2.5" rx="0.3" fill="#f0e8d0"/>`
    + `<rect x="19" y="18" width="2.5" height="2.5" rx="0.3" fill="#f0e8d0"/>`
    + `<rect x="3" y="6" width="22" height="19" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Oasis 綠洲 ───────────────────────────────────────────────────────────────
  // gradient: grad-oasis-water (x2=1 y2=1)
  Oasis: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-oasis-water" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5aaee0"/><stop offset="100%" stop-color="#3a8fc8"/></linearGradient>`,
    `<ellipse cx="14" cy="22" rx="11" ry="4.5" fill="url(#grad-oasis-water)"/>`
    + `<path d="M8,21 Q11,19.5 14,21 Q17,22.5 20,21" fill="none" stroke="#78c8f0" stroke-width="0.8" opacity="0.7"/>`
    + `<path d="M9,22.5 Q12,21.5 15,22.5 Q17.5,23.5 19,22.5" fill="none" stroke="#78c8f0" stroke-width="0.6" opacity="0.5"/>`
    + `<ellipse cx="15" cy="23" rx="3" ry="1.2" fill="#1a4a1a" opacity="0.3"/>`
    + `<path d="M14,22 Q14.5,18 15,14 Q15.3,10 15.5,8" stroke="#8b5e3c" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    + `<path d="M15.5,8 Q20,5 23,7" stroke="#2d6a20" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    + `<path d="M15.5,8 Q21,8 22,11" stroke="#2d6a20" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M15.5,8 Q11,5 8,8" stroke="#2d6a20" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    + `<path d="M15.5,8 Q10,9 9,12" stroke="#2d6a20" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M15.5,8 Q15,4 14,2" stroke="#3a8030" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    + `<circle cx="23" cy="7" r="1.2" fill="#2d6a20"/>`
    + `<circle cx="8" cy="8" r="1.2" fill="#2d6a20"/>`
    + `<ellipse cx="14" cy="22" rx="11" ry="4.5" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Tower 瞭望塔 ─────────────────────────────────────────────────────────────
  // gradient: grad-tower-body (x2=1 y2=0, 3 stops)
  Tower: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-tower-body" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#b0b0b0"/><stop offset="60%" stop-color="#909090"/><stop offset="100%" stop-color="#585858"/></linearGradient>`,
    `<ellipse cx="14" cy="25.5" rx="7" ry="2.5" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="9" y="12" width="10" height="13" rx="5" fill="url(#grad-tower-body)"/>`
    + `<ellipse cx="14" cy="25" rx="5" ry="1.5" fill="#606060"/>`
    + `<line x1="9.5" y1="16" x2="18.5" y2="16" stroke="#808080" stroke-width="0.5"/>`
    + `<line x1="9.5" y1="19" x2="18.5" y2="19" stroke="#808080" stroke-width="0.5"/>`
    + `<line x1="9.5" y1="22" x2="18.5" y2="22" stroke="#808080" stroke-width="0.5"/>`
    + `<rect x="12.5" y="14" width="1.5" height="3" rx="0.5" fill="#2a2a2a"/>`
    + `<rect x="12.5" y="20" width="1.5" height="2.5" rx="0.5" fill="#2a2a2a"/>`
    + `<polygon points="9,12 19,12 16,6 12,6" fill="#686868"/>`
    + `<polygon points="9,12 12,6 10,12" fill="#505050"/>`
    + `<polygon points="12,6 16,6 14,2" fill="#404040"/>`
    + `<rect x="9.5" y="10" width="1.5" height="2.5" fill="#585858"/>`
    + `<rect x="12" y="10" width="1.5" height="2.5" fill="#585858"/>`
    + `<rect x="14.5" y="10" width="1.5" height="2.5" fill="#585858"/>`
    + `<rect x="17" y="10" width="1.5" height="2.5" fill="#585858"/>`
    + `<rect x="9" y="2" width="10" height="23" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Harbor 港口 ──────────────────────────────────────────────────────────────
  // gradient: grad-harbor-water (x2=1 y2=1), grad-harbor-dock (x2=0 y2=1)
  Harbor: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-harbor-water" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6098c8"/><stop offset="100%" stop-color="#4682b4"/></linearGradient>`
    + `<linearGradient id="grad-harbor-dock" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b0804a"/><stop offset="100%" stop-color="#a0703a"/></linearGradient>`,
    `<ellipse cx="14" cy="22" rx="12" ry="5" fill="url(#grad-harbor-water)"/>`
    + `<path d="M7,21 Q10,19.5 13,21 Q16,22.5 19,21" fill="none" stroke="#8ab8e0" stroke-width="0.8" opacity="0.7"/>`
    + `<path d="M5,23 Q9,21.5 13,23 Q17,24.5 21,23" fill="none" stroke="#8ab8e0" stroke-width="0.6" opacity="0.5"/>`
    + `<rect x="7" y="17" width="3" height="6" fill="#704020"/>`
    + `<rect x="7" y="13" width="15" height="5" rx="1" fill="url(#grad-harbor-dock)"/>`
    + `<line x1="10" y1="13" x2="10" y2="18" stroke="#886030" stroke-width="0.6"/>`
    + `<line x1="14" y1="13" x2="14" y2="18" stroke="#886030" stroke-width="0.6"/>`
    + `<line x1="18" y1="13" x2="18" y2="18" stroke="#886030" stroke-width="0.6"/>`
    + `<circle cx="8.5" cy="20.5" r="1.5" fill="#5a3010"/>`
    + `<circle cx="12.5" cy="21.5" r="1.5" fill="#5a3010"/>`
    + `<circle cx="19.5" cy="20.5" r="1.5" fill="#5a3010"/>`
    + `<path d="M8.5,20 Q10.5,18 12.5,21" fill="none" stroke="#d4b87a" stroke-width="0.8"/>`
    + `<path d="M12.5,21 Q16,18.5 19.5,20" fill="none" stroke="#d4b87a" stroke-width="0.8"/>`
    + `<rect x="7.5" y="11" width="1.2" height="3" fill="#c09060"/>`
    + `<rect x="21" y="11" width="1.2" height="3" fill="#c09060"/>`
    + `<ellipse cx="14" cy="22" rx="12" ry="5" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Paddock 牧場 ─────────────────────────────────────────────────────────────
  // gradient: grad-paddock-grass (x2=0 y2=1)
  Paddock: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-paddock-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#72a040"/><stop offset="100%" stop-color="#5a8a30"/></linearGradient>`,
    `<ellipse cx="14" cy="24.5" rx="12" ry="3.5" fill="#2a2a2a" opacity="0.3"/>`
    + `<ellipse cx="14" cy="21" rx="11" ry="4.5" fill="url(#grad-paddock-grass)"/>`
    + `<path d="M7,21 Q10,19.5 13,20.5 Q16,21.5 20,20.5" fill="none" stroke="#82b848" stroke-width="0.8" opacity="0.6"/>`
    + `<line x1="5" y1="17" x2="23" y2="17" stroke="#a06030" stroke-width="1.5" stroke-linecap="round"/>`
    + `<line x1="5" y1="20" x2="23" y2="20" stroke="#a06030" stroke-width="1.5" stroke-linecap="round"/>`
    + `<rect x="4.5" y="15" width="2" height="8" rx="0.5" fill="#8a5028"/>`
    + `<rect x="9.5" y="15.5" width="1.8" height="7" rx="0.5" fill="#8a5028"/>`
    + `<rect x="14.5" y="15" width="1.8" height="8" rx="0.5" fill="#8a5028"/>`
    + `<rect x="19.5" y="15" width="1.8" height="8" rx="0.5" fill="#8a5028"/>`
    + `<rect x="23.5" y="15" width="2" height="8" rx="0.5" fill="#8a5028"/>`
    + `<path d="M10,18.5 Q10.5,16 11,18.5" fill="none" stroke="#50a020" stroke-width="0.8"/>`
    + `<path d="M16,18 Q16.5,15.5 17,18" fill="none" stroke="#50a020" stroke-width="0.8"/>`
    + `<ellipse cx="14" cy="22" rx="11" ry="4.5" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Barn 穀倉 ────────────────────────────────────────────────────────────────
  // gradient: grad-barn-wall (x2=1 y2=0), grad-barn-roof-top (x2=1 y2=1), grad-barn-roof-mid (x2=1 y2=1)
  Barn: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-barn-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#c09050"/><stop offset="100%" stop-color="#b07840"/></linearGradient>`
    + `<linearGradient id="grad-barn-roof-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a03030"/><stop offset="100%" stop-color="#903030"/></linearGradient>`
    + `<linearGradient id="grad-barn-roof-mid" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b84040"/><stop offset="100%" stop-color="#b04040"/></linearGradient>`,
    `<ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="3" y="15" width="4" height="10" fill="#906030"/>`
    + `<rect x="7" y="15" width="18" height="10" fill="url(#grad-barn-wall)"/>`
    + `<polygon points="3,15 7,15 7,11 4,9" fill="#882020"/>`
    + `<polygon points="7,15 25,15 25,11 14,8 7,11" fill="url(#grad-barn-roof-mid)"/>`
    + `<polygon points="5,12 9,12 9,9 6,7" fill="#701818"/>`
    + `<polygon points="9,12 23,12 23,9 14,5 9,9" fill="url(#grad-barn-roof-top)"/>`
    + `<line x1="9" y1="9" x2="23" y2="9" stroke="#701818" stroke-width="0.8"/>`
    + `<rect x="12" y="19" width="5" height="6" rx="2" fill="#5a3010"/>`
    + `<circle cx="9.5" cy="17.5" r="1.5" fill="#f0e8d0" stroke="#906030" stroke-width="0.5"/>`
    + `<circle cx="20.5" cy="17.5" r="1.5" fill="#f0e8d0" stroke="#906030" stroke-width="0.5"/>`
    + `<rect x="3" y="5" width="22" height="20" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Oracle 神廟 ──────────────────────────────────────────────────────────────
  // gradient: grad-oracle-pediment (x2=1 y2=1)
  Oracle: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-oracle-pediment" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d4b040"/><stop offset="100%" stop-color="#a07020"/></linearGradient>`,
    `<ellipse cx="14" cy="25.5" rx="12" ry="3" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="3" y="22" width="22" height="3" rx="0.5" fill="#d4cfc0"/>`
    + `<rect x="5" y="19.5" width="18" height="3" rx="0.5" fill="#dcd8ca"/>`
    + `<rect x="7" y="17" width="14" height="3" rx="0.5" fill="#e8e4d8"/>`
    + `<rect x="3" y="22" width="2" height="3" fill="#b8b4a8"/>`
    + `<rect x="5" y="19.5" width="2" height="3" fill="#c0bcb0"/>`
    + `<rect x="8" y="10" width="2.5" height="7.5" fill="#f0ece0"/>`
    + `<rect x="8" y="10" width="0.8" height="7.5" fill="#e0dcd0"/>`
    + `<rect x="12" y="10" width="2.5" height="7.5" fill="#f0ece0"/>`
    + `<rect x="12" y="10" width="0.8" height="7.5" fill="#e0dcd0"/>`
    + `<rect x="16" y="10" width="2.5" height="7.5" fill="#f0ece0"/>`
    + `<rect x="16" y="10" width="0.8" height="7.5" fill="#e0dcd0"/>`
    + `<rect x="19.5" y="10" width="2.5" height="7.5" fill="#f0ece0"/>`
    + `<rect x="19.5" y="10" width="0.8" height="7.5" fill="#e0dcd0"/>`
    + `<rect x="7" y="9" width="14" height="1.5" fill="#c8c0b0"/>`
    + `<polygon points="7,9 21,9 14,4" fill="url(#grad-oracle-pediment)"/>`
    + `<polygon points="7,9 21,9 14,4" fill="none" stroke="#907818" stroke-width="0.5"/>`
    + `<rect x="7" y="9" width="14" height="11" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

  // ── Tavern 酒館 ──────────────────────────────────────────────────────────────
  // gradient: grad-tavern-wall (x2=1 y2=0), grad-tavern-roof (x2=1 y2=1)
  Tavern: buildPieceSvgString(
    DROP_SHADOW_FILTER
    + `<linearGradient id="grad-tavern-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#d0a060"/><stop offset="100%" stop-color="#c49050"/></linearGradient>`
    + `<linearGradient id="grad-tavern-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7a4818"/><stop offset="100%" stop-color="#6a4010"/></linearGradient>`,
    `<ellipse cx="14" cy="25.5" rx="11" ry="3" fill="#2a2a2a" opacity="0.3"/>`
    + `<rect x="3" y="15" width="4" height="10" fill="#b07840"/>`
    + `<rect x="7" y="15" width="18" height="10" fill="url(#grad-tavern-wall)"/>`
    + `<polygon points="3,15 7,15 7,10 4,8" fill="#5a3408"/>`
    + `<polygon points="7,15 25,15 25,10 14,7 7,10" fill="url(#grad-tavern-roof)"/>`
    + `<line x1="7" y1="10" x2="25" y2="10" stroke="#4a2c06" stroke-width="0.8"/>`
    + `<rect x="19" y="7" width="3" height="5" fill="#888070"/>`
    + `<rect x="18.5" y="7" width="4" height="1.2" fill="#706860"/>`
    + `<rect x="12.5" y="19.5" width="4.5" height="5.5" rx="0.5" fill="#5a3010"/>`
    + `<rect x="13" y="20" width="1.5" height="2.5" fill="#7a4818"/>`
    + `<rect x="15.5" y="20" width="1.5" height="2.5" fill="#7a4818"/>`
    + `<rect x="8" y="17" width="3" height="3" rx="0.3" fill="#f0d060" opacity="0.9"/>`
    + `<rect x="20.5" y="17" width="3" height="3" rx="0.3" fill="#f0d060" opacity="0.9"/>`
    + `<rect x="8" y="17" width="3" height="3" rx="0.3" fill="none" stroke="#8a5828" stroke-width="0.5"/>`
    + `<rect x="20.5" y="17" width="3" height="3" rx="0.3" fill="none" stroke="#8a5828" stroke-width="0.5"/>`
    + `<rect x="10" y="12" width="9" height="3" rx="0.5" fill="#3a2010"/>`
    + `<rect x="10.5" y="12.4" width="4" height="0.8" fill="#d4c080"/>`
    + `<rect x="10.5" y="13.6" width="6" height="0.8" fill="#d4c080"/>`
    + `<line x1="11.5" y1="12" x2="11.5" y2="10.5" stroke="#806040" stroke-width="0.7"/>`
    + `<line x1="17.5" y1="12" x2="17.5" y2="10.5" stroke="#806040" stroke-width="0.7"/>`
    + `<rect x="3" y="7" width="22" height="18" fill="none" filter="url(#piece-drop-shadow)"/>`,
  ),

};

// ──────────────────────────────────────────────────────────────────────────────
// 導出 DataURL map
// key = Location enum PascalCase（'Castle' / 'Farm' / 'Oasis' / ...）
// ──────────────────────────────────────────────────────────────────────────────

export const PIECE_DATA_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(PIECE_SVG_STRINGS).map(([k, v]) => [k, svgStringToDataUrl(v)])
);

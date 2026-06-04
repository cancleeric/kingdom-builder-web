/**
 * terrainArt.ts — R36 Phase 2a
 *
 * 地形漸層色值表（直接從 TerrainDefs.tsx 的 21 個 linearGradient 抄錄）
 * 7 地形 × A/B/C 明度變體，方向對應 x1=0.15 y1=0 x2=0.85 y2=1 (objectBoundingBox)
 *
 * 供 pixiHexUtils.ts 的 drawHexGradient() 使用。
 */

/** 單一漸層定義：stop 0% 和 stop 100% 的 Pixi hex 色值 */
export interface TerrainGradient {
  stop0: number; // start color (top-left)
  stop1: number; // end color (bottom-right)
}

/**
 * 21 組地形漸層色值表（TerrainDefs.tsx linearGradient 直接抄錄）
 * key: "{TerrainType}-{variant}"  e.g. "Grass-a"
 */
export const TERRAIN_GRADIENTS: Record<string, TerrainGradient> = {
  // 草原 Grass（基底 #7ABF5E）
  'Grass-a': { stop0: 0x92D470, stop1: 0x6AAF4E },
  'Grass-b': { stop0: 0x7ABF5E, stop1: 0x5EAF44 },
  'Grass-c': { stop0: 0x68A84E, stop1: 0x509838 },

  // 森林 Forest（基底 #2D7A2D）
  'Forest-a': { stop0: 0x357A35, stop1: 0x205220 },
  'Forest-b': { stop0: 0x2D7A2D, stop1: 0x1A5A1A },
  'Forest-c': { stop0: 0x226222, stop1: 0x124512 },

  // 沙漠 Desert（基底 #E8A84A）
  'Desert-a': { stop0: 0xF0B85A, stop1: 0xD09040 },
  'Desert-b': { stop0: 0xE8A84A, stop1: 0xC89038 },
  'Desert-c': { stop0: 0xD89838, stop1: 0xB87828 },

  // 花田 Flower（基底 #F06080）
  'Flower-a': { stop0: 0xF87898, stop1: 0xE04870 },
  'Flower-b': { stop0: 0xF06080, stop1: 0xD84868 },
  'Flower-c': { stop0: 0xD85070, stop1: 0xC03860 },

  // 峽谷 Canyon（基底 #C05020）
  'Canyon-a': { stop0: 0xD06030, stop1: 0xA84018 },
  'Canyon-b': { stop0: 0xC05020, stop1: 0x9C3C14 },
  'Canyon-c': { stop0: 0xA84418, stop1: 0x8A300C },

  // 水域 Water（基底 #3A74B0）
  'Water-a': { stop0: 0x4A84C0, stop1: 0x2C64A0 },
  'Water-b': { stop0: 0x3A74B0, stop1: 0x2A5C98 },
  'Water-c': { stop0: 0x2E64A0, stop1: 0x1E4C88 },

  // 山脈 Mountain（基底 #888888）
  'Mountain-a': { stop0: 0x9C9C9C, stop1: 0x787878 },
  'Mountain-b': { stop0: 0x888888, stop1: 0x686868 },
  'Mountain-c': { stop0: 0x787878, stop1: 0x585858 },
};

/**
 * light-overlay 三個 stop 色值
 * 來源：TerrainDefs.tsx `#light-overlay` linearGradient
 *   stop 0%:   #FFFFFF opacity 0.18
 *   stop 50%:  #FFFFFF opacity 0.04
 *   stop 100%: #000000 opacity 0.08
 */
export const LIGHT_OVERLAY_STOPS = [
  { offset: 0,    color: 0xffffff as number, alpha: 0.18 },
  { offset: 0.5,  color: 0xffffff as number, alpha: 0.04 },
  { offset: 1.0,  color: 0x000000 as number, alpha: 0.08 },
] as const;

/**
 * 根據格座標 hash 決定 A/B/C 變體（同局固定，不亂跳）
 * hash = Math.abs(q * 31 + r * 17) % 3
 */
export function getTerrainVariant(q: number, r: number): 'a' | 'b' | 'c' {
  const idx = Math.abs(q * 31 + r * 17) % 3;
  return (['a', 'b', 'c'] as const)[idx];
}

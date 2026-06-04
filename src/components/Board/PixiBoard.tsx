/**
 * PixiBoard — R35 Phase 1
 * WebGL-based hex board using PixiJS v8 + pixi-viewport v6.
 * Replaces the SVG HexGrid in the game view to eliminate:
 *   - click swallowed by pan (threshold:5 in drag plugin)
 *   - focus ring (canvas has no DOM focus indicator)
 *   - zoom jitter (pixi-viewport handles pinch/wheel math)
 *
 * Phase 1 scope: functional rendering only (flat colours, no R24 art).
 * MapEditor still uses the old HexGrid (Phase 2).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Graphics, Container, Assets, Sprite, Texture } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { Board } from '../../core/board';
import type { AxialCoord } from '../../core/hex';
import { HEX_SIZE, hexToKey, pixelToAxial, axialToPixel } from '../../core/hex';
import type { Player } from '../../types';
import {
  cssColorToPixi,
  drawHex,
  drawHexBorder,
  HOUSE_DATA_URL,
} from './pixiHexUtils';
import { PIECE_DATA_URLS } from './pieceTextures';
import { useTranslation } from 'react-i18next';

// ─── R37a: Kenney Hex Tile mapping ───────────────────────────────────────────
// 每個地形對應一張 Kenney CC0 2.5D PNG（public/assets/hextiles/）
// Forest/Flower 用 tileGrass 底板 + 裝飾 Sprite 疊加，實現 7 地形視覺可辨
const TERRAIN_TILE_MAP: Record<string, string> = {
  Grass:    '/assets/hextiles/tileGrass.png',
  Forest:   '/assets/hextiles/tileGrass.png',  // 底板同草地，疊 pine 裝飾
  Desert:   '/assets/hextiles/tileSand.png',
  Water:    '/assets/hextiles/tileWater.png',
  Mountain: '/assets/hextiles/tileStone.png',
  Canyon:   '/assets/hextiles/tileLava.png',
  Flower:   '/assets/hextiles/tileGrass.png',  // 底板同草地，疊 flower 裝飾
};

// R37a: 地形裝飾 Sprite 對應（Forest/Flower 專用，叫 deco）
// pineGreen_mid: 30×101 原始尺寸；flowerRed: 12×11 原始尺寸
const TERRAIN_DECO_MAP: Record<string, string> = {
  Forest: '/assets/hextiles/pineGreen_mid.png',
  Flower: '/assets/hextiles/flowerRed.png',
};

// R37a: tile 顯示縮放（65×0.8=52px 寬，配合 HEX_SIZE=30 pointy-top hex 頂面寬）
const TILE_DISPLAY_SCALE = 0.8;
// anchor.y：頂面中心在 PNG 中的相對位置（26/89≈0.292）
// 讓 axialToPixel 中心點對齊 tile 頂面中心（而非 PNG 中心）
const TILE_ANCHOR_Y = 0.292;

// ─── Props ───────────────────────────────────────────────────────────────────
export interface PixiBoardProps {
  board: Board;
  validPlacements: AxialCoord[];
  selectedCell: AxialCoord | null;
  players: Player[];
  onCellClick: (coord: AxialCoord) => void;
  onCellSelect: (coord: AxialCoord | null) => void;
  onInvalidClick?: (coord: AxialCoord) => void;
  invalidClickKey?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const PixiBoard: React.FC<PixiBoardProps> = ({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
  onInvalidClick,
  invalidClickKey,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs to Pixi objects — NOT state to avoid re-render cycles
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const initializedRef = useRef(false);

  // Graphics maps — keyed by "q,r"
  const overlayGfxMap = useRef<Map<string, Graphics>>(new Map());
  const settlementGfxMap = useRef<Map<string, Graphics>>(new Map());

  // R36: motif Sprite map — keyed by "q,r"（R37a 停止 populate，保留供 cleanup）
  const motifSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R36: motif Texture map — keyed by motif key（R37a 停止 populate，保留供 cleanup）
  const motifTextureMapRef = useRef<Map<string, Texture>>(new Map());

  // R37a: tile Sprite map — keyed by "q,r"
  const tileSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R37a: tile Texture map — keyed by URL（for cleanup）
  const tileTextureMapRef = useRef<Map<string, Texture>>(new Map());
  // R37a: deco Sprite map — keyed by "q,r"（Forest/Flower 裝飾）
  const decoSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R37a: deco Texture map — keyed by URL（for cleanup）
  const decoTextureMapRef = useRef<Map<string, Texture>>(new Map());
  // R37a: layer container refs
  const tileLayerRef = useRef<Container | null>(null);
  const pieceLayerRef = useRef<Container | null>(null);
  const overlayLayerRef = useRef<Container | null>(null);
  const settlementLayerRef = useRef<Container | null>(null);

  // R36 Phase 2b-2: piece Sprite map — keyed by "q,r"
  const pieceSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R36 Phase 2b-2: piece Texture map (for cleanup) — keyed by Location enum value
  const pieceTextureMapRef = useRef<Map<string, Texture>>(new Map());

  // R36 Phase 2c: settlement Sprite map — keyed by "q,r" (dynamic, add/remove per placement)
  const settlementSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R36 Phase 2c: white-house texture (shared by all settlement Sprites)
  const houseTextureRef = useRef<Texture | null>(null);

  // Board geometry (computed once on mount)
  const worldInfoRef = useRef<{
    worldWidth: number;
    worldHeight: number;
    gridOffset: number;
  } | null>(null);

  // Hover state
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Scale state for zoom badge
  const [zoomScale, setZoomScale] = useState(1.0);

  // InvalidFlash key with auto-clear
  const [invalidFlashKey, setInvalidFlashKey] = useState<string | null>(null);
  const invalidFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RecentlyPlaced tracking
  const [recentlyPlacedKey, setRecentlyPlacedKey] = useState<string | null>(null);
  const recentlyPlacedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSettlementKeysRef = useRef<Set<string>>(new Set());

  // ─── Stable callbacks to avoid stale-closure issues in Pixi event handlers
  // We store latest prop values in refs so the one-time Pixi event registration
  // always reads current values without needing to re-attach handlers.
  const boardRef = useRef(board);
  const validPlacementsRef = useRef(validPlacements);
  const onCellClickRef = useRef(onCellClick);
  const onInvalidClickRef = useRef(onInvalidClick);
  const onCellSelectRef = useRef(onCellSelect);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { validPlacementsRef.current = validPlacements; }, [validPlacements]);
  useEffect(() => { onCellClickRef.current = onCellClick; }, [onCellClick]);
  useEffect(() => { onInvalidClickRef.current = onInvalidClick; }, [onInvalidClick]);
  useEffect(() => { onCellSelectRef.current = onCellSelect; }, [onCellSelect]);

  // ─── World geometry helper ────────────────────────────────────────────────
  const computeWorldInfo = useCallback((b: Board) => {
    const padding = HEX_SIZE * 2;
    const maxX = HEX_SIZE * Math.sqrt(3) * ((b.width - 1) + 0.5 * (b.height - 1));
    const maxY = HEX_SIZE * 1.5 * (b.height - 1);
    const worldWidth = maxX + HEX_SIZE * 2 + padding * 2;
    const worldHeight = maxY + HEX_SIZE * 2 + padding * 2;
    const gridOffset = padding + HEX_SIZE;
    return { worldWidth, worldHeight, gridOffset };
  }, []);

  // ─── World-point → hex coord (used in pointer events) ────────────────────
  const worldPointToHex = useCallback(
    (worldX: number, worldY: number, gridOffset: number): AxialCoord | null => {
      const coord = pixelToAxial(
        { x: worldX - gridOffset, y: worldY - gridOffset },
        HEX_SIZE,
      );
      return boardRef.current.getCell(coord) ? coord : null;
    },
    [],
  );

  // ─── Build initial Pixi scene ─────────────────────────────────────────────
  // R37a: 改用 Kenney tile Sprite + 2.5D 深度排序
  // buildScene 現在只需 pieceTextureMap（tile/deco textures 已存入 tileTextureMapRef/decoTextureMapRef）
  const buildScene = useCallback(
    (viewport: Viewport, b: Board, gridOffset: number, pieceTextureMap: Map<string, Texture>) => {
      const hexContainer = new Container();
      // Translate by gridOffset so hex (0,0) is not at the canvas corner
      hexContainer.position.set(gridOffset, gridOffset);
      viewport.addChild(hexContainer);

      // R37a: Container 分層（無 NoiseFilter）
      // tileLayer: Kenney tile Sprite（深度排序，無 grain）
      // pieceLayer: location piece Sprite（棋子）
      // overlayLayer: hover/valid/invalid Graphics
      // settlementLayer: settlement anchor Graphics
      const tileLayer = new Container();
      const pieceLayer = new Container();
      const overlayLayer = new Container();
      const settlementLayer = new Container();
      hexContainer.addChild(tileLayer);
      hexContainer.addChild(pieceLayer);
      hexContainer.addChild(overlayLayer);
      hexContainer.addChild(settlementLayer);

      tileLayerRef.current = tileLayer;
      pieceLayerRef.current = pieceLayer;
      overlayLayerRef.current = overlayLayer;
      settlementLayerRef.current = settlementLayer;

      // R37a: 深度排序 — r 升序，同 r q 升序
      // 後 addChild 的在上層，r 大（南方）的後加入 → 正確 2.5D 遮擋
      const sortedCells = [...b.getAllCells()].sort((ca, cb) => {
        if (ca.coord.r !== cb.coord.r) return ca.coord.r - cb.coord.r;
        return ca.coord.q - cb.coord.q;
      });

      for (const cell of sortedCells) {
        const key = hexToKey(cell.coord);
        const center = axialToPixel(cell.coord, HEX_SIZE);
        const terrainName = cell.terrain as string;

        // R37a: Kenney tile Sprite（底板）
        const tileUrl = TERRAIN_TILE_MAP[terrainName];
        const tileTex = tileUrl ? tileTextureMapRef.current.get(tileUrl) : undefined;
        if (tileTex) {
          const tileSprite = new Sprite(tileTex);
          // anchor.y=TILE_ANCHOR_Y：讓頂面中心對齊 axialToPixel 返回的 hex 幾何中心
          tileSprite.anchor.set(0.5, TILE_ANCHOR_Y);
          tileSprite.width  = 65 * TILE_DISPLAY_SCALE;  // 52px
          tileSprite.height = 89 * TILE_DISPLAY_SCALE;  // 71.2px
          tileSprite.position.set(center.x, center.y);
          // Forest 底板染深綠色調以區分 Grass；Flower 底板保持原色（花裝飾自帶辨識）
          if (terrainName === 'Forest') {
            tileSprite.tint = 0x7aad5c;  // 深草綠，讓 Forest 底板略深於 Grass
          }
          tileLayer.addChild(tileSprite);
          tileSpriteMap.current.set(key, tileSprite);
        }

        // R37a: 裝飾 Sprite（Forest=pine, Flower=flower）疊在 tileLayer 同深度位置
        // 讓裝飾跟 tile 同深度排序（同在 tileLayer 內，緊接底板後）
        const decoUrl = TERRAIN_DECO_MAP[terrainName];
        const decoTex = decoUrl ? decoTextureMapRef.current.get(decoUrl) : undefined;
        if (decoTex) {
          const decoSprite = new Sprite(decoTex);
          if (terrainName === 'Forest') {
            // pineGreen_mid: 30×101 原始尺寸
            // 顯示高 = HEX_SIZE * 1.8 ≈ 54px（讓松樹明顯超出頂面往上長）
            // anchor.y = 底座在 PNG 底部對齊 hex 頂面中心（讓樹往上長）
            // 底座位置：hex 頂面中心稍下（+8px，讓樹根紮在 tile 頂面）
            const decoH = HEX_SIZE * 1.8;
            const decoW = decoH * (30 / 101);
            decoSprite.anchor.set(0.5, 1.0); // anchor 底部
            decoSprite.width  = decoW;
            decoSprite.height = decoH;
            decoSprite.position.set(center.x, center.y + 8);
          } else {
            // flowerRed: 12×11 原始尺寸
            // 顯示 = HEX_SIZE * 0.7 ≈ 21px（小花，坐在頂面中心）
            const decoS = HEX_SIZE * 0.7;
            decoSprite.anchor.set(0.5, 0.5);
            decoSprite.width  = decoS;
            decoSprite.height = decoS * (11 / 12);
            decoSprite.position.set(center.x, center.y);
          }
          tileLayer.addChild(decoSprite);
          decoSpriteMap.current.set(key, decoSprite);
        }

        // R37a: piece Sprite（location marker）— 在 pieceLayer（tileLayer 之上）
        if (cell.location !== undefined) {
          const locKey = cell.location as string;
          const pieceTex = pieceTextureMap.get(locKey);
          if (pieceTex) {
            const ps = new Sprite(pieceTex);
            ps.anchor.set(0.5, 0.5);
            ps.position.set(center.x, center.y);
            ps.width  = HEX_SIZE * 0.7;
            ps.height = HEX_SIZE * 0.7;
            pieceLayer.addChild(ps);
            pieceSpriteMap.current.set(key, ps);
          }
        }

        // R37a: overlay Graphics — 在 overlayLayer
        const ov = new Graphics();
        overlayLayer.addChild(ov);
        overlayGfxMap.current.set(key, ov);

        // R37a: settlement anchor Graphics — 在 settlementLayer
        const sm = new Graphics();
        settlementLayer.addChild(sm);
        settlementGfxMap.current.set(key, sm);
      }
    },
    [],
  );

  // ─── Update overlays + settlements (called on prop changes) ──────────────
  const updateScene = useCallback(
    (
      b: Board,
      valids: AxialCoord[],
      hovKey: string | null,
      sel: AxialCoord | null,
      invalidKey: string | null,
      recentKey: string | null,
      pls: Player[],
    ) => {
      const validSet = new Set(valids.map(hexToKey));

      for (const cell of b.getAllCells()) {
        const key = hexToKey(cell.coord);

        // ── Overlay ──────────────────────────────────────────────────────
        const ov = overlayGfxMap.current.get(key);
        if (ov) {
          ov.clear();
          if (invalidKey === key) {
            // Red flash
            drawHex(ov, cell.coord, 0xff0000, 0.45);
          } else if (validSet.has(key)) {
            if (hovKey === key) {
              // Hovered valid: bright amber border + light fill
              drawHex(ov, cell.coord, 0xffcc00, 0.22);
              drawHexBorder(ov, cell.coord, 0xffcc00, 3);
            } else {
              // Valid placement: soft lime overlay
              drawHex(ov, cell.coord, 0x80ff40, 0.18);
              drawHexBorder(ov, cell.coord, 0x66dd22, 1.5, 0.7);
            }
          } else if (sel && sel.q === cell.coord.q && sel.r === cell.coord.r) {
            // Selected (non-valid) — subtle highlight
            drawHexBorder(ov, cell.coord, 0xffa500, 2.5, 0.9);
          } else if (hovKey === key) {
            // Hovered non-valid: faint white glow border
            drawHexBorder(ov, cell.coord, 0xffffff, 2, 0.35);
          }

          // recentlyPlaced pop-in: bright white flash
          if (recentKey === key) {
            drawHex(ov, cell.coord, 0xffffff, 0.35);
          }
        }

        // ── Settlement (R36 Phase 2c: Sprite.tint 2.5D 小房子) ───────────
        // R38a: settlementGfxMap 兼作玩家色邊框環（clear/redraw on every updateScene）
        const existingSprite = settlementSpriteMap.current.get(key);
        const smGfx = settlementGfxMap.current.get(key);

        if (cell.settlement !== undefined) {
          const player = pls.find(p => p.id === cell.settlement);
          const tint = player?.color ? cssColorToPixi(player.color) : 0xffffff;

          if (existingSprite) {
            // 已有 Sprite → 只更新 tint（O(1)，不重建）
            existingSprite.tint = tint;
          } else {
            // 新聚落 → 建 Sprite
            const tex = houseTextureRef.current;
            if (tex) {
              const sprite = new Sprite(tex);
              sprite.anchor.set(0.5, 0.5);
              const center = axialToPixel(cell.coord, HEX_SIZE);
              sprite.position.set(center.x, center.y);
              sprite.width = HEX_SIZE * 0.9;
              sprite.height = HEX_SIZE * 0.95;
              sprite.tint = tint;
              // 插入 hexContainer 的 sm 錨點位置（非尾端），確保 overlay 高亮層仍在聚落之上、
              // hover/valid/invalid 回饋不被小房子遮住（dev-manager #173 z-order 修正）。
              // container 為 null 則跳過建立，避免孤兒 Sprite 洩漏（dev-manager #173 防呆）。
              const container = smGfx?.parent;
              if (container) {
                container.addChildAt(sprite, container.getChildIndex(smGfx));
                settlementSpriteMap.current.set(key, sprite);
              } else {
                sprite.destroy();
              }
            }
          }

          // R38a: draw player-colour border ring around settlement for attribution clarity
          if (smGfx && player?.color) {
            smGfx.clear();
            const center = axialToPixel(cell.coord, HEX_SIZE);
            const radius = HEX_SIZE * 0.52;
            smGfx.setStrokeStyle({ width: 2.5, color: cssColorToPixi(player.color), alpha: 0.85 });
            smGfx.circle(center.x, center.y, radius);
            smGfx.stroke();
          }
        } else {
          // 格子無聚落 → 銷毀 Sprite（若有）、清 border ring
          if (existingSprite) {
            existingSprite.destroy();
            settlementSpriteMap.current.delete(key);
          }
          if (smGfx) smGfx.clear();
        }
      }
    },
    [],
  );

  // ─── Pixi initialisation (runs once on mount) ─────────────────────────────
  useEffect(() => {
    if (initializedRef.current) return;
    if (!canvasRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const app = new Application();
    appRef.current = app;

    const worldInfo = computeWorldInfo(board);
    worldInfoRef.current = worldInfo;
    const { worldWidth, worldHeight, gridOffset } = worldInfo;

    const containerEl = containerRef.current;

    // async init — React useEffect cannot be async, use IIFE
    (async () => {
      // Guard: React StrictMode may have already cleaned up by the time init resolves
      if (!initializedRef.current) return;

      await app.init({
        canvas: canvasRef.current!,
        resizeTo: containerEl,
        background: 0x2C1A0E, // R36 Phase 2a: 深木棕（取代深藍黑 0x1a1a2e）
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (!initializedRef.current) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      // Viewport
      const vp = new Viewport({
        screenWidth: containerEl.clientWidth,
        screenHeight: containerEl.clientHeight,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
        // threshold: minimum pixel movement before drag begins
        // Prevents click-swallowed-by-pan (root cause of R30 bug)
        threshold: 5,
      });
      viewportRef.current = vp;

      app.stage.addChild(vp);

      vp
        .drag({ pressDrag: true, mouseButtons: 'all' })
        .pinch()
        .wheel({ smooth: 5 })
        .decelerate({ friction: 0.94 })
        .clamp({ direction: 'all', underflow: 'center' })
        .clampZoom({ minScale: 0.25, maxScale: 5.0 });

      // Initial centre + fit
      const scaleX = containerEl.clientWidth / worldWidth;
      const scaleY = containerEl.clientHeight / worldHeight;
      const initScale = Math.min(scaleX, scaleY) * 0.92;
      vp.setZoom(initScale, true);
      vp.moveCenter(worldWidth / 2, worldHeight / 2);
      setZoomScale(initScale);

      // Track zoom for badge
      vp.on('zoomed', () => {
        setZoomScale(vp.scaled);
      });
      vp.on('moved', () => {
        setZoomScale(vp.scaled);
      });

      // R37a: 並行預載 tile PNG（去重）+ piece + house texture
      // motif 預載停用（MOTIF_DATA_URLS 不再載）
      const pieceEntries = Object.entries(PIECE_DATA_URLS);

      // tile URL 去重（多個 terrain 共用同一 PNG）
      const uniqueTileUrls = [...new Set(Object.values(TERRAIN_TILE_MAP))];
      // deco URL 去重（Forest/Flower 用不同 PNG）
      const uniqueDecoUrls = [...new Set(Object.values(TERRAIN_DECO_MAP))];

      const [tileTextures, decoTextures, pieceTextures, houseTex] = await Promise.all([
        // tile PNG（靜態路徑，直接 Assets.load URL）
        Promise.all(uniqueTileUrls.map(url => Assets.load<Texture>(url))),
        // deco PNG（pine/flower）
        Promise.all(uniqueDecoUrls.map(url => Assets.load<Texture>(url))),
        // piece DataURL（棋子 SVG）
        Promise.all(
          pieceEntries.map(([, dataUrl]) =>
            Assets.load<Texture>({
              src: dataUrl,
              data: { width: 28, height: 28, resolution: window.devicePixelRatio || 1 },
            }),
          ),
        ),
        // R36 Phase 2c: white-house texture（聚落小房子）
        Assets.load<Texture>({
          src: HOUSE_DATA_URL,
          data: { width: 28, height: 28, resolution: window.devicePixelRatio || 1 },
        }),
      ]);

      // 建 tile/deco texture map（URL → Texture）
      const tileTextureMap = new Map<string, Texture>();
      uniqueTileUrls.forEach((url, i) => tileTextureMap.set(url, tileTextures[i]));

      const decoTextureMap = new Map<string, Texture>();
      uniqueDecoUrls.forEach((url, i) => decoTextureMap.set(url, decoTextures[i]));

      const pieceTextureMap = new Map<string, Texture>();
      pieceEntries.forEach(([key], i) => pieceTextureMap.set(key, pieceTextures[i]));

      // StrictMode guard：預載途中如 initializedRef 已被重設，卸載並返回
      if (!initializedRef.current) {
        for (const [url, tex] of tileTextureMap) {
          try { tex.destroy(); } catch { /* suppress */ }
          Assets.unload(url).catch(() => { /* suppress */ });
        }
        for (const [url, tex] of decoTextureMap) {
          try { tex.destroy(); } catch { /* suppress */ }
          Assets.unload(url).catch(() => { /* suppress */ });
        }
        for (const [key, tex] of pieceTextureMap) {
          tex.destroy();
          const dataUrl = PIECE_DATA_URLS[key];
          if (dataUrl) Assets.unload(dataUrl).catch(() => { /* suppress */ });
        }
        try { houseTex.destroy(); } catch { /* suppress */ }
        Assets.unload(HOUSE_DATA_URL).catch(() => { /* suppress */ });
        app.destroy(true, { children: true, texture: true });
        return;
      }

      // 存入 ref 供 buildScene + cleanup 使用
      tileTextureMapRef.current = tileTextureMap;
      decoTextureMapRef.current = decoTextureMap;
      houseTextureRef.current = houseTex;
      pieceTextureMapRef.current = pieceTextureMap;
      // motifTextureMapRef 保持空（cleanup 仍會 forEach，空 map 無害）

      // Build scene
      buildScene(vp, boardRef.current, gridOffset, pieceTextureMap);

      // Initial overlay render
      updateScene(
        boardRef.current,
        validPlacementsRef.current,
        null,
        null,
        null,
        null,
        players,
      );

      // ── Pointer events ──────────────────────────────────────────────────
      vp.on('pointermove', (e) => {
        const { x, y } = e.getLocalPosition(vp);
        const coord = worldPointToHex(x, y, gridOffset);
        if (coord) {
          const k = hexToKey(coord);
          setHoveredKey(k);
          onCellSelectRef.current(coord);
        } else {
          setHoveredKey(null);
          onCellSelectRef.current(null);
        }
      });

      vp.on('pointertap', (e) => {
        const { x, y } = e.getLocalPosition(vp);
        const coord = worldPointToHex(x, y, gridOffset);
        if (!coord) return;
        const validSet = new Set(validPlacementsRef.current.map(hexToKey));
        if (validSet.has(hexToKey(coord))) {
          onCellClickRef.current(coord);
        } else {
          onInvalidClickRef.current?.(coord);
        }
      });

      vp.on('pointerleave', () => {
        setHoveredKey(null);
        onCellSelectRef.current(null);
      });
    })();

    // Cleanup
    return () => {
      initializedRef.current = false;
      // R37a: cleanup tile Sprites
      tileSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      tileSpriteMap.current.clear();
      // R37a: cleanup tile Textures
      tileTextureMapRef.current.forEach((tex, url) => {
        try { tex.destroy(); } catch { /* suppress */ }
        Assets.unload(url).catch(() => { /* suppress */ });
      });
      tileTextureMapRef.current.clear();
      // R37a: cleanup deco Sprites
      decoSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      decoSpriteMap.current.clear();
      // R37a: cleanup deco Textures
      decoTextureMapRef.current.forEach((tex, url) => {
        try { tex.destroy(); } catch { /* suppress */ }
        Assets.unload(url).catch(() => { /* suppress */ });
      });
      decoTextureMapRef.current.clear();
      // R36: cleanup motif Sprites（R37a 空 map，無害保留）
      motifSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      motifSpriteMap.current.clear();
      // R36: cleanup motif Textures（R37a 空 map，無害保留）
      motifTextureMapRef.current.forEach((tex) => {
        try { tex.destroy(); } catch { /* suppress */ }
      });
      motifTextureMapRef.current.clear();
      // R36 Phase 2b-2: cleanup piece Sprites
      pieceSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      pieceSpriteMap.current.clear();
      // R36 Phase 2b-2: cleanup piece Textures
      pieceTextureMapRef.current.forEach((tex, key) => {
        try { tex.destroy(); } catch { /* suppress */ }
        const dataUrl = PIECE_DATA_URLS[key];
        if (dataUrl) Assets.unload(dataUrl).catch(() => { /* suppress */ });
      });
      pieceTextureMapRef.current.clear();
      // R36 Phase 2c: cleanup settlement Sprites
      settlementSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      settlementSpriteMap.current.clear();
      // R36 Phase 2c: cleanup house texture
      if (houseTextureRef.current) {
        try { houseTextureRef.current.destroy(); } catch { /* suppress */ }
        Assets.unload(HOUSE_DATA_URL).catch(() => { /* suppress */ });
        houseTextureRef.current = null;
      }
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true });
        } catch {
          // suppress destroy errors during unmount
        }
        appRef.current = null;
      }
      viewportRef.current = null;
      overlayGfxMap.current.clear();
      settlementGfxMap.current.clear();
      tileLayerRef.current = null;
      pieceLayerRef.current = null;
      overlayLayerRef.current = null;
      settlementLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only runs on mount

  // ─── invalidClickKey → flash state ────────────────────────────────────────
  useEffect(() => {
    if (!invalidClickKey) return;
    if (invalidFlashTimerRef.current) clearTimeout(invalidFlashTimerRef.current);
    setInvalidFlashKey(invalidClickKey);
    invalidFlashTimerRef.current = setTimeout(() => setInvalidFlashKey(null), 400);
    return () => {
      if (invalidFlashTimerRef.current) clearTimeout(invalidFlashTimerRef.current);
    };
  }, [invalidClickKey]);

  // ─── recentlyPlaced detection ─────────────────────────────────────────────
  useEffect(() => {
    const cells = board.getAllCells();
    const currentKeys = new Set<string>();
    for (const cell of cells) {
      if (cell.settlement !== undefined) {
        currentKeys.add(hexToKey(cell.coord));
      }
    }
    let newKey: string | null = null;
    for (const key of currentKeys) {
      if (!prevSettlementKeysRef.current.has(key)) {
        newKey = key;
        break;
      }
    }
    prevSettlementKeysRef.current = currentKeys;

    if (newKey) {
      if (recentlyPlacedTimerRef.current) clearTimeout(recentlyPlacedTimerRef.current);
      setRecentlyPlacedKey(newKey);
      recentlyPlacedTimerRef.current = setTimeout(() => setRecentlyPlacedKey(null), 350);
    }
    return () => {
      if (recentlyPlacedTimerRef.current) clearTimeout(recentlyPlacedTimerRef.current);
    };
  }, [board]);

  // ─── Re-render overlays when relevant props change ────────────────────────
  useEffect(() => {
    if (!initializedRef.current) return;
    updateScene(
      board,
      validPlacements,
      hoveredKey,
      selectedCell,
      invalidFlashKey,
      recentlyPlacedKey,
      players,
    );
  }, [
    board,
    validPlacements,
    hoveredKey,
    selectedCell,
    invalidFlashKey,
    recentlyPlacedKey,
    players,
    updateScene,
  ]);

  // ─── Zoom reset handler ───────────────────────────────────────────────────
  const handleResetZoom = useCallback(() => {
    const vp = viewportRef.current;
    const wInfo = worldInfoRef.current;
    const containerEl = containerRef.current;
    if (!vp || !wInfo || !containerEl) return;
    const scaleX = containerEl.clientWidth / wInfo.worldWidth;
    const scaleY = containerEl.clientHeight / wInfo.worldHeight;
    const fitScale = Math.min(scaleX, scaleY) * 0.92;
    vp.animate({
      position: { x: wInfo.worldWidth / 2, y: wInfo.worldHeight / 2 },
      scale: fitScale,
      time: 300,
      ease: 'easeInOutSine',
    });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{
        // R36 Phase 2a: 深木棕背景 + 木桌框 CSS MVP（羊皮紙感 border + shadow）
        background: '#2C1A0E',
        border: '6px solid #5C3A1E',
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)',
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        // canvas has no DOM focus ring — no tabIndex, no outline
      />

      {/* Zoom reset button (React DOM overlay) */}
      <button
        className="absolute top-2 right-2 z-10 rounded-full w-9 h-9 text-sm font-bold shadow flex items-center justify-center"
        style={{ background: 'oklch(0.98 0.01 85 / 0.85)', border: '1px solid var(--card-border)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.98 0.01 85 / 0.85)')}
        onClick={handleResetZoom}
        title={t('board.resetZoomTitle')}
        aria-label={t('board.resetZoomAria')}
      >
        ⌖
      </button>

      {/* Zoom level badge */}
      <div
        className="absolute bottom-2 right-2 z-10 text-xs rounded px-2 py-0.5 pointer-events-none"
        style={{ background: 'oklch(0.98 0.01 85 / 0.75)', color: 'var(--color-stone-500)' }}
      >
        {Math.round(zoomScale * 100)}%
      </div>
    </div>
  );
};

PixiBoard.displayName = 'PixiBoard';

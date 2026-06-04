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
import { Application, Graphics, Container, NoiseFilter, Assets, Sprite, Texture } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { Board } from '../../core/board';
import type { AxialCoord } from '../../core/hex';
import { HEX_SIZE, hexToKey, pixelToAxial, axialToPixel } from '../../core/hex';
import type { Player } from '../../types';
import { Location } from '../../core/terrain';
import { getTerrainColor } from '../../core/terrain';
import {
  cssColorToPixi,
  drawHex,
  drawHexBorder,
  drawHexGradient,
  drawHexLightOverlay,
  drawSettlementCircle,
  drawCastleMarker,
  drawLocationDot,
} from './pixiHexUtils';
import { TERRAIN_GRADIENTS, getTerrainVariant } from './terrainArt';
import { MOTIF_DATA_URLS } from './motifTextures';
import { useTranslation } from 'react-i18next';

// ─── Location indicator colours (functional, not R24 art) ───────────────────
const LOCATION_COLORS: Record<string, number> = {
  [Location.Farm]:    0x8BC34A,
  [Location.Oasis]:   0x00BCD4,
  [Location.Tower]:   0x9E9E9E,
  [Location.Harbor]:  0x1565C0,
  [Location.Paddock]: 0x795548,
  [Location.Barn]:    0xF57F17,
  [Location.Oracle]:  0x7B1FA2,
  [Location.Tavern]:  0xE53935,
};

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
  const terrainGfxMap = useRef<Map<string, Graphics>>(new Map());
  const lightOverlayGfxMap = useRef<Map<string, Graphics>>(new Map());
  const overlayGfxMap = useRef<Map<string, Graphics>>(new Map());
  const settlementGfxMap = useRef<Map<string, Graphics>>(new Map());
  const locationGfxMap = useRef<Map<string, Graphics>>(new Map());

  // R36 Phase 2b-1: motif Sprite map — keyed by "q,r"
  const motifSpriteMap = useRef<Map<string, Sprite>>(new Map());
  // R36 Phase 2b-1: motif Texture map (for cleanup) — keyed by motif key e.g. "Grass-a"
  const motifTextureMapRef = useRef<Map<string, Texture>>(new Map());

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
  const buildScene = useCallback(
    (viewport: Viewport, b: Board, gridOffset: number, motifTextureMap: Map<string, Texture>) => {
      const hexContainer = new Container();
      // Translate by gridOffset so hex (0,0) is not at the canvas corner
      hexContainer.position.set(gridOffset, gridOffset);
      viewport.addChild(hexContainer);

      // R36 Phase 2a: terrainLayer sub-container holds terrain + light overlay.
      // NoiseFilter is applied to this layer ONLY (not hexContainer),
      // so grain does not affect location markers / overlay / settlements.
      const terrainLayer = new Container();
      hexContainer.addChild(terrainLayer);

      // Grain filter: O(1), applied once to terrainLayer
      const noiseFilter = new NoiseFilter({ noise: 0.04, seed: 42 });
      terrainLayer.filters = [noiseFilter];

      const cells = b.getAllCells();
      for (const cell of cells) {
        const key = hexToKey(cell.coord);

        // Terrain gradient layer (R36 Phase 2a: replaces flat colour)
        const tg = new Graphics();
        const variant = getTerrainVariant(cell.coord.q, cell.coord.r);
        const terrainName = cell.terrain as string;
        const gradKey = `${terrainName}-${variant}`;
        const grad = TERRAIN_GRADIENTS[gradKey];
        if (grad) {
          drawHexGradient(tg, cell.coord, grad);
        } else {
          // Fallback to flat colour for unknown terrain types
          const terrainCss = getTerrainColor(cell.terrain);
          const terrainPx = cssColorToPixi(terrainCss);
          drawHex(tg, cell.coord, terrainPx, 1.0, 0x000000, 0.3);
        }
        terrainLayer.addChild(tg);
        terrainGfxMap.current.set(key, tg);

        // R36 Phase 2b-1: motif Sprite — inserted after tg, before log
        // tg 在 terrainLayer 的 index = terrainLayer.children.length - 1（剛加入）
        const motifKey = `${terrainName}-${variant}`;
        const motifTex = motifTextureMap.get(motifKey);
        if (motifTex) {
          const motifSprite = new Sprite(motifTex);
          motifSprite.anchor.set(0.5, 0.5);
          const center = axialToPixel(cell.coord, HEX_SIZE);
          motifSprite.position.set(center.x, center.y);
          motifSprite.width = 52;
          motifSprite.height = 60;
          // 插在 tg 之後（tg 是 terrainLayer 最後一個 child，indexOf 取其 index + 1）
          terrainLayer.addChildAt(motifSprite, terrainLayer.children.indexOf(tg) + 1);
          motifSpriteMap.current.set(key, motifSprite);
        }

        // Light overlay layer (R36 Phase 2a: directional light above terrain)
        const log = new Graphics();
        drawHexLightOverlay(log, cell.coord);
        terrainLayer.addChild(log);
        lightOverlayGfxMap.current.set(key, log);

        // Location marker layer (static, drawn once) — outside terrainLayer (no grain)
        if (cell.location !== undefined) {
          const lg = new Graphics();
          if (cell.location === Location.Castle) {
            drawCastleMarker(lg, cell.coord);
          } else {
            const locColor = LOCATION_COLORS[cell.location] ?? 0xaaaaaa;
            drawLocationDot(lg, cell.coord, locColor);
          }
          hexContainer.addChild(lg);
          locationGfxMap.current.set(key, lg);
        }

        // Overlay layer (valid/hover/invalid/selected — updated dynamically) — outside terrainLayer
        const ov = new Graphics();
        hexContainer.addChild(ov);
        overlayGfxMap.current.set(key, ov);

        // Settlement marker layer — outside terrainLayer
        const sm = new Graphics();
        hexContainer.addChild(sm);
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

        // ── Settlement ────────────────────────────────────────────────────
        const sm = settlementGfxMap.current.get(key);
        if (sm) {
          if (cell.settlement !== undefined) {
            const player = pls.find(p => p.id === cell.settlement);
            if (player?.color) {
              drawSettlementCircle(sm, cell.coord, cssColorToPixi(player.color));
            }
          } else {
            sm.clear();
          }
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

      // R36 Phase 2b-1: 預載 21 個 motif texture
      const motifTextureMap = new Map<string, Texture>();
      for (const [key, dataUrl] of Object.entries(MOTIF_DATA_URLS)) {
        const tex = await Assets.load<Texture>({
          src: dataUrl,
          data: {
            width: 52,
            height: 60,
            resolution: window.devicePixelRatio || 1,
          },
        });
        motifTextureMap.set(key, tex);
      }
      // StrictMode guard：預載途中如 initializedRef 已被重設，卸載並返回
      if (!initializedRef.current) {
        for (const tex of motifTextureMap.values()) {
          tex.destroy();
        }
        for (const [key, dataUrl] of Object.entries(MOTIF_DATA_URLS)) {
          if (motifTextureMap.has(key)) {
            Assets.unload(dataUrl).catch(() => { /* suppress */ });
          }
        }
        app.destroy(true, { children: true, texture: true });
        return;
      }

      // 存入 ref 供 cleanup 使用
      motifTextureMapRef.current = motifTextureMap;

      // Build scene
      buildScene(vp, boardRef.current, gridOffset, motifTextureMap);

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
      // R36 Phase 2b-1: cleanup motif Sprites
      motifSpriteMap.current.forEach(s => { try { s.destroy(); } catch { /* suppress */ } });
      motifSpriteMap.current.clear();
      // R36 Phase 2b-1: cleanup motif Textures
      motifTextureMapRef.current.forEach((tex, key) => {
        try { tex.destroy(); } catch { /* suppress */ }
        const dataUrl = MOTIF_DATA_URLS[key];
        if (dataUrl) Assets.unload(dataUrl).catch(() => { /* suppress */ });
      });
      motifTextureMapRef.current.clear();
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true });
        } catch {
          // suppress destroy errors during unmount
        }
        appRef.current = null;
      }
      viewportRef.current = null;
      terrainGfxMap.current.clear();
      lightOverlayGfxMap.current.clear();
      overlayGfxMap.current.clear();
      settlementGfxMap.current.clear();
      locationGfxMap.current.clear();
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

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type TouchEvent,
  type MouseEvent,
} from 'react';
import type { HexCell, HexCoord } from '../../types';
import {
  hexToPixel,
  hexKey,
  TERRAIN_COLORS,
  TERRAIN_LABELS,
  HEX_SIZE,
} from '../../core/hex';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const LONG_PRESS_DURATION = 500;
const SESSION_STORAGE_ZOOM_KEY = 'hex-grid-zoom';

function getStoredZoom(): number {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_ZOOM_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= ZOOM_MIN && val <= ZOOM_MAX) return val;
    }
  } catch {
    // sessionStorage may be unavailable
  }
  return 1;
}

function saveZoom(zoom: number): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_ZOOM_KEY, String(zoom));
  } catch {
    // ignore
  }
}

interface Tooltip {
  cell: HexCell;
  x: number;
  y: number;
}

export interface HexGridProps {
  cells: HexCell[];
  onCellClick?: (coord: HexCoord) => void;
  hexSize?: number;
}

export function HexGrid({
  cells,
  onCellClick,
  hexSize = HEX_SIZE,
}: HexGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Zoom state persisted to sessionStorage
  const [zoom, setZoomState] = useState<number>(getStoredZoom);
  const setZoom = useCallback((next: number | ((prev: number) => number)) => {
    setZoomState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
      saveZoom(clamped);
      return clamped;
    });
  }, []);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Tooltip for long-press
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  // Touch tracking refs
  const lastTapTimeRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isTouchMoveRef = useRef(false);

  // Clear tooltip on outside click
  useEffect(() => {
    const handler = () => setTooltip(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // --- Compute layout bounds ---
  const pixelPositions = cells.map((c) => hexToPixel(c.coord, hexSize));
  const xs = pixelPositions.map((p) => p.x);
  const ys = pixelPositions.map((p) => p.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  const padding = hexSize * 1.5;
  const svgWidth = maxX - minX + hexSize * 2 + padding * 2;
  const svgHeight = maxY - minY + hexSize * 2 + padding * 2;
  const offsetX = -minX + hexSize + padding;
  const offsetY = -minY + hexSize + padding;

  // --- Touch distance helper ---
  function getTouchDist(a: React.Touch, b: React.Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMidpoint(a: React.Touch, b: React.Touch) {
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    };
  }

  // --- Handlers ---
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      isTouchMoveRef.current = false;

      if (e.touches.length === 2) {
        // Pinch-to-zoom start
        cancelLongPress();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        pinchStartRef.current = { dist, zoom };
        panStartRef.current = null;
      } else if (e.touches.length === 1) {
        // Single touch: potential pan, long-press, or tap
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: pan.x,
          panY: pan.y,
        };
        pinchStartRef.current = null;

        // Long-press timer
        cancelLongPress();
        longPressTimerRef.current = setTimeout(() => {
          if (!isTouchMoveRef.current) {
            // Find the cell under touch
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const cellKey = el?.closest('[data-hex-key]')?.getAttribute('data-hex-key');
            if (cellKey) {
              const cell = cells.find((c) => hexKey(c.coord) === cellKey);
              if (cell) {
                setTooltip({ cell, x: touch.clientX, y: touch.clientY });
              }
            }
          }
        }, LONG_PRESS_DURATION);
      }
    },
    [zoom, pan, cells, cancelLongPress]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      isTouchMoveRef.current = true;
      cancelLongPress();

      if (e.touches.length === 2 && pinchStartRef.current) {
        // Pinch-to-zoom
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const ratio = dist / pinchStartRef.current.dist;
        const newZoom = Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, pinchStartRef.current.zoom * ratio)
        );
        setZoom(newZoom);

        // Also pan to midpoint
        const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
        if (panStartRef.current) {
          const dx = mid.x - panStartRef.current.x;
          const dy = mid.y - panStartRef.current.y;
          setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
        }
      } else if (e.touches.length === 1 && panStartRef.current) {
        // Pan
        const touch = e.touches[0];
        const dx = touch.clientX - panStartRef.current.x;
        const dy = touch.clientY - panStartRef.current.y;
        setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      }
    },
    [setZoom, cancelLongPress]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      cancelLongPress();

      if (e.changedTouches.length === 1 && !isTouchMoveRef.current) {
        const touch = e.changedTouches[0];

        // Double-tap to reset zoom
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
          lastTapTimeRef.current = 0;
          return;
        }
        lastTapTimeRef.current = now;

        // Find cell under touch (using element from point)
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cellKey = el?.closest('[data-hex-key]')?.getAttribute('data-hex-key');
        if (cellKey && onCellClick) {
          const cell = cells.find((c) => hexKey(c.coord) === cellKey);
          if (cell) {
            onCellClick(cell.coord);
          }
        }
      }

      pinchStartRef.current = null;
      panStartRef.current = null;
      touchStartRef.current = null;
    },
    [cells, onCellClick, setZoom, cancelLongPress]
  );

  const handleMouseClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = e.target as Element;
      const cellKey = el.closest('[data-hex-key]')?.getAttribute('data-hex-key');
      if (cellKey && onCellClick) {
        const cell = cells.find((c) => hexKey(c.coord) === cellKey);
        if (cell) {
          onCellClick(cell.coord);
        }
      }
    },
    [cells, onCellClick]
  );

  // Hex polygon points
  function hexPoints(cx: number, cy: number, size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30; // pointy-top
      const angleRad = (Math.PI / 180) * angleDeg;
      points.push(
        `${cx + size * Math.cos(angleRad)},${cy + size * Math.sin(angleRad)}`
      );
    }
    return points.join(' ');
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden w-full h-full touch-none select-none"
      aria-label="六角格棋盤"
      style={{ cursor: 'grab' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleMouseClick}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          aria-label="棋盤格"
          role="img"
        >
          {cells.map((cell) => {
            const { x, y } = hexToPixel(cell.coord, hexSize);
            const cx = x + offsetX;
            const cy = y + offsetY;
            const color = TERRAIN_COLORS[cell.terrain];
            const key = hexKey(cell.coord);

            return (
              <g
                key={key}
                data-hex-key={key}
                aria-label={`${TERRAIN_LABELS[cell.terrain]} (${cell.coord.q},${cell.coord.r})`}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={hexPoints(cx, cy, hexSize - 1)}
                  fill={cell.isHighlighted ? '#ffff00' : color}
                  stroke={cell.isHighlighted ? '#ff6600' : '#333'}
                  strokeWidth={cell.isHighlighted ? 2 : 1}
                  opacity={0.9}
                />
                {cell.hasSettlement && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hexSize * 0.3}
                    fill={cell.settlementColor ?? '#fff'}
                    stroke="#333"
                    strokeWidth={1}
                  />
                )}
                {cell.isLocation && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize={hexSize * 0.5}
                    fill="#333"
                    pointerEvents="none"
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          aria-label="放大"
          className="w-11 h-11 rounded-full bg-white/80 shadow-md text-xl font-bold flex items-center justify-center hover:bg-white active:bg-gray-100 touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
          }}
        >
          +
        </button>
        <button
          aria-label="縮小"
          className="w-11 h-11 rounded-full bg-white/80 shadow-md text-xl font-bold flex items-center justify-center hover:bg-white active:bg-gray-100 touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
          }}
        >
          −
        </button>
        <button
          aria-label="重置縮放"
          className="w-11 h-11 rounded-full bg-white/80 shadow-md text-sm font-bold flex items-center justify-center hover:bg-white active:bg-gray-100 touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          ↺
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-2 right-2 text-xs bg-black/30 text-white px-2 py-1 rounded pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Long-press tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 160),
            top: tooltip.y - 70,
            maxWidth: 160,
          }}
          role="tooltip"
          aria-live="polite"
        >
          <p className="font-bold">{TERRAIN_LABELS[tooltip.cell.terrain]}</p>
          <p>座標: ({tooltip.cell.coord.q}, {tooltip.cell.coord.r})</p>
          {tooltip.cell.hasSettlement && (
            <p>有聚落</p>
          )}
          {tooltip.cell.isLocation && <p>🌟 地點板塊</p>}
        </div>
      )}
    </div>
  );
}

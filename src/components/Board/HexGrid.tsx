import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Board } from '../../core/board';
import { AxialCoord, hexEquals, HEX_SIZE, axialToPixel } from '../../core/hex';
import { HexCell } from './HexCell';
import { TerrainDefs } from './TerrainDefs';
import { PieceDefs } from './PieceDefs';
import { Player, HexCell as HexCellData } from '../../types';
import { useBoardTransform, Transform } from '../../hooks/useBoardTransform';
import { useTranslation } from 'react-i18next';

/**
 * Given a client-space coordinate (e.g. from mouse or touch event),
 * reverse the container transform and SVG viewBox scaling to find
 * which hex cell is at that point. Returns null if no cell is close enough.
 */
export function findHexAtClientXY(
  clientX: number,
  clientY: number,
  cells: HexCellData[],
  transform: Transform,
  containerRect: DOMRect,
  svgElement: SVGSVGElement,
  gridOffset: number,
): AxialCoord | null {
  // Step 1: position relative to container
  const cx = clientX - containerRect.left;
  const cy = clientY - containerRect.top;

  // Step 2: undo transform (scale + translate)
  const sx = (cx - transform.translateX) / transform.scale;
  const sy = (cy - transform.translateY) / transform.scale;

  // Step 3: SVG viewBox scaling
  // The inner <div> is 100%×100% of container, SVG is also 100%×100% of that div
  // We need the ratio between the rendered SVG size and its viewBox
  const svgRect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;
  const scaleX = svgRect.width > 0 ? viewBox.width / svgRect.width : 1;
  const scaleY = svgRect.height > 0 ? viewBox.height / svgRect.height : 1;

  // sx/sy are in the coordinate space of the inner div (which is 100%x100% of container)
  // svgRect is also in client space, so we need to account for svgRect offset relative to container
  const svgOffsetX = svgRect.left - containerRect.left;
  const svgOffsetY = svgRect.top - containerRect.top;

  const viewBoxX = (sx - svgOffsetX) * scaleX;
  const viewBoxY = (sy - svgOffsetY) * scaleY;

  // Step 4: subtract gridOffset to get hex coordinate space
  const hexSpaceX = viewBoxX - gridOffset;
  const hexSpaceY = viewBoxY - gridOffset;

  // Step 5: find closest cell within HEX_SIZE * 0.95 threshold
  let bestCell: HexCellData | null = null;
  let bestDist = HEX_SIZE * 0.95;

  for (const cell of cells) {
    const center = axialToPixel(cell.coord, HEX_SIZE);
    const dx = hexSpaceX - center.x;
    const dy = hexSpaceY - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestCell = cell;
    }
  }

  return bestCell ? bestCell.coord : null;
}

interface HexGridProps {
  board: Board;
  validPlacements: AxialCoord[];
  selectedCell: AxialCoord | null;
  players: Player[];
  onCellClick: (coord: AxialCoord) => void;
  onCellSelect: (coord: AxialCoord | null) => void;
  onEscape?: () => void;
  editable?: boolean;
  onEditCellClick?: (coord: AxialCoord) => void;
  onEditCellPaint?: (coord: AxialCoord) => void;
  editMode?: 'paint' | 'pan';
  onInvalidClick?: (coord: AxialCoord) => void;
}

export const HexGrid: React.FC<HexGridProps> = React.memo(({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
  onEscape,
  editable,
  onEditCellClick,
  onEditCellPaint,
  editMode = 'paint',
  onInvalidClick,
}) => {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<AxialCoord | null>(null);
  const {
    transform,
    containerRef,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    reset,
  } = useBoardTransform();

  // Track whether a touch gesture has moved significantly (to distinguish tap vs pan)
  const touchMoved = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [focusedHex, setFocusedHex] = useState<AxialCoord | null>(null);
  const cellRefs = useRef<Map<string, SVGGElement>>(new Map());

  // Phase 3: drag-paint state
  const isPainting = useRef(false);
  const lastPaintedCoord = useRef<AxialCoord | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const cells = board.getAllCells();

  // ── UI-only: track the most recently placed settlement cell ────────────────
  // We compare the set of settlement keys before/after board changes.
  // No gameStore logic is touched — this is purely a render-layer effect.
  const [recentlyPlacedKey, setRecentlyPlacedKey] = useState<string | null>(null);
  const prevSettlementKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Build current settlement key set (only cells that have a settlement)
    const currentKeys = new Set<string>();
    for (const cell of cells) {
      if (cell.settlement !== undefined) {
        currentKeys.add(`${cell.coord.q},${cell.coord.r}`);
      }
    }

    // Find any newly added key
    let newKey: string | null = null;
    for (const key of currentKeys) {
      if (!prevSettlementKeysRef.current.has(key)) {
        newKey = key;
        break;
      }
    }

    prevSettlementKeysRef.current = currentKeys;

    if (newKey) {
      setRecentlyPlacedKey(newKey);
      const timer = setTimeout(() => setRecentlyPlacedKey(null), 350);
      return () => clearTimeout(timer);
    }
  }, [cells]);
  // ──────────────────────────────────────────────────────────────────────────

  // Calculate SVG dimensions
  // For axial coords, max x = HEX_SIZE * (√3 * (width-1) + √3/2 * (height-1))
  // Add hex radius + padding on both sides
  const padding = HEX_SIZE * 2;
  const maxX = HEX_SIZE * Math.sqrt(3) * ((board.width - 1) + 0.5 * (board.height - 1));
  const maxY = HEX_SIZE * 1.5 * (board.height - 1);
  const width = maxX + HEX_SIZE * 2 + padding * 2;
  const height = maxY + HEX_SIZE * 2 + padding * 2;
  const viewBoxWidth = width;
  const viewBoxHeight = height;
  const gridOffset = padding + HEX_SIZE;

  /** Detects whether the touch has moved significantly (pan vs tap). */
  const handleTouchStartCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchMoved.current = false;
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      // Multi-touch is always a gesture, never a tap
      touchMoved.current = true;
    }
  };

  const handleTouchMoveCapture = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartPos.current && e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      if (dx > 8 || dy > 8) {
        touchMoved.current = true;
      }
    }
  };

  // Programmatically move focus to a hex cell
  const focusHex = useCallback((coord: AxialCoord) => {
    const key = `${coord.q},${coord.r}`;
    const el = cellRefs.current.get(key);
    if (el) {
      el.focus();
      setFocusedHex(coord);
    }
  }, []);

  // Arrow-key direction map (pointy-top hex, axial coords)
  // Keys are lowercased to handle Caps Lock / Shift combinations for WASD
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>, coord: AxialCoord) => {
      const directionMap: Record<string, AxialCoord> = {
        arrowright: { q: 1, r: 0 },
        arrowleft: { q: -1, r: 0 },
        arrowup: { q: 0, r: -1 },
        arrowdown: { q: 0, r: 1 },
        w: { q: 0, r: -1 },
        a: { q: -1, r: 0 },
        s: { q: 0, r: 1 },
        d: { q: 1, r: 0 },
      };

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (editable) { onEditCellClick?.(coord); return; }
        const isValid = validPlacements.some(v => hexEquals(v, coord));
        if (isValid) {
          onCellClick(coord);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
      } else {
        const dir = directionMap[e.key.toLowerCase()];
        if (dir) {
          e.preventDefault();
          const neighbor: AxialCoord = { q: coord.q + dir.q, r: coord.r + dir.r };
          if (board.getCell(neighbor)) {
            focusHex(neighbor);
          }
        }
      }
    },
    [board, validPlacements, onCellClick, onEscape, focusHex],
  );

  // Determine the single entry-point cell that gets tabIndex=0 (roving tabindex pattern)
  const entryCoord = focusedHex ?? (cells.length > 0 ? cells[0].coord : null);

  // Group cells by row (r coordinate) for role="row" grouping
  const rowMap = new Map<number, typeof cells>();
  cells.forEach(cell => {
    const r = cell.coord.r;
    if (!rowMap.has(r)) rowMap.set(r, []);
    rowMap.get(r)!.push(cell);
  });
  const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b);

  // ── Phase 3: container event wrappers ──────────────────────────────────────

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Non-editable: always use pan
    if (!editable) { onMouseDown(e); return; }
    // Right/middle button or pan mode: use pan
    if (e.button !== 0 || editMode !== 'paint') { onMouseDown(e); return; }
    // paint mode + left button: start drag-paint
    isPainting.current = true;
    lastPaintedCoord.current = null;
    // Paint the cell under the cursor immediately
    if (onEditCellPaint && containerRef.current && svgRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const coord = findHexAtClientXY(
        e.clientX, e.clientY,
        cells, transform, containerRect, svgRef.current, gridOffset,
      );
      if (coord) {
        onEditCellPaint(coord);
        lastPaintedCoord.current = coord;
      }
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPainting.current) {
      // drag-paint: find and paint cell under cursor, dedup
      if (onEditCellPaint && containerRef.current && svgRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const coord = findHexAtClientXY(
          e.clientX, e.clientY,
          cells, transform, containerRect, svgRef.current, gridOffset,
        );
        if (coord) {
          const last = lastPaintedCoord.current;
          if (!last || coord.q !== last.q || coord.r !== last.r) {
            onEditCellPaint(coord);
            lastPaintedCoord.current = coord;
          }
        }
      }
      return; // do not call pan handler
    }
    onMouseMove(e);
  };

  const handleContainerMouseUp = () => {
    if (isPainting.current) {
      isPainting.current = false;
      lastPaintedCoord.current = null;
      return; // do not call pan handler
    }
    onMouseUp();
  };

  const handleContainerMouseLeave = () => {
    if (isPainting.current) {
      isPainting.current = false;
      lastPaintedCoord.current = null;
      return;
    }
    onMouseUp();
  };

  const handleContainerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    handleTouchMoveCapture(e);
    // Phase 3 paint mode intercept: single finger drag in paint mode
    if (
      editable &&
      editMode === 'paint' &&
      touchMoved.current &&
      e.touches.length === 1
    ) {
      // Intercept: do drag-paint instead of pan
      if (onEditCellPaint && containerRef.current && svgRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const coord = findHexAtClientXY(
          e.touches[0].clientX, e.touches[0].clientY,
          cells, transform, containerRect, svgRef.current, gridOffset,
        );
        if (coord) {
          const last = lastPaintedCoord.current;
          if (!last || coord.q !== last.q || coord.r !== last.r) {
            onEditCellPaint(coord);
            lastPaintedCoord.current = coord;
          }
        }
      }
      return; // do not call useBoardTransform.onTouchMove
    }
    onTouchMove(e);
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden relative select-none"
      ref={containerRef}
      role="grid"
      aria-label={t('board.gridLabel')}
      onWheel={onWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseLeave}
      onTouchStart={(e) => {
        handleTouchStartCapture(e);
        onTouchStart(e);
      }}
      onTouchMove={handleContainerTouchMove}
      onTouchEnd={(e) => {
        // reset paint coord tracking on touch end
        lastPaintedCoord.current = null;
        onTouchEnd(e);
      }}
      style={{ cursor: editable && editMode === 'paint' ? 'crosshair' : 'grab', touchAction: 'none', background: 'var(--color-warm-cream-200)' }}
    >
      {/* Zoom reset button */}
      <button
        className="absolute top-2 right-2 z-10 rounded-full w-9 h-9 text-sm font-bold shadow flex items-center justify-center"
        style={{ background: 'oklch(0.98 0.01 85 / 0.85)', border: '1px solid var(--card-border)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.98 0.01 85 / 0.85)')}
        onClick={reset}
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
        {Math.round(transform.scale * 100)}%
      </div>

      <div
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          width: '100%',
          height: '100%',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          role="none"
        >
          {/* 共用 terrain defs：gradient / motif symbol / feather mask / grain filter
              只注入一次，400 格 HexCell 以 url(#...) / <use> 引用，不 inline 重複定義 */}
          <TerrainDefs />
          {/* R24-B 棋子 defs：9 種地點 symbol + 共用 drop-shadow filter
              LocationMarker 以 <use href="#piece-{location}"> 引用 */}
          <PieceDefs />
          {/* grain-overlay 套在容器層（O(1) 效能方案）：整 SVG 畫布計算一次 feTurbulence，402 格共用 */}
          <g filter="url(#grain-overlay)">
          <g transform={`translate(${gridOffset}, ${gridOffset})`}>
            {sortedRows.map(([, rowCells]) => (
              <g key={`row-${rowCells[0]?.coord.r}`} role="row">
                {rowCells.map(cell => {
                  const isValid = validPlacements.some(
                    valid => hexEquals(valid, cell.coord)
                  );
                  const isSelected = selectedCell !== null && hexEquals(selectedCell, cell.coord);
                  const isHovered = hoveredCell !== null && hexEquals(hoveredCell, cell.coord);

                  // Find player color/name if settlement exists
                  let playerColor: string | undefined;
                  let playerName: string | undefined;
                  if (cell.settlement !== undefined) {
                    const player = players.find(p => p.id === cell.settlement);
                    playerColor = player?.color;
                    playerName = player?.name;
                  }

                  const key = `${cell.coord.q},${cell.coord.r}`;
                  const isEntry = entryCoord !== null && hexEquals(cell.coord, entryCoord);
                  const isRecentlyPlaced = recentlyPlacedKey === key;

                  return (
                    <HexCell
                      key={key}
                      cell={cell}
                      isValid={isValid}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      isRecentlyPlaced={isRecentlyPlaced}
                      playerColor={playerColor}
                      playerName={playerName}
                      tabIndex={isEntry ? 0 : -1}
                      onClick={() => {
                        if (editable) { onEditCellClick?.(cell.coord); return; }
                        if (isValid) {
                          onCellClick(cell.coord);
                        } else {
                          onInvalidClick?.(cell.coord);
                        }
                      }}
                      onTap={() => {
                        // Only fire if the touch didn't move (i.e. it was a tap, not a pan)
                        if (!touchMoved.current) {
                          if (editable) { onEditCellClick?.(cell.coord); return; }
                          if (isValid) onCellClick(cell.coord);
                          else onInvalidClick?.(cell.coord);
                        }
                      }}
                      onMouseEnter={() => {
                        if (editable) { setHoveredCell(cell.coord); return; }
                        if (isValid) {
                          setHoveredCell(cell.coord);
                          onCellSelect(cell.coord);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCell(null);
                        onCellSelect(null);
                      }}
                      onFocus={() => setFocusedHex(cell.coord)}
                      onKeyDown={e => handleKeyDown(e, cell.coord)}
                      cellRef={el => {
                        if (el) {
                          cellRefs.current.set(key, el);
                        } else {
                          cellRefs.current.delete(key);
                        }
                      }}
                    />
                  );
                })}
              </g>
            ))}
          </g>
          </g>{/* end grain-overlay container */}
        </svg>
      </div>
    </div>
  );
});

HexGrid.displayName = 'HexGrid';

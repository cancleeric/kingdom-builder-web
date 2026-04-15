import React, { useState, useRef, useCallback } from 'react';
import { Board } from '../../core/board';
import { AxialCoord, hexEquals, HEX_SIZE } from '../../core/hex';
import { HexCell } from './HexCell';
import { Player } from '../../types';
import { useBoardTransform } from '../../hooks/useBoardTransform';
import { useTranslation } from 'react-i18next';

interface HexGridProps {
  board: Board;
  validPlacements: AxialCoord[];
  selectedCell: AxialCoord | null;
  players: Player[];
  onCellClick: (coord: AxialCoord) => void;
  onCellSelect: (coord: AxialCoord | null) => void;
  onEscape?: () => void;
}

export const HexGrid: React.FC<HexGridProps> = React.memo(({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
  onEscape,
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

  const cells = board.getAllCells();

  // Calculate SVG dimensions
  const padding = HEX_SIZE * 2;
  const width = board.width * HEX_SIZE * Math.sqrt(3) + padding * 2;
  const height = board.height * HEX_SIZE * 1.5 + padding * 2;
  const viewBoxWidth = width;
  const viewBoxHeight = height;

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

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden relative select-none"
      ref={containerRef}
      role="grid"
      aria-label={t('board.gridLabel')}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={(e) => {
        handleTouchStartCapture(e);
        onTouchStart(e);
      }}
      onTouchMove={(e) => {
        handleTouchMoveCapture(e);
        onTouchMove(e);
      }}
      onTouchEnd={onTouchEnd}
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      {/* Zoom reset button */}
      <button
        className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white border border-gray-300 rounded-full w-9 h-9 text-sm font-bold shadow flex items-center justify-center"
        onClick={reset}
        title={t('board.resetZoomTitle')}
        aria-label={t('board.resetZoomAria')}
      >
        ⌖
      </button>

      {/* Zoom level badge */}
      <div className="absolute bottom-2 right-2 z-10 bg-white/70 text-xs text-gray-600 rounded px-2 py-0.5 pointer-events-none">
        {Math.round(transform.scale * 100)}%
      </div>

      <div
        style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <svg
          width={viewBoxWidth}
          height={viewBoxHeight}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          role="none"
        >
          <g transform={`translate(${padding + width / 2 - board.width * HEX_SIZE}, ${padding + height / 2 - board.height * HEX_SIZE})`}>
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

                  return (
                    <HexCell
                      key={key}
                      cell={cell}
                      isValid={isValid}
                      isSelected={isSelected}
                      isHovered={isHovered}
                      playerColor={playerColor}
                      playerName={playerName}
                      tabIndex={isEntry ? 0 : -1}
                      onClick={() => {
                        if (isValid) {
                          onCellClick(cell.coord);
                        }
                      }}
                      onTap={() => {
                        // Only fire if the touch didn't move (i.e. it was a tap, not a pan)
                        if (!touchMoved.current && isValid) {
                          onCellClick(cell.coord);
                        }
                      }}
                      onMouseEnter={() => {
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
        </svg>
      </div>
    </div>
  );
});

HexGrid.displayName = 'HexGrid';

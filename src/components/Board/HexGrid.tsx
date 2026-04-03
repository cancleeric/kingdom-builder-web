import React, { useState, useRef } from 'react';
import { Board } from '../../core/board';
import { AxialCoord, hexEquals, HEX_SIZE } from '../../core/hex';
import { HexCell } from './HexCell';
import { Player } from '../../types';
import { useBoardTransform } from '../../hooks/useBoardTransform';

interface HexGridProps {
  board: Board;
  validPlacements: AxialCoord[];
  selectedCell: AxialCoord | null;
  players: Player[];
  onCellClick: (coord: AxialCoord) => void;
  onCellSelect: (coord: AxialCoord | null) => void;
}

export const HexGrid: React.FC<HexGridProps> = ({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
}) => {
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

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden relative select-none"
      ref={containerRef}
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
        title="Reset zoom"
        aria-label="Reset board zoom"
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
        >
          <g transform={`translate(${padding + width / 2 - board.width * HEX_SIZE}, ${padding + height / 2 - board.height * HEX_SIZE})`}>
            {cells.map(cell => {
              const isValid = validPlacements.some(
                valid => hexEquals(valid, cell.coord)
              );
              const isSelected = selectedCell !== null && hexEquals(selectedCell, cell.coord);
              const isHovered = hoveredCell !== null && hexEquals(hoveredCell, cell.coord);

              // Find player color if settlement exists
              let playerColor: string | undefined;
              if (cell.settlement !== undefined) {
                const player = players.find(p => p.id === cell.settlement);
                playerColor = player?.color;
              }

              return (
                <HexCell
                  key={`${cell.coord.q},${cell.coord.r}`}
                  cell={cell}
                  isValid={isValid}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  playerColor={playerColor}
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
                />
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

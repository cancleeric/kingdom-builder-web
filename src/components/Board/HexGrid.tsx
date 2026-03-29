import React, { useState, useMemo, useCallback } from 'react';
import { Board } from '../../core/board';
import { AxialCoord, hexEquals, HEX_SIZE } from '../../core/hex';
import { HexCell } from './HexCell';
import { Player } from '../../types';

interface HexGridProps {
  board: Board;
  validPlacements: AxialCoord[];
  selectedCell: AxialCoord | null;
  players: Player[];
  onCellClick: (coord: AxialCoord) => void;
  onCellSelect: (coord: AxialCoord | null) => void;
}

export const HexGrid: React.FC<HexGridProps> = React.memo(({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
}) => {
  const [hoveredCell, setHoveredCell] = useState<AxialCoord | null>(null);

  const cells = useMemo(() => board.getAllCells(), [board]);

  // Calculate SVG dimensions
  const padding = HEX_SIZE * 2;
  const boardWidth = board.width;
  const boardHeight = board.height;

  const width = useMemo(
    () => boardWidth * HEX_SIZE * Math.sqrt(3) + padding * 2,
    [boardWidth, padding],
  );
  const height = useMemo(
    () => boardHeight * HEX_SIZE * 1.5 + padding * 2,
    [boardHeight, padding],
  );

  const viewBox = useMemo(() => `0 0 ${width} ${height}`, [width, height]);

  const transform = useMemo(
    () =>
      `translate(${padding + width / 2 - boardWidth * HEX_SIZE}, ${
        padding + height / 2 - boardHeight * HEX_SIZE
      })`,
    [padding, width, height, boardWidth, boardHeight],
  );

  // Build a Set of valid placement keys for O(1) lookup
  const validSet = useMemo(
    () => new Set(validPlacements.map(v => `${v.q},${v.r}`)),
    [validPlacements],
  );

  // Build a map from playerId -> color for O(1) lookup
  const playerColorMap = useMemo(
    () => new Map(players.map(p => [p.id, p.color])),
    [players],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    onCellSelect(null);
  }, [onCellSelect]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="max-w-full max-h-full"
      >
        <g transform={transform}>
          {cells.map(cell => {
            const key = `${cell.coord.q},${cell.coord.r}`;
            const isValid = validSet.has(key);
            const isSelected = selectedCell !== null && hexEquals(selectedCell, cell.coord);
            const isHovered = hoveredCell !== null && hexEquals(hoveredCell, cell.coord);
            const playerColor =
              cell.settlement !== undefined
                ? playerColorMap.get(cell.settlement)
                : undefined;

            return (
              <HexCell
                key={key}
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
                onMouseEnter={() => {
                  if (isValid) {
                    setHoveredCell(cell.coord);
                    onCellSelect(cell.coord);
                  }
                }}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
});

HexGrid.displayName = 'HexGrid';

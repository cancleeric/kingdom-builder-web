import React, { useState } from 'react';
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

export const HexGrid: React.FC<HexGridProps> = ({
  board,
  validPlacements,
  selectedCell,
  players,
  onCellClick,
  onCellSelect,
}) => {
  const [hoveredCell, setHoveredCell] = useState<AxialCoord | null>(null);
  
  const cells = board.getAllCells();
  
  // Calculate SVG dimensions
  const padding = HEX_SIZE * 2;
  const width = board.width * HEX_SIZE * Math.sqrt(3) + padding * 2;
  const height = board.height * HEX_SIZE * 1.5 + padding * 2;
  
  const viewBoxWidth = width;
  const viewBoxHeight = height;

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="max-w-full max-h-full"
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
  );
};

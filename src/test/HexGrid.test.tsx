import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { HexGrid } from '../components/Board/HexGrid';
import { createDefaultBoard } from '../core/board';

const buildProps = (overrides = {}) => {
  const board = createDefaultBoard();
  const players = [
    { id: 1, name: 'Player 1', color: '#FF0000', settlements: [], remainingSettlements: 40 },
  ];
  return {
    board,
    validPlacements: [],
    selectedCell: null,
    players,
    onCellClick: () => {},
    onCellSelect: () => {},
    ...overrides,
  };
};

describe('HexGrid (memoised)', () => {
  it('renders an SVG element', () => {
    const { container } = render(<HexGrid {...buildProps()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('highlights valid placement cells', () => {
    const board = createDefaultBoard();
    const firstCell = board.getAllCells()[0];
    const props = buildProps({
      board,
      validPlacements: [firstCell.coord],
    });
    const { container } = render(<HexGrid {...props} />);
    // There should be at least one green-stroked polygon
    const polygons = container.querySelectorAll('polygon');
    const highlighted = Array.from(polygons).some(
      p => p.getAttribute('stroke') === '#00FF00',
    );
    expect(highlighted).toBe(true);
  });

  it('calls onCellClick when a valid cell is clicked', () => {
    const board = createDefaultBoard();
    const firstCell = board.getAllCells()[0];
    let clicked: { q: number; r: number } | null = null;
    const props = buildProps({
      board,
      validPlacements: [firstCell.coord],
      onCellClick: (coord: { q: number; r: number }) => { clicked = coord; },
    });
    const { container } = render(<HexGrid {...props} />);
    // Click the first <g> element (HexCell)
    const groups = container.querySelectorAll('g > g');
    if (groups.length > 0) {
      fireEvent.click(groups[0]);
    }
    expect(clicked).not.toBeNull();
  });
});

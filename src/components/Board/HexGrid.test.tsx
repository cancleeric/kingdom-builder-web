import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HexGrid } from './HexGrid';
import { createDefaultBoard } from '../../core/board';
import { AxialCoord } from '../../core/hex';
import { Player } from '../../types';

const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'Player 1',
    color: '#FF6B6B',
    settlements: [],
    remainingSettlements: 40,
  },
  {
    id: 2,
    name: 'Player 2',
    color: '#4ECDC4',
    settlements: [],
    remainingSettlements: 40,
  },
];

function makeProps(overrides?: {
  validPlacements?: AxialCoord[];
  selectedCell?: AxialCoord | null;
  onCellClick?: (c: AxialCoord) => void;
  onCellSelect?: (c: AxialCoord | null) => void;
  onEscape?: () => void;
}) {
  return {
    board: createDefaultBoard(),
    validPlacements: overrides?.validPlacements ?? [],
    selectedCell: overrides?.selectedCell ?? null,
    players: mockPlayers,
    onCellClick: overrides?.onCellClick ?? vi.fn(),
    onCellSelect: overrides?.onCellSelect ?? vi.fn(),
    onEscape: overrides?.onEscape,
  };
}

describe('HexGrid – ARIA structure', () => {
  it('renders a container with role="grid"', () => {
    render(<HexGrid {...makeProps()} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders hex cells with role="gridcell"', () => {
    render(<HexGrid {...makeProps()} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders row groups with role="row"', () => {
    render(<HexGrid {...makeProps()} />);
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('cells have descriptive aria-label', () => {
    render(<HexGrid {...makeProps()} />);
    const cells = screen.getAllByRole('gridcell');
    // Each cell should have an aria-label mentioning Q/R coordinates
    cells.forEach(cell => {
      expect(cell).toHaveAttribute('aria-label');
      expect(cell.getAttribute('aria-label')).toMatch(/Q-?\d+ R-?\d+/);
    });
  });

  it('valid placement cells have aria-disabled="false"', () => {
    const board = createDefaultBoard();
    const cells = board.getAllCells();
    const validPlacements = [cells[0].coord];
    render(<HexGrid {...makeProps({ validPlacements })} />);
    const validCells = screen
      .getAllByRole('gridcell')
      .filter(el => el.getAttribute('aria-disabled') === 'false');
    expect(validCells.length).toBeGreaterThanOrEqual(1);
  });

  it('invalid cells have aria-disabled="true"', () => {
    render(<HexGrid {...makeProps({ validPlacements: [] })} />);
    const disabledCells = screen
      .getAllByRole('gridcell')
      .filter(el => el.getAttribute('aria-disabled') === 'true');
    expect(disabledCells.length).toBeGreaterThan(0);
  });

  it('valid cells mention "valid placement" in their aria-label', () => {
    const board = createDefaultBoard();
    const firstCell = board.getAllCells()[0];
    render(<HexGrid {...makeProps({ validPlacements: [firstCell.coord] })} />);
    const label = `Q${firstCell.coord.q} R${firstCell.coord.r}`;
    const el = screen.getAllByRole('gridcell').find(c =>
      c.getAttribute('aria-label')?.startsWith(label),
    );
    expect(el).toBeDefined();
    expect(el!.getAttribute('aria-label')).toContain('valid placement');
  });
});

describe('HexGrid – keyboard navigation', () => {
  beforeEach(() => {
    // jsdom does not implement focus() on SVGGElement by default;
    // we patch HTMLElement.prototype.focus to avoid errors.
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});
  });

  it('Enter key on a valid cell triggers onCellClick', () => {
    const board = createDefaultBoard();
    const target = board.getAllCells()[0].coord;
    const onCellClick = vi.fn();
    render(
      <HexGrid
        {...makeProps({ validPlacements: [target], onCellClick })}
      />,
    );
    // Find the cell matching that coordinate
    const label = `Q${target.q} R${target.r}`;
    const cell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(label))!;

    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(onCellClick).toHaveBeenCalledWith(target);
  });

  it('Space key on a valid cell triggers onCellClick', () => {
    const board = createDefaultBoard();
    const target = board.getAllCells()[0].coord;
    const onCellClick = vi.fn();
    render(
      <HexGrid
        {...makeProps({ validPlacements: [target], onCellClick })}
      />,
    );
    const label = `Q${target.q} R${target.r}`;
    const cell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(label))!;

    fireEvent.keyDown(cell, { key: ' ' });
    expect(onCellClick).toHaveBeenCalledWith(target);
  });

  it('Enter key on an invalid cell does NOT trigger onCellClick', () => {
    const board = createDefaultBoard();
    const target = board.getAllCells()[0].coord;
    const onCellClick = vi.fn();
    render(
      <HexGrid
        {...makeProps({ validPlacements: [], onCellClick })}
      />,
    );
    const label = `Q${target.q} R${target.r}`;
    const cell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(label))!;

    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('Escape key calls onEscape', () => {
    const onEscape = vi.fn();
    const board = createDefaultBoard();
    const firstCoord = board.getAllCells()[0].coord;
    render(<HexGrid {...makeProps({ onEscape })} />);
    const label = `Q${firstCoord.q} R${firstCoord.r}`;
    const cell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(label))!;

    fireEvent.keyDown(cell, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalled();
  });

  it('Escape key does not throw when onEscape is not provided', () => {
    const board = createDefaultBoard();
    const firstCoord = board.getAllCells()[0].coord;
    render(<HexGrid {...makeProps()} />);
    const label = `Q${firstCoord.q} R${firstCoord.r}`;
    const cell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(label))!;

    expect(() => fireEvent.keyDown(cell, { key: 'Escape' })).not.toThrow();
  });

  it('ArrowRight key moves focus to eastern neighbor', () => {
    const board = createDefaultBoard();
    const origin = board.getAllCells()[0].coord;
    const eastCoord: AxialCoord = { q: origin.q + 1, r: origin.r };
    // Only run if the eastern neighbor exists on the board
    if (!board.getCell(eastCoord)) return;

    const focusSpy = vi.fn();
    // Spy on the neighbor element's focus once it is set via ref
    render(<HexGrid {...makeProps()} />);
    const originLabel = `Q${origin.q} R${origin.r}`;
    const originCell = screen
      .getAllByRole('gridcell')
      .find(el => el.getAttribute('aria-label')?.startsWith(originLabel))!;

    // Patch focus on all gridcells
    screen.getAllByRole('gridcell').forEach(el => {
      // jsdom returns HTMLElement for SVG elements; casting through unknown is safe here
      (el as unknown as SVGGElement).focus = focusSpy;
    });

    fireEvent.keyDown(originCell, { key: 'ArrowRight' });
    // focus() should have been called (on the neighbor cell)
    expect(focusSpy).toHaveBeenCalled();
  });
});

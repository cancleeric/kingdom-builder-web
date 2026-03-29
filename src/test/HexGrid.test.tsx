import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HexGrid } from '../components/Board/HexGrid';
import type { HexCell } from '../types';

// Helper: build a minimal cell list
function makeCell(q: number, r: number, terrain: HexCell['terrain'] = 'grass'): HexCell {
  return {
    coord: { q, r },
    terrain,
    hasSettlement: false,
    isLocation: false,
    isHighlighted: true,
  };
}

describe('HexGrid touch event handler logic', () => {
  let cells: HexCell[];

  beforeEach(() => {
    cells = [makeCell(0, 0), makeCell(1, 0), makeCell(0, 1)];
    // Mock sessionStorage
    vi.spyOn(window, 'sessionStorage', 'get').mockReturnValue({
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<HexGrid cells={cells} />);
    expect(screen.getByLabelText('六角格棋盤')).toBeInTheDocument();
  });

  it('renders SVG board with cells', () => {
    render(<HexGrid cells={cells} />);
    const svg = screen.getByRole('img', { name: '棋盤格' });
    expect(svg).toBeInTheDocument();
    // Each cell has role="button"
    const hexButtons = screen.getAllByRole('button');
    // 3 hex cells + 3 zoom control buttons = 6
    expect(hexButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows zoom percentage indicator', () => {
    render(<HexGrid cells={cells} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom-in button increases zoom', async () => {
    render(<HexGrid cells={cells} />);
    const zoomIn = screen.getByLabelText('放大');
    await act(async () => {
      fireEvent.click(zoomIn);
    });
    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('zoom-out button decreases zoom', async () => {
    render(<HexGrid cells={cells} />);
    const zoomOut = screen.getByLabelText('縮小');
    await act(async () => {
      fireEvent.click(zoomOut);
    });
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('reset button restores zoom to 100%', async () => {
    render(<HexGrid cells={cells} />);
    const zoomIn = screen.getByLabelText('放大');
    await act(async () => {
      fireEvent.click(zoomIn);
      fireEvent.click(zoomIn);
    });
    expect(screen.getByText('120%')).toBeInTheDocument();

    const resetBtn = screen.getByLabelText('重置縮放');
    await act(async () => {
      fireEvent.click(resetBtn);
    });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom is clamped to min 50%', async () => {
    render(<HexGrid cells={cells} />);
    const zoomOut = screen.getByLabelText('縮小');
    // Click 10 times to try to go below 50%
    for (let i = 0; i < 10; i++) {
      await act(async () => { fireEvent.click(zoomOut); });
    }
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('zoom is clamped to max 150%', async () => {
    render(<HexGrid cells={cells} />);
    const zoomIn = screen.getByLabelText('放大');
    // Click 10 times to try to exceed 150%
    for (let i = 0; i < 10; i++) {
      await act(async () => { fireEvent.click(zoomIn); });
    }
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('saves zoom to sessionStorage on change', async () => {
    const setItem = vi.fn();
    vi.spyOn(window, 'sessionStorage', 'get').mockReturnValue({
      getItem: vi.fn().mockReturnValue(null),
      setItem,
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    });

    render(<HexGrid cells={cells} />);
    const zoomIn = screen.getByLabelText('放大');
    await act(async () => { fireEvent.click(zoomIn); });

    expect(setItem).toHaveBeenCalledWith('hex-grid-zoom', '1.1');
  });

  it('calls onCellClick when a hex cell is clicked', async () => {
    const onCellClick = vi.fn();
    const { container } = render(<HexGrid cells={cells} onCellClick={onCellClick} />);

    // Get the first hex group element
    const hexGroup = container.querySelector('[data-hex-key="0,0"]');
    expect(hexGroup).not.toBeNull();

    await act(async () => {
      fireEvent.click(hexGroup!);
    });

    expect(onCellClick).toHaveBeenCalledWith({ q: 0, r: 0 });
  });

  it('renders settlement circle when cell hasSettlement', () => {
    const cellWithSettlement: HexCell = {
      ...makeCell(0, 0),
      hasSettlement: true,
      settlementColor: '#e53935',
    };
    const { container } = render(<HexGrid cells={[cellWithSettlement]} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders location star for location cells', () => {
    const locationCell: HexCell = {
      ...makeCell(0, 0, 'location'),
      isLocation: true,
    };
    const { container } = render(<HexGrid cells={[locationCell]} />);
    const starText = container.querySelector('text');
    expect(starText?.textContent).toBe('★');
  });

  it('displays cell terrain label in aria-label', () => {
    render(<HexGrid cells={[makeCell(0, 0, 'forest')]} />);
    const hexGroup = screen.getByRole('button', { name: /森林/ });
    expect(hexGroup).toBeInTheDocument();
  });
});

describe('HexGrid pinch-to-zoom logic', () => {
  it('handles two-finger touch start and move', async () => {
    const cells = [makeCell(0, 0)];
    const { container } = render(<HexGrid cells={cells} />);
    const board = container.querySelector('[aria-label="六角格棋盤"]')!;

    const touch1 = { clientX: 100, clientY: 100, identifier: 1 } as Touch;
    const touch2 = { clientX: 200, clientY: 100, identifier: 2 } as Touch;

    // Two-finger touch start
    await act(async () => {
      fireEvent.touchStart(board, {
        touches: [touch1, touch2],
        changedTouches: [touch1, touch2],
      });
    });

    // Move fingers apart (increase distance)
    const touch1moved = { clientX: 50, clientY: 100, identifier: 1 } as Touch;
    const touch2moved = { clientX: 250, clientY: 100, identifier: 2 } as Touch;

    await act(async () => {
      fireEvent.touchMove(board, {
        touches: [touch1moved, touch2moved],
        changedTouches: [touch1moved, touch2moved],
      });
    });

    // Zoom should have increased (distance went from 100 to 200, ratio = 2x)
    // Clamped to max 150%
    expect(
      screen.getByText((_, el) => el?.textContent?.replace(/\s/g, '') === '150%')
    ).toBeInTheDocument();
  });
});

describe('HexGrid double-tap to reset zoom', () => {
  beforeEach(() => {
    // Clear sessionStorage so zoom starts at 1.0
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets zoom on double tap', async () => {
    vi.useFakeTimers();
    const cells = [makeCell(0, 0)];
    const { container } = render(<HexGrid cells={cells} />);
    const board = container.querySelector('[aria-label="六角格棋盤"]')!;

    // First zoom in via button
    const zoomIn = screen.getByLabelText('放大');
    await act(async () => { fireEvent.click(zoomIn); });
    // Zoom should be 110%
    expect(
      screen.getByText((_, el) => el?.textContent?.replace(/\s/g, '') === '110%')
    ).toBeInTheDocument();

    // Double tap (two taps within 300ms)
    const touch = { clientX: 150, clientY: 150, identifier: 0 } as Touch;

    await act(async () => {
      fireEvent.touchStart(board, { touches: [touch], changedTouches: [touch] });
      fireEvent.touchEnd(board, { touches: [], changedTouches: [touch] });
    });

    // Second tap within 300ms
    vi.advanceTimersByTime(200);
    await act(async () => {
      fireEvent.touchStart(board, { touches: [touch], changedTouches: [touch] });
      fireEvent.touchEnd(board, { touches: [], changedTouches: [touch] });
    });

    expect(
      screen.getByText((_, el) => el?.textContent?.replace(/\s/g, '') === '100%')
    ).toBeInTheDocument();
  });
});

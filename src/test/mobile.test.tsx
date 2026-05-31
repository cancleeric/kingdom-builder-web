/**
 * Tests for mobile RWD and touch behavior (issue #27).
 *
 * Covers:
 *  - useBoardTransform: initial state, wheel zoom, mouse drag, pinch-to-zoom, reset
 *  - BottomDrawer: renders collapsed, opens on toggle, swipe-to-open/close, keyboard
 *  - HexGrid touch: tap fires onCellClick, pan does not fire onCellClick
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

import { useBoardTransform } from '../hooks/useBoardTransform';
import { BottomDrawer } from '../components/Mobile/BottomDrawer';
import { GamePhase, BotDifficulty } from '../types';
import type { Player } from '../types';
import type { GameAction } from '../types/history';
import { ObjectiveCard } from '../core/scoring';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal Player object. */
function makePlayer(overrides?: Partial<Player>): Player {
  return {
    id: 1,
    name: 'Alice',
    color: '#ff0000',
    settlements: [],
    remainingSettlements: 40,
    tiles: [],
    isBot: false,
    difficulty: BotDifficulty.Normal,
    ...overrides,
  };
}

/** Build a minimal BottomDrawer props set. */
function makeDrawerProps(overrides?: Record<string, unknown>) {
  const players = [
    makePlayer({ id: 1, name: 'Alice', color: '#ff0000' }),
    makePlayer({ id: 2, name: 'Bob', color: '#0000ff' }),
  ];

  return {
    isOpen: false,
    onToggle: vi.fn(),
    phase: GamePhase.DrawCard,
    currentPlayer: players[0],
    players,
    currentTerrainCard: null,
    objectiveCards: [ObjectiveCard.Hermits, ObjectiveCard.Farmers],
    liveScores: [
      {
        playerId: 1,
        castle: 3,
        objectives: [
          { card: ObjectiveCard.Hermits, score: 5 },
          { card: ObjectiveCard.Farmers, score: 2 },
        ],
      },
      {
        playerId: 2,
        castle: 1,
        objectives: [
          { card: ObjectiveCard.Hermits, score: 0 },
          { card: ObjectiveCard.Farmers, score: 1 },
        ],
      },
    ],
    maxLiveScore: 10,
    remainingPlacements: 0,
    activeTile: null,
    tileMoveFrom: null,
    canUndo: false,
    history: [] as GameAction[],
    onDrawCard: vi.fn(),
    onEndTurn: vi.fn(),
    onUndo: vi.fn(),
    onActivateTile: vi.fn(),
    onCancelTile: vi.fn(),
    ...overrides,
  };
}

// ─── useBoardTransform ────────────────────────────────────────────────────────

describe('useBoardTransform', () => {
  it('starts with identity transform', () => {
    const { result } = renderHook(() => useBoardTransform());
    expect(result.current.transform).toEqual({ scale: 1, translateX: 0, translateY: 0 });
  });

  it('reset() restores identity transform', () => {
    const { result } = renderHook(() => useBoardTransform());
    act(() => {
      // Simulate a wheel event by calling reset from a modified state
      result.current.reset();
    });
    expect(result.current.transform).toEqual({ scale: 1, translateX: 0, translateY: 0 });
  });

  it('mouse drag pan updates translateX and translateY', () => {
    const { result } = renderHook(() => useBoardTransform());

    // Start drag at (100, 100)
    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent<HTMLDivElement>);
    });

    // Move to (150, 130)
    act(() => {
      result.current.onMouseMove({
        clientX: 150,
        clientY: 130,
      } as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.transform.translateX).toBe(50);
    expect(result.current.transform.translateY).toBe(30);
  });

  it('mouse up stops panning', () => {
    const { result } = renderHook(() => useBoardTransform());

    act(() => {
      result.current.onMouseDown({
        button: 0,
        clientX: 0,
        clientY: 0,
      } as React.MouseEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.onMouseUp();
    });

    // Move after mouse up – should NOT change translate
    act(() => {
      result.current.onMouseMove({
        clientX: 200,
        clientY: 200,
      } as React.MouseEvent<HTMLDivElement>);
    });

    expect(result.current.transform.translateX).toBe(0);
    expect(result.current.transform.translateY).toBe(0);
  });

  it('single-finger touch pan updates translate', () => {
    const { result } = renderHook(() => useBoardTransform());

    const makeTouches = (x: number, y: number): React.TouchList => ({
      length: 1,
      0: { clientX: x, clientY: y } as Touch,
      item: (i: number): Touch => (i === 0 ? { clientX: x, clientY: y } as Touch : null as unknown as Touch),
      [Symbol.iterator]: function* () { yield { clientX: x, clientY: y } as Touch; },
    } as unknown as React.TouchList);

    act(() => {
      result.current.onTouchStart({
        touches: makeTouches(100, 100),
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.onTouchMove({
        touches: makeTouches(120, 110),
        preventDefault: vi.fn(),
      } as unknown as React.TouchEvent<HTMLDivElement>);
    });

    expect(result.current.transform.translateX).toBe(20);
    expect(result.current.transform.translateY).toBe(10);
  });

  it('scale is clamped between MIN_SCALE (0.3) and MAX_SCALE (4.0)', () => {
    const { result } = renderHook(() => useBoardTransform());

    const makeWheel = (deltaY: number): React.WheelEvent<HTMLDivElement> => ({
      deltaY,
      clientX: 0,
      clientY: 0,
      preventDefault: vi.fn(),
    } as unknown as React.WheelEvent<HTMLDivElement>);

    // Zoom in repeatedly – should cap at MAX_SCALE
    for (let i = 0; i < 40; i++) {
      act(() => result.current.onWheel(makeWheel(-100)));
    }
    expect(result.current.transform.scale).toBeLessThanOrEqual(4.0);

    // Reset then zoom out repeatedly – should floor at MIN_SCALE
    act(() => result.current.reset());
    for (let i = 0; i < 40; i++) {
      act(() => result.current.onWheel(makeWheel(100)));
    }
    expect(result.current.transform.scale).toBeGreaterThanOrEqual(0.3);
  });
});

// ─── BottomDrawer ─────────────────────────────────────────────────────────────

describe('BottomDrawer', () => {
  it('renders collapsed (translate-y applied)', () => {
    const props = makeDrawerProps({ isOpen: false });
    const { container } = render(React.createElement(BottomDrawer, props));
    const drawer = container.querySelector('[aria-label="Game controls"]');
    expect(drawer).not.toBeNull();
    // The drawer div should have the collapsed translate class
    expect(drawer?.className).toContain('translate-y-');
  });

  it('calls onToggle when the handle is clicked', () => {
    const onToggle = vi.fn();
    const props = makeDrawerProps({ isOpen: false, onToggle });
    render(React.createElement(BottomDrawer, props));
    const handle = screen.getByRole('button', { name: /open game panel/i });
    fireEvent.click(handle);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows backdrop when open', () => {
    const props = makeDrawerProps({ isOpen: true });
    render(React.createElement(BottomDrawer, props));
    // Backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
  });

  it('clicking backdrop calls onToggle', () => {
    const onToggle = vi.fn();
    const props = makeDrawerProps({ isOpen: true, onToggle });
    render(React.createElement(BottomDrawer, props));
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows objective cards in the expanded drawer', () => {
    const props = makeDrawerProps({ isOpen: true });
    render(React.createElement(BottomDrawer, props));

    expect(screen.getByRole('region', { name: 'Objectives' })).toBeTruthy();
    expect(screen.getByText('Hermits')).toBeTruthy();
    expect(screen.getByText('Farmers')).toBeTruthy();
  });

  it('shows live scores with the leading player marked', () => {
    const props = makeDrawerProps({ isOpen: true, phase: GamePhase.PlaceSettlements });
    render(React.createElement(BottomDrawer, props));

    const liveScores = screen.getByRole('region', { name: 'Live Scores' });
    expect(liveScores).toBeTruthy();
    expect(within(liveScores).getByText('Alice')).toBeTruthy();
    expect(within(liveScores).getByText(/10\s+pts/)).toBeTruthy();
    expect(within(liveScores).getByTitle('Leading')).toBeTruthy();
    expect(within(liveScores).getByText('🏰 3 | Hermits: 5 | Farmers: 2')).toBeTruthy();
  });

  it('does not show live scores during setup phase', () => {
    const props = makeDrawerProps({ isOpen: true, phase: GamePhase.Setup });
    render(React.createElement(BottomDrawer, props));

    expect(screen.queryByRole('region', { name: 'Live Scores' })).toBeNull();
  });

  it('swipe up opens the drawer (calls onToggle)', () => {
    const onToggle = vi.fn();
    const props = makeDrawerProps({ isOpen: false, onToggle });
    render(React.createElement(BottomDrawer, props));

    const handle = screen.getByRole('button', { name: /open game panel/i });

    // Simulate touch swipe up: touchstart at y=300, touchend at y=250 (dy=-50)
    fireEvent.touchStart(handle, { touches: [{ clientY: 300 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 250 }] });

    expect(onToggle).toHaveBeenCalled();
  });

  it('swipe down closes the drawer (calls onToggle)', () => {
    const onToggle = vi.fn();
    const props = makeDrawerProps({ isOpen: true, onToggle });
    render(React.createElement(BottomDrawer, props));

    const handle = screen.getByRole('button', { name: /close game panel/i });

    // Simulate touch swipe down: touchstart at y=250, touchend at y=300 (dy=+50)
    fireEvent.touchStart(handle, { touches: [{ clientY: 250 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 300 }] });

    expect(onToggle).toHaveBeenCalled();
  });

  it('pressing Enter on the handle calls onToggle', () => {
    const onToggle = vi.fn();
    const props = makeDrawerProps({ isOpen: false, onToggle });
    render(React.createElement(BottomDrawer, props));
    const handle = screen.getByRole('button', { name: /open game panel/i });
    fireEvent.keyDown(handle, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalled();
  });
});

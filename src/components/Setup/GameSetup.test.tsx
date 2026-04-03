import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameSetup } from './GameSetup';
import { OFFICIAL_COLORS, DEFAULT_PLAYER_NAMES, SETUP_STORAGE_KEY } from '../../types/setup';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('GameSetup', () => {
  const onStart = vi.fn();

  beforeEach(() => {
    localStorageMock.clear();
    onStart.mockReset();
  });

  it('renders player count buttons 2, 3, 4', () => {
    render(<GameSetup onStart={onStart} />);
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
  });

  it('shows 2 player rows by default', () => {
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('shows 3 player rows when 3 is selected', () => {
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
  });

  it('shows 4 player rows when 4 is selected', () => {
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('default player names match DEFAULT_PLAYER_NAMES', () => {
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
    expect(inputs[0].value).toBe(DEFAULT_PLAYER_NAMES[0]);
    expect(inputs[1].value).toBe(DEFAULT_PLAYER_NAMES[1]);
  });

  it('start button is enabled when all names are filled', () => {
    render(<GameSetup onStart={onStart} />);
    expect(screen.getByRole('button', { name: '開始遊戲' })).not.toBeDisabled();
  });

  it('start button is disabled when a name is cleared', () => {
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '' } });
    expect(screen.getByRole('button', { name: '開始遊戲' })).toBeDisabled();
  });

  it('calls onStart with correct player configs when started', () => {
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Alice' } });
    fireEvent.change(inputs[1], { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    const [players] = onStart.mock.calls[0];
    expect(players).toHaveLength(2);
    expect(players[0].name).toBe('Alice');
    expect(players[1].name).toBe('Bob');
  });

  it('saves config to localStorage on start', () => {
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
    const raw = localStorageMock.getItem(SETUP_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw!);
    expect(saved.playerCount).toBe(2);
    expect(saved.players).toHaveLength(2);
  });

  it('loads saved config from localStorage on mount', () => {
    const saved = {
      playerCount: 3,
      players: [
        { id: 1, name: 'Alice', color: OFFICIAL_COLORS[0].value },
        { id: 2, name: 'Bob',   color: OFFICIAL_COLORS[1].value },
        { id: 3, name: 'Carol', color: OFFICIAL_COLORS[2].value },
      ],
    };
    localStorageMock.setItem(SETUP_STORAGE_KEY, JSON.stringify(saved));
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole<HTMLInputElement>('textbox');
    expect(inputs).toHaveLength(3);
    expect(inputs[0].value).toBe('Alice');
    expect(inputs[1].value).toBe('Bob');
    expect(inputs[2].value).toBe('Carol');
  });

  it('color swatches: already-selected color is disabled for other players', () => {
    render(<GameSetup onStart={onStart} />);
    // Player 1 has OFFICIAL_COLORS[0] by default; its swatch for player 2 should be disabled
    const colorLabel = OFFICIAL_COLORS[0].label;
    const swatches = screen.getAllByRole('button', { name: colorLabel });
    // The swatch belonging to player 2 (index 1) should be disabled
    const disabledSwatch = swatches.find((btn) => btn.hasAttribute('disabled'));
    expect(disabledSwatch).toBeDefined();
  });

  it('enforces max length of 12 characters for player names', () => {
    render(<GameSetup onStart={onStart} />);
    const input = screen.getAllByRole<HTMLInputElement>('textbox')[0];
    fireEvent.change(input, { target: { value: 'A'.repeat(20) } });
    expect(input.value.length).toBeLessThanOrEqual(12);
  });

  it('player 1 receives the correct color from onStart', () => {
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
    const [players] = onStart.mock.calls[0];
    expect(players[0].color).toBe(OFFICIAL_COLORS[0].value);
  });
});

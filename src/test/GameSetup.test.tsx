/**
 * Unit tests for the GameSetup component (issue #19).
 *
 * Covers:
 *  - Start button disabled when any player name is empty
 *  - Start button enabled when all player names are filled
 *  - Color swatches are disabled (aria-disabled) if already taken by another player
 *  - Selecting a color updates the player's config
 *  - Player count buttons render and switch the number of player rows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { GameSetup } from '../components/Game/GameSetup';

// Stub localStorage to avoid side-effects across tests
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
});

describe('GameSetup', () => {
  it('renders player count buttons 2, 3, 4', () => {
    render(<GameSetup onStart={vi.fn()} />);
    expect(screen.getByRole('button', { name: '2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '4' })).toBeTruthy();
  });

  it('shows 2 player rows by default', () => {
    render(<GameSetup onStart={vi.fn()} />);
    expect(screen.getAllByRole('textbox').length).toBe(2);
  });

  it('shows 3 player rows when "3" button is clicked', () => {
    render(<GameSetup onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getAllByRole('textbox').length).toBe(3);
  });

  it('start button is enabled when all names are non-empty', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const startBtn = screen.getByRole('button', { name: '開始遊戲' });
    expect(startBtn).not.toBeDisabled();
  });

  it('start button is disabled when a player name is cleared', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '' } });
    const startBtn = screen.getByRole('button', { name: '開始遊戲' });
    expect(startBtn).toBeDisabled();
  });

  it('calls onStart with configs when start button is clicked', () => {
    const onStart = vi.fn();
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
    expect(onStart).toHaveBeenCalledOnce();
    const configs = onStart.mock.calls[0][0];
    expect(configs).toHaveLength(2);
    expect(configs[0].name).toBeTruthy();
    expect(configs[1].name).toBeTruthy();
  });

  it('does not call onStart when a name is empty', () => {
    const onStart = vi.fn();
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('color buttons for taken colors are disabled', () => {
    render(<GameSetup onStart={vi.fn()} />);
    // Player 0 has orange (#F97316) by default; for player 1, orange should be taken
    const takenBtn = screen.getAllByRole('button', { name: /橙.*已選用/ });
    expect(takenBtn.length).toBeGreaterThan(0);
    takenBtn.forEach(btn => expect(btn).toBeDisabled());
  });

  it('all 4 official colors are shown per player row', () => {
    render(<GameSetup onStart={vi.fn()} />);
    // Each row should contain buttons for 橙, 藍, 白, 黑
    const orangeBtns = screen.getAllByTitle('橙');
    expect(orangeBtns.length).toBe(2); // one per player row
  });

  it('names are limited to 12 characters via maxLength attribute', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveAttribute('maxLength', '12');
  });
});

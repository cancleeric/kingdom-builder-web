import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameSetup } from '../components/Setup/GameSetup';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('GameSetup', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders player count buttons', () => {
    render(<GameSetup onStart={vi.fn()} />);
    expect(screen.getByText('2人')).toBeInTheDocument();
    expect(screen.getByText('3人')).toBeInTheDocument();
    expect(screen.getByText('4人')).toBeInTheDocument();
  });

  it('default shows 2 players', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('shows 3 player inputs when 3 is selected', () => {
    render(<GameSetup onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('3人'));
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
  });

  it('shows 4 player inputs when 4 is selected', () => {
    render(<GameSetup onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('4人'));
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
  });

  it('start button is enabled when all names are non-empty', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const startBtn = screen.getByText('開始遊戲');
    expect(startBtn).not.toBeDisabled();
  });

  it('start button is disabled when a name is empty', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '' } });
    const startBtn = screen.getByText('開始遊戲');
    expect(startBtn).toBeDisabled();
  });

  it('calls onStart with player configs when start is clicked', () => {
    const onStart = vi.fn();
    render(<GameSetup onStart={onStart} />);
    fireEvent.click(screen.getByText('開始遊戲'));
    expect(onStart).toHaveBeenCalledTimes(1);
    const players = onStart.mock.calls[0][0];
    expect(players).toHaveLength(2);
    expect(players[0]).toHaveProperty('name');
    expect(players[0]).toHaveProperty('color');
    expect(players[0]).toHaveProperty('id');
  });

  it('does not call onStart when name is empty', () => {
    const onStart = vi.fn();
    render(<GameSetup onStart={onStart} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '' } });
    fireEvent.click(screen.getByText('開始遊戲'));
    expect(onStart).not.toHaveBeenCalled();
  });

  it('color buttons are rendered for each player', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const colorBtns = screen.getAllByRole('button', { name: /色/ });
    expect(colorBtns.length).toBeGreaterThanOrEqual(4);
  });

  it('selected color for player 1 is disabled for player 2', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const orangeButtons = screen.getAllByLabelText('橙色');
    expect(orangeButtons).toHaveLength(2);
    expect(orangeButtons[0]).not.toBeDisabled();
    expect(orangeButtons[1]).toBeDisabled();
  });

  it('saves to localStorage on start', () => {
    render(<GameSetup onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('開始遊戲'));
    expect(localStorageMock.getItem('kingdom-builder-setup')).not.toBeNull();
  });

  it('name is truncated at 12 characters', () => {
    render(<GameSetup onStart={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'abcdefghijklmnop' } });
    expect((inputs[0] as HTMLInputElement).value).toHaveLength(12);
  });
});

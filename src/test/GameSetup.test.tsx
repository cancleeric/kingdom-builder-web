import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import GameSetup from '../components/GameSetup/GameSetup';
import { useTutorialStore } from '../store/tutorialStore';
import { TUTORIAL_STEPS } from '../store/tutorialSteps';

beforeEach(() => {
  act(() => {
    useTutorialStore.setState({
      isActive: false,
      currentStepIndex: 0,
      steps: TUTORIAL_STEPS,
      isCompleted: false,
    });
  });
});

describe('GameSetup', () => {
  it('renders the game setup panel', () => {
    render(<GameSetup />);
    expect(screen.getByTestId('game-setup')).toBeInTheDocument();
  });

  it('shows the "觀看教學" button', () => {
    render(<GameSetup />);
    expect(screen.getByTestId('watch-tutorial-button')).toBeInTheDocument();
    expect(screen.getByTestId('watch-tutorial-button')).toHaveTextContent('觀看教學');
  });

  it('shows the "開始遊戲" button', () => {
    render(<GameSetup />);
    expect(screen.getByTestId('start-game-button')).toBeInTheDocument();
  });

  it('clicking "觀看教學" starts the tutorial', () => {
    render(<GameSetup />);
    fireEvent.click(screen.getByTestId('watch-tutorial-button'));
    expect(useTutorialStore.getState().isActive).toBe(true);
    expect(useTutorialStore.getState().currentStepIndex).toBe(0);
  });

  it('calls onStartGame callback when "開始遊戲" is clicked', () => {
    const onStartGame = vi.fn();
    render(<GameSetup onStartGame={onStartGame} />);
    fireEvent.click(screen.getByTestId('start-game-button'));
    expect(onStartGame).toHaveBeenCalledTimes(1);
  });

  it('shows tutorial hint when tutorial is not completed', () => {
    render(<GameSetup />);
    expect(screen.getByTestId('tutorial-hint')).toBeInTheDocument();
  });

  it('hides tutorial hint when tutorial has been completed', () => {
    act(() => {
      useTutorialStore.setState({ isCompleted: true });
    });
    render(<GameSetup />);
    expect(screen.queryByTestId('tutorial-hint')).not.toBeInTheDocument();
  });
});

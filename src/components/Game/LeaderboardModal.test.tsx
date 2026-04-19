import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ObjectiveCard } from '../../core/scoring';
import { LeaderboardModal } from './LeaderboardModal';
import { useLeaderboardStore } from '../../store/leaderboardStore';
import { useSeasonStore } from '../../store/seasonStore';

describe('LeaderboardModal', () => {
  beforeEach(() => {
    localStorage.clear();
    useLeaderboardStore.setState({
      localEntries: [
        {
          playerName: 'Alice',
          score: 88,
          date: '2026-04-10T00:00:00.000Z',
          playerCount: 3,
          objectiveCards: [ObjectiveCard.Citizens, ObjectiveCard.Farmers],
        },
      ],
      globalEntries: [
        {
          playerName: 'GlobalPro',
          score: 120,
          date: '2026-04-10T00:00:00.000Z',
          playerCount: 4,
          objectiveCards: [ObjectiveCard.Citizens],
        },
      ],
    });
    useSeasonStore.setState({ currentSeason: null, seasonHistory: [] });
  });

  it('renders local leaderboard entries with score', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LeaderboardModal isOpen onClose={vi.fn()} />
      </I18nextProvider>
    );

    expect(screen.getByText('Leaderboard')).toBeTruthy();

    // Click the Local tab to see local entries
    const localTab = screen.getByText('Local');
    fireEvent.click(localTab);

    expect(screen.getByText(/Alice/)).toBeTruthy();
    expect(screen.getByText(/88 pts/)).toBeTruthy();
  });

  it('renders season tab by default with empty message', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LeaderboardModal isOpen onClose={vi.fn()} />
      </I18nextProvider>
    );

    expect(screen.getByText('This Season')).toBeTruthy();
    expect(screen.getByText('No scores recorded this season yet.')).toBeTruthy();
  });
});

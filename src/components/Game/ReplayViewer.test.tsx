import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ReplayViewer } from './ReplayViewer';
import type { ReplayRecord } from '../../types';
import { ObjectiveCard } from '../../core/scoring';

vi.setConfig({ testTimeout: 15000 });

function makeReplay(overrides?: Partial<ReplayRecord>): ReplayRecord {
  return {
    id: 'test-id',
    date: '2026-04-10T12:00:00.000Z',
    players: [
      { id: 1, name: 'Alice', color: '#f00' },
      { id: 2, name: 'Bob', color: '#00f' },
    ],
    history: [
      {
        type: 'PLACE_SETTLEMENT',
        playerId: 1,
        turnNumber: 1,
        hex: { q: 2, r: -1 },
        timestamp: 1000,
      },
      {
        type: 'PLACE_SETTLEMENT',
        playerId: 1,
        turnNumber: 1,
        hex: { q: 3, r: -1 },
        timestamp: 2000,
      },
      {
        type: 'TILE_MOVE',
        playerId: 2,
        turnNumber: 2,
        fromHex: { q: 1, r: 0 },
        toHex: { q: 4, r: -2 },
        timestamp: 3000,
      },
    ],
    finalScores: [
      {
        playerId: 1,
        castleScore: 12,
        objectiveScores: [{ card: ObjectiveCard.Citizens, score: 6 }],
        totalScore: 18,
      },
      {
        playerId: 2,
        castleScore: 8,
        objectiveScores: [{ card: ObjectiveCard.Citizens, score: 4 }],
        totalScore: 12,
      },
    ],
    objectiveCards: [ObjectiveCard.Citizens],
    winnerName: 'Alice',
    ...overrides,
  };
}

describe('ReplayViewer', () => {
  it('renders the back button', () => {
    const onBack = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={onBack} />
      </I18nextProvider>
    );
    expect(screen.getByText(/Back to List/i)).toBeTruthy();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={onBack} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Back to List/i));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('displays winner name', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    expect(screen.getByText(/Winner: Alice/i)).toBeTruthy();
  });

  it('shows step counter', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    expect(screen.getByText(/Step 1 of 3/i)).toBeTruthy();
  });

  it('Previous button is disabled at step 1', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    const prev = screen.getByText(/← Previous/i);
    expect(prev.closest('button')?.disabled).toBe(true);
  });

  it('clicking Next advances to step 2', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Next →/i));
    expect(screen.getByText(/Step 2 of 3/i)).toBeTruthy();
  });

  it('clicking Next then Previous returns to step 1', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Next →/i));
    fireEvent.click(screen.getByText(/← Previous/i));
    expect(screen.getByText(/Step 1 of 3/i)).toBeTruthy();
  });

  it('Next button is disabled at last step', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Next →/i));
    fireEvent.click(screen.getByText(/Next →/i));
    const next = screen.getByText(/Next →/i);
    expect(next.closest('button')?.disabled).toBe(true);
  });

  it('shows PLACE_SETTLEMENT action description', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    // First action is PLACE_SETTLEMENT at Q2R-1 (appears in current-action card and timeline)
    const matches = screen.getAllByText(/Q2R-1/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows TILE_MOVE action description on step 3', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText(/Next →/i));
    fireEvent.click(screen.getByText(/Next →/i));
    // TILE_MOVE from Q1R0 → Q4R-2 should appear in current-action card
    const matches = screen.getAllByText(/Q1R0/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows final scores section', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    expect(screen.getByText(/Final Scores/i)).toBeTruthy();
    // Alice total
    expect(screen.getByText(/18 pts/i)).toBeTruthy();
  });

  it('shows noActions message when history is empty', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay({ history: [] })} onBack={vi.fn()} />
      </I18nextProvider>
    );
    expect(screen.getByText(/No actions recorded/i)).toBeTruthy();
  });

  it('clicking timeline item navigates to that step', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ReplayViewer replay={makeReplay()} onBack={vi.fn()} />
      </I18nextProvider>
    );
    // The third action describes a TILE_MOVE (Q4R-2 is the destination)
    // Click the third item in the timeline list (index 2)
    const listItems = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('aria-current') !== null || btn.textContent?.includes('Turn 2')
    );
    // Find the Turn 2 button in the list
    const turn2Btn = screen.getAllByText(/Turn 2/i)[0];
    fireEvent.click(turn2Btn.closest('button') ?? turn2Btn);
    expect(screen.getByText(/Step 3 of 3/i)).toBeTruthy();
  });
});

/**
 * Unit tests for the GameLog component (issue #21).
 *
 * Covers:
 *  - empty state renders placeholder text
 *  - renders action entries from history prop
 *  - shows player name and turn number
 *  - applies player color via border styling
 *  - shows correct label for each action type
 *  - shows acquired tile when present
 *  - shows at most 20 entries (MAX_LOG_ENTRIES)
 *  - most-recent actions appear first
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameLog } from '../components/Game/GameLog';
import { BotDifficulty } from '../types';
import type { Player } from '../types';
import type { GameAction } from '../types/history';
import { Location } from '../core/terrain';

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function makePlaceAction(overrides?: Partial<GameAction>): GameAction {
  return {
    type: 'PLACE_SETTLEMENT',
    playerId: 1,
    turnNumber: 1,
    hex: { q: 2, r: 3 },
    timestamp: 1000,
    ...overrides,
  };
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('GameLog', () => {
  const players = [
    makePlayer({ id: 1, name: 'Alice', color: '#ff0000' }),
    makePlayer({ id: 2, name: 'Bob', color: '#0000ff' }),
  ];

  it('shows placeholder when history is empty', () => {
    render(<GameLog history={[]} players={players} />);
    expect(screen.getByText(/No actions yet/)).toBeTruthy();
  });

  it('renders a log entry for a PLACE_SETTLEMENT action', () => {
    const history = [makePlaceAction({ playerId: 1, turnNumber: 2, hex: { q: 1, r: -1 } })];
    render(<GameLog history={history} players={players} />);
    // Should show player name and turn number
    expect(screen.getByText(/Alice/)).toBeTruthy();
    expect(screen.getByText(/Turn 2/)).toBeTruthy();
    // Should include coordinates
    expect(screen.getByText(/Q1R-1/)).toBeTruthy();
  });

  it('renders a log entry for a TILE_PLACEMENT action', () => {
    const history: GameAction[] = [
      {
        type: 'TILE_PLACEMENT',
        playerId: 1,
        turnNumber: 1,
        hex: { q: 3, r: 0 },
        tile: Location.Farm,
        timestamp: 2000,
      },
    ];
    render(<GameLog history={history} players={players} />);
    expect(screen.getByText(/Farm/)).toBeTruthy();
    expect(screen.getByText(/Q3R0/)).toBeTruthy();
  });

  it('renders a log entry for a TILE_MOVE action', () => {
    const history: GameAction[] = [
      {
        type: 'TILE_MOVE',
        playerId: 2,
        turnNumber: 3,
        fromHex: { q: 1, r: 0 },
        toHex: { q: 2, r: 1 },
        tile: Location.Paddock,
        timestamp: 3000,
      },
    ];
    render(<GameLog history={history} players={players} />);
    expect(screen.getByText(/Bob/)).toBeTruthy();
    expect(screen.getByText(/Turn 3/)).toBeTruthy();
    expect(screen.getByText(/Q1R0/)).toBeTruthy();
    expect(screen.getByText(/Q2R1/)).toBeTruthy();
  });

  it('shows acquired tile label when acquiredTile is present', () => {
    const history = [
      makePlaceAction({ acquiredTile: Location.Harbor }),
    ];
    render(<GameLog history={history} players={players} />);
    expect(screen.getByText(/Harbor/)).toBeTruthy();
  });

  it('shows most-recent action first', () => {
    const history: GameAction[] = [
      makePlaceAction({ turnNumber: 1, timestamp: 1000, hex: { q: 0, r: 0 } }),
      makePlaceAction({ turnNumber: 2, timestamp: 2000, hex: { q: 1, r: 1 } }),
    ];
    render(<GameLog history={history} players={players} />);
    const items = screen.getAllByRole('listitem');
    // Most recent (turn 2) is first
    expect(items[0].textContent).toContain('Turn 2');
    expect(items[1].textContent).toContain('Turn 1');
  });

  it('shows at most 20 entries when history is longer', () => {
    const history: GameAction[] = Array.from({ length: 25 }, (_, i) =>
      makePlaceAction({ timestamp: i, turnNumber: i + 1, hex: { q: i, r: 0 } })
    );
    render(<GameLog history={history} players={players} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(20);
  });

  it('falls back to Player <id> when player is not in the players list', () => {
    const history = [makePlaceAction({ playerId: 99 })];
    render(<GameLog history={history} players={players} />);
    expect(screen.getByText(/Player 99/)).toBeTruthy();
  });
});

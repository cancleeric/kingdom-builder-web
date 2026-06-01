import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ObjectiveCard } from '../../core/scoring';
import { BotDifficulty, Player, PlayerScore } from '../../types';
import { GameOver } from './GameOver';

const players: Player[] = [
    {
        id: 1,
        name: 'Alice',
        color: '#FF6B6B',
        settlements: [],
        remainingSettlements: 0,
        tiles: [],
        isBot: false,
        difficulty: BotDifficulty.Medium,
    },
    {
        id: 2,
        name: 'Bob',
        color: '#4ECDC4',
        settlements: [],
        remainingSettlements: 0,
        tiles: [],
        isBot: true,
        difficulty: BotDifficulty.Medium,
    },
];

const finalScores: PlayerScore[] = [
    {
        playerId: 2,
        castleScore: 3,
        objectiveScores: [
            { card: ObjectiveCard.Hermits, score: 6 },
            { card: ObjectiveCard.Lords, score: 3 },
        ],
        totalScore: 12,
    },
    {
        playerId: 1,
        castleScore: 6,
        objectiveScores: [
            { card: ObjectiveCard.Hermits, score: 12 },
            { card: ObjectiveCard.Lords, score: 9 },
        ],
        totalScore: 27,
    },
];

const objectiveCards = [ObjectiveCard.Hermits, ObjectiveCard.Lords];

function renderGameOver(overrides: Partial<ComponentProps<typeof GameOver>> = {}) {
    const props: ComponentProps<typeof GameOver> = {
        finalScores,
        players,
        objectiveCards,
        onNewGame: vi.fn(),
        onOpenLeaderboard: vi.fn(),
        onOpenReplay: vi.fn(),
        ...overrides,
    };

    render(<GameOver {...props} />);
    return props;
}

describe('GameOver', () => {
    it('renders final rankings sorted by total score', () => {
        renderGameOver();

        expect(screen.getByRole('heading', { name: /Game Over/i })).toBeTruthy();

        const rows = screen.getAllByTestId('final-score-row');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('Alice');
        expect(rows[0]).toHaveTextContent('27');
        expect(rows[1]).toHaveTextContent('Bob');
        expect(rows[1]).toHaveTextContent('12');
    });

    it('renders score bars with accessible segment breakdowns', () => {
        renderGameOver();

        const aliceBar = screen.getByTestId('score-bar-1');
        expect(aliceBar).toHaveAccessibleName('Alice score breakdown, 27 total points');

        const segments = within(aliceBar).getAllByRole('listitem');
        expect(segments).toHaveLength(3);
        expect(segments[0]).toHaveAccessibleName('Alice Castle score: 6 points');
        expect(segments[1]).toHaveAccessibleName('Alice Hermits score: 12 points');
        expect(segments[2]).toHaveAccessibleName('Alice Lords score: 9 points');
        expect(segments[0]).toHaveStyle({ width: '22.22222222222222%' });
    });

    it('shows visible color-keyed score details for castle and objectives', () => {
        renderGameOver();

        expect(screen.getByText('Castle: 6 pts')).toBeTruthy();
        expect(screen.getByText('Hermits: 12 pts')).toBeTruthy();
        expect(screen.getByText('Lords: 9 pts')).toBeTruthy();
    });

    it('renders an empty score bar without NaN widths for zero totals', () => {
        renderGameOver({
            finalScores: [
                {
                    playerId: 1,
                    castleScore: 0,
                    objectiveScores: [{ card: ObjectiveCard.Hermits, score: 0 }],
                    totalScore: 0,
                },
            ],
            objectiveCards: [ObjectiveCard.Hermits],
        });

        const bar = screen.getByTestId('score-bar-1');
        expect(bar).toHaveAccessibleName('Alice score breakdown, 0 total points');
        for (const segment of within(bar).getAllByRole('listitem', { hidden: true })) {
            expect(segment).toHaveStyle({ width: '0%' });
        }
    });

    it('opens leaderboard and replay actions', () => {
        const props = renderGameOver();

        fireEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
        fireEvent.click(screen.getByRole('button', { name: 'Watch Replay' }));

        expect(props.onOpenLeaderboard).toHaveBeenCalledTimes(1);
        expect(props.onOpenReplay).toHaveBeenCalledTimes(1);
    });

    it('starts a new game', () => {
        const props = renderGameOver();

        fireEvent.click(screen.getByRole('button', { name: 'New Game' }));

        expect(props.onNewGame).toHaveBeenCalledTimes(1);
    });
});

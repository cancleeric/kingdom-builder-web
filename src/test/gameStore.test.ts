import { describe, it, expect } from 'vitest';
import { createInitialState } from '../store/gameStore';

const defaultPlayers = [
  { id: 0, name: '玩家1', color: 'orange' as const },
  { id: 1, name: '玩家2', color: 'blue' as const },
];

describe('createInitialState', () => {
  it('creates state with correct number of players', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.players).toHaveLength(2);
  });

  it('players have correct names', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.players[0].name).toBe('玩家1');
    expect(state.players[1].name).toBe('玩家2');
  });

  it('players have correct colors', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.players[0].color).toBe('orange');
    expect(state.players[1].color).toBe('blue');
  });

  it('each player starts with 40 settlements', () => {
    const state = createInitialState(defaultPlayers);
    state.players.forEach(p => {
      expect(p.settlements).toBe(40);
    });
  });

  it('game starts in playing phase', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.phase).toBe('playing');
  });

  it('starts with 3 placements', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.placementsLeft).toBe(3);
  });

  it('currentPlayerIndex is 0', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('playerCount is 2 for 2 players', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.playerCount).toBe(2);
  });

  it('works with 3 players', () => {
    const players = [
      { id: 0, name: '玩家1', color: 'orange' as const },
      { id: 1, name: '玩家2', color: 'blue' as const },
      { id: 2, name: '玩家3', color: 'white' as const },
    ];
    const state = createInitialState(players);
    expect(state.players).toHaveLength(3);
    expect(state.playerCount).toBe(3);
  });

  it('works with 4 players', () => {
    const players = [
      { id: 0, name: '玩家1', color: 'orange' as const },
      { id: 1, name: '玩家2', color: 'blue' as const },
      { id: 2, name: '玩家3', color: 'white' as const },
      { id: 3, name: '玩家4', color: 'black' as const },
    ];
    const state = createInitialState(players);
    expect(state.players).toHaveLength(4);
    expect(state.playerCount).toBe(4);
  });

  it('board is created', () => {
    const state = createInitialState(defaultPlayers);
    expect(state.board.length).toBeGreaterThan(0);
  });
});

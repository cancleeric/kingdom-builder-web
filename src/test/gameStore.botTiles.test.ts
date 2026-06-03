import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { Location, Terrain } from '../core/terrain';
import { BotDifficulty, GamePhase, type PlayerConfig } from '../types';

const players: PlayerConfig[] = [
  { name: 'Human', type: 'human', difficulty: BotDifficulty.Medium },
  { name: 'Bot', type: 'bot', difficulty: BotDifficulty.Medium },
];

function setupBotFarmTurn() {
  useGameStore.getState().initGame(players, {
    boardSize: 'small',
    objectiveCount: 3,
    enableUndo: true,
  });

  const state = useGameStore.getState();
  for (const cell of state.board.getAllCells()) {
    cell.terrain = Terrain.Grass;
    cell.location = undefined;
    cell.settlement = undefined;
  }

  useGameStore.setState({
    currentPlayerIndex: 1,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    deck: [{ terrain: Terrain.Grass }],
    validPlacements: [],
    players: state.players.map((player, index) =>
      index === 1
        ? {
            ...player,
            settlements: [],
            remainingSettlements: 40,
            tiles: [{ location: Location.Farm, usedThisTurn: false }],
          }
        : player
    ),
  });
}

function grantBotFarmTiles(count: number) {
  const state = useGameStore.getState();
  useGameStore.setState({
    players: state.players.map((player, index) =>
      index === 1
        ? {
            ...player,
            tiles: Array.from({ length: count }, () => ({
              location: Location.Farm,
              usedThisTurn: false,
            })),
          }
        : player
    ),
  });
}

describe('Bot location tiles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupBotFarmTurn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses an available placement tile before ending its turn', async () => {
    useGameStore.getState().triggerBotTurn();
    // STEP_MS = 400: 3 placements at 400/800/1200ms, endTurn at 1600ms
    // advance past 1600ms to ensure bot turn completes
    await vi.advanceTimersByTimeAsync(2000);

    const state = useGameStore.getState();
    const bot = state.players[1];
    const tileAction = state.history.find(action => action.type === 'TILE_PLACEMENT');

    expect(state.currentPlayerIndex).toBe(0);
    expect(state.phase).toBe(GamePhase.DrawCard);
    expect(bot.settlements).toHaveLength(4);
    expect(bot.remainingSettlements).toBe(36);
    expect(tileAction).toMatchObject({
      type: 'TILE_PLACEMENT',
      playerId: 2,
      tile: Location.Farm,
    });
  });

  it('marks each duplicate placement tile copy as used when both are played', () => {
    grantBotFarmTiles(2);
    useGameStore.setState({ phase: GamePhase.EndTurn });

    useGameStore.getState().activateTile(Location.Farm);
    useGameStore.getState().applyTilePlacement(useGameStore.getState().validPlacements[0]);
    useGameStore.getState().activateTile(Location.Farm);
    useGameStore.getState().applyTilePlacement(useGameStore.getState().validPlacements[0]);

    const state = useGameStore.getState();
    const bot = state.players[1];
    const tileActions = state.history.filter(action => action.type === 'TILE_PLACEMENT');

    expect(tileActions).toHaveLength(2);
    expect(bot.tiles).toEqual([
      { location: Location.Farm, usedThisTurn: true },
      { location: Location.Farm, usedThisTurn: true },
    ]);
  });
});
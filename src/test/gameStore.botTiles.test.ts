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

// ────────────────────────────────────────────────────
// Movement tiles (Harbor/Paddock/Barn) — bot evaluates candidate
// destinations instead of always taking the first legal (from, to) pair.
// ────────────────────────────────────────────────────

/**
 * Bot has an existing settlement at (5,5) plus a Paddock tile. All 6 Paddock
 * destinations (2 hexes away in each direction) are legal, but only the
 * West destination (3,5) is adjacent to a Castle-flagged cell (2,5) — giving
 * it a strictly higher `evaluateMove` score than every other destination
 * (including (7,5), which would be picked by a naive "take the first option"
 * strategy since East is first in HEX_DIRECTIONS).
 *
 * The terrain card is Water (unbuildable) so the bot's normal per-turn
 * settlement placements find zero valid cells and skip straight to
 * EndTurn — isolating the test to the movement-tile decision only.
 */
function setupBotPaddockTurn() {
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

  const botId = state.players[1].id;
  state.board.getCell({ q: 5, r: 5 })!.settlement = botId;
  state.board.getCell({ q: 2, r: 5 })!.location = Location.Castle;

  useGameStore.setState({
    currentPlayerIndex: 1,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    deck: [{ terrain: Terrain.Water }],
    validPlacements: [],
    players: state.players.map((player, index) =>
      index === 1
        ? {
            ...player,
            settlements: [{ q: 5, r: 5 }],
            remainingSettlements: 40,
            tiles: [{ location: Location.Paddock, usedThisTurn: false }],
          }
        : player
    ),
  });
}

describe('Bot movement tiles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks the highest-scoring destination instead of the first legal one', () => {
    setupBotPaddockTurn();

    useGameStore.getState().triggerBotTurn();
    vi.runAllTimers();

    const state = useGameStore.getState();
    const bot = state.players[1];
    const moveActions = state.history.filter(action => action.type === 'TILE_MOVE');

    expect(moveActions).toHaveLength(1);
    expect(moveActions[0]).toMatchObject({
      fromHex: { q: 5, r: 5 },
      toHex: { q: 3, r: 5 },
    });
    expect(state.board.getCell({ q: 3, r: 5 })?.settlement).toBe(bot.id);
    expect(state.board.getCell({ q: 5, r: 5 })?.settlement).toBeUndefined();
    // Naive "first direction" pick (East, distance 2) must NOT be chosen.
    expect(state.board.getCell({ q: 7, r: 5 })?.settlement).toBeUndefined();
    // The bot's move landed on the settlements list too.
    expect(bot.settlements).toContainEqual({ q: 3, r: 5 });
  });
});

// ────────────────────────────────────────────────────
// Phantom-score regression: a movement-tile destination that is adjacent to
// `from` must NOT get a bonus for the settlement that is about to vacate it.
// ────────────────────────────────────────────────────

/**
 * Bot has a single settlement at (5,5) plus a Harbor tile. Two Water cells
 * exist:
 *   - (6,5): immediately east of (5,5) — i.e. adjacent to `from`. It has no
 *     genuine bonus of its own (no Castle/location/other-settlement
 *     neighbor). A buggy evaluator that scores `to` against the board
 *     *before* removing the settlement at `from` sees (5,5) as a neighbor
 *     of (6,5) and wrongly awards it a +1 "cluster" bonus (phantom score).
 *   - (2,2): far away, also has zero genuine bonus, but sits at a smaller
 *     (r, q) than (6,5) so it wins the deterministic tie-break once both
 *     destinations correctly score 0.
 *
 * Correct behavior: both destinations are equally worthless (score 0), so
 * the tie-break picks (2,2). The pre-fix bug would instead pick (6,5)
 * because of the phantom +1.
 */
function setupBotHarborPhantomTurn() {
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

  const botId = state.players[1].id;
  state.board.getCell({ q: 5, r: 5 })!.settlement = botId;
  state.board.getCell({ q: 6, r: 5 })!.terrain = Terrain.Water; // adjacent to (5,5) — phantom risk
  state.board.getCell({ q: 2, r: 2 })!.terrain = Terrain.Water; // genuinely equal, wins tie-break

  useGameStore.setState({
    currentPlayerIndex: 1,
    phase: GamePhase.DrawCard,
    currentTerrainCard: null,
    deck: [{ terrain: Terrain.Water }],
    validPlacements: [],
    players: state.players.map((player, index) =>
      index === 1
        ? {
            ...player,
            settlements: [{ q: 5, r: 5 }],
            remainingSettlements: 40,
            tiles: [{ location: Location.Harbor, usedThisTurn: false }],
          }
        : player
    ),
  });
}

describe('Bot movement tile phantom-score regression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not favor a destination adjacent to `from` due to the settlement about to vacate it', () => {
    setupBotHarborPhantomTurn();

    useGameStore.getState().triggerBotTurn();
    vi.runAllTimers();

    const state = useGameStore.getState();
    const bot = state.players[1];
    const moveActions = state.history.filter(action => action.type === 'TILE_MOVE');

    expect(moveActions).toHaveLength(1);
    // Must pick the genuinely tied-and-tiebroken (2,2), NOT the
    // phantom-boosted (6,5) that is adjacent to the vacating settlement.
    expect(moveActions[0]).toMatchObject({
      fromHex: { q: 5, r: 5 },
      toHex: { q: 2, r: 2 },
    });
    expect(state.board.getCell({ q: 2, r: 2 })?.settlement).toBe(bot.id);
    expect(state.board.getCell({ q: 6, r: 5 })?.settlement).toBeUndefined();
    expect(state.board.getCell({ q: 5, r: 5 })?.settlement).toBeUndefined();
  });
});

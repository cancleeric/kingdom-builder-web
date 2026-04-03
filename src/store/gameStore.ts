import { create } from 'zustand';
import { Board, createDefaultBoard } from '../core/board';
import { TerrainCard, createTerrainDeck, shuffleDeck, drawCard } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import { Player, GamePhase, PlayerScore } from '../types';
import { AxialCoord, hexToKey, HEX_DIRECTIONS } from '../core/hex';
import { Location } from '../core/terrain';
import {
  getExtraPlacementPositions,
  getMovementOptions,
  executeMoveTile,
} from '../core/location';
import {
  ObjectiveCard,
  selectObjectiveCards,
  scoreCastle,
  scoreObjectiveCard,
} from '../core/scoring';
import { BotPlayer, BotDifficulty } from '../ai/botPlayer';

export type { BotDifficulty };

export interface PlayerConfig {
  name: string;
  type: 'human' | 'bot';
  difficulty?: BotDifficulty;
}

// ────────────────────────────────────────────────────
// Seeded PRNG (mulberry32)
// ────────────────────────────────────────────────────

function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ────────────────────────────────────────────────────
// State shape
// ────────────────────────────────────────────────────

interface GameState {
  board: Board;
  players: Player[];
  playerConfigs: PlayerConfig[];
  currentPlayerIndex: number;
  phase: GamePhase;
  currentTerrainCard: TerrainCard | null;
  remainingPlacements: number;
  deck: TerrainCard[];
  acquiredLocations: string[];
  objectiveCards: ObjectiveCard[];
  finalScores: PlayerScore[];
  selectedCell: AxialCoord | null;
  validPlacements: AxialCoord[];
  activeTile: Location | null;
  tileMoveSources: AxialCoord[];
  tileMoveFrom: AxialCoord | null;
  tileMoveDestinations: AxialCoord[];
  isBotThinking: boolean;

  initGame: (playerCount: number, playerConfigs?: PlayerConfig[]) => void;
  drawTerrainCard: () => void;
  placeSettlement: (coord: AxialCoord) => void;
  endTurn: () => void;
  selectCell: (coord: AxialCoord | null) => void;
  activateTile: (location: Location) => void;
  cancelTile: () => void;
  applyTilePlacement: (coord: AxialCoord) => void;
  selectTileMoveSource: (from: AxialCoord) => void;
  applyTileMove: (to: AxialCoord) => void;
  triggerBotTurn: () => void;
}

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────

const SETTLEMENTS_PER_TURN = 3;
const TOTAL_SETTLEMENTS_PER_PLAYER = 40;
const BOT_DRAW_DELAY_MS = 800;
const BOT_PLACEMENT_DELAY_MS = 300;
const BOT_END_TURN_DELAY_MS = 300;

const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
];

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function neighborsOf(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

function buildPlayerScores(
  board: Board,
  players: Player[],
  objectiveCards: ObjectiveCard[]
): PlayerScore[] {
  return players.map(player => {
    const castleScore = scoreCastle(board, player.id);
    const objectiveScores = objectiveCards.map(card => ({
      card,
      score: scoreObjectiveCard(card, board, player.id),
    }));
    const totalScore =
      castleScore + objectiveScores.reduce((s, o) => s + o.score, 0);
    return { playerId: player.id, castleScore, objectiveScores, totalScore };
  });
}

function resetTileState() {
  return {
    activeTile: null as Location | null,
    tileMoveSources: [] as AxialCoord[],
    tileMoveFrom: null as AxialCoord | null,
    tileMoveDestinations: [] as AxialCoord[],
  };
}

/**
 * After placing a settlement at `coord`, check adjacent cells for unclaimed
 * location tiles and add them to the player's tile list.
 * Mutates `player.tiles` and `acquiredLocations` in place; returns the updated list.
 */
function applyTileAcquisition(
  board: Board,
  coord: AxialCoord,
  player: Player,
  acquiredLocations: string[]
): string[] {
  const updated = [...acquiredLocations];
  const acquiredSet = new Set(updated);

  for (const neighbor of neighborsOf(coord)) {
    const cell = board.getCell(neighbor);
    const key = hexToKey(neighbor);
    if (
      cell?.location &&
      cell.location !== Location.Castle &&
      !acquiredSet.has(key)
    ) {
      updated.push(key);
      acquiredSet.add(key);
      player.tiles.push({ location: cell.location, usedThisTurn: false });
    }
  }

  return updated;
}

// ────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  board: createDefaultBoard(),
  players: [],
  playerConfigs: [],
  currentPlayerIndex: 0,
  phase: GamePhase.Setup,
  currentTerrainCard: null,
  remainingPlacements: 0,
  deck: [],
  acquiredLocations: [],
  objectiveCards: [],
  finalScores: [],
  selectedCell: null,
  validPlacements: [],
  activeTile: null,
  tileMoveSources: [],
  tileMoveFrom: null,
  tileMoveDestinations: [],
  isBotThinking: false,

  // ── Init ────────────────────────────────────────────
  initGame: (playerCount: number, playerConfigs?: PlayerConfig[]) => {
    if (playerCount < 2 || playerCount > 4) {
      console.error('Player count must be between 2 and 4');
      return;
    }

    // Read optional ?seed= URL parameter for deterministic randomness
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    const rng = seedParam ? createSeededRng(parseInt(seedParam, 10)) : Math.random;

    // Build default configs if not provided (all human)
    const configs: PlayerConfig[] = playerConfigs ??
      Array.from({ length: playerCount }, (_, i) => ({
        name: `Player ${i + 1}`,
        type: 'human' as const,
      }));

    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      name: configs[i]?.name ?? `Player ${i + 1}`,
      color: PLAYER_COLORS[i],
      settlements: [],
      remainingSettlements: TOTAL_SETTLEMENTS_PER_PLAYER,
      tiles: [],
    }));

    set({
      board: createDefaultBoard(),
      players,
      playerConfigs: configs,
      currentPlayerIndex: 0,
      phase: GamePhase.DrawCard,
      currentTerrainCard: null,
      remainingPlacements: 0,
      deck: shuffleDeck(createTerrainDeck(), rng),
      acquiredLocations: [],
      objectiveCards: selectObjectiveCards(3, rng),
      finalScores: [],
      selectedCell: null,
      validPlacements: [],
      isBotThinking: false,
      ...resetTileState(),
    });
  },

  // ── Draw terrain card ──────────────────────────────
  drawTerrainCard: () => {
    const state = get();
    if (state.phase !== GamePhase.DrawCard) {
      console.error('Cannot draw card in current phase');
      return;
    }

    let { card, remainingDeck } = drawCard(state.deck);
    if (!card) {
      const fresh = shuffleDeck(createTerrainDeck());
      ({ card, remainingDeck } = drawCard(fresh));
    }

    set({
      currentTerrainCard: card,
      deck: remainingDeck,
      phase: GamePhase.PlaceSettlements,
      remainingPlacements: SETTLEMENTS_PER_TURN,
      validPlacements: card
        ? getValidPlacements(
            state.board,
            card.terrain,
            state.players[state.currentPlayerIndex].id
          )
        : [],
    });

    // Auto-trigger bot turn if the current player is a bot
    const updatedState = get();
    const cfg = updatedState.playerConfigs[updatedState.currentPlayerIndex];
    if (cfg?.type === 'bot') {
      setTimeout(() => get().triggerBotTurn(), BOT_DRAW_DELAY_MS);
    }
  },

  // ── Place settlement ───────────────────────────────
  placeSettlement: (coord: AxialCoord) => {
    const state = get();
    if (state.phase !== GamePhase.PlaceSettlements) {
      console.error('Cannot place settlement in current phase');
      return;
    }
    if (!state.currentTerrainCard) {
      console.error('No terrain card drawn');
      return;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];

    if (!state.validPlacements.some(v => v.q === coord.q && v.r === coord.r)) {
      console.error('Invalid placement position');
      return;
    }

    if (!state.board.placeSettlement(coord, currentPlayer.id)) {
      console.error('Failed to place settlement');
      return;
    }

    currentPlayer.settlements.push(coord);
    currentPlayer.remainingSettlements--;

    const updatedAcquired = applyTileAcquisition(
      state.board,
      coord,
      currentPlayer,
      state.acquiredLocations
    );

    const newRemaining = state.remainingPlacements - 1;

    if (newRemaining === 0) {
      set({
        remainingPlacements: 0,
        phase: GamePhase.EndTurn,
        validPlacements: [],
        selectedCell: null,
        acquiredLocations: updatedAcquired,
        ...resetTileState(),
      });
    } else {
      set({
        remainingPlacements: newRemaining,
        validPlacements: getValidPlacements(
          state.board,
          state.currentTerrainCard.terrain,
          currentPlayer.id
        ),
        selectedCell: null,
        acquiredLocations: updatedAcquired,
      });
    }
  },

  // ── End turn ───────────────────────────────────────
  endTurn: () => {
    const state = get();
    if (state.phase !== GamePhase.EndTurn) {
      console.error('Cannot end turn in current phase');
      return;
    }

    // Reset tile usage for all players at start of next turn
    for (const player of state.players) {
      for (const tile of player.tiles) {
        tile.usedThisTurn = false;
      }
    }

    const nextPlayerIndex =
      (state.currentPlayerIndex + 1) % state.players.length;

    // Per spec: game ends when ANY player runs out of settlements
    // (Kingdom Builder rule: "任一玩家用完所有 40 間房屋")
    if (state.players.some(p => p.remainingSettlements === 0)) {
      const finalScores = buildPlayerScores(
        state.board,
        state.players,
        state.objectiveCards
      );
      set({
        phase: GamePhase.GameOver,
        currentPlayerIndex: nextPlayerIndex,
        currentTerrainCard: null,
        validPlacements: [],
        finalScores,
        ...resetTileState(),
      });
    } else {
      set({
        currentPlayerIndex: nextPlayerIndex,
        phase: GamePhase.DrawCard,
        currentTerrainCard: null,
        validPlacements: [],
        ...resetTileState(),
      });
    }
  },

  // ── Select cell ────────────────────────────────────
  selectCell: (coord: AxialCoord | null) => {
    set({ selectedCell: coord });
  },

  // ── Activate tile ability ──────────────────────────
  activateTile: (location: Location) => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    const tile = currentPlayer.tiles.find(
      t => t.location === location && !t.usedThisTurn
    );
    if (!tile) return;

    const isMovementTile =
      location === Location.Paddock || location === Location.Barn;

    if (isMovementTile) {
      const options = getMovementOptions(location, state.board, currentPlayer.id);
      set({
        activeTile: location,
        tileMoveSources: options.map(o => o.from),
        tileMoveFrom: null,
        tileMoveDestinations: [],
      });
    } else {
      set({
        activeTile: location,
        validPlacements: getExtraPlacementPositions(
          location,
          state.board,
          currentPlayer.id
        ),
        tileMoveSources: [],
        tileMoveFrom: null,
        tileMoveDestinations: [],
      });
    }
  },

  // ── Cancel tile ────────────────────────────────────
  cancelTile: () => {
    const state = get();
    const restored =
      state.phase === GamePhase.PlaceSettlements && state.currentTerrainCard
        ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            state.players[state.currentPlayerIndex].id
          )
        : state.validPlacements;

    set({ ...resetTileState(), validPlacements: restored });
  },

  // ── Use placement tile ─────────────────────────────
  applyTilePlacement: (coord: AxialCoord) => {
    const state = get();
    if (!state.activeTile) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!state.validPlacements.some(v => v.q === coord.q && v.r === coord.r)) return;
    if (!state.board.placeSettlement(coord, currentPlayer.id)) return;

    currentPlayer.settlements.push(coord);
    currentPlayer.remainingSettlements--;

    const tile = currentPlayer.tiles.find(t => t.location === state.activeTile);
    if (tile) tile.usedThisTurn = true;

    const updatedAcquired = applyTileAcquisition(
      state.board,
      coord,
      currentPlayer,
      state.acquiredLocations
    );

    const restoredValid =
      state.phase === GamePhase.PlaceSettlements && state.currentTerrainCard
        ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            currentPlayer.id
          )
        : [];

    set({
      acquiredLocations: updatedAcquired,
      ...resetTileState(),
      validPlacements: restoredValid,
    });
  },

  // ── Select move source ─────────────────────────────
  selectTileMoveSource: (from: AxialCoord) => {
    const state = get();
    if (!state.activeTile) return;
    const currentPlayer = state.players[state.currentPlayerIndex];

    const options = getMovementOptions(state.activeTile, state.board, currentPlayer.id);
    const option = options.find(o => o.from.q === from.q && o.from.r === from.r);
    if (!option) return;

    set({ tileMoveFrom: from, tileMoveDestinations: option.destinations });
  },

  // ── Execute movement tile ──────────────────────────
  applyTileMove: (to: AxialCoord) => {
    const state = get();
    if (!state.activeTile || !state.tileMoveFrom) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (
      !executeMoveTile(
        state.activeTile,
        state.board,
        currentPlayer.id,
        state.tileMoveFrom,
        to
      )
    )
      return;

    // Update player settlements list
    const fromKey = hexToKey(state.tileMoveFrom);
    const idx = currentPlayer.settlements.findIndex(s => hexToKey(s) === fromKey);
    if (idx !== -1) currentPlayer.settlements[idx] = to;

    const tile = currentPlayer.tiles.find(t => t.location === state.activeTile);
    if (tile) tile.usedThisTurn = true;

    const restoredValid =
      state.phase === GamePhase.PlaceSettlements && state.currentTerrainCard
        ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            currentPlayer.id
          )
        : [];

    set({ ...resetTileState(), validPlacements: restoredValid });
  },

  // ── Bot turn ───────────────────────────────────────
  triggerBotTurn: () => {
    const state = get();
    if (state.phase !== GamePhase.PlaceSettlements) return;
    if (!state.currentTerrainCard) return;

    const cfg = state.playerConfigs[state.currentPlayerIndex];
    if (!cfg || cfg.type !== 'bot') return;

    set({ isBotThinking: true });

    const difficulty = cfg.difficulty ?? 'normal';
    const bot = new BotPlayer(difficulty);
    const moves = bot.selectBestMoves(
      {
        board: state.board,
        currentTerrainCard: state.currentTerrainCard.terrain,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        objectiveCards: state.objectiveCards,
        acquiredLocations: state.acquiredLocations,
      },
      state.remainingPlacements
    );

    const placeNext = (index: number) => {
      const currentState = get();

      if (index >= moves.length || currentState.phase === GamePhase.EndTurn) {
        set({ isBotThinking: false });
        if (currentState.phase === GamePhase.EndTurn) {
          setTimeout(() => get().endTurn(), BOT_END_TURN_DELAY_MS);
        }
        return;
      }

      setTimeout(() => {
        get().placeSettlement(moves[index]);
        placeNext(index + 1);
      }, BOT_PLACEMENT_DELAY_MS);
    };

    placeNext(0);
  },
}));

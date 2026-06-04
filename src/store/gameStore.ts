import { create } from 'zustand';
import { saveGame, loadGame } from './persistence';
import type { SerializableGameState } from './persistence';
import { Board, createDefaultBoard, createBoardForSize, createModularBoard } from '../core/board';
import { TerrainCard, createTerrainDeck, shuffleDeck, drawCard } from '../core/terrain';
import { isBuildable } from '../core/terrain';
import { getValidPlacements } from '../core/rules';
import { Player, PlayerConfig, GamePhase, PlayerScore, BotDifficulty, GameOptions } from '../types';
import { AxialCoord, hexToKey, HEX_DIRECTIONS } from '../core/hex';
import { Location, Terrain } from '../core/terrain';
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
import { GameAction, UndoSnapshot } from '../types/history';
import { evaluateMove, selectBestMoves } from '../ai/botPlayer';

// ────────────────────────────────────────────────────
// State shape
// ────────────────────────────────────────────────────

interface GameState {
  board: Board;
  players: Player[];
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
  /** Tracks settlements placed in the current turn (for adjacency rule) */
  placementsThisTurn: AxialCoord[];
  activeTile: Location | null;
  tileMoveSources: AxialCoord[];
  tileMoveFrom: AxialCoord | null;
  tileMoveDestinations: AxialCoord[];

  /** Full list of all recorded actions across the game */
  history: GameAction[];
  /** Whether the current player may still undo this turn */
  canUndo: boolean;
  /**
   * Stack of undo snapshots for the current turn (LIFO).
   * Each undoable action pushes one snapshot; undoLastAction pops the top.
   * Cleared on endTurn / initGame / drawTerrainCard so cross-turn undo is
   * impossible.
   */
  undoStack: UndoSnapshot[];
  /** Running turn counter (incremented when a new turn begins) */
  turnNumber: number;

  /** Options chosen at setup time */
  gameOptions: GameOptions;

  initGame: (configs: PlayerConfig[] | number, options?: GameOptions, customBoard?: Board) => void;
  drawTerrainCard: () => void;
  placeSettlement: (coord: AxialCoord) => void;
  endTurn: () => void;
  selectCell: (coord: AxialCoord | null) => void;
  triggerBotTurn: () => void;
  activateTile: (location: Location) => void;
  cancelTile: () => void;
  applyTilePlacement: (coord: AxialCoord) => void;
  selectTileMoveSource: (from: AxialCoord) => void;
  applyTileMove: (to: AxialCoord) => void;
  undoLastAction: () => void;
  loadSavedGame: () => void;
}

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────

const SETTLEMENTS_PER_TURN = 3;
const TOTAL_SETTLEMENTS_PER_PLAYER = 40;

// Tracks how many consecutive turns have ended with 0 placements (bot stuck).
// When all players skip consecutively, it signals the board is unreachable and
// we should force a game-over rather than loop forever.
let _consecutiveEmptyTurns = 0;

const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Cyan
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
];

const BOT_PLACEMENT_TILES = new Set<Location>([
  Location.Farm,
  Location.Harbor,
  Location.Oasis,
  Location.Tower,
  Location.Oracle,
  Location.Tavern,
]);

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

function chooseBotTilePlacement(
  board: Board,
  playerId: number,
  location: Location,
  currentTerrain?: Terrain,
): AxialCoord | null {
  // currentTerrain needed for Oracle (places on the played terrain card's terrain).
  const options = getExtraPlacementPositions(location, board, playerId, currentTerrain);
  if (options.length === 0) return null;

  return [...options].sort((a, b) => {
    const scoreDelta = evaluateMove(board, b, playerId) - evaluateMove(board, a, playerId);
    if (scoreDelta !== 0) return scoreDelta;
    if (a.r !== b.r) return a.r - b.r;
    return a.q - b.q;
  })[0] ?? null;
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
 * Mutates `player.tiles` and `acquiredLocations` in place; returns the updated list
 * together with metadata about what was acquired (for undo support).
 */
function applyTileAcquisition(
  board: Board,
  coord: AxialCoord,
  player: Player,
  acquiredLocations: string[]
): {
  updatedAcquiredLocations: string[];
  acquiredLocationKeys: string[];
  acquiredTileLocs: Location[];
} {
  const updated = [...acquiredLocations];
  const acquiredSet = new Set(updated);
  const acquiredLocationKeys: string[] = [];
  const acquiredTileLocs: Location[] = [];

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
      acquiredLocationKeys.push(key);
      acquiredTileLocs.push(cell.location);
      player.tiles.push({ location: cell.location, usedThisTurn: false });
    }
  }

  return { updatedAcquiredLocations: updated, acquiredLocationKeys, acquiredTileLocs };
}

// ────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────

export const gameStore = create<GameState>((set, get) => ({
  board: createDefaultBoard(),
  players: [],
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
  placementsThisTurn: [],
  activeTile: null,
  tileMoveSources: [],
  tileMoveFrom: null,
  tileMoveDestinations: [],
  history: [],
  canUndo: false,
  undoStack: [],
  turnNumber: 1,
  gameOptions: { boardSize: 'large', objectiveCount: 3, enableUndo: true },

  // ── Init ────────────────────────────────────────────
  initGame: (configs: PlayerConfig[] | number, options?: GameOptions, customBoard?: Board) => {
    _consecutiveEmptyTurns = 0;
    let playerConfigs: PlayerConfig[];

    if (typeof configs === 'number') {
      const playerCount = configs;
      if (playerCount < 2 || playerCount > 4) {
        console.error('Player count must be between 2 and 4');
        return;
      }
      playerConfigs = Array.from({ length: playerCount }, (_, i) => ({
        name: `Player ${i + 1}`,
        type: 'human' as const,
        difficulty: BotDifficulty.Medium,
      }));
    } else {
      if (configs.length < 2 || configs.length > 4) {
        console.error('Player count must be between 2 and 4');
        return;
      }
      playerConfigs = configs;
    }

    const resolvedOptions: GameOptions = options ?? {
      boardSize: 'large',
      objectiveCount: 3,
      enableUndo: true,
    };

    const players: Player[] = playerConfigs.map((cfg, i) => ({
      id: i + 1,
      name: cfg.name,
      color: PLAYER_COLORS[i],
      settlements: [],
      remainingSettlements: TOTAL_SETTLEMENTS_PER_PLAYER,
      tiles: [],
      isBot: cfg.type === 'bot',
      difficulty: cfg.difficulty,
    }));

    set({
      board:
        customBoard ??
        (resolvedOptions.boardSize === 'large'
          ? createModularBoard({ seed: resolvedOptions.mapSeed })
          : createBoardForSize(resolvedOptions.boardSize)),
      players,
      currentPlayerIndex: 0,
      phase: GamePhase.DrawCard,
      currentTerrainCard: null,
      remainingPlacements: 0,
      deck: shuffleDeck(createTerrainDeck()),
      acquiredLocations: [],
      objectiveCards: selectObjectiveCards(resolvedOptions.objectiveCount),
      finalScores: [],
      selectedCell: null,
      validPlacements: [],
      history: [],
      canUndo: false,
      undoStack: [],
      turnNumber: 1,
      gameOptions: resolvedOptions,
      ...resetTileState(),
    });

    // If first player is a bot, start its turn automatically
    if (players[0].isBot) {
      setTimeout(() => get().triggerBotTurn(), 800);
    }
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

    const validPlacements = card
      ? getValidPlacements(
        state.board,
        card.terrain,
        state.players[state.currentPlayerIndex].id,
        []
      )
      : [];

    // If no valid placements available, skip directly to EndTurn phase
    if (validPlacements.length === 0) {
      set({
        currentTerrainCard: card,
        deck: remainingDeck,
        phase: GamePhase.EndTurn,
        remainingPlacements: SETTLEMENTS_PER_TURN,
        placementsThisTurn: [],
        validPlacements: [],
        undoStack: [],
      });
      return;
    }

    set({
      currentTerrainCard: card,
      deck: remainingDeck,
      phase: GamePhase.PlaceSettlements,
      remainingPlacements: SETTLEMENTS_PER_TURN,
      placementsThisTurn: [],
      validPlacements,
      undoStack: [],
    });
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

    const { updatedAcquiredLocations, acquiredLocationKeys, acquiredTileLocs } =
      applyTileAcquisition(state.board, coord, currentPlayer, state.acquiredLocations);

    const newRemaining = state.remainingPlacements - 1;
    const updatedPlacementsThisTurn = [...state.placementsThisTurn, coord];

    // Record the action in history
    const action: GameAction = {
      type: 'PLACE_SETTLEMENT',
      playerId: currentPlayer.id,
      turnNumber: state.turnNumber,
      hex: coord,
      acquiredTile: acquiredTileLocs.length > 0 ? acquiredTileLocs[0] : undefined,
      timestamp: Date.now(),
    };

    // Build undo snapshot for this action and push onto the stack
    const snapshot: UndoSnapshot = {
      type: 'PLACE_SETTLEMENT',
      coord,
      previousRemainingPlacements: state.remainingPlacements,
      previousPhase: state.phase,
      acquiredLocationKeys,
      acquiredTileLocs,
      previousPlacementsThisTurn: state.placementsThisTurn,
    };

    const newUndoStack = [...state.undoStack, snapshot];
    const enableUndo = state.gameOptions.enableUndo;

    if (newRemaining === 0) {
      set({
        remainingPlacements: 0,
        phase: GamePhase.EndTurn,
        validPlacements: [],
        placementsThisTurn: updatedPlacementsThisTurn,
        selectedCell: null,
        acquiredLocations: updatedAcquiredLocations,
        history: [...state.history, action],
        undoStack: newUndoStack,
        canUndo: enableUndo,
        ...resetTileState(),
      });
    } else {
      const nextValidPlacements = getValidPlacements(
        state.board,
        state.currentTerrainCard.terrain,
        currentPlayer.id,
        updatedPlacementsThisTurn
      );

      // If no more valid placements available, skip to EndTurn phase
      if (nextValidPlacements.length === 0) {
        set({
          remainingPlacements: newRemaining,
          placementsThisTurn: updatedPlacementsThisTurn,
          phase: GamePhase.EndTurn,
          validPlacements: [],
          selectedCell: null,
          acquiredLocations: updatedAcquiredLocations,
          history: [...state.history, action],
          undoStack: newUndoStack,
          canUndo: enableUndo,
          ...resetTileState(),
        });
      } else {
        set({
          remainingPlacements: newRemaining,
          placementsThisTurn: updatedPlacementsThisTurn,
          validPlacements: nextValidPlacements,
          selectedCell: null,
          acquiredLocations: updatedAcquiredLocations,
          history: [...state.history, action],
          undoStack: newUndoStack,
          canUndo: enableUndo,
        });
      }
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
    const nextTurnNumber = state.turnNumber + 1;

    // Per spec: game ends when ANY player runs out of settlements
    // (Kingdom Builder rule: "任一玩家用完所有 40 間房屋")
    // Also end when the board is completely full so bots cannot deadlock.
    const boardFull = !state.board.getAllCells().some(
      cell => isBuildable(cell.terrain) && cell.settlement === undefined
    );
    if (state.players.some(p => p.remainingSettlements <= 0) || boardFull) {
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
        canUndo: false,
        undoStack: [],
        turnNumber: nextTurnNumber,
        ...resetTileState(),
      });

      // Save a replay record for the completed game.
      // Import lazily to avoid circular dependency between stores.
      import('./replayStore').then(({ useReplayStore }) => {
        const { players, history, objectiveCards } = get();
        const winner = [...finalScores].sort((a, b) => b.totalScore - a.totalScore)[0];
        const winnerPlayer = players.find((p) => p.id === winner?.playerId);
        useReplayStore.getState().saveReplay({
          players: players.map(({ id, name, color }) => ({ id, name, color })),
          history: [...history],
          finalScores: [...finalScores],
          objectiveCards: [...objectiveCards],
          winnerName: winnerPlayer?.name ?? '',
        });
      });
    } else {
      set({
        currentPlayerIndex: nextPlayerIndex,
        phase: GamePhase.DrawCard,
        currentTerrainCard: null,
        validPlacements: [],
        canUndo: false,
        undoStack: [],
        turnNumber: nextTurnNumber,
        ...resetTileState(),
      });

      // If the next player is a bot, auto-trigger its turn
      const nextPlayer = get().players[nextPlayerIndex];
      if (nextPlayer.isBot) {
        setTimeout(() => get().triggerBotTurn(), 800);
      }
    }
  },

  // ── Select cell ────────────────────────────────────
  selectCell: (coord: AxialCoord | null) => {
    set({ selectedCell: coord });
  },

  // ── Trigger bot turn ────────────────────────────────
  triggerBotTurn: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer?.isBot) return;
    if (state.phase !== GamePhase.DrawCard) return;

    // 1. Draw a terrain card (synchronous state update)
    get().drawTerrainCard();

    // 2. Compute best placements from the now-updated state
    const afterDraw = get();
    if (!afterDraw.currentTerrainCard) return;

    const moves = selectBestMoves(
      afterDraw.board,
      afterDraw.currentTerrainCard.terrain,
      currentPlayer.id,
      currentPlayer.difficulty,
      SETTLEMENTS_PER_TURN,
      {
        objectiveCards: afterDraw.objectiveCards,
        opponentIds: afterDraw.players
          .filter(p => p.id !== currentPlayer.id)
          .map(p => p.id),
      }
    );

    // 3. Place each settlement with a short stagger so the UI can update
    const STEP_MS = 400;
    moves.forEach((coord, i) => {
      setTimeout(() => get().placeSettlement(coord), STEP_MS * (i + 1));
    });

    // 4. End the turn after all placements have been dispatched.
    // If the bot has fewer moves than SETTLEMENTS_PER_TURN (e.g. no valid
    // placements for the drawn terrain), the game will remain in
    // PlaceSettlements phase because placeSettlement only transitions to
    // EndTurn once remainingPlacements reaches 0.  Force the transition so
    // the game never gets stuck.
    setTimeout(() => {
      const s = get();
      if (s.phase === GamePhase.PlaceSettlements) {
        // Bot could not fill all placements — force phase to EndTurn so the
        // turn can complete normally.
        _consecutiveEmptyTurns++;
        // If every player has been stuck for a full round, the board has no
        // reachable placements left.  Force remaining settlements to 0 on the
        // stuck player so endTurn() can trigger game-over.
        const numPlayers = s.players.length;
        if (_consecutiveEmptyTurns >= numPlayers) {
          const stuckPlayer = s.players[s.currentPlayerIndex];
          if (stuckPlayer) stuckPlayer.remainingSettlements = 0;
        }
        set({ phase: GamePhase.EndTurn, remainingPlacements: 0, validPlacements: [] });
      } else {
        _consecutiveEmptyTurns = 0;
      }

      const botTurnState = get();
      const botPlayer = botTurnState.players[botTurnState.currentPlayerIndex];
      if (botPlayer?.isBot) {
        for (const tile of [...botPlayer.tiles]) {
          const latest = get();
          const latestPlayer = latest.players[latest.currentPlayerIndex];
          if (!latestPlayer?.isBot || latestPlayer.remainingSettlements <= 0) break;
          if (latest.phase !== GamePhase.EndTurn && latest.phase !== GamePhase.PlaceSettlements) break;
          if (tile.usedThisTurn || !BOT_PLACEMENT_TILES.has(tile.location)) continue;

          const coord = chooseBotTilePlacement(
            latest.board,
            latestPlayer.id,
            tile.location,
            latest.currentTerrainCard?.terrain,
          );
          if (!coord) continue;

          get().activateTile(tile.location);
          const activated = get();
          const validCoord = activated.validPlacements.find(
            c => c.q === coord.q && c.r === coord.r
          );
          if (validCoord) {
            get().applyTilePlacement(validCoord);
          } else {
            get().cancelTile();
          }
        }
      }

      get().endTurn();
    }, STEP_MS * (moves.length + 1));
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
          currentPlayer.id,
          state.currentTerrainCard?.terrain
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
        : [];

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

    const tileLocation = state.activeTile;
    const tileIdx = currentPlayer.tiles.findIndex(
      t => t.location === tileLocation && !t.usedThisTurn
    );
    const tile = tileIdx !== -1 ? currentPlayer.tiles[tileIdx] : undefined;
    if (tile) tile.usedThisTurn = true;

    const { updatedAcquiredLocations, acquiredLocationKeys, acquiredTileLocs } =
      applyTileAcquisition(state.board, coord, currentPlayer, state.acquiredLocations);

    const restoredValid =
      state.phase === GamePhase.PlaceSettlements && state.currentTerrainCard
        ? getValidPlacements(
          state.board,
          state.currentTerrainCard.terrain,
          currentPlayer.id
        )
        : [];

    const action: GameAction = {
      type: 'TILE_PLACEMENT',
      playerId: currentPlayer.id,
      turnNumber: state.turnNumber,
      hex: coord,
      tile: tileLocation,
      acquiredTile: acquiredTileLocs.length > 0 ? acquiredTileLocs[0] : undefined,
      timestamp: Date.now(),
    };

    const snapshot: UndoSnapshot = {
      type: 'TILE_PLACEMENT',
      coord,
      previousRemainingPlacements: state.remainingPlacements,
      previousPhase: state.phase,
      acquiredLocationKeys,
      acquiredTileLocs,
      tileUsed: tileLocation,
      tileUsedIndex: tileIdx !== -1 ? tileIdx : undefined,
      previousPlacementsThisTurn: state.placementsThisTurn,
    };

    set({
      acquiredLocations: updatedAcquiredLocations,
      history: [...state.history, action],
      undoStack: [...state.undoStack, snapshot],
      canUndo: state.gameOptions.enableUndo,
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

    const fromCoord = state.tileMoveFrom;
    const tileLocation = state.activeTile;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (
      !executeMoveTile(
        tileLocation,
        state.board,
        currentPlayer.id,
        fromCoord,
        to
      )
    )
      return;

    // Update player settlements list
    const fromKey = hexToKey(fromCoord);
    const idx = currentPlayer.settlements.findIndex(s => hexToKey(s) === fromKey);
    if (idx !== -1) currentPlayer.settlements[idx] = to;

    const tileIdx = currentPlayer.tiles.findIndex(
      t => t.location === tileLocation && !t.usedThisTurn
    );
    const tile = tileIdx !== -1 ? currentPlayer.tiles[tileIdx] : undefined;
    if (tile) tile.usedThisTurn = true;

    const restoredValid =
      state.phase === GamePhase.PlaceSettlements && state.currentTerrainCard
        ? getValidPlacements(
          state.board,
          state.currentTerrainCard.terrain,
          currentPlayer.id
        )
        : [];

    const action: GameAction = {
      type: 'TILE_MOVE',
      playerId: currentPlayer.id,
      turnNumber: state.turnNumber,
      fromHex: fromCoord,
      toHex: to,
      tile: tileLocation,
      timestamp: Date.now(),
    };

    const snapshot: UndoSnapshot = {
      type: 'TILE_MOVE',
      fromCoord,
      toCoord: to,
      previousRemainingPlacements: state.remainingPlacements,
      previousPhase: state.phase,
      acquiredLocationKeys: [],
      acquiredTileLocs: [],
      tileUsed: tileLocation,
      tileUsedIndex: tileIdx !== -1 ? tileIdx : undefined,
      movedSettlementIdx: idx !== -1 ? idx : undefined,
      previousPlacementsThisTurn: state.placementsThisTurn,
    };

    set({
      history: [...state.history, action],
      undoStack: [...state.undoStack, snapshot],
      canUndo: state.gameOptions.enableUndo,
      ...resetTileState(),
      validPlacements: restoredValid,
    });
  },

  // ── Undo last action ───────────────────────────────
  undoLastAction: () => {
    const state = get();
    if (!state.canUndo || state.undoStack.length === 0) return;

    // Pop the top snapshot (most recent action)
    const snap = state.undoStack[state.undoStack.length - 1];
    const newStack = state.undoStack.slice(0, -1);
    const currentPlayer = state.players[state.currentPlayerIndex];
    const enableUndo = state.gameOptions.enableUndo;

    if (snap.type === 'PLACE_SETTLEMENT' && snap.coord) {
      // Remove settlement from board
      const cell = state.board.getCell(snap.coord);
      if (cell) cell.settlement = undefined;

      // Remove from player.settlements
      const coordKey = hexToKey(snap.coord);
      currentPlayer.settlements = currentPlayer.settlements.filter(
        s => hexToKey(s) !== coordKey
      );
      currentPlayer.remainingSettlements++;

      // Remove newly acquired tiles
      if (snap.acquiredTileLocs.length > 0) {
        currentPlayer.tiles = currentPlayer.tiles.slice(
          0,
          currentPlayer.tiles.length - snap.acquiredTileLocs.length
        );
      }

      // Restore acquiredLocations
      const restoredAcquired = state.acquiredLocations.filter(
        key => !snap.acquiredLocationKeys.includes(key)
      );

      // Restore placementsThisTurn (backwards-compat: old snapshots lack the field)
      const restoredPlacementsThisTurn =
        snap.previousPlacementsThisTurn ?? state.placementsThisTurn.slice(0, -1);

      // Restore validPlacements using the restored placementsThisTurn
      const restoredValid =
        state.currentTerrainCard
          ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            currentPlayer.id,
            restoredPlacementsThisTurn
          )
          : [];

      set({
        remainingPlacements: snap.previousRemainingPlacements,
        phase: snap.previousPhase,
        acquiredLocations: restoredAcquired,
        placementsThisTurn: restoredPlacementsThisTurn,
        validPlacements: restoredValid,
        undoStack: newStack,
        canUndo: enableUndo && newStack.length > 0,
        history: state.history.slice(0, -1),
        selectedCell: null,
      });
    } else if (snap.type === 'TILE_PLACEMENT' && snap.coord) {
      // Remove settlement from board
      const cell = state.board.getCell(snap.coord);
      if (cell) cell.settlement = undefined;

      // Remove from player.settlements
      const coordKey = hexToKey(snap.coord);
      currentPlayer.settlements = currentPlayer.settlements.filter(
        s => hexToKey(s) !== coordKey
      );
      currentPlayer.remainingSettlements++;

      // Un-mark tile as used.
      // Prefer tileUsedIndex for exact instance lookup (fixes duplicate-location
      // bug #125). Fall back to .find() for old snapshots that lack the field
      // (backwards-compat: snapshots from localStorage before this fix).
      if (snap.tileUsed) {
        const usedTile =
          snap.tileUsedIndex !== undefined
            ? currentPlayer.tiles[snap.tileUsedIndex]
            : currentPlayer.tiles.find(t => t.location === snap.tileUsed);
        if (usedTile) usedTile.usedThisTurn = false;
      }

      // Remove newly acquired tiles
      if (snap.acquiredTileLocs.length > 0) {
        currentPlayer.tiles = currentPlayer.tiles.slice(
          0,
          currentPlayer.tiles.length - snap.acquiredTileLocs.length
        );
      }

      const restoredAcquired = state.acquiredLocations.filter(
        key => !snap.acquiredLocationKeys.includes(key)
      );

      const restoredPlacementsThisTurn =
        snap.previousPlacementsThisTurn ?? state.placementsThisTurn;

      const restoredValid =
        state.currentTerrainCard
          ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            currentPlayer.id,
            restoredPlacementsThisTurn
          )
          : [];

      set({
        remainingPlacements: snap.previousRemainingPlacements,
        phase: snap.previousPhase,
        acquiredLocations: restoredAcquired,
        placementsThisTurn: restoredPlacementsThisTurn,
        validPlacements: restoredValid,
        undoStack: newStack,
        canUndo: enableUndo && newStack.length > 0,
        history: state.history.slice(0, -1),
        selectedCell: null,
      });
    } else if (
      snap.type === 'TILE_MOVE' &&
      snap.fromCoord &&
      snap.toCoord
    ) {
      // Reverse the move: put the settlement back at fromCoord, remove from toCoord
      const toCell = state.board.getCell(snap.toCoord);
      if (toCell) toCell.settlement = undefined;
      const fromCell = state.board.getCell(snap.fromCoord);
      if (fromCell) fromCell.settlement = currentPlayer.id;

      // Restore settlements array
      if (snap.movedSettlementIdx !== undefined) {
        currentPlayer.settlements[snap.movedSettlementIdx] = snap.fromCoord;
      }

      // Un-mark tile as used.
      // Prefer tileUsedIndex for exact instance lookup (fixes duplicate-location
      // bug #125). Fall back to .find() for old snapshots that lack the field
      // (backwards-compat: snapshots from localStorage before this fix).
      if (snap.tileUsed) {
        const usedTile =
          snap.tileUsedIndex !== undefined
            ? currentPlayer.tiles[snap.tileUsedIndex]
            : currentPlayer.tiles.find(t => t.location === snap.tileUsed);
        if (usedTile) usedTile.usedThisTurn = false;
      }

      const restoredPlacementsThisTurn =
        snap.previousPlacementsThisTurn ?? state.placementsThisTurn;

      const restoredValid =
        state.currentTerrainCard
          ? getValidPlacements(
            state.board,
            state.currentTerrainCard.terrain,
            currentPlayer.id,
            restoredPlacementsThisTurn
          )
          : [];

      set({
        remainingPlacements: snap.previousRemainingPlacements,
        phase: snap.previousPhase,
        placementsThisTurn: restoredPlacementsThisTurn,
        validPlacements: restoredValid,
        undoStack: newStack,
        canUndo: enableUndo && newStack.length > 0,
        history: state.history.slice(0, -1),
        selectedCell: null,
      });
    }
  },

  // ── Load saved game ────────────────────────────────
  loadSavedGame: () => {
    const saved = loadGame();
    if (saved) {
      set(saved);

      // Fix phase if hydrated state is inconsistent:
      // If phase=PlaceSettlements but no valid placements, should be EndTurn
      const state = get();
      if (
        state.phase === GamePhase.PlaceSettlements &&
        state.validPlacements.length === 0
      ) {
        set({ phase: GamePhase.EndTurn });
      }
    }
  },
}));

// Auto-save: subscribe to state changes and persist (debounced)
const METHOD_KEYS: (keyof GameState)[] = [
  'initGame',
  'drawTerrainCard',
  'placeSettlement',
  'endTurn',
  'selectCell',
  'triggerBotTurn',
  'activateTile',
  'cancelTile',
  'applyTilePlacement',
  'selectTileMoveSource',
  'applyTileMove',
  'undoLastAction',
  'loadSavedGame',
];

let saveTimer: ReturnType<typeof setTimeout> | undefined;

gameStore.subscribe((state) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const serializableState = Object.fromEntries(
      (Object.keys(state) as (keyof GameState)[])
        .filter(k => !METHOD_KEYS.includes(k))
        .map(k => [k, state[k]])
    ) as unknown as SerializableGameState;
    saveGame(serializableState);
  }, 300);
});

export const useGameStore = gameStore;

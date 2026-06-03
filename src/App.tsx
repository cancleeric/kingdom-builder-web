import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from './store/gameStore'
import { HexGrid } from './components/Board/HexGrid'
import { GameOver } from './components/Game/GameOver'
import { GameLog } from './components/Game/GameLog'
import { BottomDrawer } from './components/Mobile/BottomDrawer'
import { GameSetup } from './components/Game/GameSetup'
import { MultiplayerSetup } from './components/Game/MultiplayerSetup'
import { MainMenu } from './components/Menu/MainMenu'
import { TutorialOverlay } from './components/Tutorial/TutorialOverlay'
import { OnboardingPromptModal } from './components/Tutorial/OnboardingPromptModal'
import { QuitToMenuConfirmModal } from './components/Game/QuitToMenuConfirmModal'
import { NewGameOverwriteConfirmModal } from './components/Game/NewGameOverwriteConfirmModal'
import { loadGame } from './store/persistence'
import { useTutorialStore } from './store/tutorialStore'
import { TurnBanner } from './components/Game/TurnBanner'
import { ObjectiveCardBadge } from './components/Game/ObjectiveCardBadge'
import { LocationTileCard, LocationTileIcon } from './components/Game/LocationTileCard'
import { GamePhase } from './types'
import type { PlayerConfig, GameOptions } from './types'
import type { Board } from './core/board'
import { Location, isBuildable } from './core/terrain'
import { scoreCastle, scoreObjectiveCard } from './core/scoring'
import { initAudio, playSound, isMuted, setMuted, SoundType } from './utils/soundEngine'
import { InstallPrompt } from './components/InstallPrompt'
import { useMultiplayerStore } from './store/multiplayerStore'
import { extractSerializableState } from './multiplayer/stateSerializer'
import type { MultiplayerAction } from './multiplayer/types'
import { useTranslation } from 'react-i18next'
import { tObjective, tPhase, tTerrain } from './i18n/formatters'
import { LeaderboardModal } from './components/Game/LeaderboardModal'
import { useLeaderboardStore } from './store/leaderboardStore'
import { ReplayModal } from './components/Game/ReplayModal'
import { AchievementPanel } from './components/Game/AchievementPanel'
import { AchievementToast } from './components/Game/AchievementToast'
import { InvalidHintToast } from './components/Game/InvalidHintToast'
import { useAchievementStore, getUnlockedCount } from './store/achievementStore'
import { SeasonBanner } from './components/Game/SeasonBanner'
import { SeasonHistory } from './components/Game/SeasonHistory'
import { TerrainSwatch } from './components/Game/TerrainSwatch'
import { BoardFrameOverlay } from './components/Board/BoardFrameOverlay'
import { useSeasonStore } from './store/seasonStore'
import { MapEditorPage } from './components/MapEditor/MapEditorPage'
import {
  MutedIcon,
  UnmutedIcon,
  BotIcon,
  MoreIcon,
  LeaderboardIcon,
  ReplayIcon,
  ChevronIcon,
  DrawCardIcon,
  EndTurnIcon,
  UndoIcon,
  AchievementIcon,
  ExitIcon,
} from './components/icons'

const STATE_BROADCAST_DEBOUNCE_MS = 50;

/**
 * Lightweight hook that returns the value from the previous render.
 * Used to detect score increases for the scorePopIn animation.
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

interface ScoreRowProps {
  playerId: number;
  playerName: string | undefined;
  playerColor: string;
  total: number;
  isLeader: boolean;
  summaryText: string;
  pointsLabel: string;
}

/**
 * Score row with pop animation when total increases.
 * Using a component so usePrevious can be called per-player safely.
 */
function ScoreRow({ playerId, playerName, playerColor, total, isLeader, summaryText, pointsLabel }: ScoreRowProps) {
  const prevTotal = usePrevious(total);
  const increased = prevTotal !== undefined && total > prevTotal;

  return (
    <div
      key={playerId}
      className="rounded-lg p-2"
      style={{
        border: `2px solid ${isLeader ? 'var(--color-amber-400)' : 'var(--card-border)'}`,
        backgroundColor: isLeader ? 'oklch(0.97 0.02 80)' : 'var(--color-warm-cream-50)',
      }}
    >
      <div className="flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: playerColor }}
            aria-hidden="true"
          />
          <span style={{ color: 'var(--color-text)' }}>{playerName}</span>
          {isLeader && (
            <span className="text-xs" title="Leading">★</span>
          )}
        </div>
        <span
          key={increased ? `${playerId}-${total}` : playerId}
          className={increased ? 'animate-score-pop font-bold' : 'font-bold'}
          style={{ color: isLeader ? 'var(--color-amber-700)' : 'var(--color-text)' }}
        >
          {total} {pointsLabel}
        </span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone-400)' }}>
        {summaryText}
      </p>
    </div>
  );
}

/**
 * R30: Derive a human-readable hint message explaining why a cell is invalid.
 * Pure function — reads gameStore via getState() (safe in event handler context,
 * does NOT subscribe and will NOT cause re-renders).
 * Only imports isBuildable for read-only terrain check; never touches rules.ts actions.
 */
function deriveInvalidHint(
  coord: { q: number; r: number },
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const { board, currentTerrainCard, placementsThisTurn } = useGameStore.getState();
  if (!board || !currentTerrainCard) return t('hint.invalid.not_valid');

  const cell = board.getCell(coord);
  if (!cell) return t('hint.invalid.not_valid');

  // Priority 1: cell already occupied
  if (cell.settlement !== undefined) {
    return t('hint.invalid.occupied');
  }

  // Priority 2: unbuildable terrain (Mountain / Water)
  if (!isBuildable(cell.terrain)) {
    return t('hint.invalid.terrain_unbuildable', { terrain: tTerrain(t, cell.terrain) });
  }

  // Priority 3: terrain doesn't match current card
  if (cell.terrain !== currentTerrainCard.terrain) {
    return t('hint.invalid.wrong_terrain', { terrain: tTerrain(t, currentTerrainCard.terrain) });
  }

  // Priority 4: adjacency rule (subsequent placements must be adjacent to earlier ones)
  if (placementsThisTurn.length > 0) {
    return t('hint.invalid.must_be_adjacent');
  }

  return t('hint.invalid.not_valid');
}

function App() {
  const { t, i18n } = useTranslation();
  const [muted, setMutedState] = useState(isMuted);
  const [gameStarted, setGameStarted] = useState(false);
  const [menuMode, setMenuMode] = useState<'home' | 'setup' | 'multiplayer' | 'map-editor'>('home');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [seasonHistoryOpen, setSeasonHistoryOpen] = useState(false);
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [newGameConfirmOpen, setNewGameConfirmOpen] = useState(false);
  const pendingStartRef = useRef<{
    configs: PlayerConfig[];
    options: GameOptions;
    customBoard?: Board;
  } | null>(null);
  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedGameKeyRef = useRef<string | null>(null);

  const {
    board,
    players,
    currentPlayerIndex,
    phase,
    currentTerrainCard,
    remainingPlacements,
    validPlacements,
    selectedCell,
    objectiveCards,
    finalScores,
    activeTile,
    tileMoveSources,
    tileMoveFrom,
    tileMoveDestinations,
    history,
    canUndo,
    turnNumber,
    initGame,
    drawTerrainCard,
    placeSettlement,
    endTurn,
    selectCell,
    activateTile,
    cancelTile,
    applyTilePlacement,
    selectTileMoveSource,
    applyTileMove,
    undoLastAction,
  } = useGameStore(useShallow((s) => ({
    board: s.board,
    players: s.players,
    currentPlayerIndex: s.currentPlayerIndex,
    phase: s.phase,
    currentTerrainCard: s.currentTerrainCard,
    remainingPlacements: s.remainingPlacements,
    validPlacements: s.validPlacements,
    selectedCell: s.selectedCell,
    objectiveCards: s.objectiveCards,
    finalScores: s.finalScores,
    activeTile: s.activeTile,
    tileMoveSources: s.tileMoveSources,
    tileMoveFrom: s.tileMoveFrom,
    tileMoveDestinations: s.tileMoveDestinations,
    history: s.history,
    canUndo: s.canUndo,
    turnNumber: s.turnNumber,
    initGame: s.initGame,
    drawTerrainCard: s.drawTerrainCard,
    placeSettlement: s.placeSettlement,
    endTurn: s.endTurn,
    selectCell: s.selectCell,
    activateTile: s.activateTile,
    cancelTile: s.cancelTile,
    applyTilePlacement: s.applyTilePlacement,
    selectTileMoveSource: s.selectTileMoveSource,
    applyTileMove: s.applyTileMove,
    undoLastAction: s.undoLastAction,
  })))

  const multiplayerMode = useMultiplayerStore((s) => s.mode);
  const multiplayerRoom = useMultiplayerStore((s) => s.room);
  const multiplayerConnectionStatus = useMultiplayerStore((s) => s.connectionStatus);
  const multiplayerLocalPlayerId = useMultiplayerStore((s) => s.localPlayerId);
  const sendPlayerAction = useMultiplayerStore((s) => s.sendPlayerAction);
  const sendStateUpdate = useMultiplayerStore((s) => s.sendStateUpdate);
  const leaveRoom = useMultiplayerStore((s) => s.leaveRoom);
  const submitGameScores = useLeaderboardStore((s) => s.submitGameScores);
  const recordGameEnd = useAchievementStore((s) => s.recordGameEnd);
  const achievementUnlockedCount = useAchievementStore((s) => getUnlockedCount(s.achievements));
  const checkAndRotateSeason = useSeasonStore((s) => s.checkAndRotateSeason);

  // Bottom drawer state (mobile only)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sidebar collapsed state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // More menu (Header ⋯ button)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  // Quit-to-menu confirmation modal
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false)

  const _doStartGame = (configs: PlayerConfig[], options: GameOptions, customBoard?: Board) => {
    initGame(configs, options, customBoard);
    setGameStarted(true);
    // First-time player onboarding prompt (single player only)
    const { hasCompleted } = useTutorialStore.getState();
    if (!hasCompleted && !isNetworkGame) {
      setShowOnboardingPrompt(true);
    }
  };

  const handleStart = (configs: PlayerConfig[], options: GameOptions, customBoard?: Board) => {
    // Guard: if a save exists, require confirmation before overwriting
    // (only single-player new game goes through handleStart;
    //  continue-game and multiplayer bypass this entirely)
    if (loadGame() !== null) {
      pendingStartRef.current = { configs, options, customBoard };
      setNewGameConfirmOpen(true);
      return;
    }
    _doStartGame(configs, options, customBoard);
  };

  const handleNewGameConfirm = () => {
    setNewGameConfirmOpen(false);
    if (pendingStartRef.current) {
      const { configs, options, customBoard } = pendingStartRef.current;
      pendingStartRef.current = null;
      _doStartGame(configs, options, customBoard);
    }
  };

  const handleNewGameCancel = () => {
    setNewGameConfirmOpen(false);
    pendingStartRef.current = null;
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    // Re-init audio on first unmute interaction
    if (!next) initAudio();
  };

  const currentPlayer = players[currentPlayerIndex]
  const isNetworkGame = multiplayerMode === 'in_game' && !!multiplayerRoom;
  const isHost = !!multiplayerRoom && multiplayerLocalPlayerId === multiplayerRoom.hostPlayerId;
  const isLocalTurn =
    !isNetworkGame || (!!currentPlayer && multiplayerLocalPlayerId === currentPlayer.id);
  const canControlActions =
    !isNetworkGame || (isLocalTurn && multiplayerConnectionStatus === 'connected');

  // Show "End Turn" button when in EndTurn phase OR when PlaceSettlements with no valid moves
  const shouldShowEndTurnButton =
    phase === GamePhase.EndTurn ||
    (phase === GamePhase.PlaceSettlements && validPlacements.length === 0);

  const runNetworkedAction = (localAction: () => void, networkAction: MultiplayerAction) => {
    if (isNetworkGame) {
      if (!isLocalTurn) return;
      if (isHost) {
        localAction();
      } else {
        sendPlayerAction(networkAction);
      }
      return;
    }
    localAction();
  };

  // Check and rotate season on startup
  useEffect(() => {
    checkAndRotateSeason();
  }, [checkAndRotateSeason]);

  // Play game over sound when phase changes to GameOver
  useEffect(() => {
    if (phase === GamePhase.GameOver) {
      playSound(SoundType.GAME_OVER);
    }
  }, [phase]);

  // TILE_GAIN: play sound when a new history entry contains an acquired tile
  const prevHistoryLenRef = useRef(history.length);

  useEffect(() => {
    const prev = prevHistoryLenRef.current;
    prevHistoryLenRef.current = history.length;
    if (history.length <= prev) return;           // 防 undo / reset
    const latest = history[history.length - 1];
    if (latest?.acquiredTile != null) {
      console.log('[sound] TILE_GAIN acquired:', latest.acquiredTile);
      playSound(SoundType.TILE_GAIN);
    }
  }, [history]);

  // TURN_END: play sound when turnNumber increases (but not on GameOver)
  const prevTurnNumberRef = useRef(turnNumber);

  useEffect(() => {
    if (turnNumber <= prevTurnNumberRef.current) {
      prevTurnNumberRef.current = turnNumber;
      return;
    }
    prevTurnNumberRef.current = turnNumber;
    if (phase !== GamePhase.GameOver) {
      console.log('[sound] TURN_END turn:', turnNumber);
      playSound(SoundType.TURN_END);
    }
  }, [turnNumber, phase]);

  useEffect(() => {
    if (phase !== GamePhase.GameOver || finalScores.length === 0 || players.length === 0) {
      submittedGameKeyRef.current = null;
      return;
    }

    const gameKey = [
      players.length,
      ...finalScores.map((score) => `${score.playerId}:${score.totalScore}`),
      ...objectiveCards,
    ].join('|');

    if (submittedGameKeyRef.current === gameKey) return;
    submitGameScores(finalScores, players, objectiveCards);
    submittedGameKeyRef.current = gameKey;

    // Record game-end data for achievement evaluation
    const humanPlayers = players.filter((p) => !p.isBot);
    const sortedScores = [...finalScores].sort((a, b) => b.totalScore - a.totalScore);
    const winnerId = sortedScores[0]?.playerId;
    const topHumanScore = humanPlayers.reduce((max, p) => {
      const s = finalScores.find((fs) => fs.playerId === p.id);
      return Math.max(max, s?.totalScore ?? 0);
    }, 0);
    const isWinner = humanPlayers.some((p) => p.id === winnerId);
    const winnerPlayer = players.find((p) => p.id === winnerId);
    const tilesAtEnd =
      isWinner && winnerPlayer && !winnerPlayer.isBot ? winnerPlayer.tiles.length : 0;
    const settlementsThisGame = humanPlayers.reduce(
      (sum, p) => sum + p.settlements.length,
      0
    );
    recordGameEnd({
      isWinner,
      topScore: topHumanScore,
      turnsPlayed: turnNumber - 1,
      tilesAtEnd,
      settlementsThisGame,
    });
  }, [finalScores, objectiveCards, phase, players, submitGameScores, recordGameEnd, turnNumber]);

  useEffect(() => {
    if (!isNetworkGame || !isHost || !multiplayerRoom?.gameStarted) return;
    const unsubscribe = useGameStore.subscribe(() => {
      if (broadcastTimerRef.current) {
        clearTimeout(broadcastTimerRef.current);
      }
      broadcastTimerRef.current = setTimeout(() => {
        sendStateUpdate(extractSerializableState());
      }, STATE_BROADCAST_DEBOUNCE_MS);
    });
    return () => {
      if (broadcastTimerRef.current) {
        clearTimeout(broadcastTimerRef.current);
        broadcastTimerRef.current = null;
      }
      unsubscribe();
    };
  }, [isNetworkGame, isHost, multiplayerRoom?.gameStarted, sendStateUpdate]);

  const handleCellClick = (coord: { q: number; r: number }) => {
    if (!canControlActions) return;
    if (activeTile) {
      const isMoveTile =
        activeTile === Location.Paddock || activeTile === Location.Barn

      if (isMoveTile) {
        if (!tileMoveFrom) {
          // First click: select source
          runNetworkedAction(
            () => selectTileMoveSource(coord),
            { type: 'select_tile_move_source', coord }
          )
        } else {
          // Second click: execute move
          runNetworkedAction(
            () => applyTileMove(coord),
            { type: 'apply_tile_move', coord }
          )
        }
      } else {
        runNetworkedAction(
          () => applyTilePlacement(coord),
          { type: 'apply_tile_placement', coord }
        )
      }
    } else if (phase === GamePhase.PlaceSettlements) {
      initAudio();
      runNetworkedAction(
        () => placeSettlement(coord),
        { type: 'place_settlement', coord }
      )
      useTutorialStore.getState().advanceTutorialIf('placeSettlement');
      playSound(SoundType.PLACE);
    }
  }

  // INVALID: play sound + show visual feedback when clicking a non-valid cell
  const invalidClickTimestampRef = useRef(0);
  const [invalidClickKey, setInvalidClickKey] = useState<string | null>(null);
  const [invalidHintMsg, setInvalidHintMsg] = useState<string | null>(null);
  const invalidHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInvalidCellClick = (coord: { q: number; r: number }) => {
    if (!canControlActions) return;
    if (phase !== GamePhase.PlaceSettlements) return;   // 只在放聚落相響
    const now = Date.now();
    if (now - invalidClickTimestampRef.current < 100) return;
    invalidClickTimestampRef.current = now;

    // 1. 保留既有音效
    playSound(SoundType.INVALID);

    // 2. 視覺 shake/flash
    setInvalidClickKey(`${coord.q},${coord.r}`);

    // 3. hint toast：推導無效原因，1800ms 後自動消失
    const hint = deriveInvalidHint(coord, t);
    if (invalidHintTimerRef.current) clearTimeout(invalidHintTimerRef.current);
    setInvalidHintMsg(hint);
    invalidHintTimerRef.current = setTimeout(() => setInvalidHintMsg(null), 1800);
  };

  const liveScores = players.map(p => ({
    playerId: p.id,
    castle: board ? scoreCastle(board, p.id) : 0,
    objectives: objectiveCards.map(card => ({
      card,
      score: board ? scoreObjectiveCard(card, board, p.id) : 0,
    })),
  }))
  const currentPlayerObjectiveScores =
    liveScores.find(playerScore => playerScore.playerId === currentPlayer?.id)?.objectives ?? []

  const handleEscape = () => {
    selectCell(null);
  };

  const handleRestart = () => {
    if (isNetworkGame) {
      leaveRoom();
      setMenuMode('multiplayer');
    } else {
      setMenuMode('setup');
    }
    setGameStarted(false);
  };

  const handleQuitToMenu = () => {
    if (isNetworkGame) {
      leaveRoom();
    }
    setMenuMode('home');
    setGameStarted(false);
  };

  const handleDrawTerrainCard = () => {
    runNetworkedAction(
      () => drawTerrainCard(),
      { type: 'draw_terrain_card' }
    );
    useTutorialStore.getState().advanceTutorialIf('drawCard');
  };

  const handleEndTurn = () => {
    runNetworkedAction(
      () => endTurn(),
      { type: 'end_turn' }
    );
    useTutorialStore.getState().advanceTutorialIf('endTurn');
  };

  const handleUndo = () => {
    runNetworkedAction(
      () => undoLastAction(),
      { type: 'undo_last_action' }
    );
  };

  const handleActivateTile = (location: Location) => {
    runNetworkedAction(
      () => activateTile(location),
      { type: 'activate_tile', location }
    );
  };

  const handleCancelTile = () => {
    runNetworkedAction(
      () => cancelTile(),
      { type: 'cancel_tile' }
    );
  };

  // Compose a live-region announcement for screen readers on turn changes
  const liveAnnouncement = currentPlayer
    ? currentTerrainCard
      ? t('app.liveAnnouncementWithTerrain', {
        player: currentPlayer.name,
        phase: tPhase(t, phase),
        terrain: tTerrain(t, currentTerrainCard.terrain),
        count: remainingPlacements,
      })
      : t('app.liveAnnouncement', {
        player: currentPlayer.name,
        phase: tPhase(t, phase),
      })
    : '';

  if (!gameStarted) {
    if (menuMode === 'map-editor') {
      return <MapEditorPage onBack={() => setMenuMode('home')} />;
    }

    if (menuMode === 'multiplayer') {
      return (
        <>
          <MultiplayerSetup
            onBack={() => setMenuMode('home')}
            onGameStarted={() => setGameStarted(true)}
          />
          <TutorialOverlay />
        </>
      );
    }

    if (menuMode === 'setup') {
      return (
        <>
          <GameSetup
            onStart={handleStart}
            onBack={() => setMenuMode('home')}
          />
          <TutorialOverlay />
          {/* New-game overwrite confirmation — rendered here because game hasn't started yet */}
          <NewGameOverwriteConfirmModal
            isOpen={newGameConfirmOpen}
            onConfirm={handleNewGameConfirm}
            onCancel={handleNewGameCancel}
          />
        </>
      );
    }

    // Home / Main Menu
    return (
      <>
        <SeasonBanner onOpenLeaderboard={() => setLeaderboardOpen(true)} />
        <MainMenu
          muted={muted}
          onToggleMute={handleToggleMute}
          onSinglePlayer={() => setMenuMode('setup')}
          onContinueGame={() => setGameStarted(true)}
          onMultiplayer={() => setMenuMode('multiplayer')}
          onLanguageChange={(lang) => void i18n.changeLanguage(lang)}
          onMapEditor={() => setMenuMode('map-editor')}
        />
        <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
        <SeasonHistory isOpen={seasonHistoryOpen} onClose={() => setSeasonHistoryOpen(false)} />
        <TutorialOverlay />
      </>
    );
  }

  // Compute highest live score for gold highlight
  const maxLiveScore = liveScores.reduce((max, ps) => {
    const total = ps.castle + ps.objectives.reduce((s, o) => s + o.score, 0)
    return Math.max(max, total)
  }, 0)

  return (
    <div
      className="w-screen h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <InstallPrompt />
      {/* Hidden ARIA live region for screen-reader turn announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* ── Header (精簡版) ── */}
      <header
        className="flex items-center justify-between px-4 py-2 shadow-md z-30 flex-shrink-0"
        style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--color-warm-cream-50)' }}
      >
        {/* App name */}
        <h1
          className="text-lg font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('common.appName')}
        </h1>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {isNetworkGame && multiplayerRoom && (
            <span className="hidden sm:inline-block text-xs px-2 py-1 rounded"
              style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
            >
              {t('app.roomStatus', { id: multiplayerRoom.id, status: multiplayerConnectionStatus })}
            </span>
          )}

          {/* Language selector */}
          <select
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            aria-label={t('common.language')}
            className="text-xs rounded px-2 py-1 border"
            style={{
              backgroundColor: 'oklch(0 0 0 / 0.2)',
              color: 'var(--color-warm-cream-50)',
              borderColor: 'oklch(1 0 0 / 0.25)',
            }}
          >
            <option value="en">{t('common.english')}</option>
            <option value="zh-TW">{t('common.traditionalChinese')}</option>
          </select>

          {/* Mute toggle */}
          <button
            onClick={handleToggleMute}
            aria-label={muted ? t('app.unmute') : t('app.mute')}
            title={muted ? t('app.unmute') : t('app.mute')}
            className="w-9 h-9 flex items-center justify-center rounded-full transition"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {muted ? <MutedIcon size={18} /> : <UnmutedIcon size={18} />}
          </button>

          {/* ⋯ More menu */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(o => !o)}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={moreMenuOpen}
              className="w-9 h-9 flex items-center justify-center rounded-full transition"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <MoreIcon size={18} />
            </button>

            {/* Dropdown menu */}
            {moreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                  role="menu"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-medium)',
                  }}
                >
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => { setSeasonHistoryOpen(true); setMoreMenuOpen(false); }}
                  >
                    {t('season.open')}
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => { setLeaderboardOpen(true); setMoreMenuOpen(false); }}
                  >
                    <LeaderboardIcon size={16} />
                    {t('leaderboard.open')}
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => { setReplayOpen(true); setMoreMenuOpen(false); }}
                  >
                    <ReplayIcon size={16} />
                    {t('replay.open')}
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: 'var(--color-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0 0 0 / 0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => { setAchievementOpen(true); setMoreMenuOpen(false); }}
                  >
                    <AchievementIcon size={16} />
                    {t('achievement.open')}
                    {achievementUnlockedCount > 0 && (
                      <span
                        className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--badge-bg)',
                          color: 'var(--badge-text)',
                        }}
                      >
                        {achievementUnlockedCount}
                      </span>
                    )}
                  </button>
                  {/* Divider */}
                  <div
                    role="separator"
                    aria-hidden="true"
                    style={{ borderTop: '1px solid var(--card-border)', margin: '4px 0' }}
                  />
                  {/* Quit to menu */}
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: 'var(--color-wine-600)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'oklch(0.95 0.01 30 / 0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => { setQuitConfirmOpen(true); setMoreMenuOpen(false); }}
                  >
                    <ExitIcon size={16} />
                    {t('quitConfirm.title')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Season banner — below header, above game area */}
      <SeasonBanner onOpenLeaderboard={() => setLeaderboardOpen(true)} />

      {/* ── Main Game Area ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Game Board column */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* TurnBanner – sticky above the board */}
          {phase !== GamePhase.GameOver && (
            <TurnBanner
              key={currentPlayer?.id}
              currentPlayer={currentPlayer}
              phase={phase}
              currentTerrainCard={currentTerrainCard}
              remainingPlacements={remainingPlacements}
              validPlacements={validPlacements}
              canControlActions={canControlActions}
              onDrawCard={handleDrawTerrainCard}
              onEndTurn={handleEndTurn}
              isCurrentPlayerBot={currentPlayer?.isBot ?? false}
            />
          )}

          {/* HexGrid */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              background: 'var(--board-bg-light)',
              boxShadow: 'var(--board-frame-shadow)',
            }}
          >
            {players.length > 0 && (
              <div className="w-full h-full" data-tutorial-target="hex-grid">
              <HexGrid
                board={board}
                validPlacements={
                  activeTile && (activeTile === Location.Paddock || activeTile === Location.Barn)
                    ? (tileMoveFrom ? tileMoveDestinations : tileMoveSources)
                    : validPlacements
                }
                selectedCell={selectedCell}
                players={players}
                onCellClick={handleCellClick}
                onCellSelect={selectCell}
                onEscape={handleEscape}
                onInvalidClick={handleInvalidCellClick}
                invalidClickKey={invalidClickKey}
              />
              </div>
            )}
            {/* 棋盤環境框裝飾 overlay（pointer-events:none，不攔截 pan/zoom） */}
            <BoardFrameOverlay />
          </div>

          {/* Mobile floating action bar (< md) — safe-area aware */}
          <div
            className="lg:hidden flex items-center gap-2 px-4 pt-3 pb-14 flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderTop: '1px solid var(--card-border)',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            }}
          >
            {phase === GamePhase.DrawCard && (
              <button
                onClick={handleDrawTerrainCard}
                disabled={!canControlActions}
                aria-label={t('app.drawTerrainCardAria')}
                data-tutorial-target="draw-card-button"
                className="flex-1 flex items-center justify-center gap-1.5 font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-text)',
                }}
              >
                <DrawCardIcon size={16} />
                {t('bottomDrawer.mobileFloating.draw')}
              </button>
            )}
            {(phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
              <button
                onClick={handleUndo}
                disabled={!canUndo || !canControlActions}
                aria-label={t('app.undo')}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-warning)',
                  color: 'var(--color-warm-cream-50)',
                }}
              >
                <UndoIcon size={16} />
                {t('bottomDrawer.mobileFloating.undo')}
              </button>
            )}
            {shouldShowEndTurnButton && (
              <button
                onClick={handleEndTurn}
                disabled={!canControlActions}
                aria-label={t('app.endTurnAria')}
                className="flex-1 flex items-center justify-center gap-1.5 font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-success)',
                  color: 'var(--button-text)',
                }}
              >
                <EndTurnIcon size={16} />
                {t('bottomDrawer.mobileFloating.endTurn')}
              </button>
            )}
            {/* Drawer toggle button */}
            <button
              onClick={() => setDrawerOpen(o => !o)}
              aria-label={drawerOpen ? t('bottomDrawer.closePanel') : t('bottomDrawer.openPanel')}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-warm-cream-200)',
                color: 'var(--color-text)',
              }}
            >
              <ChevronIcon size={18} style={{ transform: drawerOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
            </button>
          </div>
        </div>

        {/* ── Sidebar – hidden on mobile, visible on md+ ── */}
        <aside
          className={`hidden lg:flex flex-col overflow-hidden transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-12' : 'w-96'
            }`}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderLeft: '1px solid var(--card-border)',
            boxShadow: '-2px 0 8px oklch(0.25 0.01 90 / 0.08)',
          }}
          aria-label={t('app.gameInformation')}
        >
          {/* Sidebar collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
            className="flex items-center justify-center py-2 border-b transition hover:opacity-70 flex-shrink-0"
            style={{
              borderColor: 'var(--card-border)',
              color: 'var(--color-stone-600)',
            }}
          >
            <ChevronIcon
              size={16}
              style={{
                transform: sidebarCollapsed ? 'rotate(-90deg)' : 'rotate(90deg)',
                transition: 'transform 0.3s',
              }}
            />
          </button>

          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              {/* ── Group A: Current Terrain Card ── */}
              {(currentTerrainCard || phase === GamePhase.DrawCard) && (
                <section
                  aria-label={t('app.currentTerrainCardRegion')}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--color-warm-cream-100)',
                      color: 'var(--color-stone-600)',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    {t('sidebar.terrainCard')}
                  </div>
                  {currentTerrainCard ? (
                    <div
                      className="p-4 flex items-center gap-3"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      {/* Terrain icon — R27: mini hex swatch（TerrainSwatch），取代 emoji */}
                      <div className="flex-shrink-0">
                        <TerrainSwatch terrain={currentTerrainCard.terrain} size={56} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-2xl font-bold truncate"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
                        >
                          {tTerrain(t, currentTerrainCard.terrain)}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--progress-track)' }}
                            role="progressbar"
                            aria-valuenow={3 - remainingPlacements}
                            aria-valuemin={0}
                            aria-valuemax={3}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, ((3 - remainingPlacements) / 3) * 100)}%`,
                                backgroundColor: 'var(--progress-fill)',
                              }}
                            />
                          </div>
                          <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-stone-500)' }}
                          >
                            {t('app.placementsLeft', { count: remainingPlacements })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-4 text-center text-sm"
                      style={{ color: 'var(--color-stone-400)', backgroundColor: 'var(--color-surface)' }}
                    >
                      {t('app.drawTerrainCard')}
                    </div>
                  )}
                </section>
              )}

              {/* ── Group B: Location Tiles (current player) ── */}
              {currentPlayer && (
                <section
                  aria-label={t('sidebar.yourTiles')}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--color-warm-cream-100)',
                      color: 'var(--color-stone-600)',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    {t('sidebar.yourTiles')}
                  </div>
                  <div
                    className="p-3"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    {currentPlayer.tiles.length === 0 ? (
                      <p className="text-xs text-center py-2" style={{ color: 'var(--color-stone-400)' }}>—</p>
                    ) : (
                      <div className="grid gap-2">
                        {currentPlayer.tiles.map((tile, idx) => {
                          const isActive = activeTile === tile.location
                          const canUse = !tile.usedThisTurn &&
                            (phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn)
                          return (
                            <LocationTileCard
                              key={`${tile.location}-${idx}`}
                              tile={tile}
                              isActive={isActive}
                              canUse={canUse}
                              canControlActions={canControlActions}
                              onUse={() => handleActivateTile(tile.location)}
                              onCancel={handleCancelTile}
                            />
                          )
                        })}
                      </div>
                    )}
                    {activeTile && (
                      <div
                        className="mt-2 p-2 rounded-lg text-xs"
                        style={{
                          backgroundColor: 'oklch(0.97 0.03 70)',
                          border: '1px solid var(--color-warning)',
                          color: 'var(--color-stone-700)',
                        }}
                      >
                        {activeTile === Location.Paddock || activeTile === Location.Barn
                          ? tileMoveFrom
                            ? t('app.clickHighlightedDestinationToMove')
                            : t('app.clickHighlightedSettlementToMove')
                          : t('app.clickHighlightedCellToPlace')}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Group C: Objective Cards ── */}
              {objectiveCards.length > 0 && (
                <section
                  aria-label={t('sidebar.objectives')}
                  data-tutorial-target="objectives-section"
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--color-warm-cream-100)',
                      color: 'var(--color-stone-600)',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    {t('sidebar.objectives')}
                  </div>
                  <div className="p-3 grid gap-2" style={{ backgroundColor: 'var(--color-surface)' }}>
                    {objectiveCards.map(card => (
                      <ObjectiveCardBadge
                        key={card}
                        card={card}
                        score={currentPlayerObjectiveScores.find(objective => objective.card === card)?.score}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Group D: Live Scores ── */}
              {players.length > 0 && phase !== GamePhase.Setup && (
                <section
                  aria-label={t('sidebar.liveScores')}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--color-warm-cream-100)',
                      color: 'var(--color-stone-600)',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    {t('sidebar.liveScores')}
                  </div>
                  <div
                    className="p-3 space-y-2"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  >
                    {liveScores.map(ps => {
                      const p = players.find(pl => pl.id === ps.playerId)
                      const total = ps.castle + ps.objectives.reduce((s, o) => s + o.score, 0)
                      const isLeader = total === maxLiveScore && total > 0
                      const summaryText = t('app.castleScoreSummary', {
                        castle: ps.castle,
                        objectives: ps.objectives
                          .map(o => t('app.objectiveScoreItem', { card: tObjective(t, o.card), score: o.score }))
                          .join(' | '),
                      })
                      return (
                        <ScoreRow
                          key={ps.playerId}
                          playerId={ps.playerId}
                          playerName={p?.name}
                          playerColor={p?.color ?? '#ccc'}
                          total={total}
                          isLeader={isLeader}
                          summaryText={summaryText}
                          pointsLabel={t('common.pointsShort')}
                        />
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ── Group E: Players List ── */}
              <section
                aria-label={t('sidebar.players')}
                className="rounded-xl overflow-hidden"
                style={{
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <div
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'var(--color-warm-cream-100)',
                    color: 'var(--color-stone-600)',
                    borderBottom: '1px solid var(--card-border)',
                  }}
                >
                  {t('sidebar.players')}
                </div>
                <ul
                  role="list"
                  className="divide-y"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  {players.map((player, index) => (
                    <li
                      key={player.id}
                      role="listitem"
                      aria-label={t('app.playerListAria', {
                        name: player.name,
                        placed: player.settlements.length,
                        remaining: player.remainingSettlements,
                        isCurrent: index === currentPlayerIndex ? t('app.playerListAriaCurrentSuffix') : '',
                      })}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        backgroundColor: index === currentPlayerIndex
                          ? 'var(--color-warm-cream-100)'
                          : 'transparent',
                      }}
                    >
                      {/* Color dot */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                        style={{
                          backgroundColor: player.color,
                          borderColor: index === currentPlayerIndex ? 'var(--color-stone-700)' : 'transparent',
                        }}
                        aria-hidden="true"
                      />
                      {/* Name + bot tag */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {player.name}
                          </span>
                          {player.isBot && <BotIcon size={12} />}
                          {index === currentPlayerIndex && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: 'var(--color-accent-turn)',
                                color: 'var(--color-accent-turn-fg)',
                              }}
                            >
                              {t('app.current')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {/* Remaining settlements count */}
                          <span className="text-xs" style={{ color: 'var(--color-stone-400)' }}>
                            {player.remainingSettlements}
                          </span>
                          {/* Progress bar */}
                          <div
                            className="flex-1 h-1 rounded-full overflow-hidden max-w-16"
                            style={{ backgroundColor: 'var(--progress-track)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${((40 - player.remainingSettlements) / 40) * 100}%`,
                                backgroundColor: player.color,
                              }}
                            />
                          </div>
                          {/* Tile icons */}
                          {player.tiles.map((tile, tileIdx) => (
                            <LocationTileIcon
                              key={`${tile.location}-${tileIdx}`}
                              location={tile.location}
                              size={12}
                              style={{ color: 'var(--color-stone-500)' }}
                            />
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Game Log (compact) */}
              <GameLog history={history} players={players} />

              {/* Sidebar action buttons (desktop fallback) */}
              <section aria-label={t('app.actions')} className="space-y-2 pb-4">
                {phase === GamePhase.DrawCard && (
                  <button
                    onClick={handleDrawTerrainCard}
                    disabled={!canControlActions}
                    aria-label={t('app.drawTerrainCardAria')}
                    className="w-full font-bold py-2.5 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--button-primary-bg)',
                      color: 'var(--button-text)',
                    }}
                  >
                    <DrawCardIcon size={16} />
                    {t('app.drawTerrainCard')}
                  </button>
                )}

                {(phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo || !canControlActions}
                    className="w-full font-bold py-2 px-4 rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-warning)',
                      color: 'var(--button-text)',
                    }}
                  >
                    <UndoIcon size={16} />
                    {t('app.undo')}
                  </button>
                )}

                {shouldShowEndTurnButton && (
                  <button
                    onClick={handleEndTurn}
                    disabled={!canControlActions}
                    aria-label={t('app.endTurnAria')}
                    className="w-full font-bold py-2.5 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-success)',
                      color: 'var(--button-text)',
                    }}
                  >
                    <EndTurnIcon size={16} />
                    {t('app.endTurn')}
                  </button>
                )}
              </section>
            </div>
          )}
        </aside>
      </div>

      {/* Compact Bottom Drawer – visible on < lg only */}
      <div className="lg:hidden">
        <BottomDrawer
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen(o => !o)}
          phase={phase}
          currentPlayer={currentPlayer}
          players={players}
          currentTerrainCard={currentTerrainCard}
          objectiveCards={objectiveCards}
          liveScores={liveScores}
          maxLiveScore={maxLiveScore}
          remainingPlacements={remainingPlacements}
          activeTile={activeTile}
          tileMoveFrom={tileMoveFrom}
          canUndo={canUndo}
          history={history}
          onDrawCard={handleDrawTerrainCard}
          onEndTurn={handleEndTurn}
          onUndo={handleUndo}
          onActivateTile={handleActivateTile}
          onCancelTile={handleCancelTile}
        />
      </div>

      {/* Game Over overlay */}
      {phase === GamePhase.GameOver && finalScores.length > 0 && (
        <GameOver
          finalScores={finalScores}
          players={players}
          objectiveCards={objectiveCards}
          onNewGame={handleRestart}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onOpenReplay={() => setReplayOpen(true)}
        />
      )}

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      <SeasonHistory
        isOpen={seasonHistoryOpen}
        onClose={() => setSeasonHistoryOpen(false)}
      />

      <ReplayModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
      />

      {achievementOpen && <AchievementPanel onClose={() => setAchievementOpen(false)} />}

      {/* Achievement unlock toast notification */}
      <AchievementToast />

      {/* R30: Invalid placement hint toast */}
      <InvalidHintToast message={invalidHintMsg} />

      {/* Quit-to-menu confirmation modal */}
      <QuitToMenuConfirmModal
        isOpen={quitConfirmOpen}
        isNetworkGame={isNetworkGame}
        onConfirm={() => { setQuitConfirmOpen(false); handleQuitToMenu(); }}
        onCancel={() => setQuitConfirmOpen(false)}
      />

      {/* New-game overwrite confirmation modal */}
      <NewGameOverwriteConfirmModal
        isOpen={newGameConfirmOpen}
        onConfirm={handleNewGameConfirm}
        onCancel={handleNewGameCancel}
      />

      {/* Onboarding prompt — shown to first-time players after game start */}
      <OnboardingPromptModal
        isOpen={showOnboardingPrompt}
        onStartTutorial={() => {
          setShowOnboardingPrompt(false);
          useTutorialStore.getState().startTutorial();
        }}
        onSkip={() => {
          setShowOnboardingPrompt(false);
          useTutorialStore.getState().completeTutorial();
        }}
      />

      {/* Tutorial overlay – available from any screen */}
      <TutorialOverlay />
    </div>
  )
}

export default App

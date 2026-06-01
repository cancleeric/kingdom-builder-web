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
import { useTutorialStore } from './store/tutorialStore'
import { TurnBanner } from './components/Game/TurnBanner'
import { ObjectiveCardBadge } from './components/Game/ObjectiveCardBadge'
import { GamePhase } from './types'
import type { PlayerConfig, GameOptions } from './types'
import { Location } from './core/terrain'
import { scoreCastle, scoreObjectiveCard } from './core/scoring'
import { initAudio, playSound, isMuted, setMuted, SoundType } from './utils/soundEngine'
import { InstallPrompt } from './components/InstallPrompt'
import { useMultiplayerStore } from './store/multiplayerStore'
import { extractSerializableState } from './multiplayer/stateSerializer'
import type { MultiplayerAction } from './multiplayer/types'
import { useTranslation } from 'react-i18next'
import { tLocation, tObjective, tPhase, tTerrain } from './i18n/formatters'
import { LeaderboardModal } from './components/Game/LeaderboardModal'
import { useLeaderboardStore } from './store/leaderboardStore'
import { ReplayModal } from './components/Game/ReplayModal'
import { AchievementPanel } from './components/Game/AchievementPanel'
import { AchievementToast } from './components/Game/AchievementToast'
import { useAchievementStore, getUnlockedCount } from './store/achievementStore'
import {
  CastleIcon,
  FarmIcon,
  HarborIcon,
  OasisIcon,
  TowerIcon,
  PaddockIcon,
  BarnIcon,
  OracleIcon,
  TavernIcon,
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
} from './components/icons'
import type { ComponentType, SVGProps } from 'react'

const LOCATION_ICON: Record<Location, ComponentType<{ size?: number } & SVGProps<SVGSVGElement>>> = {
  [Location.Castle]: CastleIcon,
  [Location.Farm]: FarmIcon,
  [Location.Harbor]: HarborIcon,
  [Location.Oasis]: OasisIcon,
  [Location.Tower]: TowerIcon,
  [Location.Paddock]: PaddockIcon,
  [Location.Barn]: BarnIcon,
  [Location.Oracle]: OracleIcon,
  [Location.Tavern]: TavernIcon,
}

const STATE_BROADCAST_DEBOUNCE_MS = 50;

function App() {
  const { t, i18n } = useTranslation();
  const [muted, setMutedState] = useState(isMuted);
  const [gameStarted, setGameStarted] = useState(false);
  const [menuMode, setMenuMode] = useState<'home' | 'setup' | 'multiplayer'>('home');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
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

  // Bottom drawer state (mobile only)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sidebar collapsed state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // More menu (Header ⋯ button)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const handleStart = (configs: PlayerConfig[], options: GameOptions) => {
    initGame(configs, options);
    setGameStarted(true);
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

  // Play game over sound when phase changes to GameOver
  useEffect(() => {
    if (phase === GamePhase.GameOver) {
      playSound(SoundType.GAME_OVER);
    }
  }, [phase]);

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
        </>
      );
    }

    // Home / Main Menu
    return (
      <>
        <MainMenu
          muted={muted}
          onToggleMute={handleToggleMute}
          onSinglePlayer={() => setMenuMode('setup')}
          onContinueGame={() => setGameStarted(true)}
          onMultiplayer={() => setMenuMode('multiplayer')}
          onLanguageChange={(lang) => void i18n.changeLanguage(lang)}
        />
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
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-100 transition"
                    style={{ color: 'var(--color-text)' }}
                    onClick={() => { setLeaderboardOpen(true); setMoreMenuOpen(false); }}
                  >
                    <LeaderboardIcon size={16} />
                    {t('leaderboard.open')}
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-100 transition"
                    style={{ color: 'var(--color-text)' }}
                    onClick={() => { setReplayOpen(true); setMoreMenuOpen(false); }}
                  >
                    <ReplayIcon size={16} />
                    {t('replay.open')}
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-100 transition"
                    style={{ color: 'var(--color-text)' }}
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
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Game Area ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Game Board column */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          {/* TurnBanner – sticky above the board */}
          {phase !== GamePhase.GameOver && (
            <TurnBanner
              currentPlayer={currentPlayer}
              phase={phase}
              currentTerrainCard={currentTerrainCard}
              remainingPlacements={remainingPlacements}
              validPlacements={validPlacements}
              canControlActions={canControlActions}
              onDrawCard={handleDrawTerrainCard}
              onEndTurn={handleEndTurn}
            />
          )}

          {/* HexGrid */}
          <div className="flex-1 relative overflow-hidden">
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
              />
              </div>
            )}
          </div>

          {/* Mobile floating action bar (< md) — safe-area aware */}
          <div
            className="lg:hidden flex items-center gap-2 px-4 py-3 flex-shrink-0"
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
                      {/* Terrain icon */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-warm-cream-100)' }}
                      >
                        {(() => {
                          const terrainEmoji: Record<string, string> = {
                            Grass: '🌿', Forest: '🌲', Desert: '🏜️',
                            Flower: '🌸', Canyon: '🪨', Water: '💧', Mountain: '⛰️'
                          }
                          return terrainEmoji[currentTerrainCard.terrain] ?? '🗺️'
                        })()}
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
                      <div className="flex flex-wrap gap-2">
                        {currentPlayer.tiles.map((tile, idx) => {
                          const Ic = LOCATION_ICON[tile.location]
                          const isActive = activeTile === tile.location
                          const canUse = !tile.usedThisTurn &&
                            (phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn)
                          return (
                            <div
                              key={`${tile.location}-${idx}`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition"
                              style={{
                                border: `2px solid ${isActive ? 'var(--color-warning)' : tile.usedThisTurn ? 'var(--card-border)' : 'var(--color-ink-green-300)'}`,
                                backgroundColor: tile.usedThisTurn
                                  ? 'var(--color-warm-cream-100)'
                                  : isActive
                                    ? 'oklch(0.97 0.03 70)'
                                    : 'var(--color-ink-green-50)',
                                opacity: tile.usedThisTurn ? 0.55 : 1,
                              }}
                            >
                              <Ic size={16} />
                              <span style={{ color: 'var(--color-text)' }}>{tLocation(t, tile.location)}</span>
                              {canUse && (
                                <button
                                  className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded transition"
                                  disabled={!canControlActions}
                                  style={{
                                    backgroundColor: isActive ? 'var(--color-warning)' : 'var(--color-success)',
                                    color: 'var(--button-text)',
                                  }}
                                  onClick={() =>
                                    isActive ? handleCancelTile() : handleActivateTile(tile.location)
                                  }
                                >
                                  {isActive ? t('app.cancel') : t('app.use')}
                                </button>
                              )}
                              {tile.usedThisTurn && (
                                <span className="ml-1 text-xs italic" style={{ color: 'var(--color-stone-400)' }}>
                                  {t('app.used')}
                                </span>
                              )}
                            </div>
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
                      return (
                        <div
                          key={ps.playerId}
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
                                style={{ backgroundColor: p?.color ?? '#ccc' }}
                                aria-hidden="true"
                              />
                              <span style={{ color: 'var(--color-text)' }}>{p?.name}</span>
                              {isLeader && (
                                <span className="text-xs" title="Leading">★</span>
                              )}
                            </div>
                            <span
                              className="font-bold"
                              style={{ color: isLeader ? 'var(--color-amber-700)' : 'var(--color-text)' }}
                            >
                              {total} {t('common.pointsShort')}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone-400)' }}>
                            {t('app.castleScoreSummary', {
                              castle: ps.castle,
                              objectives: ps.objectives
                                .map(o => t('app.objectiveScoreItem', { card: tObjective(t, o.card), score: o.score }))
                                .join(' | '),
                            })}
                          </p>
                        </div>
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
                                backgroundColor: 'var(--color-info)',
                                color: 'var(--color-warm-cream-50)',
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
                          {player.tiles.map((tile, tileIdx) => {
                            const TileIc = LOCATION_ICON[tile.location]
                            return <TileIc key={`${tile.location}-${tileIdx}`} size={12} style={{ color: 'var(--color-stone-500)' }} />
                          })}
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

      <ReplayModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
      />

      {achievementOpen && <AchievementPanel onClose={() => setAchievementOpen(false)} />}

      {/* Achievement unlock toast notification */}
      <AchievementToast />

      {/* Tutorial overlay – available from any screen */}
      <TutorialOverlay />
    </div>
  )
}

export default App

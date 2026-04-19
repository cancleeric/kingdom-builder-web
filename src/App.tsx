import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from './store/gameStore'
import { HexGrid } from './components/Board/HexGrid'
import { GameOver } from './components/Game/GameOver'
import { GameLog } from './components/Game/GameLog'
import { BottomDrawer } from './components/Mobile/BottomDrawer'
import { GameSetup } from './components/Game/GameSetup'
import { MultiplayerSetup } from './components/Game/MultiplayerSetup'
import { TutorialOverlay } from './components/Tutorial/TutorialOverlay'
import { GamePhase, BotDifficulty } from './types'
import type { PlayerConfig, GameOptions } from './types'
import { Location } from './core/terrain'
import { scoreCastle, scoreObjectiveCard } from './core/scoring'
import { initAudio, playSound, isMuted, setMuted, SoundType } from './utils/soundEngine'
import { InstallPrompt } from './components/InstallPrompt'
import { SaveLoadUI } from './components/SaveLoadUI'
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
import { SeasonBanner } from './components/Game/SeasonBanner'
import { SeasonHistory } from './components/Game/SeasonHistory'
import { useSeasonStore } from './store/seasonStore'

const LOCATION_EMOJI: Record<Location, string> = {
  [Location.Castle]: '🏰',
  [Location.Farm]:   '🌾',
  [Location.Harbor]: '⚓',
  [Location.Oasis]:  '🌴',
  [Location.Tower]:  '🗼',
  [Location.Paddock]:'🐎',
  [Location.Barn]:   '🏚',
  [Location.Oracle]: '🔮',
  [Location.Tavern]: '🍺',
}

const STATE_BROADCAST_DEBOUNCE_MS = 50;

function App() {
  const { t, i18n } = useTranslation();
  const [muted, setMutedState] = useState(isMuted);
  const [gameStarted, setGameStarted] = useState(false);
  const [menuMode, setMenuMode] = useState<'local' | 'multiplayer'>('local');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [seasonHistoryOpen, setSeasonHistoryOpen] = useState(false);
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

  const handleEscape = () => {
    selectCell(null);
  };

  const handleRestart = () => {
    if (isNetworkGame) {
      leaveRoom();
      setMenuMode('multiplayer');
    }
    setGameStarted(false);
  };

  const handleDrawTerrainCard = () => {
    runNetworkedAction(
      () => drawTerrainCard(),
      { type: 'draw_terrain_card' }
    );
  };

  const handleEndTurn = () => {
    runNetworkedAction(
      () => endTurn(),
      { type: 'end_turn' }
    );
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
        <MultiplayerSetup
          onBack={() => setMenuMode('local')}
          onGameStarted={() => setGameStarted(true)}
        />
      );
    }

    return (
      <div>
        <SeasonBanner onOpenLeaderboard={() => setLeaderboardOpen(true)} />
        <GameSetup onStart={handleStart} />
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-50">
          <button
            onClick={() => setMenuMode('multiplayer')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-lg transition"
          >
            {t('app.playOnlineMultiplayer')}
          </button>
        </div>
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-50">
          <SaveLoadUI onGameLoaded={() => setGameStarted(true)} />
        </div>
        {/* Achievement badge / button on main menu */}
        <button
          onClick={() => setAchievementOpen(true)}
          className="fixed top-14 right-4 z-50 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold px-3 py-2 rounded-xl shadow-md text-sm flex items-center gap-1"
          aria-label={t('achievement.open')}
        >
          🏅
          <span>{achievementUnlockedCount}</span>
        </button>
        {achievementOpen && <AchievementPanel onClose={() => setAchievementOpen(false)} />}
        <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
        <SeasonHistory isOpen={seasonHistoryOpen} onClose={() => setSeasonHistoryOpen(false)} />
        <TutorialOverlay />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <InstallPrompt />
      {/* Hidden ARIA live region for screen-reader turn announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between">
        <h1 className="text-xl sm:text-3xl font-bold">{t('common.appName')}</h1>
        <div className="flex items-center gap-2">
          {isNetworkGame && multiplayerRoom && (
            <span className="hidden sm:inline-block text-xs bg-blue-500 px-2 py-1 rounded">
              {t('app.roomStatus', { id: multiplayerRoom.id, status: multiplayerConnectionStatus })}
            </span>
          )}
          {/* Mobile: show current player name in header */}
          {currentPlayer && (
            <div className="flex items-center gap-2 sm:hidden">
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span className="text-sm font-semibold">{currentPlayer.name}</span>
            </div>
          )}
          <select
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            aria-label={t('common.language')}
            className="hidden sm:block bg-blue-500 text-white text-xs rounded px-2 py-1 border border-blue-300"
          >
            <option value="en">{t('common.english')}</option>
            <option value="zh-TW">{t('common.traditionalChinese')}</option>
          </select>
          <button
            onClick={handleToggleMute}
            aria-label={muted ? t('app.unmute') : t('app.mute')}
            title={muted ? t('app.unmute') : t('app.mute')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-500 transition text-xl"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setLeaderboardOpen(true)}
            className="hidden sm:block text-xs bg-blue-500 hover:bg-blue-400 text-white px-2 py-1 rounded border border-blue-300"
          >
            {t('leaderboard.open')}
          </button>
          <button
            onClick={() => setReplayOpen(true)}
            className="hidden sm:block text-xs bg-purple-500 hover:bg-purple-400 text-white px-2 py-1 rounded border border-purple-300"
          >
            {t('replay.open')}
          </button>
          <button
            onClick={() => setSeasonHistoryOpen(true)}
            className="hidden sm:block text-xs bg-indigo-500 hover:bg-indigo-400 text-white px-2 py-1 rounded border border-indigo-300"
          >
            {t('season.open')}
          </button>
          <button
            onClick={() => setAchievementOpen(true)}
            className="hidden sm:block text-xs bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold px-2 py-1 rounded border border-yellow-300 flex items-center gap-1"
            aria-label={t('achievement.open')}
          >
            🏅 <span>{achievementUnlockedCount}</span>
          </button>
        </div>
      </header>

      {/* Season banner */}
      <SeasonBanner onOpenLeaderboard={() => setLeaderboardOpen(true)} />

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Board – always visible, takes all space on mobile */}
        <div className="flex-1 relative">
          {players.length > 0 && (
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
          )}
        </div>

        {/* Sidebar – hidden on mobile (< md), visible on md+ */}
        <aside className="hidden md:flex w-80 bg-white shadow-lg p-6 overflow-y-auto flex-col gap-0" aria-label={t('app.gameInformation')}>
          {/* Current Player Info */}
          {currentPlayer && (
            <section
              aria-label={t('app.currentPlayerRegion', { name: currentPlayer.name })}
              className="mb-4 p-4 rounded-lg border-2"
              style={{ borderColor: currentPlayer.color }}
            >
              <h2 className="text-xl font-bold mb-2">{t('app.currentPlayer')}</h2>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                  aria-hidden="true"
                />
                <span className="font-semibold">{currentPlayer.name}</span>
                {currentPlayer.isBot && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    🤖 {currentPlayer.difficulty === BotDifficulty.Easy
                      ? t('app.botDifficultyEasy')
                      : currentPlayer.difficulty === BotDifficulty.Hard
                        ? t('app.botDifficultyHard')
                        : t('app.botDifficultyMedium')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {t('app.settlementsRemaining', { count: currentPlayer.remainingSettlements })}
              </p>
            </section>
          )}

          {/* Game Phase */}
          <section className="mb-4" aria-label={t('app.gamePhaseRegion')}>
            <h3 className="text-lg font-semibold mb-2">{t('app.phase')}</h3>
            <div className="p-3 bg-gray-100 rounded">
              <p className="font-medium">{tPhase(t, phase)}</p>
            </div>
          </section>

          {/* Terrain Card */}
          {currentTerrainCard && (
            <section className="mb-4" aria-label={t('app.currentTerrainCardRegion')} role="region">
              <h3 className="text-lg font-semibold mb-2">{t('app.terrain')}</h3>
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-2xl font-bold">
                  {tTerrain(t, currentTerrainCard.terrain)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('app.placementsLeft', { count: remainingPlacements })}
                </p>
              </div>
            </section>
          )}

          {/* Objective Cards */}
          {objectiveCards.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t('app.objectives')}</h3>
              <div className="flex flex-wrap gap-1">
                {objectiveCards.map(card => (
                  <span
                    key={card}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tObjective(t, card)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location Tiles (current player) */}
          {currentPlayer && currentPlayer.tiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t('app.yourTiles')}</h3>
              <div className="space-y-1">
                {currentPlayer.tiles.map((tile, idx) => (
                  <div
                    key={`${tile.location}-${idx}`}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <span className="text-sm">
                      {LOCATION_EMOJI[tile.location]} {tLocation(t, tile.location)}
                    </span>
                    <div className="flex gap-1">
                      {!tile.usedThisTurn &&
                        (phase === GamePhase.PlaceSettlements ||
                          phase === GamePhase.EndTurn) && (
                          <button
                            className={`px-2 py-0.5 text-xs rounded font-semibold ${
                              activeTile === tile.location
                                ? 'bg-orange-500 text-white'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            disabled={!canControlActions}
                            onClick={() =>
                              activeTile === tile.location
                                ? handleCancelTile()
                                : handleActivateTile(tile.location)
                            }
                          >
                            {activeTile === tile.location ? t('app.cancel') : t('app.use')}
                          </button>
                        )}
                      {tile.usedThisTurn && (
                        <span className="text-xs text-gray-400 italic">{t('app.used')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {activeTile && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                  {activeTile === Location.Paddock || activeTile === Location.Barn
                    ? tileMoveFrom
                      ? t('app.clickHighlightedDestinationToMove')
                      : t('app.clickHighlightedSettlementToMove')
                    : t('app.clickHighlightedCellToPlace')}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <section className="mb-4" aria-label={t('app.actions')}>
            <h3 className="text-lg font-semibold mb-2">{t('app.actions')}</h3>

            {phase === GamePhase.DrawCard && (
              <button
                onClick={handleDrawTerrainCard}
                disabled={!canControlActions}
                aria-label={t('app.drawTerrainCardAria')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                {t('app.drawTerrainCard')}
              </button>
            )}

            {phase === GamePhase.PlaceSettlements && !activeTile && (
              <div
                role="status"
                className="p-3 bg-yellow-100 border border-yellow-400 rounded"
              >
                <p className="text-sm">
                  {t('app.placementHelp')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {t('app.placementsRemaining', { count: remainingPlacements })}
                </p>
              </div>
            )}

            {(phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
              <button
                onClick={handleUndo}
                disabled={!canUndo || !canControlActions}
                className={`w-full mt-2 font-bold py-2 px-4 rounded transition border ${
                  canUndo && canControlActions
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
                    : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                }`}
              >
              {t('app.undo')}
              </button>
            )}

            {phase === GamePhase.EndTurn && (
              <button
                onClick={handleEndTurn}
                disabled={!canControlActions}
                aria-label={t('app.endTurnAria')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition mt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                {t('app.endTurn')}
              </button>
            )}
          </section>

          {/* Operation Log */}
          <GameLog history={history} players={players} />

          {/* Live Scores */}
          {players.length > 0 && phase !== GamePhase.Setup && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t('app.liveScores')}</h3>
              <div className="space-y-2">
                {liveScores.map(ps => {
                  const p = players.find(pl => pl.id === ps.playerId)
                  const total =
                    ps.castle + ps.objectives.reduce((s, o) => s + o.score, 0)
                  return (
                    <div
                      key={ps.playerId}
                      className="p-2 rounded border"
                      style={{ borderColor: p?.color ?? '#ccc' }}
                    >
                      <div className="flex justify-between text-sm font-medium">
                        <span>{p?.name}</span>
                        <span>{total} {t('common.pointsShort')}</span>
                      </div>
                      <p className="text-xs text-gray-500">
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
            </div>
          )}

          {/* Players list */}
          <section aria-label={t('app.players')}>
            <h3 className="text-lg font-semibold mb-2">{t('app.players')}</h3>
            <ul role="list" className="space-y-2">
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
                  className={`p-3 rounded border-2 ${
                    index === currentPlayerIndex ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  style={{ borderColor: player.color }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-800"
                      style={{ backgroundColor: player.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {player.name}
                      {index === currentPlayerIndex && (
                          <span className="ml-2 text-xs font-normal text-blue-600">({t('app.current')})</span>
                        )}
                    </span>
                    {player.isBot && (
                      <span className="text-xs text-gray-500">🤖</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                     {t('app.placedRemainingSummary', {
                       placed: player.settlements.length,
                       remaining: player.remainingSettlements,
                     })}
                   </p>
                   {player.tiles.length > 0 && (
                     <p className="text-xs text-gray-500 mt-0.5">
                       {t('app.tilesSummary', {
                         tiles: player.tiles.map(tile => LOCATION_EMOJI[tile.location]).join(' '),
                       })}
                     </p>
                   )}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {/* Mobile Bottom Drawer – visible on < md only */}
      <div className="md:hidden">
        <BottomDrawer
          isOpen={drawerOpen}
          onToggle={() => setDrawerOpen(o => !o)}
          phase={phase}
          currentPlayer={currentPlayer}
          currentTerrainCard={currentTerrainCard}
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

      <SeasonHistory
        isOpen={seasonHistoryOpen}
        onClose={() => setSeasonHistoryOpen(false)}
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

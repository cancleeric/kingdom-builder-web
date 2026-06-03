import React, { useRef, useCallback } from 'react';
import { GamePhase } from '../../types';
import { Location } from '../../core/terrain';
import { Player, LocationTile } from '../../types';
import { GameAction } from '../../types/history';
import type { ObjectiveCard } from '../../core/scoring';
import { useTranslation } from 'react-i18next';
import { tObjective, tPhase, tTerrain } from '../../i18n/formatters';
import { ObjectiveCardBadge } from '../Game/ObjectiveCardBadge';
import { LocationTileCard } from '../Game/LocationTileCard';
import { CastleIcon } from '../icons/CastleIcon';

interface BottomDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Game state props */
  phase: GamePhase;
  currentPlayer: Player | undefined;
  players: Player[];
  currentTerrainCard: { terrain: import('../../core/terrain').Terrain } | null;
  objectiveCards: ObjectiveCard[];
  liveScores: Array<{
    playerId: number;
    castle: number;
    objectives: Array<{ card: ObjectiveCard; score: number }>;
  }>;
  maxLiveScore: number;
  remainingPlacements: number;
  activeTile: Location | null;
  tileMoveFrom: import('../../core/hex').AxialCoord | null;
  canUndo: boolean;
  history: GameAction[];
  /** Action callbacks */
  onDrawCard: () => void;
  onEndTurn: () => void;
  onUndo: () => void;
  onActivateTile: (loc: Location) => void;
  onCancelTile: () => void;
}

/**
 * Slide-up bottom drawer for mobile / small-screen layout.
 * Groups content to mirror the desktop Sidebar structure:
 *   A) Current terrain card
 *   B) Location tiles
 *   C) Objectives
 *   D) Live scores
 *   E) Players summary
 */
export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isOpen,
  onToggle,
  phase,
  currentPlayer,
  players,
  currentTerrainCard,
  objectiveCards,
  liveScores,
  maxLiveScore,
  remainingPlacements,
  activeTile,
  tileMoveFrom,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canUndo: _canUndo,
  history,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDrawCard: _onDrawCard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEndTurn: _onEndTurn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUndo: _onUndo,
  onActivateTile,
  onCancelTile,
}) => {
  const { t } = useTranslation();
  const dragStartY = useRef<number | null>(null);
  const currentPlayerObjectiveScores =
    liveScores.find(playerScore => playerScore.playerId === currentPlayer?.id)?.objectives ?? [];

  const handleDragHandleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleDragHandleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current === null) return;
      const dy = e.changedTouches[0].clientY - dragStartY.current;
      if (isOpen && dy > 30) onToggle();
      else if (!isOpen && dy < -30) onToggle();
      dragStartY.current = null;
    },
    [isOpen, onToggle]
  );

  const lastAction = history.length > 0 ? history[history.length - 1] : null;

  const terrainEmoji: Record<string, string> = {
    Grass: '🌿', Forest: '🌲', Desert: '🏜️',
    Flower: '🌸', Canyon: '🪨', Water: '💧', Mountain: '⛰️',
  };

  return (
    <>
      {/* Semi-transparent backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          fixed bottom-0 left-0 right-0 z-30
          rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}
        `}
        style={{ backgroundColor: 'var(--color-surface)' }}
        role="region"
        aria-label={t('bottomDrawer.controlsRegion')}
        aria-expanded={isOpen}
      >
        {/* Drag handle / toggle bar */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-pointer"
          onClick={onToggle}
          onTouchStart={handleDragHandleTouchStart}
          onTouchEnd={handleDragHandleTouchEnd}
          aria-label={isOpen ? t('bottomDrawer.closePanel') : t('bottomDrawer.openPanel')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onToggle()}
        >
          <div
            className="w-12 h-1.5 rounded-full mb-1"
            style={{ backgroundColor: 'var(--color-stone-400)' }}
          />
          <div
            className="flex items-center justify-between w-full px-4 py-1"
            style={{ borderBottom: isOpen ? '1px solid var(--card-border)' : 'none' }}
          >
            {/* Current player pill */}
            {currentPlayer && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  {currentPlayer.name}
                </span>
              </div>
            )}

            {/* Phase badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--chip-bg)',
                color: 'var(--chip-text)',
              }}
            >
              {tPhase(t, phase)}
            </span>

            {/* Terrain quick-view */}
            {currentTerrainCard && (
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                {terrainEmoji[currentTerrainCard.terrain] ?? ''}{' '}
                {tTerrain(t, currentTerrainCard.terrain)}
                {remainingPlacements > 0 && (
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-stone-500)' }}>
                    ×{remainingPlacements}
                  </span>
                )}
              </span>
            )}

            {/* Chevron */}
            <span
              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--color-stone-400)' }}
              aria-hidden="true"
            >
              ▲
            </span>
          </div>
        </div>

        {/* Drawer body */}
        <div className="px-4 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ── Group A: Terrain Card ── */}
          {currentTerrainCard && (
            <section
              aria-label={t('app.currentTerrainCardRegion')}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <div
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-warm-cream-100)',
                  color: 'var(--color-stone-600)',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                {t('sidebar.terrainCard')}
              </div>
              <div className="p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-warm-cream-100)' }}
                >
                  {terrainEmoji[currentTerrainCard.terrain] ?? '🗺️'}
                </div>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    {tTerrain(t, currentTerrainCard.terrain)}
                  </p>
                  <div
                    className="mt-1 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--progress-track)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, ((3 - remainingPlacements) / 3) * 100)}%`,
                        backgroundColor: 'var(--progress-fill)',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-stone-500)' }}>
                    {t('bottomDrawer.placementsLeft', { count: remainingPlacements })}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Group B: Location Tiles ── */}
          {currentPlayer && currentPlayer.tiles.length > 0 && (
            <section
              aria-label={t('sidebar.yourTiles')}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <div
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-warm-cream-100)',
                  color: 'var(--color-stone-600)',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                {t('sidebar.yourTiles')}
              </div>
              <div className="p-3 grid gap-2" style={{ backgroundColor: 'var(--color-surface)' }}>
                {currentPlayer.tiles.map((tile: LocationTile, idx: number) => {
                  const isActive = activeTile === tile.location
                  const canUse = !tile.usedThisTurn &&
                    (phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn)
                  return (
                    <LocationTileCard
                      key={`${tile.location}-${idx}`}
                      tile={tile}
                      isActive={isActive}
                      canUse={canUse}
                      onUse={() => onActivateTile(tile.location)}
                      onCancel={onCancelTile}
                      compact
                    />
                  )
                })}
              </div>

              {activeTile && (
                <div
                  className="mx-3 mb-3 p-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'oklch(0.97 0.03 70)',
                    border: '1px solid var(--color-warning)',
                    color: 'var(--color-stone-700)',
                  }}
                >
                  {activeTile === Location.Paddock || activeTile === Location.Barn
                    ? tileMoveFrom
                      ? t('bottomDrawer.tapHighlightedDestinationToMove')
                      : t('bottomDrawer.tapHighlightedSettlementToMove')
                    : t('bottomDrawer.tapHighlightedCellToPlace')}
                </div>
              )}
            </section>
          )}

          {/* ── Group C: Objective Cards ── */}
          {objectiveCards.length > 0 && (
            <section
              aria-label={t('sidebar.objectives')}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <div
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
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
          {liveScores.length > 0 && phase !== GamePhase.Setup && (
            <section
              aria-label={t('sidebar.liveScores')}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <div
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-warm-cream-100)',
                  color: 'var(--color-stone-600)',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                {t('sidebar.liveScores')}
              </div>
              <div className="p-3 space-y-2" style={{ backgroundColor: 'var(--color-surface)' }}>
                {liveScores.map(playerScore => {
                  const player = players.find(p => p.id === playerScore.playerId);
                  const total = playerScore.castle + playerScore.objectives.reduce((sum, objective) => sum + objective.score, 0);
                  const isLeader = total === maxLiveScore && total > 0;

                  return (
                    <div
                      key={playerScore.playerId}
                      className="rounded-lg p-2"
                      style={{
                        border: `2px solid ${isLeader ? 'var(--color-amber-400)' : 'var(--card-border)'}`,
                        backgroundColor: isLeader ? 'oklch(0.97 0.02 80)' : 'var(--color-warm-cream-50)',
                      }}
                    >
                      <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: player?.color ?? '#ccc' }}
                            aria-hidden="true"
                          />
                          <span className="truncate" style={{ color: 'var(--color-text)' }}>{player?.name}</span>
                          {isLeader && (
                            <span className="text-xs" title={t('bottomDrawer.leading')}>★</span>
                          )}
                        </div>
                        <span
                          className="font-bold flex-shrink-0"
                          style={{ color: isLeader ? 'var(--color-amber-700)' : 'var(--color-text)' }}
                        >
                          {total} {t('common.pointsShort')}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 inline-flex items-center gap-1" style={{ color: 'var(--color-stone-400)' }}>
                        <CastleIcon size={11} aria-hidden="true" />
                        {t('app.castleScoreSummary', {
                          castle: playerScore.castle,
                          objectives: playerScore.objectives
                            .map(objective => t('app.objectiveScoreItem', {
                              card: tObjective(t, objective.card),
                              score: objective.score,
                            }))
                            .join(' | '),
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Placement hint */}
          {phase === GamePhase.PlaceSettlements && !activeTile && (
            <div
              className="p-3 rounded-xl text-sm text-center"
              style={{
                backgroundColor: 'oklch(0.97 0.03 80)',
                border: '1px solid var(--color-amber-300)',
                color: 'var(--color-stone-700)',
              }}
            >
              {t('bottomDrawer.tapHighlightedHex')}
              <br />
              <span className="text-xs" style={{ color: 'var(--color-stone-500)' }}>
                {t('bottomDrawer.placementsLeft', { count: remainingPlacements })}
              </span>
            </div>
          )}

          {/* Last action summary */}
          {lastAction && (
            <p className="text-xs text-center" style={{ color: 'var(--color-stone-400)' }}>
              {t('gameLog.last')}{' '}
              {lastAction.type === 'PLACE_SETTLEMENT'
                ? t('gameLog.lastSettlementAt', { q: lastAction.hex?.q, r: lastAction.hex?.r })
                : lastAction.type === 'TILE_MOVE'
                  ? t('gameLog.lastMovedSettlement')
                  : t('gameLog.lastUsedTile')}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

import React, { useRef, useCallback } from 'react';
import { GamePhase } from '../../types';
import { Location } from '../../core/terrain';
import { Player, LocationTile } from '../../types';
import { GameAction } from '../../types/history';
import { useTranslation } from 'react-i18next';
import { tLocation, tPhase, tTerrain } from '../../i18n/formatters';

interface BottomDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Game state props */
  phase: GamePhase;
  currentPlayer: Player | undefined;
  currentTerrainCard: { terrain: import('../../core/terrain').Terrain } | null;
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

const LOCATION_EMOJI: Record<Location, string> = {
  [Location.Castle]:  '🏰',
  [Location.Farm]:    '🌾',
  [Location.Harbor]:  '⚓',
  [Location.Oasis]:   '🌴',
  [Location.Tower]:   '🗼',
  [Location.Paddock]: '🐎',
  [Location.Barn]:    '🏚',
  [Location.Oracle]:  '🔮',
  [Location.Tavern]:  '🍺',
};

/**
 * Slide-up bottom drawer for mobile / small-screen layout.
 * Shows current player info, terrain card, action buttons, and location tiles.
 * Can be toggled open/closed via a drag handle or the toggle button.
 */
export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isOpen,
  onToggle,
  phase,
  currentPlayer,
  currentTerrainCard,
  remainingPlacements,
  activeTile,
  tileMoveFrom,
  canUndo,
  history,
  onDrawCard,
  onEndTurn,
  onUndo,
  onActivateTile,
  onCancelTile,
}) => {
  const { t } = useTranslation();
  // Swipe-to-close/open
  const dragStartY = useRef<number | null>(null);

  const handleDragHandleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleDragHandleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (dragStartY.current === null) return;
      const dy = e.changedTouches[0].clientY - dragStartY.current;
      // Swipe up more than 30px → open; swipe down more than 30px → close
      if (isOpen && dy > 30) onToggle();
      else if (!isOpen && dy < -30) onToggle();
      dragStartY.current = null;
    },
    [isOpen, onToggle]
  );

  const lastAction = history.length > 0 ? history[history.length - 1] : null;

  return (
    <>
      {/* Semi-transparent backdrop when drawer is open (closes on tap) */}
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
          bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}
        `}
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
          <div className="w-10 h-1 rounded-full bg-gray-300 mb-1" />
          <div className="flex items-center justify-between w-full px-4 py-1">
            {/* Current player pill */}
            {currentPlayer && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <span className="font-semibold text-sm">{currentPlayer.name}</span>
              </div>
            )}

            {/* Phase badge */}
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {tPhase(t, phase)}
              </span>

            {/* Terrain card quick-view */}
            {currentTerrainCard && (
              <span className="text-sm font-bold">
                {tTerrain(t, currentTerrainCard.terrain)}
                {remainingPlacements > 0 && (
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    ×{remainingPlacements}
                  </span>
                )}
              </span>
            )}

            {/* Chevron indicator */}
            <span
              className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              ▲
            </span>
          </div>
        </div>

        {/* Drawer body (visible when open) */}
        <div className="px-4 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Primary action */}
          {phase === GamePhase.DrawCard && (
            <button
              onClick={onDrawCard}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              {t('app.drawTerrainCard')}
            </button>
          )}

          {phase === GamePhase.PlaceSettlements && !activeTile && (
            <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-xl text-sm text-center">
              {t('bottomDrawer.tapHighlightedHex')}
              <br />
              <span className="text-xs text-gray-500">
                {t('bottomDrawer.placementsLeft', { count: remainingPlacements })}
              </span>
            </div>
          )}

          {activeTile && (
            <div className="p-3 bg-orange-50 border border-orange-300 rounded-xl text-sm text-center">
              {activeTile === Location.Paddock || activeTile === Location.Barn
                ? tileMoveFrom
                  ? t('bottomDrawer.tapHighlightedDestinationToMove')
                  : t('bottomDrawer.tapHighlightedSettlementToMove')
                : t('bottomDrawer.tapHighlightedCellToPlace')}
            </div>
          )}

          {/* Undo + End Turn */}
          <div className="flex gap-2">
            {(phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex-1 font-bold py-3 rounded-xl border transition ${
                  canUndo
                    ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600 active:bg-orange-700'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {t('app.undo')}
              </button>
            )}

            {phase === GamePhase.EndTurn && (
              <button
                onClick={onEndTurn}
                className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 rounded-xl transition"
              >
                {t('app.endTurn')}
              </button>
            )}
          </div>

          {/* Location tiles */}
          {currentPlayer && currentPlayer.tiles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('app.yourTiles')}</h4>
              <div className="flex flex-wrap gap-2">
                {currentPlayer.tiles.map((tile: LocationTile, idx: number) => (
                  <div
                    key={`${tile.location}-${idx}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl border bg-gray-50"
                  >
                      <span>{LOCATION_EMOJI[tile.location]} {tLocation(t, tile.location)}</span>
                    {!tile.usedThisTurn &&
                      (phase === GamePhase.PlaceSettlements || phase === GamePhase.EndTurn) && (
                        <button
                          className={`ml-2 px-2 py-0.5 text-xs rounded-lg font-semibold ${
                            activeTile === tile.location
                              ? 'bg-orange-500 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                          onClick={() =>
                            activeTile === tile.location
                              ? onCancelTile()
                              : onActivateTile(tile.location)
                          }
                        >
                          {activeTile === tile.location ? t('app.cancel') : t('app.use')}
                        </button>
                      )}
                    {tile.usedThisTurn && (
                      <span className="ml-2 text-xs text-gray-400 italic">{t('app.used')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last action summary */}
          {lastAction && (
            <p className="text-xs text-gray-400 text-center">
              {t('gameLog.last')} {lastAction.type === 'PLACE_SETTLEMENT'
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

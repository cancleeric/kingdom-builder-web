import React from 'react';
import { useTranslation } from 'react-i18next';
import { GamePhase } from '../../types';
import type { Player } from '../../types';
import type { AxialCoord } from '../../core/hex';
import { tPhase, tTerrain } from '../../i18n/formatters';
import { DrawCardIcon, EndTurnIcon } from '../icons';

interface TurnBannerProps {
  currentPlayer: Player | undefined;
  phase: GamePhase;
  currentTerrainCard: { terrain: import('../../core/terrain').Terrain } | null;
  remainingPlacements: number;
  validPlacements: AxialCoord[];
  canControlActions: boolean;
  onDrawCard: () => void;
  onEndTurn: () => void;
}

/**
 * Sticky banner above the game board showing:
 * - Current player name with their color band background
 * - Phase chip (Draw / Place / End-turn)
 * - Remaining placements progress bar
 * - Primary action button that changes per phase
 */
export const TurnBanner: React.FC<TurnBannerProps> = ({
  currentPlayer,
  phase,
  currentTerrainCard,
  remainingPlacements,
  validPlacements,
  canControlActions,
  onDrawCard,
  onEndTurn,
}) => {
  const { t } = useTranslation();

  if (!currentPlayer) return null;

  const totalPlacements = 3;
  const placedCount = totalPlacements - remainingPlacements;
  const progressPct = Math.min(100, (placedCount / totalPlacements) * 100);

  const shouldShowEndTurnButton =
    phase === GamePhase.EndTurn ||
    (phase === GamePhase.PlaceSettlements && validPlacements.length === 0);

  const phaseLabel = tPhase(t, phase);
  const terrainLabel = currentTerrainCard ? tTerrain(t, currentTerrainCard.terrain) : null;

  return (
    <div
      className="animate-banner-enter sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2 shadow-md"
      style={{ backgroundColor: currentPlayer.color + 'ee' }}
      role="status"
      aria-label={t('turnBanner.regionLabel', { player: currentPlayer.name, phase: phaseLabel })}
    >
      {/* Player name */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-4 h-4 rounded-full border-2 border-white flex-shrink-0"
          style={{ backgroundColor: currentPlayer.color }}
          aria-hidden="true"
        />
        <span className="text-white font-bold text-base truncate">
          {t('turnBanner.playerTurn', { player: currentPlayer.name })}
        </span>
      </div>

      {/* Phase chip + terrain */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/25 text-white"
          aria-label={t('turnBanner.phaseLabel')}
        >
          {phaseLabel}
          {terrainLabel && ` · ${terrainLabel}`}
          {phase === GamePhase.PlaceSettlements && validPlacements.length === 0 && ` · ${t('turnBanner.noValidPlacements')}`}
        </span>

        {/* Progress bar (only during PlaceSettlements) */}
        {phase === GamePhase.PlaceSettlements && (
          <div className="hidden sm:flex items-center gap-1.5">
            <div
              className="w-20 h-1.5 rounded-full overflow-hidden bg-white/30"
              role="progressbar"
              aria-valuenow={placedCount}
              aria-valuemin={0}
              aria-valuemax={totalPlacements}
              aria-label={t('turnBanner.placementsProgress', {
                placed: placedCount,
                total: totalPlacements,
              })}
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-white/90 whitespace-nowrap">
              {t('turnBanner.ofSettlements', {
                placed: placedCount,
                total: totalPlacements,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Primary action button */}
      <div className="flex-shrink-0">
        {phase === GamePhase.DrawCard && (
          <div className="hidden lg:block flex-shrink-0">
            <button
              onClick={onDrawCard}
              disabled={!canControlActions}
              aria-label={t('app.drawTerrainCardAria')}
              data-tutorial-target="draw-card-button"
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition
                bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <DrawCardIcon size={16} />
              {t('app.drawTerrainCard')}
            </button>
          </div>
        )}

        {shouldShowEndTurnButton && (
          <div className="hidden lg:block flex-shrink-0">
            <button
              onClick={onEndTurn}
              disabled={!canControlActions}
              aria-label={t('app.endTurnAria')}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition
                bg-white text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <EndTurnIcon size={16} />
              {t('app.endTurn')}
            </button>
          </div>
        )}

        {phase === GamePhase.PlaceSettlements && validPlacements.length > 0 && (
          <span className="text-xs text-white/80">
            {t('turnBanner.ofSettlements', {
              placed: placedCount,
              total: totalPlacements,
            })}
          </span>
        )}
      </div>
    </div>
  );
};

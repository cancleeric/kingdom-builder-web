import React from 'react';
import { GameAction } from '../../types/history';
import { Player } from '../../types';
import { Location } from '../../core/terrain';
import { useTranslation } from 'react-i18next';
import { tLocation } from '../../i18n/formatters';

const MAX_LOG_ENTRIES = 20;

interface GameLogProps {
  history: GameAction[];
  players: Player[];
}

function actionLabel(action: GameAction, t: (key: string, options?: Record<string, unknown>) => string): string {
  switch (action.type) {
    case 'PLACE_SETTLEMENT':
      return action.hex
        ? t('gameLog.placeSettlementAt', { q: action.hex.q, r: action.hex.r })
        : t('gameLog.placeSettlement');
    case 'TILE_PLACEMENT':
      return action.hex
        ? t('gameLog.useTileAt', { tile: action.tile ?? 'tile', q: action.hex.q, r: action.hex.r })
        : t('gameLog.useTile', { tile: action.tile ?? 'tile' });
    case 'TILE_MOVE':
      return action.fromHex && action.toHex
        ? t('gameLog.moveSettlementFromTo', {
            fromQ: action.fromHex.q,
            fromR: action.fromHex.r,
            toQ: action.toHex.q,
            toR: action.toHex.r,
          })
        : t('gameLog.moveSettlement');
    default:
      return t('gameLog.action');
  }
}

const LOCATION_EMOJI: Partial<Record<Location, string>> = {
  [Location.Farm]: '🌾',
  [Location.Harbor]: '⚓',
  [Location.Oasis]: '🌴',
  [Location.Tower]: '🗼',
  [Location.Paddock]: '🐎',
  [Location.Barn]: '🏚',
  [Location.Oracle]: '🔮',
  [Location.Tavern]: '🍺',
};

export const GameLog = React.memo(function GameLog({ history, players }: GameLogProps) {
  const { t } = useTranslation();
  const recent = [...history].reverse().slice(0, MAX_LOG_ENTRIES);

  if (recent.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{t('gameLog.heading')}</h3>
        <p className="text-xs text-gray-400 italic">{t('gameLog.empty')}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{t('gameLog.heading')}</h3>
      <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {recent.map((action, idx) => {
          const player = players.find(p => p.id === action.playerId);
          const color = player?.color ?? '#888';
          return (
            <li
              key={`${action.timestamp}-${idx}`}
              className="text-xs rounded px-2 py-1 border-l-4"
              style={{ borderColor: color }}
            >
              <span className="font-semibold" style={{ color }}>
                {t('gameLog.turn', {
                  turn: action.turnNumber,
                  player: player?.name ?? t('common.player', { number: action.playerId }),
                })}
              </span>{' '}
              {actionLabel(action, t)}
              {action.acquiredTile && (
                <span className="ml-1 text-gray-500">
                  {t('gameLog.acquiredTile', {
                    emoji: LOCATION_EMOJI[action.acquiredTile] ?? '',
                    tile: tLocation(t, action.acquiredTile),
                  })}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
});

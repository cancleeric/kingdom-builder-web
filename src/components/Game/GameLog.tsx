import { GameAction } from '../../types/history';
import { Player } from '../../types';
import { Location } from '../../core/terrain';

const MAX_LOG_ENTRIES = 20;

interface GameLogProps {
  history: GameAction[];
  players: Player[];
}

function actionLabel(action: GameAction): string {
  switch (action.type) {
    case 'PLACE_SETTLEMENT':
      return action.hex
        ? `放置 settlement 於 Q${action.hex.q}R${action.hex.r}`
        : '放置 settlement';
    case 'TILE_PLACEMENT':
      return action.hex
        ? `使用 ${action.tile ?? 'tile'} 於 Q${action.hex.q}R${action.hex.r}`
        : `使用 ${action.tile ?? 'tile'}`;
    case 'TILE_MOVE':
      return action.fromHex && action.toHex
        ? `移動 settlement Q${action.fromHex.q}R${action.fromHex.r} → Q${action.toHex.q}R${action.toHex.r}`
        : '移動 settlement';
    default:
      return '操作';
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

export function GameLog({ history, players }: GameLogProps) {
  const recent = [...history].reverse().slice(0, MAX_LOG_ENTRIES);

  if (recent.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">操作日誌</h3>
        <p className="text-xs text-gray-400 italic">尚無操作記錄</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2 dark:text-white">操作日誌</h3>
      <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {recent.map((action, idx) => {
          const player = players.find(p => p.id === action.playerId);
          const color = player?.color ?? '#888';
          return (
            <li
              key={`${action.timestamp}-${idx}`}
              className="text-xs rounded px-2 py-1 border-l-4 bg-gray-50 dark:bg-gray-700"
              style={{ borderColor: color }}
            >
              <span className="font-semibold" style={{ color }}>
                [回合 {action.turnNumber}] {player?.name ?? `Player ${action.playerId}`}
              </span>{' '}
              <span className="dark:text-gray-300">{actionLabel(action)}</span>
              {action.acquiredTile && (
                <span className="ml-1 text-gray-500 dark:text-gray-400">
                  （獲得 {LOCATION_EMOJI[action.acquiredTile] ?? ''} {action.acquiredTile}）
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

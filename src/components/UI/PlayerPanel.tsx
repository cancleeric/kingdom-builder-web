import type { Player } from '../../types';

const COLOR_CLASSES: Record<string, string> = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  white: 'bg-gray-100 border border-gray-300',
  black: 'bg-gray-900',
};

interface PlayerPanelProps {
  players: Player[];
  currentPlayerIndex: number;
  scores: number[];
}

export function PlayerPanel({ players, currentPlayerIndex, scores }: PlayerPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((player, idx) => (
        <div
          key={player.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            idx === currentPlayerIndex ? 'bg-amber-100 border-2 border-amber-400' : 'bg-white border border-gray-200'
          }`}
        >
          <div className={`w-4 h-4 rounded-full ${COLOR_CLASSES[player.color]}`} />
          <span className="font-medium text-sm text-gray-800">{player.name}</span>
          <span className="ml-auto text-xs text-gray-500">{player.settlements}棋</span>
          <span className="text-sm font-bold text-amber-700">{scores[idx] ?? 0}分</span>
        </div>
      ))}
    </div>
  );
}

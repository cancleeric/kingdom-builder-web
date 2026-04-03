import React from 'react';
import { Player } from '../../types';

interface GameOverModalProps {
  players: Player[];
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ players }) => {
  // Sort players by settlements placed (descending) as a simple score
  const ranked = [...players].sort(
    (a, b) => b.settlements.length - a.settlements.length
  );

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-8 bg-black/50">
      <div
        className="game-over-slide-down bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <h2
          id="game-over-title"
          className="text-3xl font-bold text-center text-red-600 mb-6"
        >
          🏰 Game Over!
        </h2>

        <div className="space-y-3">
          {ranked.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg border-2"
              style={{ borderColor: player.color }}
            >
              <span className="text-xl font-bold w-8 text-center">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <div
                className="w-5 h-5 rounded-full border-2 border-gray-800 flex-shrink-0"
                style={{ backgroundColor: player.color }}
              />
              <span className="font-semibold flex-1">{player.name}</span>
              <span className="text-sm text-gray-600">
                {player.settlements.length} settlements placed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { Player } from '../../types';

interface GameFinishedProps {
  players: Player[];
  objectives: string[];
  onPlayAgain: () => void;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  fisherman: 'Fisherman — groups touching water',
  miner: 'Miner — groups touching mountain',
  knight: 'Knight — longest horizontal row',
  lords: 'Lords — row dominance',
  farmers: 'Farmers — adjacent to grassland',
  hermits: 'Hermits — isolated settlements',
  merchants: 'Merchants — location tiles',
  discoverers: 'Discoverers — unique quadrants',
  builders: 'Builders — connected groups',
  shepherds: 'Shepherds — canyon settlements',
};

export const GameFinished: React.FC<GameFinishedProps> = ({
  players,
  objectives,
  onPlayAgain,
}) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-amber-800">Game Over!</h1>
          <p className="text-gray-600 mt-1">
            <span
              className="font-bold"
              style={{ color: winner.color }}
            >
              {winner.name}
            </span>{' '}
            wins with {winner.score} points!
          </p>
        </div>

        {/* Final Standings */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">Final Standings</h2>
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  i === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium text-gray-800">{player.name}</span>
                </div>
                <span className="font-bold text-gray-700">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2 text-sm">🎯 Objectives Used</h2>
          <ul className="space-y-1">
            {objectives.map((obj) => (
              <li key={obj} className="text-xs text-blue-700">
                • {OBJECTIVE_LABELS[obj] ?? obj}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { PlayerType } from '../../types';

interface GameSetupProps {
  onStart: (playerTypes: PlayerType[], seed?: number) => void;
}

const PLAYER_TYPE_LABELS: Record<PlayerType, string> = {
  human: '👤 Human',
  'bot-easy': '🤖 Bot (Easy)',
  'bot-normal': '🤖 Bot (Normal)',
  'bot-hard': '🤖 Bot (Hard)',
};

const PLAYER_COLORS = ['Red', 'Blue', 'Green', 'Orange'];

export const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerTypes, setPlayerTypes] = useState<PlayerType[]>(['human', 'bot-normal', 'human', 'human']);
  const [useRandomSeed, setUseRandomSeed] = useState(false);
  const [seed, setSeed] = useState('42');

  const handlePlayerTypeChange = (index: number, type: PlayerType) => {
    const updated = [...playerTypes];
    updated[index] = type;
    setPlayerTypes(updated);
  };

  const handleStart = () => {
    const types = playerTypes.slice(0, playerCount);
    const gameSeed = useRandomSeed ? undefined : parseInt(seed, 10) || 42;
    onStart(types, gameSeed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-2">
          👑 Kingdom Builder
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm">
          Strategic hex-grid kingdom building game
        </p>

        {/* Player Count */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Players
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  playerCount === n
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player Types */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Player Settings
          </label>
          <div className="space-y-3">
            {Array.from({ length: playerCount }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][i],
                  }}
                />
                <span className="text-sm font-medium text-gray-600 w-16 flex-shrink-0">
                  {PLAYER_COLORS[i]}
                </span>
                <select
                  value={playerTypes[i]}
                  onChange={(e) => handlePlayerTypeChange(i, e.target.value as PlayerType)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {Object.entries(PLAYER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* AI Difficulty Info */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
          <p className="font-semibold mb-1">🤖 AI Difficulty Levels</p>
          <ul className="space-y-0.5">
            <li><strong>Easy:</strong> Randomly picks valid placement positions</li>
            <li><strong>Normal:</strong> Greedy algorithm — picks highest-scoring position</li>
            <li><strong>Hard:</strong> Greedy + 1-step lookahead for smarter play</li>
          </ul>
        </div>

        {/* Board Seed */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Board Seed
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={useRandomSeed}
                onChange={(e) => setUseRandomSeed(e.target.checked)}
                className="rounded"
              />
              Random
            </label>
          </div>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            disabled={useRandomSeed}
            placeholder="Enter seed..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg transition-colors shadow-md hover:shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

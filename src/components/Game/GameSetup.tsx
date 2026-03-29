import React, { useState } from 'react';
import type { PlayerConfig } from '../../store/gameStore';
import type { BotDifficulty } from '../../ai/botPlayer';

interface GameSetupProps {
  onStart: (configs: PlayerConfig[]) => void;
}

type PlayerType = 'human' | BotDifficulty;

const PLAYER_TYPE_OPTIONS: { value: PlayerType; label: string }[] = [
  { value: 'human',  label: '👤 Human' },
  { value: 'easy',   label: '🤖 Bot (Easy)' },
  { value: 'normal', label: '🤖 Bot (Normal)' },
  { value: 'hard',   label: '🤖 Bot (Hard)' },
];

const PLAYER_COLORS = ['Red', 'Cyan', 'Yellow', 'Mint'];
const PLAYER_HEX_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];
const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerTypes, setPlayerTypes] = useState<PlayerType[]>([
    'human', 'normal', 'human', 'human',
  ]);
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_NAMES.slice());

  const handleStart = () => {
    const configs: PlayerConfig[] = Array.from({ length: playerCount }, (_, i) => ({
      name: playerNames[i] || DEFAULT_NAMES[i],
      type: playerTypes[i],
    }));
    onStart(configs);
  };

  const hasBot = playerTypes.slice(0, playerCount).some(t => t !== 'human');

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">👑</div>
          <h1 className="text-3xl font-bold text-amber-800">Kingdom Builder</h1>
          <p className="text-gray-500 mt-1">Strategic hex-grid kingdom building game</p>
        </div>

        {/* Player count */}
        <div className="mb-6">
          <div className="font-semibold text-gray-700 mb-2">Number of Players</div>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
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

        {/* Per-player settings */}
        <div className="mb-6">
          <div className="font-semibold text-gray-700 mb-2">Player Settings</div>
          <div className="space-y-2">
            {Array.from({ length: playerCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PLAYER_HEX_COLORS[i] }}
                />
                <span className="text-sm text-gray-500 w-10 flex-shrink-0">
                  {PLAYER_COLORS[i]}
                </span>
                <input
                  type="text"
                  value={playerNames[i]}
                  onChange={e => {
                    const next = [...playerNames];
                    next[i] = e.target.value;
                    setPlayerNames(next);
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder={DEFAULT_NAMES[i]}
                />
                <select
                  value={playerTypes[i]}
                  onChange={e => {
                    const next = [...playerTypes];
                    next[i] = e.target.value as PlayerType;
                    setPlayerTypes(next);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {PLAYER_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* AI difficulty legend */}
        {hasBot && (
          <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-blue-800">
            <div className="font-medium mb-1">🤖 AI Difficulty Levels</div>
            <ul className="space-y-0.5 text-blue-700">
              <li><strong>Easy:</strong> Randomly picks valid placement positions</li>
              <li><strong>Normal:</strong> Greedy algorithm — picks highest-scoring position</li>
              <li><strong>Hard:</strong> Greedy + 1-step lookahead for smarter play</li>
            </ul>
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

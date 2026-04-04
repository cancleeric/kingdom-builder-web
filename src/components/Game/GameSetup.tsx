import { useState } from 'react';
import { PlayerConfig, BotDifficulty } from '../../types';

interface GameSetupProps {
  onStart: (configs: PlayerConfig[]) => void;
}

const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  [BotDifficulty.Easy]: 'Easy (Random)',
  [BotDifficulty.Normal]: 'Normal (Greedy)',
  [BotDifficulty.Hard]: 'Hard (Lookahead)',
};

export function GameSetup({ onStart }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [configs, setConfigs] = useState<PlayerConfig[]>(
    DEFAULT_PLAYER_NAMES.slice(0, 2).map((name, i) => ({
      name,
      type: i === 0 ? 'human' : 'bot',
      difficulty: BotDifficulty.Normal,
    }))
  );

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setConfigs(
      DEFAULT_PLAYER_NAMES.slice(0, count).map((name, i) => ({
        name: configs[i]?.name ?? name,
        type: configs[i]?.type ?? (i === 0 ? 'human' : 'bot'),
        difficulty: configs[i]?.difficulty ?? BotDifficulty.Normal,
      }))
    );
  };

  const updateConfig = (index: number, partial: Partial<PlayerConfig>) => {
    setConfigs(prev =>
      prev.map((cfg, i) => (i === index ? { ...cfg, ...partial } : cfg))
    );
  };

  const handleStart = () => {
    onStart(configs);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Kingdom Builder
        </h1>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          Game Setup
        </h2>

        {/* Player Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Players
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handlePlayerCountChange(n)}
                className={`flex-1 py-2 rounded-lg border-2 font-semibold transition ${
                  playerCount === n
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Per-player config */}
        <div className="space-y-4 mb-8">
          {configs.map((cfg, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-semibold text-gray-700 w-20">
                  Player {i + 1}
                </span>
                <input
                  type="text"
                  value={cfg.name}
                  onChange={e => updateConfig(i, { name: e.target.value })}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder={`Player ${i + 1}`}
                />
              </div>

              {/* Human / Bot toggle */}
              <div className="flex gap-2 mb-3">
                {(['human', 'bot'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateConfig(i, { type })}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      cfg.type === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type === 'human' ? '🧑 Human' : '🤖 Computer'}
                  </button>
                ))}
              </div>

              {/* Difficulty selector (only for bots) */}
              {cfg.type === 'bot' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    AI Difficulty
                  </label>
                  <select
                    value={cfg.difficulty}
                    onChange={e =>
                      updateConfig(i, {
                        difficulty: e.target.value as BotDifficulty,
                      })
                    }
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                  >
                    {Object.values(BotDifficulty).map(d => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

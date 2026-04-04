import { useState, useEffect } from 'react';
import { PlayerConfig, BotDifficulty } from '../../types';

interface GameSetupProps {
  onStart: (configs: PlayerConfig[]) => void;
}

const DEFAULT_PLAYER_NAMES = ['玩家1', '玩家2', '玩家3', '玩家4'];

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  [BotDifficulty.Easy]: 'Easy (Random)',
  [BotDifficulty.Normal]: 'Normal (Greedy)',
  [BotDifficulty.Hard]: 'Hard (Lookahead)',
};

const OFFICIAL_COLORS = [
  { label: '橙', value: '#F97316' },
  { label: '藍', value: '#3B82F6' },
  { label: '白', value: '#FFFFFF' },
  { label: '黑', value: '#111827' },
];

const DEFAULT_CONFIGS: PlayerConfig[] = DEFAULT_PLAYER_NAMES.slice(0, 2).map(
  (name, i) => ({
    name,
    color: OFFICIAL_COLORS[i].value,
    type: i === 0 ? 'human' : 'bot',
    difficulty: BotDifficulty.Normal,
  })
);

const STORAGE_KEY = 'kingdom-builder-setup';

function loadFromStorage(): { playerCount: number; configs: PlayerConfig[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { playerCount: number; configs: PlayerConfig[] };
  } catch {
    return null;
  }
}

function buildDefaultConfigs(count: number, existing: PlayerConfig[]): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    name: existing[i]?.name ?? DEFAULT_PLAYER_NAMES[i],
    color: existing[i]?.color ?? OFFICIAL_COLORS[i].value,
    type: existing[i]?.type ?? (i === 0 ? 'human' : 'bot'),
    difficulty: existing[i]?.difficulty ?? BotDifficulty.Normal,
  }));
}

export function GameSetup({ onStart }: GameSetupProps) {
  const saved = loadFromStorage();
  const savedValid =
    saved != null && saved.configs.length === saved.playerCount;
  const [playerCount, setPlayerCount] = useState(savedValid ? saved.playerCount : 2);
  const [configs, setConfigs] = useState<PlayerConfig[]>(
    savedValid ? saved.configs : DEFAULT_CONFIGS
  );

  // Persist settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerCount, configs }));
    } catch {
      // ignore storage errors
    }
  }, [playerCount, configs]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setConfigs(buildDefaultConfigs(count, configs));
  };

  const updateConfig = (index: number, partial: Partial<PlayerConfig>) => {
    setConfigs(prev =>
      prev.map((cfg, i) => (i === index ? { ...cfg, ...partial } : cfg))
    );
  };

  const takenColors = (excludeIndex: number) =>
    new Set(
      configs
        .filter((_, i) => i !== excludeIndex)
        .map(c => c.color)
        .filter(Boolean)
    );

  const canStart = configs.every(c => c.name.trim().length > 0);

  const handleStart = () => {
    if (canStart) onStart(configs);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Kingdom Builder
        </h1>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          遊戲設定
        </h2>

        {/* Player Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            玩家人數
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handlePlayerCountChange(n)}
                className={`flex-1 py-3 rounded-lg border-2 font-bold text-lg transition ${
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
          {configs.map((cfg, i) => {
            const taken = takenColors(i);
            return (
              <div key={i} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-semibold text-gray-700 w-16 shrink-0">
                    玩家 {i + 1}
                  </span>
                  <input
                    type="text"
                    value={cfg.name}
                    maxLength={12}
                    onChange={e => updateConfig(i, { name: e.target.value })}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder={DEFAULT_PLAYER_NAMES[i]}
                    aria-label={`玩家 ${i + 1} 名稱`}
                  />
                </div>

                {/* Color selection */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 shrink-0">顏色</span>
                  {OFFICIAL_COLORS.map(c => {
                    const isSelected = cfg.color === c.value;
                    const isTaken = taken.has(c.value);
                    const isWhite = c.value === '#FFFFFF';
                    return (
                      <button
                        key={c.value}
                        onClick={() => !isTaken && updateConfig(i, { color: c.value })}
                        disabled={isTaken}
                        aria-label={`${c.label} ${isTaken ? '(已選用)' : ''}`}
                        aria-pressed={isSelected}
                        title={c.label}
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          isSelected
                            ? 'border-blue-500 scale-110 shadow-md'
                            : isTaken
                            ? 'border-gray-200 opacity-30 cursor-not-allowed'
                            : isWhite
                            ? 'border-gray-400 hover:border-blue-400'
                            : 'border-transparent hover:border-blue-400'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    );
                  })}
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
            );
          })}
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full font-bold py-3 rounded-xl text-lg transition ${
            canStart
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          開始遊戲
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  PlayerConfig,
  PlayerCount,
  SetupConfig,
  OFFICIAL_COLORS,
  DEFAULT_PLAYER_NAMES,
  SETUP_STORAGE_KEY,
} from '../../types/setup';

interface GameSetupProps {
  onStart: (players: PlayerConfig[]) => void;
}

function buildDefaultConfig(count: PlayerCount): SetupConfig {
  return {
    playerCount: count,
    players: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: DEFAULT_PLAYER_NAMES[i],
      color: OFFICIAL_COLORS[i].value,
    })),
  };
}

function loadConfig(): SetupConfig | null {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SetupConfig;
  } catch {
    return null;
  }
}

function saveConfig(cfg: SetupConfig): void {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore storage errors
  }
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [config, setConfig] = useState<SetupConfig>(() => {
    const saved = loadConfig();
    return saved ?? buildDefaultConfig(2);
  });

  const setPlayerCount = (count: PlayerCount) => {
    setConfig((prev) => {
      const next: PlayerConfig[] = Array.from({ length: count }, (_, i) =>
        prev.players[i] ?? {
          id: i + 1,
          name: DEFAULT_PLAYER_NAMES[i],
          color: OFFICIAL_COLORS[i].value,
        }
      );
      // Resolve duplicate colors after trimming to new count
      const used = new Set<string>();
      const resolved = next.map((p) => {
        if (!used.has(p.color)) {
          used.add(p.color);
          return p;
        }
        const fallback = OFFICIAL_COLORS.find((c) => !used.has(c.value));
        const color = fallback ? fallback.value : p.color;
        used.add(color);
        return { ...p, color };
      });
      return { playerCount: count, players: resolved };
    });
  };

  const setPlayerName = (index: number, name: string) => {
    const trimmed = name.slice(0, 12);
    setConfig((prev) => {
      const players = prev.players.map((p, i) =>
        i === index ? { ...p, name: trimmed } : p
      );
      return { ...prev, players };
    });
  };

  const setPlayerColor = (index: number, color: string) => {
    setConfig((prev) => {
      const players = prev.players.map((p, i) =>
        i === index ? { ...p, color } : p
      );
      return { ...prev, players };
    });
  };

  const usedColors = new Set(config.players.map((p) => p.color));

  const canStart = config.players.every((p) => p.name.trim().length > 0);

  const handleStart = () => {
    if (!canStart) return;
    saveConfig(config);
    onStart(config.players);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
          Kingdom Builder
        </h1>
        <p className="text-center text-gray-500 mb-8">遊戲開始設定</p>

        {/* Player Count */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">玩家人數</h2>
          <div className="flex gap-3">
            {([2, 3, 4] as PlayerCount[]).map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`flex-1 py-3 text-xl font-bold rounded-lg border-2 transition ${
                  config.playerCount === count
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
                aria-pressed={config.playerCount === count}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Player Configs */}
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">玩家設定</h2>
          {config.players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              {/* Player number */}
              <span className="text-sm font-bold text-gray-500 w-6 shrink-0">
                {index + 1}
              </span>

              {/* Name input */}
              <input
                type="text"
                value={player.name}
                onChange={(e) => setPlayerName(index, e.target.value)}
                maxLength={12}
                placeholder={DEFAULT_PLAYER_NAMES[index]}
                className="flex-1 px-3 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`玩家 ${index + 1} 名稱`}
              />

              {/* Color swatches */}
              <div className="flex gap-1.5 shrink-0" role="group" aria-label={`玩家 ${index + 1} 顏色`}>
                {OFFICIAL_COLORS.map((opt) => {
                  const selected = player.color === opt.value;
                  const takenByOther = !selected && usedColors.has(opt.value);
                  return (
                    <button
                      key={opt.id}
                      title={opt.label}
                      aria-label={opt.label}
                      aria-pressed={selected}
                      disabled={takenByOther}
                      onClick={() => setPlayerColor(index, opt.value)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        selected
                          ? 'border-blue-600 scale-110 shadow-md'
                          : takenByOther
                          ? 'opacity-30 cursor-not-allowed border-gray-300'
                          : 'border-gray-400 hover:border-blue-400 hover:scale-105'
                      }`}
                      style={{ backgroundColor: opt.value }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 text-lg font-bold rounded-xl transition ${
            canStart
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-disabled={!canStart}
        >
          開始遊戲
        </button>
      </div>
    </div>
  );
}

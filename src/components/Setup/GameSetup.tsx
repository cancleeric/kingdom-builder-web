import React, { useState, useEffect } from 'react';
import type { PlayerConfig, PlayerColor, PlayerCount } from '../../types/setup';

const OFFICIAL_COLORS: { color: PlayerColor; label: string; bg: string; border: string }[] = [
  { color: 'orange', label: '橙', bg: 'bg-orange-500', border: 'border-orange-600' },
  { color: 'blue', label: '藍', bg: 'bg-blue-500', border: 'border-blue-600' },
  { color: 'white', label: '白', bg: 'bg-gray-100', border: 'border-gray-400' },
  { color: 'black', label: '黑', bg: 'bg-gray-900', border: 'border-gray-700' },
];

const DEFAULT_NAMES = ['玩家1', '玩家2', '玩家3', '玩家4'];
const DEFAULT_COLORS: PlayerColor[] = ['orange', 'blue', 'white', 'black'];

const STORAGE_KEY = 'kingdom-builder-setup';

interface SetupData {
  playerCount: PlayerCount;
  players: PlayerConfig[];
}

function loadFromStorage(): SetupData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SetupData;
  } catch {
    return null;
  }
}

function saveToStorage(data: SetupData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface GameSetupProps {
  onStart: (players: PlayerConfig[]) => void;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { id: 0, name: DEFAULT_NAMES[0], color: DEFAULT_COLORS[0] },
    { id: 1, name: DEFAULT_NAMES[1], color: DEFAULT_COLORS[1] },
    { id: 2, name: DEFAULT_NAMES[2], color: DEFAULT_COLORS[2] },
    { id: 3, name: DEFAULT_NAMES[3], color: DEFAULT_COLORS[3] },
  ]);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setPlayerCount(saved.playerCount);
      setPlayers(saved.players);
    }
  }, []);

  const activePlayers = players.slice(0, playerCount);
  const usedColors = activePlayers.map(p => p.color);
  const canStart = activePlayers.every(p => p.name.trim().length > 0);

  function handlePlayerCountChange(count: PlayerCount) {
    setPlayerCount(count);
  }

  function handleNameChange(idx: number, name: string) {
    const trimmed = name.slice(0, 12);
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, name: trimmed } : p));
  }

  function handleColorChange(idx: number, color: PlayerColor) {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, color } : p));
  }

  function handleStart() {
    if (!canStart) return;
    const config = activePlayers;
    saveToStorage({ playerCount, players });
    onStart(config);
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-2">Kingdom Builder</h1>
        <p className="text-center text-amber-600 mb-8">遊戲設定</p>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">玩家人數</h2>
          <div className="flex gap-3">
            {([2, 3, 4] as PlayerCount[]).map(count => (
              <button
                key={count}
                onClick={() => handlePlayerCountChange(count)}
                className={`flex-1 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${
                  playerCount === count
                    ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400'
                }`}
                aria-pressed={playerCount === count}
              >
                {count}人
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">玩家設定</h2>
          {activePlayers.map((player, idx) => (
            <div key={player.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-gray-500 w-16">玩家 {idx + 1}</span>
                <input
                  type="text"
                  value={player.name}
                  onChange={e => handleNameChange(idx, e.target.value)}
                  maxLength={12}
                  placeholder={DEFAULT_NAMES[idx]}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label={`玩家 ${idx + 1} 名稱`}
                />
              </div>
              <div className="flex gap-2">
                {OFFICIAL_COLORS.map(({ color, label, bg, border }) => {
                  const isSelected = player.color === color;
                  const isUsedByOther = usedColors.includes(color) && !isSelected;
                  return (
                    <button
                      key={color}
                      onClick={() => !isUsedByOther && handleColorChange(idx, color)}
                      disabled={isUsedByOther}
                      aria-pressed={isSelected}
                      aria-label={`${label}色`}
                      className={`w-10 h-10 rounded-full border-2 font-bold text-xs transition-all ${bg} ${border} ${
                        isSelected ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : ''
                      } ${isUsedByOther ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 text-xl font-bold rounded-xl transition-all ${
            canStart
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          開始遊戲
        </button>
      </div>
    </div>
  );
}

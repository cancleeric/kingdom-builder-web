import { useState } from 'react'
import {
  PlayerConfig,
  PlayerColor,
  PLAYER_COLORS,
  PLAYER_COLOR_NAMES,
  defaultPlayerConfigs,
  loadSavedConfigs,
  saveConfigs,
} from '../../types/setup'

interface Props {
  onStart: (configs: PlayerConfig[]) => void
}

export function GameSetup({ onStart }: Props) {
  const saved = loadSavedConfigs()
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(
    saved ? (Math.min(4, Math.max(2, saved.length)) as 2 | 3 | 4) : 2
  )
  const [configs, setConfigs] = useState<PlayerConfig[]>(
    saved ?? defaultPlayerConfigs(2)
  )

  // Keep configs array in sync whenever playerCount changes
  const handleCountChange = (count: 2 | 3 | 4) => {
    setPlayerCount(count)
    setConfigs(prev => {
      if (count > prev.length) {
        // Add new players with defaults (avoid color conflicts)
        const usedColors = new Set(prev.map(p => p.color))
        const extra: PlayerConfig[] = []
        for (let i = prev.length; i < count; i++) {
          const freeColor =
            PLAYER_COLORS.find(c => !usedColors.has(c)) ?? PLAYER_COLORS[i]
          usedColors.add(freeColor)
          extra.push({ id: i + 1, name: `玩家${i + 1}`, color: freeColor })
        }
        return [...prev, ...extra]
      }
      return prev.slice(0, count)
    })
  }

  const updateName = (idx: number, name: string) => {
    setConfigs(prev =>
      prev.map((p, i) => (i === idx ? { ...p, name: name.slice(0, 12) } : p))
    )
  }

  const updateColor = (idx: number, color: PlayerColor) => {
    setConfigs(prev =>
      prev.map((p, i) => (i === idx ? { ...p, color } : p))
    )
  }

  const usedColors = (excludeIdx: number) =>
    new Set(configs.filter((_, i) => i !== excludeIdx).map(p => p.color))

  const canStart = configs.slice(0, playerCount).every(p => p.name.trim().length > 0)

  const handleStart = () => {
    if (!canStart) return
    const active = configs.slice(0, playerCount)
    saveConfigs(active)
    onStart(active)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-2">
          Kingdom Builder
        </h1>
        <p className="text-center text-gray-500 mb-8">遊戲設定</p>

        {/* Player count */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">玩家人數</h2>
          <div className="flex gap-3">
            {([2, 3, 4] as const).map(n => (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                className={`flex-1 py-3 rounded-xl text-xl font-bold border-2 transition-all ${
                  playerCount === n
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {n} 人
              </button>
            ))}
          </div>
        </div>

        {/* Player configs */}
        <div className="space-y-4 mb-8">
          {configs.slice(0, playerCount).map((player, idx) => {
            const blocked = usedColors(idx)
            return (
              <div key={player.id} className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-semibold text-gray-700">玩家 {idx + 1}</span>
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={player.name}
                  onChange={e => updateName(idx, e.target.value)}
                  maxLength={12}
                  placeholder={`玩家${idx + 1}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* Color selection */}
                <div className="flex gap-2">
                  {PLAYER_COLORS.map(color => {
                    const isSelected = player.color === color
                    const isDisabled = blocked.has(color)
                    return (
                      <button
                        key={color}
                        title={PLAYER_COLOR_NAMES[color]}
                        disabled={isDisabled}
                        onClick={() => updateColor(idx, color)}
                        className={`w-9 h-9 rounded-full border-4 transition-all ${
                          isSelected
                            ? 'border-blue-600 scale-110 shadow-md'
                            : isDisabled
                            ? 'border-gray-200 opacity-30 cursor-not-allowed'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={PLAYER_COLOR_NAMES[color]}
                        aria-pressed={isSelected}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
            canStart
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          開始遊戲
        </button>
      </div>
    </div>
  )
}

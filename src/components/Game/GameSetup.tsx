import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerConfig, BotDifficulty, GameOptions, BoardSize } from '../../types';
import { useTutorialStore } from '../../store/tutorialStore';

interface GameSetupProps {
  onStart: (configs: PlayerConfig[], options: GameOptions) => void;
}

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  [BotDifficulty.Easy]: 'difficulty.easyFull',
  [BotDifficulty.Medium]: 'difficulty.mediumFull',
  [BotDifficulty.Hard]: 'difficulty.hardFull',
  [BotDifficulty.Normal]: 'difficulty.normalLegacy',
};
const SELECTABLE_DIFFICULTIES: BotDifficulty[] = [
  BotDifficulty.Easy,
  BotDifficulty.Medium,
  BotDifficulty.Hard,
];

const BOARD_SIZE_LABELS: Record<BoardSize, string> = {
  small: 'gameSetup.small',
  medium: 'gameSetup.medium',
  large: 'gameSetup.large',
};

const DEFAULT_OPTIONS: GameOptions = {
  boardSize: 'large',
  objectiveCount: 3,
  enableUndo: true,
};

export function GameSetup({ onStart }: GameSetupProps) {
  const { t } = useTranslation();
  const getDefaultPlayerName = (index: number) => t('common.player', { number: index + 1 });
  const [playerCount, setPlayerCount] = useState(2);
  const [configs, setConfigs] = useState<PlayerConfig[]>(
      Array.from({ length: 2 }, (_, i) => ({
        name: getDefaultPlayerName(i),
        type: i === 0 ? 'human' : 'bot',
        difficulty: BotDifficulty.Medium,
      }))
  );
  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS);

  const startTutorial = useTutorialStore((s) => s.startTutorial);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setConfigs(
      Array.from({ length: count }, (_, i) => ({
        name: configs[i]?.name ?? getDefaultPlayerName(i),
        type: configs[i]?.type ?? (i === 0 ? 'human' : 'bot'),
        difficulty: configs[i]?.difficulty ?? BotDifficulty.Medium,
      }))
    );
  };

  const updateConfig = (index: number, partial: Partial<PlayerConfig>) => {
    setConfigs(prev =>
      prev.map((cfg, i) => (i === index ? { ...cfg, ...partial } : cfg))
    );
  };

  const updateOption = <K extends keyof GameOptions>(key: K, value: GameOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleStart = () => {
    onStart(configs, options);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          {t('appName')}
        </h1>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
          {t('gameSetup.title')}
        </h2>

        {/* Player Count */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('gameSetup.numberOfPlayers')}
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
        <div className="space-y-4 mb-6">
          {configs.map((cfg, i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-semibold text-gray-700 w-20">
                  {t('gameSetup.player', { number: i + 1 })}
                </span>
                <input
                  type="text"
                  value={cfg.name}
                  onChange={e => updateConfig(i, { name: e.target.value })}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder={t('gameSetup.playerPlaceholder', { number: i + 1 })}
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
                    {type === 'human' ? t('gameSetup.human') : t('gameSetup.computer')}
                  </button>
                ))}
              </div>

              {/* Difficulty selector (only for bots) */}
              {cfg.type === 'bot' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {t('gameSetup.aiDifficulty')}
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
                    {SELECTABLE_DIFFICULTIES.map(d => (
                      <option key={d} value={d}>
                         {t(DIFFICULTY_LABELS[d])}
                       </option>
                     ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Board Size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('gameSetup.boardSize')}
          </label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as BoardSize[]).map(size => (
              <button
                key={size}
                onClick={() => updateOption('boardSize', size)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition ${
                  options.boardSize === size
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                {t(BOARD_SIZE_LABELS[size])}
              </button>
            ))}
          </div>
        </div>

        {/* Game Options */}
        <div className="mb-8 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('gameSetup.gameOptions')}</h3>

          {/* Objective count */}
          <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2">
                {t('gameSetup.objectiveCards')}
              </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => updateOption('objectiveCount', n)}
                  className={`flex-1 py-1 rounded border-2 text-sm font-semibold transition ${
                    options.objectiveCount === n
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Enable undo */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{t('gameSetup.allowUndo')}</span>
            <button
              role="switch"
              aria-checked={options.enableUndo}
              onClick={() => updateOption('enableUndo', !options.enableUndo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                options.enableUndo ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  options.enableUndo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={startTutorial}
          className="w-full mb-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-lg transition"
        >
          {t('gameSetup.howToPlay')}
        </button>
        <button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-lg transition"
        >
          {t('gameSetup.startGame')}
        </button>
      </div>
    </div>
  );
}

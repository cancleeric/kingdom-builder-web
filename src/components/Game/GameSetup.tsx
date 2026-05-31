import { useState } from 'react';
import { PlayerConfig, BotDifficulty, GameOptions, BoardSize } from '../../types';
import { useTutorialStore } from '../../store/tutorialStore';
import { useTranslation } from 'react-i18next';

interface GameSetupProps {
  onStart: (configs: PlayerConfig[], options: GameOptions) => void;
  onBack?: () => void;
}

const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
const SELECTABLE_DIFFICULTIES: BotDifficulty[] = [
  BotDifficulty.Easy,
  BotDifficulty.Medium,
  BotDifficulty.Hard,
];

const DEFAULT_OPTIONS: GameOptions = {
  boardSize: 'large',
  objectiveCount: 3,
  enableUndo: true,
};

export function GameSetup({ onStart, onBack }: GameSetupProps) {
  const { t, i18n } = useTranslation();
  const [playerCount, setPlayerCount] = useState(2);
  const [configs, setConfigs] = useState<PlayerConfig[]>(
      DEFAULT_PLAYER_NAMES.slice(0, 2).map((name, i) => ({
        name,
        type: i === 0 ? 'human' : 'bot',
        difficulty: BotDifficulty.Medium,
      }))
  );
  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS);

  const startTutorial = useTutorialStore((s) => s.startTutorial);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setConfigs(
      DEFAULT_PLAYER_NAMES.slice(0, count).map((name, i) => ({
        name: configs[i]?.name ?? name,
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

  const difficultyLabels: Record<BotDifficulty, string> = {
    [BotDifficulty.Easy]: t('setup.difficultyEasy'),
    [BotDifficulty.Medium]: t('setup.difficultyMedium'),
    [BotDifficulty.Hard]: t('setup.difficultyHard'),
    [BotDifficulty.Normal]: t('setup.difficultyLegacy'),
  };
  const boardSizeLabels: Record<BoardSize, string> = {
    small: t('setup.boardSizeSmall'),
    medium: t('setup.boardSizeMedium'),
    large: t('setup.boardSizeLarge'),
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 px-4"
      style={{ background: 'var(--texture-parchment)', backgroundColor: 'var(--color-warm-cream-100)' }}
    >
      <div
        className="rounded-20 w-full max-w-lg p-8"
        style={{
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--shadow-lifted)',
          border: '1px solid var(--card-border)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="text-body-sm font-body font-medium px-3 py-1.5 rounded-8 transition"
              style={{ color: 'var(--color-stone-600)', backgroundColor: 'var(--color-warm-cream-200)' }}
            >
              {t('menu.back')}
            </button>
          )}
          <h1 className="font-display text-display-md flex-1 text-center" style={{ color: 'var(--color-wine-700)' }}>
            {t('setup.gameSetup')}
          </h1>
          <div style={{ width: onBack ? '56px' : '0' }} />
        </div>

        {/* Language selector */}
        <div className="mb-5 flex justify-end">
          <select
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            aria-label={t('common.language')}
            className="border rounded-8 px-2 py-1 text-body-sm"
            style={{
              backgroundColor: 'var(--color-warm-cream-50)',
              borderColor: 'var(--card-border)',
              color: 'var(--color-stone-700)',
            }}
          >
            <option value="en">{t('common.english')}</option>
            <option value="zh-TW">{t('common.traditionalChinese')}</option>
          </select>
        </div>

        {/* Player Count */}
        <div className="mb-5">
          <label className="block text-body-sm font-body font-medium mb-2" style={{ color: 'var(--color-stone-700)' }}>
            {t('setup.numberOfPlayers')}
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => handlePlayerCountChange(n)}
                className="flex-1 py-2 rounded-12 font-body font-semibold transition"
                style={
                  playerCount === n
                    ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)', border: '2px solid var(--button-primary-bg)' }
                    : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '2px solid var(--card-border)' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Per-player config */}
        <div className="space-y-3 mb-5">
          {configs.map((cfg, i) => (
            <div
              key={i}
              className="rounded-12 p-4"
              style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="font-body font-semibold w-20 text-body-sm" style={{ color: 'var(--color-stone-700)' }}>
                  {t('setup.playerLabel', { number: i + 1 })}
                </span>
                <input
                  type="text"
                  value={cfg.name}
                  onChange={e => updateConfig(i, { name: e.target.value })}
                  className="flex-1 rounded-8 px-2 py-1 text-body-sm"
                  style={{
                    border: '1px solid var(--card-border)',
                    backgroundColor: 'var(--color-warm-cream-50)',
                    color: 'var(--color-stone-800)',
                  }}
                  placeholder={t('setup.playerPlaceholder', { number: i + 1 })}
                  aria-label={t('setup.playerLabel', { number: i + 1 })}
                />
              </div>

              {/* Human / Bot toggle */}
              <div className="flex gap-2 mb-2">
                {(['human', 'bot'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateConfig(i, { type })}
                    className="px-3 py-1 rounded-8 text-body-sm font-body font-medium transition"
                    style={
                      cfg.type === type
                        ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)' }
                        : { backgroundColor: 'var(--color-warm-cream-200)', color: 'var(--color-stone-700)' }
                    }
                  >
                    {type === 'human' ? t('setup.human') : t('setup.computer')}
                  </button>
                ))}
              </div>

              {/* Difficulty selector (only for bots) */}
              {cfg.type === 'bot' && (
                <div>
                  <label className="block text-label mb-1" style={{ color: 'var(--color-stone-500)' }}>
                    {t('setup.aiDifficulty')}
                  </label>
                  <select
                    value={cfg.difficulty}
                    onChange={e => updateConfig(i, { difficulty: e.target.value as BotDifficulty })}
                    className="w-full rounded-8 px-2 py-1 text-body-sm"
                    style={{
                      border: '1px solid var(--card-border)',
                      backgroundColor: 'var(--color-warm-cream-50)',
                      color: 'var(--color-stone-800)',
                    }}
                    aria-label={t('setup.aiDifficulty')}
                  >
                    {SELECTABLE_DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{difficultyLabels[d]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Board Size */}
        <div className="mb-5">
          <label className="block text-body-sm font-body font-medium mb-2" style={{ color: 'var(--color-stone-700)' }}>
            {t('setup.boardSize')}
          </label>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as BoardSize[]).map(size => (
              <button
                key={size}
                onClick={() => updateOption('boardSize', size)}
                className="flex-1 py-2 rounded-12 text-body-sm font-body font-semibold transition"
                style={
                  options.boardSize === size
                    ? { backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-text)', border: '2px solid var(--button-secondary-bg)' }
                    : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '2px solid var(--card-border)' }
                }
              >
                {boardSizeLabels[size]}
              </button>
            ))}
          </div>
        </div>

        {/* Game Options */}
        <div
          className="mb-7 rounded-12 p-4"
          style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)' }}
        >
          <h3 className="text-body-sm font-body font-semibold mb-3" style={{ color: 'var(--color-stone-700)' }}>
            {t('setup.gameOptions')}
          </h3>

          {/* Objective count */}
          <div className="mb-4">
            <label className="block text-label mb-2" style={{ color: 'var(--color-stone-500)' }}>
              {t('setup.objectiveCards')}
            </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => updateOption('objectiveCount', n)}
                  className="flex-1 py-1 rounded-8 text-body-sm font-body font-semibold transition"
                  style={
                    options.objectiveCount === n
                      ? { backgroundColor: 'var(--color-wine-600)', color: 'var(--button-text)', border: '2px solid var(--color-wine-600)' }
                      : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '2px solid var(--card-border)' }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Enable undo */}
          <div className="flex items-center justify-between">
            <span className="text-label font-body" style={{ color: 'var(--color-stone-600)' }}>{t('setup.allowUndo')}</span>
            <button
              role="switch"
              aria-checked={options.enableUndo}
              aria-label={t('setup.allowUndo')}
              onClick={() => updateOption('enableUndo', !options.enableUndo)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition"
              style={{ backgroundColor: options.enableUndo ? 'var(--color-ink-green-500)' : 'var(--color-stone-300)' }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition"
                style={{ transform: options.enableUndo ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
              />
            </button>
          </div>
        </div>

        <button
          onClick={startTutorial}
          className="w-full mb-3 font-body font-bold py-3 rounded-14 text-body-lg transition"
          style={{ backgroundColor: 'var(--color-amber-500)', color: 'var(--button-text)' }}
        >
          {t('setup.tutorial')}
        </button>
        <button
          onClick={handleStart}
          className="w-full font-body font-bold py-3 rounded-14 text-body-lg transition"
          style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)', boxShadow: 'var(--shadow-medium)' }}
        >
          {t('setup.startGame')}
        </button>
      </div>
    </div>
  );
}

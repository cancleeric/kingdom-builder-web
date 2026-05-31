import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGame, clearSave } from '../../store/persistence';
import { gameStore } from '../../store/gameStore';
import { useAchievementStore, getUnlockedCount } from '../../store/achievementStore';
import { useTutorialStore } from '../../store/tutorialStore';
import {
  AchievementIcon,
  MutedIcon,
  UnmutedIcon,
  SettingsIcon,
  LeaderboardIcon,
  ReplayIcon,
  TutorialIcon,
  SaveIcon,
  PlayIcon,
  ConnectedIcon,
} from '../icons';
import { LeaderboardModal } from '../Game/LeaderboardModal';
import { ReplayModal } from '../Game/ReplayModal';
import { AchievementPanel } from '../Game/AchievementPanel';
import { SettingsModal } from './SettingsModal';
import { getVolume, setVolume } from '../../utils/soundEngine';

interface MainMenuProps {
  muted: boolean;
  onToggleMute: () => void;
  onSinglePlayer: () => void;
  onContinueGame: () => void;
  onMultiplayer: () => void;
  onLanguageChange: (lang: string) => void;
}

export function MainMenu({
  muted,
  onToggleMute,
  onSinglePlayer,
  onContinueGame,
  onMultiplayer,
  onLanguageChange,
}: MainMenuProps) {
  const { t, i18n } = useTranslation();
  const [hasSave, setHasSave] = useState(() => loadGame() !== null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volume, setVolumeState] = useState(() => getVolume());
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const achievementUnlockedCount = useAchievementStore((s) => getUnlockedCount(s.achievements));
  const startTutorial = useTutorialStore((s) => s.startTutorial);

  const handleContinue = () => {
    gameStore.getState().loadSavedGame();
    onContinueGame();
  };

  const handleClearSave = () => {
    clearSave();
    setHasSave(false);
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
    setVolumeState(nextVolume);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--texture-parchment)', backgroundColor: 'var(--color-warm-cream-100)' }}
    >
      {/* Control bar — top right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <select
          value={i18n.language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label={t('common.language')}
          className="text-xs rounded-8 px-2 py-1 border"
          style={{
            backgroundColor: 'var(--color-warm-cream-50)',
            borderColor: 'var(--card-border)',
            color: 'var(--color-stone-700)',
          }}
        >
          <option value="en">{t('common.english')}</option>
          <option value="zh-TW">{t('common.traditionalChinese')}</option>
        </select>

        <button
          onClick={onToggleMute}
          aria-label={muted ? t('app.unmute') : t('app.mute')}
          title={muted ? t('app.unmute') : t('app.mute')}
          className="w-9 h-9 flex items-center justify-center rounded-full transition"
          style={{
            backgroundColor: 'var(--color-warm-cream-200)',
            color: 'var(--color-stone-700)',
          }}
        >
          {muted ? <MutedIcon size={18} /> : <UnmutedIcon size={18} />}
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          aria-label={t('menu.settings')}
          title={t('menu.settings')}
          className="w-9 h-9 flex items-center justify-center rounded-full transition"
          style={{
            backgroundColor: 'var(--color-warm-cream-200)',
            color: 'var(--color-stone-700)',
          }}
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Centre content */}
      <div className="flex flex-col items-center w-full max-w-sm px-6 gap-6">

        {/* Logo + subtitle */}
        <div className="text-center mb-2">
          <h1
            className="font-display text-display-xl leading-tight"
            style={{ color: 'var(--color-wine-700)' }}
          >
            {t('common.appName')}
          </h1>
          <p
            className="mt-1 text-body-sm font-body tracking-wide"
            style={{ color: 'var(--color-stone-600)' }}
          >
            {t('menu.subtitle')}
          </p>
        </div>

        {/* Primary CTA stack */}
        <div className="w-full flex flex-col gap-3">
          {/* Single Player */}
          <button
            onClick={onSinglePlayer}
            className="w-full flex items-center justify-center gap-2 font-body font-semibold py-4 rounded-14 transition"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-text)',
              boxShadow: 'var(--shadow-medium)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--button-primary-bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--button-primary-bg)';
            }}
          >
            <PlayIcon size={20} />
            {t('menu.singlePlayer')}
          </button>

          {/* Online Multiplayer */}
          <button
            onClick={onMultiplayer}
            className="w-full flex items-center justify-center gap-2 font-body font-semibold py-4 rounded-14 transition"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              color: 'var(--button-text)',
              boxShadow: 'var(--shadow-soft)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--button-secondary-bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--button-secondary-bg)';
            }}
          >
            <ConnectedIcon size={20} />
            {t('menu.onlineMultiplayer')}
          </button>

          {/* Continue */}
          <button
            onClick={hasSave ? handleContinue : undefined}
            disabled={!hasSave}
            className="w-full flex items-center justify-center gap-2 font-body font-semibold py-4 rounded-14 transition"
            style={
              hasSave
                ? {
                    backgroundColor: 'var(--color-amber-600)',
                    color: 'var(--button-text)',
                    boxShadow: 'var(--shadow-soft)',
                  }
                : {
                    backgroundColor: 'var(--color-warm-cream-300)',
                    color: 'var(--color-stone-500)',
                    cursor: 'not-allowed',
                  }
            }
          >
            <SaveIcon size={20} />
            {t('menu.continue')}
            {!hasSave && (
              <span className="text-xs ml-1 opacity-70">({t('menu.noSave')})</span>
            )}
          </button>
        </div>

        {/* Secondary chip row */}
        <div className="w-full flex flex-wrap justify-center gap-2">
          <button
            onClick={startTutorial}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-body font-medium transition"
            style={{
              backgroundColor: 'var(--chip-bg)',
              color: 'var(--chip-text)',
              border: '1px solid var(--card-border)',
            }}
          >
            <TutorialIcon size={14} />
            {t('menu.tutorial')}
          </button>

          <button
            onClick={() => setLeaderboardOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-body font-medium transition"
            style={{
              backgroundColor: 'var(--chip-bg)',
              color: 'var(--chip-text)',
              border: '1px solid var(--card-border)',
            }}
          >
            <LeaderboardIcon size={14} />
            {t('menu.leaderboard')}
          </button>

          <button
            onClick={() => setAchievementOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-body font-medium transition"
            style={{
              backgroundColor: 'var(--chip-bg)',
              color: 'var(--chip-text)',
              border: '1px solid var(--card-border)',
            }}
            aria-label={t('achievement.open')}
          >
            <AchievementIcon size={14} />
            {t('menu.achievements')}
            {achievementUnlockedCount > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
              >
                {achievementUnlockedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setReplayOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-body font-medium transition"
            style={{
              backgroundColor: 'var(--chip-bg)',
              color: 'var(--chip-text)',
              border: '1px solid var(--card-border)',
            }}
          >
            <ReplayIcon size={14} />
            {t('menu.replayLibrary')}
          </button>
        </div>

        {/* Clear save (if exists) */}
        {hasSave && (
          <button
            onClick={handleClearSave}
            className="text-label font-body transition"
            style={{ color: 'var(--color-stone-400)' }}
          >
            {t('saveLoad.clearSave')}
          </button>
        )}
      </div>

      {/* Modals */}
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <ReplayModal isOpen={replayOpen} onClose={() => setReplayOpen(false)} />
      {achievementOpen && <AchievementPanel onClose={() => setAchievementOpen(false)} />}
      <SettingsModal
        isOpen={settingsOpen}
        muted={muted}
        volume={volume}
        language={i18n.language}
        onClose={() => setSettingsOpen(false)}
        onToggleMute={onToggleMute}
        onVolumeChange={handleVolumeChange}
        onLanguageChange={onLanguageChange}
      />
    </div>
  );
}

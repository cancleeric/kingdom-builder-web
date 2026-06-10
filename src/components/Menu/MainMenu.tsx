import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { loadGame, clearSave } from '../../store/persistence';
import { gameStore } from '../../store/gameStore';
import { useAchievementStore, getUnlockedCount } from '../../store/achievementStore';
import { useTutorialStore } from '../../store/tutorialStore';
import { KingdomCrest } from './KingdomCrest';
import { MenuBackground } from './MenuBackground';
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
import { AchievementPanel } from '../Game/AchievementPanel';
import { ModalLoadingFallback } from '../UI/ModalLoadingFallback';

const LeaderboardModal = lazy(() =>
  import('../Game/LeaderboardModal').then(m => ({ default: m.LeaderboardModal }))
)
const ReplayModal = lazy(() =>
  import('../Game/ReplayModal').then(m => ({ default: m.ReplayModal }))
)
import { SettingsModal } from './SettingsModal';
import { getVolume, setVolume } from '../../utils/soundEngine';

interface MainMenuProps {
  muted: boolean;
  onToggleMute: () => void;
  onSinglePlayer: () => void;
  onContinueGame: () => void;
  onMultiplayer: () => void;
  onLanguageChange: (lang: string) => void;
  onMapEditor?: () => void;
}

export function MainMenu({
  muted,
  onToggleMute,
  onSinglePlayer,
  onContinueGame,
  onMultiplayer,
  onLanguageChange,
  onMapEditor,
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
  const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

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
      {/* R26：氛圍背景層（絕對定位，pointer-events none） */}
      <MenuBackground isDark={isDark} />

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

      {/* Centre content（z-index 高於背景層） */}
      <div className="flex flex-col items-center w-full max-w-sm px-6 gap-6" style={{ position: 'relative', zIndex: 3 }}>

        {/* Logo + subtitle */}
        <div className="text-center mb-2">

          {/* R26：王國紋章（標題上方） */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <KingdomCrest
              isDark={isDark}
              style={{ width: 'clamp(84px, 10vw, 120px)', height: 'auto' }}
            />
          </div>

          {/* R26：標題升級——漸層 + 自適應字級 */}
          <h1
            className="font-display menu-title-gradient leading-tight"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            }}
          >
            {t('common.appName')}
          </h1>

          {/* R26：Flourish 分隔線 SVG */}
          <svg
            width="200"
            height="12"
            viewBox="0 0 200 12"
            style={{ display: 'block', margin: '4px auto 0', pointerEvents: 'none' }}
            aria-hidden="true"
          >
            {/* 左線 */}
            <line x1="10" y1="6" x2="78" y2="6" className="menu-flourish-line" strokeWidth="1" />
            {/* 左菱形 */}
            <rect x="84" y="3.5" width="5" height="5" transform="rotate(45 86.5 6)" className="menu-flourish-diamond" />
            {/* 中央小皇冠形符號：三個小點 */}
            <circle cx="97"  cy="6" r="1.5" className="menu-flourish-diamond" />
            <circle cx="100" cy="4" r="1.5" className="menu-flourish-diamond" />
            <circle cx="103" cy="6" r="1.5" className="menu-flourish-diamond" />
            {/* 右菱形 */}
            <rect x="111" y="3.5" width="5" height="5" transform="rotate(45 113.5 6)" className="menu-flourish-diamond" />
            {/* 右線 */}
            <line x1="122" y1="6" x2="190" y2="6" className="menu-flourish-line" strokeWidth="1" />
          </svg>

          <p
            className="mt-2 text-body-sm font-body"
            style={{
              color: 'var(--color-stone-600)',
              opacity: 0.85,
              letterSpacing: '0.12em',
            }}
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

          {onMapEditor && (
            <button
              onClick={onMapEditor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-body font-medium transition"
              style={{
                backgroundColor: 'var(--chip-bg)',
                color: 'var(--chip-text)',
                border: '1px solid var(--card-border)',
              }}
            >
              {t('mapEditor.entryButton')}
            </button>
          )}
        </div>

        {/* Other Games portal */}
        <div className="w-full" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
          <p
            className="text-center text-label font-body mb-3"
            style={{
              color: 'var(--color-stone-500)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('menu.otherGames')}
          </p>
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}
          >
            {/* Gress Herbalism */}
            <a
              href={import.meta.env.VITE_URL_HERBALISM ?? 'http://192.168.50.83:8085/lobby/herbalism'}
              target="_blank"
              rel="noopener"
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-14 transition"
              style={{
                backgroundColor: 'var(--color-warm-cream-200)',
                border: '1px solid var(--card-border)',
                color: 'var(--color-stone-700)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-300)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-wine-400)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-200)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)';
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">🌿</span>
              <span className="font-body font-semibold" style={{ fontSize: 'var(--type-body-sm)', textAlign: 'center' }}>
                {t('menu.herbalism')}
              </span>
              <span className="font-body" style={{ fontSize: 'var(--type-label)', color: 'var(--color-stone-500)', textAlign: 'center' }}>
                {t('menu.herbalismDesc')}
              </span>
            </a>
            {/* Evolution */}
            <a
              href={import.meta.env.VITE_URL_EVOLUTION ?? 'http://192.168.50.83:8085/lobby/evolution'}
              target="_blank"
              rel="noopener"
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-14 transition"
              style={{
                backgroundColor: 'var(--color-warm-cream-200)',
                border: '1px solid var(--card-border)',
                color: 'var(--color-stone-700)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-300)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-wine-400)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-200)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)';
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">🧬</span>
              <span className="font-body font-semibold" style={{ fontSize: 'var(--type-body-sm)', textAlign: 'center' }}>
                {t('menu.evolution')}
              </span>
              <span className="font-body" style={{ fontSize: 'var(--type-label)', color: 'var(--color-stone-500)', textAlign: 'center' }}>
                {t('menu.evolutionDesc')}
              </span>
            </a>
            {/* Sudoku */}
            <a
              href={import.meta.env.VITE_URL_SUDOKU ?? 'http://192.168.50.83:8089/'}
              target="_blank"
              rel="noopener"
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-14 transition"
              style={{
                backgroundColor: 'var(--color-warm-cream-200)',
                border: '1px solid var(--card-border)',
                color: 'var(--color-stone-700)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-300)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-wine-400)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--color-warm-cream-200)';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)';
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }} aria-hidden="true">🔢</span>
              <span className="font-body font-semibold" style={{ fontSize: 'var(--type-body-sm)', textAlign: 'center' }}>
                {t('menu.sudoku')}
              </span>
              <span className="font-body" style={{ fontSize: 'var(--type-label)', color: 'var(--color-stone-500)', textAlign: 'center' }}>
                {t('menu.sudokuDesc')}
              </span>
            </a>
          </div>
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
      {leaderboardOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
        </Suspense>
      )}
      {replayOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ReplayModal isOpen={replayOpen} onClose={() => setReplayOpen(false)} />
        </Suspense>
      )}
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

import { useState } from 'react';
import { loadGame, clearSave } from '../store/persistence';
import { gameStore } from '../store/gameStore';
import { useTranslation } from 'react-i18next';

interface SaveLoadUIProps {
  onGameLoaded?: () => void;
}

export function SaveLoadUI({ onGameLoaded }: SaveLoadUIProps) {
  const { t } = useTranslation();
  const [hasSave, setHasSave] = useState(() => loadGame() !== null);

  const handleContinue = () => {
    gameStore.getState().loadSavedGame();
    onGameLoaded?.();
  };

  const handleNewGame = () => {
    clearSave();
    setHasSave(false);
  };

  const handleClearSave = () => {
    clearSave();
    setHasSave(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {hasSave && (
        <button
          onClick={handleContinue}
          className="w-full font-bold py-2 px-4 rounded transition"
          style={{
            background: 'var(--button-secondary-bg)',
            color: 'var(--button-text)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-secondary-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-secondary-bg)')}
        >
          {t('saveLoad.continueGame')}
        </button>
      )}
      {hasSave && (
        <button
          onClick={handleNewGame}
          className="w-full font-bold py-2 px-4 rounded transition"
          style={{
            background: 'var(--button-primary-bg)',
            color: 'var(--button-text)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--button-primary-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--button-primary-bg)')}
        >
          {t('saveLoad.newGame')}
        </button>
      )}
      {hasSave && (
        <button
          onClick={handleClearSave}
          className="w-full font-bold py-2 px-4 rounded transition border"
          style={{
            background: 'oklch(0.95 0.02 20 / 0.25)',
            color: 'var(--color-wine-700)',
            borderColor: 'var(--color-danger)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.90 0.03 20 / 0.4)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.95 0.02 20 / 0.25)')}
        >
          {t('saveLoad.clearSave')}
        </button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { loadGame, clearSave } from '../store/persistence';
import { gameStore } from '../store/gameStore';

interface SaveLoadUIProps {
  onGameLoaded?: () => void;
}

export function SaveLoadUI({ onGameLoaded }: SaveLoadUIProps) {
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
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
        >
          繼續遊戲 (Continue)
        </button>
      )}
      {hasSave && (
        <button
          onClick={handleNewGame}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
        >
          新遊戲 (New Game)
        </button>
      )}
      {hasSave && (
        <button
          onClick={handleClearSave}
          className="w-full font-bold py-2 px-4 rounded transition border bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
        >
          清除存檔 (Clear Save)
        </button>
      )}
    </div>
  );
}

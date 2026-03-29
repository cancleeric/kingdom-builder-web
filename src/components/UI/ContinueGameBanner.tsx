import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSaveMetadata } from '../../utils/saveGame';

interface ContinueGameBannerProps {
  /** Called when the user starts a new game */
  onNewGame?: () => void;
  /** Called when the user continues a saved game */
  onContinue?: () => void;
}

/**
 * Detects whether a save exists and renders buttons so the player
 * can either continue their saved game or start a new one.
 */
export function ContinueGameBanner({ onNewGame, onContinue }: ContinueGameBannerProps) {
  const { hasSave, checkForSave, continueGame, newGame, clearSaveData } = useGameStore();

  useEffect(() => {
    checkForSave();
  }, [checkForSave]);

  const meta = hasSave ? getSaveMetadata() : null;

  const handleContinue = () => {
    const ok = continueGame();
    if (ok) onContinue?.();
  };

  const handleNewGame = () => {
    newGame();
    onNewGame?.();
  };

  if (!hasSave) {
    return (
      <div className="continue-game-banner">
        <button onClick={handleNewGame}>新遊戲</button>
      </div>
    );
  }

  const savedAt = meta?.savedAt
    ? new Date(meta.savedAt).toLocaleString()
    : '未知時間';

  return (
    <div className="continue-game-banner">
      <p>找到存檔（{savedAt}）</p>
      <button onClick={handleContinue}>繼續遊戲</button>
      <button onClick={handleNewGame}>新遊戲</button>
      <button
        onClick={clearSaveData}
        style={{ marginLeft: '8px', color: 'red' }}
      >
        清除存檔
      </button>
    </div>
  );
}

export default ContinueGameBanner;

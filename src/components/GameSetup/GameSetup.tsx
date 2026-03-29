import React from 'react';
import { useTutorialStore } from '../../store/tutorialStore';

interface GameSetupProps {
  /** Called when the player confirms settings and wants to start a normal game */
  onStartGame?: () => void;
}

/**
 * GameSetup displays the player configuration panel before a game begins.
 * It includes a "觀看教學" (Watch Tutorial) button that launches the tutorial.
 */
const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const { startTutorial, isCompleted } = useTutorialStore();

  const handleStartTutorial = () => {
    startTutorial();
  };

  const handleStartGame = () => {
    onStartGame?.();
  };

  return (
    <div
      id="game-setup"
      data-testid="game-setup"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: '48px',
          fontWeight: 800,
          marginBottom: '8px',
          letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Kingdom Builder
      </h1>
      <p
        style={{ color: '#64748b', fontSize: '16px', marginBottom: '48px' }}
      >
        六角格策略棋盤遊戲
      </p>

      {/* Panel */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
          遊戲設定
        </h2>

        {/* Placeholder player name field */}
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="player-name"
            style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '6px' }}
          >
            玩家名稱
          </label>
          <input
            id="player-name"
            type="text"
            placeholder="請輸入你的名稱"
            defaultValue="玩家 1"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              backgroundColor: '#0f172a',
              color: '#f1f5f9',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '24px 0' }} />

        {/* Tutorial hint */}
        {!isCompleted && (
          <div
            data-testid="tutorial-hint"
            style={{
              backgroundColor: '#172554',
              border: '1px solid #1d4ed8',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#93c5fd',
            }}
          >
            💡 第一次玩嗎？建議先觀看互動式教學，學習遊戲規則！
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Watch Tutorial button */}
          <button
            onClick={handleStartTutorial}
            data-testid="watch-tutorial-button"
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '2px solid #3b82f6',
              backgroundColor: 'transparent',
              color: '#3b82f6',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6';
            }}
          >
            📖 觀看教學
          </button>

          {/* Start game button */}
          <button
            onClick={handleStartGame}
            data-testid="start-game-button"
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
            }}
          >
            🎮 開始遊戲
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;

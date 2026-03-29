import { useEffect } from 'react';
import { HexGrid } from './components/Board/HexGrid';
import { BottomDrawer } from './components/UI/BottomDrawer';
import { useGameStore } from './store/gameStore';
import { TERRAIN_LABELS } from './core/hex';
import type { HexCoord } from './types';

function App() {
  const {
    board,
    currentPlayer,
    currentTerrain,
    placementsLeft,
    phase,
    turn,
    players,
    initGame,
    drawTerrain,
    placeSettlement,
  } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = (coord: HexCoord) => {
    if (phase === 'place') {
      placeSettlement(coord);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        <h1 className="text-lg font-bold tracking-wide">👑 Kingdom Builder</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>回合 {turn}</span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Board area — full width on mobile, ~60% on tablet, remaining on desktop */}
        <main
          className="flex-1 relative overflow-hidden"
          aria-label="遊戲棋盤"
        >
          <HexGrid cells={board} onCellClick={handleCellClick} />
        </main>

        {/* Sidebar — hidden on mobile (<768px), 40% on tablet, fixed width on desktop */}
        <aside
          className="hidden md:flex md:w-2/5 lg:w-72 xl:w-80 flex-col gap-4 p-4 bg-gray-900 border-l border-gray-700 overflow-y-auto shrink-0"
          aria-label="遊戲資訊面板"
        >
          <GamePanel
            currentPlayer={currentPlayer}
            players={players}
            currentTerrain={currentTerrain}
            placementsLeft={placementsLeft}
            phase={phase}
            onDrawTerrain={drawTerrain}
          />
        </aside>
      </div>

      {/* Mobile bottom drawer — only visible on <768px */}
      <BottomDrawer
        title={`${currentPlayer.name} — ${phase === 'draw' ? '抽地形卡' : `放置 ${placementsLeft} 個聚落`}`}
      >
        <GamePanel
          currentPlayer={currentPlayer}
          players={players}
          currentTerrain={currentTerrain}
          placementsLeft={placementsLeft}
          phase={phase}
          onDrawTerrain={drawTerrain}
        />
      </BottomDrawer>

      {/* Bottom spacing for mobile drawer handle */}
      <div className="md:hidden h-14 shrink-0 bg-gray-950" />
    </div>
  );
}

interface GamePanelProps {
  currentPlayer: { name: string; color: string; settlements: number };
  players: { id: number; name: string; color: string; settlements: number }[];
  currentTerrain: string | null;
  placementsLeft: number;
  phase: string;
  onDrawTerrain: () => void;
}

function GamePanel({
  currentPlayer,
  players,
  currentTerrain,
  placementsLeft,
  phase,
  onDrawTerrain,
}: GamePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Current player */}
      <div className="rounded-xl bg-gray-800 p-3">
        <p className="text-xs text-gray-400 mb-1">目前玩家</p>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full shrink-0"
            style={{ background: currentPlayer.color }}
          />
          <span className="font-semibold">{currentPlayer.name}</span>
          <span className="ml-auto text-sm text-gray-400">
            剩餘聚落: {currentPlayer.settlements}
          </span>
        </div>
      </div>

      {/* Current terrain card */}
      <div className="rounded-xl bg-gray-800 p-3">
        <p className="text-xs text-gray-400 mb-2">地形卡</p>
        {currentTerrain ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">🃏</span>
            <span className="font-semibold">
              {TERRAIN_LABELS[currentTerrain as keyof typeof TERRAIN_LABELS] ?? currentTerrain}
            </span>
            {phase === 'place' && (
              <span className="ml-auto text-sm text-yellow-400">
                ×{placementsLeft} 次
              </span>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">尚未抽卡</p>
        )}
      </div>

      {/* Action button */}
      {phase === 'draw' && (
        <button
          className="w-full min-h-[44px] rounded-xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-gray-900 font-bold text-base py-3 touch-manipulation transition-colors"
          onClick={onDrawTerrain}
          aria-label="抽取地形卡"
        >
          抽地形卡 🎴
        </button>
      )}

      {phase === 'place' && (
        <div className="rounded-xl bg-blue-900/50 p-3 text-sm text-blue-300">
          點選高亮格子放置聚落（剩餘 {placementsLeft} 次）
        </div>
      )}

      {/* Players */}
      <div className="rounded-xl bg-gray-800 p-3">
        <p className="text-xs text-gray-400 mb-2">玩家狀態</p>
        <ul className="flex flex-col gap-2">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: p.color }}
              />
              <span>{p.name}</span>
              <span className="ml-auto text-gray-400">聚落 {p.settlements}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

import { useCallback, useMemo } from 'react';
import type { Hex, PlayerType } from './types';
import { useGameStore } from './store/gameStore';
import { getValidPlacements } from './core/board';
import { GameSetup } from './components/Game/GameSetup';
import { GameFinished } from './components/Game/GameFinished';
import { HexBoardWrapper } from './components/Board/HexBoard';
import { GamePanel } from './components/UI/GamePanel';
import './index.css';
function App() {
  const phase = useGameStore((s) => s.phase);
  const cells = useGameStore((s) => s.cells);
  const players = useGameStore((s) => s.players);
  const currentPlayer = useGameStore((s) => s.currentPlayer);
  const currentTerrain = useGameStore((s) => s.currentTerrain);
  const objectives = useGameStore((s) => s.objectives);
  const placementsThisTurn = useGameStore((s) => s.placementsThisTurn);
  const placementsRequired = useGameStore((s) => s.placementsRequired);

  const startGame = useGameStore((s) => s.startGame);
  const drawCard = useGameStore((s) => s.drawCard);
  const placeSettlement = useGameStore((s) => s.placeSettlement);
  const endTurn = useGameStore((s) => s.endTurn);
  const resetGame = useGameStore((s) => s.resetGame);

  const validPlacements = useMemo(() => {
    if (phase !== 'playing' || !currentTerrain) return [];
    return getValidPlacements({
      phase,
      cells,
      players,
      currentPlayer,
      currentTerrain,
      placementsThisTurn,
      placementsRequired,
      objectives,
      turnHistory: [],
      terrainDeck: [],
    });
  }, [phase, cells, players, currentPlayer, currentTerrain, placementsThisTurn, placementsRequired, objectives]);

  const handleStart = useCallback(
    (playerTypes: PlayerType[], seed?: number) => {
      startGame(playerTypes, seed);
    },
    [startGame]
  );

  const handleCellClick = useCallback(
    (hex: Hex) => {
      placeSettlement(hex);
    },
    [placeSettlement]
  );

  const playerColors = players.map((p) => p.color);

  if (phase === 'setup') {
    return <GameSetup onStart={handleStart} />;
  }

  if (phase === 'finished') {
    return (
      <GameFinished
        players={players}
        objectives={objectives}
        onPlayAgain={resetGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-amber-700 text-white px-6 py-3 shadow-md">
        <h1 className="text-xl font-bold">👑 Kingdom Builder</h1>
      </header>
      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex-1 flex items-start justify-center">
          <HexBoardWrapper
            cells={cells}
            validPlacements={validPlacements}
            playerColors={playerColors}
            onCellClick={handleCellClick}
          />
        </div>
        <GamePanel
          players={players}
          currentPlayer={currentPlayer}
          currentTerrain={currentTerrain}
          objectives={objectives}
          placementsThisTurn={placementsThisTurn}
          placementsRequired={placementsRequired}
          phase={phase}
          onDrawCard={drawCard}
          onEndTurn={endTurn}
          onReset={resetGame}
        />
      </main>
    </div>
  );
}

export default App;

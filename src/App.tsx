import { useGameStore } from './store/gameStore';
import { GameSetup } from './components/Setup/GameSetup';
import { GameScreen } from './components/Game/GameScreen';
import type { PlayerConfig } from './types/setup';

function App() {
  const { screen, gameState, startGame, returnToSetup, placeSettlement, drawTerrain } = useGameStore();

  function handleStart(players: PlayerConfig[]) {
    startGame(players);
  }

  if (screen === 'setup' || !gameState) {
    return <GameSetup onStart={handleStart} />;
  }

  return (
    <GameScreen
      gameState={gameState}
      onPlaceSettlement={placeSettlement}
      onNewGame={returnToSetup}
      onDrawTerrain={drawTerrain}
    />
  );
}

export default App;

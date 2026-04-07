import { useGameStore } from './store/gameStore';
import GameLog from './components/Game/GameLog';

function App() {
  const {
    board,
    players,
    currentPlayerIndex,
    currentTurn,
    currentCard,
    placementsThisTurn,
    maxPlacementsPerTurn,
    history,
    canUndo,
    phase,
    startGame,
    placeSettlement,
    endTurn,
    undoLastAction,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];

  if (phase === 'setup') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Kingdom Builder</h1>
        <button onClick={() => startGame(2)}>Start 2 Player Game</button>
        <button onClick={() => startGame(3)} style={{ marginLeft: '8px' }}>Start 3 Player Game</button>
        <button onClick={() => startGame(4)} style={{ marginLeft: '8px' }}>Start 4 Player Game</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <h1>Kingdom Builder</h1>
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ color: currentPlayer?.color }}>
            Turn {currentTurn} — {currentPlayer?.name}
          </strong>
          <span style={{ marginLeft: '16px' }}>
            Card: {currentCard ?? 'N/A'} |
            Placements: {placementsThisTurn}/{maxPlacementsPerTurn}
          </span>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              onClick={undoLastAction}
              disabled={!canUndo}
              style={{
                padding: '4px 12px',
                opacity: canUndo ? 1 : 0.4,
                cursor: canUndo ? 'pointer' : 'not-allowed',
              }}
            >
              ↩ Undo
            </button>
            <button
              onClick={endTurn}
              style={{ padding: '4px 12px' }}
            >
              End Turn
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          maxWidth: '600px',
        }}>
          {board.map(cell => {
            const owner = cell.owner !== undefined ? players[cell.owner] : null;
            return (
              <div
                key={`${cell.q}-${cell.r}`}
                onClick={() => placeSettlement({ q: cell.q, r: cell.r })}
                title={`Q${cell.q}R${cell.r} — ${cell.terrain}`}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #ccc',
                  cursor: cell.owner === undefined ? 'pointer' : 'default',
                  backgroundColor: owner ? owner.color : getTerrainColor(cell.terrain),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: owner ? 'white' : '#333',
                  userSelect: 'none',
                }}
              >
                {owner ? '🏠' : ''}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '12px' }}>
          <strong>Players:</strong>
          {players.map(p => (
            <span
              key={p.id}
              style={{
                marginLeft: '12px',
                color: p.color,
                fontWeight: p.id === currentPlayerIndex ? 'bold' : 'normal',
              }}
            >
              {p.name}: {40 - p.settlements} settlements
            </span>
          ))}
        </div>
      </div>

      <GameLog history={history} players={players} />
    </div>
  );
}

function getTerrainColor(terrain: string): string {
  const colors: Record<string, string> = {
    grass: '#90EE90',
    forest: '#228B22',
    desert: '#F4A460',
    flower: '#FFB6C1',
    canyon: '#CD853F',
    mountain: '#808080',
    water: '#87CEEB',
    castle: '#FFD700',
    location: '#DDA0DD',
  };
  return colors[terrain] ?? '#DDD';
}

export default App;

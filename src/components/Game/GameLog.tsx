import React from 'react';
import type { GameAction, Player } from '../../types';

interface GameLogProps {
  history: GameAction[];
  players: Player[];
}

function formatAction(action: GameAction, players: Player[]): string {
  const player = players.find(p => p.id === action.playerId);
  const playerName = player?.name ?? `Player ${action.playerId + 1}`;

  switch (action.type) {
    case 'PLACE_SETTLEMENT':
      return `${playerName} placed settlement at Q${action.hex?.q ?? '?'}R${action.hex?.r ?? '?'}`;
    case 'ACQUIRE_TILE':
      return `${playerName} acquired ${action.tile ?? 'tile'}`;
    case 'MOVE_SETTLEMENT':
      return `${playerName} moved settlement to Q${action.hex?.q ?? '?'}R${action.hex?.r ?? '?'}`;
    case 'DRAW_CARD':
      return `${playerName} drew a card`;
    case 'END_TURN':
      return `${playerName} ended their turn`;
    default:
      return `${playerName} performed an action`;
  }
}

const GameLog: React.FC<GameLogProps> = ({ history, players }) => {
  const recent = [...history].reverse().slice(0, 20);

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '12px',
      width: '280px',
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: '#f9f9f9',
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 'bold' }}>
        Game Log
      </h3>
      {recent.length === 0 ? (
        <p style={{ color: '#999', fontSize: '12px' }}>No actions yet</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {recent.map(action => {
            const player = players.find(p => p.id === action.playerId);
            return (
              <li
                key={action.id}
                style={{
                  fontSize: '12px',
                  padding: '4px 0',
                  borderBottom: '1px solid #eee',
                  color: player?.color ?? '#333',
                }}
              >
                <span style={{ color: '#666', marginRight: '4px' }}>
                  [Turn {action.turnNumber}]
                </span>
                {formatAction(action, players)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default GameLog;

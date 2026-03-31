import { LocationTileType, GameState } from '../types';

export const LOCATION_TILE_POSITIONS: Record<string, Array<{ row: number; col: number }>> = {
  q1: [{ row: 2, col: 2 }, { row: 7, col: 7 }],
  q2: [{ row: 2, col: 7 }, { row: 7, col: 2 }],
  q3: [{ row: 3, col: 3 }, { row: 6, col: 6 }],
  q4: [{ row: 4, col: 4 }, { row: 5, col: 5 }],
};

export function applyLocationTile(tile: LocationTileType, gameState: GameState): GameState {
  const updatedState = { ...gameState };
  const currentPlayerIndex = updatedState.players.findIndex(p => p.id === updatedState.currentPlayer);
  if (currentPlayerIndex === -1) return gameState;

  const player = { ...updatedState.players[currentPlayerIndex] };

  switch (tile) {
    case 'farm':
    case 'barn':
      player.houses = Math.max(0, player.houses - 1);
      break;
    case 'harbor':
      break;
    case 'temple':
    case 'tavern':
      player.score += 3;
      break;
    case 'tower':
      break;
    case 'stable':
    case 'oasis':
      break;
  }

  const players = [...updatedState.players];
  players[currentPlayerIndex] = player;
  return { ...updatedState, players };
}

import React from 'react';
import type { GameState } from '../../types';
import type { PlayerColor } from '../../types/setup';
import { HexBoard } from '../Board/HexBoard';
import { PlayerPanel } from '../UI/PlayerPanel';
import { getValidPlacements } from '../../core/board';
import { calculateScore } from '../../core/scoring';
import { TERRAIN_LABELS } from '../../core/terrain';

interface GameScreenProps {
  gameState: GameState;
  onPlaceSettlement: (coord: { q: number; r: number }) => void;
  onNewGame: () => void;
  onDrawTerrain: () => void;
}

export function GameScreen({ gameState, onPlaceSettlement, onNewGame, onDrawTerrain }: GameScreenProps) {
  const scores = calculateScore(gameState);
  const playerColors = Object.fromEntries(
    gameState.players.map(p => [p.id, p.color as PlayerColor])
  );

  const validMoves = gameState.currentTerrain && gameState.placementsLeft > 0
    ? getValidPlacements(gameState.board, gameState.currentTerrain, gameState.currentPlayerIndex)
    : [];

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <div className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Kingdom Builder</h1>
          <span className="text-amber-200 text-sm">回合 {gameState.turnNumber}</span>
        </div>
        <button
          onClick={onNewGame}
          className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          新遊戲
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-white border-r border-gray-200 p-3 flex flex-col gap-4">
          <PlayerPanel
            players={gameState.players}
            currentPlayerIndex={gameState.currentPlayerIndex}
            scores={scores}
          />

          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-1">當前地形</p>
            <p className="font-bold text-amber-700">
              {gameState.currentTerrain ? TERRAIN_LABELS[gameState.currentTerrain] : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">剩餘放置: {gameState.placementsLeft}</p>
          </div>

          <div className="border-t pt-3">
            {gameState.placementsLeft === 0 && (
              <button
                onClick={onDrawTerrain}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
              >
                抽地形卡
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          {gameState.phase === 'ended' ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-amber-800 mb-4">遊戲結束！</h2>
              <div className="space-y-2 mb-6">
                {gameState.players.map((p, i) => (
                  <p key={p.id} className="text-lg">
                    {p.name}: {scores[i]} 分
                  </p>
                ))}
              </div>
              <button
                onClick={onNewGame}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl text-lg font-bold"
              >
                新遊戲
              </button>
            </div>
          ) : (
            <div>
              <p className="text-center text-sm text-gray-600 mb-2">
                {currentPlayer.name} 的回合
                {gameState.currentTerrain && ` — 在${TERRAIN_LABELS[gameState.currentTerrain]}放置`}
              </p>
              <HexBoard
                board={gameState.board}
                validMoves={validMoves}
                playerColors={playerColors}
                onCellClick={onPlaceSettlement}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

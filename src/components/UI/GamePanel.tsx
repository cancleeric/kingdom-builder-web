import React from 'react';
import type { Player, ObjectiveType, TerrainType } from '../../types';

interface GamePanelProps {
  players: Player[];
  currentPlayer: number;
  currentTerrain: TerrainType | null;
  objectives: ObjectiveType[];
  placementsThisTurn: number;
  placementsRequired: number;
  phase: string;
  onDrawCard: () => void;
  onEndTurn: () => void;
  onReset: () => void;
}

const TERRAIN_EMOJIS: Record<string, string> = {
  grassland: '🌿',
  forest: '🌲',
  desert: '🏜️',
  flower: '🌸',
  canyon: '🏔️',
  mountain: '⛰️',
  water: '🌊',
};

const OBJECTIVE_LABELS: Record<ObjectiveType, string> = {
  fisherman: 'Fisherman',
  miner: 'Miner',
  knight: 'Knight',
  lords: 'Lords',
  farmers: 'Farmers',
  hermits: 'Hermits',
  merchants: 'Merchants',
  discoverers: 'Discoverers',
  builders: 'Builders',
  shepherds: 'Shepherds',
};

export const GamePanel: React.FC<GamePanelProps> = ({
  players,
  currentPlayer,
  currentTerrain,
  objectives,
  placementsThisTurn,
  placementsRequired,
  phase,
  onDrawCard,
  onEndTurn,
  onReset,
}) => {
  const current = players[currentPlayer];
  const isHuman = current?.type === 'human';
  const canDraw = phase === 'playing' && currentTerrain === null;
  const canEndTurn = phase === 'playing' && placementsThisTurn >= placementsRequired;

  return (
    <div className="flex flex-col gap-4 w-72">
      {/* Current Turn */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-bold text-gray-700 mb-2">Current Turn</h2>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: current?.color ?? '#ccc' }}
          />
          <span className="font-medium text-gray-800">{current?.name ?? '—'}</span>
          {!isHuman && (
            <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
              AI
            </span>
          )}
        </div>

        {currentTerrain ? (
          <div className="text-sm text-gray-600">
            Terrain: <strong>{TERRAIN_EMOJIS[currentTerrain]} {currentTerrain}</strong>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">No terrain drawn yet</div>
        )}

        <div className="mt-2 text-sm text-gray-600">
          Placements: <strong>{placementsThisTurn} / {placementsRequired}</strong>
        </div>

        {/* Action Buttons */}
        {isHuman && (
          <div className="flex gap-2 mt-3">
            {canDraw && (
              <button
                onClick={onDrawCard}
                className="flex-1 text-sm py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                🃏 Draw Card
              </button>
            )}
            {canEndTurn && (
              <button
                onClick={onEndTurn}
                className="flex-1 text-sm py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                ✅ End Turn
              </button>
            )}
          </div>
        )}

        {!isHuman && phase === 'playing' && (
          <p className="text-xs text-gray-400 italic mt-2">AI is thinking...</p>
        )}
      </div>

      {/* Objectives */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-bold text-gray-700 mb-2">🎯 Objectives</h2>
        <div className="space-y-1">
          {objectives.map((obj) => (
            <div key={obj} className="text-sm text-gray-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {OBJECTIVE_LABELS[obj]}
            </div>
          ))}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-bold text-gray-700 mb-2">📊 Scoreboard</h2>
        <div className="space-y-2">
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center justify-between text-sm ${
                i === currentPlayer ? 'font-bold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-gray-700">{player.name}</span>
              </div>
              <span className="text-gray-800">{player.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location Tiles */}
      {players.some((p) => p.locationTiles.length > 0) && (
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-gray-700 mb-2">🏷️ Location Tiles</h2>
          {players.map((player) =>
            player.locationTiles.length > 0 ? (
              <div key={player.id} className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-xs font-medium text-gray-600">{player.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {player.locationTiles.map((tile, i) => (
                    <span
                      key={i}
                      className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded"
                    >
                      {tile}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="text-sm py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
      >
        ↩ Back to Setup
      </button>
    </div>
  );
};

import { useState } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function WaitingRoom() {
  const {
    room,
    playerId,
    isHost,
    connectionStatus,
    leaveRoom,
    startGame,
  } = useMultiplayerStore();

  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const canStart = isHost && room.players.length >= 2;

  const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-2">
          🎮 Waiting Room
        </h2>

        {/* Room code */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Share this code with friends</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold tracking-widest text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
              {room.id}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition"
              aria-label="Copy room code"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Players ({room.players.length}/{room.maxPlayers})
          </h3>
          <ul className="space-y-2">
            {room.players.map((player, i) => (
              <li
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg border-2"
                style={{ borderColor: PLAYER_COLORS[i] ?? '#ccc' }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: PLAYER_COLORS[i] ?? '#ccc' }}
                />
                <span className="font-medium flex-1 text-sm">
                  {player.name}
                  {player.id === room.hostId && (
                    <span className="ml-2 text-xs text-yellow-600">👑 Host</span>
                  )}
                  {player.id === playerId && (
                    <span className="ml-2 text-xs text-blue-600">(You)</span>
                  )}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    player.isConnected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {player.isConnected ? '🟢 Online' : '🔴 Offline'}
                </span>
              </li>
            ))}
          </ul>

          {room.players.length < 2 && (
            <p className="mt-3 text-xs text-gray-500 text-center italic">
              Waiting for at least one more player…
            </p>
          )}
        </div>

        {/* Game options summary */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">Game Settings</h3>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>
              <span className="block font-medium text-gray-700">Board</span>
              {room.options.boardSize}
            </div>
            <div>
              <span className="block font-medium text-gray-700">Objectives</span>
              {room.options.objectiveCount}
            </div>
            <div>
              <span className="block font-medium text-gray-700">Turn limit</span>
              {room.options.turnTimeoutSeconds}s
            </div>
          </div>
        </div>

        {/* Connection status */}
        {connectionStatus !== 'connected' && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-700 text-center">
            ⚠ Reconnecting…
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full py-3 rounded-xl font-bold text-white text-lg transition disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            >
              {canStart ? '▶ Start Game' : `Need ${2 - room.players.length} more player(s)`}
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-center text-sm">
              ⏳ Waiting for host to start…
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-2 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

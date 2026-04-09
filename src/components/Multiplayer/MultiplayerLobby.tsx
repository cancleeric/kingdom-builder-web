import { useState } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';

const DEFAULT_WS_URL = 'ws://localhost:8080';

interface MultiplayerLobbyProps {
  onBack: () => void;
}

export function MultiplayerLobby({ onBack }: MultiplayerLobbyProps) {
  const {
    connectionStatus,
    error,
    setWsUrl,
    connectAndCreate,
    connectAndJoin,
    wsUrl,
  } = useMultiplayerStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [serverUrl, setServerUrl] = useState(DEFAULT_WS_URL);
  const [boardSize, setBoardSize] = useState<'small' | 'medium' | 'large'>('large');
  const [objectiveCount, setObjectiveCount] = useState<1 | 2 | 3>(3);
  const [turnTimeout, setTurnTimeout] = useState(90);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isLoading = connectionStatus === 'connecting';

  const handleCreate = () => {
    if (!playerName.trim()) return;
    setWsUrl(serverUrl);
    connectAndCreate(playerName.trim(), {
      boardSize,
      objectiveCount,
      turnTimeoutSeconds: turnTimeout,
      enableUndo: true,
    });
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    setWsUrl(serverUrl);
    connectAndJoin(roomId.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Back to main menu"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-blue-700 flex-1 text-center pr-6">
            🌐 Multiplayer
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                tab === t
                  ? 'bg-white shadow text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t === 'create' ? '🏠 Create Room' : '🚪 Join Room'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        {/* Player Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Join: Room ID */}
        {tab === 'join' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Code
            </label>
            <input
              type="text"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. A3F8C2B1"
              maxLength={8}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}

        {/* Create: board options */}
        {tab === 'create' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board Size
              </label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setBoardSize(s)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-semibold transition ${
                      boardSize === s
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objective Cards
              </label>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setObjectiveCount(n)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-sm font-semibold transition ${
                      objectiveCount === n
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Advanced: server URL + turn timeout */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            {showAdvanced ? '▲ Hide' : '▼ Advanced settings'}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  WebSocket Server URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  Current: {wsUrl}
                </p>
              </div>
              {tab === 'create' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Turn Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={turnTimeout}
                    min={10}
                    max={300}
                    onChange={e => setTurnTimeout(Number(e.target.value))}
                    className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={isLoading || !playerName.trim() || (tab === 'join' && !roomId.trim())}
          className="w-full py-3 rounded-xl font-bold text-white text-lg transition disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
        >
          {isLoading
            ? '⏳ Connecting…'
            : tab === 'create'
            ? '🏠 Create Room'
            : '🚪 Join Room'}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { BotDifficulty } from '../../types';
import type { GameOptions, PlayerConfig } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { extractSerializableState } from '../../multiplayer/stateSerializer';

interface MultiplayerSetupProps {
  onBack: () => void;
  onGameStarted: () => void;
}

const DEFAULT_OPTIONS: GameOptions = {
  boardSize: 'large',
  objectiveCount: 3,
  enableUndo: true,
};

export function MultiplayerSetup({ onBack, onGameStarted }: MultiplayerSetupProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [serverUrl, setServerUrl] = useState(
    import.meta.env.VITE_WS_SERVER_URL ?? 'ws://localhost:8787'
  );
  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS);

  const initGame = useGameStore((s) => s.initGame);
  const {
    connectionStatus,
    room,
    localPlayerId,
    error,
    mode,
    connect,
    clearError,
    createRoom,
    joinRoom,
    setReady,
    leaveRoom,
    startGame,
  } = useMultiplayerStore();

  const sortedPlayers = useMemo(() => {
    return room?.players.slice().sort((a, b) => a.id - b.id) ?? [];
  }, [room]);

  const isHost = room && localPlayerId === room.hostPlayerId;
  const me = sortedPlayers.find((p) => p.id === localPlayerId);

  useEffect(() => {
    if (mode === 'in_game') {
      onGameStarted();
    }
  }, [mode, onGameStarted]);

  const handleConnect = () => {
    connect(serverUrl);
  };

  const handleCreate = () => {
    if (!playerName.trim()) return;
    clearError();
    createRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    clearError();
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleStart = () => {
    if (!room) return;
    const configs: PlayerConfig[] = room.players
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((p) => ({
        name: p.name,
        type: 'human',
        difficulty: BotDifficulty.Medium,
      }));

    initGame(configs, options);
    const initialState = extractSerializableState();
    startGame(initialState);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">Kingdom Builder</h1>
        <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">Online Multiplayer</h2>

        {!room && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-2"
              placeholder="ws://localhost:8787"
            />
            <button
              onClick={handleConnect}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 rounded mb-4"
            >
              {connectionStatus === 'connected' ? 'Connected' : 'Connect'}
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              placeholder="Player name"
            />

            <button
              onClick={handleCreate}
              disabled={connectionStatus !== 'connected' || !playerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded mb-3"
            >
              Create Room
            </button>

            <div className="flex gap-2 mb-4">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Room code"
              />
              <button
                onClick={handleJoin}
                disabled={connectionStatus !== 'connected' || !playerName.trim() || !roomCode.trim()}
                className="px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded"
              >
                Join
              </button>
            </div>
          </>
        )}

        {room && (
          <>
            <div className="mb-4 p-3 bg-gray-50 border rounded">
              <p className="text-sm">
                Room: <span className="font-bold tracking-widest">{room.id}</span>
              </p>
              <p className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? 'Connected' : 'Reconnecting...'}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {sortedPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    {p.id === room.hostPlayerId && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Host</span>
                    )}
                    {p.id === localPlayerId && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">You</span>
                    )}
                  </div>
                  <div className="text-xs">
                    {!p.connected ? (
                      <span className="text-red-600">Disconnected</span>
                    ) : p.ready ? (
                      <span className="text-green-700">Ready</span>
                    ) : (
                      <span className="text-gray-500">Not ready</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isHost && me && (
              <button
                onClick={() => setReady(!me.ready)}
                className={`w-full mb-3 text-white font-bold py-2 rounded ${
                  me.ready ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {me.ready ? 'Set Not Ready' : 'Set Ready'}
              </button>
            )}

            {isHost && (
              <>
                <div className="mb-4 border rounded-lg p-3 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Game Options</h3>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setOptions((prev) => ({ ...prev, boardSize: size }))}
                        className={`py-1 text-sm rounded border ${
                          options.boardSize === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {([1, 2, 3] as const).map((count) => (
                      <button
                        key={count}
                        onClick={() => setOptions((prev) => ({ ...prev, objectiveCount: count }))}
                        className={`py-1 text-sm rounded border ${
                          options.objectiveCount === count ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'
                        }`}
                      >
                        {count} Obj
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, enableUndo: !prev.enableUndo }))}
                    className={`w-full py-1 text-sm rounded border ${
                      options.enableUndo ? 'bg-teal-600 text-white border-teal-600' : 'bg-white'
                    }`}
                  >
                    Undo: {options.enableUndo ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <button
                  onClick={handleStart}
                  disabled={sortedPlayers.length < 2}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded mb-3"
                >
                  Start Multiplayer Game
                </button>
              </>
            )}

            <button
              onClick={leaveRoom}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded mb-2"
            >
              Leave Room
            </button>
          </>
        )}

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <button
          onClick={onBack}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}

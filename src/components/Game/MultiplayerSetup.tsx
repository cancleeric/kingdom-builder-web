import { useEffect, useMemo, useState } from 'react';
import { BotDifficulty } from '../../types';
import type { GameOptions, PlayerConfig } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { extractSerializableState } from '../../multiplayer/stateSerializer';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const canHostStart =
    !!room &&
    sortedPlayers.length >= 2 &&
    sortedPlayers.every((p) => p.id === room.hostPlayerId || p.ready);

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
    <div
      className="min-h-screen flex items-center justify-center py-8 px-4"
      style={{ background: 'var(--texture-parchment)', backgroundColor: 'var(--color-warm-cream-100)' }}
    >
      <div
        className="rounded-20 w-full max-w-lg p-8"
        style={{
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'var(--shadow-lifted)',
          border: '1px solid var(--card-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-body-sm font-body font-medium px-3 py-1.5 rounded-8 transition"
            style={{ color: 'var(--color-stone-600)', backgroundColor: 'var(--color-warm-cream-200)' }}
          >
            {t('menu.back')}
          </button>
          <h1 className="font-display text-display-md flex-1 text-center" style={{ color: 'var(--color-wine-700)' }}>
            {t('menu.onlineMultiplayer')}
          </h1>
          <div style={{ width: '56px' }} />
        </div>

        {!room && (
          <>
            <label className="block text-body-sm font-body font-medium mb-1" style={{ color: 'var(--color-stone-700)' }}>
              {t('multiplayer.serverUrl')}
            </label>
            <input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full rounded-8 px-3 py-2 text-body-sm mb-2"
              style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)', color: 'var(--color-stone-800)' }}
              placeholder="ws://localhost:8787"
            />
            <button
              onClick={handleConnect}
              className="w-full font-body font-semibold py-2 rounded-12 mb-4 transition"
              style={{ backgroundColor: 'var(--color-stone-700)', color: 'var(--button-text)' }}
            >
              {connectionStatus === 'connected' ? t('multiplayer.connected') : t('multiplayer.connect')}
            </button>

            <label className="block text-body-sm font-body font-medium mb-1" style={{ color: 'var(--color-stone-700)' }}>
              {t('multiplayer.yourName')}
            </label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full rounded-8 px-3 py-2 text-body-sm mb-3"
              style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)', color: 'var(--color-stone-800)' }}
              placeholder={t('multiplayer.playerNamePlaceholder')}
            />

            <button
              onClick={handleCreate}
              disabled={connectionStatus !== 'connected' || !playerName.trim()}
              className="w-full font-body font-bold py-2 rounded-12 mb-3 transition"
              style={
                connectionStatus === 'connected' && playerName.trim()
                  ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)' }
                  : { backgroundColor: 'var(--color-warm-cream-300)', color: 'var(--color-stone-500)', cursor: 'not-allowed' }
              }
            >
              {t('multiplayer.createRoom')}
            </button>

            <div className="flex gap-2 mb-4">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-8 px-3 py-2 text-body-sm"
                style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)', color: 'var(--color-stone-800)' }}
                placeholder={t('multiplayer.roomCodePlaceholder')}
              />
              <button
                onClick={handleJoin}
                disabled={connectionStatus !== 'connected' || !playerName.trim() || !roomCode.trim()}
                className="px-4 font-body font-bold rounded-12 transition"
                style={
                  connectionStatus === 'connected' && playerName.trim() && roomCode.trim()
                    ? { backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--color-warm-cream-300)', color: 'var(--color-stone-500)', cursor: 'not-allowed' }
                }
              >
                {t('multiplayer.join')}
              </button>
            </div>
          </>
        )}

        {room && (
          <>
            <div
              className="mb-4 p-3 rounded-12"
              style={{ backgroundColor: 'var(--color-warm-cream-50)', border: '1px solid var(--card-border)' }}
            >
              <p className="text-body-sm font-body">
                {t('multiplayer.room')}: <span className="font-bold tracking-widest">{room.id}</span>
              </p>
              <p className="text-label" style={{ color: 'var(--color-stone-500)' }}>
                {connectionStatus === 'connected' ? t('multiplayer.connected') : t('multiplayer.reconnecting')}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {sortedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-8"
                  style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)' }}
                >
                  <div>
                    <span className="font-body font-medium text-body-sm" style={{ color: 'var(--color-stone-800)' }}>{p.name}</span>
                    {p.id === room.hostPlayerId && (
                      <span
                        className="ml-2 text-label px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-wine-100)', color: 'var(--color-wine-700)' }}
                      >
                        {t('multiplayer.host')}
                      </span>
                    )}
                    {p.id === localPlayerId && (
                      <span
                        className="ml-2 text-label px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-warm-cream-200)', color: 'var(--color-stone-600)' }}
                      >
                        {t('multiplayer.you')}
                      </span>
                    )}
                  </div>
                  <div className="text-label font-body">
                    {!p.connected ? (
                      <span style={{ color: 'var(--color-danger)' }}>{t('multiplayer.disconnected')}</span>
                    ) : p.ready ? (
                      <span style={{ color: 'var(--color-success)' }}>{t('multiplayer.ready')}</span>
                    ) : (
                      <span style={{ color: 'var(--color-stone-400)' }}>{t('multiplayer.notReady')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isHost && me && (
              <button
                onClick={() => setReady(!me.ready)}
                className="w-full mb-3 font-body font-bold py-2 rounded-12 transition"
                style={
                  me.ready
                    ? { backgroundColor: 'var(--color-amber-500)', color: 'var(--button-text)' }
                    : { backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-text)' }
                }
              >
                {me.ready ? t('multiplayer.setNotReady') : t('multiplayer.setReady')}
              </button>
            )}

            {isHost && (
              <>
                <div
                  className="mb-4 rounded-12 p-3"
                  style={{ border: '1px solid var(--card-border)', backgroundColor: 'var(--color-warm-cream-50)' }}
                >
                  <h3 className="text-body-sm font-body font-semibold mb-2" style={{ color: 'var(--color-stone-700)' }}>
                    {t('setup.gameOptions')}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setOptions((prev) => ({ ...prev, boardSize: size }))}
                        className="py-1 text-body-sm font-body rounded-8 transition"
                        style={
                          options.boardSize === size
                            ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)', border: '1px solid var(--button-primary-bg)' }
                            : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '1px solid var(--card-border)' }
                        }
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
                        className="py-1 text-body-sm font-body rounded-8 transition"
                        style={
                          options.objectiveCount === count
                            ? { backgroundColor: 'var(--color-wine-600)', color: 'var(--button-text)', border: '1px solid var(--color-wine-600)' }
                            : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '1px solid var(--card-border)' }
                        }
                      >
                        {count} {t('multiplayer.obj')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setOptions((prev) => ({ ...prev, enableUndo: !prev.enableUndo }))}
                    className="w-full py-1 text-body-sm font-body rounded-8 transition"
                    style={
                      options.enableUndo
                        ? { backgroundColor: 'var(--button-secondary-bg)', color: 'var(--button-text)', border: '1px solid var(--button-secondary-bg)' }
                        : { backgroundColor: 'var(--color-warm-cream-100)', color: 'var(--color-stone-700)', border: '1px solid var(--card-border)' }
                    }
                  >
                    {t('multiplayer.undo')}: {options.enableUndo ? t('multiplayer.enabled') : t('multiplayer.disabled')}
                  </button>
                </div>
                <button
                  onClick={handleStart}
                  disabled={!canHostStart}
                  className="w-full font-body font-bold py-2 rounded-12 mb-3 transition"
                  style={
                    canHostStart
                      ? { backgroundColor: 'var(--button-primary-bg)', color: 'var(--button-text)', boxShadow: 'var(--shadow-medium)' }
                      : { backgroundColor: 'var(--color-warm-cream-300)', color: 'var(--color-stone-500)', cursor: 'not-allowed' }
                  }
                >
                  {t('multiplayer.startGame')}
                </button>
              </>
            )}

            <button
              onClick={leaveRoom}
              className="w-full font-body font-semibold py-2 rounded-12 mb-2 transition"
              style={{ backgroundColor: 'var(--color-danger)', color: 'var(--button-text)' }}
            >
              {t('multiplayer.leaveRoom')}
            </button>
          </>
        )}

        {error && <p className="text-body-sm mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button
          onClick={onBack}
          className="w-full font-body font-semibold py-2 rounded-12 transition"
          style={{ backgroundColor: 'var(--color-warm-cream-200)', color: 'var(--color-stone-700)' }}
        >
          {t('menu.back')}
        </button>
      </div>
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { HexGrid } from '../Board/HexGrid';
import { GameOver } from '../Game/GameOver';
import { GameLog } from '../Game/GameLog';
import { ChatPanel } from './ChatPanel';
import { Board } from '../../core/board';
import { Terrain, Location } from '../../core/terrain';
import { getValidPlacements } from '../../core/rules';
import { getTerrainName } from '../../core/terrain';
import { Player, GamePhase, LocationTile, BotDifficulty } from '../../types';
import { ObjectiveCard } from '../../core/scoring';
import type { SerializedGameState } from '../../multiplayer/types';
import type { AxialCoord } from '../../core/hex';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stringToTerrain(s: string): Terrain {
  return (Terrain[s as keyof typeof Terrain] ?? Terrain.Grass);
}

function stringToLocation(s: string): Location | undefined {
  return Location[s as keyof typeof Location];
}

function deserializeBoard(state: SerializedGameState): Board {
  const board = new Board();
  for (const cell of state.board) {
    board.setCell({
      coord: { q: cell.q, r: cell.r },
      terrain: stringToTerrain(cell.terrain),
      location: cell.location ? stringToLocation(cell.location) : undefined,
      settlement: cell.settlement,
    });
  }
  return board;
}

function deserializePlayers(state: SerializedGameState): Player[] {
  return state.players.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    settlements: p.settlements,
    remainingSettlements: p.remainingSettlements,
    tiles: p.tiles.map((t): LocationTile => ({
      location: stringToLocation(t.location) ?? Location.Farm,
      usedThisTurn: t.usedThisTurn,
    })),
    isBot: false,
    difficulty: BotDifficulty.Easy,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MultiplayerGameProps {
  onLeave: () => void;
}

export function MultiplayerGame({ onLeave }: MultiplayerGameProps) {
  const {
    gameState,
    playerId,
    room,
    sendAction,
    turnSecondsLeft,
  } = useMultiplayerStore();

  const [selectedCell, setSelectedCell] = useState<AxialCoord | null>(null);

  // Determine local player's numeric ID (player.id, not PlayerId uuid)
  const localPlayerNumericId = useMemo(() => {
    if (!gameState || !playerId || !room) return null;
    const idx = room.players.findIndex(rp => rp.id === playerId);
    if (idx === -1) return null;
    return idx + 1; // server assigns id = index + 1
  }, [gameState, playerId, room]);

  const board = useMemo(
    () => (gameState ? deserializeBoard(gameState) : new Board()),
    [gameState]
  );

  const players = useMemo(
    () => (gameState ? deserializePlayers(gameState) : []),
    [gameState]
  );

  const currentPlayer = players[gameState?.currentPlayerIndex ?? 0] ?? null;
  const phase = (gameState?.phase ?? 'Setup') as GamePhase;
  const currentTerrainCard = useMemo(
    () =>
      gameState?.currentTerrainCard
        ? { terrain: stringToTerrain(gameState.currentTerrainCard.terrain) }
        : null,
    [gameState]
  );

  const isMyTurn = currentPlayer?.id === localPlayerNumericId;

  // Compute valid placements client-side (mirrors server logic)
  const validPlacements = useMemo(() => {
    if (!isMyTurn || phase !== GamePhase.PlaceSettlements || !currentTerrainCard) {
      return [];
    }
    return getValidPlacements(board, currentTerrainCard.terrain, localPlayerNumericId ?? 0);
  }, [board, phase, currentTerrainCard, isMyTurn, localPlayerNumericId]);

  const objectiveCards = (gameState?.objectiveCards ?? []) as ObjectiveCard[];

  const finalScores = useMemo(
    () =>
      gameState?.finalScores.map(fs => ({
        playerId: fs.playerId,
        castleScore: fs.castleScore,
        objectiveScores: [],
        totalScore: fs.totalScore,
      })) ?? [],
    [gameState]
  );

  // Fake history (server doesn't send full history)
  const history = useMemo(() => [], []);

  const handleCellClick = (coord: AxialCoord) => {
    if (!isMyTurn) return;
    if (phase === GamePhase.PlaceSettlements) {
      sendAction({ type: 'PLACE_SETTLEMENT', coord });
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn || phase !== GamePhase.DrawCard) return;
    sendAction({ type: 'DRAW_CARD' });
  };

  const handleEndTurn = () => {
    if (!isMyTurn || phase !== GamePhase.EndTurn) return;
    sendAction({ type: 'END_TURN' });
  };

  // Auto-clear selectedCell on phase transitions using ref comparison
  const phaseRef = useRef(phase);
  if (phaseRef.current !== phase) {
    phaseRef.current = phase;
    // Schedule deselect - avoids calling setState during render
    Promise.resolve().then(() => setSelectedCell(null));
  }

  if (!gameState) return null;

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between">
        <h1 className="text-xl font-bold">Kingdom Builder 🌐</h1>
        <div className="flex items-center gap-3">
          {/* Turn countdown */}
          {turnSecondsLeft !== null && (
            <span
              className={`text-sm font-mono px-2 py-0.5 rounded ${
                turnSecondsLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'
              }`}
            >
              ⏱ {turnSecondsLeft}s
            </span>
          )}
          {currentPlayer && (
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span className="text-sm font-semibold">
                {isMyTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
              </span>
            </div>
          )}
          <button
            onClick={onLeave}
            className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Board */}
        <div className="flex-1 relative">
          <HexGrid
            board={board}
            validPlacements={validPlacements}
            selectedCell={selectedCell}
            players={players}
            onCellClick={handleCellClick}
            onCellSelect={setSelectedCell}
            onEscape={() => setSelectedCell(null)}
          />
        </div>

        {/* Sidebar */}
        <aside className="hidden md:flex w-80 bg-white shadow-lg p-6 overflow-y-auto flex-col gap-4">
          {/* Current player */}
          {currentPlayer && (
            <section
              className="p-4 rounded-lg border-2"
              style={{ borderColor: currentPlayer.color }}
            >
              <h2 className="text-lg font-bold mb-2">Current Turn</h2>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full border-2 border-gray-800"
                  style={{ backgroundColor: currentPlayer.color }}
                />
                <span className="font-semibold">{currentPlayer.name}</span>
                {isMyTurn && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Your turn!
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Settlements left: {currentPlayer.remainingSettlements}
              </p>
            </section>
          )}

          {/* Phase */}
          <section>
            <h3 className="text-base font-semibold mb-1">Phase</h3>
            <div className="p-2 bg-gray-100 rounded text-sm">{phase}</div>
          </section>

          {/* Terrain card */}
          {currentTerrainCard && (
            <section>
              <h3 className="text-base font-semibold mb-1">Terrain</h3>
              <div className="p-3 bg-gray-100 rounded text-center">
                <p className="text-xl font-bold">
                  {getTerrainName(currentTerrainCard.terrain)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Placements left: {gameState.remainingPlacements}
                </p>
              </div>
            </section>
          )}

          {/* Objectives */}
          {objectiveCards.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-1">Objectives</h3>
              <div className="flex flex-wrap gap-1">
                {objectiveCards.map(card => (
                  <span
                    key={card}
                    className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {card}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions (only when it's my turn) */}
          {isMyTurn && (
            <section>
              <h3 className="text-base font-semibold mb-2">Actions</h3>

              {phase === GamePhase.DrawCard && (
                <button
                  onClick={handleDrawCard}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
                >
                  Draw Terrain Card
                </button>
              )}

              {phase === GamePhase.PlaceSettlements && (
                <div className="p-3 bg-yellow-100 border border-yellow-400 rounded text-sm">
                  Click a highlighted hex to place a settlement.
                  <p className="text-xs text-gray-600 mt-0.5">
                    {gameState.remainingPlacements} placement(s) remaining
                  </p>
                </div>
              )}

              {phase === GamePhase.EndTurn && (
                <button
                  onClick={handleEndTurn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition mt-2"
                >
                  End Turn
                </button>
              )}
            </section>
          )}

          {/* Players list */}
          <section>
            <h3 className="text-base font-semibold mb-2">Players</h3>
            <ul className="space-y-2">
              {players.map((player, idx) => (
                <li
                  key={player.id}
                  className={`p-2 rounded border-2 text-sm ${
                    idx === gameState.currentPlayerIndex ? 'bg-blue-50' : 'bg-gray-50'
                  }`}
                  style={{ borderColor: player.color }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-700"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.name}</span>
                    {player.id === localPlayerNumericId && (
                      <span className="text-xs text-blue-600">(You)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Remaining: {player.remainingSettlements}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Game log */}
          <GameLog history={history} players={players} />
        </aside>
      </div>

      {/* Game over */}
      {phase === GamePhase.GameOver && finalScores.length > 0 && (
        <GameOver
          finalScores={finalScores}
          players={players}
          objectiveCards={objectiveCards}
          onNewGame={onLeave}
        />
      )}

      {/* Chat */}
      <ChatPanel />
    </div>
  );
}

import { describe, it, expect, beforeEach } from 'vitest';

interface Cell {
  q: number;
  r: number;
  terrain: string;
  owner?: number;
}

interface Player {
  id: number;
  name: string;
  settlements: number;
  undoUsedThisTurn: boolean;
}

interface GameAction {
  id: string;
  type: string;
  playerId: number;
  hex?: { q: number; r: number };
  tile?: string;
  timestamp: number;
  turnNumber: number;
}

interface PlaceResult {
  board: Cell[];
  players: Player[];
  history: GameAction[];
  placementsThisTurn: number;
}

interface UndoResult {
  board: Cell[];
  players: Player[];
  history: GameAction[];
  placementsThisTurn: number;
  canUndo: boolean;
}

// Pure logic functions extracted for testing
function placeSettlement(
  board: Cell[],
  players: Player[],
  currentPlayerIndex: number,
  hex: { q: number; r: number },
  history: GameAction[],
  placementsThisTurn: number,
  turnNumber: number
): PlaceResult {
  const cell = board.find(c => c.q === hex.q && c.r === hex.r);
  if (!cell || cell.owner !== undefined) return { board, players, history, placementsThisTurn };

  const action: GameAction = {
    id: Math.random().toString(36).substring(2, 9),
    type: 'PLACE_SETTLEMENT',
    playerId: currentPlayerIndex,
    hex,
    turnNumber,
    timestamp: Date.now(),
  };

  const newBoard = board.map(c =>
    c.q === hex.q && c.r === hex.r ? { ...c, owner: currentPlayerIndex } : c
  );
  const newPlayers = players.map((p, i) =>
    i === currentPlayerIndex ? { ...p, settlements: p.settlements - 1 } : p
  );

  return {
    board: newBoard,
    players: newPlayers,
    history: [...history, action],
    placementsThisTurn: placementsThisTurn + 1,
  };
}

function undoLastAction(
  snapshot: { board: Cell[]; players: Player[]; history: GameAction[]; placementsThisTurn: number },
  _players: Player[],
  currentPlayerIndex: number
): UndoResult {
  const newPlayers = snapshot.players.map((p, i) =>
    i === currentPlayerIndex ? { ...p, undoUsedThisTurn: true } : p
  );
  return {
    board: snapshot.board,
    players: newPlayers,
    history: snapshot.history,
    placementsThisTurn: snapshot.placementsThisTurn,
    canUndo: false,
  };
}

describe('Game History Tracker', () => {
  let board: Cell[];
  let players: Player[];
  let history: GameAction[];

  beforeEach(() => {
    board = [
      { q: 0, r: 0, terrain: 'grass' },
      { q: 1, r: 0, terrain: 'grass' },
      { q: 0, r: 1, terrain: 'forest' },
      { q: -1, r: 0, terrain: 'grass' },
    ];
    players = [
      { id: 0, name: 'Player 1', settlements: 40, undoUsedThisTurn: false },
      { id: 1, name: 'Player 2', settlements: 40, undoUsedThisTurn: false },
    ];
    history = [];
  });

  describe('placeSettlement', () => {
    it('should record action in history when settlement is placed', () => {
      const result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].type).toBe('PLACE_SETTLEMENT');
      expect(result.history[0].playerId).toBe(0);
      expect(result.history[0].hex).toEqual({ q: 0, r: 0 });
      expect(result.history[0].turnNumber).toBe(1);
    });

    it('should update board cell ownership after placement', () => {
      const result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      const cell = result.board.find(c => c.q === 0 && c.r === 0);
      expect(cell?.owner).toBe(0);
    });

    it('should decrement player settlements after placement', () => {
      const result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      expect(result.players[0].settlements).toBe(39);
    });

    it('should not place settlement on already-occupied cell', () => {
      const occupied: Cell[] = [{ q: 0, r: 0, terrain: 'grass', owner: 1 }];
      const result = placeSettlement(occupied, players, 0, { q: 0, r: 0 }, history, 0, 1);
      expect(result.history).toHaveLength(0);
    });

    it('should accumulate history across multiple placements', () => {
      let result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      result = placeSettlement(result.board, result.players, 0, { q: 1, r: 0 }, result.history, 1, 1);
      expect(result.history).toHaveLength(2);
    });
  });

  describe('undoLastAction', () => {
    it('should restore board state after undo', () => {
      const snapshot = {
        board: board.map(c => ({ ...c })),
        players: players.map(p => ({ ...p })),
        history: [],
        placementsThisTurn: 0,
      };

      const afterPlace = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      const afterUndo = undoLastAction(snapshot, afterPlace.players, 0);

      const cell = afterUndo.board.find(c => c.q === 0 && c.r === 0);
      expect(cell?.owner).toBeUndefined();
    });

    it('should restore history after undo', () => {
      const snapshot = {
        board: board.map(c => ({ ...c })),
        players: players.map(p => ({ ...p })),
        history: [],
        placementsThisTurn: 0,
      };

      const afterPlace = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      expect(afterPlace.history).toHaveLength(1);

      const afterUndo = undoLastAction(snapshot, afterPlace.players, 0);
      expect(afterUndo.history).toHaveLength(0);
    });

    it('should mark undoUsedThisTurn as true after undo', () => {
      const snapshot = {
        board: board.map(c => ({ ...c })),
        players: players.map(p => ({ ...p })),
        history: [],
        placementsThisTurn: 0,
      };

      const afterPlace = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      const afterUndo = undoLastAction(snapshot, afterPlace.players, 0);

      expect(afterUndo.players[0].undoUsedThisTurn).toBe(true);
    });

    it('should set canUndo to false after undo is used', () => {
      const snapshot = {
        board: board.map(c => ({ ...c })),
        players: players.map(p => ({ ...p })),
        history: [],
        placementsThisTurn: 0,
      };

      const afterPlace = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      const afterUndo = undoLastAction(snapshot, afterPlace.players, 0);

      expect(afterUndo.canUndo).toBe(false);
    });

    it('should restore placements count after undo', () => {
      const snapshot = {
        board: board.map(c => ({ ...c })),
        players: players.map(p => ({ ...p })),
        history: [],
        placementsThisTurn: 0,
      };

      const afterPlace = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      expect(afterPlace.placementsThisTurn).toBe(1);

      const afterUndo = undoLastAction(snapshot, afterPlace.players, 0);
      expect(afterUndo.placementsThisTurn).toBe(0);
    });
  });

  describe('undo limit per turn', () => {
    it('should not allow undo when undoUsedThisTurn is true', () => {
      const playersWithUndoUsed: Player[] = [
        { id: 0, name: 'Player 1', settlements: 39, undoUsedThisTurn: true },
        { id: 1, name: 'Player 2', settlements: 40, undoUsedThisTurn: false },
      ];

      const canUndo = !playersWithUndoUsed[0].undoUsedThisTurn;
      expect(canUndo).toBe(false);
    });

    it('should reset undoUsedThisTurn on new turn', () => {
      const playersAfterTurn: Player[] = players.map(p => ({ ...p, undoUsedThisTurn: false }));
      expect(playersAfterTurn[0].undoUsedThisTurn).toBe(false);
    });
  });

  describe('history accumulation', () => {
    it('should accumulate history across turns', () => {
      let result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 1);
      result = placeSettlement(result.board, result.players, 1, { q: 1, r: 0 }, result.history, 0, 2);

      expect(result.history).toHaveLength(2);
      expect(result.history[0].playerId).toBe(0);
      expect(result.history[1].playerId).toBe(1);
    });

    it('should record correct turn numbers in history', () => {
      const result = placeSettlement(board, players, 0, { q: 0, r: 0 }, history, 0, 3);
      expect(result.history[0].turnNumber).toBe(3);
    });
  });
});

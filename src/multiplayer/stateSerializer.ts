import type { SerializableGameState } from '../store/persistence';
import { deserializeBoard, serializeBoard } from '../core/board';
import { useGameStore } from '../store/gameStore';

export function extractSerializableState(): SerializableGameState {
  const state = useGameStore.getState();
  const plain = Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== 'function')
  ) as SerializableGameState;

  // `board.cells` is a Map; JSON.stringify converts it to `{}` (empty object).
  // Serialise it to an [key, HexCell][] array so the wire payload is valid JSON
  // and can be reconstructed on the receiving end via deserializeBoard().
  return {
    ...plain,
    board: serializeBoard(plain.board) as unknown as import('../core/board').Board,
  };
}

/**
 * Hydrate a SerializableGameState received over the wire (plain JSON) into
 * the live gameStore. The critical step is restoring `board` from its
 * serialised form (cells as an array of [key, HexCell] tuples) back to a
 * proper Board class instance with a Map and all prototype methods.
 *
 * This mirrors the deserialization logic in persistence.ts loadGame() so
 * that the multiplayer path behaves identically to the single-player
 * "Continue" restore path.
 */
export function hydrateSerializableState(next: SerializableGameState): void {
  // `next.board` arrives as a plain object with `cells` as an array of
  // [string, HexCell] tuples (JSON-serialised Map). Cast it to the shape
  // that deserializeBoard expects.
  const boardData = next.board as unknown as ReturnType<typeof serializeBoard>;
  const board = deserializeBoard(boardData);

  useGameStore.setState({ ...next, board });
}

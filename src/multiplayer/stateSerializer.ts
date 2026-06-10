import type { SerializableGameState, WireGameState } from '../store/persistence';
import { deserializeBoard, serializeBoard } from '../core/board';
import { useGameStore } from '../store/gameStore';

/**
 * Extract the current game state from the store and serialise the board so
 * the result is safe to send over JSON (board.cells Map → [key, HexCell][]).
 *
 * Returns a WireGameState whose `board` field is the plain serialised form,
 * not a Board instance — matching what the receiver will JSON.parse back.
 */
export function extractSerializableState(): WireGameState {
  const state = useGameStore.getState();
  const plain = Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== 'function')
  ) as SerializableGameState;

  // `board.cells` is a Map; JSON.stringify converts it to `{}` (empty object).
  // Serialise it to an [key, HexCell][] array so the wire payload is valid JSON
  // and can be reconstructed on the receiving end via deserializeBoard().
  return {
    ...plain,
    board: serializeBoard(plain.board),
  };
}

/**
 * Hydrate a WireGameState received over the wire (plain JSON) into
 * the live gameStore. The critical step is restoring `board` from its
 * serialised form (cells as an array of [key, HexCell] tuples) back to a
 * proper Board class instance with a Map and all prototype methods.
 *
 * This mirrors the deserialization logic in persistence.ts loadGame() so
 * that the multiplayer path behaves identically to the single-player
 * "Continue" restore path.
 */
export function hydrateSerializableState(next: WireGameState): void {
  // `next.board` arrives as a plain object with `cells` as an array of
  // [string, HexCell] tuples (JSON-serialised Map). Pass it directly to
  // deserializeBoard which expects exactly that shape.
  const board = deserializeBoard(next.board);

  useGameStore.setState({ ...next, board });
}

import type { SerializableGameState } from '../store/persistence';
import { useGameStore } from '../store/gameStore';

export function extractSerializableState(): SerializableGameState {
  const state = useGameStore.getState();
  return Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== 'function')
  ) as SerializableGameState;
}

export function hydrateSerializableState(next: SerializableGameState): void {
  useGameStore.setState(next);
}

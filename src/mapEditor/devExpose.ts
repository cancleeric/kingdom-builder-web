import { encode, decode } from './codec';
import { useCustomMapStore } from './customMapStore';

if (import.meta.env.DEV) {
  (window as any).__KB__ = { encode, decode, store: () => useCustomMapStore.getState() };
}

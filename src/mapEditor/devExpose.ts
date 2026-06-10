import { encode, decode } from './codec';
import { useCustomMapStore } from './customMapStore';

if (import.meta.env.DEV) {
  (window as typeof window & { __KB__: unknown }).__KB__ = {
    encode,
    decode,
    store: () => useCustomMapStore.getState(),
  };
}

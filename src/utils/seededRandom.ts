/**
 * Seeded pseudo-random number generator (mulberry32).
 * When a seed is set (e.g. via ?seed=NUMBER URL parameter) all calls to
 * getRandom() return a deterministic sequence.  Without a seed they fall
 * back to Math.random() so production behaviour is unchanged.
 */

let _rng: () => number = Math.random;

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Override the global RNG with a deterministic seeded generator. */
export function setGlobalSeed(seed: number): void {
  _rng = mulberry32(seed);
}

/** Return the next random value (seeded or Math.random). */
export function getRandom(): number {
  return _rng();
}

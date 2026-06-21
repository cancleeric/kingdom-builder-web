/**
 * @hd/kingdom-engine — barrel export for the Kingdom Builder engine adapter.
 *
 * PR-A: type definitions (KingdomG, ClientOnlyState).
 * PR-B: kingdomGame (GameDefinition<KingdomG>) + pure-function moves.
 * PR-C will add: test utilities / fixtures re-exported for tests.
 */

export type { KingdomG, ClientOnlyState } from './types';
export { kingdomGame } from './adapter';
export * as kingdomMoves from './moves';

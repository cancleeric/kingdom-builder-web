/**
 * Browser stub for node:crypto.
 *
 * @hd/game-kit's RoomManager (server-only) imports randomBytes from node:crypto.
 * Kingdom Builder never uses RoomManager in the browser, but vite's bundler
 * still resolves the import at build time.  This stub prevents the build from
 * failing while keeping the bundle free of Node.js internals.
 */
export function randomBytes(_size: number): Uint8Array {
  throw new Error('node:crypto is not available in the browser');
}

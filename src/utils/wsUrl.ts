/**
 * Resolves a WebSocket URL from a configured value.
 *
 * If `configured` starts with `/`, it is treated as a same-origin path and
 * converted to an absolute WebSocket URL using the current page's origin at
 * runtime.  This lets builds set e.g. `VITE_WS_SERVER_URL=/kingdom/ws` and
 * have the correct `ws://` or `wss://` scheme derived automatically from
 * `window.location.protocol`.
 *
 * If `configured` does not start with `/` (e.g. `ws://localhost:8787`), it is
 * returned unchanged.
 */
export function resolveWsUrl(configured: string): string {
  if (configured.startsWith('/')) {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${scheme}://${location.host}${configured}`;
  }
  return configured;
}

/**
 * Registers the Service Worker for offline support.
 * Only runs in production and in browsers that support the Service Worker API.
 *
 * Both the SW script path and the scope are derived from `import.meta.env.BASE_URL`
 * so that the app works correctly when mounted at a sub-path (e.g. `/kingdom/`).
 * This prevents SW scope collisions when multiple apps share the same origin.
 */
export function registerSW(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const base = import.meta.env.BASE_URL ?? '/';
      navigator.serviceWorker
        .register(`${base}service-worker.js`, { scope: base })
        .then((registration) => {
          console.log('[SW] Registered, scope:', registration.scope);
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });
    });
  }
}

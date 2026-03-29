/**
 * Registers the Service Worker for PWA offline support.
 * Only runs in production builds and when the browser supports Service Workers.
 */
export function registerSW(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    });
  }
}

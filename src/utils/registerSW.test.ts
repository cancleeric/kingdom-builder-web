import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerSW } from '../utils/registerSW';

describe('registerSW', () => {
  let originalServiceWorker: typeof navigator.serviceWorker;

  beforeEach(() => {
    originalServiceWorker = navigator.serviceWorker;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('registers service worker on load when serviceWorker is supported', async () => {
    const registerMock = vi.fn().mockResolvedValue({ scope: '/' });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    registerSW();

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

    // Trigger the load event handler manually
    const loadHandler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === 'load'
    )?.[1] as EventListenerOrEventListenerObject | undefined;

    expect(loadHandler).toBeDefined();
    if (typeof loadHandler === 'function') {
      await loadHandler(new Event('load'));
    }

    expect(registerMock).toHaveBeenCalledWith('/service-worker.js');
  });

  it('does not throw when serviceWorker is not supported', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    });

    expect(() => registerSW()).not.toThrow();
  });
});

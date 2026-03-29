import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerSW } from './registerSW';

describe('registerSW', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let registerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue(undefined);
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the service worker on load when serviceWorker is supported', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    });

    registerSW();

    // Simulate the load event
    const loadHandler = addEventListenerSpy.mock.calls.find(
      ([event]: [string, ...unknown[]]) => event === 'load'
    )?.[1] as EventListenerOrEventListenerObject | undefined;

    expect(loadHandler).toBeDefined();
    (loadHandler as EventListener)(new Event('load'));

    expect(registerMock).toHaveBeenCalledWith('/service-worker.js');
  });

  it('does not register when serviceWorker is not supported', () => {
    // Remove serviceWorker from navigator to simulate unsupported environment
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    // Delete so 'serviceWorker' in navigator returns false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).serviceWorker;

    registerSW();

    const loadHandlerCalled = addEventListenerSpy.mock.calls.some(
      ([event]: [string, ...unknown[]]) => event === 'load'
    );
    expect(loadHandlerCalled).toBe(false);

    // Restore original descriptor if it existed
    if (descriptor) {
      Object.defineProperty(navigator, 'serviceWorker', descriptor);
    }
  });
});

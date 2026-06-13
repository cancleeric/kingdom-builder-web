import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveWsUrl } from './wsUrl';

describe('resolveWsUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // jsdom sets location.protocol to 'http:' by default
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns absolute ws:// URL unchanged', () => {
    expect(resolveWsUrl('ws://localhost:8787')).toBe('ws://localhost:8787');
  });

  it('returns absolute wss:// URL unchanged', () => {
    expect(resolveWsUrl('wss://example.com/ws')).toBe('wss://example.com/ws');
  });

  it('resolves path-only URL to ws:// when protocol is http:', () => {
    // jsdom default: http: protocol
    const result = resolveWsUrl('/kingdom/ws');
    expect(result).toMatch(/^ws:\/\//);
    expect(result).toContain('/kingdom/ws');
  });

  it('resolves path-only URL to wss:// when protocol is https:', () => {
    // Temporarily override location.protocol
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, protocol: 'https:', host: 'example.com' },
      writable: true,
      configurable: true,
    });

    const result = resolveWsUrl('/kingdom/ws');
    expect(result).toBe('wss://example.com/kingdom/ws');

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('includes location.host in the resolved URL', () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: '192.168.50.199:8090' },
      writable: true,
      configurable: true,
    });

    const result = resolveWsUrl('/kingdom/ws');
    expect(result).toBe('ws://192.168.50.199:8090/kingdom/ws');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});

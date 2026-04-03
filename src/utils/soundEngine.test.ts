import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// AudioContext mock — defined before any dynamic imports so that the stub is
// in place when soundEngine.ts constructs the AudioContext.
// ---------------------------------------------------------------------------

const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  type: 'sine' as OscillatorType,
  frequency: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    value: 440,
  },
};

const mockGain = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};

// Use a class so that `new AudioContext()` works correctly in jsdom.
class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => ({ ...mockOscillator }));
  createGain = vi.fn(() => ({ ...mockGain }));
  resume = vi.fn(() => Promise.resolve());
}

// Stub before any imports so the module picks it up.
vi.stubGlobal('AudioContext', MockAudioContext);

// ---------------------------------------------------------------------------
// Helpers — dynamically import soundEngine so we can re-initialise between
// groups of tests that need a clean audioCtx state.
// ---------------------------------------------------------------------------

async function freshModule() {
  vi.resetModules();
  return import('./soundEngine');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('soundEngine', () => {
  const MUTE_KEY = 'kingdom-builder-muted';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- isMuted / setMuted ---------------------------------------------------

  it('isMuted returns false when localStorage has no entry', async () => {
    const { isMuted } = await freshModule();
    expect(isMuted()).toBe(false);
  });

  it('isMuted returns true when localStorage has "true"', async () => {
    localStorage.setItem(MUTE_KEY, 'true');
    const { isMuted } = await freshModule();
    expect(isMuted()).toBe(true);
  });

  it('setMuted stores "true" in localStorage', async () => {
    const { setMuted } = await freshModule();
    setMuted(true);
    expect(localStorage.getItem(MUTE_KEY)).toBe('true');
  });

  it('setMuted stores "false" in localStorage', async () => {
    const { setMuted } = await freshModule();
    setMuted(false);
    expect(localStorage.getItem(MUTE_KEY)).toBe('false');
  });

  // --- initAudio -----------------------------------------------------------

  it('initAudio does not throw', async () => {
    const { initAudio } = await freshModule();
    expect(() => initAudio()).not.toThrow();
  });

  it('initAudio creates an AudioContext', async () => {
    const spy = vi.spyOn(window, 'AudioContext' as never);
    const { initAudio } = await freshModule();
    initAudio();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('initAudio does not throw when AudioContext constructor throws', async () => {
    vi.stubGlobal('AudioContext', vi.fn(function () { throw new Error('Not supported'); }));
    const { initAudio } = await freshModule();
    expect(() => initAudio()).not.toThrow();
    // Restore for subsequent tests
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  // --- play: does not throw for every event --------------------------------

  const events = [
    'settlement-placed',
    'tile-acquired',
    'invalid-move',
    'turn-end',
    'game-over',
  ] as const;

  events.forEach(event => {
    it(`play("${event}") does not throw`, async () => {
      const { initAudio, play } = await freshModule();
      initAudio();
      expect(() => play(event)).not.toThrow();
    });
  });

  // --- play: oscillator is created for each event --------------------------

  events.forEach(event => {
    it(`play("${event}") creates at least one oscillator`, async () => {
      const ctxInstances: MockAudioContext[] = [];
      vi.stubGlobal(
        'AudioContext',
        vi.fn(function (this: MockAudioContext) {
          const instance = new MockAudioContext();
          ctxInstances.push(instance);
          return instance;
        }),
      );
      const { initAudio, play } = await freshModule();
      initAudio();
      expect(ctxInstances).toHaveLength(1);
      play(event);
      expect(ctxInstances[0].createOscillator).toHaveBeenCalled();
      // Restore
      vi.stubGlobal('AudioContext', MockAudioContext);
    });
  });

  // --- play: respects mute state -------------------------------------------

  it('play does nothing when muted', async () => {
    localStorage.setItem(MUTE_KEY, 'true');
    const ctxInstances: MockAudioContext[] = [];
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function (this: MockAudioContext) {
        const instance = new MockAudioContext();
        ctxInstances.push(instance);
        return instance;
      }),
    );
    const { initAudio, play } = await freshModule();
    initAudio();
    play('settlement-placed');
    expect(ctxInstances[0].createOscillator).not.toHaveBeenCalled();
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  // --- play: no-op when AudioContext is not initialised --------------------

  it('play does not throw when AudioContext is not initialised', async () => {
    const { play } = await freshModule();
    // initAudio has NOT been called — audioCtx is null
    expect(() => play('settlement-placed')).not.toThrow();
  });

  // --- graceful degradation ------------------------------------------------

  it('setMuted does not throw when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const { setMuted } = await freshModule();
    expect(() => setMuted(true)).not.toThrow();
  });

  it('isMuted does not throw when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable');
    });
    const { isMuted } = await freshModule();
    expect(isMuted()).toBe(false);
  });
});

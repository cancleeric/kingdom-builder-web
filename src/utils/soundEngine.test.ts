import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal Web Audio API mock factory
function makeMockAudioContext() {
  const mockConnect = vi.fn();

  const mockGain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: mockConnect,
  };

  const mockOscillator = {
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: mockConnect,
    start: vi.fn(),
    stop: vi.fn(),
  };

  const instance = {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => mockOscillator),
    createGain: vi.fn(() => mockGain),
  };

  // Use a proper function (not arrow) so `new` behaves correctly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockAudioContext = vi.fn(function (this: unknown): any { return instance; });

  return { MockAudioContext, instance };
}

describe('soundEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('isMuted / setMuted', () => {
    it('is not muted by default', async () => {
      const { isMuted } = await import('./soundEngine');
      expect(isMuted()).toBe(false);
    });

    it('setMuted(true) stores true in localStorage', async () => {
      const { isMuted, setMuted } = await import('./soundEngine');
      setMuted(true);
      expect(localStorage.getItem('kingdom-builder-muted')).toBe('true');
      expect(isMuted()).toBe(true);
    });

    it('setMuted(false) stores false in localStorage', async () => {
      const { isMuted, setMuted } = await import('./soundEngine');
      setMuted(true);
      setMuted(false);
      expect(localStorage.getItem('kingdom-builder-muted')).toBe('false');
      expect(isMuted()).toBe(false);
    });
  });

  describe('initAudio', () => {
    it('does not throw when AudioContext is available', async () => {
      const { MockAudioContext } = makeMockAudioContext();
      vi.stubGlobal('AudioContext', MockAudioContext);
      const { initAudio } = await import('./soundEngine');
      expect(() => initAudio()).not.toThrow();
    });

    it('does not throw when AudioContext is unavailable', async () => {
      vi.stubGlobal('AudioContext', undefined);
      const { initAudio } = await import('./soundEngine');
      expect(() => initAudio()).not.toThrow();
    });
  });

  describe('playSound', () => {
    it('does not throw for any SoundType', async () => {
      const { MockAudioContext } = makeMockAudioContext();
      vi.stubGlobal('AudioContext', MockAudioContext);
      const { initAudio, playSound, SoundType } = await import('./soundEngine');
      initAudio();

      for (const type of Object.values(SoundType)) {
        expect(() => playSound(type)).not.toThrow();
      }
    });

    it('does nothing when muted', async () => {
      const { MockAudioContext, instance } = makeMockAudioContext();
      vi.stubGlobal('AudioContext', MockAudioContext);
      const { initAudio, playSound, setMuted, SoundType } = await import('./soundEngine');
      initAudio();

      setMuted(true);
      playSound(SoundType.PLACE);

      expect(instance.createOscillator).not.toHaveBeenCalled();
    });

    it('plays a sound when not muted', async () => {
      const { MockAudioContext, instance } = makeMockAudioContext();
      vi.stubGlobal('AudioContext', MockAudioContext);
      const { initAudio, playSound, setMuted, SoundType } = await import('./soundEngine');
      initAudio();

      setMuted(false);
      playSound(SoundType.PLACE);

      expect(instance.createOscillator).toHaveBeenCalled();
    });
  });
});

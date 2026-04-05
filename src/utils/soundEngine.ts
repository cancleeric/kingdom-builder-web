export enum SoundType {
  PLACE = 'PLACE',
  TILE_GAIN = 'TILE_GAIN',
  INVALID = 'INVALID',
  TURN_END = 'TURN_END',
  GAME_OVER = 'GAME_OVER',
}

const MUTE_STORAGE_KEY = 'kingdom-builder-muted';

let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
  } catch {
    // Browser does not support Web Audio API
  }
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
}

function getContext(): AudioContext | null {
  if (!audioCtx) return null;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {/* ignore */});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  startTime: number,
  gainValue = 0.3,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playSound(type: SoundType): void {
  if (isMuted()) return;

  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    switch (type) {
      case SoundType.PLACE: {
        // Short high "pop": 440 Hz, 50 ms, sine
        playTone(ctx, 440, 0.05, 'sine', now);
        break;
      }

      case SoundType.TILE_GAIN: {
        // Rising "ding": 523 → 659 → 784 Hz, three notes, 80 ms each
        const tileFreqs = [523, 659, 784];
        tileFreqs.forEach((freq, i) => {
          playTone(ctx, freq, 0.08, 'sine', now + i * 0.1);
        });
        break;
      }

      case SoundType.INVALID: {
        // Low "buzz": 220 Hz, 100 ms, square
        playTone(ctx, 220, 0.1, 'square', now, 0.2);
        break;
      }

      case SoundType.TURN_END: {
        // Descending "whoosh": 440 → 220 Hz, 200 ms
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case SoundType.GAME_OVER: {
        // 5-note ending melody, 300 ms total
        const gameOverFreqs = [523, 494, 440, 392, 349];
        const noteDuration = 0.06;
        gameOverFreqs.forEach((freq, i) => {
          playTone(ctx, freq, noteDuration, 'sine', now + i * noteDuration);
        });
        break;
      }
    }
  } catch {
    // Silently ignore playback errors
  }
}

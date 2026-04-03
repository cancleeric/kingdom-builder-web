/**
 * Sound engine using Web Audio API.
 * All sounds are synthesized with OscillatorNode + GainNode — no audio files needed.
 */

export type SoundEvent =
  | 'settlement-placed'
  | 'tile-acquired'
  | 'invalid-move'
  | 'turn-end'
  | 'game-over';

const MUTE_KEY = 'kingdom-builder-muted';

let audioCtx: AudioContext | null = null;

/** Initialize AudioContext — must be called from a user-gesture handler. */
export function initAudio(): void {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => undefined);
    }
    return;
  }
  try {
    audioCtx = new AudioContext();
  } catch {
    // Browser does not support Web Audio API
  }
}

/** Returns true if sound is currently muted. */
export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Set mute state and persist to localStorage. */
export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // localStorage may be unavailable (e.g. private browsing)
  }
}

/** Play a synthesized sound for the given game event. */
export function play(event: SoundEvent): void {
  if (isMuted()) return;
  if (!audioCtx) return;

  const ctx = audioCtx;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => undefined);
  }

  try {
    switch (event) {
      case 'settlement-placed':
        playSettlementPlaced(ctx);
        break;
      case 'tile-acquired':
        playTileAcquired(ctx);
        break;
      case 'invalid-move':
        playInvalidMove(ctx);
        break;
      case 'turn-end':
        playTurnEnd(ctx);
        break;
      case 'game-over':
        playGameOver(ctx);
        break;
    }
  } catch {
    // Silently ignore audio errors (e.g. suspended context)
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.3,
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Settlement placed — short high "pop" (440 Hz, 50 ms, sine). */
function playSettlementPlaced(ctx: AudioContext): void {
  scheduleTone(ctx, 440, ctx.currentTime, 0.05, 'sine', 0.35);
}

/** Location tile acquired — rising three-note "ding" (523→659→784 Hz, 80 ms each). */
function playTileAcquired(ctx: AudioContext): void {
  const t = ctx.currentTime;
  scheduleTone(ctx, 523, t, 0.08, 'sine', 0.3);
  scheduleTone(ctx, 659, t + 0.08, 0.08, 'sine', 0.3);
  scheduleTone(ctx, 784, t + 0.16, 0.08, 'sine', 0.3);
}

/** Invalid placement — low "buzz" (220 Hz, 100 ms, square). */
function playInvalidMove(ctx: AudioContext): void {
  scheduleTone(ctx, 220, ctx.currentTime, 0.1, 'square', 0.2);
}

/** Turn end — descending "whoosh" (440→220 Hz sweep, 200 ms). */
function playTurnEnd(ctx: AudioContext): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  const t = ctx.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);
  gainNode.gain.setValueAtTime(0.3, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  osc.start(t);
  osc.stop(t + 0.2);
}

/** Game over — five-note descending melody (300 ms per note). */
function playGameOver(ctx: AudioContext): void {
  const melody = [392, 349, 330, 294, 262];
  const t = ctx.currentTime;
  melody.forEach((freq, i) => {
    scheduleTone(ctx, freq, t + i * 0.3, 0.28, 'sine', 0.4);
  });
}

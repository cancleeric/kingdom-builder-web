import { useState } from 'react';
import { isMuted, setMuted, initAudio } from '../utils/soundEngine';

/**
 * A toggle button that mutes/unmutes game sound effects.
 * The mute state is persisted to localStorage so it survives page reloads.
 */
export function MuteButton() {
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  const handleToggle = () => {
    // Initialise AudioContext on first user interaction (browser autoplay policy).
    initAudio();
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="text-2xl p-2 rounded hover:bg-blue-700 transition"
      title={muted ? 'Unmute sound' : 'Mute sound'}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

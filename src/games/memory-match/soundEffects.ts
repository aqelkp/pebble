let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  peakGain = 0.08,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + startOffsetSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio playback issues when autoplay is blocked
  }
}

export function playFlipSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(440, 0, 0.07, 'sine', 0.05);
}

export function playMatchSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0, 0.14, 'triangle', 0.09);
  playTone(659.25, 0.08, 0.18, 'triangle', 0.09);
  playTone(783.99, 0.16, 0.24, 'triangle', 0.09);
}

export function playMismatchSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(330, 0, 0.12, 'sine', 0.05);
  playTone(277.18, 0.1, 0.14, 'sine', 0.05);
}

export function playWinSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0, 0.16, 'triangle', 0.1);
  playTone(659.25, 0.11, 0.16, 'triangle', 0.1);
  playTone(783.99, 0.22, 0.18, 'triangle', 0.1);
  playTone(1046.5, 0.34, 0.38, 'triangle', 0.11);
}

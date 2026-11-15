let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx) {
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  startSec: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.08,
  endFreq?: number,
): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + startSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (typeof endFreq === 'number') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t0 + durationSec);
    }

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.018, durationSec * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + durationSec + 0.03);
  } catch {
    // Ignore autoplay-blocked audio errors
  }
}

export function playStrokeStartTick(enabled: boolean): void {
  if (!enabled) return;
  playTone(460, 0, 0.055, 'sine', 0.045, 520);
}

const STROKE_CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5] as const;

export function playStrokeCompleteNote(strokeIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const note = STROKE_CHIME_NOTES[Math.max(0, strokeIndex) % STROKE_CHIME_NOTES.length];
  playTone(note, 0, 0.16, 'triangle', 0.09);
  playTone(note * 1.5, 0.05, 0.14, 'sine', 0.045);
}

/**
 * Quiet, neutral wooden tap for out-of-order / wrong-direction touches.
 * Strictly lower-energy than positive chimes (Playfulness Asymmetry rule).
 */
export function playLockedStrokeTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(175, 0, 0.09, 'sine', 0.038, 130);
}

export function playPairCompleteFanfare(crowned: boolean, enabled: boolean): void {
  if (!enabled) return;
  const chord = crowned
    ? [523.25, 659.25, 783.99, 1046.5]
    : [523.25, 659.25, 783.99];
  chord.forEach((freq, idx) => {
    playTone(freq, idx * 0.065, 0.24, 'triangle', 0.085);
  });
}

export function playRoundCompleteFanfare(enabled: boolean): void {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.08, 0.28, 'triangle', 0.09);
  });
}

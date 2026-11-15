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

// Warm 10-step ascending marimba scale across C major + 9th/10th top notes
const MARIMBA_SCALE = [
  392.0,  // G4
  440.0,  // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  987.77, // B5
  1046.5, // C6
] as const;

export function playDotConnectChime(dotIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = MARIMBA_SCALE[Math.max(0, dotIndex) % MARIMBA_SCALE.length];
  playTone(freq, 0, 0.16, 'triangle', 0.09);
  playTone(freq * 1.5, 0.04, 0.12, 'sine', 0.045);
}

/**
 * Soft muted tap for out-of-order taps — strictly quieter and lower-energy
 * than positive marimba chimes (Playfulness Asymmetry).
 */
export function playWrongDotTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(170, 0, 0.09, 'sine', 0.036, 130);
}

export function playColorBloomFanfare(flawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  const notes = flawless
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
    : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.065, 0.26, 'triangle', 0.09);
  });
}

export function playRoundCompleteFanfare(enabled: boolean): void {
  if (!enabled) return;
  const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
  chord.forEach((freq, idx) => {
    playTone(freq, idx * 0.075, 0.28, 'triangle', 0.09);
  });
}

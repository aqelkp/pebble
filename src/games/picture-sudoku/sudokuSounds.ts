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
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), t0 + durationSec);
    }

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + durationSec + 0.02);
  } catch {
    // Ignore audio context errors in restricted environments
  }
}

export function playPickupSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(440, 0, 0.07, 'sine', 0.05, 520);
}

export function playPlaceSuccessSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0, 0.12, 'triangle', 0.08);
  playTone(659.25, 0.055, 0.15, 'triangle', 0.08);
}

export function playReturnSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(480, 0, 0.09, 'sine', 0.05, 340);
}

export function playConflictSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(260, 0, 0.14, 'sine', 0.06, 210);
}

export function playSolvedFanfare(enabled: boolean): void {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.09, 0.24, 'triangle', 0.09);
  });
}

let safariAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!safariAudioCtx) {
      safariAudioCtx = new AudioCtx();
    }
    if (safariAudioCtx.state === 'suspended') {
      void safariAudioCtx.resume();
    }
    return safariAudioCtx;
  } catch {
    return null;
  }
}

function playMarimbaNote(
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.085,
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
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio playback errors when autoplay is restricted
  }
}

// Warm C-major ascending scale from C5 (523.25 Hz) up to E6 (1318.51 Hz) for steps 1..10
const COUNT_SCALE_HZ: readonly number[] = [
  523.25, // 1 - C5
  587.33, // 2 - D5
  659.25, // 3 - E5
  698.46, // 4 - F5
  783.99, // 5 - G5
  880.0,  // 6 - A5
  987.77, // 7 - B5
  1046.5, // 8 - C6
  1174.66, // 9 - D6
  1318.51, // 10 - E6
];

export function playAnimalCountSound(enabled: boolean, countNumber: number): void {
  if (!enabled) return;
  const idx = Math.max(0, Math.min(COUNT_SCALE_HZ.length - 1, countNumber - 1));
  playMarimbaNote(COUNT_SCALE_HZ[idx], 0, 0.13, 'triangle', 0.08);
}

export function playAnimalNudgeSound(enabled: boolean): void {
  if (!enabled) return;
  playMarimbaNote(493.88, 0, 0.07, 'sine', 0.045);
}

export function playSafariCorrectSound(enabled: boolean): void {
  if (!enabled) return;
  playMarimbaNote(523.25, 0, 0.14, 'triangle', 0.09);
  playMarimbaNote(659.25, 0.08, 0.18, 'triangle', 0.09);
  playMarimbaNote(783.99, 0.16, 0.24, 'triangle', 0.095);
}

export function playSafariTryAgainSound(enabled: boolean): void {
  if (!enabled) return;
  playMarimbaNote(349.23, 0, 0.11, 'sine', 0.05);
  playMarimbaNote(293.66, 0.09, 0.14, 'sine', 0.05);
}

export function playSafariWinSound(enabled: boolean): void {
  if (!enabled) return;
  playMarimbaNote(523.25, 0, 0.16, 'triangle', 0.1);
  playMarimbaNote(659.25, 0.11, 0.16, 'triangle', 0.1);
  playMarimbaNote(783.99, 0.22, 0.18, 'triangle', 0.1);
  playMarimbaNote(1046.5, 0.34, 0.38, 'triangle', 0.11);
}

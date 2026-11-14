let sharedCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;

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

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.8);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
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
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.02, durationSec * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + durationSec + 0.03);
  } catch {
    // Ignore autoplay-blocked audio errors
  }
}

function playWaterSplashNoise(
  startSec: number,
  durationSec: number,
  startFreq: number,
  endFreq: number,
  peakGain: number,
): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + startSec;
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(startFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, endFreq), t0 + durationSec);
    filter.Q.setValueAtTime(1.8, t0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.025, durationSec * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(t0);
    src.stop(t0 + durationSec + 0.03);
  } catch {
    // Ignore audio errors
  }
}

export function speakRiverPhrase(phrase: string, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    utter.pitch = 1.08;
    utter.volume = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {
    // Speech synthesis unavailable or restricted
  }
}

export function stopRiverSpeech(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech errors
  }
}

/**
 * Playful water droplet plop when scooping or hooking a swimming fish.
 */
export function playFishPlopSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(330, 0, 0.095, 'sine', 0.085, 700);
  playWaterSplashNoise(0.01, 0.075, 900, 2100, 0.038);
}

/**
 * Really, really playful splash + ascending marimba chime on a correct bucket catch.
 * Pitch climbs with fill step (1/3 -> 2/3 -> 3/3) and adds golden shimmer when `isGolden` is true.
 */
export function playCorrectCatchSound(
  fillStep: 1 | 2 | 3,
  isGolden: boolean,
  enabled: boolean,
): void {
  if (!enabled) return;

  // Crisp bubbly splash
  playWaterSplashNoise(0, 0.19, 1050, 2800, 0.075);
  playTone(392, 0, 0.08, 'sine', 0.06, 840);

  // Ascending marimba triad based on fill step
  const roots = [523.25, 587.33, 659.25] as const; // C5, D5, E5
  const root = roots[fillStep - 1];
  playTone(root, 0.03, 0.16, 'triangle', 0.11);
  playTone(root * 1.25, 0.1, 0.18, 'triangle', 0.11);
  playTone(root * 1.5, 0.17, 0.25, 'triangle', 0.12);

  if (isGolden) {
    // Extra golden fish shimmer octave chord
    playTone(root * 2, 0.23, 0.3, 'sine', 0.1);
    playTone(root * 2.5, 0.29, 0.34, 'sine', 0.09);
  }
}

/**
 * Jubilant 5-note river marimba fanfare + bubbly cascade when a bucket hits 3/3.
 */
export function playBucketFullSound(enabled: boolean): void {
  if (!enabled) return;
  playWaterSplashNoise(0, 0.28, 950, 3200, 0.085);
  const fanfare = [
    { freq: 523.25, t: 0.02, dur: 0.14 },
    { freq: 659.25, t: 0.1, dur: 0.14 },
    { freq: 783.99, t: 0.18, dur: 0.15 },
    { freq: 1046.5, t: 0.27, dur: 0.2 },
    { freq: 1318.51, t: 0.38, dur: 0.38 },
  ] as const;
  fanfare.forEach((n) => {
    playTone(n.freq, n.t, n.dur, 'triangle', 0.115);
  });
  // Bubbly pop cascade
  playTone(587.33, 0.45, 0.12, 'sine', 0.06, 987.77);
  playTone(783.99, 0.54, 0.14, 'sine', 0.06, 1318.51);
}

/**
 * Warm wooden slide + friendly two-note chime when a fresh letter bucket arrives on the dock.
 */
export function playNewBucketSlideSound(enabled: boolean): void {
  if (!enabled) return;
  playWaterSplashNoise(0, 0.14, 550, 380, 0.032);
  playTone(440, 0.04, 0.13, 'triangle', 0.075);
  playTone(587.33, 0.12, 0.18, 'triangle', 0.08);
}

/**
 * Strictly understated calm wooden tap when dropped in the wrong bucket.
 * Intentionally low-key (no splash, no boing, no buzz) so wrong picks feel far less exciting than catches.
 */
export function playGentleWrongBucketSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(195, 0, 0.09, 'sine', 0.032, 165);
}

/**
 * Celebratory chord progression when all selected letter buckets are completed.
 */
export function playRiverCompleteSound(enabled: boolean): void {
  if (!enabled) return;
  playWaterSplashNoise(0, 0.3, 1100, 3000, 0.07);
  playTone(523.25, 0.05, 0.22, 'triangle', 0.11);
  playTone(659.25, 0.16, 0.22, 'triangle', 0.11);
  playTone(783.99, 0.27, 0.24, 'triangle', 0.115);
  playTone(1046.5, 0.4, 0.48, 'triangle', 0.125);
  playTone(1318.51, 0.54, 0.52, 'sine', 0.09);
}

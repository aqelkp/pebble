import type { LetterId } from './letterData';

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
  const length = Math.floor(ctx.sampleRate * 1.2);
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

function playSteamBurst(
  startSec: number,
  durationSec: number,
  centerFreq: number,
  qFactor: number,
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
    filter.frequency.setValueAtTime(centerFreq, t0);
    filter.Q.setValueAtTime(qFactor, t0);

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

function playWhistleBlast(startSec: number, durationSec: number, peakGain = 0.075): void {
  // Warm wooden-train two-harmony steam whistle (F4 + A4 + D5)
  playTone(349.23, startSec, durationSec, 'triangle', peakGain, 354);
  playTone(440.0, startSec, durationSec, 'triangle', peakGain * 0.85, 446);
  playTone(587.33, startSec, durationSec, 'sine', peakGain * 0.65, 594);
  playSteamBurst(startSec, durationSec * 0.85, 1450, 2.2, peakGain * 0.35);
}

export function speakPhrase(phrase: string, enabled: boolean): void {
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

export function stopTrainSpeech(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech errors
  }
}

export function playCardPickupSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(415, 0, 0.065, 'sine', 0.06, 540);
}

export function playCorrectSeatSound(seatNumber: number, enabled: boolean): void {
  if (!enabled) return;
  if (seatNumber <= 1) {
    playTone(523.25, 0, 0.14, 'triangle', 0.1);
    playTone(659.25, 0.07, 0.2, 'triangle', 0.1);
  } else if (seatNumber === 2) {
    playTone(587.33, 0, 0.14, 'triangle', 0.1);
    playTone(783.99, 0.07, 0.22, 'triangle', 0.11);
  } else {
    playTone(659.25, 0, 0.13, 'triangle', 0.11);
    playTone(783.99, 0.07, 0.15, 'triangle', 0.11);
    playTone(1046.5, 0.14, 0.28, 'triangle', 0.12);
  }
}

/**
 * Full wooden steam train departure celebration when all 3 correct cards are aboard:
 * "TOOT-TOOOOOT!" + rhythmic accelerating "CHUG-chug-CHUG-chug" + brass station bell!
 */
export function playTrainDepartureSound(enabled: boolean): void {
  if (!enabled) return;
  // Two-blast classic train whistle
  playWhistleBlast(0.05, 0.24, 0.085);
  playWhistleBlast(0.35, 0.44, 0.095);

  // Rhythmic steam chugs accelerating out of the station
  const chugTimes = [0.12, 0.34, 0.54, 0.71, 0.86, 0.99, 1.11, 1.22];
  chugTimes.forEach((t, idx) => {
    const accent = idx % 2 === 0 ? 0.09 : 0.055;
    playSteamBurst(t, 0.11, idx % 2 === 0 ? 780 : 1050, 1.4, accent);
  });

  // Cheerful station bell chime
  playTone(1046.5, 0.85, 0.2, 'sine', 0.065);
  playTone(1318.5, 1.02, 0.28, 'sine', 0.07);
}

export function playTrainArrivalSound(letter: LetterId, enabled: boolean): void {
  if (!enabled) return;
  playSteamBurst(0.0, 0.1, 900, 1.5, 0.05);
  playSteamBurst(0.14, 0.12, 720, 1.5, 0.06);
  playTone(523.25, 0.22, 0.16, 'triangle', 0.07);
  playTone(659.25, 0.32, 0.22, 'triangle', 0.075);
  speakPhrase(`Letter ${letter}!`, enabled);
}

/**
 * Strike 1 & 2 wrong-pick sound:
 * Metallic boiler clank + pressurized steam hiss + cartoon smokestack boing launch!
 */
export function playWrongStrikeSound(strikeNumber: number, enabled: boolean): void {
  if (!enabled) return;
  // Metallic boiler clank
  playTone(178, 0, 0.11, 'square', 0.045, 132);
  playTone(263, 0.01, 0.12, 'triangle', 0.07, 196);
  // Pressurized steam hiss out of chimney
  playSteamBurst(0.04, 0.28, 2200, 1.1, 0.095);
  // Playful rubbery smokestack launch BOING!
  playTone(220, 0.14, 0.22, 'sine', 0.095, 520);
  playTone(520, 0.34, 0.18, 'sine', 0.075, 290);

  // Extra warning rattle on Strike 2 (Danger Zone!)
  if (strikeNumber >= 2) {
    playTone(155, 0.48, 0.09, 'sawtooth', 0.04, 140);
    playTone(155, 0.59, 0.11, 'sawtooth', 0.045, 130);
  }
}

/**
 * Strike 3 Boiler Blowout sound:
 * Big cartoon lid pop + steam cloud whoosh + playful descending slide!
 */
export function playBoilerBlowoutSound(enabled: boolean): void {
  if (!enabled) return;
  // Boiler pop & low thump
  playTone(140, 0, 0.32, 'triangle', 0.14, 48);
  playTone(320, 0.02, 0.1, 'square', 0.055, 620);
  // Giant steam cloud whoosh
  playSteamBurst(0.03, 0.65, 1100, 0.75, 0.13);
  // Playful descending cartoon whistle slide
  playTone(622.25, 0.18, 0.52, 'triangle', 0.09, 174.61);
  // Runaway wheels clatter
  [0.55, 0.67, 0.78, 0.88].forEach((t) => {
    playSteamBurst(t, 0.08, 950, 1.8, 0.06);
  });
}

export function playTripCompleteSound(enabled: boolean): void {
  if (!enabled) return;
  playWhistleBlast(0.0, 0.22, 0.08);
  playTone(523.25, 0.24, 0.16, 'triangle', 0.1);
  playTone(659.25, 0.36, 0.16, 'triangle', 0.1);
  playTone(783.99, 0.48, 0.18, 'triangle', 0.11);
  playTone(1046.5, 0.62, 0.42, 'triangle', 0.12);
}

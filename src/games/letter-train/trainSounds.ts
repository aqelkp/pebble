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
  const length = Math.floor(ctx.sampleRate * 1.4);
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

function playFilteredNoise(
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
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.015, durationSec * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(t0);
    src.stop(t0 + durationSec + 0.02);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Synthesizes a realistic crisp multi-palm acoustic handclap using triple micro-bursts
 * around 1.2kHz - 2.1kHz so rhythmic clapping sounds warm, lively, and unmistakable!
 */
function playSingleHandclap(startSec: number, pitchHue = 1550, gainScale = 1): void {
  playFilteredNoise(startSec, 0.026, pitchHue, 1.7, 0.09 * gainScale);
  playFilteredNoise(startSec + 0.011, 0.028, pitchHue * 1.12, 1.9, 0.1 * gainScale);
  playFilteredNoise(startSec + 0.022, 0.068, pitchHue * 0.94, 1.5, 0.115 * gainScale);
}

function playWhistleBlast(startSec: number, durationSec: number, peakGain = 0.075): void {
  playTone(349.23, startSec, durationSec, 'triangle', peakGain, 354);
  playTone(440.0, startSec, durationSec, 'triangle', peakGain * 0.85, 446);
  playTone(587.33, startSec, durationSec, 'sine', peakGain * 0.65, 594);
  playFilteredNoise(startSec, durationSec * 0.85, 1450, 2.2, peakGain * 0.32);
}

export function speakPhrase(phrase: string, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = 'en-US';
    utter.rate = 0.93;
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
  playTone(415, 0, 0.06, 'sine', 0.055, 520);
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
 * Calm, low-key, intentionally un-funny sound when a wrong card is picked,
 * so there is zero slapstick incentive to tap wrong answers on purpose.
 */
export function playCalmWrongHintSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(230, 0, 0.09, 'sine', 0.032, 210);
}

/**
 * Normal polite train departure (when completed with >= 1 mistake):
 * Simple whistle + steam chugs without the big applause party.
 */
export function playTrainDepartureSound(enabled: boolean): void {
  if (!enabled) return;
  playWhistleBlast(0.05, 0.22, 0.075);
  playWhistleBlast(0.33, 0.36, 0.08);

  const chugTimes = [0.12, 0.34, 0.54, 0.72, 0.88, 1.02];
  chugTimes.forEach((t, idx) => {
    const accent = idx % 2 === 0 ? 0.075 : 0.045;
    playFilteredNoise(t, 0.1, idx % 2 === 0 ? 780 : 1040, 1.4, accent);
  });
}

/**
 * BIG PERFECT 3-FOR-3 CELEBRATION (ZERO MISTAKES!):
 * Lively rhythmic crowd clapping ("CLAP-CLAP-CLAP-CLAP-CLAP!") + joyful brass/bell
 * victory melody + triumphant Golden Express steam train whistle!
 */
export function playPerfectApplauseAndTrainSound(enabled: boolean): void {
  if (!enabled) return;

  // 1. Multi-person rhythmic applause ("Clap! Clap! Clap-Clap-Clap! + Cheerful crowd claps!")
  const clapBeats = [
    0.02, 0.19, 0.36, 0.49, 0.62,
    0.80, 0.94, 1.08, 1.22, 1.36, 1.50, 1.64,
  ];
  clapBeats.forEach((beat, idx) => {
    // Layer 3 slightly offset "audience members" per beat so it sounds like a room clapping!
    playSingleHandclap(beat, 1420 + (idx % 3) * 180, 1.0);
    playSingleHandclap(beat + 0.024, 1780 - (idx % 2) * 160, 0.82);
    playSingleHandclap(beat + 0.046, 1300 + (idx % 4) * 140, 0.68);
  });

  // 2. Joyful celebratory melody ("Ta-da-da-DAAA!")
  playTone(523.25, 0.04, 0.15, 'triangle', 0.11); // C5
  playTone(659.25, 0.16, 0.15, 'triangle', 0.11); // E5
  playTone(783.99, 0.28, 0.16, 'triangle', 0.12); // G5
  playTone(1046.5, 0.42, 0.38, 'triangle', 0.13); // C6
  playTone(1318.5, 0.62, 0.42, 'sine', 0.095);    // E6 sparkle harmonic

  // 3. Golden Express two-tone whistle + fast happy chugs!
  playWhistleBlast(0.88, 0.24, 0.09);
  playWhistleBlast(1.18, 0.44, 0.1);
  [1.0, 1.18, 1.34, 1.48, 1.61, 1.73].forEach((t, idx) => {
    playFilteredNoise(t, 0.09, idx % 2 === 0 ? 820 : 1120, 1.5, 0.07);
  });
}

export function playTrainArrivalSound(letter: LetterId, enabled: boolean): void {
  if (!enabled) return;
  playFilteredNoise(0.0, 0.1, 900, 1.5, 0.05);
  playFilteredNoise(0.14, 0.12, 720, 1.5, 0.06);
  playTone(523.25, 0.22, 0.16, 'triangle', 0.07);
  playTone(659.25, 0.32, 0.22, 'triangle', 0.075);
  speakPhrase(`Letter ${letter}!`, enabled);
}

export function playTripCompleteSound(enabled: boolean): void {
  if (!enabled) return;
  playPerfectApplauseAndTrainSound(enabled);
}

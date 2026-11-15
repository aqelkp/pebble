import {
  playLetterAudio,
  playPerfectTrainCheer,
  playTripCompleteCheer,
  playWordAudio,
  playWrongLetterExplanation,
  preloadTrainCelebrationAudio,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
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

function playWhistleVoice(
  freq: number,
  startSec: number,
  durationSec: number,
  type: OscillatorType,
  peakGain: number,
): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + startSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(24, freq * 0.96), t0);
    osc.frequency.exponentialRampToValueAtTime(
      freq * 1.01,
      t0 + Math.min(0.08, durationSec * 0.35),
    );

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.028, durationSec * 0.22));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + durationSec + 0.03);
  } catch {
    // Ignore autoplay-blocked audio errors
  }
}

function playWhistleBlast(
  startSec: number,
  durationSec: number,
  peakGain = 0.08,
  pitchScale = 1,
): void {
  playWhistleVoice(349.23 * pitchScale, startSec, durationSec, 'triangle', peakGain);
  playWhistleVoice(440.0 * pitchScale, startSec, durationSec, 'triangle', peakGain * 0.85);
  playWhistleVoice(587.33 * pitchScale, startSec, durationSec, 'sine', peakGain * 0.65);
  playFilteredNoise(startSec, durationSec * 0.88, 1480, 2.1, peakGain * 0.34);
}

/**
 * Crisp metallic railroad crossing bell ("DING-DING-DING-DING!").
 */
function playCrossingBell(startSec: number, rings: number, gainScale = 1): void {
  const interval = 0.17;
  for (let i = 0; i < rings; i += 1) {
    const t = startSec + i * interval;
    playTone(1174.66, t, 0.16, 'triangle', 0.065 * gainScale);
    playTone(2489.02, t, 0.13, 'sine', 0.035 * gainScale);
  }
}

/**
 * Warm brake/cylinder steam release ("PSSSHHH!") before pulling away from the station.
 */
function playSteamRelease(startSec: number, durationSec: number, peakGain = 0.065): void {
  playFilteredNoise(startSec, durationSec, 1650, 1.15, peakGain);
  playFilteredNoise(startSec + 0.02, durationSec * 0.9, 820, 1.4, peakGain * 0.72);
}

/**
 * Accelerating steam-engine chugs whose tempo speeds up smoothly as the train rolls out.
 */
function playAcceleratingChugs(
  startSec: number,
  chugCount: number,
  startGapSec: number,
  endGapSec: number,
  gainScale = 1,
): void {
  let cursor = startSec;
  const denom = Math.max(1, chugCount - 1);
  for (let i = 0; i < chugCount; i += 1) {
    const isDownbeat = i % 2 === 0;
    if (isDownbeat) {
      playFilteredNoise(cursor, 0.09, 680, 1.4, 0.078 * gainScale);
      playTone(96, cursor, 0.075, 'triangle', 0.062 * gainScale, 62);
    } else {
      playFilteredNoise(cursor, 0.07, 1080, 1.5, 0.052 * gainScale);
    }
    const progress = i / denom;
    const gap = startGapSec + (endGapSec - startGapSec) * progress;
    cursor += gap;
  }
}

export function speakTrainWord(wordId: string, fallbackWord: string, enabled: boolean): void {
  playWordAudio(wordId, fallbackWord, enabled);
}

export function speakWrongLetterExplanation(
  wordId: string,
  wordLabel: string,
  wrongLetter: LetterId,
  targetLetter: LetterId,
  enabled: boolean,
  onComplete?: () => void,
): void {
  playWrongLetterExplanation(
    wordId,
    wordLabel,
    wrongLetter,
    targetLetter,
    enabled,
    onComplete,
  );
}

export function speakStationLetter(letter: LetterId, enabled: boolean): void {
  playLetterAudio(letter, `Letter ${letter}`, enabled);
}

export function speakPerfectTrainCheer(variantIdx: number, enabled: boolean): void {
  playPerfectTrainCheer(variantIdx, enabled);
}

export function speakTripCompleteCheer(enabled: boolean): void {
  playTripCompleteCheer(enabled);
}

export { preloadTrainCelebrationAudio };

export function stopTrainSpeech(): void {
  stopAllSpokenAudio();
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
 * Lively train departure (when completed with >= 1 mistake):
 * Crossing bell + steam release + two-tone whistle + accelerating engine chugs!
 */
export function playTrainDepartureSound(enabled: boolean): void {
  if (!enabled) return;
  playCrossingBell(0.02, 4, 0.85);
  playSteamRelease(0.18, 0.26, 0.06);
  playWhistleBlast(0.3, 0.24, 0.08, 1.0);
  playWhistleBlast(0.6, 0.42, 0.09, 1.0);
  playAcceleratingChugs(0.42, 12, 0.19, 0.078, 0.95);
}

/**
 * BIG PERFECT 3-FOR-3 CELEBRATION (ZERO MISTAKES!):
 * Lively rhythmic crowd clapping ("CLAP-CLAP-CLAP-CLAP-CLAP!") + joyful brass/bell
 * victory melody + crossing bell + 3-blast Golden Express whistle + turbo chugs!
 */
export function playPerfectApplauseAndTrainSound(enabled: boolean): void {
  if (!enabled) return;

  // 1. Multi-person rhythmic applause ("Clap! Clap! Clap-Clap-Clap! + Cheerful crowd claps!")
  const clapBeats = [
    0.02, 0.18, 0.34, 0.47, 0.6,
    0.76, 0.9, 1.04, 1.18, 1.32, 1.46, 1.6, 1.74,
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
  playTone(1318.5, 0.62, 0.42, 'sine', 0.095);    // E6 shimmer harmonic
  playTone(1567.98, 0.78, 0.44, 'sine', 0.075);   // G6 celebratory shimmer

  // 3. Crossing bell + steam blast + 3-blast Golden Express whistle + turbo accelerating chugs!
  playCrossingBell(0.76, 5, 1.0);
  playSteamRelease(0.94, 0.3, 0.075);
  playWhistleBlast(1.02, 0.2, 0.09, 1.0);
  playWhistleBlast(1.26, 0.2, 0.095, 1.0);
  playWhistleBlast(1.52, 0.48, 0.105, 1.122);
  playAcceleratingChugs(1.12, 15, 0.17, 0.066, 1.1);
}

export function playTrainArrivalSound(letter: LetterId, enabled: boolean): void {
  if (!enabled) return;
  playFilteredNoise(0.0, 0.1, 900, 1.5, 0.05);
  playFilteredNoise(0.14, 0.12, 720, 1.5, 0.06);
  playTone(523.25, 0.22, 0.16, 'triangle', 0.07);
  playTone(659.25, 0.32, 0.22, 'triangle', 0.075);
  playLetterAudio(letter, `Letter ${letter}!`, enabled);
}

export function playTripCompleteSound(enabled: boolean): void {
  if (!enabled) return;
  playPerfectApplauseAndTrainSound(enabled);
}

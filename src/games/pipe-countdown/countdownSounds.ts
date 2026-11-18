import { assetUrl } from '../../utils/assets';
import { stopAllSpokenAudio } from '../../utils/wordAudio';
import { NUMBER_WORD_LABELS, type CountdownModeId, type CountdownRoundSpec } from './countdownData';

let sharedCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeTimerId: number | null = null;
let voiceNonce = 0;
const warmedPaths = new Set<string>();

/**
 * Descending marimba pitch map (10 -> 0): high E6 stepping all the way down
 * to warm resonant root C4 at 0 — the exact acoustic opposite of forward counting!
 */
const DESCENDING_MARIMBA_HZ: Readonly<Record<number, number>> = {
  10: 1318.51, // E6
  9: 1174.66,  // D6
  8: 1046.5,   // C6
  7: 987.77,   // B5
  6: 880.0,    // A5
  5: 783.99,   // G5
  4: 659.25,   // E5
  3: 587.33,   // D5
  2: 523.25,   // C5
  1: 392.0,    // G4
  0: 261.63,   // C4 (Shut-off valve root!)
};

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
  peakGain = 0.085,
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
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.016, durationSec * 0.22));
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
    gain.gain.exponentialRampToValueAtTime(peakGain, t0 + Math.min(0.02, durationSec * 0.25));
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

function playSingleHandclap(startSec: number, pitchHue = 1550, gainScale = 1): void {
  playFilteredNoise(startSec, 0.026, pitchHue, 1.7, 0.082 * gainScale);
  playFilteredNoise(startSec + 0.011, 0.028, pitchHue * 1.12, 1.9, 0.092 * gainScale);
  playFilteredNoise(startSec + 0.022, 0.066, pitchHue * 0.94, 1.5, 0.105 * gainScale);
}

/**
 * Plays a warm descending marimba note + tactile rubber-seal click when a pipe rod locks in!
 */
export function playCountdownSealNote(num: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = DESCENDING_MARIMBA_HZ[num] ?? 523.25;
  // Snug gasket seal thud + marimba strike
  playTone(210, 0, 0.045, 'sine', 0.055, 130);
  playTone(freq, 0.015, num === 0 ? 0.36 : 0.22, 'triangle', 0.105);
  playTone(freq * 2, 0.02, 0.14, 'sine', 0.045);
  if (num === 0) {
    // Warm valve-lock root chord C4 + G4 + C5
    playTone(392.0, 0.06, 0.32, 'triangle', 0.075);
    playTone(523.25, 0.11, 0.36, 'sine', 0.08);
  }
}

/**
 * Celebratory fountain water-shimmer + descending-then-blooming chord + clapping for 0 leaks!
 */
export function playZeroFountainFanfare(wasFlawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  // Gentle fountain water cascade shimmer
  playFilteredNoise(0.04, 0.55, 1150, 1.1, 0.055);
  playFilteredNoise(0.28, 0.65, 1650, 1.3, 0.048);

  const chord = wasFlawless
    ? [783.99, 659.25, 523.25, 659.25, 783.99, 1046.5]
    : [659.25, 523.25, 659.25, 783.99];
  chord.forEach((freq, idx) => {
    playTone(freq, 0.06 + idx * 0.07, 0.28, 'triangle', 0.09);
  });

  if (wasFlawless) {
    const clapBeats = [0.1, 0.24, 0.38, 0.52, 0.66, 0.82, 0.98];
    clapBeats.forEach((beat, idx) => {
      playSingleHandclap(beat, 1460 + (idx % 3) * 150, 0.9);
      playSingleHandclap(beat + 0.024, 1720 - (idx % 2) * 140, 0.74);
    });
  }
}

/**
 * Playfulness Asymmetry: calm, quiet, boringly neutral tap on wrong rod selection.
 * Never a funny splash or loud buzzer.
 */
export function playCountdownWrongTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(170, 0, 0.11, 'sine', 0.055, 142);
}

export function stopCountdownVoice(): void {
  voiceNonce += 1;
  if (activeTimerId !== null && typeof window !== 'undefined') {
    window.clearTimeout(activeTimerId);
    activeTimerId = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore cleanup errors
    }
    activeAudio = null;
  }
  stopAllSpokenAudio();
}

export function getCountdownAudioPath(clipId: string | number): string {
  return `audio/countdown/${clipId}.mp3`;
}

export function preloadCountdownClipPaths(relativePaths: readonly string[]): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  for (const rel of relativePaths) {
    if (warmedPaths.has(rel)) continue;
    warmedPaths.add(rel);
    try {
      const audio = new Audio(assetUrl(rel));
      audio.preload = 'auto';
      audio.load();
    } catch {
      // Ignore pre-warm errors
    }
  }
}

export function preloadCountdownModeAssets(modeId: CountdownModeId): void {
  const paths: string[] = [
    getCountdownAudioPath(`intro-${modeId}`),
    getCountdownAudioPath('zero-splash'),
    getCountdownAudioPath('zero-wonderful'),
    getCountdownAudioPath('perfect-crown'),
    getCountdownAudioPath('hint-0'),
  ];
  const top = modeId === '5-to-0' ? 5 : modeId === '10-to-0' ? 10 : 9;
  for (let n = 0; n <= top; n += 1) {
    paths.push(getCountdownAudioPath(n));
    if (n >= 1) {
      paths.push(getCountdownAudioPath(`hint-${n}`));
      paths.push(getCountdownAudioPath(`gap-need-${n}`));
    }
    if (n <= 9) {
      paths.push(getCountdownAudioPath(`before-${n}`));
    }
  }
  preloadCountdownClipPaths(paths);
}

export function preloadCountdownRoundAssets(round: CountdownRoundSpec): void {
  preloadCountdownModeAssets(round.modeId);
}

function playSingleCountdownClip(relativePath: string, enabled: boolean, onEnded?: () => void): void {
  if (!enabled || typeof window === 'undefined') {
    onEnded?.();
    return;
  }
  stopCountdownVoice();
  const currentNonce = voiceNonce;

  try {
    const audio = new Audio(assetUrl(relativePath));
    audio.preload = 'auto';
    audio.volume = 0.96;
    activeAudio = audio;

    audio.addEventListener('ended', () => {
      if (activeAudio === audio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        onEnded?.();
      }
    });
    audio.addEventListener('error', () => {
      if (activeAudio === audio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        onEnded?.();
      }
    });

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (activeAudio === audio) activeAudio = null;
        if (voiceNonce === currentNonce) {
          onEnded?.();
        }
      });
    }
  } catch {
    onEnded?.();
  }
}

export function playCountdownIntroVoice(modeId: CountdownModeId, enabled: boolean): void {
  playSingleCountdownClip(getCountdownAudioPath(`intro-${modeId}`), enabled);
}

export function playCountdownNumberVoice(num: number, enabled: boolean, onEnded?: () => void): void {
  playSingleCountdownClip(getCountdownAudioPath(num), enabled, onEnded);
}

export function playCountdownHintVoice(targetNum: number, enabled: boolean): void {
  if (targetNum <= 0) {
    playSingleCountdownClip(getCountdownAudioPath('hint-0'), enabled);
    return;
  }
  playSingleCountdownClip(getCountdownAudioPath(`hint-${targetNum}`), enabled);
}

/**
 * Sealing Cap 0: speaks "Zero!", then celebrates with "Zero leaks! Three, two, one, zero — splash!"
 * (or rotating celebration clips across rounds).
 */
export function playZeroSealedCelebrationVoice(
  roundIndex: number,
  wasFlawless: boolean,
  enabled: boolean,
): void {
  if (!enabled || typeof window === 'undefined') return;
  stopCountdownVoice();
  const currentNonce = voiceNonce;

  const followupClipId =
    roundIndex % 2 === 0
      ? 'zero-splash'
      : wasFlawless
        ? 'perfect-crown'
        : 'zero-wonderful';

  playSingleCountdownClip(getCountdownAudioPath(0), true, () => {
    if (voiceNonce !== currentNonce) return;
    activeTimerId = window.setTimeout(() => {
      if (voiceNonce !== currentNonce) return;
      playSingleCountdownClip(getCountdownAudioPath(followupClipId), true);
    }, 150);
  });
}

/**
 * Step 1 of Teach-First Mistake Flow (~2.6s on visible board):
 * Speaks bundled Kokoro explanation:
 * "Look at the wide gap! We need number <target> next, before <wrong>."
 */
export function playWrongRodTeachVoice(
  targetNum: number,
  wrongNum: number,
  enabled: boolean,
  onComplete: () => void,
): () => void {
  if (typeof window === 'undefined') {
    onComplete();
    return () => {};
  }

  let settled = false;
  let stepTimer: number | null = null;
  let safetyTimer: number | null = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (stepTimer !== null) {
      window.clearTimeout(stepTimer);
      stepTimer = null;
    }
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    onComplete();
  };

  if (!enabled) {
    // Still hold visible board teaching comparison for ~1.8s when muted so child sees the size difference
    stepTimer = window.setTimeout(finish, 1800);
    return () => {
      settled = true;
      if (stepTimer !== null) window.clearTimeout(stepTimer);
    };
  }

  stopCountdownVoice();
  const currentNonce = voiceNonce;

  if (targetNum <= 0) {
    playSingleCountdownClip(getCountdownAudioPath('hint-0'), true, () => {
      stepTimer = window.setTimeout(finish, 260);
    });
    safetyTimer = window.setTimeout(finish, 3400);
    return () => {
      settled = true;
      if (stepTimer !== null) window.clearTimeout(stepTimer);
      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
      stopCountdownVoice();
    };
  }

  const playSecondPart = () => {
    if (settled || voiceNonce !== currentNonce) return;
    if (wrongNum < 0 || wrongNum > 9 || !(wrongNum in NUMBER_WORD_LABELS)) {
      stepTimer = window.setTimeout(finish, 250);
      return;
    }
    try {
      const beforeAudio = new Audio(assetUrl(getCountdownAudioPath(`before-${wrongNum}`)));
      beforeAudio.preload = 'auto';
      beforeAudio.volume = 0.96;
      activeAudio = beforeAudio;

      beforeAudio.addEventListener('ended', () => {
        if (activeAudio === beforeAudio) activeAudio = null;
        if (voiceNonce === currentNonce) {
          stepTimer = window.setTimeout(finish, 240);
        }
      });
      beforeAudio.addEventListener('error', () => {
        if (activeAudio === beforeAudio) activeAudio = null;
        finish();
      });

      const p = beforeAudio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => finish());
      }
    } catch {
      finish();
    }
  };

  try {
    const firstAudio = new Audio(assetUrl(getCountdownAudioPath(`gap-need-${targetNum}`)));
    firstAudio.preload = 'auto';
    firstAudio.volume = 0.96;
    activeAudio = firstAudio;

    firstAudio.addEventListener('ended', () => {
      if (activeAudio === firstAudio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        stepTimer = window.setTimeout(playSecondPart, 90);
      }
    });
    firstAudio.addEventListener('error', () => {
      if (activeAudio === firstAudio) activeAudio = null;
      stepTimer = window.setTimeout(finish, 1800);
    });

    const playPromise = firstAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (activeAudio === firstAudio) activeAudio = null;
        stepTimer = window.setTimeout(finish, 1800);
      });
    }
  } catch {
    stepTimer = window.setTimeout(finish, 1800);
  }

  safetyTimer = window.setTimeout(finish, 3900);

  return () => {
    settled = true;
    if (stepTimer !== null) window.clearTimeout(stepTimer);
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    stopCountdownVoice();
  };
}

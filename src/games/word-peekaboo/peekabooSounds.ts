import { assetUrl } from '../../utils/assets';
import {
  preloadAudioPaths,
  preloadImages,
  speakWithSynthesis,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import type { PeekabooCardSpec, PeekabooWordId } from './peekabooData';

let sharedCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeTimerId: number | null = null;
let voiceNonce = 0;

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

function playSingleHandclap(startSec: number, pitchHue = 1550, gainScale = 1): void {
  playFilteredNoise(startSec, 0.026, pitchHue, 1.7, 0.085 * gainScale);
  playFilteredNoise(startSec + 0.011, 0.028, pitchHue * 1.12, 1.9, 0.095 * gainScale);
  playFilteredNoise(startSec + 0.022, 0.068, pitchHue * 0.94, 1.5, 0.11 * gainScale);
}

const PEEL_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
] as const;

export function playTilePeelChime(stepIdx: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = PEEL_SCALE[Math.max(0, stepIdx) % PEEL_SCALE.length];
  playTone(freq, 0, 0.18, 'triangle', 0.095);
  playTone(freq * 1.5, 0.045, 0.16, 'sine', 0.055);
}

export function playCharacterRevealFanfare(wasFlawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  const notes = wasFlawless
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
    : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.065, 0.28, 'triangle', 0.095);
  });

  if (wasFlawless) {
    const clapBeats = [0.06, 0.2, 0.34, 0.48, 0.62, 0.78, 0.94, 1.1];
    clapBeats.forEach((beat, idx) => {
      playSingleHandclap(beat, 1450 + (idx % 3) * 160, 0.92);
      playSingleHandclap(beat + 0.024, 1740 - (idx % 2) * 150, 0.76);
    });
  }
}

/**
 * Calm, low-key muted tap for wrong word picks (Playfulness Asymmetry:
 * never comical, never loud, never entertaining).
 */
export function playPeekabooWrongTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(175, 0, 0.11, 'sine', 0.06, 145);
}

export function stopPeekabooVoice(): void {
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

export function getPeekabooWordAudioPath(wordId: PeekabooWordId): string {
  return `audio/peekaboo/words/${wordId}.mp3`;
}

export function getPeekabooThatsAudioPath(wordId: PeekabooWordId): string {
  return `audio/peekaboo/thats/${wordId}.mp3`;
}

export function getPeekabooIntroAudioPath(pairId: string): string {
  return `audio/peekaboo/intro/${pairId}.mp3`;
}

export function getPeekabooFoundAudioPath(pairId: string): string {
  return `audio/peekaboo/found/${pairId}.mp3`;
}

function playSinglePeekabooClip(
  relativePath: string,
  fallbackPhrase: string,
  enabled: boolean,
): void {
  if (!enabled || typeof window === 'undefined') return;
  stopPeekabooVoice();
  const currentNonce = voiceNonce;

  try {
    const audio = new Audio(assetUrl(relativePath));
    audio.preload = 'auto';
    audio.volume = 0.96;
    activeAudio = audio;

    audio.addEventListener('ended', () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
    });

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (voiceNonce === currentNonce && fallbackPhrase) {
          speakWithSynthesis(fallbackPhrase, true);
        }
      });
    }
  } catch {
    if (fallbackPhrase) {
      speakWithSynthesis(fallbackPhrase, true);
    }
  }
}

/**
 * Plays ONLY the single target word (zero filler words) so the child's
 * attention stays 100% locked onto the word itself.
 */
export function playTargetWordOnlyVoice(
  wordId: PeekabooWordId,
  displayWord: string,
  enabled: boolean,
): void {
  playSinglePeekabooClip(getPeekabooWordAudioPath(wordId), displayWord, enabled);
}

/**
 * Intro voice bookend: "Help discover <Character Name>!"
 * Handles autoplay blocks gracefully so the board never stalls on reload.
 */
export function playCharacterIntroVoice(
  pairId: string,
  charName: string,
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
    stepTimer = window.setTimeout(finish, 600);
    return () => {
      settled = true;
      if (stepTimer !== null) window.clearTimeout(stepTimer);
    };
  }

  stopPeekabooVoice();
  const currentNonce = voiceNonce;
  const fallbackPhrase = `Help discover ${charName}!`;

  const triggerFallback = (blockedByAutoplay: boolean) => {
    if (settled || voiceNonce !== currentNonce) return;
    if (blockedByAutoplay) {
      stepTimer = window.setTimeout(finish, 900);
      return;
    }
    speakWithSynthesis(fallbackPhrase, true);
    stepTimer = window.setTimeout(finish, 1600);
  };

  try {
    const audio = new Audio(assetUrl(getPeekabooIntroAudioPath(pairId)));
    audio.preload = 'auto';
    audio.volume = 0.96;
    activeAudio = audio;

    audio.addEventListener('ended', () => {
      if (activeAudio === audio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        stepTimer = window.setTimeout(finish, 240);
      }
    });

    audio.addEventListener('error', () => {
      if (activeAudio === audio) activeAudio = null;
      triggerFallback(false);
    });

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err: unknown) => {
        if (activeAudio === audio) activeAudio = null;
        const isAutoplayBlock =
          err instanceof DOMException && err.name === 'NotAllowedError';
        triggerFallback(isAutoplayBlock);
      });
    }
  } catch {
    triggerFallback(false);
  }

  safetyTimer = window.setTimeout(finish, 4200);

  return () => {
    settled = true;
    if (stepTimer !== null) window.clearTimeout(stepTimer);
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    stopPeekabooVoice();
  };
}

/**
 * Teach-first wrong-word voice:
 * "That's <wrongWord>." -> 300ms beat -> "<targetWord>."
 */
export function playWrongWordTeachVoice(
  wrongId: PeekabooWordId,
  wrongDisplay: string,
  targetId: PeekabooWordId,
  targetDisplay: string,
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
    finish();
    return () => {
      settled = true;
    };
  }

  stopPeekabooVoice();
  const currentNonce = voiceNonce;

  const triggerFallback = () => {
    if (settled || voiceNonce !== currentNonce) return;
    speakWithSynthesis(`That's ${wrongDisplay}. ${targetDisplay}.`, true);
    stepTimer = window.setTimeout(finish, 1800);
  };

  const playTargetClip = () => {
    if (settled || voiceNonce !== currentNonce) return;
    try {
      const targetAudio = new Audio(assetUrl(getPeekabooWordAudioPath(targetId)));
      targetAudio.preload = 'auto';
      targetAudio.volume = 0.96;
      activeAudio = targetAudio;

      targetAudio.addEventListener('ended', () => {
        if (activeAudio === targetAudio) activeAudio = null;
        if (voiceNonce === currentNonce) {
          stepTimer = window.setTimeout(finish, 180);
        }
      });
      targetAudio.addEventListener('error', () => {
        if (activeAudio === targetAudio) activeAudio = null;
        finish();
      });
      const p = targetAudio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => finish());
      }
    } catch {
      finish();
    }
  };

  try {
    const thatsAudio = new Audio(assetUrl(getPeekabooThatsAudioPath(wrongId)));
    thatsAudio.preload = 'auto';
    thatsAudio.volume = 0.96;
    activeAudio = thatsAudio;

    thatsAudio.addEventListener('ended', () => {
      if (activeAudio === thatsAudio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        stepTimer = window.setTimeout(playTargetClip, 300);
      }
    });
    thatsAudio.addEventListener('error', () => {
      if (activeAudio === thatsAudio) activeAudio = null;
      triggerFallback();
    });

    const playPromise = thatsAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (activeAudio === thatsAudio) activeAudio = null;
        triggerFallback();
      });
    }
  } catch {
    triggerFallback();
  }

  safetyTimer = window.setTimeout(finish, 4100);

  return () => {
    settled = true;
    if (stepTimer !== null) window.clearTimeout(stepTimer);
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    stopPeekabooVoice();
  };
}

/**
 * Finale voice bookend: "Congratulations! You found <Character Name>!"
 */
export function playCharacterFoundVoice(
  pairId: string,
  charName: string,
  enabled: boolean,
): void {
  playSinglePeekabooClip(
    getPeekabooFoundAudioPath(pairId),
    `Congratulations! You found ${charName}!`,
    enabled,
  );
}

export function preloadPeekabooCardAssets(card: PeekabooCardSpec): void {
  preloadImages([card.character.imagePath]);
  const paths: string[] = [
    getPeekabooIntroAudioPath(card.character.pairId),
    getPeekabooFoundAudioPath(card.character.pairId),
  ];
  for (const tile of card.tiles) {
    paths.push(getPeekabooWordAudioPath(tile.wordId));
    paths.push(getPeekabooThatsAudioPath(tile.wordId));
  }
  preloadAudioPaths(paths);
}

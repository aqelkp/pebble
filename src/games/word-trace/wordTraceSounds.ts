import { assetUrl } from '../../utils/assets';
import {
  normalizeSpokenName,
  speakChildNamePhrase,
  stopChildNameTts,
} from '../../utils/childNameTts';
import type { WordTraceItemSpec } from './wordTraceEngine';

const LEFT_TO_RIGHT_HINT_PATH = 'audio/word-trace/hint-left-to-right.mp3';

let sharedAudioCtx: AudioContext | null = null;
let activeClipCleanup: (() => void) | null = null;
const preloadedAudioMap = new Map<string, HTMLAudioElement>();

function getAudioCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
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
    // Ignore autoplay-restricted audio errors
  }
}

export function stopWordTraceVoice(): void {
  stopChildNameTts();
  if (activeClipCleanup) {
    const fn = activeClipCleanup;
    activeClipCleanup = null;
    fn();
  }
}

function warmSingleAudioPath(relPath: string): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  if (preloadedAudioMap.has(relPath)) return;
  try {
    const el = new Audio(assetUrl(relPath));
    el.preload = 'auto';
    el.load();
    preloadedAudioMap.set(relPath, el);
  } catch {
    // Ignore preload errors
  }
}

export function preloadWordTraceClips(items: readonly WordTraceItemSpec[]): void {
  warmSingleAudioPath(LEFT_TO_RIGHT_HINT_PATH);
  for (const item of items) {
    warmSingleAudioPath(item.promptAudioPath);
    warmSingleAudioPath(item.wordAudioPath);
  }
}

function playBundledMp3(
  relPath: string,
  options?: { maxWaitMs?: number; onDone?: () => void },
): () => void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    const id = window.setTimeout(() => options?.onDone?.(), 0);
    return () => window.clearTimeout(id);
  }

  let settled = false;
  let safetyTimer: number | null = null;
  let audio: HTMLAudioElement | null = null;

  const finish = (fireCallback: boolean) => {
    if (settled) return;
    settled = true;
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // Ignore cleanup errors
      }
      audio = null;
    }
    if (activeClipCleanup === cancelOnly) {
      activeClipCleanup = null;
    }
    if (fireCallback) {
      options?.onDone?.();
    }
  };

  const cancelOnly = () => finish(false);
  activeClipCleanup = cancelOnly;

  try {
    audio = new Audio(assetUrl(relPath));
    audio.preload = 'auto';
    audio.volume = 0.96;

    audio.addEventListener('ended', () => finish(true), { once: true });
    audio.addEventListener('error', () => finish(true), { once: true });

    safetyTimer = window.setTimeout(() => {
      finish(true);
    }, options?.maxWaitMs ?? 4400);

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => finish(true));
    }
  } catch {
    finish(true);
  }

  return cancelOnly;
}

/**
 * Speaks `<Child Name>,` when a custom family name is configured (skipping generic 'Child'),
 * then chains directly into the pre-generated Kokoro prompt MP3 ("Can you write cat?").
 */
export function playPersonalizedWordPrompt(
  item: WordTraceItemSpec,
  rawChildName: string | undefined,
  soundEnabled: boolean,
): () => void {
  stopWordTraceVoice();
  if (!soundEnabled) return () => {};

  const customName = normalizeSpokenName(rawChildName);
  let cancelled = false;
  let cancelSub: (() => void) | null = null;

  if (customName) {
    cancelSub = speakChildNamePhrase(`${customName},`, {
      enabled: true,
      soundEnabled: true,
      rate: 0.95,
      pitch: 1.06,
      startTimeoutMs: 360,
      maxDurationMs: 1350,
      onDone: () => {
        if (cancelled) return;
        cancelSub = playBundledMp3(item.promptAudioPath);
      },
    });
  } else {
    cancelSub = playBundledMp3(item.promptAudioPath);
  }

  const cancelAll = () => {
    cancelled = true;
    cancelSub?.();
  };
  activeClipCleanup = cancelAll;
  return cancelAll;
}

export function playWordTraceSpokenWord(
  item: WordTraceItemSpec,
  soundEnabled: boolean,
): () => void {
  stopWordTraceVoice();
  if (!soundEnabled) return () => {};
  return playBundledMp3(item.wordAudioPath);
}

/**
 * Plays the calm Teach-First voice cue ("Let's write left to right! Start at the glowing circle
 * and follow the arrow.") while keeping the board visible for at least ~2.5s before calling onDone.
 */
export function playWordTraceTeachHint(
  soundEnabled: boolean,
  onDone: () => void,
): () => void {
  stopWordTraceVoice();
  const minDisplayMs = 2500;
  const startedAt = performance.now();
  let cancelled = false;
  let delayTimer: number | null = null;
  let cancelMp3: (() => void) | null = null;

  const scheduleFinish = () => {
    if (cancelled) return;
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, minDisplayMs - elapsed);
    if (remaining <= 16) {
      onDone();
    } else {
      delayTimer = window.setTimeout(() => {
        if (!cancelled) onDone();
      }, remaining);
    }
  };

  if (!soundEnabled) {
    delayTimer = window.setTimeout(() => {
      if (!cancelled) onDone();
    }, minDisplayMs);
  } else {
    cancelMp3 = playBundledMp3(LEFT_TO_RIGHT_HINT_PATH, {
      maxWaitMs: 4600,
      onDone: scheduleFinish,
    });
  }

  const cleanup = () => {
    cancelled = true;
    if (delayTimer !== null) {
      window.clearTimeout(delayTimer);
      delayTimer = null;
    }
    cancelMp3?.();
  };
  activeClipCleanup = cleanup;
  return cleanup;
}

export function playWordStrokeTick(enabled: boolean): void {
  if (!enabled) return;
  playTone(470, 0, 0.05, 'sine', 0.045, 535);
}

const SUB_STROKE_NOTES = [523.25, 587.33, 659.25, 783.99] as const;

export function playWordSubStrokeNote(strokeIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const note = SUB_STROKE_NOTES[Math.max(0, strokeIndex) % SUB_STROKE_NOTES.length];
  playTone(note, 0, 0.14, 'triangle', 0.075);
}

const LETTER_CHORDS: readonly (readonly [number, number])[] = [
  [523.25, 659.25], // C5 + E5
  [587.33, 739.99], // D5 + F#5
  [659.25, 830.61], // E5 + G#5
  [783.99, 987.77], // G5 + B5
];

/**
 * Ascending marimba two-note chord played as each letter in a multi-letter word completes.
 */
export function playLetterFinishedChord(charIdx: number, enabled: boolean): void {
  if (!enabled) return;
  const pair = LETTER_CHORDS[Math.max(0, charIdx) % LETTER_CHORDS.length];
  playTone(pair[0], 0, 0.19, 'triangle', 0.09);
  playTone(pair[1], 0.055, 0.21, 'triangle', 0.08);
}

/**
 * Left-to-Right Sound Wave across every letter of the completed word (`c -> a -> t`).
 */
export function playWordCompleteWave(
  charCount: number,
  crowned: boolean,
  enabled: boolean,
): void {
  if (!enabled) return;
  const scale = [523.25, 659.25, 783.99, 987.77, 1046.5];
  const steps = Math.max(1, Math.min(4, charCount));
  for (let i = 0; i < steps; i += 1) {
    playTone(scale[i], i * 0.13, 0.22, 'triangle', 0.09);
  }
  const finaleStart = steps * 0.13 + 0.04;
  playTone(1046.5, finaleStart, 0.28, 'triangle', 0.09);
  if (crowned) {
    playTone(1318.5, finaleStart + 0.07, 0.3, 'sine', 0.075);
  }
}

/**
 * Quiet, low-energy wooden tap for out-of-order / backwards drags (Playfulness Asymmetry).
 */
export function playWordTraceLockedTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(175, 0, 0.085, 'sine', 0.036, 130);
}

export function playWordTraceRoundFanfare(enabled: boolean): void {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.08, 0.28, 'triangle', 0.09);
  });
}

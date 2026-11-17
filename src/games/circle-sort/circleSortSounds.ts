import { assetUrl } from '../../utils/assets';
import {
  preloadAudioPaths,
  preloadImages,
  speakWithSynthesis,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import {
  getCircleSortItemSpec,
  getCircleSortQuestSpec,
  type CircleSortItemId,
  type CircleSortPageSpec,
  type CircleSortQuestId,
} from './circleSortData';

let sharedCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let activeAudio: HTMLAudioElement | null = null;
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

const CIRCLE_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
] as const;

export function playCircleSuccessChime(foundIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = CIRCLE_SCALE[Math.max(0, foundIndex) % CIRCLE_SCALE.length];
  playTone(freq, 0, 0.17, 'triangle', 0.095);
  playTone(freq * 1.5, 0.045, 0.15, 'sine', 0.055);
}

export function playCirclePageFanfare(wasFlawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  const notes = wasFlawless
    ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
    : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.065, 0.28, 'triangle', 0.095);
  });

  const clapBeats = wasFlawless
    ? [0.06, 0.2, 0.34, 0.48, 0.62, 0.78, 0.94]
    : [0.1, 0.28, 0.46];
  clapBeats.forEach((beat, idx) => {
    playSingleHandclap(beat, 1460 + (idx % 3) * 150, 0.9);
    if (wasFlawless) {
      playSingleHandclap(beat + 0.024, 1730 - (idx % 2) * 140, 0.75);
    }
  });
}

/**
 * Playfulness Asymmetry: quiet, low-gain neutral tap on wrong pick
 * (zero funny boings, buzzers, or dramatic shakes).
 */
export function playCircleWrongTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(170, 0, 0.11, 'sine', 0.055, 142);
}

export function stopCircleSortVoice(): void {
  voiceNonce += 1;
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

export function getCircleSortItemAudioPath(itemId: CircleSortItemId): string {
  return `audio/circle-sort/items/${itemId}.mp3`;
}

export function getCircleSortPromptAudioPath(questId: CircleSortQuestId, count: number): string {
  const safeCount = count === 3 || count === 5 ? count : 4;
  return `audio/circle-sort/prompts/${questId}-${safeCount}.mp3`;
}

export function getCircleSortMistakeAudioPath(mistakeAudioKey: string): string {
  const safeKey = /^[a-z0-9-]+$/.test(mistakeAudioKey) ? mistakeAudioKey : 'not-fruit-carrot';
  return `audio/circle-sort/mistakes/${safeKey}.mp3`;
}

export function getCircleSortCheerAudioPath(
  kind: 'flawless-page' | 'page-complete' | 'round-flawless' | 'round-complete',
): string {
  return `audio/circle-sort/cheers/${kind}.mp3`;
}

function playSingleClipFireAndForget(
  relativePath: string,
  fallbackPhrase: string,
  enabled: boolean,
): void {
  if (!enabled || typeof window === 'undefined') return;
  stopCircleSortVoice();
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
      playPromise.catch((err: unknown) => {
        const isAutoplay = err instanceof DOMException && err.name === 'NotAllowedError';
        if (!isAutoplay && voiceNonce === currentNonce && fallbackPhrase) {
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

export function playCircleSortMissionPrompt(
  questId: CircleSortQuestId,
  targetCount: number,
  enabled: boolean,
): void {
  const quest = getCircleSortQuestSpec(questId);
  playSingleClipFireAndForget(
    getCircleSortPromptAudioPath(questId, targetCount),
    quest.buildSpokenPrompt(targetCount),
    enabled,
  );
}

export function playCircleSortItemConfirmation(
  itemId: CircleSortItemId,
  enabled: boolean,
): void {
  const spec = getCircleSortItemSpec(itemId);
  playSingleClipFireAndForget(
    getCircleSortItemAudioPath(itemId),
    spec.spokenLabel,
    enabled,
  );
}

export function playCircleSortCheerVoice(
  kind: 'flawless-page' | 'page-complete' | 'round-flawless' | 'round-complete',
  enabled: boolean,
): void {
  const fallbackMap: Record<typeof kind, string> = {
    'flawless-page': 'Bravo! You circled every right picture with zero mistakes!',
    'page-complete': 'Wonderful job! You found them all!',
    'round-flawless': 'Amazing! Every page solved with zero mistakes!',
    'round-complete': 'Great sorting! You finished all your pages!',
  };
  playSingleClipFireAndForget(
    getCircleSortCheerAudioPath(kind),
    fallbackMap[kind],
    enabled,
  );
}

/**
 * Teach-first wrong-item contrast voice:
 * Plays the bundled Kokoro MP3 explaining the exact item and why it doesn't belong
 * (e.g., "No, cow eats plants, it is not a carnivore."), then invokes `onComplete`
 * so `ThinkAgainOverlay` opens only AFTER the child hears the explanation.
 */
export function playCircleSortMistakeExplanation(
  mistakeAudioKey: string,
  spokenFallback: string,
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
    stepTimer = window.setTimeout(finish, 1800);
    return () => {
      settled = true;
      if (stepTimer !== null) window.clearTimeout(stepTimer);
    };
  }

  stopCircleSortVoice();
  const currentNonce = voiceNonce;

  const triggerFallback = () => {
    if (settled || voiceNonce !== currentNonce) return;
    speakWithSynthesis(spokenFallback, true);
    stepTimer = window.setTimeout(finish, 2400);
  };

  try {
    const audio = new Audio(assetUrl(getCircleSortMistakeAudioPath(mistakeAudioKey)));
    audio.preload = 'auto';
    audio.volume = 0.96;
    activeAudio = audio;

    audio.addEventListener('ended', () => {
      if (activeAudio === audio) activeAudio = null;
      if (voiceNonce === currentNonce) {
        stepTimer = window.setTimeout(finish, 200);
      }
    });

    audio.addEventListener('error', () => {
      if (activeAudio === audio) activeAudio = null;
      triggerFallback();
    });

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (activeAudio === audio) activeAudio = null;
        triggerFallback();
      });
    }
  } catch {
    triggerFallback();
  }

  safetyTimer = window.setTimeout(finish, 4600);

  return () => {
    settled = true;
    if (stepTimer !== null) window.clearTimeout(stepTimer);
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    stopCircleSortVoice();
  };
}

export function preloadCircleSortPageAssets(page: CircleSortPageSpec): void {
  const imagePaths: string[] = [];
  const audioPaths: string[] = [
    getCircleSortPromptAudioPath(page.questId, page.targetCount),
    getCircleSortCheerAudioPath('flawless-page'),
    getCircleSortCheerAudioPath('page-complete'),
  ];

  for (const slot of page.slots) {
    const item = getCircleSortItemSpec(slot.itemId);
    if (item.art.kind === 'png') {
      imagePaths.push(item.art.path);
    }
    if (slot.isTarget) {
      audioPaths.push(getCircleSortItemAudioPath(slot.itemId));
    } else if (slot.mistakeAudioKey) {
      audioPaths.push(getCircleSortMistakeAudioPath(slot.mistakeAudioKey));
    }
  }

  if (imagePaths.length > 0) {
    preloadImages(imagePaths);
  }
  preloadAudioPaths(audioPaths);
}

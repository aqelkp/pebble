import { assetUrl } from '../../utils/assets';
import {
  preloadAudioPaths,
  preloadImages,
  speakWithSynthesis,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import {
  COMPARE_ITEM_THEMES,
  formatComparisonSentence,
  formatTeachFirstExplanation,
  getCompareItemSpec,
  NUMBER_WORDS,
  type ComparePromptSpec,
  type CompareSymbol,
} from './compareData';

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

const COUNT_MARIMBA_SCALE = [
  523.25, // 1: C5
  587.33, // 2: D5
  659.25, // 3: E5
  698.46, // 4: F5
  783.99, // 5: G5
  880.0,  // 6: A5
  987.77, // 7: B5
  1046.5, // 8: C6
  1174.66, // 9: D6
  1318.51, // 10: E6
] as const;

export function getCompareClipPath(clipId: string): string {
  return `audio/compare/${clipId}.mp3`;
}

export function stopCompareVoice(): void {
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

export function playCompareTilePickupSound(enabled: boolean): void {
  if (!enabled) return;
  playTone(420, 0, 0.075, 'triangle', 0.065, 520);
}

export function playItemCountMarimbaNote(
  countNumber: number,
  enabled: boolean,
  speakNumber = true,
): void {
  if (!enabled) return;
  const clamped = Math.max(1, Math.min(10, Math.floor(countNumber)));
  const freq = COUNT_MARIMBA_SCALE[clamped - 1];
  playTone(freq, 0, 0.19, 'triangle', 0.1);
  playTone(freq * 2, 0.015, 0.11, 'sine', 0.04);
  if (speakNumber) {
    playClipSequence(
      [{ path: getCompareClipPath(`num-${clamped}`) }],
      NUMBER_WORDS[clamped] ?? String(clamped),
      enabled,
    );
  }
}

export function playCompareNumberTapVoice(n: number, enabled: boolean): void {
  if (!enabled) return;
  const clamped = Math.max(0, Math.min(10, Math.floor(n)));
  playTone(440 + clamped * 32, 0, 0.14, 'triangle', 0.07);
  playClipSequence(
    [{ path: getCompareClipPath(`num-${clamped}`) }],
    NUMBER_WORDS[clamped] ?? String(clamped),
    enabled,
  );
}

export function playCompareRelationPreviewVoice(symbol: CompareSymbol, enabled: boolean): void {
  if (!enabled) return;
  const relId = symbol === '>' ? 'rel-gt' : symbol === '<' ? 'rel-lt' : 'rel-eq';
  const fallback =
    symbol === '>' ? 'is greater than' : symbol === '<' ? 'is less than' : 'is equal to';
  playTone(symbol === '=' ? 587.33 : 659.25, 0, 0.12, 'triangle', 0.065);
  playClipSequence([{ path: getCompareClipPath(relId) }], fallback, enabled);
}

export function playCompareCorrectChime(stepIdx: number, enabled: boolean): void {
  if (!enabled) return;
  const baseShift = (stepIdx % 3) * 28;
  const notes = [523.25 + baseShift, 659.25 + baseShift, 783.99 + baseShift, 1046.5 + baseShift];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.055, 0.24, 'triangle', 0.095);
  });
}

/**
 * Playfulness Asymmetry: Wrong picks produce ONLY a soft, calm, boringly neutral
 * low-gain tap — zero buzzers, zero funny boings, zero exaggerated SFX.
 */
export function playCompareWrongTap(enabled: boolean): void {
  if (!enabled) return;
  playTone(175, 0, 0.11, 'sine', 0.055, 145);
}

interface ClipStep {
  path: string;
  gapAfterMs?: number;
}

function playClipSequence(
  steps: readonly ClipStep[],
  fallbackPhrase: string,
  enabled: boolean,
  onComplete?: () => void,
  silentFallbackMs = 900,
): () => void {
  if (typeof window === 'undefined') {
    onComplete?.();
    return () => {};
  }

  let settled = false;
  let gapTimer: number | null = null;
  let safetyTimer: number | null = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (gapTimer !== null) {
      window.clearTimeout(gapTimer);
      gapTimer = null;
    }
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    onComplete?.();
  };

  if (!enabled || steps.length === 0) {
    gapTimer = window.setTimeout(finish, silentFallbackMs);
    return () => {
      settled = true;
      if (gapTimer !== null) window.clearTimeout(gapTimer);
    };
  }

  stopCompareVoice();
  const currentNonce = voiceNonce;

  const triggerFallback = (blockedByAutoplay: boolean) => {
    if (settled || voiceNonce !== currentNonce) return;
    if (blockedByAutoplay) {
      gapTimer = window.setTimeout(finish, silentFallbackMs);
      return;
    }
    if (fallbackPhrase) {
      speakWithSynthesis(fallbackPhrase, true);
    }
    gapTimer = window.setTimeout(finish, Math.max(1200, silentFallbackMs));
  };

  const playStepAt = (idx: number) => {
    if (settled || voiceNonce !== currentNonce) return;
    if (idx >= steps.length) {
      finish();
      return;
    }

    const step = steps[idx];
    try {
      const audio = new Audio(assetUrl(step.path));
      audio.preload = 'auto';
      audio.volume = 0.96;
      activeAudio = audio;

      audio.addEventListener('ended', () => {
        if (activeAudio === audio) activeAudio = null;
        if (settled || voiceNonce !== currentNonce) return;
        const waitMs = step.gapAfterMs ?? 55;
        if (idx + 1 >= steps.length) {
          gapTimer = window.setTimeout(finish, 120);
        } else {
          gapTimer = window.setTimeout(() => playStepAt(idx + 1), waitMs);
        }
      });

      audio.addEventListener('error', () => {
        if (activeAudio === audio) activeAudio = null;
        triggerFallback(false);
      });

      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: unknown) => {
          if (activeAudio === audio) activeAudio = null;
          const isAutoplayBlock =
            err instanceof DOMException && err.name === 'NotAllowedError';
          triggerFallback(isAutoplayBlock);
        });
      }
    } catch {
      triggerFallback(false);
    }
  };

  playStepAt(0);
  safetyTimer = window.setTimeout(finish, Math.max(4500, steps.length * 2400));

  return () => {
    settled = true;
    if (gapTimer !== null) window.clearTimeout(gapTimer);
    if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    stopCompareVoice();
  };
}

export function getPromptCueClipId(prompt: ComparePromptSpec): string {
  if (prompt.kind === 'quantity') return 'cue-quantity';
  if (prompt.kind === 'length') {
    return prompt.lengthVariant === 'towers' ? 'cue-towers' : 'cue-sticks';
  }
  if (prompt.kind === 'measure') return 'cue-measure';
  return 'cue-numbers';
}

export function playComparePromptCueVoice(
  prompt: ComparePromptSpec,
  enabled: boolean,
): () => void {
  const clipId = getPromptCueClipId(prompt);
  const fallbackMap: Record<string, string> = {
    'cue-quantity': 'Count both baskets and pick the sign!',
    'cue-sticks': 'Compare the lengths and pick the sign!',
    'cue-towers': 'Compare the block towers and pick the sign!',
    'cue-measure': 'Check both juice jugs and pick the sign!',
    'cue-numbers': 'Compare the two numbers and pick the sign!',
  };
  return playClipSequence(
    [{ path: getCompareClipPath(clipId) }],
    fallbackMap[clipId] ?? 'Compare both sides and pick the sign!',
    enabled,
  );
}

/**
 * Bundled Kokoro comparison readout on correct placement:
 * - "Eight is greater than five!"
 * - "Zero is less than six!"
 * - "Four is equal to four!"
 */
export function playCompareSuccessVoice(
  leftValue: number,
  rightValue: number,
  enabled: boolean,
  onComplete?: () => void,
): () => void {
  const a = Math.max(0, Math.min(10, Math.floor(leftValue)));
  const b = Math.max(0, Math.min(10, Math.floor(rightValue)));
  const fallback = formatComparisonSentence(a, b);

  if (a === b) {
    return playClipSequence(
      [{ path: getCompareClipPath(`eq-full-${a}`) }],
      fallback,
      enabled,
      onComplete,
      1100,
    );
  }

  if (a > b) {
    return playClipSequence(
      [
        { path: getCompareClipPath(`gt-lead-${a}`), gapAfterMs: 45 },
        { path: getCompareClipPath(`num-${b}`) },
      ],
      fallback,
      enabled,
      onComplete,
      1250,
    );
  }

  return playClipSequence(
    [
      { path: getCompareClipPath(`lt-lead-${a}`), gapAfterMs: 45 },
      { path: getCompareClipPath(`num-${b}`) },
    ],
    fallback,
    enabled,
    onComplete,
    1250,
  );
}

/**
 * Step 1 of Two-Step Mistake Flow ("Teach First, Pause Second"):
 * Plays calm bundled Kokoro explanation while the board stays 100% visible
 * (~2.8s minimum on muted/blocked devices, or full voice completion when sound is on),
 * then invokes `onComplete` so `ThinkAgainOverlay` opens second.
 */
export function playCompareTeachMistakeVoice(
  leftValue: number,
  rightValue: number,
  enabled: boolean,
  onComplete: () => void,
): () => void {
  const a = Math.max(0, Math.min(10, Math.floor(leftValue)));
  const b = Math.max(0, Math.min(10, Math.floor(rightValue)));
  const fallback = formatTeachFirstExplanation(a, b);
  const minVisualTeachMs = 2800;
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

  let delayTimer: number | null = null;
  let cancelled = false;

  const finishAfterMinWindow = () => {
    if (cancelled) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = now - startedAt;
    const remaining = Math.max(0, minVisualTeachMs - elapsed);
    if (remaining <= 20 || typeof window === 'undefined') {
      onComplete();
    } else {
      delayTimer = window.setTimeout(() => {
        if (!cancelled) onComplete();
      }, remaining);
    }
  };

  let steps: ClipStep[];
  if (a === b) {
    steps = [{ path: getCompareClipPath('teach-equal') }];
  } else if (a > b) {
    steps = [
      { path: getCompareClipPath(`teach-more-${a}`), gapAfterMs: 45 },
      { path: getCompareClipPath(`num-${b}`), gapAfterMs: 180 },
      { path: getCompareClipPath('teach-open-side') },
    ];
  } else {
    steps = [
      { path: getCompareClipPath(`teach-less-${a}`), gapAfterMs: 45 },
      { path: getCompareClipPath(`num-${b}`), gapAfterMs: 180 },
      { path: getCompareClipPath('teach-open-side') },
    ];
  }

  const cancelVoice = playClipSequence(
    steps,
    fallback,
    enabled,
    finishAfterMinWindow,
    minVisualTeachMs,
  );

  return () => {
    cancelled = true;
    if (delayTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(delayTimer);
    }
    cancelVoice();
  };
}

export function playCompareRoundFanfare(flawless: boolean, enabled: boolean): () => void {
  if (!enabled) return () => {};
  const notes = flawless
    ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
    : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, idx * 0.065, 0.28, 'triangle', 0.095);
  });

  if (flawless) {
    const clapBeats = [0.06, 0.2, 0.34, 0.48, 0.62, 0.78, 0.94, 1.1];
    clapBeats.forEach((beat, idx) => {
      playSingleHandclap(beat, 1450 + (idx % 3) * 160, 0.92);
      playSingleHandclap(beat + 0.024, 1740 - (idx % 2) * 150, 0.76);
    });
  }

  const clipId = flawless ? 'cheer-flawless' : 'cheer-complete';
  const fallback = flawless
    ? 'Bravo! Zero mistakes! Every comparison was spot on!'
    : 'Awesome comparing! You finished the whole quest!';

  return playClipSequence([{ path: getCompareClipPath(clipId) }], fallback, enabled);
}

export function preloadCompareRoundAssets(prompts: readonly ComparePromptSpec[]): void {
  const imagePaths = new Set<string>();
  const audioPaths = new Set<string>([
    getCompareClipPath('rel-gt'),
    getCompareClipPath('rel-lt'),
    getCompareClipPath('rel-eq'),
    getCompareClipPath('teach-open-side'),
    getCompareClipPath('teach-equal'),
    getCompareClipPath('cheer-flawless'),
    getCompareClipPath('cheer-complete'),
  ]);

  for (let n = 0; n <= 10; n += 1) {
    audioPaths.add(getCompareClipPath(`num-${n}`));
  }

  for (const item of COMPARE_ITEM_THEMES) {
    if (item.imagePath) imagePaths.add(item.imagePath);
  }

  for (const p of prompts) {
    audioPaths.add(getCompareClipPath(getPromptCueClipId(p)));
    const spec = getCompareItemSpec(p.itemThemeId);
    if (spec.imagePath) imagePaths.add(spec.imagePath);

    if (p.leftValue === p.rightValue) {
      audioPaths.add(getCompareClipPath(`eq-full-${p.leftValue}`));
    } else if (p.leftValue > p.rightValue) {
      audioPaths.add(getCompareClipPath(`gt-lead-${p.leftValue}`));
      audioPaths.add(getCompareClipPath(`teach-more-${p.leftValue}`));
    } else {
      audioPaths.add(getCompareClipPath(`lt-lead-${p.leftValue}`));
      audioPaths.add(getCompareClipPath(`teach-less-${p.leftValue}`));
    }
  }

  preloadImages(Array.from(imagePaths));
  preloadAudioPaths(Array.from(audioPaths));
}

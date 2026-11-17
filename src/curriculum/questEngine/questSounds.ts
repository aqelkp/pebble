import { assetUrl } from '../../utils/assets';
import {
  preloadAudioPaths,
  speakWithSynthesis,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import type { AdventureSkinId } from './questTypes';

let sharedAudioCtx: AudioContext | null = null;
let activeQuestVoiceEl: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      sharedAudioCtx = new Ctx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function getQuestVoicePath(voiceClipId: string): string {
  return `audio/quest/${voiceClipId}.mp3`;
}

export function preloadQuestVoiceClips(voiceClipIds: readonly string[]): void {
  preloadAudioPaths(voiceClipIds.map(getQuestVoicePath));
}

export function stopQuestVoice(): void {
  if (activeQuestVoiceEl) {
    try {
      activeQuestVoiceEl.pause();
      activeQuestVoiceEl.currentTime = 0;
    } catch {
      // Ignore audio cleanup errors
    }
    activeQuestVoiceEl = null;
  }
  stopAllSpokenAudio();
}

export function playQuestPromptVoice(
  voiceClipId: string,
  fallbackText: string,
  enabled: boolean,
): void {
  if (!enabled || typeof window === 'undefined') return;
  stopQuestVoice();

  try {
    const audio = new Audio(assetUrl(getQuestVoicePath(voiceClipId)));
    audio.preload = 'auto';
    audio.volume = 0.95;
    activeQuestVoiceEl = audio;

    audio.addEventListener('ended', () => {
      if (activeQuestVoiceEl === audio) {
        activeQuestVoiceEl = null;
      }
    });

    audio.addEventListener('error', () => {
      if (activeQuestVoiceEl === audio) {
        activeQuestVoiceEl = null;
      }
      if (fallbackText) {
        speakWithSynthesis(fallbackText, true);
      }
    });

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (activeQuestVoiceEl === audio) {
          activeQuestVoiceEl = null;
        }
        if (fallbackText) {
          speakWithSynthesis(fallbackText, true);
        }
      });
    }
  } catch {
    if (fallbackText) {
      speakWithSynthesis(fallbackText, true);
    }
  }
}

/**
 * Speaks a bundled number audio clip (`audio/numbers/<n>.mp3`) when adding Tens bundles or Ones pebbles.
 */
export function playQuestCountNumberVoice(n: number, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || n < 0 || n > 50 || !Number.isInteger(n)) return;
  stopQuestVoice();
  try {
    const audio = new Audio(assetUrl(`audio/numbers/${n}.mp3`));
    audio.preload = 'auto';
    audio.volume = 0.92;
    activeQuestVoiceEl = audio;
    audio.addEventListener('ended', () => {
      if (activeQuestVoiceEl === audio) {
        activeQuestVoiceEl = null;
      }
    });
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  } catch {
    // Ignore audio errors
  }
}

/**
 * Speaks an ordinal stepping-stone clip (`audio/quest/ord-step-<pos>.mp3`, e.g. "First!", "Second!")
 * when a learner taps racers along the Finish Flag track to count aloud.
 */
export function playQuestOrdinalStepVoice(
  pos: number,
  fallbackWord: string,
  enabled: boolean,
): void {
  if (!enabled || typeof window === 'undefined' || pos < 1 || pos > 10 || !Number.isInteger(pos)) {
    return;
  }
  playQuestPromptVoice(`ord-step-${pos}`, fallbackWord, enabled);
}

/**
 * Calm Teach-First spoken explanation on the visible locked board before ThinkAgainOverlay opens.
 * Uses a prompt-specific bundled Kokoro teaching clip (`audio/quest/<mistakeVoiceClipId>.mp3`) when
 * available, otherwise `audio/ui/look-closely-hint.mp3`, falling back to Web Speech only if needed.
 */
export function playQuestMistakeExplanation(
  explanationText: string,
  enabled: boolean,
  onComplete: () => void,
  mistakeVoiceClipId?: string,
): () => void {
  if (typeof window === 'undefined') {
    onComplete();
    return () => {};
  }

  stopQuestVoice();
  let settled = false;
  const startedAt = Date.now();
  let safetyTimerId: number | null = null;
  let postTimerId: number | null = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (safetyTimerId !== null) window.clearTimeout(safetyTimerId);
    if (postTimerId !== null) window.clearTimeout(postTimerId);
    onComplete();
  };

  const maxWaitMs = mistakeVoiceClipId ? 6200 : 2600;
  const minBoardHoldMs = mistakeVoiceClipId ? 2700 : 2400;
  safetyTimerId = window.setTimeout(finish, maxWaitMs);

  if (enabled) {
    try {
      const clipPath = mistakeVoiceClipId
        ? getQuestVoicePath(mistakeVoiceClipId)
        : 'audio/ui/look-closely-hint.mp3';
      const audio = new Audio(assetUrl(clipPath));
      audio.preload = 'auto';
      audio.volume = 0.94;
      activeQuestVoiceEl = audio;

      if (mistakeVoiceClipId) {
        audio.addEventListener('ended', () => {
          if (activeQuestVoiceEl === audio) {
            activeQuestVoiceEl = null;
          }
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(280, minBoardHoldMs - elapsed);
          postTimerId = window.setTimeout(finish, remaining);
        });
      }

      audio.addEventListener('error', () => {
        if (explanationText) speakWithSynthesis(explanationText, true);
      });
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (explanationText) speakWithSynthesis(explanationText, true);
        });
      }
    } catch {
      if (explanationText) speakWithSynthesis(explanationText, true);
    }
  }

  return () => {
    settled = true;
    if (safetyTimerId !== null) window.clearTimeout(safetyTimerId);
    if (postTimerId !== null) window.clearTimeout(postTimerId);
    stopQuestVoice();
  };
}

/**
 * Playfulness Asymmetry: Wrong taps produce only a quiet, low-gain single neutral tap (never funny boings).
 */
export function playQuestGentleWrongTap(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(195, now);
  gain.gain.setValueAtTime(0.055, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

export function playQuestStepTick(stepIdx: number, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 587.33, 659.25, 783.99];
  const freq = notes[stepIdx % notes.length];
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.11, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.19);
}

/**
 * Narrative celebration SFX tailored to the active Adventure Skin!
 */
export function playQuestSkinSuccessSound(skinId: AdventureSkinId, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Shared ascending marimba chord
  const chord =
    skinId === 'mystery-express'
      ? [523.25, 659.25, 783.99, 1046.5]
      : skinId === 'pebble-creek'
        ? [440, 554.37, 659.25, 880]
        : skinId === 'cloud-balloon'
          ? [587.33, 739.99, 880, 1174.66]
          : [493.88, 659.25, 783.99, 987.77];

  chord.forEach((freq, idx) => {
    const t = now + idx * 0.075;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = skinId === 'treasure-keys' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });

  // Train whistle harmonic for Mystery Express
  if (skinId === 'mystery-express') {
    [587.33, 783.99].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.28);
      gain.gain.setValueAtTime(0.07, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.28);
      osc.stop(now + 0.58);
    });
  }
}

export function playQuestGrandFinaleSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  fanfare.forEach((freq, idx) => {
    const t = now + idx * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.46);
  });
}

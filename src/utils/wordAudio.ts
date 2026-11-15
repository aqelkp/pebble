import {
  getLetterAudioPath,
  getWordAudioPath,
  type LetterId,
} from '../data/wordBank';
import { assetUrl } from './assets';

const prefetchedUrls = new Set<string>();
let activeAudioEl: HTMLAudioElement | null = null;
let activeSequenceTimer: number | null = null;
let playbackNonce = 0;

function cancelSpeechSynthesis(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis errors
  }
}

export function stopAllSpokenAudio(): void {
  playbackNonce += 1;
  if (activeSequenceTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(activeSequenceTimer);
    activeSequenceTimer = null;
  }
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // Ignore audio element cleanup errors
    }
    activeAudioEl = null;
  }
  cancelSpeechSynthesis();
}

export function speakWithSynthesis(phrase: string, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = 'en-US';
    utter.rate = 0.93;
    utter.pitch = 1.07;
    utter.volume = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {
    // Speech synthesis unavailable or restricted
  }
}

function playStaticClip(relativePath: string, fallbackPhrase: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  stopAllSpokenAudio();
  const currentNonce = playbackNonce;

  try {
    const src = assetUrl(relativePath);
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.95;
    activeAudioEl = audio;

    audio.addEventListener('ended', () => {
      if (activeAudioEl === audio) {
        activeAudioEl = null;
      }
    });

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (playbackNonce === currentNonce && fallbackPhrase) {
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
 * Plays the pre-generated static Kokoro MP3 for a canonical word ID,
 * falling back to Web Speech only if static audio cannot play.
 */
export function playWordAudio(
  wordId: string,
  fallbackPhrase: string,
  enabled: boolean,
): void {
  playStaticClip(getWordAudioPath(wordId), fallbackPhrase, enabled);
}

/**
 * Plays the pre-generated static Kokoro MP3 for a letter ("Letter A"),
 * falling back to Web Speech only if static audio cannot play.
 */
export function playLetterAudio(
  letter: LetterId,
  fallbackPhrase: string,
  enabled: boolean,
): void {
  playStaticClip(getLetterAudioPath(letter), fallbackPhrase, enabled);
}

/**
 * Quietly pre-warms browser & Service Worker cache for audio clips without blocking UI.
 */
export function preloadAudioPaths(relativePaths: readonly string[]): void {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  for (const relPath of relativePaths) {
    const url = assetUrl(relPath);
    if (prefetchedUrls.has(url)) continue;
    prefetchedUrls.add(url);
    void fetch(url, { credentials: 'same-origin' }).catch(() => {
      prefetchedUrls.delete(url);
    });
  }
}

export function preloadWordsAudio(wordIds: readonly string[]): void {
  preloadAudioPaths(wordIds.map((id) => getWordAudioPath(id)));
}

export function preloadLettersAudio(letters: readonly LetterId[]): void {
  preloadAudioPaths(letters.map((letter) => getLetterAudioPath(letter)));
}

const THINK_AGAIN_AUDIO_PATH = 'audio/ui/think-again.mp3';
const MISTAKE_HEY_PICKED_AUDIO_PATH = 'audio/ui/mistake-hey-picked.mp3';
const THINK_OR_START_AGAIN_AUDIO_PATH = 'audio/ui/think-or-start-again.mp3';

export function getLetterStartsAudioPath(letter: LetterId): string {
  return `audio/letters-starts/${letter.toLowerCase()}.mp3`;
}

export function getLetterNotAudioPath(letter: LetterId): string {
  return `audio/letters-not/${letter.toLowerCase()}.mp3`;
}

interface AudioSequenceStep {
  relativePath: string;
  pauseAfterMs?: number;
}

function playAudioSequence(
  steps: readonly AudioSequenceStep[],
  fallbackPhrase: string,
  enabled: boolean,
  onComplete?: () => void,
): void {
  if (!enabled || typeof window === 'undefined' || steps.length === 0) {
    onComplete?.();
    return;
  }

  stopAllSpokenAudio();
  const seqNonce = playbackNonce;
  let fallbackTriggered = false;

  const finishSequence = () => {
    if (playbackNonce !== seqNonce) return;
    onComplete?.();
  };

  const triggerFallback = () => {
    if (fallbackTriggered || playbackNonce !== seqNonce) return;
    fallbackTriggered = true;
    if (activeSequenceTimer !== null) {
      window.clearTimeout(activeSequenceTimer);
      activeSequenceTimer = null;
    }
    if (activeAudioEl) {
      try {
        activeAudioEl.pause();
      } catch {
        // Ignore audio element cleanup errors
      }
      activeAudioEl = null;
    }
    if (fallbackPhrase) {
      speakWithSynthesis(fallbackPhrase, true);
    }
    activeSequenceTimer = window.setTimeout(() => {
      activeSequenceTimer = null;
      finishSequence();
    }, 1900);
  };

  const runStep = (idx: number) => {
    if (playbackNonce !== seqNonce || fallbackTriggered) return;
    if (idx >= steps.length) {
      finishSequence();
      return;
    }

    const step = steps[idx];
    let advanced = false;
    let clipSafetyTimer: number | null = null;

    const advanceToNext = () => {
      if (advanced || playbackNonce !== seqNonce || fallbackTriggered) return;
      advanced = true;
      if (clipSafetyTimer !== null) {
        window.clearTimeout(clipSafetyTimer);
        clipSafetyTimer = null;
      }
      const pauseMs = Math.max(0, step.pauseAfterMs ?? 0);
      if (pauseMs > 0) {
        activeSequenceTimer = window.setTimeout(() => {
          activeSequenceTimer = null;
          runStep(idx + 1);
        }, pauseMs);
      } else {
        runStep(idx + 1);
      }
    };

    try {
      const audio = new Audio(assetUrl(step.relativePath));
      audio.preload = 'auto';
      audio.volume = 0.95;
      activeAudioEl = audio;

      clipSafetyTimer = window.setTimeout(() => {
        if (activeAudioEl === audio) {
          try {
            audio.pause();
          } catch {
            // Ignore audio pause errors
          }
          activeAudioEl = null;
        }
        advanceToNext();
      }, 2400);

      audio.addEventListener('ended', () => {
        if (activeAudioEl === audio) {
          activeAudioEl = null;
        }
        advanceToNext();
      });

      audio.addEventListener('error', () => {
        if (clipSafetyTimer !== null) {
          window.clearTimeout(clipSafetyTimer);
          clipSafetyTimer = null;
        }
        if (activeAudioEl === audio) {
          activeAudioEl = null;
        }
        triggerFallback();
      });

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (clipSafetyTimer !== null) {
            window.clearTimeout(clipSafetyTimer);
            clipSafetyTimer = null;
          }
          triggerFallback();
        });
      }
    } catch {
      triggerFallback();
    }
  };

  runStep(0);
}

/**
 * Plays an in-context bundled Kokoro explanation for a wrong letter selection:
 * "Okay, hey! You picked <Word>. That starts with letter <Wrong>, not letter <Target>."
 */
export function playWrongLetterExplanation(
  wordId: string,
  wordLabel: string,
  wrongLetter: LetterId,
  targetLetter: LetterId,
  enabled: boolean,
  onComplete?: () => void,
): void {
  playAudioSequence(
    [
      { relativePath: MISTAKE_HEY_PICKED_AUDIO_PATH, pauseAfterMs: 55 },
      { relativePath: getWordAudioPath(wordId), pauseAfterMs: 85 },
      { relativePath: getLetterStartsAudioPath(wrongLetter), pauseAfterMs: 65 },
      { relativePath: getLetterNotAudioPath(targetLetter), pauseAfterMs: 0 },
    ],
    `Okay, hey! You picked ${wordLabel}. That starts with letter ${wrongLetter}, not letter ${targetLetter}.`,
    enabled,
    onComplete,
  );
}

/**
 * Plays the Kokoro-generated calm prompt for the Think Again pause overlay,
 * falling back to Web Speech only if static audio cannot play.
 */
export function playThinkAgainVoice(enabled: boolean): void {
  playStaticClip(
    THINK_AGAIN_AUDIO_PATH,
    'Hey, do you want to take some time to think again?',
    enabled,
  );
}

/**
 * Plays the Kokoro-generated calm prompt offering both "think again" and "start again".
 */
export function playThinkOrStartAgainVoice(enabled: boolean): void {
  playStaticClip(
    THINK_OR_START_AGAIN_AUDIO_PATH,
    'Do you want to think again, or start again?',
    enabled,
  );
}

export function preloadThinkAgainVoice(): void {
  preloadAudioPaths([
    THINK_AGAIN_AUDIO_PATH,
    MISTAKE_HEY_PICKED_AUDIO_PATH,
    THINK_OR_START_AGAIN_AUDIO_PATH,
  ]);
}

export function preloadLetterMistakeAudio(letters: readonly LetterId[]): void {
  const uniqueLetters = Array.from(new Set(letters));
  preloadAudioPaths([
    MISTAKE_HEY_PICKED_AUDIO_PATH,
    THINK_OR_START_AGAIN_AUDIO_PATH,
    ...uniqueLetters.map(getLetterStartsAudioPath),
    ...uniqueLetters.map(getLetterNotAudioPath),
  ]);
}

/**
 * Quietly pre-warms browser & Service Worker cache for theme images during Setup.
 */
export function preloadImages(relativePaths: readonly string[]): void {
  if (typeof window === 'undefined') return;
  for (const relPath of relativePaths) {
    const url = assetUrl(relPath);
    if (prefetchedUrls.has(url)) continue;
    prefetchedUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

import {
  getLetterAudioPath,
  getWordAudioPath,
  type LetterId,
} from '../data/wordBank';
import { assetUrl } from './assets';

const prefetchedUrls = new Set<string>();
let activeAudioEl: HTMLAudioElement | null = null;
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

export function preloadThinkAgainVoice(): void {
  preloadAudioPaths([THINK_AGAIN_AUDIO_PATH]);
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

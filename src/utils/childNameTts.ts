let activeSpeechCleanup: (() => void) | null = null;

/**
 * Normalizes a saved profile name for safe, gentle speech synthesis output.
 * Strips non-name punctuation and ignores empty/generic defaults unless allowed.
 */
export function normalizeSpokenName(
  rawName: string | undefined | null,
  options?: { allowGenericDefault?: boolean },
): string | null {
  if (typeof rawName !== 'string') return null;
  const cleaned = rawName
    .replace(/[^\p{L}\p{N} '-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
  if (!cleaned) return null;
  if (!options?.allowGenericDefault && cleaned.toLowerCase() === 'child') {
    return null;
  }
  return cleaned;
}

function pickBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (english.length === 0) return voices[0] ?? null;

  const preferred =
    english.find((v) => v.localService && /samantha|ava|karen|daniel|google us/i.test(v.name)) ??
    english.find((v) => v.localService && v.lang.toLowerCase().startsWith('en-us')) ??
    english.find((v) => v.localService) ??
    english[0];
  return preferred ?? null;
}

export function stopChildNameTts(): void {
  if (activeSpeechCleanup) {
    const cleanup = activeSpeechCleanup;
    activeSpeechCleanup = null;
    cleanup();
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors in restricted sandboxes
    }
  }
}

export interface SpeakChildNameOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
  startTimeoutMs?: number;
  maxDurationMs?: number;
  onDone?: () => void;
}

/**
 * Speaks a short personalized phrase containing the child's saved name using the browser's
 * built-in Web Speech API. Guaranteed to settle promptly via start-timeout & cap guards
 * so instruction animations never stall on browsers or headless engines without TTS voices.
 */
export function speakChildNamePhrase(
  phrase: string,
  options?: SpeakChildNameOptions,
): () => void {
  stopChildNameTts();

  const text = phrase.trim();
  const shouldSpeak =
    text.length > 0 &&
    options?.enabled !== false &&
    options?.soundEnabled !== false &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  if (!shouldSpeak) {
    const id = window.setTimeout(() => {
      options?.onDone?.();
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }

  let settled = false;
  let started = false;
  let startTimer: number | null = null;
  let capTimer: number | null = null;

  const clearTimers = () => {
    if (startTimer !== null) {
      window.clearTimeout(startTimer);
      startTimer = null;
    }
    if (capTimer !== null) {
      window.clearTimeout(capTimer);
      capTimer = null;
    }
  };

  const cleanup = (triggerCallback: boolean) => {
    if (settled) return;
    settled = true;
    clearTimers();
    if (activeSpeechCleanup === cancelOnly) {
      activeSpeechCleanup = null;
    }
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
    if (triggerCallback) {
      options?.onDone?.();
    }
  };

  const cancelOnly = () => cleanup(false);
  activeSpeechCleanup = cancelOnly;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickBestEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = voice?.lang || 'en-US';
    utterance.rate = options?.rate ?? 0.94;
    utterance.pitch = options?.pitch ?? 1.05;
    utterance.volume = options?.volume ?? 0.95;

    utterance.onstart = () => {
      if (settled) return;
      started = true;
      if (startTimer !== null) {
        window.clearTimeout(startTimer);
        startTimer = null;
      }
      capTimer = window.setTimeout(() => {
        cleanup(true);
      }, options?.maxDurationMs ?? 1900);
    };

    utterance.onend = () => {
      cleanup(true);
    };

    utterance.onerror = () => {
      cleanup(true);
    };

    startTimer = window.setTimeout(() => {
      if (!started) {
        cleanup(true);
      }
    }, options?.startTimeoutMs ?? 380);

    window.speechSynthesis.speak(utterance);
  } catch {
    cleanup(true);
  }

  return cancelOnly;
}

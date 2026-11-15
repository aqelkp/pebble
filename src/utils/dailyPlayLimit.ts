// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. All daily screen-time limit state read from localStorage (or storage events) is
// treated as untrusted input and validated against strict allow-lists and integer bounds before use,
// failing safe to the default 20-minute daily cap. Add authenticated server enforcement if cloud
// accounts are ever introduced.

export const DAILY_LIMIT_STORAGE_KEY = 'pebble.daily-limit.v1';

export const MIN_DAILY_LIMIT_MINUTES = 1;
export const MAX_DAILY_LIMIT_MINUTES = 180;
export const DEFAULT_DAILY_LIMIT_MINUTES = 20;
export const DAILY_LIMIT_PRESETS = [10, 15, 20, 30, 45, 60, 0] as const;

const MAX_DAILY_SECONDS = 86_400;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyPlayLimitState {
  version: 1;
  dateKey: string;
  usedSeconds: number;
  /** Daily cap in minutes (1–180), or 0 when disabled (Off). */
  limitMinutes: number;
}

/**
 * Returns the local calendar date string (YYYY-MM-DD) so midnight resets follow
 * the family's local clock rather than UTC.
 */
export function getLocalDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sanitizeLimitMinutes(raw: unknown): number {
  if (raw === 0) {
    return 0;
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_DAILY_LIMIT_MINUTES;
  }
  const rounded = Math.round(raw);
  if (rounded <= 0) {
    return DEFAULT_DAILY_LIMIT_MINUTES;
  }
  return Math.min(MAX_DAILY_LIMIT_MINUTES, Math.max(MIN_DAILY_LIMIT_MINUTES, rounded));
}

export function sanitizeUsedSeconds(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return 0;
  }
  const rounded = Math.floor(raw);
  if (rounded < 0) return 0;
  if (rounded > MAX_DAILY_SECONDS) return MAX_DAILY_SECONDS;
  return rounded;
}

export function sanitizeDailyPlayLimitState(
  raw: unknown,
  now: Date = new Date(),
): DailyPlayLimitState {
  const todayKey = getLocalDateKey(now);
  if (typeof raw !== 'object' || raw === null) {
    return {
      version: 1,
      dateKey: todayKey,
      usedSeconds: 0,
      limitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
    };
  }

  const candidate = raw as Partial<DailyPlayLimitState>;
  const limitMinutes = sanitizeLimitMinutes(candidate.limitMinutes);
  const rawDateKey =
    typeof candidate.dateKey === 'string' && DATE_KEY_PATTERN.test(candidate.dateKey)
      ? candidate.dateKey
      : null;

  if (rawDateKey !== todayKey) {
    return {
      version: 1,
      dateKey: todayKey,
      usedSeconds: 0,
      limitMinutes,
    };
  }

  return {
    version: 1,
    dateKey: todayKey,
    usedSeconds: sanitizeUsedSeconds(candidate.usedSeconds),
    limitMinutes,
  };
}

export function loadDailyPlayLimitState(now: Date = new Date()): DailyPlayLimitState {
  const todayKey = getLocalDateKey(now);
  const defaults: DailyPlayLimitState = {
    version: 1,
    dateKey: todayKey,
    usedSeconds: 0,
    limitMinutes: DEFAULT_DAILY_LIMIT_MINUTES,
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(DAILY_LIMIT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    return sanitizeDailyPlayLimitState(parsed, now);
  } catch {
    return defaults;
  }
}

export function saveDailyPlayLimitState(state: DailyPlayLimitState): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = sanitizeDailyPlayLimitState(state);
    window.localStorage.setItem(DAILY_LIMIT_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore localStorage quota or private browsing restrictions
  }
}

export function isDailyLimitReached(state: DailyPlayLimitState): boolean {
  return state.limitMinutes > 0 && state.usedSeconds >= state.limitMinutes * 60;
}

/**
 * Formats today's active play summary for Grown-Ups Only parent screens.
 */
export function formatDailyUsageLabel(state: DailyPlayLimitState): string {
  const usedMinutes = Math.floor(state.usedSeconds / 60);
  const reachedSuffix = isDailyLimitReached(state) ? ' • Daily limit reached' : '';
  if (usedMinutes === 0 && state.usedSeconds > 0) {
    return state.limitMinutes > 0
      ? `Under 1 min of ${state.limitMinutes} min used today${reachedSuffix}`
      : `Under 1 min used today${reachedSuffix}`;
  }
  if (state.limitMinutes > 0) {
    return `${usedMinutes} min of ${state.limitMinutes} min used today${reachedSuffix}`;
  }
  return `${usedMinutes} min used today`;
}

let chimeAudioCtx: AudioContext | null = null;

function getChimeAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!chimeAudioCtx) {
      chimeAudioCtx = new AudioCtx();
    }
    if (chimeAudioCtx.state === 'suspended') {
      void chimeAudioCtx.resume();
    }
    return chimeAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a gentle 3-note descending lullaby cadence (C5 -> G4 -> E4) before the
 * spoken daily wind-down voice so ending gameplay feels calm and warm.
 */
export function playDailyTimeOverChime(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getChimeAudioContext();
  if (!ctx) return;

  const notes: ReadonlyArray<{ freq: number; offsetSec: number; durationSec: number; type: OscillatorType }> = [
    { freq: 523.25, offsetSec: 0, durationSec: 0.24, type: 'sine' },
    { freq: 392.0, offsetSec: 0.14, durationSec: 0.26, type: 'triangle' },
    { freq: 329.63, offsetSec: 0.28, durationSec: 0.36, type: 'sine' },
  ];

  try {
    for (const note of notes) {
      const start = ctx.currentTime + note.offsetSec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + note.durationSec + 0.02);
    }
  } catch {
    // Ignore audio playback errors when autoplay is restricted
  }
}

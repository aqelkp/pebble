import {
  READ_ALONG_CLIP_SLUGS,
  THEME_CHARACTER_AUDIO_BY_PAIR_ID,
  THEME_CHARACTER_AUDIO_LIST,
} from '../data/readAlongCatalog';
import { CANONICAL_WORDS, getLetterAudioPath, type LetterId } from '../data/wordBank';
import { CIRCLE_SORT_ITEMS } from '../games/circle-sort/circleSortData';
import { PEEKABOO_WORDS } from '../games/word-peekaboo/peekabooData';
import {
  getNumberAudioPath,
  playRelativeAudioClip,
  preloadAudioPaths,
  speakWithSynthesis,
} from './wordAudio';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All audio clip slugs, pairIds, and optional
// relative clip paths are strictly validated against allow-listed catalogs and safe-path regexes
// before passing to assetUrl().

const SAFE_SLUG_RE = /^[a-z0-9-]+$/;
const SAFE_CLIP_PATH_RE = /^audio\/[a-z0-9/_-]+\.mp3$/;

const CANONICAL_WORD_IDS = new Set<string>(CANONICAL_WORDS.map((w) => w.id));
const PEEKABOO_WORD_IDS = new Set<string>(PEEKABOO_WORDS.map((w) => w.id));
const CIRCLE_SORT_ITEM_IDS = new Set<string>(CIRCLE_SORT_ITEMS.map((item) => item.id));

const NUMBER_WORDS_0_TO_10: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function slugifyReadAlong(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const THEME_LABEL_TO_PAIR_ID = new Map<string, string>();
for (const entry of THEME_CHARACTER_AUDIO_LIST) {
  const slug = slugifyReadAlong(entry.label);
  if (slug && !THEME_LABEL_TO_PAIR_ID.has(slug)) {
    THEME_LABEL_TO_PAIR_ID.set(slug, entry.pairId);
  }
}

export interface ResolveReadAlongOptions {
  pairId?: string;
  voiceClipPath?: string;
  /** When true (e.g. tapping words in a sentence), single-letter words "a" / "I" speak as words instead of letter names. */
  phraseWord?: boolean;
}

export function resolveReadAlongAudioPath(
  text: string,
  opts?: ResolveReadAlongOptions,
): string | null {
  if (
    opts?.voiceClipPath &&
    !opts.voiceClipPath.includes('..') &&
    SAFE_CLIP_PATH_RE.test(opts.voiceClipPath)
  ) {
    return opts.voiceClipPath;
  }

  if (
    opts?.pairId &&
    SAFE_SLUG_RE.test(opts.pairId) &&
    THEME_CHARACTER_AUDIO_BY_PAIR_ID.has(opts.pairId)
  ) {
    return `audio/themes/words/${opts.pairId}.mp3`;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;

  // Pure integer 0..50
  if (/^\d{1,2}$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isInteger(n) && n >= 0 && n <= 50) {
      return getNumberAudioPath(n);
    }
  }

  // Single letter: word mode ("a", "I") vs phonics letter mode ("Letter A")
  if (/^[a-zA-Z]$/.test(trimmed)) {
    const lower = trimmed.toLowerCase();
    if (opts?.phraseWord) {
      if (lower === 'a') return 'audio/read-along/a.mp3';
      if (lower === 'i') return 'audio/peekaboo/words/i.mp3';
    }
    return getLetterAudioPath(trimmed.toUpperCase() as LetterId);
  }

  const slug = slugifyReadAlong(trimmed);
  if (!slug || !SAFE_SLUG_RE.test(slug)) return null;

  if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS_0_TO_10, slug)) {
    return getNumberAudioPath(NUMBER_WORDS_0_TO_10[slug]);
  }

  if (READ_ALONG_CLIP_SLUGS.has(slug)) {
    return `audio/read-along/${slug}.mp3`;
  }

  if (CANONICAL_WORD_IDS.has(slug)) {
    return `audio/words/${slug}.mp3`;
  }

  if (PEEKABOO_WORD_IDS.has(slug)) {
    return `audio/peekaboo/words/${slug}.mp3`;
  }

  if (CIRCLE_SORT_ITEM_IDS.has(slug)) {
    return `audio/circle-sort/items/${slug}.mp3`;
  }

  const mappedPairId = THEME_LABEL_TO_PAIR_ID.get(slug);
  if (mappedPairId && SAFE_SLUG_RE.test(mappedPairId)) {
    return `audio/themes/words/${mappedPairId}.mp3`;
  }

  return null;
}

export function getThemeCharacterTalkPath(pairId: string): string | null {
  if (!SAFE_SLUG_RE.test(pairId) || !THEME_CHARACTER_AUDIO_BY_PAIR_ID.has(pairId)) {
    return null;
  }
  return `audio/themes/talk/${pairId}.mp3`;
}

export function getThemeCharacterWordPath(pairId: string): string | null {
  if (!SAFE_SLUG_RE.test(pairId) || !THEME_CHARACTER_AUDIO_BY_PAIR_ID.has(pairId)) {
    return null;
  }
  return `audio/themes/words/${pairId}.mp3`;
}

export function preloadThemeAudioForPairIds(pairIds: readonly string[]): void {
  const paths: string[] = [];
  for (const id of pairIds) {
    const talk = getThemeCharacterTalkPath(id);
    const word = getThemeCharacterWordPath(id);
    if (talk) paths.push(talk);
    if (word) paths.push(word);
  }
  if (paths.length > 0) {
    preloadAudioPaths(paths);
  }
}

export function playThemeCharacterTalk(
  pairId: string,
  fallbackName: string,
  enabled: boolean,
): void {
  if (!enabled) return;
  const spec = THEME_CHARACTER_AUDIO_BY_PAIR_ID.get(pairId);
  const relPath = getThemeCharacterTalkPath(pairId);
  const fallback = spec?.talkText ?? `Look! You revealed ${fallbackName}! ${fallbackName}!`;
  if (relPath) {
    playRelativeAudioClip(relPath, fallback, true);
  } else {
    speakWithSynthesis(fallback, true);
  }
}

export function playThemeCharacterWord(
  pairId: string,
  fallbackName: string,
  enabled = true,
): void {
  if (!enabled) return;
  const spec = THEME_CHARACTER_AUDIO_BY_PAIR_ID.get(pairId);
  const relPath = getThemeCharacterWordPath(pairId);
  const fallback = spec?.speechName ?? fallbackName;
  if (relPath) {
    playRelativeAudioClip(relPath, fallback, true);
  } else {
    speakWithSynthesis(fallback, true);
  }
}

export interface PlayReadAlongOptions extends ResolveReadAlongOptions {
  spokenText?: string;
  enabled?: boolean;
}

export function playReadAlongText(
  text: string,
  opts?: PlayReadAlongOptions,
): void {
  const enabled = opts?.enabled ?? true;
  if (!enabled) return;

  const fallback = opts?.spokenText?.trim() || text.trim();
  const relPath = resolveReadAlongAudioPath(text, opts);
  if (relPath) {
    playRelativeAudioClip(relPath, fallback, true);
  } else if (fallback) {
    speakWithSynthesis(fallback, true);
  }
}

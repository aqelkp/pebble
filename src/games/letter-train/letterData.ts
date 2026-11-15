import {
  CANONICAL_LETTERS,
  CANONICAL_WORDS,
  type LetterId as CanonicalLetterId,
  type LetterWordArtId,
} from '../../data/wordBank';

export type LetterId = CanonicalLetterId;

export type WordArtId = LetterWordArtId;

export interface LetterWordSpec {
  id: WordArtId;
  word: string;
  letter: LetterId;
  tintBg: string;
}

export interface LetterStationSpec {
  letter: LetterId;
  phonicsHint: string;
  accentColor: string;
  words: readonly LetterWordSpec[];
}

export const ALL_LETTERS: readonly LetterId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const VOWEL_LETTERS: readonly LetterId[] = ['A', 'E', 'I', 'O', 'U'] as const;

const ACCENT_CYCLE = ['#5B5BD6', '#3BA99C', '#F27A5E', '#E09F2D'] as const;
const TINT_CYCLE = ['#FDECE7', '#E4F6F3', '#ECEBFF', '#FEF5E1'] as const;

function makeStation(
  idx: number,
  letter: LetterId,
  phonicsHint: string,
  items: readonly (readonly [WordArtId, string])[],
): LetterStationSpec {
  return {
    letter,
    phonicsHint,
    accentColor: ACCENT_CYCLE[idx % ACCENT_CYCLE.length],
    words: items.map(([id, word], itemIdx) => ({
      id,
      word,
      letter,
      tintBg: TINT_CYCLE[(idx + itemIdx) % TINT_CYCLE.length],
    })),
  };
}

export const LETTER_STATIONS: readonly LetterStationSpec[] = CANONICAL_LETTERS.map(
  (letterMeta, idx) => {
    const items = CANONICAL_WORDS.filter(
      (entry) => entry.inLetterGames && entry.letter === letterMeta.letter,
    ).map((entry) => [entry.id as WordArtId, entry.word] as const);
    return makeStation(idx, letterMeta.letter, letterMeta.phonicsHint, items);
  },
);

const STATION_MAP: ReadonlyMap<LetterId, LetterStationSpec> = new Map(
  LETTER_STATIONS.map((s) => [s.letter, s]),
);

const ALL_WORDS: readonly LetterWordSpec[] = LETTER_STATIONS.flatMap((s) => s.words);

// Tracks which 3 target words were last dealt for a given letter so consecutive plays rotate words!
const lastSeenTargetIdsByLetter = new Map<LetterId, Set<WordArtId>>();

export function isValidLetterId(value: unknown): value is LetterId {
  return typeof value === 'string' && (ALL_LETTERS as readonly string[]).includes(value);
}

export function getStationSpec(letter: LetterId): LetterStationSpec {
  return STATION_MAP.get(letter) ?? LETTER_STATIONS[0];
}

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface PlatformCardItem {
  uid: string;
  spec: LetterWordSpec;
  isTarget: boolean;
}

/**
 * Builds a fresh 6-card station platform for `letter`:
 * - Randomly picks 3 target words from the letter's 6-word bank (preferring words
 *   not shown on the previous visit to this letter, mixed with random shuffle so
 *   every game opening feels fresh!).
 * - Randomly picks 3 distractors from 3 distinct other letters across the 150-word pool.
 */
export function buildPlatformCards(letter: LetterId): PlatformCardItem[] {
  const station = getStationSpec(letter);
  const lastSeen = lastSeenTargetIdsByLetter.get(letter);

  let chosenSpecs: LetterWordSpec[];
  if (lastSeen && lastSeen.size > 0 && station.words.length >= 6) {
    // Mix unseen words first + 1 random overlap chance so combinations vary naturally
    const unseen = shuffleArray(station.words.filter((w) => !lastSeen.has(w.id)));
    const seen = shuffleArray(station.words.filter((w) => lastSeen.has(w.id)));
    // Either 3 unseen or 2 unseen + 1 seen at random so all C(6,3)=20 combos occur!
    const takeUnseen = getRandomInt(2) === 0 ? 3 : 2;
    chosenSpecs = shuffleArray([
      ...unseen.slice(0, takeUnseen),
      ...seen.slice(0, 3 - takeUnseen),
    ]).slice(0, 3);
  } else {
    chosenSpecs = shuffleArray(station.words).slice(0, 3);
  }

  lastSeenTargetIdsByLetter.set(
    letter,
    new Set<WordArtId>(chosenSpecs.map((w) => w.id)),
  );

  const nonce = getRandomInt(1_000_000);
  const targets: PlatformCardItem[] = chosenSpecs.map((spec) => ({
    uid: `${letter}-ok-${spec.id}-${nonce}`,
    spec,
    isTarget: true,
  }));

  const otherPool = shuffleArray(ALL_WORDS.filter((w) => w.letter !== letter));
  const usedLetters = new Set<LetterId>([letter]);
  const distractors: PlatformCardItem[] = [];

  for (const candidate of otherPool) {
    if (distractors.length >= 3) break;
    if (usedLetters.has(candidate.letter)) continue;
    usedLetters.add(candidate.letter);
    distractors.push({
      uid: `${letter}-no-${candidate.id}-${nonce}`,
      spec: candidate,
      isTarget: false,
    });
  }

  return shuffleArray([...targets, ...distractors]);
}

/* =========================================================================
   A-Z Mastery & Perfect Crown Persistence (localStorage, strictly validated)
   ========================================================================= */

const MASTERY_STORAGE_KEY = 'pebble.letter-train.mastery.v1';
const PERFECT_STORAGE_KEY = 'pebble.letter-train.perfect.v1';

function loadValidatedLetterSet(storageKey: string): LetterId[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(storageKey);
    if (!raw || raw.length > 1024) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<LetterId>();
    for (const item of parsed.slice(0, 26)) {
      if (isValidLetterId(item)) {
        unique.add(item);
      }
    }
    return ALL_LETTERS.filter((l) => unique.has(l));
  } catch {
    return [];
  }
}

export function loadMasteredLetters(): LetterId[] {
  return loadValidatedLetterSet(MASTERY_STORAGE_KEY);
}

export function saveMasteredLetter(letter: LetterId): LetterId[] {
  const current = new Set<LetterId>(loadMasteredLetters());
  current.add(letter);
  const next = ALL_LETTERS.filter((l) => current.has(l));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function loadPerfectLetters(): LetterId[] {
  return loadValidatedLetterSet(PERFECT_STORAGE_KEY);
}

export function savePerfectLetter(letter: LetterId): LetterId[] {
  const current = new Set<LetterId>(loadPerfectLetters());
  current.add(letter);
  const next = ALL_LETTERS.filter((l) => current.has(l));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PERFECT_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

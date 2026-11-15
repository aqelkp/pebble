import { CANONICAL_WORDS } from '../../data/wordBank';

export type WordPackId = 'all' | 'animals' | 'home' | 'play' | 'nature';

export type WordRoundSizeId = '4' | '8' | '6' | '12';

export type WordHelperMode = 'sound-out' | 'letter-trace';

export type WordArtId =
  | 'cat'
  | 'dog'
  | 'pig'
  | 'fox'
  | 'owl'
  | 'bee'
  | 'hen'
  | 'cow'
  | 'cup'
  | 'hat'
  | 'bed'
  | 'box'
  | 'key'
  | 'pot'
  | 'jar'
  | 'pan'
  | 'bus'
  | 'car'
  | 'jet'
  | 'sub'
  | 'top'
  | 'bag'
  | 'van'
  | 'map'
  | 'sun'
  | 'log'
  | 'web'
  | 'pod'
  | 'bug'
  | 'gem'
  | 'sky'
  | 'sea';

export interface WordEntry {
  id: WordArtId;
  word: string;
  packId: Exclude<WordPackId, 'all'>;
  clue: string;
  phonics: string;
}

export interface WordPackSpec {
  id: WordPackId;
  title: string;
  subtitle: string;
  accentColor: string;
  previewIds: [WordArtId, WordArtId];
}

export interface WordRoundSizeSpec {
  id: WordRoundSizeId;
  label: string;
  description: string;
  wordsCount: number;
  isDefault?: boolean;
}

export interface WordHelperModeSpec {
  id: WordHelperMode;
  label: string;
  description: string;
  isDefault?: boolean;
}

export interface LetterTile {
  uid: string;
  letter: string;
}

export const DEFAULT_WORD_PACK_ID: WordPackId = 'all';
export const DEFAULT_WORD_ROUND_SIZE_ID: WordRoundSizeId = '8';
export const DEFAULT_WORD_HELPER_MODE: WordHelperMode = 'sound-out';

export const WORD_PACKS: readonly WordPackSpec[] = [
  {
    id: 'all',
    title: 'All Cozy Words',
    subtitle: '32 favorite words',
    accentColor: '#5B5BD6',
    previewIds: ['cat', 'sun'],
  },
  {
    id: 'animals',
    title: 'Animal Pals',
    subtitle: 'Friendly creatures',
    accentColor: '#F27A5E',
    previewIds: ['cat', 'fox'],
  },
  {
    id: 'home',
    title: 'Cozy Home',
    subtitle: 'Everyday treasures',
    accentColor: '#F2B84B',
    previewIds: ['cup', 'hat'],
  },
  {
    id: 'play',
    title: 'On the Go',
    subtitle: 'Wheels, wings & toys',
    accentColor: '#3BA99C',
    previewIds: ['bus', 'sub'],
  },
  {
    id: 'nature',
    title: 'Sunny Nature',
    subtitle: 'Outdoors & sky',
    accentColor: '#56A35B',
    previewIds: ['sun', 'bug'],
  },
];

export const WORD_ROUND_SIZES: readonly WordRoundSizeSpec[] = [
  {
    id: '8',
    label: '8 Words',
    description: 'Cozy round • Balanced play',
    wordsCount: 8,
    isDefault: true,
  },
  {
    id: '6',
    label: '6 Words',
    description: 'Quick round • Fast fun',
    wordsCount: 6,
  },
  {
    id: '12',
    label: '12 Words',
    description: 'Big adventure • Extra practice',
    wordsCount: 12,
  },
  {
    id: '4',
    label: '4 Words',
    description: 'Mini round • Quick taste',
    wordsCount: 4,
  },
];

export const WORD_HELPER_MODES: readonly WordHelperModeSpec[] = [
  {
    id: 'sound-out',
    label: 'Sound It Out',
    description: 'Ages 4–7 • Spell from picture & sound clues',
    isDefault: true,
  },
  {
    id: 'letter-trace',
    label: 'Letter Trace',
    description: 'Ages 3–4 • Match blocks onto guide letters',
  },
];

export const WORD_CATALOG: readonly WordEntry[] = CANONICAL_WORDS.flatMap((entry) => {
  if (!entry.wordFun) return [];
  return [
    {
      id: entry.id as WordArtId,
      word: entry.word.toUpperCase(),
      packId: entry.wordFun.packId,
      clue: entry.wordFun.clue,
      phonics: entry.wordFun.phonics,
    },
  ];
});

const DISTRACTOR_ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'T',
  'U',
  'W',
] as const;

function getRandomInt(maxExclusive: number): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function isValidWordPackId(value: unknown): value is WordPackId {
  return typeof value === 'string' && WORD_PACKS.some((p) => p.id === value);
}

export function isValidWordRoundSizeId(value: unknown): value is WordRoundSizeId {
  return typeof value === 'string' && WORD_ROUND_SIZES.some((s) => s.id === value);
}

export function isValidWordHelperMode(value: unknown): value is WordHelperMode {
  return typeof value === 'string' && WORD_HELPER_MODES.some((m) => m.id === value);
}

export function getWordPackSpec(packId: WordPackId): WordPackSpec {
  return WORD_PACKS.find((p) => p.id === packId) ?? WORD_PACKS[0];
}

export function getWordRoundSizeSpec(sizeId: WordRoundSizeId): WordRoundSizeSpec {
  return WORD_ROUND_SIZES.find((s) => s.id === sizeId) ?? WORD_ROUND_SIZES[0];
}

export function getWordEntryById(wordId: string): WordEntry | undefined {
  return WORD_CATALOG.find((entry) => entry.id === wordId);
}

export function buildWordRoundDeck(
  packId: WordPackId,
  roundSizeId: WordRoundSizeId,
): WordEntry[] {
  const size = getWordRoundSizeSpec(roundSizeId);
  if (packId === 'all') {
    return shuffleList(WORD_CATALOG).slice(0, size.wordsCount);
  }

  const primaryPool = shuffleList(WORD_CATALOG.filter((w) => w.packId === packId));
  if (primaryPool.length >= size.wordsCount) {
    return primaryPool.slice(0, size.wordsCount);
  }

  const bonusPool = shuffleList(WORD_CATALOG.filter((w) => w.packId !== packId));
  return [...primaryPool, ...bonusPool.slice(0, size.wordsCount - primaryPool.length)];
}

export function buildLetterTiles(word: string, roundIndex: number): LetterTile[] {
  const normalized = word.toUpperCase();
  const usedLetters = new Set(normalized.split(''));

  const requiredTiles: LetterTile[] = normalized.split('').map((letter, idx) => ({
    uid: `w${roundIndex}-req-${idx}-${letter}`,
    letter,
  }));

  const availableDistractors = DISTRACTOR_ALPHABET.filter((ch) => !usedLetters.has(ch));
  const chosenDistractors = shuffleList(availableDistractors).slice(0, 3);

  const distractorTiles: LetterTile[] = chosenDistractors.map((letter, idx) => ({
    uid: `w${roundIndex}-dis-${idx}-${letter}`,
    letter,
  }));

  return shuffleList([...requiredTiles, ...distractorTiles]);
}

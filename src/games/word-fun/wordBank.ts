export type WordPackId = 'all' | 'animals' | 'home' | 'play' | 'nature';

export type WordRoundSizeId = '8' | '6' | '12';

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

export const WORD_CATALOG: readonly WordEntry[] = [
  // Animal Pals (8)
  { id: 'cat', word: 'CAT', packId: 'animals', clue: 'Purring cozy kitten', phonics: 'C · A · T' },
  { id: 'dog', word: 'DOG', packId: 'animals', clue: 'Friendly wagging puppy', phonics: 'D · O · G' },
  { id: 'pig', word: 'PIG', packId: 'animals', clue: 'Rosy farmyard friend', phonics: 'P · I · G' },
  { id: 'fox', word: 'FOX', packId: 'animals', clue: 'Fluffy woodland explorer', phonics: 'F · O · X' },
  { id: 'owl', word: 'OWL', packId: 'animals', clue: 'Wise night-sky bird', phonics: 'O · W · L' },
  { id: 'bee', word: 'BEE', packId: 'animals', clue: 'Buzzing garden helper', phonics: 'B · E · E' },
  { id: 'hen', word: 'HEN', packId: 'animals', clue: 'Clucking barnyard bird', phonics: 'H · E · N' },
  { id: 'cow', word: 'COW', packId: 'animals', clue: 'Gentle meadow grazer', phonics: 'C · O · W' },

  // Cozy Home (8)
  { id: 'cup', word: 'CUP', packId: 'home', clue: 'Warm cocoa mug', phonics: 'C · U · P' },
  { id: 'hat', word: 'HAT', packId: 'home', clue: 'Cozy pom-pom beanie', phonics: 'H · A · T' },
  { id: 'bed', word: 'BED', packId: 'home', clue: 'Soft pillow & quilt', phonics: 'B · E · D' },
  { id: 'box', word: 'BOX', packId: 'home', clue: 'Ribbon-tied surprise', phonics: 'B · O · X' },
  { id: 'key', word: 'KEY', packId: 'home', clue: 'Golden treasure opener', phonics: 'K · E · Y' },
  { id: 'pot', word: 'POT', packId: 'home', clue: 'Warm soup kettle', phonics: 'P · O · T' },
  { id: 'jar', word: 'JAR', packId: 'home', clue: 'Sweet berry jam keeper', phonics: 'J · A · R' },
  { id: 'pan', word: 'PAN', packId: 'home', clue: 'Sunny breakfast skillet', phonics: 'P · A · N' },

  // On the Go (8)
  { id: 'bus', word: 'BUS', packId: 'play', clue: 'Sunny yellow ride', phonics: 'B · U · S' },
  { id: 'car', word: 'CAR', packId: 'play', clue: 'Beep-beep family coupe', phonics: 'C · A · R' },
  { id: 'jet', word: 'JET', packId: 'play', clue: 'Zooming cloud airplane', phonics: 'J · E · T' },
  { id: 'sub', word: 'SUB', packId: 'play', clue: 'Deep-sea yellow explorer', phonics: 'S · U · B' },
  { id: 'top', word: 'TOP', packId: 'play', clue: 'Whirling wooden toy', phonics: 'T · O · P' },
  { id: 'bag', word: 'BAG', packId: 'play', clue: 'Handy adventure backpack', phonics: 'B · A · G' },
  { id: 'van', word: 'VAN', packId: 'play', clue: 'Camper road-trip cruiser', phonics: 'V · A · N' },
  { id: 'map', word: 'MAP', packId: 'play', clue: 'Winding trail guide', phonics: 'M · A · P' },

  // Sunny Nature (8)
  { id: 'sun', word: 'SUN', packId: 'nature', clue: 'Bright morning warmth', phonics: 'S · U · N' },
  { id: 'log', word: 'LOG', packId: 'nature', clue: 'Mossy woodland timber', phonics: 'L · O · G' },
  { id: 'web', word: 'WEB', packId: 'nature', clue: 'Silky morning threads', phonics: 'W · E · B' },
  { id: 'pod', word: 'POD', packId: 'nature', clue: 'Three sweet green peas', phonics: 'P · O · D' },
  { id: 'bug', word: 'BUG', packId: 'nature', clue: 'Spotted red ladybug', phonics: 'B · U · G' },
  { id: 'gem', word: 'GEM', packId: 'nature', clue: 'Shining crystal stone', phonics: 'G · E · M' },
  { id: 'sky', word: 'SKY', packId: 'nature', clue: 'Fluffy clouds & rainbow', phonics: 'S · K · Y' },
  { id: 'sea', word: 'SEA', packId: 'nature', clue: 'Gentle ocean waves', phonics: 'S · E · A' },
];

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

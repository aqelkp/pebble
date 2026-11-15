import rawCatalog from './wordCatalog.json';

export type LetterId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export type CanonicalWordPackId = 'animals' | 'home' | 'play' | 'nature';

export type LetterWordArtId =
  // A (6)
  | 'apple' | 'ant' | 'airplane' | 'alligator' | 'anchor' | 'acorn'
  // B (6)
  | 'ball' | 'bus' | 'bee' | 'banana' | 'boat' | 'bear'
  // C (6)
  | 'cat' | 'cake' | 'car' | 'carrot' | 'cow' | 'cup'
  // D (6)
  | 'dog' | 'duck' | 'drum' | 'donut' | 'door' | 'dolphin'
  // E (6)
  | 'egg' | 'elephant' | 'envelope' | 'engine' | 'eagle' | 'earth'
  // F (6)
  | 'fish' | 'frog' | 'flower' | 'firetruck' | 'fox' | 'feather'
  // G (6)
  | 'grapes' | 'gift' | 'guitar' | 'giraffe' | 'goat' | 'glasses'
  // H (6)
  | 'hat' | 'house' | 'heart' | 'horse' | 'helicopter' | 'hammer'
  // I (6)
  | 'igloo' | 'ice-cream' | 'island' | 'iguana' | 'insect' | 'iron'
  // J (6)
  | 'jam' | 'jellyfish' | 'jet' | 'juice' | 'jacket' | 'jigsaw'
  // K (6)
  | 'kite' | 'key' | 'king' | 'koala' | 'kettle' | 'kangaroo'
  // L (6)
  | 'lion' | 'leaf' | 'lamp' | 'lemon' | 'ladybug' | 'ladder'
  // M (6)
  | 'moon' | 'milk' | 'mushroom' | 'monkey' | 'mango' | 'magnet'
  // N (6)
  | 'nest' | 'nut' | 'net' | 'noodles' | 'notebook' | 'necklace'
  // O (6)
  | 'octopus' | 'orange' | 'owl' | 'onion' | 'otter' | 'ostrich'
  // P (6)
  | 'pig' | 'pizza' | 'pencil' | 'penguin' | 'pear' | 'pumpkin'
  // Q (6)
  | 'queen' | 'quilt' | 'quail' | 'quarter' | 'question' | 'quill'
  // R (6)
  | 'rocket' | 'robot' | 'rainbow' | 'rabbit' | 'ring' | 'rose'
  // S (6)
  | 'sun' | 'snowman' | 'snail' | 'strawberry' | 'sock' | 'submarine'
  // T (6)
  | 'tree' | 'turtle' | 'tent' | 'tiger' | 'tomato' | 'truck'
  // U (6)
  | 'umbrella' | 'unicorn' | 'ukulele' | 'up-arrow' | 'urchin' | 'unicycle'
  // V (6)
  | 'van' | 'volcano' | 'violin' | 'vase' | 'vest' | 'vacuum'
  // W (6)
  | 'whale' | 'watermelon' | 'watch' | 'wagon' | 'waffle' | 'worm'
  // X (6)
  | 'xylophone' | 'x-ray' | 'x-ray-fish' | 'x-ray-dino' | 'x-ray-hand' | 'x-mark'
  // Y (6)
  | 'yo-yo' | 'yacht' | 'yarn' | 'yogurt' | 'yak' | 'yolk'
  // Z (6)
  | 'zebra' | 'zipper' | 'zoo' | 'zero' | 'zigzag' | 'zucchini';

export type WordFunOnlyId =
  | 'hen' | 'bed' | 'box' | 'pot' | 'jar' | 'pan' | 'sub' | 'top'
  | 'bag' | 'map' | 'log' | 'web' | 'pod' | 'bug' | 'gem' | 'sky' | 'sea';

export type CanonicalWordId = LetterWordArtId | WordFunOnlyId;

export interface CanonicalLetterEntry {
  letter: LetterId;
  phonicsHint: string;
}

export interface CanonicalWordFunMeta {
  packId: CanonicalWordPackId;
  clue: string;
  phonics: string;
}

export interface CanonicalWordEntry {
  id: CanonicalWordId;
  word: string;
  letter: LetterId;
  inLetterGames: boolean;
  wordFun?: CanonicalWordFunMeta;
  speechText?: string;
}

export const CANONICAL_LETTERS: readonly CanonicalLetterEntry[] =
  rawCatalog.letters as readonly CanonicalLetterEntry[];

export const CANONICAL_WORDS: readonly CanonicalWordEntry[] =
  rawCatalog.words as readonly CanonicalWordEntry[];

const WORD_MAP = new Map<string, CanonicalWordEntry>(
  CANONICAL_WORDS.map((entry) => [entry.id, entry]),
);

const LETTER_MAP = new Map<LetterId, CanonicalLetterEntry>(
  CANONICAL_LETTERS.map((entry) => [entry.letter, entry]),
);

export function getCanonicalWord(id: string): CanonicalWordEntry | undefined {
  return WORD_MAP.get(id);
}

export function getCanonicalLetter(letter: LetterId): CanonicalLetterEntry | undefined {
  return LETTER_MAP.get(letter);
}

export function getWordAudioPath(wordId: string): string {
  return `audio/words/${wordId}.mp3`;
}

export function getLetterAudioPath(letter: LetterId): string {
  return `audio/letters/${letter.toLowerCase()}.mp3`;
}

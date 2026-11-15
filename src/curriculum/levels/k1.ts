import { CANONICAL_WORDS, type CanonicalWordId, type LetterId } from '../../data/wordBank';
import type { CurriculumBenchmarkSpec, WordCategory } from '../curriculumTypes';

const ALL_K1_LETTERS: readonly LetterId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

/**
 * Opinionated 130 Core K1 Picture-Sound Words (5 high-frequency everyday words per letter A–Z)
 * drawn from Pebble's canonical illustrated word bank.
 */
export const K1_CORE_WORD_IDS: readonly CanonicalWordId[] = [
  // A
  'apple', 'ant', 'airplane', 'alligator', 'acorn',
  // B
  'ball', 'bus', 'bee', 'banana', 'bear',
  // C
  'cat', 'cake', 'car', 'cow', 'cup',
  // D
  'dog', 'duck', 'drum', 'donut', 'door',
  // E
  'egg', 'elephant', 'engine', 'eagle', 'earth',
  // F
  'fish', 'frog', 'flower', 'fox', 'firetruck',
  // G
  'grapes', 'gift', 'giraffe', 'goat', 'glasses',
  // H
  'hat', 'house', 'heart', 'horse', 'hammer',
  // I
  'igloo', 'ice-cream', 'island', 'insect', 'iron',
  // J
  'jam', 'jet', 'juice', 'jacket', 'jellyfish',
  // K
  'kite', 'key', 'king', 'koala', 'kangaroo',
  // L
  'lion', 'leaf', 'lamp', 'lemon', 'ladybug',
  // M
  'moon', 'milk', 'monkey', 'mango', 'mushroom',
  // N
  'nest', 'nut', 'net', 'noodles', 'notebook',
  // O
  'octopus', 'orange', 'owl', 'onion', 'ostrich',
  // P
  'pig', 'pizza', 'pencil', 'penguin', 'pear',
  // Q
  'queen', 'quilt', 'quail', 'question', 'quarter',
  // R
  'rocket', 'robot', 'rainbow', 'rabbit', 'ring',
  // S
  'sun', 'snail', 'strawberry', 'sock', 'snowman',
  // T
  'tree', 'turtle', 'tent', 'tiger', 'tomato',
  // U
  'umbrella', 'unicorn', 'ukulele', 'up-arrow', 'unicycle',
  // V
  'van', 'volcano', 'violin', 'vase', 'vest',
  // W
  'whale', 'watermelon', 'watch', 'wagon', 'worm',
  // X
  'xylophone', 'x-ray', 'x-ray-fish', 'x-ray-hand', 'x-mark',
  // Y
  'yo-yo', 'yacht', 'yarn', 'yogurt', 'yak',
  // Z
  'zebra', 'zipper', 'zoo', 'zero', 'zigzag',
];

export const K1_CVC_WORD_IDS: readonly CanonicalWordId[] = CANONICAL_WORDS.filter(
  (w) => Boolean(w.wordFun),
).map((w) => w.id);

export const K1_BENCHMARK: CurriculumBenchmarkSpec = {
  classLevel: 'k1',
  title: 'K1 / Lower Kindergarten',
  ageRange: 'Ages 3.5 – 4.5',
  description:
    'Foundational letter-sound recognition (A–Z), 130 everyday picture words, early 3-letter CVC word building, counting 1–10, and pattern logic.',
  domains: [
    {
      id: 'literacy',
      title: 'Language & Literacy',
      subtitle: 'A–Z phonics, 130 core K1 words, stroke-order writing & 3-letter CVC spelling',
      accentColor: '#5B5BD6',
      targetSkills: ['initial_letter_sound', 'picture_recognition', 'word_spelling', 'letter_formation'],
    },
    {
      id: 'numeracy',
      title: 'Math & Numeracy',
      subtitle: 'One-to-one counting (1–10) & joining small groups',
      accentColor: '#3BA99C',
      targetSkills: ['quantity_counting', 'group_joining'],
    },
    {
      id: 'cognition',
      title: 'Logic & Visual Memory',
      subtitle: 'Row-column pattern deduction & visual working memory',
      accentColor: '#F27A5E',
      targetSkills: ['grid_deduction', 'visual_recall'],
    },
    {
      id: 'self-regulation',
      title: 'Focus & Careful Thinking',
      subtitle: 'Mistake-free rounds & slowing down before answering',
      accentColor: '#E09F2D',
      targetSkills: [
        'initial_letter_sound',
        'word_spelling',
        'letter_formation',
        'quantity_counting',
        'grid_deduction',
      ],
    },
  ],
  targetLetters: ALL_K1_LETTERS,
  coreWordIds: K1_CORE_WORD_IDS,
  cvcWordIds: K1_CVC_WORD_IDS,
  targetNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  masteryThresholdPct: 85,
  minExposuresForMastery: 3,
};

const CATEGORY_OVERRIDES: Partial<Record<CanonicalWordId, WordCategory>> = {
  // Animals
  ant: 'animals', alligator: 'animals', bee: 'animals', bear: 'animals', cat: 'animals',
  cow: 'animals', dog: 'animals', duck: 'animals', dolphin: 'animals', elephant: 'animals',
  eagle: 'animals', fish: 'animals', frog: 'animals', fox: 'animals', giraffe: 'animals',
  goat: 'animals', horse: 'animals', hen: 'animals', iguana: 'animals', insect: 'animals',
  jellyfish: 'animals', koala: 'animals', kangaroo: 'animals', lion: 'animals', ladybug: 'animals',
  monkey: 'animals', octopus: 'animals', owl: 'animals', otter: 'animals', ostrich: 'animals',
  pig: 'animals', penguin: 'animals', quail: 'animals', rabbit: 'animals', snail: 'animals',
  turtle: 'animals', tiger: 'animals', urchin: 'animals', whale: 'animals', worm: 'animals',
  yak: 'animals', zebra: 'animals', bug: 'animals', 'x-ray-fish': 'animals', 'x-ray-dino': 'animals',

  // Food
  apple: 'food', banana: 'food', cake: 'food', carrot: 'food', donut: 'food',
  egg: 'food', grapes: 'food', 'ice-cream': 'food', jam: 'food', juice: 'food',
  lemon: 'food', milk: 'food', mushroom: 'food', mango: 'food', nut: 'food',
  noodles: 'food', orange: 'food', onion: 'food', pizza: 'food', pear: 'food',
  pumpkin: 'food', strawberry: 'food', tomato: 'food', watermelon: 'food', waffle: 'food',
  yogurt: 'food', yolk: 'food', zucchini: 'food',

  // Nature
  acorn: 'nature', earth: 'nature', flower: 'nature', island: 'nature', leaf: 'nature',
  moon: 'nature', nest: 'nature', rainbow: 'nature', rose: 'nature', sun: 'nature',
  snowman: 'nature', tree: 'nature', volcano: 'nature', log: 'nature', web: 'nature',
  pod: 'nature', sky: 'nature', sea: 'nature',

  // Vehicles
  airplane: 'vehicles', anchor: 'vehicles', ball: 'vehicles', bus: 'vehicles', boat: 'vehicles',
  car: 'vehicles', engine: 'vehicles', firetruck: 'vehicles', helicopter: 'vehicles', jet: 'vehicles',
  rocket: 'vehicles', submarine: 'vehicles', sub: 'vehicles', truck: 'vehicles', unicycle: 'vehicles',
  van: 'vehicles', wagon: 'vehicles', yacht: 'vehicles',

  // Concepts / Music / People
  drum: 'concepts', guitar: 'concepts', heart: 'concepts', king: 'concepts', queen: 'concepts',
  question: 'concepts', quarter: 'concepts', robot: 'concepts', unicorn: 'concepts',
  ukulele: 'concepts', 'up-arrow': 'concepts', violin: 'concepts', 'x-ray': 'concepts',
  'x-ray-hand': 'concepts', 'x-mark': 'concepts', zero: 'concepts', zigzag: 'concepts', zoo: 'concepts',
};

export function getWordCategory(wordId: CanonicalWordId): WordCategory {
  return CATEGORY_OVERRIDES[wordId] ?? 'home';
}

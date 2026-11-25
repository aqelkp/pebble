import type { ReadAlongWordTiming } from '../../components/SynchronizedReadAlong';

/**
 * Complexity tiers supported by the platformized Pebble Story Time engine.
 * New tiers (K1 4-letter, K2 blends, Grade 1 sentences) plug in cleanly as data.
 */
export type StoryComplexityTier =
  | 'k1-3letter'
  | 'k1-4letter'
  | 'k2-blends'
  | 'grade1-sentences';

export const STORY_COMPLEXITY_META: Record<
  StoryComplexityTier,
  { label: string; shortBadge: string; description: string }
> = {
  'k1-3letter': {
    label: 'K1 • 3-Letter Stories',
    shortBadge: 'Max 3-Letter Words',
    description: 'Cozy picture stories built strictly with 1, 2, and 3-letter words.',
  },
  'k1-4letter': {
    label: 'K1+ • 4-Letter Stories',
    shortBadge: 'Up to 4-Letter Words',
    description: 'Short early-reader stories introducing friendly 4-letter words.',
  },
  'k2-blends': {
    label: 'K2 • Blends & Digraphs',
    shortBadge: 'Blends & Digraphs',
    description: 'Playful stories featuring ch, sh, th, and consonant blends.',
  },
  'grade1-sentences': {
    label: 'Grade 1 • Early Readers',
    shortBadge: 'Early Sentences',
    description: 'Longer multi-sentence storybook adventures.',
  },
};

export type StoryBookId =
  | 'sam-and-the-mud'
  | 'kit-and-the-bug'
  | 'max-on-the-bus'
  | 'gus-and-the-jam'
  | 'zoe-and-the-bee'
  | 'bob-in-the-tub';

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePath: string;
  audioPath: string;
  durationMs: number;
  words: readonly ReadAlongWordTiming[];
}

export interface StoryBook {
  id: StoryBookId;
  title: string;
  subtitle: string;
  complexityTier: StoryComplexityTier;
  maxWordLength?: number;
  accentColor: string;
  coverImagePath: string;
  badgeText: string;
  pages: readonly StoryPage[];
}

export interface StoryTimeConfig {
  storyId: StoryBookId;
  autoPlayNarration: boolean;
}

export const STORY_BOOK_IDS: readonly StoryBookId[] = [
  'sam-and-the-mud',
  'kit-and-the-bug',
  'max-on-the-bus',
  'gus-and-the-jam',
  'zoe-and-the-bee',
  'bob-in-the-tub',
];

const STORY_BOOK_ID_SET = new Set<string>(STORY_BOOK_IDS);

export function isValidStoryBookId(value: unknown): value is StoryBookId {
  return typeof value === 'string' && STORY_BOOK_ID_SET.has(value);
}

export function isValidStoryTimeConfig(value: unknown): value is StoryTimeConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<StoryTimeConfig>;
  return isValidStoryBookId(c.storyId) && typeof c.autoPlayNarration === 'boolean';
}

export function getDefaultStoryTimeConfig(): StoryTimeConfig {
  return {
    storyId: 'sam-and-the-mud',
    autoPlayNarration: true,
  };
}

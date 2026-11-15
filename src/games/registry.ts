import type { CurriculumDomainId, SkillType } from '../curriculum/curriculumTypes';

export type GameId =
  | 'memory-match'
  | 'letter-train'
  | 'letter-river'
  | 'picture-sudoku'
  | 'number-safari'
  | 'word-fun'
  | 'rescue-road'
  | 'sticker-jigsaw';

export type ActivityRole = 'learning' | 'reward';

export interface GameLearningIntent {
  summary: string;
  domains: readonly CurriculumDomainId[];
  targetSkills: readonly SkillType[];
  conceptUnitLabel: string;
}

export interface GameRegistryEntry {
  id: GameId;
  title: string;
  description: string;
  badgeText: string;
  ageHint: string;
  artPath: string;
  status: 'available' | 'coming-soon';
  featured?: boolean;
  activityRole: ActivityRole;
  learningIntent: GameLearningIntent;
}

export const GAME_REGISTRY: readonly GameRegistryEntry[] = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    description:
      'Flip tall illustrated cards across 10 themes—stories, cars, sports, fruits, vegetables, and car logos—to earn points and celebrate the winner.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/memory-match.png',
    status: 'available',
    featured: true,
    activityRole: 'reward',
    learningIntent: {
      summary:
        'Calm, joyful family reward play that strengthens visual working memory, turn-taking, and category recognition.',
      domains: ['cognition', 'self-regulation'],
      targetSkills: ['visual_recall'],
      conceptUnitLabel: 'Board & Theme Memory',
    },
  },
  {
    id: 'letter-train',
    title: 'Letter Train',
    description:
      'Load 3 matching picture words from a rotating 156-word A–Z bank—pick all 3 with zero mistakes to unlock a Golden Crown and cheering applause!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • A–Z Phonics',
    artPath: 'hub/letter-train.png',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds initial letter-sound (phoneme) discrimination and picture-word vocabulary across all 26 A–Z letters without color-matching shortcuts.',
      domains: ['literacy', 'self-regulation'],
      targetSkills: ['initial_letter_sound', 'picture_recognition'],
      conceptUnitLabel: 'Letters A–Z & Picture Words',
    },
  },
  {
    id: 'letter-river',
    title: 'Letter River',
    description:
      'Scoop swimming picture fish into 3 matching letter buckets on the dock—fill 3 catches to pop a bucket with a splash and welcome the next letter!',
    badgeText: 'New Game',
    ageHint: 'Ages 4–7 • Phonics Sorting',
    artPath: 'hub/letter-river.png',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Tests active starting-sound categorization across 3 competing letter buckets simultaneously, strengthening rapid sound-to-letter recall.',
      domains: ['literacy', 'self-regulation'],
      targetSkills: ['initial_letter_sound', 'picture_recognition'],
      conceptUnitLabel: 'Letters A–Z & Sound Sorting',
    },
  },
  {
    id: 'picture-sudoku',
    title: 'Picture Sudoku',
    description:
      'Fill every row and column with matching theme pictures—drag the missing cards into place on 3×3, 4×4, or 5×5 puzzles.',
    badgeText: 'New Game',
    ageHint: 'Ages 4–8 • Logic & Patterns',
    artPath: 'hub/picture-sudoku.png',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Develops early deductive reasoning, row-column scanning, and impulse control (thinking before placing).',
      domains: ['cognition', 'numeracy', 'self-regulation'],
      targetSkills: ['grid_deduction'],
      conceptUnitLabel: 'Grid Logic (3×3, 4×4, 5×5)',
    },
  },
  {
    id: 'word-fun',
    title: 'Word Fun',
    description:
      'Spell cozy three-letter first words with storybook picture clues and tactile wooden letter blocks.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/word-fun.png',
    status: 'available',
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Bridges picture recognition to active 3-letter CVC spelling and sound blending across short-vowel families.',
      domains: ['literacy', 'self-regulation'],
      targetSkills: ['word_spelling', 'picture_recognition'],
      conceptUnitLabel: '3-Letter CVC Words',
    },
  },
  {
    id: 'number-safari',
    title: 'Number Safari',
    description:
      'Tap friendly savanna animals to count 1–10 or join groups together with tactile number blocks.',
    badgeText: 'Ready to Play',
    ageHint: 'Ages 3–7 • 1–4 Players',
    artPath: 'hub/number-safari.png',
    status: 'available',
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds one-to-one counting (1–10), numeral-to-quantity matching, and concrete group-joining addition.',
      domains: ['numeracy', 'self-regulation'],
      targetSkills: ['quantity_counting', 'group_joining'],
      conceptUnitLabel: 'Numbers 1–10 & Joining',
    },
  },
  {
    id: 'rescue-road',
    title: 'Rescue Road',
    description:
      'Snap curved and straight road tiles into empty spots to connect the garage to the finish flag and send the rescue truck driving across!',
    badgeText: 'Fun Break',
    ageHint: 'Ages 3–6 • Spatial Paths',
    artPath: 'hub/rescue-road.png',
    status: 'available',
    featured: false,
    activityRole: 'reward',
    learningIntent: {
      summary:
        'Joyful Fun Break reward game that builds spatial path planning, directional curves, and road connectivity without pressure.',
      domains: ['cognition', 'self-regulation'],
      targetSkills: ['grid_deduction'],
      conceptUnitLabel: 'Spatial Path Building',
    },
  },
  {
    id: 'sticker-jigsaw',
    title: 'Sticker Jigsaw',
    description:
      'Drag and tap chunky illustrated pieces onto the silhouette board to snap together favorite character stickers from every Pebble theme!',
    badgeText: 'Fun Break',
    ageHint: 'Ages 3–6 • Sticker Puzzles',
    artPath: 'hub/sticker-jigsaw.png',
    status: 'available',
    featured: false,
    activityRole: 'reward',
    learningIntent: {
      summary:
        'Calm Fun Break reward game strengthening visual part-to-whole matching, shape awareness, and fine motor placement.',
      domains: ['cognition', 'self-regulation'],
      targetSkills: ['visual_recall'],
      conceptUnitLabel: 'Visual Jigsaw Matching',
    },
  },
];

export function getGameRegistryEntry(id: GameId): GameRegistryEntry {
  return GAME_REGISTRY.find((g) => g.id === id) ?? GAME_REGISTRY[0];
}

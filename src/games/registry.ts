import type { CurriculumDomainId, SkillType } from '../curriculum/curriculumTypes';

export type GameId =
  | 'memory-match'
  | 'letter-train'
  | 'letter-trace'
  | 'letter-river'
  | 'picture-sudoku'
  | 'number-safari'
  | 'word-fun'
  | 'rescue-road'
  | 'sticker-jigsaw'
  | 'sticker-scene'
  | 'spot-the-twin'
  | 'dot-to-dot'
  | 'word-peekaboo'
  | 'pipe-countdown';

export type HubShelfId =
  | 'letters-words'
  | 'numbers-logic'
  | 'draw-create'
  | 'fun-rewards';

export interface HubShelfSpec {
  id: HubShelfId;
  label: string;
}

export const HUB_SHELVES: readonly HubShelfSpec[] = [
  { id: 'letters-words', label: 'Letters & Words' },
  { id: 'numbers-logic', label: 'Numbers & Logic' },
  { id: 'draw-create', label: 'Draw & Color' },
  { id: 'fun-rewards', label: 'Fun & Rewards' },
];

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
  shelf: HubShelfId;
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
    shelf: 'fun-rewards',
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
    id: 'word-peekaboo',
    title: 'Word Peekaboo',
    description:
      'Hear one sight or phonics word at a time and peel away tiles to discover hidden Cars, PAW Patrol, and Disney friends!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • Sight & CVC Words',
    artPath: 'hub/word-peekaboo.png',
    shelf: 'letters-words',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds instant sight-word recognition and CVC word reading across 42 KLAY school workbook words without sentence clutter or guessing shortcuts.',
      domains: ['literacy', 'self-regulation'],
      targetSkills: ['sight_word_reading'],
      conceptUnitLabel: 'KLAY Sight & CVC Words',
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
    shelf: 'letters-words',
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
    id: 'letter-trace',
    title: 'Letter Trace',
    description:
      'Follow numbered circles and arrows to write Capital (A–Z) and Small (a–z) letters side-by-side in strict stroke order — only the active stroke unlocks!',
    badgeText: 'Handwriting',
    ageHint: 'Ages 3.5–7 • Stroke Order',
    artPath: 'hub/letter-trace.png',
    shelf: 'letters-words',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Enforces authentic top-to-bottom letter stroke sequence and direction for capitals and lowercase pairs side-by-side, preventing mirror reversals.',
      domains: ['literacy', 'self-regulation'],
      targetSkills: ['letter_formation', 'initial_letter_sound'],
      conceptUnitLabel: 'Capitals & Smalls (A–Z / a–z)',
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
    shelf: 'letters-words',
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
    shelf: 'numbers-logic',
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
    shelf: 'letters-words',
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
    id: 'pipe-countdown',
    title: 'Pipe Countdown',
    description:
      'Plug stepped garden aqueduct leaks with proportional numbered rods from biggest (9) down to shut-off cap 0 to spin the sunny fountain!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • Count 9 → 0',
    artPath: 'hub/pipe-countdown.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Makes backward counting (9 → 0) and the physical meaning of zero self-evident via proportional repair rods, descending marimba notes, and a K1 countdown strip.',
      domains: ['numeracy', 'self-regulation'],
      targetSkills: ['quantity_counting'],
      conceptUnitLabel: 'Backward Countdown 9 → 0',
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
    shelf: 'numbers-logic',
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
    shelf: 'fun-rewards',
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
    shelf: 'fun-rewards',
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
  {
    id: 'sticker-scene',
    title: 'Sticker Scene',
    description:
      'Peel and stick colorful characters onto matching storybook scene shadows across sunny meadows, parks, and camps!',
    badgeText: 'Fun Break',
    ageHint: 'Ages 3–6 • Shape Shadows',
    artPath: 'hub/sticker-scene.png',
    shelf: 'fun-rewards',
    status: 'available',
    featured: true,
    activityRole: 'reward',
    learningIntent: {
      summary:
        'Tactile Fun Break reward game strengthening figure-ground visual discrimination, shape silhouette matching, and fine motor drag-drop.',
      domains: ['cognition', 'self-regulation'],
      targetSkills: ['visual_recall'],
      conceptUnitLabel: 'Shadow & Shape Matching',
    },
  },
  {
    id: 'spot-the-twin',
    title: 'Spot the Twin',
    description:
      'Compare two playful picture cards and spot the ONE matching twin hiding on both cards — hear its word on every find!',
    badgeText: 'Fun Break',
    ageHint: 'Ages 3–7 • Visual Scanning',
    artPath: 'hub/spot-the-twin.png',
    shelf: 'fun-rewards',
    status: 'available',
    featured: true,
    activityRole: 'reward',
    learningIntent: {
      summary:
        'Joyful Fun Break focus game strengthening systematic visual scanning, picture comparison, and spoken word reinforcement.',
      domains: ['cognition', 'literacy', 'self-regulation'],
      targetSkills: ['picture_recognition', 'visual_recall'],
      conceptUnitLabel: 'Visual Twin Scanning',
    },
  },
  {
    id: 'dot-to-dot',
    title: 'Dot-to-Dot',
    description:
      'Connect numbered or lettered pebbles in order around each mystery shadow to watch full color bloom!',
    badgeText: '1–10 & A–J',
    ageHint: 'Ages 3–7 • Draw & Count',
    artPath: 'hub/dot-to-dot.png',
    shelf: 'draw-create',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Tactile sequential number counting (1–10) and alphabet ordering (A–J) with pencil-drag motor control and picture Color Bloom reveals.',
      domains: ['numeracy', 'literacy', 'self-regulation'],
      targetSkills: ['quantity_counting', 'letter_formation', 'picture_recognition'],
      conceptUnitLabel: 'Dot Sequence Reveal',
    },
  },
];

export const VALID_GAME_IDS: readonly GameId[] = GAME_REGISTRY.map((g) => g.id);
const VALID_GAME_ID_SET = new Set<string>(VALID_GAME_IDS);

export function isValidGameId(value: unknown): value is GameId {
  return typeof value === 'string' && VALID_GAME_ID_SET.has(value);
}

export function getGameRegistryEntry(id: GameId): GameRegistryEntry {
  return GAME_REGISTRY.find((g) => g.id === id) ?? GAME_REGISTRY[0];
}

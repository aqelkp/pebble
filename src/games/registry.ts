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
  | 'compare-quest'
  | 'word-trace'
  | 'mystery-express'
  | 'pebble-creek'
  | 'cloud-balloon'
  | 'treasure-keys'
  | 'circle-sort'
  | 'pipe-countdown'
  | 'rocket-sums'
  | 'splash-tank'
  | 'word-hunt';

export type HubShelfId =
  | 'letters-words'
  | 'numbers-logic'
  | 'world-discovery'
  | 'draw-create'
  | 'fun-rewards';

export interface HubShelfSpec {
  id: HubShelfId;
  label: string;
}

export const HUB_SHELVES: readonly HubShelfSpec[] = [
  { id: 'letters-words', label: 'Letters & Words' },
  { id: 'numbers-logic', label: 'Numbers & Logic' },
  { id: 'world-discovery', label: 'World & Discovery' },
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
    id: 'word-hunt',
    title: 'Word Hunt',
    description:
      'Scan a 5×5, 6×6, or 7×7 crossword-style letter grid and swipe or tap to highlight hidden CVC, sight, and everyday words!',
    badgeText: 'New Game',
    ageHint: 'Ages 4.5–7 • Letter Grid Words',
    artPath: 'hub/word-hunt.png',
    shelf: 'letters-words',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds visual word recognition, left-to-right and top-to-bottom orthographic scanning, and letter-by-letter spelling verification across randomized N×N letter grids.',
      domains: ['literacy', 'cognition', 'self-regulation'],
      targetSkills: ['sight_word_reading', 'word_spelling'],
      conceptUnitLabel: 'Crossword-Style Word Grids',
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
    id: 'word-trace',
    title: 'Word Trace',
    description:
      'Write CVC picture words, school sight words, and numbers left-to-right on 4-line notebook paper with sound waves and sticker stamps!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • 4-Line Words & Numbers',
    artPath: 'hub/word-trace.png',
    shelf: 'letters-words',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds left-to-right multi-letter handwriting fluency across CVC picture words, K1 school sight words (or, be, an, no, do, am), and numbers in both lowercase and uppercase.',
      domains: ['literacy', 'numeracy', 'self-regulation'],
      targetSkills: ['letter_formation', 'word_spelling'],
      conceptUnitLabel: 'CVC, Sight Words & Numbers',
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
    id: 'circle-sort',
    title: 'Circle & Sort',
    description:
      'Tap or draw a circle with your finger around all Carnivores, Fruits, Vegetables, Healthy Foods, and Sky Fliers on each K1 workbook page!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • EVS & Logic',
    artPath: 'hub/circle-sort.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds K1 / LKG General Awareness (EVS) conceptual grouping, category discrimination, and inhibitory control across animals, nutrition, harvest, and transport.',
      domains: ['general-awareness', 'cognition', 'literacy', 'self-regulation'],
      targetSkills: ['general_awareness', 'picture_recognition'],
      conceptUnitLabel: 'K1 EVS Categories',
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
    id: 'rocket-sums',
    title: 'Rocket Sums',
    description:
      'Build instant mental addition fluency (0–10 & 1-digit sums) with fruit groups or pure numbers—answer fast for Turbo Boosts to launch your rocket to the Moon!',
    badgeText: 'New Game',
    ageHint: 'K1 / K2 • Quick Addition',
    artPath: 'hub/rocket-sums.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds rapid 1-digit mental addition automaticity without finger counting, using calm 10-second check-ins, picture-to-number bridging, and class-level progression.',
      domains: ['numeracy', 'cognition', 'self-regulation'],
      targetSkills: ['group_joining', 'quantity_counting'],
      conceptUnitLabel: '1-Digit Mental Addition',
    },
  },
  {
    id: 'splash-tank',
    title: 'Splash Tank',
    description:
      'Pour the right capacity bucket into a graduated water pipe so it reaches the target flag without overflowing—spin the waterwheel on an exact fill!',
    badgeText: 'New Game',
    ageHint: 'K1 / K2 • Missing Addends',
    artPath: 'hub/splash-tank.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Builds missing-addend / delta addition intuition (start + ? = target) using a graduated 1–10 / 1–20 water tank, overflow zone awareness, and teach-first gap explanations.',
      domains: ['numeracy', 'cognition', 'self-regulation'],
      targetSkills: ['group_joining', 'quantity_counting'],
      conceptUnitLabel: 'Missing-Addend Addition',
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
    id: 'compare-quest',
    title: 'Compare Quest',
    description:
      'Compare countable baskets, sticks & towers, juice jugs, and workbook numbers (0–10) — tap, drag, or write >, =, or < in the center box!',
    badgeText: 'New Game',
    ageHint: 'K1 / LKG • >, < & = (0–10)',
    artPath: 'hub/compare-quest.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Connects concrete quantities (including 0), aligned lengths, liquid measures, and abstract numerals (0–10) to greater than (>), less than (<), and equal to (=).',
      domains: ['numeracy', 'cognition', 'self-regulation'],
      targetSkills: ['quantity_counting'],
      conceptUnitLabel: 'Comparing >, < & = (0–10)',
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
    id: 'mystery-express',
    title: 'Mystery Express',
    description:
      'Solve stopped railway gate puzzles — Numbers 0–50, Tens & Ones, Ordinals, Shapes, Reading Phrases, or World Discovery — to chug across 5 stations!',
    badgeText: 'K1 Quest',
    ageHint: 'K1 / LKG • Any K1 Topic',
    artPath: 'hub/mystery-express.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Narrative railway puzzle gates powered by the Universal K1 Quest Engine across numbers 0–50, place value, shapes, reading phrases, and general awareness.',
      domains: ['numeracy', 'cognition', 'literacy', 'general-awareness', 'self-regulation'],
      targetSkills: ['number_sense_50', 'shapes_premath', 'sequence_order', 'phrase_reading', 'general_awareness'],
      conceptUnitLabel: 'Numbers 0–50 & K1 Quests',
    },
  },
  {
    id: 'pebble-creek',
    title: 'Pebble Creek Bridge',
    description:
      'Splash smooth stepping stones into the stream by solving 2D & 3D shapes, ABAB patterns, volume beakers, bar graphs, or any K1 quest pack!',
    badgeText: 'K1 Quest',
    ageHint: 'K1 / LKG • Shapes & Pre-Math',
    artPath: 'hub/pebble-creek.png',
    shelf: 'numbers-logic',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'River stepping-stone adventure building 2D/3D shape recognition, repeating patterns, informal measurement, spatial directions, and bar graph reading.',
      domains: ['numeracy', 'cognition', 'general-awareness', 'self-regulation'],
      targetSkills: ['shapes_premath', 'sequence_order', 'number_sense_50', 'general_awareness'],
      conceptUnitLabel: 'Shapes, Patterns & Pre-Math',
    },
  },
  {
    id: 'cloud-balloon',
    title: 'Cloud Balloon Quest',
    description:
      'Float your hot-air balloon up to the stars by exploring 5 senses, community helpers, animal & plant lifecycles, transport, 3Rs, and the solar system!',
    badgeText: 'K1 Quest',
    ageHint: 'K1 / LKG • World & Science',
    artPath: 'hub/cloud-balloon.png',
    shelf: 'world-discovery',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Skyward balloon quest covering K1 General Awareness: 5 senses, healthy food, professions, butterfly/frog/plant lifecycles, 3Rs, and Sun/Moon/Planets.',
      domains: ['general-awareness', 'cognition', 'self-regulation'],
      targetSkills: ['general_awareness', 'sequence_order', 'picture_recognition'],
      conceptUnitLabel: 'General Awareness & Science',
    },
  },
  {
    id: 'treasure-keys',
    title: '5-Key Treasure Chest',
    description:
      'Read short sight-word + CVC phrases silently, blend middle & ending sounds, or mix any K1 quest pack to unlock all 5 golden keyholes!',
    badgeText: 'K1 Quest',
    ageHint: 'K1 / LKG • Phrases & Phonics',
    artPath: 'hub/treasure-keys.png',
    shelf: 'world-discovery',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Five-lock treasure chest adventure testing independent short phrase reading, CVC middle/ending sound discrimination, and rotating K1 quests.',
      domains: ['literacy', 'general-awareness', 'numeracy', 'self-regulation'],
      targetSkills: ['phrase_reading', 'sight_word_reading', 'word_spelling', 'general_awareness'],
      conceptUnitLabel: 'Short Phrases & K1 Discovery',
    },
  },
  {
    id: 'dot-to-dot',
    title: 'Dot-to-Dot',
    description:
      'Connect pebbles 1–20, count backward 10→0, or follow letters A–T around each mystery shadow to watch full color bloom!',
    badgeText: '1–20 & 10→0',
    ageHint: 'Ages 3–7 • Forward & Countdown',
    artPath: 'hub/dot-to-dot.png',
    shelf: 'draw-create',
    status: 'available',
    featured: true,
    activityRole: 'learning',
    learningIntent: {
      summary:
        'Tactile sequential number counting (1–20), backward countdown (10→0), and alphabet ordering with pencil-drag motor control.',
      domains: ['numeracy', 'literacy', 'self-regulation'],
      targetSkills: ['quantity_counting', 'sequence_order', 'letter_formation', 'picture_recognition'],
      conceptUnitLabel: 'Dot Sequence & Countdown',
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

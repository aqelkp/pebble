import type { SkillType } from '../curriculumTypes';
import type { LetterWordArtId } from '../../data/wordBank';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All saved Quest configurations and mastery records
// restored from sessionStorage / localStorage are treated as untrusted input and validated against
// strict allow-lists and integer bounds before rendering via React JSX.

export type AdventureSkinId =
  | 'mystery-express'
  | 'pebble-creek'
  | 'cloud-balloon'
  | 'treasure-keys';

export type QuestPackId =
  | 'smart-mix'
  | 'numbers-50'
  | 'place-value-lines'
  | 'shapes-patterns'
  | 'pre-math'
  | 'reading-phrases'
  | 'about-me-helpers'
  | 'animals-nature'
  | 'world-transport';

export type QuestRoundLength = 5 | 8;

export interface QuestGameConfig {
  packId: QuestPackId;
  roundLength: QuestRoundLength;
  rotateWorlds: boolean;
}

export const ALL_ADVENTURE_SKIN_IDS: readonly AdventureSkinId[] = [
  'mystery-express',
  'pebble-creek',
  'cloud-balloon',
  'treasure-keys',
];

export const ALL_QUEST_PACK_IDS: readonly QuestPackId[] = [
  'smart-mix',
  'numbers-50',
  'place-value-lines',
  'shapes-patterns',
  'pre-math',
  'reading-phrases',
  'about-me-helpers',
  'animals-nature',
  'world-transport',
];

export interface QuestPackSpec {
  id: QuestPackId;
  title: string;
  shortTitle: string;
  subtitle: string;
  syllabusBadge: string;
  accentColor: string;
  iconArtId: QuestIconId;
}

export type QuestIconId =
  // Shapes 2D
  | 'shape-circle'
  | 'shape-square'
  | 'shape-rectangle'
  | 'shape-triangle'
  // Shapes 3D
  | 'shape-sphere'
  | 'shape-cube'
  | 'shape-cone'
  | 'shape-cylinder'
  // Everyday shape objects
  | 'obj-clock'
  | 'obj-window'
  | 'obj-door'
  | 'obj-pizza-slice'
  | 'obj-basketball'
  | 'obj-dice'
  | 'obj-party-hat'
  | 'obj-soup-can'
  // Pre-Math comparisons & volumes
  | 'beaker-empty'
  | 'beaker-quarter'
  | 'beaker-half'
  | 'beaker-full'
  | 'cmp-heavy-rock'
  | 'cmp-light-feather'
  | 'cmp-tall-pine'
  | 'cmp-short-bush'
  | 'cmp-big-melon'
  | 'cmp-small-berry'
  // Directions
  | 'dir-left'
  | 'dir-right'
  | 'dir-up'
  | 'dir-down'
  // Times of day
  | 'time-morning'
  | 'time-afternoon'
  | 'time-evening'
  | 'time-night'
  // All About Me & 5 Senses & Habits
  | 'sense-eyes'
  | 'sense-ears'
  | 'sense-nose'
  | 'sense-tongue'
  | 'sense-hands'
  | 'body-knees'
  | 'body-feet'
  | 'body-shoulders'
  | 'stage-baby'
  | 'stage-child'
  | 'stage-adult'
  | 'stage-elder'
  | 'habit-brush-teeth'
  | 'habit-wash-hands'
  | 'habit-sleep-well'
  | 'habit-litter-no'
  | 'food-healthy-plate'
  | 'food-candy-soda'
  | 'food-fries'
  // Community Helpers / Professions
  | 'helper-doctor'
  | 'helper-firefighter'
  | 'helper-teacher'
  | 'helper-chef'
  | 'helper-farmer'
  | 'helper-pilot'
  | 'helper-postman'
  // Lifecycles (Butterfly, Frog, Plant) & Plant Parts/Types
  | 'life-butterfly-egg'
  | 'life-caterpillar'
  | 'life-chrysalis'
  | 'life-butterfly'
  | 'life-frog-spawn'
  | 'life-tadpole'
  | 'life-froglet'
  | 'life-frog'
  | 'life-seed'
  | 'life-sprout'
  | 'life-sapling'
  | 'life-fruit-tree'
  | 'plant-roots'
  | 'plant-stem'
  | 'plant-leaf'
  | 'plant-flower'
  | 'plant-shrub'
  | 'plant-climber'
  | 'plant-cotton-shirt'
  | 'plant-wooden-chair'
  // World, Tech, 3Rs & Sky
  | 'world-recycle-bin'
  | 'world-reuse-bag'
  | 'world-save-water'
  | 'world-planets'
  | 'tech-tablet'
  | 'tech-fridge'
  | 'tech-washer'
  // Short CVC + Sight-Word Phrase Scenes
  | 'scene-cat-on-mat'
  | 'scene-dog-in-box'
  | 'scene-bug-on-log'
  | 'scene-pig-in-mud'
  | 'scene-hen-in-pen'
  | 'scene-red-bus'
  | 'scene-fox-in-den'
  | 'scene-cup-on-bed'
  | 'scene-fish-in-net'
  | 'scene-frog-on-pad';

export type QuestArtSpec =
  | { kind: 'quest-icon'; id: QuestIconId }
  | { kind: 'word-art'; id: LetterWordArtId }
  | { kind: 'theme-img'; path: string }
  | { kind: 'numeral-badge'; value: number; accent?: string }
  | { kind: 'word-card'; text: string; highlightIndex?: number; accent?: string }
  | { kind: 'tens-ones-preview'; tens: number; ones: number }
  | { kind: 'pattern-strip'; tokens: readonly PatternTokenSpec[] }
  | { kind: 'number-train-gap'; items: readonly (number | '?')[] };

export interface PatternTokenSpec {
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  label?: string;
}

export interface QuestPromptBase {
  uid: string;
  packId: Exclude<QuestPackId, 'smart-mix'>;
  conceptId: string;
  conceptLabel: string;
  skillType: SkillType;
  promptText: string;
  promptSubtext?: string;
  promptBadge?: string;
  /** Bundled audio clip ID under audio/quest/<voiceClipId>.mp3 (plus fallback speech text) */
  voiceClipId: string;
  voiceFallbackText: string;
  /** When true (reading sight words / short phrases / number names), voice does NOT auto-play upfront */
  silentRead?: boolean;
  /** Optional bundled audio clip ID played after correct answer (especially rewarding in silentRead mode!) */
  solvedVoiceClipId?: string;
  /** Optional celebration speech played after correct answer (fallback for solvedVoiceClipId) */
  solvedVoiceText?: string;
}

export interface QuestChoiceOption {
  id: string;
  label?: string;
  sublabel?: string;
  largeText?: string;
  art?: QuestArtSpec;
  isCorrect: boolean;
  wrongExplanation: string;
}

export interface ChoiceQuestPrompt extends QuestPromptBase {
  kind: 'choice';
  promptArt?: QuestArtSpec;
  choices: readonly QuestChoiceOption[];
}

export interface SequenceStepItem {
  id: string;
  correctOrder: number; // 0..N-1
  label: string;
  art?: QuestArtSpec;
  largeBadge?: string;
}

export interface SequenceQuestPrompt extends QuestPromptBase {
  kind: 'sequence';
  steps: readonly SequenceStepItem[]; // shuffled display pool
  orderedSummary: string;
}

export interface SortBasketSpec {
  id: string;
  label: string;
  sublabel?: string;
  accentColor: string;
  art?: QuestArtSpec;
}

export interface SortCardItem {
  id: string;
  label: string;
  targetBasketId: string;
  art: QuestArtSpec;
  wrongExplanation: string;
}

export interface MiniSortQuestPrompt extends QuestPromptBase {
  kind: 'mini-sort';
  baskets: readonly SortBasketSpec[];
  items: readonly SortCardItem[];
}

export interface TensOnesQuestPrompt extends QuestPromptBase {
  kind: 'tens-ones';
  targetNumber: number;
  targetTens: number;
  targetOnes: number;
}

export interface NumberLineStripData {
  subkind: 'number-line';
  numbers: readonly number[];
  startNumber: number;
  delta: 1 | -1;
  targetNumber: number;
}

export interface OrdinalsStripData {
  subkind: 'ordinals';
  racers: readonly {
    position: number; // 1..N
    ordinalLabel: string; // 1st, 2nd...
    name: string;
    art: QuestArtSpec;
  }[];
  targetPosition: number;
  askMode: 'tap-racer' | 'pick-ordinal';
}

export interface BarGraphStripData {
  subkind: 'bar-graph';
  columns: readonly {
    id: string;
    label: string;
    count: number;
    color: string;
    art: QuestArtSpec;
  }[];
  maxScale: number;
}

export interface LengthMeasureStripData {
  subkind: 'length-measure';
  objectLabel: string;
  objectColor: string;
  unitBlocks: number;
  maxBlocks: number;
}

export type VisualStripData =
  | NumberLineStripData
  | OrdinalsStripData
  | BarGraphStripData
  | LengthMeasureStripData;

export interface VisualStripQuestPrompt extends QuestPromptBase {
  kind: 'visual-strip';
  strip: VisualStripData;
  choices: readonly QuestChoiceOption[];
}

export type QuestPrompt =
  | ChoiceQuestPrompt
  | SequenceQuestPrompt
  | MiniSortQuestPrompt
  | TensOnesQuestPrompt
  | VisualStripQuestPrompt;

export const QUEST_PACK_SPECS: readonly QuestPackSpec[] = [
  {
    id: 'smart-mix',
    title: 'Smart K1 Mix',
    shortTitle: 'K1 Mix',
    subtitle: 'Rotates numbers 0–50, shapes, reading phrases, lifecycles & world discovery!',
    syllabusBadge: 'Full K1 Mix',
    accentColor: '#5B5BD6',
    iconArtId: 'shape-sphere',
  },
  {
    id: 'numbers-50',
    title: 'Numbers 0 to 50',
    shortTitle: '0–50 Math',
    subtitle: 'Find 0–50, read number names zero–ten, before/after/between & backward counting.',
    syllabusBadge: 'Math • 0–50',
    accentColor: '#3BA99C',
    iconArtId: 'obj-clock',
  },
  {
    id: 'place-value-lines',
    title: 'Tens, Ones & Number Line',
    shortTitle: 'Tens & Line',
    subtitle: 'Build 10-bundles & ones pebbles, hop ±1 on the number line, and spot 1st–10th!',
    syllabusBadge: 'Place Value & 1st–10th',
    accentColor: '#2E8B7D',
    iconArtId: 'obj-dice',
  },
  {
    id: 'shapes-patterns',
    title: '2D & 3D Shapes + Patterns',
    shortTitle: 'Shapes',
    subtitle: 'Circle to cylinder, everyday shape objects, 2D vs 3D sorting & ABAB/ABC patterns.',
    syllabusBadge: 'Shapes & Logic',
    accentColor: '#F27A5E',
    iconArtId: 'shape-cone',
  },
  {
    id: 'pre-math',
    title: 'Comparisons, Time & Graphs',
    shortTitle: 'Pre-Math',
    subtitle: 'Empty/quarter/half/full, heavy/light, morning–night, left/right, length & bar graphs.',
    syllabusBadge: 'Pre-Math & Data',
    accentColor: '#E09F2D',
    iconArtId: 'beaker-half',
  },
  {
    id: 'reading-phrases',
    title: 'Short Phrases & CVC Sounds',
    shortTitle: 'Phrases',
    subtitle: 'Read sight-word + CVC phrases on your own and hear middle & ending sounds!',
    syllabusBadge: 'K1 Reading',
    accentColor: '#5B5BD6',
    iconArtId: 'scene-cat-on-mat',
  },
  {
    id: 'about-me-helpers',
    title: 'All About Me & Helpers',
    shortTitle: 'Me & Helpers',
    subtitle: 'Body parts, 5 senses, growth stages, healthy vs sometimes food & community helpers.',
    syllabusBadge: 'General Awareness',
    accentColor: '#F27A5E',
    iconArtId: 'helper-doctor',
  },
  {
    id: 'animals-nature',
    title: 'Animals, Lifecycles & Plants',
    shortTitle: 'Nature',
    subtitle: 'Butterfly, frog & plant lifecycles, habitats, birds/insects & parts of a plant.',
    syllabusBadge: 'Nature & Science',
    accentColor: '#3BA99C',
    iconArtId: 'life-butterfly',
  },
  {
    id: 'world-transport',
    title: 'Transport, Tech, 3Rs & Sky',
    shortTitle: 'World & Sky',
    subtitle: 'Land/water/air vehicles, helpful gadgets, Reduce-Reuse-Recycle & Sun, Moon & Planets.',
    syllabusBadge: 'Our World',
    accentColor: '#4A6FA5',
    iconArtId: 'world-planets',
  },
];

const PACK_ID_SET = new Set<string>(ALL_QUEST_PACK_IDS);

export function isValidQuestPackId(value: unknown): value is QuestPackId {
  return typeof value === 'string' && PACK_ID_SET.has(value);
}

export function getQuestPackSpec(packId: QuestPackId): QuestPackSpec {
  return QUEST_PACK_SPECS.find((p) => p.id === packId) ?? QUEST_PACK_SPECS[0];
}

export function getDefaultQuestConfigForSkin(skinId: AdventureSkinId): QuestGameConfig {
  const defaultPackBySkin: Record<AdventureSkinId, QuestPackId> = {
    'mystery-express': 'numbers-50',
    'pebble-creek': 'shapes-patterns',
    'cloud-balloon': 'animals-nature',
    'treasure-keys': 'reading-phrases',
  };
  return {
    packId: defaultPackBySkin[skinId],
    roundLength: 5,
    rotateWorlds: false,
  };
}

export function isValidQuestGameConfig(value: unknown): value is QuestGameConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    isValidQuestPackId(v.packId) &&
    (v.roundLength === 5 || v.roundLength === 8) &&
    typeof v.rotateWorlds === 'boolean'
  );
}

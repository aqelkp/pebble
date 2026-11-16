import type { LetterWordArtId } from '../../data/wordBank';
import { isValidLetterId, type LetterId } from '../letter-train/letterData';
import {
  FENCE_LINE_Y,
  GRASS_LINE_Y,
  ROOT_LINE_Y,
  SKY_LINE_Y,
  buildLetterTraceSpec,
  type TraceArrowCue,
  type TracePoint,
} from '../letter-trace/traceData';
import type { WordArtId as WordFunArtId } from '../word-fun/wordBank';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All mastery data in localStorage and active round
// state in sessionStorage are treated as untrusted input and validated against strict allow-lists
// and numeric bounds before rendering via React JSX auto-escaping.

export type WordTracePackId = 'cvc-mix' | 'cvc' | 'sight' | 'numbers';
export type WordTraceCaseMode = 'mix' | 'lower' | 'upper';
export type WordTraceRoundSize = 4 | 6 | 8;
export type WordTraceCategory = 'cvc' | 'sight' | 'numbers';
export type ResolvedGlyphCase = 'lower' | 'upper';

export interface WordTraceConfig {
  packId: WordTracePackId;
  caseMode: WordTraceCaseMode;
  roundSize: WordTraceRoundSize;
  /** Optional curated item IDs for Guided Activity Book lessons */
  focusItemIds?: string[];
}

export type SightWordId =
  | 'or'
  | 'be'
  | 'an'
  | 'no'
  | 'do'
  | 'am'
  | 'in'
  | 'on'
  | 'up'
  | 'go'
  | 'it'
  | 'is'
  | 'at'
  | 'to'
  | 'we'
  | 'me'
  | 'my'
  | 'he'
  | 'so'
  | 'by';

export type DigitChar = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type WordTraceArtSpec =
  | { kind: 'word-fun'; artId: WordFunArtId }
  | { kind: 'word-illus'; artId: LetterWordArtId }
  | {
      kind: 'sight-badge';
      sightId: SightWordId;
      beforeText: string;
      highlightWord: string;
      afterText: string;
      isHomework?: boolean;
    }
  | {
      kind: 'number-card';
      numeral: number;
      wordLabel: string;
      traceTarget: 'word' | 'digit';
    };

export interface WordTraceItemSpec {
  id: string;
  category: WordTraceCategory;
  subKind: 'cvc-word' | 'sight-word' | 'number-word' | 'numeral';
  /** Base text in lowercase for words ('cat', 'be', 'six') or digits ('0'..'10') */
  text: string;
  /** Friendly clue / helper line shown on the picture card */
  clue: string;
  /** Text spoken after optional child-name greeting */
  promptQuestion: string;
  /** Bundled Kokoro prompt clip ('audio/word-trace/prompt-<id>.mp3') */
  promptAudioPath: string;
  /** Bundled spoken completion word clip */
  wordAudioPath: string;
  /** Curriculum telemetry concept ID ('word:cat', 'number:6', etc.) */
  conceptId: string;
  conceptLabel: string;
  art: WordTraceArtSpec;
}

export interface WordTracePackSpec {
  id: WordTracePackId;
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
}

export interface WordTraceDeckEntry {
  itemId: string;
  resolvedCase: ResolvedGlyphCase;
}

export interface WordTraceMasteryData {
  tracedIds: string[];
  crownedIds: string[];
}

export interface ResolvedWordStroke {
  /** 0-based index across the entire word/number slate */
  globalIdx: number;
  /** 0-based character slot index (left-to-right: 0..N-1) */
  charIdx: number;
  /** 1-based stroke order within the active character (shown inside the start circle) */
  orderInChar: number;
  kind: 'line' | 'dot';
  hint: string;
  svgPath: string;
  start: TracePoint;
  end: TracePoint;
  ghostBadgePos: TracePoint;
  totalLength: number;
  samples: readonly TracePoint[];
  cumulativeLengths: readonly number[];
  arrows: readonly TraceArrowCue[];
}

export interface ResolvedWordCharacter {
  charIdx: number;
  displayChar: string;
  isDigit: boolean;
  letterId: LetterId | null;
  centerX: number;
  minX: number;
  maxX: number;
  hasDescender: boolean;
  firstStrokeGlobalIdx: number;
  lastStrokeGlobalIdx: number;
}

export interface WordTraceSlateSpec {
  displayText: string;
  hasDescender: boolean;
  strokeWidth: number;
  characters: readonly ResolvedWordCharacter[];
  strokes: readonly ResolvedWordStroke[];
}

export const WORD_SLATE_WIDTH = 760;
export const WORD_SLATE_HEIGHT = 460;
export const GLYPH_SCALE = 0.82;
export const WORD_STROKE_WIDTH = 22;

export const WT_SKY_Y = 74;
export const WT_FENCE_Y = Math.round(( WT_SKY_Y + (FENCE_LINE_Y - SKY_LINE_Y) * GLYPH_SCALE ) * 10) / 10; // 188.8
export const WT_GRASS_Y = Math.round(( WT_SKY_Y + (GRASS_LINE_Y - SKY_LINE_Y) * GLYPH_SCALE ) * 10) / 10; // 311.8
export const WT_ROOT_Y = Math.round(( WT_SKY_Y + (ROOT_LINE_Y - SKY_LINE_Y) * GLYPH_SCALE ) * 10) / 10; // 385.6

export const WORD_TRACE_MASTERY_KEY = 'pebble.word-trace.mastery.v1';
export const WORD_TRACE_ACTIVE_KEY = 'pebble.word-trace.active.v1';

export const WORD_TRACE_PACKS: readonly WordTracePackSpec[] = [
  {
    id: 'cvc-mix',
    title: 'Story & School Mix',
    subtitle: 'CVC picture words + homework sight words + numbers',
    badge: 'Recommended',
    accentColor: '#5B5BD6',
  },
  {
    id: 'cvc',
    title: 'CVC Picture Words',
    subtitle: '33 cozy 3-letter words (cat, dog, sun, bus, fox…)',
    badge: '33 Words',
    accentColor: '#3BA99C',
  },
  {
    id: 'sight',
    title: 'School Sight Words',
    subtitle: 'Homework core (or, be, an, no, do, am) + K1 sight words',
    badge: '20 Sight Words',
    accentColor: '#F27A5E',
  },
  {
    id: 'numbers',
    title: 'Handful of Numbers',
    subtitle: 'Number words (one, two, six, ten…) & digits 0–10',
    badge: '0–10 & Words',
    accentColor: '#F2B84B',
  },
];

function makeCvcWordFun(id: WordFunArtId, clue: string): WordTraceItemSpec {
  return {
    id,
    category: 'cvc',
    subKind: 'cvc-word',
    text: id,
    clue,
    promptQuestion: `Can you write ${id}?`,
    promptAudioPath: `audio/word-trace/prompt-${id}.mp3`,
    wordAudioPath: `audio/words/${id}.mp3`,
    conceptId: `word:${id}`,
    conceptLabel: `Word "${id}"`,
    art: { kind: 'word-fun', artId: id },
  };
}

function makeCvcIllus(id: LetterWordArtId, clue: string): WordTraceItemSpec {
  return {
    id,
    category: 'cvc',
    subKind: 'cvc-word',
    text: id,
    clue,
    promptQuestion: `Can you write ${id}?`,
    promptAudioPath: `audio/word-trace/prompt-${id}.mp3`,
    wordAudioPath: `audio/words/${id}.mp3`,
    conceptId: `word:${id}`,
    conceptLabel: `Word "${id}"`,
    art: { kind: 'word-illus', artId: id },
  };
}

function makeSightWord(
  sightId: SightWordId,
  beforeText: string,
  highlightWord: string,
  afterText: string,
  isHomework = false,
): WordTraceItemSpec {
  const fullContext = `${beforeText}${highlightWord}${afterText}`.trim();
  return {
    id: sightId,
    category: 'sight',
    subKind: 'sight-word',
    text: sightId,
    clue: fullContext,
    promptQuestion: `Can you write ${sightId}? ${fullContext}`,
    promptAudioPath: `audio/word-trace/prompt-${sightId}.mp3`,
    wordAudioPath: `audio/word-trace/word-${sightId}.mp3`,
    conceptId: `word:${sightId}`,
    conceptLabel: `Sight word "${sightId}"`,
    art: {
      kind: 'sight-badge',
      sightId,
      beforeText,
      highlightWord,
      afterText,
      isHomework,
    },
  };
}

function makeNumberWord(id: string, numeral: number): WordTraceItemSpec {
  return {
    id,
    category: 'numbers',
    subKind: 'number-word',
    text: id,
    clue: `${numeral} ${numeral === 1 ? 'river pebble' : 'river pebbles'}`,
    promptQuestion: `Can you write ${id}?`,
    promptAudioPath: `audio/word-trace/prompt-${id}.mp3`,
    wordAudioPath: numeral === 0 ? 'audio/words/zero.mp3' : `audio/numbers/${numeral}.mp3`,
    conceptId: `number:${numeral}`,
    conceptLabel: `Number word "${id}" (${numeral})`,
    art: {
      kind: 'number-card',
      numeral,
      wordLabel: id,
      traceTarget: 'word',
    },
  };
}

function makeNumeralItem(numeral: number, wordLabel: string): WordTraceItemSpec {
  const id = `num-${numeral}`;
  return {
    id,
    category: 'numbers',
    subKind: 'numeral',
    text: String(numeral),
    clue: `${wordLabel[0].toUpperCase()}${wordLabel.slice(1)} • ${numeral} ${
      numeral === 1 ? 'pebble' : 'pebbles'
    }`,
    promptQuestion: `Can you write the number ${wordLabel}?`,
    promptAudioPath: `audio/word-trace/prompt-${id}.mp3`,
    wordAudioPath: numeral === 0 ? 'audio/words/zero.mp3' : `audio/numbers/${numeral}.mp3`,
    conceptId: `number:${numeral}`,
    conceptLabel: `Number ${numeral}`,
    art: {
      kind: 'number-card',
      numeral,
      wordLabel,
      traceTarget: 'digit',
    },
  };
}

export const CVC_TRACE_ITEMS: readonly WordTraceItemSpec[] = [
  makeCvcWordFun('cat', 'Purring cozy kitten'),
  makeCvcWordFun('dog', 'Friendly wagging pup'),
  makeCvcWordFun('pig', 'Rosy mud puddle friend'),
  makeCvcWordFun('fox', 'Clever woodland tail'),
  makeCvcWordFun('hen', 'Warm barnyard clucker'),
  makeCvcWordFun('cow', 'Gentle meadow grazer'),
  makeCvcWordFun('bee', 'Buzzing garden helper'),
  makeCvcWordFun('cup', 'Warm cocoa mug'),
  makeCvcWordFun('hat', 'Cozy bobble beanie'),
  makeCvcWordFun('bed', 'Soft sleepy pillow'),
  makeCvcWordFun('box', 'Ribbon surprise gift'),
  makeCvcWordFun('pot', 'Warm soup on the stove'),
  makeCvcWordFun('jar', 'Sweet berry jam jar'),
  makeCvcWordFun('pan', 'Sunny breakfast skillet'),
  makeCvcWordFun('bus', 'Sunny yellow school ride'),
  makeCvcWordFun('car', 'Little family coupe'),
  makeCvcWordFun('jet', 'Zooming sky plane'),
  makeCvcWordFun('sub', 'Yellow ocean explorer'),
  makeCvcWordFun('top', 'Twirling wooden spinner'),
  makeCvcWordFun('bag', 'Ready-for-school backpack'),
  makeCvcWordFun('van', 'Happy camper ride'),
  makeCvcWordFun('map', 'Dotted treasure trail'),
  makeCvcWordFun('sun', 'Bright morning sunshine'),
  makeCvcWordFun('log', 'Mossy forest trunk'),
  makeCvcWordFun('web', 'Dewy morning threads'),
  makeCvcWordFun('pod', 'Three sweet green peas'),
  makeCvcWordFun('bug', 'Spotted garden ladybug'),
  makeCvcWordFun('gem', 'Shining teal crystal'),
  makeCvcIllus('ant', 'Busy picnic explorer'),
  makeCvcIllus('egg', 'Cozy speckled nest egg'),
  makeCvcIllus('nut', 'Crunchy autumn acorn nut'),
  makeCvcIllus('net', 'Butterfly garden net'),
  makeCvcIllus('yak', 'Fluffy mountain yak'),
];

export const SIGHT_TRACE_ITEMS: readonly WordTraceItemSpec[] = [
  // 6 Notebook Homework Core Words
  makeSightWord('or', 'Sun ', 'or', ' rain!', true),
  makeSightWord('be', "Let's ", 'be', ' kind!', true),
  makeSightWord('an', 'Eat ', 'an', ' apple!', true),
  makeSightWord('no', '', 'No', ' more rain!', true),
  makeSightWord('do', 'You can ', 'do', ' it!', true),
  makeSightWord('am', 'I ', 'am', ' happy!', true),
  // 14 K1 High-Frequency 2-Letter Sight Words
  makeSightWord('in', 'Hop ', 'in', ' the box!'),
  makeSightWord('on', 'Hat ', 'on', ' top!'),
  makeSightWord('up', 'Look way ', 'up', '!'),
  makeSightWord('go', 'Ready, set, ', 'go', '!'),
  makeSightWord('it', 'You found ', 'it', '!'),
  makeSightWord('is', 'The sun ', 'is', ' warm!'),
  makeSightWord('at', 'Smile ', 'at', ' home!'),
  makeSightWord('to', 'Walk ', 'to', ' school!'),
  makeSightWord('we', 'Together ', 'we', ' play!'),
  makeSightWord('me', 'Read with ', 'me', '!'),
  makeSightWord('my', 'Hold ', 'my', ' hand!'),
  makeSightWord('he', '', 'He', ' can jump!'),
  makeSightWord('so', 'You are ', 'so', ' kind!'),
  makeSightWord('by', 'Sit ', 'by', ' the tree!'),
];

export const NUMBER_TRACE_ITEMS: readonly WordTraceItemSpec[] = [
  // 8 Short K1 Number Words (3–4 letters)
  makeNumberWord('one', 1),
  makeNumberWord('two', 2),
  makeNumberWord('six', 6),
  makeNumberWord('ten', 10),
  makeNumberWord('zero', 0),
  makeNumberWord('four', 4),
  makeNumberWord('five', 5),
  makeNumberWord('nine', 9),
  // 11 Numeral Traces (0–9 single digits + 10 pair)
  makeNumeralItem(0, 'zero'),
  makeNumeralItem(1, 'one'),
  makeNumeralItem(2, 'two'),
  makeNumeralItem(3, 'three'),
  makeNumeralItem(4, 'four'),
  makeNumeralItem(5, 'five'),
  makeNumeralItem(6, 'six'),
  makeNumeralItem(7, 'seven'),
  makeNumeralItem(8, 'eight'),
  makeNumeralItem(9, 'nine'),
  makeNumeralItem(10, 'ten'),
];

export const ALL_WORD_TRACE_ITEMS: readonly WordTraceItemSpec[] = [
  ...CVC_TRACE_ITEMS,
  ...SIGHT_TRACE_ITEMS,
  ...NUMBER_TRACE_ITEMS,
];

const ITEM_MAP = new Map<string, WordTraceItemSpec>(
  ALL_WORD_TRACE_ITEMS.map((item) => [item.id, item]),
);

export function isValidWordTraceItemId(value: unknown): value is string {
  return typeof value === 'string' && ITEM_MAP.has(value);
}

export function getWordTraceItem(id: string): WordTraceItemSpec {
  return ITEM_MAP.get(id) ?? CVC_TRACE_ITEMS[0];
}

export function getWordTracePackSpec(packId: WordTracePackId): WordTracePackSpec {
  return WORD_TRACE_PACKS.find((p) => p.id === packId) ?? WORD_TRACE_PACKS[0];
}

export function getDefaultWordTraceConfig(): WordTraceConfig {
  return {
    packId: 'cvc-mix',
    caseMode: 'mix',
    roundSize: 6,
  };
}

export function isValidWordTracePackId(value: unknown): value is WordTracePackId {
  return (
    value === 'cvc-mix' ||
    value === 'cvc' ||
    value === 'sight' ||
    value === 'numbers'
  );
}

export function isValidWordTraceCaseMode(value: unknown): value is WordTraceCaseMode {
  return value === 'mix' || value === 'lower' || value === 'upper';
}

export function isValidWordTraceRoundSize(value: unknown): value is WordTraceRoundSize {
  return value === 4 || value === 6 || value === 8;
}

export function isValidWordTraceConfig(value: unknown): value is WordTraceConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WordTraceConfig>;
  if (
    !isValidWordTracePackId(c.packId) ||
    !isValidWordTraceCaseMode(c.caseMode) ||
    !isValidWordTraceRoundSize(c.roundSize)
  ) {
    return false;
  }
  if (c.focusItemIds !== undefined) {
    if (
      !Array.isArray(c.focusItemIds) ||
      c.focusItemIds.length === 0 ||
      c.focusItemIds.length > 12 ||
      !c.focusItemIds.every((id) => isValidWordTraceItemId(id))
    ) {
      return false;
    }
  }
  return true;
}

/* ============================================================================
 * Custom 0–9 School-Manuscript Numeral Stroke Definitions
 * (Defined in raw SKY_LINE_Y..GRASS_LINE_Y coordinates around x = 0)
 * ============================================================================ */

const RAW_Y_SKY = SKY_LINE_Y + 13; // 108
const RAW_Y_MID = Math.round((RAW_Y_SKY + (GRASS_LINE_Y - 13)) / 2); // 240
const RAW_Y_GRASS = GRASS_LINE_Y - 13; // 372

type RawSegment =
  | { type: 'L'; x1: number; y1: number; x2: number; y2: number }
  | {
      type: 'C';
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x3: number;
      y3: number;
    };

interface RawNumeralStrokeDef {
  hint: string;
  segments: readonly RawSegment[];
  ghostOffset?: { dx: number; dy: number };
}

function rLn(x1: number, y1: number, x2: number, y2: number): RawSegment {
  return { type: 'L', x1, y1, x2, y2 };
}

function rCb(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  p3: readonly [number, number],
): RawSegment {
  return {
    type: 'C',
    x0: p0[0],
    y0: p0[1],
    x1: p1[0],
    y1: p1[1],
    x2: p2[0],
    y2: p2[1],
    x3: p3[0],
    y3: p3[1],
  };
}

const NUMERAL_STROKES: Record<DigitChar, readonly RawNumeralStrokeDef[]> = {
  '0': [
    {
      hint: 'Start at the sky and curve counter-clockwise around Zero',
      segments: [
        rCb([0, RAW_Y_SKY], [-50, RAW_Y_SKY], [-66, 166], [-66, RAW_Y_MID]),
        rCb([-66, RAW_Y_MID], [-66, 314], [-50, RAW_Y_GRASS], [0, RAW_Y_GRASS]),
        rCb([0, RAW_Y_GRASS], [50, RAW_Y_GRASS], [66, 314], [66, RAW_Y_MID]),
        rCb([66, RAW_Y_MID], [66, 166], [50, RAW_Y_SKY], [0, RAW_Y_SKY]),
      ],
    },
  ],
  '1': [
    {
      hint: 'Tall straight line down from sky to grass',
      segments: [rLn(0, RAW_Y_SKY, 0, RAW_Y_GRASS)],
    },
  ],
  '2': [
    {
      hint: 'Curve over the top, slant down left, and slide across the grass',
      segments: [
        rCb([-50, 156], [-34, RAW_Y_SKY], [24, RAW_Y_SKY], [48, 138]),
        rCb([48, 138], [64, 162], [52, 206], [12, 260]),
        rLn(12, 260, -56, RAW_Y_GRASS),
        rLn(-56, RAW_Y_GRASS, 58, RAW_Y_GRASS),
      ],
    },
  ],
  '3': [
    {
      hint: 'Round bump to the middle, then round bump to the grass',
      segments: [
        rCb([-48, 146], [-30, RAW_Y_SKY], [26, RAW_Y_SKY], [48, 138]),
        rCb([48, 138], [62, 168], [40, 232], [-14, 236]),
        rCb([-14, 236], [46, 240], [66, 286], [52, 336]),
        rCb([52, 336], [36, RAW_Y_GRASS], [-26, RAW_Y_GRASS], [-52, 338]),
      ],
    },
  ],
  '4': [
    {
      hint: 'Down to the middle and slide across right',
      segments: [
        rLn(-44, RAW_Y_SKY, -44, 266),
        rLn(-44, 266, 58, 266),
      ],
    },
    {
      hint: 'Tall straight line down from sky to grass',
      segments: [rLn(26, RAW_Y_SKY, 26, RAW_Y_GRASS)],
    },
  ],
  '5': [
    {
      hint: 'Short neck down, then curve around the belly',
      segments: [
        rLn(-42, RAW_Y_SKY, -42, 226),
        rCb([-42, 226], [10, 208], [58, 238], [58, 296]),
        rCb([58, 296], [58, 352], [12, RAW_Y_GRASS], [-38, 354]),
      ],
    },
    {
      hint: 'Slide the top hat across right',
      segments: [rLn(-42, RAW_Y_SKY, 48, RAW_Y_SKY)],
      ghostOffset: { dx: 44, dy: 0 },
    },
  ],
  '6': [
    {
      hint: 'Curve down from the top and curl into a bottom loop',
      segments: [
        rCb([36, 120], [-14, RAW_Y_SKY], [-58, 184], [-58, 288]),
        rCb([-58, 288], [-58, 350], [-22, RAW_Y_GRASS], [8, RAW_Y_GRASS]),
        rCb([8, RAW_Y_GRASS], [46, RAW_Y_GRASS], [58, 332], [54, 296]),
        rCb([54, 296], [48, 254], [6, 242], [-30, 260]),
        rCb([-30, 260], [-48, 270], [-54, 284], [-56, 298]),
      ],
    },
  ],
  '7': [
    {
      hint: 'Slide across the sky, then slant down to the grass',
      segments: [
        rLn(-54, RAW_Y_SKY, 54, RAW_Y_SKY),
        rLn(54, RAW_Y_SKY, -16, RAW_Y_GRASS),
      ],
    },
  ],
  '8': [
    {
      hint: 'Make an S curve down, then loop back up to the top',
      segments: [
        rCb([40, 142], [28, RAW_Y_SKY], [-26, RAW_Y_SKY], [-44, 140]),
        rCb([-44, 140], [-60, 174], [-26, 214], [0, 236]),
        rCb([0, 236], [42, 266], [62, 304], [48, 344]),
        rCb([48, 344], [32, RAW_Y_GRASS], [-32, RAW_Y_GRASS], [-48, 344]),
        rCb([-48, 344], [-62, 304], [-42, 266], [0, 236]),
        rCb([0, 236], [26, 214], [56, 176], [40, 142]),
      ],
    },
  ],
  '9': [
    {
      hint: 'Make a round circle at the top first',
      segments: [
        rCb([46, 174], [44, 130], [16, RAW_Y_SKY], [-6, RAW_Y_SKY]),
        rCb([-6, RAW_Y_SKY], [-44, RAW_Y_SKY], [-56, 146], [-54, 184]),
        rCb([-54, 184], [-52, 224], [-20, 246], [10, 242]),
        rCb([10, 242], [32, 238], [46, 212], [46, 174]),
      ],
    },
    {
      hint: 'Tall straight line down on the right',
      segments: [rLn(46, RAW_Y_SKY, 46, RAW_Y_GRASS)],
    },
  ],
};

function evalRawCubic(
  seg: Extract<RawSegment, { type: 'C' }>,
  t: number,
): TracePoint {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x:
      mt2 * mt * seg.x0 +
      3 * mt2 * t * seg.x1 +
      3 * mt * t2 * seg.x2 +
      t2 * t * seg.x3,
    y:
      mt2 * mt * seg.y0 +
      3 * mt2 * t * seg.y1 +
      3 * mt * t2 * seg.y2 +
      t2 * t * seg.y3,
  };
}

function sampleRawNumeralStroke(def: RawNumeralStrokeDef): TracePoint[] {
  const rawPts: TracePoint[] = [];
  def.segments.forEach((seg, segIdx) => {
    if (seg.type === 'L') {
      if (segIdx === 0) rawPts.push({ x: seg.x1, y: seg.y1 });
      const steps = Math.max(8, Math.ceil(Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) / 4));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        rawPts.push({
          x: seg.x1 + (seg.x2 - seg.x1) * t,
          y: seg.y1 + (seg.y2 - seg.y1) * t,
        });
      }
    } else {
      if (segIdx === 0) rawPts.push({ x: seg.x0, y: seg.y0 });
      const steps = 28;
      for (let i = 1; i <= steps; i += 1) {
        rawPts.push(evalRawCubic(seg, i / steps));
      }
    }
  });

  // Uniform 80-point arc-length resample matching traceData.ts
  const rawCum: number[] = [0];
  for (let i = 1; i < rawPts.length; i += 1) {
    rawCum.push(
      rawCum[i - 1] + Math.hypot(rawPts[i].x - rawPts[i - 1].x, rawPts[i].y - rawPts[i - 1].y),
    );
  }
  const total = rawCum[rawCum.length - 1] || 1;
  const count = 80;
  const dense: TracePoint[] = [];
  let cursor = 0;
  for (let k = 0; k < count; k += 1) {
    const targetDist = (total * k) / (count - 1);
    while (cursor < rawCum.length - 2 && rawCum[cursor + 1] < targetDist) {
      cursor += 1;
    }
    const segStart = rawCum[cursor];
    const segEnd = rawCum[cursor + 1];
    const span = segEnd - segStart;
    const alpha = span > 1e-6 ? Math.max(0, Math.min(1, (targetDist - segStart) / span)) : 0;
    const a = rawPts[cursor];
    const b = rawPts[Math.min(rawPts.length - 1, cursor + 1)];
    dense.push({
      x: a.x + (b.x - a.x) * alpha,
      y: a.y + (b.y - a.y) * alpha,
    });
  }
  return dense;
}

interface NormalizedCharBlueprint {
  displayChar: string;
  isDigit: boolean;
  letterId: LetterId | null;
  hasDescender: boolean;
  /** Bounds in scaled units around x = 0 */
  minDx: number;
  maxDx: number;
  strokes: {
    kind: 'line' | 'dot';
    hint: string;
    relSamples: TracePoint[]; // x relative to glyph origin, y already mapped to WT slate Y
    relGhostBadge: TracePoint;
  }[];
}

function mapRawYToSlateY(rawY: number): number {
  return WT_SKY_Y + (rawY - SKY_LINE_Y) * GLYPH_SCALE;
}

function buildCharBlueprint(ch: string, glyphCase: ResolvedGlyphCase): NormalizedCharBlueprint {
  const isDigit = /^[0-9]$/.test(ch);
  if (isDigit) {
    const digit = ch as DigitChar;
    const defs = NUMERAL_STROKES[digit];
    let minDx = Infinity;
    let maxDx = -Infinity;
    const strokes = defs.map((def) => {
      const dense = sampleRawNumeralStroke(def);
      const relSamples = dense.map((p) => {
        const rx = p.x * GLYPH_SCALE;
        if (rx < minDx) minDx = rx;
        if (rx > maxDx) maxDx = rx;
        return {
          x: rx,
          y: mapRawYToSlateY(p.y),
        };
      });
      const start = relSamples[0] ?? { x: 0, y: WT_SKY_Y };
      const relGhostBadge = def.ghostOffset
        ? {
            x: start.x + def.ghostOffset.dx * GLYPH_SCALE,
            y: start.y + def.ghostOffset.dy * GLYPH_SCALE,
          }
        : start;
      return {
        kind: 'line' as const,
        hint: def.hint,
        relSamples,
        relGhostBadge,
      };
    });
    if (!Number.isFinite(minDx)) {
      minDx = -24;
      maxDx = 24;
    }
    return {
      displayChar: digit,
      isDigit: true,
      letterId: null,
      hasDescender: false,
      minDx: Math.min(minDx, -26),
      maxDx: Math.max(maxDx, 26),
      strokes,
    };
  }

  const upperChar = ch.toUpperCase();
  const letterId: LetterId = isValidLetterId(upperChar) ? upperChar : 'C';
  const spec = buildLetterTraceSpec(letterId, glyphCase);
  const rawCenterX = spec.glyphs[0]?.centerX ?? 350;

  let minDx = Infinity;
  let maxDx = -Infinity;

  const strokes = spec.strokes.map((s) => {
    const relSamples = s.samples.map((p) => {
      const rx = (p.x - rawCenterX) * GLYPH_SCALE;
      if (rx < minDx) minDx = rx;
      if (rx > maxDx) maxDx = rx;
      return {
        x: rx,
        y: mapRawYToSlateY(p.y),
      };
    });
    const relGhostBadge = {
      x: (s.ghostBadgePos.x - rawCenterX) * GLYPH_SCALE,
      y: mapRawYToSlateY(s.ghostBadgePos.y),
    };
    return {
      kind: s.kind,
      hint: s.hint,
      relSamples,
      relGhostBadge,
    };
  });

  if (!Number.isFinite(minDx)) {
    minDx = -26;
    maxDx = 26;
  }

  return {
    displayChar: glyphCase === 'upper' ? letterId : letterId.toLowerCase(),
    isDigit: false,
    letterId,
    hasDescender: spec.hasDescender,
    minDx: Math.min(minDx, -24),
    maxDx: Math.max(maxDx, 24),
    strokes,
  };
}

export function pointAlongWordStroke(
  strokeSpec: Pick<ResolvedWordStroke, 'kind' | 'samples' | 'start'>,
  progress: number,
): TracePoint {
  if (strokeSpec.kind === 'dot' || strokeSpec.samples.length <= 1) {
    return strokeSpec.start;
  }
  const clamped = Math.max(0, Math.min(1, progress));
  const f = clamped * (strokeSpec.samples.length - 1);
  const idx = Math.floor(f);
  const nextIdx = Math.min(strokeSpec.samples.length - 1, idx + 1);
  const frac = f - idx;
  const p0 = strokeSpec.samples[idx];
  const p1 = strokeSpec.samples[nextIdx];
  return {
    x: p0.x + (p1.x - p0.x) * frac,
    y: p0.y + (p1.y - p0.y) * frac,
  };
}

function angleAtWordStrokeProgress(
  strokeSpec: Pick<ResolvedWordStroke, 'kind' | 'samples' | 'start'>,
  progress: number,
): number {
  const p0 = pointAlongWordStroke(strokeSpec, Math.max(0, progress - 0.04));
  const p1 = pointAlongWordStroke(strokeSpec, Math.min(1, progress + 0.04));
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
}

function samplesToSvgPath(samples: readonly TracePoint[]): string {
  if (samples.length === 0) return '';
  if (samples.length === 1) {
    const p = samples[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  const parts = [`M ${samples[0].x.toFixed(1)} ${samples[0].y.toFixed(1)}`];
  for (let i = 1; i < samples.length; i += 1) {
    parts.push(`L ${samples[i].x.toFixed(1)} ${samples[i].y.toFixed(1)}`);
  }
  return parts.join(' ');
}

/**
 * Resolves a multi-character word or numeral ('cat', 'DOG', 'be', 'six', '6', '10')
 * onto the 760 × 460 4-line notebook slate with optical spacing and continuous stroke indexing.
 */
export function buildWordTraceSlateSpec(
  rawText: string,
  resolvedCase: ResolvedGlyphCase,
): WordTraceSlateSpec {
  const chars = Array.from(rawText.trim()).slice(0, 4);
  const blueprints = chars.map((ch) => buildCharBlueprint(ch, resolvedCase));
  const count = blueprints.length;

  const baseGap = count <= 1 ? 0 : count === 2 ? 68 : count === 3 ? 52 : 38;
  const boxWidths = blueprints.map((bp) => Math.max(54, bp.maxDx - bp.minDx));
  const rawTotalTextW = boxWidths.reduce((acc, w) => acc + w, 0);
  const maxUsableW = WORD_SLATE_WIDTH - 108; // 652px inside [54..706]

  let effectiveGap = baseGap;
  if (count > 1 && rawTotalTextW + effectiveGap * (count - 1) > maxUsableW) {
    effectiveGap = Math.max(24, (maxUsableW - rawTotalTextW) / (count - 1));
  }

  let horizScale = 1;
  const totalRowW = rawTotalTextW + effectiveGap * Math.max(0, count - 1);
  if (totalRowW > maxUsableW && totalRowW > 1) {
    horizScale = maxUsableW / totalRowW;
  }

  const finalRowW = totalRowW * horizScale;
  let cursorLeft = (WORD_SLATE_WIDTH - finalRowW) / 2;

  const characters: ResolvedWordCharacter[] = [];
  const strokes: ResolvedWordStroke[] = [];

  blueprints.forEach((bp, charIdx) => {
    const rawW = boxWidths[charIdx];
    const scaledW = rawW * horizScale;
    // Center the glyph's [minDx, maxDx] span inside its allocated slot width
    const spanMid = ((bp.minDx + bp.maxDx) / 2) * horizScale;
    const originX = cursorLeft + scaledW / 2 - spanMid;
    const firstStrokeGlobalIdx = strokes.length;

    bp.strokes.forEach((rawStroke, sIdx) => {
      const globalIdx = strokes.length;
      const orderInChar = sIdx + 1;
      const translatedSamples = rawStroke.relSamples.map((p) => ({
        x: originX + p.x * horizScale,
        y: p.y,
      }));
      const cumLen: number[] = [0];
      for (let i = 1; i < translatedSamples.length; i += 1) {
        cumLen.push(
          cumLen[i - 1] +
            Math.hypot(
              translatedSamples[i].x - translatedSamples[i - 1].x,
              translatedSamples[i].y - translatedSamples[i - 1].y,
            ),
        );
      }
      const totalLength = rawStroke.kind === 'dot' ? 0 : cumLen[cumLen.length - 1] || 1;
      const start = translatedSamples[0] ?? { x: originX, y: WT_SKY_Y };
      const end = translatedSamples[translatedSamples.length - 1] ?? start;
      const ghostBadgePos = {
        x: originX + rawStroke.relGhostBadge.x * horizScale,
        y: rawStroke.relGhostBadge.y,
      };
      const svgPath = samplesToSvgPath(translatedSamples);

      const arrowFractions =
        rawStroke.kind === 'dot'
          ? []
          : totalLength > 155
            ? [0.24, 0.58, 0.86]
            : [0.34, 0.78];

      const baseStroke = {
        kind: rawStroke.kind,
        samples: translatedSamples,
        start,
      };
      const arrows: TraceArrowCue[] = arrowFractions.map((frac) => {
        const pt = pointAlongWordStroke(baseStroke, frac);
        return {
          x: pt.x,
          y: pt.y,
          angleDeg: angleAtWordStrokeProgress(baseStroke, frac),
        };
      });

      strokes.push({
        globalIdx,
        charIdx,
        orderInChar,
        kind: rawStroke.kind,
        hint: rawStroke.hint,
        svgPath,
        start,
        end,
        ghostBadgePos,
        totalLength,
        samples: translatedSamples,
        cumulativeLengths: cumLen,
        arrows,
      });
    });

    const lastStrokeGlobalIdx = Math.max(firstStrokeGlobalIdx, strokes.length - 1);
    characters.push({
      charIdx,
      displayChar: bp.displayChar,
      isDigit: bp.isDigit,
      letterId: bp.letterId,
      centerX: cursorLeft + scaledW / 2,
      minX: cursorLeft,
      maxX: cursorLeft + scaledW,
      hasDescender: bp.hasDescender,
      firstStrokeGlobalIdx,
      lastStrokeGlobalIdx,
    });

    cursorLeft += scaledW + effectiveGap * horizScale;
  });

  return {
    displayText: characters.map((c) => c.displayChar).join(''),
    hasDescender: characters.some((c) => c.hasDescender),
    strokeWidth: WORD_STROKE_WIDTH,
    characters,
    strokes,
  };
}

/**
 * Forward-window projection along active stroke [max(0, prev - 0.06), min(1, prev + 0.34)]
 * so closed loops (o, a, d, g, 0, 6, 8, 9) cannot be drawn backwards.
 */
export function projectForwardOntoWordStroke(
  strokeSpec: ResolvedWordStroke,
  pt: TracePoint,
  currentProgress: number,
): { progress: number; distance: number } {
  const samples = strokeSpec.samples;
  const cumLen = strokeSpec.cumulativeLengths;
  const total = strokeSpec.totalLength || 1;
  if (strokeSpec.kind === 'dot' || samples.length <= 1) {
    return {
      progress: 1,
      distance: Math.hypot(pt.x - strokeSpec.start.x, pt.y - strokeSpec.start.y),
    };
  }

  const minWindow = Math.max(0, currentProgress - 0.06);
  const maxWindow = Math.min(1, currentProgress + 0.34);
  const segCount = samples.length - 1;
  const startIdx = Math.max(0, Math.floor(minWindow * segCount));
  const endIdx = Math.min(segCount - 1, Math.ceil(maxWindow * segCount));

  let bestDistSq = Infinity;
  let bestLen = currentProgress * total;

  for (let i = startIdx; i <= endIdx; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const lenSq = vx * vx + vy * vy;
    let t = 0;
    if (lenSq > 1e-6) {
      t = Math.max(0, Math.min(1, ((pt.x - a.x) * vx + (pt.y - a.y) * vy) / lenSq));
    }
    const cx = a.x + vx * t;
    const cy = a.y + vy * t;
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      const segSpan = cumLen[i + 1] - cumLen[i];
      bestLen = cumLen[i] + segSpan * t;
    }
  }

  return {
    progress: Math.max(currentProgress, Math.min(1, bestLen / total)),
    distance: Math.sqrt(bestDistSq),
  };
}

export function minDistanceToWordStroke(strokeSpec: ResolvedWordStroke, pt: TracePoint): number {
  let minD = Infinity;
  for (const s of strokeSpec.samples) {
    const d = Math.hypot(pt.x - s.x, pt.y - s.y);
    if (d < minD) minD = d;
  }
  return minD;
}

/* ============================================================================
 * Mastery Storage & Round Deck Construction
 * ============================================================================ */

function sanitizeItemIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (isValidWordTraceItemId(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
    if (out.length >= ALL_WORD_TRACE_ITEMS.length) break;
  }
  return out;
}

export function loadWordTraceMastery(): WordTraceMasteryData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { tracedIds: [], crownedIds: [] };
    }
    const raw = window.localStorage.getItem(WORD_TRACE_MASTERY_KEY);
    if (!raw) return { tracedIds: [], crownedIds: [] };
    const parsed = JSON.parse(raw) as Partial<WordTraceMasteryData>;
    return {
      tracedIds: sanitizeItemIdList(parsed?.tracedIds),
      crownedIds: sanitizeItemIdList(parsed?.crownedIds),
    };
  } catch {
    return { tracedIds: [], crownedIds: [] };
  }
}

export function saveWordTraceItemMastery(itemId: string, crowned: boolean): WordTraceMasteryData {
  if (!isValidWordTraceItemId(itemId)) return loadWordTraceMastery();
  const current = loadWordTraceMastery();
  const tracedSet = new Set(current.tracedIds);
  const crownedSet = new Set(current.crownedIds);
  tracedSet.add(itemId);
  if (crowned) crownedSet.add(itemId);

  const next: WordTraceMasteryData = {
    tracedIds: ALL_WORD_TRACE_ITEMS.map((i) => i.id).filter((id) => tracedSet.has(id)),
    crownedIds: ALL_WORD_TRACE_ITEMS.map((i) => i.id).filter((id) => crownedSet.has(id)),
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(WORD_TRACE_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

function secureShuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    let rand = Math.random();
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      rand = buf[0] / 4294967296;
    }
    const j = Math.floor(rand * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickPrioritized(
  pool: readonly WordTraceItemSpec[],
  count: number,
  crownedSet: ReadonlySet<string>,
): WordTraceItemSpec[] {
  const uncrowned = secureShuffle(pool.filter((i) => !crownedSet.has(i.id)));
  const crowned = secureShuffle(pool.filter((i) => crownedSet.has(i.id)));
  return [...uncrowned, ...crowned].slice(0, count);
}

export function buildWordTraceDeck(
  config: WordTraceConfig,
  mastery: WordTraceMasteryData,
): WordTraceDeckEntry[] {
  const crownedSet = new Set(mastery.crownedIds);
  let chosenItems: WordTraceItemSpec[];

  if (config.focusItemIds && config.focusItemIds.length > 0) {
    chosenItems = config.focusItemIds
      .filter((id) => isValidWordTraceItemId(id))
      .map((id) => getWordTraceItem(id))
      .slice(0, config.roundSize);
  } else if (config.packId === 'cvc') {
    chosenItems = pickPrioritized(CVC_TRACE_ITEMS, config.roundSize, crownedSet);
  } else if (config.packId === 'sight') {
    // Guarantee at least half come from the 6 school notebook homework words when uncrowned!
    const homeworkPool = SIGHT_TRACE_ITEMS.slice(0, 6);
    const corePool = SIGHT_TRACE_ITEMS.slice(6);
    const hwCount = Math.min(homeworkPool.length, Math.ceil(config.roundSize * 0.5));
    const pickedHw = pickPrioritized(homeworkPool, hwCount, crownedSet);
    const pickedCore = pickPrioritized(corePool, config.roundSize - pickedHw.length, crownedSet);
    chosenItems = secureShuffle([...pickedHw, ...pickedCore]);
  } else if (config.packId === 'numbers') {
    // Balanced mix of short number words ('six', 'one', 'two', 'ten') + digit traces ('0'..'9')
    const wordPool = NUMBER_TRACE_ITEMS.filter((i) => i.subKind === 'number-word');
    const digitPool = NUMBER_TRACE_ITEMS.filter((i) => i.subKind === 'numeral');
    const wordCount = Math.ceil(config.roundSize / 2);
    const digitCount = config.roundSize - wordCount;
    chosenItems = secureShuffle([
      ...pickPrioritized(wordPool, wordCount, crownedSet),
      ...pickPrioritized(digitPool, digitCount, crownedSet),
    ]);
  } else {
    // 'cvc-mix': ~65% CVC picture words + ~20% Sight words + ~15% Numbers
    const sightCount = config.roundSize >= 8 ? 2 : 1;
    const numCount = 1;
    const cvcCount = Math.max(1, config.roundSize - sightCount - numCount);
    const pickedCvc = pickPrioritized(CVC_TRACE_ITEMS, cvcCount, crownedSet);
    const pickedSight = pickPrioritized(SIGHT_TRACE_ITEMS, sightCount, crownedSet);
    const pickedNum = pickPrioritized(NUMBER_TRACE_ITEMS, numCount, crownedSet);
    // Start with a cozy CVC picture word on card 1 for instant visual delight, shuffle the rest!
    const firstCvc = pickedCvc[0];
    const rest = secureShuffle([...pickedCvc.slice(1), ...pickedSight, ...pickedNum]);
    chosenItems = firstCvc ? [firstCvc, ...rest] : rest;
  }

  let letterWordOrdinal = 0;
  return chosenItems.map((item) => {
    let resolvedCase: ResolvedGlyphCase = 'lower';
    if (item.subKind !== 'numeral') {
      if (config.caseMode === 'upper') {
        resolvedCase = 'upper';
      } else if (config.caseMode === 'lower') {
        resolvedCase = 'lower';
      } else {
        // 'mix': alternate lowercase ('cat', 'be') and uppercase ('DOG', 'OR') across word items
        resolvedCase = letterWordOrdinal % 2 === 0 ? 'lower' : 'upper';
      }
      letterWordOrdinal += 1;
    }
    return {
      itemId: item.id,
      resolvedCase,
    };
  });
}

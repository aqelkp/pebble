import { ALL_LETTERS, getStationSpec, isValidLetterId, type LetterId } from '../letter-train/letterData';
import type { LetterWordSpec } from '../letter-train/letterData';

// TODO(security): Pebble runs 100% locally in the browser with no backend server. All mastery
// records in localStorage and active round state in sessionStorage are validated against strict
// allow-lists and integer bounds before use.

export type TraceCaseMode = 'both' | 'upper' | 'lower';
export type TraceRoundSize = 4 | 6 | 10;
export type TraceOrderMode = 'alphabetical' | 'shuffle';

export interface LetterTraceConfig {
  selectedLetters: LetterId[];
  caseMode: TraceCaseMode;
  roundSize: TraceRoundSize;
  orderMode: TraceOrderMode;
}

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceArrowCue {
  x: number;
  y: number;
  angleDeg: number;
}

export interface ResolvedTraceStroke {
  /** 1-based display badge number continuous across Capital -> Small on the slate */
  order: number;
  glyphCase: 'upper' | 'lower';
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

export interface ResolvedGlyphSummary {
  glyphCase: 'upper' | 'lower';
  label: string;
  centerX: number;
  hasDescender: boolean;
  startOrder: number;
  endOrder: number;
}

export interface LetterTraceSpec {
  letter: LetterId;
  hasDescender: boolean;
  strokes: readonly ResolvedTraceStroke[];
  glyphs: readonly ResolvedGlyphSummary[];
}

export interface TraceMasteryData {
  tracedLetters: LetterId[];
  crownedLetters: LetterId[];
}

export const SLATE_WIDTH = 700;
export const SLATE_HEIGHT = 520;
export const STROKE_WIDTH = 26;

export const SKY_LINE_Y = 95;
export const FENCE_LINE_Y = 235;
export const GRASS_LINE_Y = 385;
export const ROOT_LINE_Y = 475;

const HALF_CAP = STROKE_WIDTH / 2; // 13
const Y_SKY = SKY_LINE_Y + HALF_CAP; // 108
const Y_FENCE = FENCE_LINE_Y + HALF_CAP; // 248
const Y_MID = Math.round((Y_SKY + (GRASS_LINE_Y - HALF_CAP)) / 2); // 240
const Y_GRASS = GRASS_LINE_Y - HALF_CAP; // 372
const Y_ROOT = ROOT_LINE_Y - HALF_CAP; // 462

export const STRAIGHT_LETTERS: readonly LetterId[] = ['L', 'I', 'T', 'F', 'E', 'H'];
export const SLANT_LETTERS: readonly LetterId[] = ['V', 'W', 'X', 'Y', 'Z', 'A', 'K', 'M', 'N'];
export const MAGIC_C_LETTERS: readonly LetterId[] = [
  'C', 'O', 'Q', 'G', 'S', 'D', 'P', 'B', 'R', 'J', 'U',
];
export const REVERSAL_GUARD_LETTERS: readonly LetterId[] = ['B', 'D', 'P', 'Q'];

export const DESCENDER_LOWER_LETTERS = new Set<LetterId>(['G', 'J', 'P', 'Q', 'Y']);

const TRACE_MASTERY_KEY = 'pebble.letter-trace.mastery.v1';

export function getDefaultLetterTraceConfig(): LetterTraceConfig {
  return {
    selectedLetters: [...ALL_LETTERS],
    caseMode: 'both',
    roundSize: 6,
    orderMode: 'alphabetical',
  };
}

export function isValidLetterTraceConfig(value: unknown): value is LetterTraceConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<LetterTraceConfig>;
  if (
    !Array.isArray(c.selectedLetters) ||
    c.selectedLetters.length === 0 ||
    c.selectedLetters.length > 26 ||
    !c.selectedLetters.every((item) => isValidLetterId(item))
  ) {
    return false;
  }
  if (c.caseMode !== 'both' && c.caseMode !== 'upper' && c.caseMode !== 'lower') {
    return false;
  }
  if (c.roundSize !== 4 && c.roundSize !== 6 && c.roundSize !== 10) {
    return false;
  }
  if (c.orderMode !== 'alphabetical' && c.orderMode !== 'shuffle') {
    return false;
  }
  return true;
}

type SegmentDef =
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

interface StrokeDef {
  kind?: 'line' | 'dot';
  hint: string;
  segments?: readonly SegmentDef[];
  dotPoint?: TracePoint;
  ghostOffset?: { dx: number; dy: number };
}

function ln(x1: number, y1: number, x2: number, y2: number): SegmentDef {
  return { type: 'L', x1, y1, x2, y2 };
}

function cb(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  p3: readonly [number, number],
): SegmentDef {
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

function stroke(
  hint: string,
  segments: readonly SegmentDef[],
  ghostOffset?: { dx: number; dy: number },
): StrokeDef {
  return { kind: 'line', hint, segments, ghostOffset };
}

function dot(hint: string, x: number, y: number): StrokeDef {
  return { kind: 'dot', hint, dotPoint: { x, y } };
}

function magicCUpper(hint: string): StrokeDef {
  return stroke(hint, [
    cb([62, 138], [38, 108], [22, Y_SKY], [6, Y_SKY]),
    cb([6, Y_SKY], [-42, Y_SKY], [-72, 166], [-72, Y_MID]),
    cb([-72, Y_MID], [-72, 314], [-42, Y_GRASS], [6, Y_GRASS]),
    cb([6, Y_GRASS], [26, Y_GRASS], [44, 366], [62, 342]),
  ]);
}

function ovalUpper(hint: string): StrokeDef {
  return stroke(hint, [
    cb([0, Y_SKY], [-56, Y_SKY], [-74, 166], [-74, Y_MID]),
    cb([-74, Y_MID], [-74, 314], [-56, Y_GRASS], [0, Y_GRASS]),
    cb([0, Y_GRASS], [56, Y_GRASS], [74, 314], [74, Y_MID]),
    cb([74, Y_MID], [74, 166], [56, Y_SKY], [0, Y_SKY]),
  ]);
}

function magicCLower(hint: string, closeRight = true): StrokeDef {
  const topLeft: readonly [number, number] = [42, 268];
  const segments: SegmentDef[] = [
    cb(topLeft, [26, Y_FENCE], [0, Y_FENCE], [-22, 254]),
    cb([-22, 254], [-52, 266], [-54, 310], [-50, 338]),
    cb([-50, 338], [-44, 368], [-16, Y_GRASS], [8, 370]),
    closeRight
      ? cb([8, 370], [30, 368], [44, 344], [44, 312])
      : cb([8, 370], [28, 370], [38, 364], [46, 348]),
  ];
  return stroke(hint, segments);
}

/**
 * Hand-crafted school-manuscript stroke specs for all 26 Capital letters (relative x around centerX).
 */
const UPPER_STROKES: Record<LetterId, readonly StrokeDef[]> = {
  A: [
    stroke('Slant down to the left', [ln(0, Y_SKY, -76, Y_GRASS)]),
    stroke('Slant down to the right', [ln(0, Y_SKY, 76, Y_GRASS)], { dx: 42, dy: -4 }),
    stroke('Draw the bridge across', [ln(-48, 272, 48, 272)]),
  ],
  B: [
    stroke('Tall line straight down', [ln(-54, Y_SKY, -54, Y_GRASS)]),
    stroke(
      'Top bump around to the middle',
      [
        cb([-54, Y_SKY], [10, Y_SKY], [50, 124], [50, 174]),
        cb([50, 174], [50, 224], [10, 238], [-54, 238]),
      ],
      { dx: 44, dy: 0 },
    ),
    stroke(
      'Bottom bump around to the grass',
      [
        cb([-54, 238], [16, 238], [58, 258], [58, 305]),
        cb([58, 305], [58, 354], [16, Y_GRASS], [-54, Y_GRASS]),
      ],
      { dx: 44, dy: 24 },
    ),
  ],
  C: [magicCUpper('Big Magic C curve around')],
  D: [
    stroke('Tall line straight down', [ln(-54, Y_SKY, -54, Y_GRASS)]),
    stroke(
      'Big curve around the right',
      [
        cb([-54, Y_SKY], [12, Y_SKY], [66, 148], [66, Y_MID]),
        cb([66, Y_MID], [66, 332], [12, Y_GRASS], [-54, Y_GRASS]),
      ],
      { dx: 44, dy: 0 },
    ),
  ],
  E: [
    stroke('Tall line straight down', [ln(-48, Y_SKY, -48, Y_GRASS)]),
    stroke('Top bar across', [ln(-48, Y_SKY, 52, Y_SKY)], { dx: 44, dy: 0 }),
    stroke('Middle bar across', [ln(-48, Y_MID, 38, Y_MID)]),
    stroke('Bottom bar across', [ln(-48, Y_GRASS, 54, Y_GRASS)]),
  ],
  F: [
    stroke('Tall line straight down', [ln(-46, Y_SKY, -46, Y_GRASS)]),
    stroke('Top bar across', [ln(-46, Y_SKY, 52, Y_SKY)], { dx: 44, dy: 0 }),
    stroke('Middle bar across', [ln(-46, Y_MID, 36, Y_MID)]),
  ],
  G: [
    stroke('Big Magic C curve up to the fence', [
      cb([62, 138], [38, Y_SKY], [22, Y_SKY], [6, Y_SKY]),
      cb([6, Y_SKY], [-42, Y_SKY], [-72, 166], [-72, Y_MID]),
      cb([-72, Y_MID], [-72, 314], [-42, Y_GRASS], [6, Y_GRASS]),
      cb([6, Y_GRASS], [48, Y_GRASS], [68, 332], [68, 246]),
    ]),
    stroke('Short shelf bar across to the curve', [ln(14, 246, 68, 246)]),
  ],
  H: [
    stroke('Left tall line down', [ln(-54, Y_SKY, -54, Y_GRASS)]),
    stroke('Right tall line down', [ln(54, Y_SKY, 54, Y_GRASS)]),
    stroke('Bridge across the middle', [ln(-54, Y_MID, 54, Y_MID)]),
  ],
  I: [
    stroke('Center tall line down', [ln(0, Y_SKY, 0, Y_GRASS)]),
    stroke('Top hat across', [ln(-46, Y_SKY, 46, Y_SKY)]),
    stroke('Bottom shoe across', [ln(-46, Y_GRASS, 46, Y_GRASS)]),
  ],
  J: [
    stroke('Straight down and hook left', [
      ln(24, Y_SKY, 24, 304),
      cb([24, 304], [24, 354], [-6, Y_GRASS], [-34, Y_GRASS]),
      cb([-34, Y_GRASS], [-54, Y_GRASS], [-62, 356], [-64, 332]),
    ]),
    stroke('Top bar across', [ln(-26, Y_SKY, 58, Y_SKY)], { dx: -36, dy: 0 }),
  ],
  K: [
    stroke('Tall line straight down', [ln(-54, Y_SKY, -54, Y_GRASS)]),
    stroke('Slant down in to the line', [ln(52, Y_SKY, -50, 244)]),
    stroke('Kick leg slant down right', [ln(-20, 208, 56, Y_GRASS)]),
  ],
  L: [
    stroke('Tall line straight down', [ln(-46, Y_SKY, -46, Y_GRASS)]),
    stroke('Bottom foot across right', [ln(-46, Y_GRASS, 52, Y_GRASS)], { dx: 40, dy: 0 }),
  ],
  M: [
    stroke('Left tall line down', [ln(-66, Y_SKY, -66, Y_GRASS)]),
    stroke('Slant down to the center', [ln(-66, Y_SKY, 0, 260)], { dx: 40, dy: -4 }),
    stroke('Slant up to the top right', [ln(0, 260, 66, Y_SKY)]),
    stroke('Right tall line down', [ln(66, Y_SKY, 66, Y_GRASS)], { dx: 24, dy: -22 }),
  ],
  N: [
    stroke('Left tall line down', [ln(-54, Y_SKY, -54, Y_GRASS)]),
    stroke('Slant down across to bottom right', [ln(-54, Y_SKY, 54, Y_GRASS)], { dx: 42, dy: -4 }),
    stroke('Right tall line down', [ln(54, Y_SKY, 54, Y_GRASS)]),
  ],
  O: [ovalUpper('Curve counter-clockwise around the O')],
  P: [
    stroke('Tall line straight down', [ln(-48, Y_SKY, -48, Y_GRASS)]),
    stroke(
      'Top bump around the right',
      [
        cb([-48, Y_SKY], [16, Y_SKY], [58, 128], [58, 178]),
        cb([58, 178], [58, 228], [16, 248], [-48, 248]),
      ],
      { dx: 44, dy: 0 },
    ),
  ],
  Q: [
    ovalUpper('Curve around the O first'),
    stroke('Kick the tail slant out right', [ln(14, 298, 66, 376)]),
  ],
  R: [
    stroke('Tall line straight down', [ln(-50, Y_SKY, -50, Y_GRASS)]),
    stroke(
      'Top bump around the right',
      [
        cb([-50, Y_SKY], [16, Y_SKY], [56, 128], [56, 178]),
        cb([56, 178], [56, 228], [16, 246], [-50, 246]),
      ],
      { dx: 44, dy: 0 },
    ),
    stroke('Kick leg slant down right', [ln(-4, 246, 58, Y_GRASS)]),
  ],
  S: [
    stroke('Curve back like C, then swing forward', [
      cb([48, 136], [34, Y_SKY], [-2, Y_SKY], [-34, 124]),
      cb([-34, 124], [-64, 140], [-60, 196], [0, 234]),
      cb([0, 234], [66, 274], [68, 334], [24, 362]),
      cb([24, 362], [-12, 378], [-44, 366], [-56, 336]),
    ]),
  ],
  T: [
    stroke('Center tall line down', [ln(0, Y_SKY, 0, Y_GRASS)]),
    stroke('Top bar across', [ln(-64, Y_SKY, 64, Y_SKY)], { dx: -38, dy: 0 }),
  ],
  U: [
    stroke('Down, curve around the bottom, and up', [
      ln(-58, Y_SKY, -58, 286),
      cb([-58, 286], [-58, 348], [-28, Y_GRASS], [0, Y_GRASS]),
      cb([0, Y_GRASS], [28, Y_GRASS], [58, 348], [58, 286]),
      ln(58, 286, 58, Y_SKY),
    ]),
  ],
  V: [
    stroke('Slant down to the bottom point', [ln(-64, Y_SKY, 0, Y_GRASS)]),
    stroke('Slant up to the top right', [ln(0, Y_GRASS, 64, Y_SKY)], { dx: 42, dy: -22 }),
  ],
  W: [
    stroke('Slant down left', [ln(-84, Y_SKY, -42, Y_GRASS)]),
    stroke('Slant up to center', [ln(-42, Y_GRASS, 0, 178)], { dx: 26, dy: -24 }),
    stroke('Slant down right', [ln(0, 178, 42, Y_GRASS)], { dx: 26, dy: 24 }),
    stroke('Slant up right', [ln(42, Y_GRASS, 84, Y_SKY)], { dx: 36, dy: -24 }),
  ],
  X: [
    stroke('Slant down from left to right', [ln(-58, Y_SKY, 58, Y_GRASS)]),
    stroke('Slant down from right to left', [ln(58, Y_SKY, -58, Y_GRASS)]),
  ],
  Y: [
    stroke('Slant down from top left to center', [ln(-56, Y_SKY, 0, Y_MID)]),
    stroke('Slant down from top right to center', [ln(56, Y_SKY, 0, Y_MID)]),
    stroke('Straight line down to the grass', [ln(0, Y_MID, 0, Y_GRASS)], { dx: 0, dy: 38 }),
  ],
  Z: [
    stroke('Across right, slant down left, across right', [
      ln(-54, Y_SKY, 54, Y_SKY),
      ln(54, Y_SKY, -54, Y_GRASS),
      ln(-54, Y_GRASS, 54, Y_GRASS),
    ]),
  ],
};

/**
 * Hand-crafted school-manuscript stroke specs for all 26 Small letters (a–z).
 */
const LOWER_STROKES: Record<Lowercase<LetterId>, readonly StrokeDef[]> = {
  a: [
    magicCLower('Magic C curve around first'),
    stroke('Short line straight down', [ln(46, Y_FENCE, 46, Y_GRASS)]),
  ],
  b: [
    stroke('Tall line down first (bat then ball!)', [ln(-44, Y_SKY, -44, Y_GRASS)]),
    stroke(
      'Bump clockwise around the right',
      [
        cb([-44, 294], [-28, 252], [4, Y_FENCE], [28, 256]),
        cb([28, 256], [54, 268], [54, 312], [48, 342]),
        cb([48, 342], [38, Y_GRASS], [-8, 376], [-44, 346]),
      ],
      { dx: 34, dy: -2 },
    ),
  ],
  c: [magicCLower('Little Magic C curve around', false)],
  d: [
    magicCLower('Magic C curve first (donut then stick!)'),
    stroke('Tall line down to the grass', [ln(46, Y_SKY, 46, Y_GRASS)]),
  ],
  e: [
    stroke('Go across right, then curve up and around', [
      ln(-46, 308, 46, 308),
      cb([46, 308], [48, 268], [24, Y_FENCE], [-2, Y_FENCE]),
      cb([-2, Y_FENCE], [-36, Y_FENCE], [-52, 276], [-52, 312]),
      cb([-52, 312], [-52, 352], [-22, Y_GRASS], [12, Y_GRASS]),
      cb([12, Y_GRASS], [32, Y_GRASS], [44, 362], [48, 350]),
    ]),
  ],
  f: [
    stroke('Candy-cane hook down to the grass', [
      cb([36, 130], [24, Y_SKY], [-8, Y_SKY], [-16, 148]),
      ln(-16, 148, -16, Y_GRASS),
    ]),
    stroke('Crossbar along the fence line', [ln(-48, Y_FENCE, 32, Y_FENCE)]),
  ],
  g: [
    magicCLower('Magic C curve around first'),
    stroke('Dive down to the root line and hook left', [
      ln(46, Y_FENCE, 46, 412),
      cb([46, 412], [46, 456], [12, 464], [-18, Y_ROOT]),
      cb([-18, Y_ROOT], [-36, 458], [-46, 446], [-50, 434]),
    ]),
  ],
  h: [
    stroke('Tall line down from the sky', [ln(-44, Y_SKY, -44, Y_GRASS)]),
    stroke(
      'Hop over from the fence and down',
      [
        cb([-44, 294], [-28, 250], [16, Y_FENCE], [36, 268]),
        cb([36, 268], [42, 278], [42, 294], [42, Y_GRASS]),
      ],
      { dx: 36, dy: -6 },
    ),
  ],
  i: [
    stroke('Short line down', [ln(0, Y_FENCE, 0, Y_GRASS)]),
    dot('Tap the dot above the fence!', 0, 192),
  ],
  j: [
    stroke('Dive down to the root and hook left', [
      ln(14, Y_FENCE, 14, 416),
      cb([14, 416], [14, 456], [-12, Y_ROOT], [-38, 456]),
    ]),
    dot('Tap the dot above!', 14, 192),
  ],
  k: [
    stroke('Tall line down from the sky', [ln(-44, Y_SKY, -44, Y_GRASS)]),
    stroke('Slant down in to the line', [ln(34, Y_FENCE, -40, 314)]),
    stroke('Kick leg slant down right', [ln(-18, 296, 38, Y_GRASS)]),
  ],
  l: [stroke('Tall line straight down', [ln(0, Y_SKY, 0, Y_GRASS)])],
  m: [
    stroke('Short line down', [ln(-66, Y_FENCE, -66, Y_GRASS)]),
    stroke(
      'First hop over and down',
      [
        cb([-66, 286], [-54, 250], [-14, Y_FENCE], [-2, 268]),
        cb([-2, 268], [0, 276], [0, 286], [0, 296]),
        ln(0, 296, 0, Y_GRASS),
      ],
      { dx: 30, dy: -6 },
    ),
    stroke(
      'Second hop over and down',
      [
        cb([0, 286], [12, 250], [52, Y_FENCE], [64, 268]),
        cb([64, 268], [66, 276], [66, 286], [66, 296]),
        ln(66, 296, 66, Y_GRASS),
      ],
      { dx: 30, dy: -6 },
    ),
  ],
  n: [
    stroke('Short line down', [ln(-44, Y_FENCE, -44, Y_GRASS)]),
    stroke(
      'Hop over and down',
      [
        cb([-44, 288], [-30, 250], [14, Y_FENCE], [32, 268]),
        cb([32, 268], [40, 278], [42, 290], [42, Y_GRASS]),
      ],
      { dx: 34, dy: -6 },
    ),
  ],
  o: [
    stroke('Curve counter-clockwise around the little o', [
      cb([0, Y_FENCE], [-34, Y_FENCE], [-52, 274], [-52, 310]),
      cb([-52, 310], [-52, 346], [-34, Y_GRASS], [0, Y_GRASS]),
      cb([0, Y_GRASS], [34, Y_GRASS], [52, 346], [52, 310]),
      cb([52, 310], [52, 274], [34, Y_FENCE], [0, Y_FENCE]),
    ]),
  ],
  p: [
    stroke('Dive straight down to the root line', [ln(-44, Y_FENCE, -44, Y_ROOT)]),
    stroke(
      'Bump clockwise around the right',
      [
        cb([-44, 294], [-28, 252], [4, Y_FENCE], [28, 256]),
        cb([28, 256], [54, 268], [54, 312], [48, 342]),
        cb([48, 342], [38, Y_GRASS], [-8, 376], [-44, 346]),
      ],
      { dx: 36, dy: -2 },
    ),
  ],
  q: [
    magicCLower('Magic C curve around first'),
    stroke('Dive down to the root and flick right', [
      ln(44, Y_FENCE, 44, Y_ROOT),
      ln(44, Y_ROOT, 72, 434),
    ]),
  ],
  r: [
    stroke('Short line down', [ln(-32, Y_FENCE, -32, Y_GRASS)]),
    stroke(
      'Curve a little roof right',
      [cb([-32, 288], [-20, 252], [10, Y_FENCE], [38, 262])],
      { dx: 30, dy: -6 },
    ),
  ],
  s: [
    stroke('Wiggle back then forward like a snake', [
      cb([36, 266], [24, Y_FENCE], [0, Y_FENCE], [-22, 256]),
      cb([-22, 256], [-42, 266], [-38, 292], [0, 310]),
      cb([0, 310], [42, 328], [44, 356], [14, 368]),
      cb([14, 368], [-8, Y_GRASS], [-30, 366], [-40, 352]),
    ]),
  ],
  t: [
    stroke('Tall line down with a gentle foot', [
      ln(0, 146, 0, 344),
      cb([0, 344], [0, 368], [14, Y_GRASS], [32, 368]),
    ]),
    stroke('Crossbar along the fence', [ln(-38, Y_FENCE, 38, Y_FENCE)]),
  ],
  u: [
    stroke('Down, curve around the cup, and up', [
      ln(-44, Y_FENCE, -44, 330),
      cb([-44, 330], [-44, 364], [-22, Y_GRASS], [4, 370]),
      cb([4, 370], [28, 368], [44, 344], [44, 314]),
    ]),
    stroke('Short line straight down', [ln(46, Y_FENCE, 46, Y_GRASS)]),
  ],
  v: [
    stroke('Slant down to bottom point', [ln(-46, Y_FENCE, 0, Y_GRASS)]),
    stroke('Slant up to fence right', [ln(0, Y_GRASS, 46, Y_FENCE)], { dx: 36, dy: -18 }),
  ],
  w: [
    stroke('Slant down left', [ln(-66, Y_FENCE, -33, Y_GRASS)]),
    stroke('Slant up to fence', [ln(-33, Y_GRASS, 0, 278)], { dx: 24, dy: -18 }),
    stroke('Slant down right', [ln(0, 278, 33, Y_GRASS)], { dx: 24, dy: 18 }),
    stroke('Slant up right', [ln(33, Y_GRASS, 66, Y_FENCE)], { dx: 32, dy: -18 }),
  ],
  x: [
    stroke('Slant down left to right', [ln(-44, Y_FENCE, 44, Y_GRASS)]),
    stroke('Slant down right to left', [ln(44, Y_FENCE, -44, Y_GRASS)]),
  ],
  y: [
    stroke('Short slant down to the grass', [ln(-44, Y_FENCE, 0, 368)]),
    stroke('Long slant down to the root', [ln(44, Y_FENCE, -32, Y_ROOT)]),
  ],
  z: [
    stroke('Across, slant down left, across', [
      ln(-44, Y_FENCE, 44, Y_FENCE),
      ln(44, Y_FENCE, -44, Y_GRASS),
      ln(-44, Y_GRASS, 46, Y_GRASS),
    ]),
  ],
};

function evalCubic(
  seg: Extract<SegmentDef, { type: 'C' }>,
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

function buildDensePolyline(segments: readonly SegmentDef[], offsetX: number): {
  dense: TracePoint[];
  cumLen: number[];
  svgPath: string;
} {
  const parts: string[] = [];
  const rawPts: TracePoint[] = [];

  segments.forEach((seg, segIdx) => {
    if (seg.type === 'L') {
      const x1 = seg.x1 + offsetX;
      const x2 = seg.x2 + offsetX;
      if (segIdx === 0) {
        parts.push(`M ${x1.toFixed(1)} ${seg.y1.toFixed(1)}`);
        rawPts.push({ x: x1, y: seg.y1 });
      }
      parts.push(`L ${x2.toFixed(1)} ${seg.y2.toFixed(1)}`);
      const steps = Math.max(8, Math.ceil(Math.hypot(x2 - x1, seg.y2 - seg.y1) / 4));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        rawPts.push({
          x: x1 + (x2 - x1) * t,
          y: seg.y1 + (seg.y2 - seg.y1) * t,
        });
      }
    } else {
      const p0x = seg.x0 + offsetX;
      const p1x = seg.x1 + offsetX;
      const p2x = seg.x2 + offsetX;
      const p3x = seg.x3 + offsetX;
      if (segIdx === 0) {
        parts.push(`M ${p0x.toFixed(1)} ${seg.y0.toFixed(1)}`);
        rawPts.push({ x: p0x, y: seg.y0 });
      }
      parts.push(
        `C ${p1x.toFixed(1)} ${seg.y1.toFixed(1)} ${p2x.toFixed(1)} ${seg.y2.toFixed(1)} ${p3x.toFixed(1)} ${seg.y3.toFixed(1)}`,
      );
      const shiftedSeg = {
        ...seg,
        x0: p0x,
        x1: p1x,
        x2: p2x,
        x3: p3x,
      };
      const steps = 28;
      for (let i = 1; i <= steps; i += 1) {
        rawPts.push(evalCubic(shiftedSeg, i / steps));
      }
    }
  });

  // Re-sample uniformly into 80 equidistant samples for smooth projection & pebble glide
  const rawCum: number[] = [0];
  for (let i = 1; i < rawPts.length; i += 1) {
    rawCum.push(rawCum[i - 1] + Math.hypot(rawPts[i].x - rawPts[i - 1].x, rawPts[i].y - rawPts[i - 1].y));
  }
  const total = rawCum[rawCum.length - 1] || 1;
  const sampleCount = 80;
  const dense: TracePoint[] = [];
  const cumLen: number[] = [];

  let cursor = 0;
  for (let k = 0; k < sampleCount; k += 1) {
    const targetDist = (total * k) / (sampleCount - 1);
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
    cumLen.push(targetDist);
  }

  return { dense, cumLen, svgPath: parts.join(' ') };
}

export function pointAlongStroke(strokeSpec: ResolvedTraceStroke, progress: number): TracePoint {
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

function angleAtStrokeProgress(strokeSpec: ResolvedTraceStroke, progress: number): number {
  const p0 = pointAlongStroke(strokeSpec, Math.max(0, progress - 0.04));
  const p1 = pointAlongStroke(strokeSpec, Math.min(1, progress + 0.04));
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
}

function resolveGlyphStrokes(
  glyphCase: 'upper' | 'lower',
  defs: readonly StrokeDef[],
  offsetX: number,
  startingOrder: number,
): ResolvedTraceStroke[] {
  return defs.map((def, idx) => {
    const order = startingOrder + idx;
    if (def.kind === 'dot' && def.dotPoint) {
      const pt = { x: def.dotPoint.x + offsetX, y: def.dotPoint.y };
      return {
        order,
        glyphCase,
        kind: 'dot',
        hint: def.hint,
        svgPath: `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
        start: pt,
        end: pt,
        ghostBadgePos: pt,
        totalLength: 0,
        samples: [pt],
        cumulativeLengths: [0],
        arrows: [],
      };
    }

    const segments = def.segments ?? [];
    const { dense, cumLen, svgPath } = buildDensePolyline(segments, offsetX);
    const start = dense[0] ?? { x: offsetX, y: Y_MID };
    const end = dense[dense.length - 1] ?? start;
    const totalLength = cumLen[cumLen.length - 1] ?? 1;
    const ghostBadgePos = def.ghostOffset
      ? { x: start.x + def.ghostOffset.dx, y: start.y + def.ghostOffset.dy }
      : start;

    const arrowFractions = totalLength > 190 ? [0.22, 0.56, 0.86] : [0.32, 0.78];
    const tmp: ResolvedTraceStroke = {
      order,
      glyphCase,
      kind: 'line',
      hint: def.hint,
      svgPath,
      start,
      end,
      ghostBadgePos,
      totalLength,
      samples: dense,
      cumulativeLengths: cumLen,
      arrows: [],
    };
    const arrows: TraceArrowCue[] = arrowFractions.map((frac) => {
      const pt = pointAlongStroke(tmp, frac);
      return {
        x: pt.x,
        y: pt.y,
        angleDeg: angleAtStrokeProgress(tmp, frac),
      };
    });

    return {
      ...tmp,
      arrows,
    };
  });
}

export function buildLetterTraceSpec(
  letter: LetterId,
  caseMode: TraceCaseMode,
): LetterTraceSpec {
  const upperDefs = UPPER_STROKES[letter];
  const lowerDefs = LOWER_STROKES[letter.toLowerCase() as Lowercase<LetterId>];
  const hasDescender = caseMode !== 'upper' && DESCENDER_LOWER_LETTERS.has(letter);

  if (caseMode === 'upper') {
    const strokes = resolveGlyphStrokes('upper', upperDefs, 350, 1);
    return {
      letter,
      hasDescender: false,
      strokes,
      glyphs: [
        {
          glyphCase: 'upper',
          label: `Capital ${letter}`,
          centerX: 350,
          hasDescender: false,
          startOrder: 1,
          endOrder: strokes.length,
        },
      ],
    };
  }

  if (caseMode === 'lower') {
    const strokes = resolveGlyphStrokes('lower', lowerDefs, 350, 1);
    return {
      letter,
      hasDescender,
      strokes,
      glyphs: [
        {
          glyphCase: 'lower',
          label: `Small ${letter.toLowerCase()}`,
          centerX: 350,
          hasDescender,
          startOrder: 1,
          endOrder: strokes.length,
        },
      ],
    };
  }

  const upperStrokes = resolveGlyphStrokes('upper', upperDefs, 206, 1);
  const lowerStrokes = resolveGlyphStrokes(
    'lower',
    lowerDefs,
    522,
    upperStrokes.length + 1,
  );

  return {
    letter,
    hasDescender,
    strokes: [...upperStrokes, ...lowerStrokes],
    glyphs: [
      {
        glyphCase: 'upper',
        label: `Capital ${letter}`,
        centerX: 206,
        hasDescender: false,
        startOrder: 1,
        endOrder: upperStrokes.length,
      },
      {
        glyphCase: 'lower',
        label: `Small ${letter.toLowerCase()}`,
        centerX: 522,
        hasDescender,
        startOrder: upperStrokes.length + 1,
        endOrder: upperStrokes.length + lowerStrokes.length,
      },
    ],
  };
}

/**
 * Projects a pointer coordinate onto the closest forward point along the active stroke,
 * returning lateral distance from the centerline and normalized arc-length progress [0, 1].
 */
export function projectPointOntoStroke(
  strokeSpec: ResolvedTraceStroke,
  pt: TracePoint,
): { progress: number; distance: number; closest: TracePoint } {
  if (strokeSpec.kind === 'dot' || strokeSpec.samples.length <= 1) {
    const d = Math.hypot(pt.x - strokeSpec.start.x, pt.y - strokeSpec.start.y);
    return { progress: 1, distance: d, closest: strokeSpec.start };
  }

  const samples = strokeSpec.samples;
  const cumLen = strokeSpec.cumulativeLengths;
  const total = strokeSpec.totalLength || 1;
  let bestDistSq = Infinity;
  let bestLen = 0;
  let bestPt = samples[0];

  for (let i = 0; i < samples.length - 1; i += 1) {
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
      bestPt = { x: cx, y: cy };
    }
  }

  return {
    progress: Math.max(0, Math.min(1, bestLen / total)),
    distance: Math.sqrt(bestDistSq),
    closest: bestPt,
  };
}

const wordCursorByLetter = new Map<LetterId, number>();

export function pickRotatingWordForLetter(letter: LetterId): LetterWordSpec {
  const station = getStationSpec(letter);
  const words = station.words;
  const prev = wordCursorByLetter.get(letter) ?? -1;
  const next = (prev + 1) % Math.max(1, words.length);
  wordCursorByLetter.set(letter, next);
  return words[next] ?? words[0];
}

function sanitizeLetterArray(raw: unknown): LetterId[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter((item): item is LetterId => isValidLetterId(item));
  return ALL_LETTERS.filter((l) => valid.includes(l));
}

export function loadTraceMastery(): TraceMasteryData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { tracedLetters: [], crownedLetters: [] };
    }
    const raw = window.localStorage.getItem(TRACE_MASTERY_KEY);
    if (!raw) return { tracedLetters: [], crownedLetters: [] };
    const parsed = JSON.parse(raw) as Partial<TraceMasteryData>;
    return {
      tracedLetters: sanitizeLetterArray(parsed?.tracedLetters),
      crownedLetters: sanitizeLetterArray(parsed?.crownedLetters),
    };
  } catch {
    return { tracedLetters: [], crownedLetters: [] };
  }
}

export function saveTraceLetterMastery(letter: LetterId, crowned: boolean): TraceMasteryData {
  const current = loadTraceMastery();
  const tracedSet = new Set<LetterId>(current.tracedLetters);
  const crownedSet = new Set<LetterId>(current.crownedLetters);
  tracedSet.add(letter);
  if (crowned) {
    crownedSet.add(letter);
  }
  const next: TraceMasteryData = {
    tracedLetters: ALL_LETTERS.filter((l) => tracedSet.has(l)),
    crownedLetters: ALL_LETTERS.filter((l) => crownedSet.has(l)),
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TRACE_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota / private mode failures
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

export function buildTraceDeck(
  config: LetterTraceConfig,
  mastery: TraceMasteryData,
): LetterId[] {
  const pool =
    config.selectedLetters.length > 0
      ? ALL_LETTERS.filter((l) => config.selectedLetters.includes(l))
      : [...ALL_LETTERS];

  const targetCount = Math.min(config.roundSize, Math.max(pool.length, 1));
  if (pool.length <= config.roundSize) {
    return config.orderMode === 'shuffle' ? secureShuffle(pool) : pool;
  }

  if (config.orderMode === 'shuffle') {
    const uncrowned = pool.filter((l) => !mastery.crownedLetters.includes(l));
    const crowned = pool.filter((l) => mastery.crownedLetters.includes(l));
    const combined = [...secureShuffle(uncrowned), ...secureShuffle(crowned)];
    return combined.slice(0, targetCount);
  }

  // Alphabetical: rotate cleanly starting at the first un-crowned selected letter when possible
  const firstUncrownedIdx = pool.findIndex((l) => !mastery.crownedLetters.includes(l));
  const startIdx = firstUncrownedIdx >= 0 ? firstUncrownedIdx : 0;
  const deck: LetterId[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    deck.push(pool[(startIdx + i) % pool.length]);
  }
  return deck;
}

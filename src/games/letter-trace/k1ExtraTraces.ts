import type { SkillType } from '../../curriculum/curriculumTypes';
import { isValidLetterId, type LetterId } from '../letter-train/letterData';
import {
  DESCENDER_LOWER_LETTERS,
  LOWER_STROKES,
  Y_GRASS,
  Y_MID,
  Y_SKY,
  buildLetterTraceSpec,
  buildTraceDeck,
  cb,
  ln,
  resolveGlyphStrokes,
  stroke,
  type LetterTraceConfig,
  type LetterTraceSpec,
  type ResolvedGlyphSummary,
  type ResolvedTraceStroke,
  type StrokeDef,
  type TraceMasteryData,
  type TraceNumberRange,
} from './traceData';

export interface GenericTraceItemSpec {
  id: string;
  badgeText: string;
  title: string;
  completeSubtext: string;
  conceptId: string;
  conceptLabel: string;
  skillType: SkillType;
  spec: LetterTraceSpec;
  audioKind: 'letter' | 'number' | 'word';
  audioTarget: string;
}

const DIGIT_STROKES: Record<string, readonly StrokeDef[]> = {
  '0': [
    stroke('Curve counter-clockwise around Zero', [
      cb([0, Y_SKY], [-52, Y_SKY], [-68, 166], [-68, Y_MID]),
      cb([-68, Y_MID], [-68, 314], [-52, Y_GRASS], [0, Y_GRASS]),
      cb([0, Y_GRASS], [52, Y_GRASS], [68, 314], [68, Y_MID]),
      cb([68, Y_MID], [68, 166], [52, Y_SKY], [0, Y_SKY]),
    ]),
  ],
  '1': [
    stroke('Tall straight line down from Sky to Grass', [ln(0, Y_SKY, 0, Y_GRASS)]),
  ],
  '2': [
    stroke('Curve around the top, slant down left, slide across!', [
      cb([-48, 156], [-42, Y_SKY], [40, Y_SKY], [54, 162]),
      cb([54, 162], [60, 206], [16, 258], [-56, Y_GRASS]),
      ln(-56, Y_GRASS, 58, Y_GRASS),
    ]),
  ],
  '3': [
    stroke('Curve around the top bump, then around the bottom bump!', [
      cb([-48, 142], [-34, Y_SKY], [48, Y_SKY], [50, 174]),
      cb([50, 174], [50, 224], [12, 238], [-16, 238]),
      cb([-16, 238], [26, 238], [58, 260], [56, 312]),
      cb([56, 312], [54, 360], [-28, Y_GRASS], [-54, 336]),
    ]),
  ],
  '4': [
    stroke('Down to the middle, then slide across right', [
      ln(-48, Y_SKY, -54, 264),
      ln(-54, 264, 62, 264),
    ]),
    stroke('Tall line straight down through the cross', [ln(26, Y_SKY, 26, Y_GRASS)]),
  ],
  '5': [
    stroke('Short line down, then curve a big belly around!', [
      ln(-42, Y_SKY, -48, 226),
      cb([-48, 226], [28, 206], [62, 250], [56, 310]),
      cb([56, 310], [50, 362], [-24, Y_GRASS], [-54, 338]),
    ]),
    stroke('Hat across the top to the right', [ln(-42, Y_SKY, 50, Y_SKY)], { dx: 42, dy: 0 }),
  ],
  '6': [
    stroke('Curve down from Sky and loop into a bottom circle!', [
      cb([36, Y_SKY], [-26, 126], [-58, 210], [-58, 294]),
      cb([-58, 294], [-58, 354], [-22, Y_GRASS], [8, Y_GRASS]),
      cb([8, Y_GRASS], [48, Y_GRASS], [60, 336], [56, 296]),
      cb([56, 296], [52, 250], [-4, 236], [-54, 278]),
    ]),
  ],
  '7': [
    stroke('Slide across the Sky line, then slant down!', [
      ln(-54, Y_SKY, 56, Y_SKY),
      ln(56, Y_SKY, -22, Y_GRASS),
    ]),
  ],
  '8': [
    stroke('Make an S curve down, then loop back up to the top!', [
      cb([0, Y_SKY], [-56, Y_SKY], [-58, 198], [0, 236]),
      cb([0, 236], [62, 274], [58, Y_GRASS], [0, Y_GRASS]),
      cb([0, Y_GRASS], [-58, Y_GRASS], [-62, 274], [0, 236]),
      cb([0, 236], [58, 198], [56, Y_SKY], [0, Y_SKY]),
    ]),
  ],
  '9': [
    stroke('Make a Magic C loop at the top, then straight down!', [
      cb([48, 174], [44, Y_SKY], [-48, Y_SKY], [-54, 176]),
      cb([-54, 176], [-58, 238], [26, 246], [48, 194]),
      ln(48, 146, 48, Y_GRASS),
    ]),
  ],
};

export type ShapeTraceId = 'circle' | 'square' | 'rectangle' | 'triangle';

export const ALL_SHAPE_TRACE_IDS: readonly ShapeTraceId[] = [
  'circle',
  'square',
  'rectangle',
  'triangle',
];

const SHAPE_DEFS: Record<
  ShapeTraceId,
  { label: string; badge: string; strokes: readonly StrokeDef[] }
> = {
  circle: {
    label: 'Circle',
    badge: '◯',
    strokes: [
      stroke('Curve smoothly all the way around the Circle!', [
        cb([0, 114], [-76, 114], [-126, 168], [-126, 240]),
        cb([-126, 240], [-126, 312], [-76, 366], [0, 366]),
        cb([0, 366], [76, 366], [126, 312], [126, 240]),
        cb([126, 240], [126, 168], [76, 114], [0, 114]),
      ]),
    ],
  },
  square: {
    label: 'Square',
    badge: '□',
    strokes: [
      stroke('Left side straight down', [ln(-118, 122, -118, 358)]),
      stroke('Bottom side straight across', [ln(-118, 358, 118, 358)], { dx: 36, dy: 0 }),
      stroke('Right side straight down', [ln(118, 122, 118, 358)], { dx: 0, dy: 34 }),
      stroke('Top side straight across', [ln(-118, 122, 118, 122)], { dx: 38, dy: 0 }),
    ],
  },
  rectangle: {
    label: 'Rectangle',
    badge: '▭',
    strokes: [
      stroke('Short left side down', [ln(-176, 152, -176, 332)]),
      stroke('Long bottom side across', [ln(-176, 332, 176, 332)], { dx: 40, dy: 0 }),
      stroke('Short right side down', [ln(176, 152, 176, 332)], { dx: 0, dy: 34 }),
      stroke('Long top side across', [ln(-176, 152, 176, 152)], { dx: 42, dy: 0 }),
    ],
  },
  triangle: {
    label: 'Triangle',
    badge: '△',
    strokes: [
      stroke('Slant down to the left corner', [ln(0, 114, -138, 360)]),
      stroke('Slant down to the right corner', [ln(0, 114, 138, 360)], { dx: 42, dy: 8 }),
      stroke('Close the bottom across!', [ln(-138, 360, 138, 360)], { dx: 40, dy: 0 }),
    ],
  },
};

export const TRACEABLE_WORDS = [
  'cat',
  'dog',
  'sun',
  'pig',
  'hat',
  'bus',
  'the',
  'see',
  'can',
  'you',
  'and',
  'for',
] as const;

export type TraceWordId = (typeof TRACEABLE_WORDS)[number];

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

export function getNumbersForRange(range: TraceNumberRange = '0-50'): string[] {
  if (range === '0-9') {
    return Array.from({ length: 10 }, (_, i) => String(i));
  }
  if (range === '10-20') {
    return Array.from({ length: 11 }, (_, i) => String(10 + i));
  }
  if (range === '21-50') {
    return Array.from({ length: 30 }, (_, i) => String(21 + i));
  }
  // Balanced K1 milestone pool across 0–50
  return [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10', '12', '15', '18', '20', '24', '30', '35', '42', '50',
  ];
}

export function isValidTraceDeckItem(item: unknown, config: LetterTraceConfig): item is string {
  if (typeof item !== 'string') return false;
  const mode = config.traceMode ?? 'letters';
  if (mode === 'letters') return isValidLetterId(item);
  if (mode === 'numbers') {
    const n = Number(item);
    return Number.isInteger(n) && n >= 0 && n <= 50 && String(n) === item;
  }
  if (mode === 'shapes') {
    return (ALL_SHAPE_TRACE_IDS as readonly string[]).includes(item);
  }
  return (TRACEABLE_WORDS as readonly string[]).includes(item);
}

export function buildAnyTraceDeck(
  config: LetterTraceConfig,
  mastery: TraceMasteryData,
): string[] {
  const mode = config.traceMode ?? 'letters';
  if (mode === 'letters') {
    return buildTraceDeck(config, mastery);
  }
  if (mode === 'shapes') {
    const base = [...ALL_SHAPE_TRACE_IDS];
    const ordered = config.orderMode === 'shuffle' ? secureShuffle(base) : base;
    return ordered.slice(0, Math.min(config.roundSize, ordered.length));
  }
  if (mode === 'words') {
    const base = [...TRACEABLE_WORDS];
    const ordered = config.orderMode === 'shuffle' ? secureShuffle(base) : base;
    return ordered.slice(0, Math.min(config.roundSize, ordered.length));
  }
  const numPool = getNumbersForRange(config.numberRange ?? '0-50');
  const ordered = config.orderMode === 'shuffle' ? secureShuffle(numPool) : numPool;
  return ordered.slice(0, Math.min(config.roundSize, ordered.length));
}

export function buildGenericTraceItem(
  itemId: string,
  config: LetterTraceConfig,
): GenericTraceItemSpec {
  const mode = config.traceMode ?? 'letters';

  if (mode === 'numbers') {
    const safeNum = Math.min(50, Math.max(0, Number(itemId) || 0));
    const text = String(safeNum);
    const digits = text.split('');
    const centers = digits.length === 1 ? [350] : [230, 470];
    const allStrokes: ResolvedTraceStroke[] = [];
    const glyphs: ResolvedGlyphSummary[] = [];

    digits.forEach((d, idx) => {
      const defs = DIGIT_STROKES[d] ?? DIGIT_STROKES['0'];
      const startOrder = allStrokes.length + 1;
      const resolved = resolveGlyphStrokes(
        idx === 0 ? 'upper' : 'lower',
        defs,
        centers[idx],
        startOrder,
      );
      allStrokes.push(...resolved);
      glyphs.push({
        glyphCase: idx === 0 ? 'upper' : 'lower',
        label: digits.length === 2 ? (idx === 0 ? `Tens (${d})` : `Ones (${d})`) : `Number ${d}`,
        centerX: centers[idx],
        hasDescender: false,
        startOrder,
        endOrder: allStrokes.length,
      });
    });

    return {
      id: text,
      badgeText: text,
      title: `Number ${text}`,
      completeSubtext: `Awesome! You wrote Number ${text}!`,
      conceptId: `number:${safeNum}`,
      conceptLabel: `Number ${text}`,
      skillType: 'number_sense_50',
      spec: {
        letter: 'A',
        hasDescender: false,
        strokes: allStrokes,
        glyphs,
      },
      audioKind: 'number',
      audioTarget: text,
    };
  }

  if (mode === 'shapes') {
    const shapeId: ShapeTraceId = (ALL_SHAPE_TRACE_IDS as readonly string[]).includes(itemId)
      ? (itemId as ShapeTraceId)
      : 'circle';
    const def = SHAPE_DEFS[shapeId];
    const strokes = resolveGlyphStrokes('upper', def.strokes, 350, 1);
    return {
      id: shapeId,
      badgeText: def.badge,
      title: def.label,
      completeSubtext: `Wonderful! You drew a ${def.label}!`,
      conceptId: `shape-trace:${shapeId}`,
      conceptLabel: `${def.label} Shape`,
      skillType: 'shapes_premath',
      spec: {
        letter: 'O',
        hasDescender: false,
        strokes,
        glyphs: [
          {
            glyphCase: 'upper',
            label: def.label,
            centerX: 350,
            hasDescender: false,
            startOrder: 1,
            endOrder: strokes.length,
          },
        ],
      },
      audioKind: 'word',
      audioTarget: shapeId,
    };
  }

  if (mode === 'words') {
    const cleanWord = (TRACEABLE_WORDS as readonly string[]).includes(itemId)
      ? itemId
      : 'cat';
    const chars = cleanWord.split('') as Lowercase<LetterId>[];
    const centers = [182, 350, 518];
    const allStrokes: ResolvedTraceStroke[] = [];
    const glyphs: ResolvedGlyphSummary[] = [];
    let hasDescender = false;

    chars.forEach((ch, idx) => {
      const upper = ch.toUpperCase() as LetterId;
      if (DESCENDER_LOWER_LETTERS.has(upper)) hasDescender = true;
      const defs = LOWER_STROKES[ch] ?? LOWER_STROKES.a;
      const startOrder = allStrokes.length + 1;
      const resolved = resolveGlyphStrokes(
        idx % 2 === 0 ? 'upper' : 'lower',
        defs,
        centers[idx] ?? 350,
        startOrder,
      );
      allStrokes.push(...resolved);
      glyphs.push({
        glyphCase: idx % 2 === 0 ? 'upper' : 'lower',
        label: `Letter ${idx + 1}: ${ch}`,
        centerX: centers[idx] ?? 350,
        hasDescender: DESCENDER_LOWER_LETTERS.has(upper),
        startOrder,
        endOrder: allStrokes.length,
      });
    });

    return {
      id: cleanWord,
      badgeText: cleanWord,
      title: `Word "${cleanWord}"`,
      completeSubtext: `Left to right! You wrote "${cleanWord}"!`,
      conceptId: `word:${cleanWord}`,
      conceptLabel: `Write "${cleanWord}"`,
      skillType: 'word_spelling',
      spec: {
        letter: (cleanWord[0]?.toUpperCase() as LetterId) ?? 'C',
        hasDescender,
        strokes: allStrokes,
        glyphs,
      },
      audioKind: 'word',
      audioTarget: cleanWord,
    };
  }

  // Default: 'letters'
  const letter: LetterId = isValidLetterId(itemId) ? itemId : 'A';
  const spec = buildLetterTraceSpec(letter, config.caseMode);
  const pairTitle =
    config.caseMode === 'both'
      ? `${letter} ${letter.toLowerCase()}`
      : config.caseMode === 'upper'
        ? letter
        : letter.toLowerCase();

  return {
    id: letter,
    badgeText: pairTitle,
    title: pairTitle,
    completeSubtext: `${letter} complete!`,
    conceptId: `letter:${letter}`,
    conceptLabel: `Letter ${letter}${letter.toLowerCase()}`,
    skillType: 'letter_formation',
    spec,
    audioKind: 'letter',
    audioTarget: letter,
  };
}

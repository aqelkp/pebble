import type { LogicalPoint } from '../../engine/usePointerStroke';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All configuration, active-session state, and
// mastery telemetry loaded from sessionStorage/localStorage are treated as untrusted input and
// validated against strict allow-lists and integer bounds before rendering via React JSX.

export type CompareSymbol = '>' | '<' | '=';

export type CompareModeId = 'mix' | 'quantity' | 'length' | 'measure' | 'numbers';

export type CompareConcreteKind = 'quantity' | 'length' | 'measure' | 'numbers';

export type CompareLengthVariant = 'sticks' | 'towers';

export type CompareRoundSize = 6 | 8 | 12;

export type CompareItemId = 'apple' | 'strawberry' | 'carrot' | 'orange' | 'acorn' | 'pear';

export type CompareJuiceId = 'berry' | 'mango' | 'orange' | 'grape';

export interface CompareQuestConfig {
  modeId: CompareModeId;
  roundSize: CompareRoundSize;
}

export interface CompareModeSpec {
  id: CompareModeId;
  title: string;
  shortTitle: string;
  rangeBadge: string;
  subtitle: string;
  sampleEquation: string;
}

export interface CompareItemThemeSpec {
  id: CompareItemId;
  singularLabel: string;
  pluralLabel: string;
  imagePath?: string;
  accentColor: string;
}

export interface CompareJuiceSpec {
  id: CompareJuiceId;
  label: string;
  fillTop: string;
  fillBottom: string;
  rimHighlight: string;
}

export interface ComparePromptSpec {
  uid: string;
  kind: CompareConcreteKind;
  leftValue: number;
  rightValue: number;
  answer: CompareSymbol;
  itemThemeId: CompareItemId;
  lengthVariant: CompareLengthVariant;
  juiceFlavorId: CompareJuiceId;
}

export interface CompareSymbolStat {
  attempts: number;
  correct: number;
}

export interface CompareQuestMasteryState {
  version: 1;
  roundsCompleted: number;
  flawlessRounds: number;
  totalSolved: number;
  bySymbol: Record<CompareSymbol, CompareSymbolStat>;
  byKind: Record<CompareConcreteKind, CompareSymbolStat>;
}

export const COMPARE_ACTIVE_SESSION_KEY = 'pebble.compare-quest.active.v1';
export const COMPARE_MASTERY_KEY = 'pebble.compare-quest.mastery.v1';

export const DEFAULT_COMPARE_MODE_ID: CompareModeId = 'mix';
export const DEFAULT_COMPARE_ROUND_SIZE: CompareRoundSize = 8;

export const COMPARE_ROUND_SIZES: readonly {
  size: CompareRoundSize;
  label: string;
  subtitle: string;
}[] = [
  { size: 6, label: '6 Prompts', subtitle: 'Quick Warm-Up' },
  { size: 8, label: '8 Prompts', subtitle: 'Cozy Round' },
  { size: 12, label: '12 Prompts', subtitle: 'Deep Practice' },
];

export const COMPARE_MODES: readonly CompareModeSpec[] = [
  {
    id: 'mix',
    title: 'Mix All',
    shortTitle: 'Mix All',
    rangeBadge: '0–10 • All 4',
    subtitle: 'Rotates baskets, length sticks & towers, juice jugs, and workbook numbers.',
    sampleEquation: '5 > 3 • 4 = 4',
  },
  {
    id: 'quantity',
    title: 'Count Baskets',
    shortTitle: 'Baskets',
    rangeBadge: '0–10 Items',
    subtitle: 'Tap apples, carrots, strawberries, and acorns in ten-frames (includes empty 0!).',
    sampleEquation: '0 < 6',
  },
  {
    id: 'length',
    title: 'Length & Towers',
    shortTitle: 'Length',
    rangeBadge: '1–10 Units',
    subtitle: 'Compare aligned wooden pencils/rods and stacked block towers on a shared baseline.',
    sampleEquation: '7 > 4',
  },
  {
    id: 'measure',
    title: 'Juice Jugs',
    shortTitle: 'Juice Jugs',
    rangeBadge: '0–10 Cups',
    subtitle: 'Read clear 0–10 cup marks on berry and mango pitchers (including empty & equal!).',
    sampleEquation: '3 = 3',
  },
  {
    id: 'numbers',
    title: 'Pure Numbers',
    shortTitle: 'Numbers',
    rangeBadge: '0–10 Digits',
    subtitle: 'K1 workbook number pairs — write or tap >, <, or = right in the center box!',
    sampleEquation: '8 > 5',
  },
];

export const COMPARE_ITEM_THEMES: readonly CompareItemThemeSpec[] = [
  {
    id: 'apple',
    singularLabel: 'Apple',
    pluralLabel: 'Apples',
    imagePath: 'themes/fruits/01-apple.png',
    accentColor: '#E85349',
  },
  {
    id: 'strawberry',
    singularLabel: 'Strawberry',
    pluralLabel: 'Strawberries',
    imagePath: 'themes/fruits/04-strawberry.png',
    accentColor: '#F27A5E',
  },
  {
    id: 'carrot',
    singularLabel: 'Carrot',
    pluralLabel: 'Carrots',
    imagePath: 'themes/vegetables/01-carrot.png',
    accentColor: '#EA7B3C',
  },
  {
    id: 'orange',
    singularLabel: 'Orange',
    pluralLabel: 'Oranges',
    imagePath: 'themes/fruits/05-orange.png',
    accentColor: '#F29F3D',
  },
  {
    id: 'acorn',
    singularLabel: 'Acorn',
    pluralLabel: 'Acorns',
    accentColor: '#9E6B43',
  },
  {
    id: 'pear',
    singularLabel: 'Pear',
    pluralLabel: 'Pears',
    imagePath: 'themes/fruits/10-pear.png',
    accentColor: '#6EB85A',
  },
];

export const COMPARE_JUICE_SPECS: readonly CompareJuiceSpec[] = [
  {
    id: 'berry',
    label: 'Berry Juice',
    fillTop: '#F68D8E',
    fillBottom: '#DF576B',
    rimHighlight: '#FFD3D5',
  },
  {
    id: 'mango',
    label: 'Mango Juice',
    fillTop: '#F8CE6B',
    fillBottom: '#ECA435',
    rimHighlight: '#FFF0C2',
  },
  {
    id: 'orange',
    label: 'Orange Juice',
    fillTop: '#F9A26C',
    fillBottom: '#E97542',
    rimHighlight: '#FFE0CA',
  },
  {
    id: 'grape',
    label: 'Grape Juice',
    fillTop: '#9D8CF0',
    fillBottom: '#6B5ED9',
    rimHighlight: '#DFD9FF',
  },
];

export const NUMBER_WORDS: readonly string[] = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
];

const VALID_MODES = new Set<CompareModeId>(['mix', 'quantity', 'length', 'measure', 'numbers']);
const VALID_KINDS = new Set<CompareConcreteKind>(['quantity', 'length', 'measure', 'numbers']);
const VALID_ROUND_SIZES = new Set<CompareRoundSize>([6, 8, 12]);
const VALID_SYMBOLS = new Set<CompareSymbol>(['>', '<', '=']);
const VALID_ITEMS = new Set<CompareItemId>([
  'apple',
  'strawberry',
  'carrot',
  'orange',
  'acorn',
  'pear',
]);
const VALID_JUICES = new Set<CompareJuiceId>(['berry', 'mango', 'orange', 'grape']);

export function isValidCompareModeId(value: unknown): value is CompareModeId {
  return typeof value === 'string' && VALID_MODES.has(value as CompareModeId);
}

export function isValidCompareRoundSize(value: unknown): value is CompareRoundSize {
  return typeof value === 'number' && VALID_ROUND_SIZES.has(value as CompareRoundSize);
}

export function isValidCompareSymbol(value: unknown): value is CompareSymbol {
  return typeof value === 'string' && VALID_SYMBOLS.has(value as CompareSymbol);
}

export function isValidCompareConcreteKind(value: unknown): value is CompareConcreteKind {
  return typeof value === 'string' && VALID_KINDS.has(value as CompareConcreteKind);
}

export function isValidCompareItemId(value: unknown): value is CompareItemId {
  return typeof value === 'string' && VALID_ITEMS.has(value as CompareItemId);
}

export function isValidCompareJuiceId(value: unknown): value is CompareJuiceId {
  return typeof value === 'string' && VALID_JUICES.has(value as CompareJuiceId);
}

export function getDefaultCompareQuestConfig(): CompareQuestConfig {
  return {
    modeId: DEFAULT_COMPARE_MODE_ID,
    roundSize: DEFAULT_COMPARE_ROUND_SIZE,
  };
}

export function isValidCompareQuestConfig(value: unknown): value is CompareQuestConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<CompareQuestConfig>;
  return isValidCompareModeId(c.modeId) && isValidCompareRoundSize(c.roundSize);
}

export function getCompareModeSpec(modeId: CompareModeId): CompareModeSpec {
  return COMPARE_MODES.find((m) => m.id === modeId) ?? COMPARE_MODES[0];
}

export function getCompareItemSpec(itemId: CompareItemId): CompareItemThemeSpec {
  return COMPARE_ITEM_THEMES.find((i) => i.id === itemId) ?? COMPARE_ITEM_THEMES[0];
}

export function getCompareJuiceSpec(juiceId: CompareJuiceId): CompareJuiceSpec {
  return COMPARE_JUICE_SPECS.find((j) => j.id === juiceId) ?? COMPARE_JUICE_SPECS[0];
}

export function computeCompareSymbol(leftValue: number, rightValue: number): CompareSymbol {
  if (leftValue > rightValue) return '>';
  if (leftValue < rightValue) return '<';
  return '=';
}

export function getSymbolSpokenLabel(symbol: CompareSymbol): string {
  if (symbol === '>') return 'Greater than';
  if (symbol === '<') return 'Less than';
  return 'Equal to';
}

export function formatComparisonSentence(leftValue: number, rightValue: number): string {
  const leftWord = NUMBER_WORDS[leftValue] ?? String(leftValue);
  const rightWord = (NUMBER_WORDS[rightValue] ?? String(rightValue)).toLowerCase();
  const sym = computeCompareSymbol(leftValue, rightValue);
  if (sym === '>') return `${leftWord} is greater than ${rightWord}!`;
  if (sym === '<') return `${leftWord} is less than ${rightWord}!`;
  return `${leftWord} is equal to ${rightWord}!`;
}

export function formatTeachFirstExplanation(leftValue: number, rightValue: number): string {
  const leftWord = NUMBER_WORDS[leftValue] ?? String(leftValue);
  const rightWord = (NUMBER_WORDS[rightValue] ?? String(rightValue)).toLowerCase();
  if (leftValue > rightValue) {
    return `Look closely! ${leftWord} is more than ${rightWord}. The wide open side points to the bigger side.`;
  }
  if (leftValue < rightValue) {
    return `Look closely! ${leftWord} is less than ${rightWord}. The wide open side points to the bigger side.`;
  }
  return 'Look closely! Both sides are equal, so we use the equal sign.';
}

function getCryptoRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getCryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates a balanced, replayable round of Compare Quest prompts:
 * - ~25% `=` (`Equal to`) prompts in every round (`2/6`, `2/8`, `3/12`)
 * - Balanced `>` and `<` prompts so tapping one sign blindly always fails
 * - At least one `0` comparison in every `0–10` mode (`mix`, `quantity`, `measure`, `numbers`)
 * - Alternates Horizontal Sticks vs. Vertical Block Towers in `length` prompts
 */
export function buildCompareRoundDeck(config: CompareQuestConfig): ComparePromptSpec[] {
  const count = config.roundSize;
  const equalCount = count === 12 ? 3 : 2; // 2/6 (~33%), 2/8 (25%), 3/12 (25%)
  const remaining = count - equalCount;
  const gtFirst = getCryptoRandomInt(2) === 0;
  const gtCount = gtFirst ? Math.ceil(remaining / 2) : Math.floor(remaining / 2);
  const ltCount = remaining - gtCount;

  const targetRelations: CompareSymbol[] = shuffleArray([
    ...Array.from({ length: equalCount }, () => '=' as const),
    ...Array.from({ length: gtCount }, () => '>' as const),
    ...Array.from({ length: ltCount }, () => '<' as const),
  ]);

  // Prevent 3 identical answers in a row
  for (let i = 2; i < targetRelations.length; i += 1) {
    if (
      targetRelations[i] === targetRelations[i - 1] &&
      targetRelations[i] === targetRelations[i - 2]
    ) {
      const swapIdx = targetRelations.findIndex(
        (sym, idx) => idx > i && sym !== targetRelations[i],
      );
      if (swapIdx > i) {
        [targetRelations[i], targetRelations[swapIdx]] = [
          targetRelations[swapIdx],
          targetRelations[i],
        ];
      }
    }
  }

  const kinds: CompareConcreteKind[] = [];
  if (config.modeId === 'mix') {
    const baseRotation: CompareConcreteKind[] = ['quantity', 'length', 'measure', 'numbers'];
    const rotated = shuffleArray(baseRotation);
    for (let i = 0; i < count; i += 1) {
      kinds.push(rotated[i % rotated.length]);
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      kinds.push(config.modeId);
    }
  }

  // Pick a zero-capable slot to guarantee `0` gets practiced in every `0-10` round
  const zeroCapableIndices = kinds
    .map((k, idx) => ({ k, idx }))
    .filter(({ k }) => k !== 'length')
    .map(({ idx }) => idx);
  const forcedZeroSlot =
    zeroCapableIndices.length > 0
      ? zeroCapableIndices[getCryptoRandomInt(zeroCapableIndices.length)]
      : -1;

  const itemOrder = shuffleArray(COMPARE_ITEM_THEMES.map((t) => t.id));
  const juiceOrder = shuffleArray(COMPARE_JUICE_SPECS.map((j) => j.id));
  let lengthCounter = getCryptoRandomInt(2);
  let prevPairKey = '';
  let sawZero = false;

  const prompts: ComparePromptSpec[] = [];

  for (let i = 0; i < count; i += 1) {
    const kind = kinds[i];
    const rel = targetRelations[i];
    const minVal = kind === 'length' ? 1 : 0;
    const maxVal = 10;
    const shouldForceZero = i === forcedZeroSlot && !sawZero && minVal === 0;

    let leftValue = 4;
    let rightValue = 4;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      if (shouldForceZero) {
        if (rel === '=') {
          leftValue = 0;
          rightValue = 0;
        } else if (rel === '<') {
          leftValue = 0;
          rightValue = 2 + getCryptoRandomInt(8); // 0 < 2..9
        } else {
          leftValue = 2 + getCryptoRandomInt(8); // 2..9 > 0
          rightValue = 0;
        }
      } else if (rel === '=') {
        leftValue = minVal + getCryptoRandomInt(maxVal - minVal + 1);
        rightValue = leftValue;
      } else {
        const a = minVal + getCryptoRandomInt(maxVal - minVal + 1);
        let b = minVal + getCryptoRandomInt(maxVal - minVal + 1);
        if (a === b) {
          b = a < maxVal ? a + 1 : a - 1;
        }
        const high = Math.max(a, b);
        const low = Math.min(a, b);
        if (rel === '>') {
          leftValue = high;
          rightValue = low;
        } else {
          leftValue = low;
          rightValue = high;
        }
      }

      const key = `${leftValue}:${rightValue}`;
      if (key !== prevPairKey) {
        prevPairKey = key;
        break;
      }
    }

    if (leftValue === 0 || rightValue === 0) {
      sawZero = true;
    }

    const lengthVariant: CompareLengthVariant =
      lengthCounter % 2 === 0 ? 'sticks' : 'towers';
    if (kind === 'length') {
      lengthCounter += 1;
    }

    prompts.push({
      uid: `cmp-${Date.now().toString(36)}-${i}-${getCryptoRandomInt(10000)}`,
      kind,
      leftValue,
      rightValue,
      answer: computeCompareSymbol(leftValue, rightValue),
      itemThemeId: itemOrder[i % itemOrder.length],
      lengthVariant,
      juiceFlavorId: juiceOrder[i % juiceOrder.length],
    });
  }

  return prompts;
}

export type DrawnGestureOutcome =
  | { status: 'recognized'; symbol: CompareSymbol }
  | { status: 'await-second-stroke' }
  | { status: 'tap-ignored' }
  | { status: 'unrecognized' };

function computeStrokeLength(points: readonly LogicalPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

function getStrokeBounds(points: readonly LogicalPoint[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumY = 0;
  let minXIdx = 0;
  let maxXIdx = 0;

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (p.x < minX) {
      minX = p.x;
      minXIdx = i;
    }
    if (p.x > maxX) {
      maxX = p.x;
      maxXIdx = i;
    }
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumY += p.y;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
    meanY: points.length > 0 ? sumY / points.length : 0,
    minXIdx,
    maxXIdx,
  };
}

/**
 * Classifies child finger-writing inside the `160 × 160` logical center `[ ? ]` box:
 * - Single-stroke rightward V-wedge `>` or leftward V-wedge `<`
 * - Two-stroke horizontal parallel bars `=` (waits briefly after 1st bar for 2nd bar)
 * - Two-stroke angled V-wedge `>` or `<` (when child lifts finger at vertex)
 * - Tiny accidental taps (`< 24` logical px) are cleanly ignored with zero penalty
 */
export function classifyDrawnCompareSymbol(
  strokes: readonly (readonly LogicalPoint[])[],
  finalizingTimeout = false,
): DrawnGestureOutcome {
  const validStrokes = strokes.filter((s) => s.length >= 2);
  if (validStrokes.length === 0) return { status: 'tap-ignored' };

  const totalLength = validStrokes.reduce((acc, s) => acc + computeStrokeLength(s), 0);
  if (totalLength < 24) {
    return { status: 'tap-ignored' };
  }

  if (validStrokes.length === 1) {
    const pts = validStrokes[0];
    const b = getStrokeBounds(pts);
    const start = pts[0];
    const end = pts[pts.length - 1];
    const verticalGap = Math.abs(end.y - start.y);

    // Check single-stroke `>` (starts left, turns around at maxX, ends left)
    const rightTurnDepth = Math.min(b.maxX - start.x, b.maxX - end.x);
    if (
      b.width >= 20 &&
      b.height >= 20 &&
      verticalGap >= 14 &&
      rightTurnDepth >= Math.max(14, b.width * 0.42) &&
      b.maxXIdx > 0 &&
      b.maxXIdx < pts.length - 1
    ) {
      return { status: 'recognized', symbol: '>' };
    }

    // Check single-stroke `<` (starts right, turns around at minX, ends right)
    const leftTurnDepth = Math.min(start.x - b.minX, end.x - b.minX);
    if (
      b.width >= 20 &&
      b.height >= 20 &&
      verticalGap >= 14 &&
      leftTurnDepth >= Math.max(14, b.width * 0.42) &&
      b.minXIdx > 0 &&
      b.minXIdx < pts.length - 1
    ) {
      return { status: 'recognized', symbol: '<' };
    }

    // Single horizontal or diagonal stroke: wait briefly for 2nd stroke (`=` or 2-stroke `>` / `<`)
    if (!finalizingTimeout && b.width >= 18) {
      return { status: 'await-second-stroke' };
    }

    return { status: 'unrecognized' };
  }

  // Two or more strokes: inspect first two main strokes
  const s1 = validStrokes[0];
  const s2 = validStrokes[1];
  const b1 = getStrokeBounds(s1);
  const b2 = getStrokeBounds(s2);

  const isHoriz1 = b1.width >= 20 && b1.height <= Math.max(24, b1.width * 0.58);
  const isHoriz2 = b2.width >= 20 && b2.height <= Math.max(24, b2.width * 0.58);
  const xOverlap = Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX);
  const ySeparation = Math.abs(b1.meanY - b2.meanY);

  if (isHoriz1 && isHoriz2 && xOverlap >= 12 && ySeparation >= 8) {
    return { status: 'recognized', symbol: '=' };
  }

  // Two angled strokes meeting on the right (`>`) or left (`<`)
  const p1Left = s1.reduce((minP, p) => (p.x < minP.x ? p : minP), s1[0]);
  const p1Right = s1.reduce((maxP, p) => (p.x > maxP.x ? p : maxP), s1[0]);
  const p2Left = s2.reduce((minP, p) => (p.x < minP.x ? p : minP), s2[0]);
  const p2Right = s2.reduce((maxP, p) => (p.x > maxP.x ? p : maxP), s2[0]);

  const leftSpreadY = Math.abs(p1Left.y - p2Left.y);
  const rightSpreadY = Math.abs(p1Right.y - p2Right.y);
  const combinedWidth = Math.max(b1.maxX, b2.maxX) - Math.min(b1.minX, b2.minX);

  if (combinedWidth >= 20) {
    if (leftSpreadY >= rightSpreadY + 14 && Math.abs(p1Right.x - p2Right.x) <= 28) {
      return { status: 'recognized', symbol: '>' };
    }
    if (rightSpreadY >= leftSpreadY + 14 && Math.abs(p1Left.x - p2Left.x) <= 28) {
      return { status: 'recognized', symbol: '<' };
    }
  }

  return { status: 'unrecognized' };
}

function clampSafeInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function sanitizeSymbolStat(raw: unknown): CompareSymbolStat {
  if (typeof raw !== 'object' || raw === null) return { attempts: 0, correct: 0 };
  const candidate = raw as Partial<CompareSymbolStat>;
  const attempts = clampSafeInt(candidate.attempts, 0, 50000, 0);
  const correct = clampSafeInt(candidate.correct, 0, attempts, 0);
  return { attempts, correct };
}

export function getDefaultCompareMastery(): CompareQuestMasteryState {
  return {
    version: 1,
    roundsCompleted: 0,
    flawlessRounds: 0,
    totalSolved: 0,
    bySymbol: {
      '>': { attempts: 0, correct: 0 },
      '<': { attempts: 0, correct: 0 },
      '=': { attempts: 0, correct: 0 },
    },
    byKind: {
      quantity: { attempts: 0, correct: 0 },
      length: { attempts: 0, correct: 0 },
      measure: { attempts: 0, correct: 0 },
      numbers: { attempts: 0, correct: 0 },
    },
  };
}

export function loadCompareMastery(): CompareQuestMasteryState {
  const defaults = getDefaultCompareMastery();
  try {
    if (typeof window === 'undefined') return defaults;
    const raw = window.localStorage.getItem(COMPARE_MASTERY_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<CompareQuestMasteryState>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return defaults;

    const bySymbolRaw =
      typeof parsed.bySymbol === 'object' && parsed.bySymbol !== null
        ? (parsed.bySymbol as Partial<Record<CompareSymbol, unknown>>)
        : {};
    const byKindRaw =
      typeof parsed.byKind === 'object' && parsed.byKind !== null
        ? (parsed.byKind as Partial<Record<CompareConcreteKind, unknown>>)
        : {};

    return {
      version: 1,
      roundsCompleted: clampSafeInt(parsed.roundsCompleted, 0, 50000, 0),
      flawlessRounds: clampSafeInt(parsed.flawlessRounds, 0, 50000, 0),
      totalSolved: clampSafeInt(parsed.totalSolved, 0, 200000, 0),
      bySymbol: {
        '>': sanitizeSymbolStat(bySymbolRaw['>']),
        '<': sanitizeSymbolStat(bySymbolRaw['<']),
        '=': sanitizeSymbolStat(bySymbolRaw['=']),
      },
      byKind: {
        quantity: sanitizeSymbolStat(byKindRaw.quantity),
        length: sanitizeSymbolStat(byKindRaw.length),
        measure: sanitizeSymbolStat(byKindRaw.measure),
        numbers: sanitizeSymbolStat(byKindRaw.numbers),
      },
    };
  } catch {
    return defaults;
  }
}

export function recordComparePromptOutcome(
  symbol: CompareSymbol,
  kind: CompareConcreteKind,
  cleanFirstTry: boolean,
): CompareQuestMasteryState {
  const current = loadCompareMastery();
  const symStat = current.bySymbol[symbol];
  const kindStat = current.byKind[kind];

  const next: CompareQuestMasteryState = {
    ...current,
    totalSolved: current.totalSolved + (cleanFirstTry ? 1 : 0),
    bySymbol: {
      ...current.bySymbol,
      [symbol]: {
        attempts: symStat.attempts + 1,
        correct: symStat.correct + (cleanFirstTry ? 1 : 0),
      },
    },
    byKind: {
      ...current.byKind,
      [kind]: {
        attempts: kindStat.attempts + 1,
        correct: kindStat.correct + (cleanFirstTry ? 1 : 0),
      },
    },
  };

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COMPARE_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

export function recordCompareRoundFinished(flawless: boolean): CompareQuestMasteryState {
  const current = loadCompareMastery();
  const next: CompareQuestMasteryState = {
    ...current,
    roundsCompleted: current.roundsCompleted + 1,
    flawlessRounds: current.flawlessRounds + (flawless ? 1 : 0),
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COMPARE_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

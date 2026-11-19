import type { ClassLevelId } from '../../curriculum/curriculumTypes';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All configuration, active-session state, and
// mastery telemetry loaded from sessionStorage/localStorage are treated as untrusted input and
// validated against strict allow-lists and integer bounds before rendering via React JSX.

export type RocketModeId =
  | 'k1-sums-5'
  | 'k1-sums-10'
  | 'k1-single-digit'
  | 'k2-two-digit';

export type RocketVisualMode = 'pictures-and-numbers' | 'numbers-only';

export type RocketRoundLength = 6 | 8 | 12;

export interface RocketSumsConfig {
  classLevel: ClassLevelId;
  modeId: RocketModeId;
  visualMode: RocketVisualMode;
  roundLength: RocketRoundLength;
}

export interface RocketModeSpec {
  id: RocketModeId;
  classLevel: ClassLevelId;
  classBadge: string;
  title: string;
  rangeBadge: string;
  subtitle: string;
  sampleEquation: string;
  supportsPictures: boolean;
}

export interface RocketItemSpec {
  id: 'apple' | 'strawberry' | 'orange' | 'pear' | 'banana' | 'carrot';
  singular: string;
  plural: string;
  imagePath: string;
}

export interface RocketPromptSpec {
  uid: string;
  left: number;
  right: number;
  answer: number;
  itemId: RocketItemSpec['id'];
}

export interface RocketSumsMasteryState {
  version: 1;
  roundsCompleted: number;
  flawlessRounds: number;
  totalSolved: number;
  fastRecalls: number;
  timeouts: number;
  avgResponseMs: number;
}

export const ROCKET_ACTIVE_SESSION_KEY = 'pebble.rocket-sums.active.v1';
export const ROCKET_MASTERY_KEY = 'pebble.rocket-sums.mastery.v1';

export const DEFAULT_ROCKET_CLASS_LEVEL: ClassLevelId = 'k1';
export const DEFAULT_ROCKET_MODE_ID: RocketModeId = 'k1-sums-10';
export const DEFAULT_ROCKET_VISUAL_MODE: RocketVisualMode = 'pictures-and-numbers';
export const DEFAULT_ROCKET_ROUND_LENGTH: RocketRoundLength = 8;

export const ROCKET_ROUND_SECONDS = 10;
export const ROCKET_FAST_THRESHOLD_MS = 4200;

export const ROCKET_ROUND_LENGTHS: readonly {
  length: RocketRoundLength;
  label: string;
  subtitle: string;
}[] = [
  { length: 6, label: '6 Launches', subtitle: 'Quick Sprint' },
  { length: 8, label: '8 Launches', subtitle: 'Moon Flight' },
  { length: 12, label: '12 Launches', subtitle: 'Star Orbit' },
];

export const ROCKET_MODES: readonly RocketModeSpec[] = [
  {
    id: 'k1-sums-5',
    classLevel: 'k1',
    classBadge: 'K1 Warm-Up',
    title: 'Sums to 5',
    rangeBadge: '0 – 5',
    subtitle: 'Gentle 1-digit pairs adding up to 5.',
    sampleEquation: '3 + 2 = 5',
    supportsPictures: true,
  },
  {
    id: 'k1-sums-10',
    classLevel: 'k1',
    classBadge: 'K1 Core',
    title: 'Sums to 10',
    rangeBadge: '0 – 10',
    subtitle: 'Essential K1 1-digit addition facts up to 10.',
    sampleEquation: '5 + 2 = 7',
    supportsPictures: true,
  },
  {
    id: 'k1-single-digit',
    classLevel: 'k1',
    classBadge: 'K1 Challenge',
    title: 'All 1-Digit Sums',
    rangeBadge: '1–9 + 1–9',
    subtitle: 'Any two single-digit numbers (totals up to 18).',
    sampleEquation: '8 + 6 = 14',
    supportsPictures: true,
  },
  {
    id: 'k2-two-digit',
    classLevel: 'k2',
    classBadge: 'K2 Preview',
    title: '2-Digit + 1-Digit',
    rangeBadge: '10 – 30',
    subtitle: 'Step up to 2-digit mental addition!',
    sampleEquation: '14 + 5 = 19',
    supportsPictures: false,
  },
];

export const ROCKET_ITEMS: readonly RocketItemSpec[] = [
  {
    id: 'apple',
    singular: 'apple',
    plural: 'apples',
    imagePath: 'themes/fruits/01-apple.png',
  },
  {
    id: 'strawberry',
    singular: 'strawberry',
    plural: 'strawberries',
    imagePath: 'themes/fruits/04-strawberry.png',
  },
  {
    id: 'orange',
    singular: 'orange',
    plural: 'oranges',
    imagePath: 'themes/fruits/05-orange.png',
  },
  {
    id: 'pear',
    singular: 'pear',
    plural: 'pears',
    imagePath: 'themes/fruits/10-pear.png',
  },
  {
    id: 'banana',
    singular: 'banana',
    plural: 'bananas',
    imagePath: 'themes/fruits/02-banana.png',
  },
  {
    id: 'carrot',
    singular: 'carrot',
    plural: 'carrots',
    imagePath: 'themes/vegetables/01-carrot.png',
  },
];

const VALID_MODES = new Set<RocketModeId>([
  'k1-sums-5',
  'k1-sums-10',
  'k1-single-digit',
  'k2-two-digit',
]);
const VALID_VISUAL_MODES = new Set<RocketVisualMode>(['pictures-and-numbers', 'numbers-only']);
const VALID_ROUND_LENGTHS = new Set<RocketRoundLength>([6, 8, 12]);
const VALID_ITEMS = new Set<RocketItemSpec['id']>([
  'apple',
  'strawberry',
  'orange',
  'pear',
  'banana',
  'carrot',
]);

export function isValidRocketModeId(value: unknown): value is RocketModeId {
  return typeof value === 'string' && VALID_MODES.has(value as RocketModeId);
}

export function isValidRocketVisualMode(value: unknown): value is RocketVisualMode {
  return typeof value === 'string' && VALID_VISUAL_MODES.has(value as RocketVisualMode);
}

export function isValidRocketRoundLength(value: unknown): value is RocketRoundLength {
  return typeof value === 'number' && VALID_ROUND_LENGTHS.has(value as RocketRoundLength);
}

export function isValidRocketItemId(value: unknown): value is RocketItemSpec['id'] {
  return typeof value === 'string' && VALID_ITEMS.has(value as RocketItemSpec['id']);
}

export function getRocketModeSpec(modeId: RocketModeId): RocketModeSpec {
  return ROCKET_MODES.find((m) => m.id === modeId) ?? ROCKET_MODES[1];
}

export function getRocketItemSpec(itemId: RocketItemSpec['id']): RocketItemSpec {
  return ROCKET_ITEMS.find((i) => i.id === itemId) ?? ROCKET_ITEMS[0];
}

export function getDefaultRocketSumsConfig(): RocketSumsConfig {
  return {
    classLevel: DEFAULT_ROCKET_CLASS_LEVEL,
    modeId: DEFAULT_ROCKET_MODE_ID,
    visualMode: DEFAULT_ROCKET_VISUAL_MODE,
    roundLength: DEFAULT_ROCKET_ROUND_LENGTH,
  };
}

export function isValidRocketSumsConfig(value: unknown): value is RocketSumsConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<RocketSumsConfig>;
  const validClass =
    c.classLevel === 'nursery' ||
    c.classLevel === 'k1' ||
    c.classLevel === 'k2' ||
    c.classLevel === 'grade1';
  return (
    validClass &&
    isValidRocketModeId(c.modeId) &&
    isValidRocketVisualMode(c.visualMode) &&
    isValidRocketRoundLength(c.roundLength)
  );
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

export function generateRocketPrompt(
  modeId: RocketModeId,
  prevKey = '',
  itemOffset = 0,
): RocketPromptSpec {
  let left = 2;
  let right = 3;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (modeId === 'k1-sums-5') {
      // Allow 0 occasionally (~15%), otherwise 1..4
      const allowZero = getCryptoRandomInt(7) === 0;
      if (allowZero) {
        left = 1 + getCryptoRandomInt(4);
        right = 0;
      } else {
        const sum = 2 + getCryptoRandomInt(4); // 2..5
        left = 1 + getCryptoRandomInt(sum - 1);
        right = sum - left;
      }
    } else if (modeId === 'k1-sums-10') {
      const allowZero = getCryptoRandomInt(10) === 0;
      if (allowZero) {
        left = 1 + getCryptoRandomInt(9);
        right = 0;
      } else {
        const sum = 2 + getCryptoRandomInt(9); // 2..10
        left = 1 + getCryptoRandomInt(sum - 1);
        right = sum - left;
      }
    } else if (modeId === 'k1-single-digit') {
      left = 1 + getCryptoRandomInt(9); // 1..9
      right = 1 + getCryptoRandomInt(9); // 1..9
    } else {
      // k2-two-digit: 2-digit (11..21) + 1-digit (1..9), total <= 30
      left = 11 + getCryptoRandomInt(11); // 11..21
      right = 1 + getCryptoRandomInt(9); // 1..9
    }

    // Occasionally flip left/right on zero prompts
    if (right === 0 && getCryptoRandomInt(2) === 0) {
      [left, right] = [right, left];
    }

    const key = `${left}+${right}`;
    if (key !== prevKey) {
      break;
    }
  }

  const itemSpec =
    ROCKET_ITEMS[(itemOffset + getCryptoRandomInt(ROCKET_ITEMS.length)) % ROCKET_ITEMS.length];

  return {
    uid: `rs-${Date.now().toString(36)}-${getCryptoRandomInt(100000)}`,
    left,
    right,
    answer: left + right,
    itemId: itemSpec.id,
  };
}

/**
 * Returns the tactile answer pad choices:
 * - K1 Sums to 5 / Sums to 10: full `0..10` pad (11 buttons) so the child recalls without guessing.
 * - K1 Challenge / K2: a sorted 11-number window containing the exact answer and nearby neighbors.
 */
export function getRocketPadNumbers(modeId: RocketModeId, answer: number): number[] {
  if (modeId === 'k1-sums-5' || modeId === 'k1-sums-10') {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  const maxCap = modeId === 'k1-single-digit' ? 18 : 30;
  const minCap = modeId === 'k1-single-digit' ? 2 : 11;
  const windowSize = 11;

  // Deterministic-feeling window around answer so buttons stay neatly ordered
  const offset = Math.min(5, Math.max(0, answer - minCap));
  let start = Math.max(minCap, answer - offset);
  if (start + windowSize - 1 > maxCap) {
    start = Math.max(minCap, maxCap - windowSize + 1);
  }

  const result: number[] = [];
  for (let n = start; n < start + windowSize && n <= maxCap; n += 1) {
    result.push(n);
  }
  return result;
}

function clampSafeInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

export function getDefaultRocketMastery(): RocketSumsMasteryState {
  return {
    version: 1,
    roundsCompleted: 0,
    flawlessRounds: 0,
    totalSolved: 0,
    fastRecalls: 0,
    timeouts: 0,
    avgResponseMs: 0,
  };
}

export function loadRocketMastery(): RocketSumsMasteryState {
  const defaults = getDefaultRocketMastery();
  try {
    if (typeof window === 'undefined') return defaults;
    const raw = window.localStorage.getItem(ROCKET_MASTERY_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<RocketSumsMasteryState>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return defaults;
    return {
      version: 1,
      roundsCompleted: clampSafeInt(parsed.roundsCompleted, 0, 50000, 0),
      flawlessRounds: clampSafeInt(parsed.flawlessRounds, 0, 50000, 0),
      totalSolved: clampSafeInt(parsed.totalSolved, 0, 200000, 0),
      fastRecalls: clampSafeInt(parsed.fastRecalls, 0, 200000, 0),
      timeouts: clampSafeInt(parsed.timeouts, 0, 200000, 0),
      avgResponseMs: clampSafeInt(parsed.avgResponseMs, 0, 60000, 0),
    };
  } catch {
    return defaults;
  }
}

export function recordRocketPromptSolve(
  responseMs: number,
  isFastRecall: boolean,
): RocketSumsMasteryState {
  const current = loadRocketMastery();
  const prevTotal = current.totalSolved;
  const nextTotal = Math.min(200000, prevTotal + 1);
  const clampedMs = clampSafeInt(responseMs, 200, 60000, 3000);
  const nextAvg =
    prevTotal === 0
      ? clampedMs
      : Math.round((current.avgResponseMs * prevTotal + clampedMs) / nextTotal);

  const next: RocketSumsMasteryState = {
    ...current,
    totalSolved: nextTotal,
    fastRecalls: Math.min(200000, current.fastRecalls + (isFastRecall ? 1 : 0)),
    avgResponseMs: nextAvg,
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROCKET_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

export function recordRocketTimeoutStat(): void {
  const current = loadRocketMastery();
  const next: RocketSumsMasteryState = {
    ...current,
    timeouts: Math.min(200000, current.timeouts + 1),
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROCKET_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
}

export function recordRocketRoundFinished(flawless: boolean): RocketSumsMasteryState {
  const current = loadRocketMastery();
  const next: RocketSumsMasteryState = {
    ...current,
    roundsCompleted: Math.min(50000, current.roundsCompleted + 1),
    flawlessRounds: Math.min(50000, current.flawlessRounds + (flawless ? 1 : 0)),
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROCKET_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota restrictions
  }
  return next;
}

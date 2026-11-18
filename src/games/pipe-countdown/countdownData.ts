// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA. All
// configuration and mastery payloads restored from sessionStorage / localStorage are treated
// as untrusted input and validated against strict allow-lists and integer bounds before use.

export type CountdownModeId = '9-to-0' | '5-to-0' | '10-to-0' | 'missing-rods';
export type CountdownRoundLength = 1 | 3 | 5;

export interface PipeCountdownConfig {
  modeId: CountdownModeId;
  roundLength: CountdownRoundLength;
}

export interface CountdownModeSpec {
  id: CountdownModeId;
  title: string;
  badge: string;
  subtitle: string;
  topNumber: number;
  sampleStrip: readonly string[];
}

export interface GardenSceneSpec {
  id: 'sunny-meadow' | 'citrus-grove' | 'berry-brook';
  title: string;
  fountainLabel: string;
  pipeTint: string;
  wheelAccent: string;
  basinAccent: string;
}

export interface CountdownRoundSpec {
  roundUid: string;
  modeId: CountdownModeId;
  scene: GardenSceneSpec;
  /** Descending sequence of all slots on the pipe, e.g. [9, 8, 7, ..., 0] */
  allNumbers: number[];
  /** Numbers already pre-sealed at the start of this round (non-empty in 'missing-rods') */
  preSealedNumbers: number[];
  /** Initial shuffled order of unsealed rod numbers in the tool tray */
  initialTrayOrder: number[];
}

export interface PipeCountdownMastery {
  version: 1;
  completedRepairs: number;
  flawlessRepairs: number;
  modeCompletions: Partial<Record<CountdownModeId, number>>;
}

export const PIPE_COUNTDOWN_MASTERY_KEY = 'pebble.pipe-countdown.mastery.v1';
export const PIPE_COUNTDOWN_SESSION_KEY = 'pebble.pipe-countdown.active.v1';

export const DEFAULT_COUNTDOWN_MODE_ID: CountdownModeId = '9-to-0';
export const DEFAULT_COUNTDOWN_ROUND_LENGTH: CountdownRoundLength = 3;

export const COUNTDOWN_MODES: readonly CountdownModeSpec[] = [
  {
    id: '9-to-0',
    title: 'Classic 9 → 0 Countdown',
    badge: 'K1 Page 14 • Default',
    subtitle: 'Plug all 10 stepped leaks from widest 9 down to shut-off cap 0!',
    topNumber: 9,
    sampleStrip: ['9', '8', '7', '…', '1', '0'],
  },
  {
    id: '5-to-0',
    title: 'Quick 5 → 0 Warm-Up',
    badge: '6 Steps • Gentle',
    subtitle: 'Friendly 6-step countdown from 5 down to valve cap 0.',
    topNumber: 5,
    sampleStrip: ['5', '4', '3', '2', '1', '0'],
  },
  {
    id: 'missing-rods',
    title: '9 → 0 Missing Numbers',
    badge: 'Fill the Gaps',
    subtitle: 'Half the pipes are sealed—plug the missing countdown numbers in order!',
    topNumber: 9,
    sampleStrip: ['9', '?', '7', '?', '5', '0'],
  },
  {
    id: '10-to-0',
    title: 'Rocket & Fountain 10 → 0',
    badge: 'Full 10 → 0',
    subtitle: 'Big 11-step countdown from giant pipe 10 all the way to 0!',
    topNumber: 10,
    sampleStrip: ['10', '9', '8', '…', '1', '0'],
  },
];

export const GARDEN_SCENES: readonly GardenSceneSpec[] = [
  {
    id: 'sunny-meadow',
    title: 'Sunny Meadow Fountain',
    fountainLabel: 'Meadow Waterwheel',
    pipeTint: '#E4F6F3',
    wheelAccent: '#3BA99C',
    basinAccent: '#5B5BD6',
  },
  {
    id: 'citrus-grove',
    title: 'Citrus Blossom Aqueduct',
    fountainLabel: 'Blossom Fountain',
    pipeTint: '#FFF6E5',
    wheelAccent: '#F27A5E',
    basinAccent: '#3BA99C',
  },
  {
    id: 'berry-brook',
    title: 'Berry Brook Waterwheel',
    fountainLabel: 'Brook Waterwheel',
    pipeTint: '#ECEBFF',
    wheelAccent: '#5B5BD6',
    basinAccent: '#F27A5E',
  },
];

const VALID_MODE_IDS = new Set<CountdownModeId>([
  '9-to-0',
  '5-to-0',
  '10-to-0',
  'missing-rods',
]);

const VALID_ROUND_LENGTHS = new Set<CountdownRoundLength>([1, 3, 5]);

/**
 * Curated balanced missing-number masks for 'missing-rods' (9 -> 0).
 * Every pattern leaves 5 missing numbers including 0 so the child practices scanning
 * anchored neighbours AND always enjoys the final Shut-Off Valve 0 payoff!
 */
const MISSING_ROD_PATTERNS: readonly (readonly number[])[] = [
  // Missing: 8, 6, 3, 1, 0  (Pre-sealed: 9, 7, 5, 4, 2)
  [9, 7, 5, 4, 2],
  // Missing: 9, 7, 4, 2, 0  (Pre-sealed: 8, 6, 5, 3, 1)
  [8, 6, 5, 3, 1],
  // Missing: 8, 5, 4, 2, 0  (Pre-sealed: 9, 7, 6, 3, 1)
  [9, 7, 6, 3, 1],
  // Missing: 9, 6, 3, 1, 0  (Pre-sealed: 8, 7, 5, 4, 2)
  [8, 7, 5, 4, 2],
  // Missing: 7, 6, 4, 1, 0  (Pre-sealed: 9, 8, 5, 3, 2)
  [9, 8, 5, 3, 2],
  // Missing: 8, 7, 3, 2, 0  (Pre-sealed: 9, 6, 5, 4, 1)
  [9, 6, 5, 4, 1],
];

export const NUMBER_WORD_LABELS: Readonly<Record<number, string>> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

export interface RodPaletteStyle {
  fill: string;
  border: string;
  segmentLine: string;
  badgeBg: string;
  text: string;
}

/**
 * Tactile Pebble brand palette rotation for numbered repair rods.
 * Cap 0 always gets the Golden Honey shut-off valve wheel styling.
 */
export function getRodPalette(num: number): RodPaletteStyle {
  if (num === 0) {
    return {
      fill: '#F2B84B',
      border: '#C98A1C',
      segmentLine: '#DDA032',
      badgeBg: '#FFF8E7',
      text: '#5A3B06',
    };
  }
  const mod = num % 3;
  if (mod === 0) {
    // Warm Indigo (9, 6, 3)
    return {
      fill: '#5B5BD6',
      border: '#4040B2',
      segmentLine: 'rgba(255, 255, 255, 0.34)',
      badgeBg: '#ECEBFF',
      text: '#FFFFFF',
    };
  }
  if (mod === 2) {
    // Soft Coral (8, 5, 2, 10 -> 10%3=1 wait: 8,5,2)
    return {
      fill: '#F27A5E',
      border: '#CD593E',
      segmentLine: 'rgba(255, 255, 255, 0.36)',
      badgeBg: '#FFF0EC',
      text: '#FFFFFF',
    };
  }
  // Sage Mint (10, 7, 4, 1)
  return {
    fill: '#3BA99C',
    border: '#278277',
    segmentLine: 'rgba(255, 255, 255, 0.36)',
    badgeBg: '#E4F6F3',
    text: '#FFFFFF',
  };
}

export function isValidCountdownModeId(value: unknown): value is CountdownModeId {
  return typeof value === 'string' && VALID_MODE_IDS.has(value as CountdownModeId);
}

export function isValidCountdownRoundLength(value: unknown): value is CountdownRoundLength {
  return typeof value === 'number' && VALID_ROUND_LENGTHS.has(value as CountdownRoundLength);
}

export function isValidPipeCountdownConfig(value: unknown): value is PipeCountdownConfig {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PipeCountdownConfig>;
  return (
    isValidCountdownModeId(candidate.modeId) &&
    isValidCountdownRoundLength(candidate.roundLength)
  );
}

export function getDefaultPipeCountdownConfig(): PipeCountdownConfig {
  return {
    modeId: DEFAULT_COUNTDOWN_MODE_ID,
    roundLength: DEFAULT_COUNTDOWN_ROUND_LENGTH,
  };
}

export function getCountdownModeSpec(modeId: CountdownModeId): CountdownModeSpec {
  return COUNTDOWN_MODES.find((m) => m.id === modeId) ?? COUNTDOWN_MODES[0];
}

export function getModeAllNumbers(modeId: CountdownModeId): number[] {
  const top = getCountdownModeSpec(modeId).topNumber;
  const nums: number[] = [];
  for (let n = top; n >= 0; n -= 1) {
    nums.push(n);
  }
  return nums;
}

/**
 * Splits a mode's countdown sequence into notebook strip rows matching the child's
 * K1 school notebook layout:
 * - 9 -> 0: [9, 8, 7, 6, 5] and [4, 3, 2, 1, 0]
 * - 10 -> 0: [10, 9, 8, 7, 6, 5] and [4, 3, 2, 1, 0]
 * - 5 -> 0: [5, 4, 3, 2, 1, 0]
 */
export function getNotebookRows(modeId: CountdownModeId): number[][] {
  if (modeId === '5-to-0') {
    return [[5, 4, 3, 2, 1, 0]];
  }
  if (modeId === '10-to-0') {
    return [
      [10, 9, 8, 7, 6, 5],
      [4, 3, 2, 1, 0],
    ];
  }
  return [
    [9, 8, 7, 6, 5],
    [4, 3, 2, 1, 0],
  ];
}

export function shuffleNumbers(items: readonly number[]): number[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // Ensure tray isn't accidentally sorted in exact descending order when length >= 3
  if (copy.length >= 3 && copy.every((val, idx) => idx === 0 || copy[idx - 1] > val)) {
    [copy[0], copy[copy.length - 1]] = [copy[copy.length - 1], copy[0]];
  }
  return copy;
}

export function buildSingleCountdownRound(
  modeId: CountdownModeId,
  roundIndex: number,
  patternSeedOffset = 0,
): CountdownRoundSpec {
  const allNumbers = getModeAllNumbers(modeId);
  const scene = GARDEN_SCENES[(roundIndex + patternSeedOffset) % GARDEN_SCENES.length];

  let preSealedNumbers: number[] = [];
  if (modeId === 'missing-rods') {
    const pattern =
      MISSING_ROD_PATTERNS[(roundIndex + patternSeedOffset) % MISSING_ROD_PATTERNS.length];
    preSealedNumbers = [...pattern];
  }

  const preSealedSet = new Set<number>(preSealedNumbers);
  const unsealed = allNumbers.filter((n) => !preSealedSet.has(n));
  const initialTrayOrder = shuffleNumbers(unsealed);

  return {
    roundUid: `pcd-${modeId}-${roundIndex}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    modeId,
    scene,
    allNumbers,
    preSealedNumbers,
    initialTrayOrder,
  };
}

export function buildCountdownSessionDeck(config: PipeCountdownConfig): CountdownRoundSpec[] {
  const seedOffset = Math.floor(Math.random() * MISSING_ROD_PATTERNS.length);
  return Array.from({ length: config.roundLength }, (_, idx) =>
    buildSingleCountdownRound(config.modeId, idx, seedOffset),
  );
}

export function loadPipeCountdownMastery(): PipeCountdownMastery {
  try {
    if (typeof window === 'undefined') {
      return { version: 1, completedRepairs: 0, flawlessRepairs: 0, modeCompletions: {} };
    }
    const raw = window.localStorage.getItem(PIPE_COUNTDOWN_MASTERY_KEY);
    if (!raw) {
      return { version: 1, completedRepairs: 0, flawlessRepairs: 0, modeCompletions: {} };
    }
    const parsed = JSON.parse(raw) as Partial<PipeCountdownMastery>;
    if (!parsed || typeof parsed !== 'object') {
      return { version: 1, completedRepairs: 0, flawlessRepairs: 0, modeCompletions: {} };
    }
    const completedRepairs =
      typeof parsed.completedRepairs === 'number' && Number.isFinite(parsed.completedRepairs)
        ? Math.max(0, Math.min(99999, Math.floor(parsed.completedRepairs)))
        : 0;
    const flawlessRepairs =
      typeof parsed.flawlessRepairs === 'number' && Number.isFinite(parsed.flawlessRepairs)
        ? Math.max(0, Math.min(completedRepairs, Math.floor(parsed.flawlessRepairs)))
        : 0;
    const modeCompletions: Partial<Record<CountdownModeId, number>> = {};
    if (parsed.modeCompletions && typeof parsed.modeCompletions === 'object') {
      for (const mode of COUNTDOWN_MODES) {
        const val = (parsed.modeCompletions as Record<string, unknown>)[mode.id];
        if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
          modeCompletions[mode.id] = Math.min(99999, Math.floor(val));
        }
      }
    }
    return {
      version: 1,
      completedRepairs,
      flawlessRepairs,
      modeCompletions,
    };
  } catch {
    return { version: 1, completedRepairs: 0, flawlessRepairs: 0, modeCompletions: {} };
  }
}

export function recordPipeCountdownRepairMastery(
  modeId: CountdownModeId,
  flawless: boolean,
): PipeCountdownMastery {
  const current = loadPipeCountdownMastery();
  const next: PipeCountdownMastery = {
    version: 1,
    completedRepairs: Math.min(99999, current.completedRepairs + 1),
    flawlessRepairs: flawless
      ? Math.min(99999, current.flawlessRepairs + 1)
      : current.flawlessRepairs,
    modeCompletions: {
      ...current.modeCompletions,
      [modeId]: Math.min(99999, (current.modeCompletions[modeId] ?? 0) + 1),
    },
  };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PIPE_COUNTDOWN_MASTERY_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

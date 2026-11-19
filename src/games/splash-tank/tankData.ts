import type { ClassLevelId } from '../../curriculum/curriculumTypes';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All configuration, active-session state, and
// mastery telemetry loaded from sessionStorage/localStorage are treated as untrusted input and
// validated against strict allow-lists and integer bounds before rendering via React JSX.

export type SplashTankModeId = 'k1-warmup' | 'k1-core' | 'k2-scaffold';

export type SplashTankRoundLength = 6 | 8 | 12;

export interface SplashTankConfig {
  classLevel: ClassLevelId;
  modeId: SplashTankModeId;
  roundLength: SplashTankRoundLength;
}

export interface SplashTankModeSpec {
  id: SplashTankModeId;
  classLevel: ClassLevelId;
  classBadge: string;
  title: string;
  rangeBadge: string;
  subtitle: string;
  sampleEquation: string;
  tankMax: 10 | 20;
  minTarget: number;
  maxTarget: number;
}

export interface SplashTankPrompt {
  uid: string;
  startLevel: number;
  targetLevel: number;
  missingAddend: number;
  tankMax: 10 | 20;
  buckets: number[];
}

export interface SplashTankMasteryState {
  version: 1;
  roundsCompleted: number;
  flawlessRounds: number;
  pipesFilled: number;
  firstTryFills: number;
}

export const SPLASH_TANK_SESSION_KEY = 'pebble.splash-tank.active.v1';
export const SPLASH_TANK_MASTERY_KEY = 'pebble.splash-tank.mastery.v1';

export const DEFAULT_SPLASH_MODE_ID: SplashTankModeId = 'k1-core';
export const DEFAULT_SPLASH_ROUND_LENGTH: SplashTankRoundLength = 6;

export const SPLASH_ROUND_LENGTHS: readonly {
  length: SplashTankRoundLength;
  label: string;
  subtitle: string;
}[] = [
  { length: 6, label: '6 Tanks', subtitle: 'Quick Splash' },
  { length: 8, label: '8 Tanks', subtitle: 'Garden Flow' },
  { length: 12, label: '12 Tanks', subtitle: 'Master Plumber' },
];

export const SPLASH_MODES: readonly SplashTankModeSpec[] = [
  {
    id: 'k1-warmup',
    classLevel: 'k1',
    classBadge: 'K1 Warm-Up',
    title: 'Small Tanks (3–10)',
    rangeBadge: 'Tank 1–10',
    subtitle: 'Gentle missing-addend fills with targets from 3 to 10.',
    sampleEquation: '2 + ? = 5',
    tankMax: 10,
    minTarget: 3,
    maxTarget: 10,
  },
  {
    id: 'k1-core',
    classLevel: 'k1',
    classBadge: 'K1 Core',
    title: 'Target 6–10',
    rangeBadge: 'Tank 1–10',
    subtitle: 'Fill the graduated 1–10 pipe to the exact target flag!',
    sampleEquation: '4 + ? = 7',
    tankMax: 10,
    minTarget: 6,
    maxTarget: 10,
  },
  {
    id: 'k2-scaffold',
    classLevel: 'k2',
    classBadge: 'K2 Scaffold',
    title: 'Tall Tanks (10–20)',
    rangeBadge: 'Tank 1–20',
    subtitle: 'Step up to 20-unit pipes and bigger missing addends!',
    sampleEquation: '8 + ? = 15',
    tankMax: 20,
    minTarget: 10,
    maxTarget: 20,
  },
];

const VALID_MODES = new Set<SplashTankModeId>(['k1-warmup', 'k1-core', 'k2-scaffold']);
const VALID_ROUND_LENGTHS = new Set<SplashTankRoundLength>([6, 8, 12]);

export function isValidSplashModeId(value: unknown): value is SplashTankModeId {
  return typeof value === 'string' && VALID_MODES.has(value as SplashTankModeId);
}

export function isValidSplashRoundLength(value: unknown): value is SplashTankRoundLength {
  return typeof value === 'number' && VALID_ROUND_LENGTHS.has(value as SplashTankRoundLength);
}

export function getSplashModeSpec(modeId: SplashTankModeId): SplashTankModeSpec {
  return SPLASH_MODES.find((m) => m.id === modeId) ?? SPLASH_MODES[1];
}

export function getDefaultSplashTankConfig(): SplashTankConfig {
  const spec = getSplashModeSpec(DEFAULT_SPLASH_MODE_ID);
  return {
    classLevel: spec.classLevel,
    modeId: DEFAULT_SPLASH_MODE_ID,
    roundLength: DEFAULT_SPLASH_ROUND_LENGTH,
  };
}

export function isValidSplashTankConfig(value: unknown): value is SplashTankConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<SplashTankConfig>;
  const validClass =
    c.classLevel === 'nursery' ||
    c.classLevel === 'k1' ||
    c.classLevel === 'k2' ||
    c.classLevel === 'grade1';
  return validClass && isValidSplashModeId(c.modeId) && isValidSplashRoundLength(c.roundLength);
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

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getCryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildBucketChoices(
  missingAddend: number,
  tankMax: 10 | 20,
): number[] {
  const maxBucket = tankMax === 10 ? 9 : 12;
  const minBucket = 1;
  const chosen = new Set<number>([missingAddend]);

  // Prefer close, pedagogically meaningful distractors (underfill and overflow)
  const nearOffsets = shuffleArray([-2, -1, 1, 2, -3, 3, 4]);
  for (const offset of nearOffsets) {
    if (chosen.size >= 4) break;
    const candidate = missingAddend + offset;
    if (candidate >= minBucket && candidate <= maxBucket) {
      chosen.add(candidate);
    }
  }

  let guard = 0;
  while (chosen.size < 4 && guard < 40) {
    guard += 1;
    const candidate = minBucket + getCryptoRandomInt(maxBucket - minBucket + 1);
    chosen.add(candidate);
  }

  return shuffleArray(Array.from(chosen));
}

export function generateSplashPrompt(
  modeId: SplashTankModeId,
  prevKey = '',
): SplashTankPrompt {
  const spec = getSplashModeSpec(modeId);
  let startLevel = 4;
  let targetLevel = 7;

  for (let attempt = 0; attempt < 28; attempt += 1) {
    if (modeId === 'k1-warmup') {
      // Targets 3..10, starting level 1..target-1, gap 1..5
      targetLevel = 3 + getCryptoRandomInt(8); // 3..10
      const maxGap = Math.min(5, targetLevel - 1);
      const gap = 1 + getCryptoRandomInt(maxGap);
      startLevel = targetLevel - gap;
    } else if (modeId === 'k1-core') {
      // Targets 6..10, starting level 1..target-1
      targetLevel = 6 + getCryptoRandomInt(5); // 6..10
      startLevel = 1 + getCryptoRandomInt(targetLevel - 1);
    } else {
      // k2-scaffold: Targets 10..20, starting level 2..target-1, gap 2..11
      targetLevel = 10 + getCryptoRandomInt(11); // 10..20
      const minGap = 2;
      const maxGap = Math.min(11, targetLevel - 2);
      const gap = minGap + getCryptoRandomInt(Math.max(1, maxGap - minGap + 1));
      startLevel = targetLevel - gap;
    }

    const key = `${startLevel}->${targetLevel}`;
    if (key !== prevKey) break;
  }

  const missingAddend = targetLevel - startLevel;
  const uid = `st-${Date.now().toString(36)}-${getCryptoRandomInt(99999)}`;

  return {
    uid,
    startLevel,
    targetLevel,
    missingAddend,
    tankMax: spec.tankMax,
    buckets: buildBucketChoices(missingAddend, spec.tankMax),
  };
}

export function loadSplashMastery(): SplashTankMasteryState {
  const fallback: SplashTankMasteryState = {
    version: 1,
    roundsCompleted: 0,
    flawlessRounds: 0,
    pipesFilled: 0,
    firstTryFills: 0,
  };
  try {
    const raw = window.localStorage.getItem(SPLASH_TANK_MASTERY_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SplashTankMasteryState>;
    if (!parsed || parsed.version !== 1) return fallback;
    const clamp = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    return {
      version: 1,
      roundsCompleted: clamp(parsed.roundsCompleted),
      flawlessRounds: clamp(parsed.flawlessRounds),
      pipesFilled: clamp(parsed.pipesFilled),
      firstTryFills: clamp(parsed.firstTryFills),
    };
  } catch {
    return fallback;
  }
}

function saveSplashMastery(state: SplashTankMasteryState): void {
  try {
    window.localStorage.setItem(SPLASH_TANK_MASTERY_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordSplashPipeFill(firstTry: boolean): void {
  const prev = loadSplashMastery();
  saveSplashMastery({
    ...prev,
    pipesFilled: prev.pipesFilled + 1,
    firstTryFills: prev.firstTryFills + (firstTry ? 1 : 0),
  });
}

export function recordSplashRoundFinished(flawless: boolean): void {
  const prev = loadSplashMastery();
  saveSplashMastery({
    ...prev,
    roundsCompleted: prev.roundsCompleted + 1,
    flawlessRounds: prev.flawlessRounds + (flawless ? 1 : 0),
  });
}

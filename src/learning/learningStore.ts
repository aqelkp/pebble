import { getCurriculumForClass, isValidFrameworkId, DEFAULT_FRAMEWORK_ID } from '../curriculum/curriculumRegistry';
import type {
  ClassLevelId,
  CurriculumDomainId,
  CurriculumFrameworkId,
  SkillType,
} from '../curriculum/curriculumTypes';
import { getCanonicalWord, type LetterId } from '../data/wordBank';
import { getGameRegistryEntry, type ActivityRole, type GameId } from '../games/registry';

// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. All learning telemetry stored in localStorage is treated as untrusted input and
// strictly validated against allow-lists and numeric bounds before rendering via React JSX.

export type MasteryTier = 'mastered' | 'developing' | 'needs-practice' | 'unseen';

export interface ConceptSkillStat {
  key: string; // `${playerId}::${conceptId}::${skillType}`
  playerId: string;
  conceptId: string; // e.g. "letter:M", "word:apple", "number:7", "sudoku:3x3"
  conceptLabel: string;
  skillType: SkillType;
  gameIds: GameId[];
  attempts: number;
  correct: number;
  mistakes: number;
  totalAttemptsTaken: number;
  /** Last up to 8 outcomes (1 = first-try/clean success, 0 = mistake) for recency-weighted accuracy */
  recentOutcomes: (0 | 1)[];
  lastPracticedAt: number;
}

export interface LearningSessionRecord {
  id: string;
  playerId: string;
  gameId: GameId;
  activityRole: ActivityRole;
  mode: string;
  totalAttempts: number;
  correctAttempts: number;
  mistakes: number;
  accuracyPct: number;
  flawless: boolean;
  durationMs: number;
  conceptsTested: string[];
  playedAt: number;
}

export interface LearningSettings {
  version: 1;
  adaptivePracticeEnabled: boolean;
  frameworkId: CurriculumFrameworkId;
}

interface StoredLearningState {
  version: 1;
  stats: Record<string, ConceptSkillStat>;
  sessions: LearningSessionRecord[];
}

const LEARNING_STORAGE_KEY = 'pebble.learning.v1';
const LEARNING_SETTINGS_KEY = 'pebble.learning.settings.v1';
const MAX_SESSIONS = 400;
const MAX_CONCEPT_KEYS = 2500;
const MAX_RECENT_OUTCOMES = 8;
const SAFE_ID_PATTERN = /^[a-z0-9:_-]{1,64}$/i;

const VALID_GAME_IDS = new Set<GameId>([
  'memory-match',
  'letter-train',
  'letter-trace',
  'letter-river',
  'picture-sudoku',
  'number-safari',
  'word-fun',
  'rescue-road',
  'sticker-jigsaw',
  'sticker-scene',
  'spot-the-twin',
  'dot-to-dot',
]);

const VALID_SKILL_TYPES = new Set<SkillType>([
  'picture_recognition',
  'initial_letter_sound',
  'word_spelling',
  'letter_formation',
  'quantity_counting',
  'group_joining',
  'grid_deduction',
  'visual_recall',
]);

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function sanitizeLabel(raw: unknown, fallback = 'Item'): string {
  if (typeof raw !== 'string') return fallback;
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 48) || fallback;
}

function makeStatKey(playerId: string, conceptId: string, skillType: SkillType): string {
  return `${playerId}::${conceptId}::${skillType}`;
}

function sanitizeStat(candidate: unknown): ConceptSkillStat | null {
  if (typeof candidate !== 'object' || candidate === null) return null;
  const raw = candidate as Partial<ConceptSkillStat>;
  if (typeof raw.playerId !== 'string' || !SAFE_ID_PATTERN.test(raw.playerId)) return null;
  if (typeof raw.conceptId !== 'string' || !SAFE_ID_PATTERN.test(raw.conceptId)) return null;
  if (typeof raw.skillType !== 'string' || !VALID_SKILL_TYPES.has(raw.skillType as SkillType)) {
    return null;
  }

  const gameIds = Array.isArray(raw.gameIds)
    ? raw.gameIds.filter((g): g is GameId => typeof g === 'string' && VALID_GAME_IDS.has(g as GameId))
    : [];

  const recentOutcomes = Array.isArray(raw.recentOutcomes)
    ? raw.recentOutcomes
        .filter((v): v is 0 | 1 => v === 0 || v === 1)
        .slice(-MAX_RECENT_OUTCOMES)
    : [];

  const attempts = clampInt(raw.attempts, 0, 50000, 0);
  const correct = clampInt(raw.correct, 0, attempts, 0);
  const mistakes = clampInt(raw.mistakes, 0, 50000, Math.max(0, attempts - correct));
  const totalAttemptsTaken = clampInt(raw.totalAttemptsTaken, attempts, 200000, attempts);
  const lastPracticedAt = clampInt(raw.lastPracticedAt, 0, Number.MAX_SAFE_INTEGER, Date.now());

  return {
    key: makeStatKey(raw.playerId, raw.conceptId, raw.skillType as SkillType),
    playerId: raw.playerId,
    conceptId: raw.conceptId,
    conceptLabel: sanitizeLabel(raw.conceptLabel, raw.conceptId),
    skillType: raw.skillType as SkillType,
    gameIds: Array.from(new Set(gameIds)),
    attempts,
    correct,
    mistakes,
    totalAttemptsTaken,
    recentOutcomes,
    lastPracticedAt,
  };
}

function sanitizeSession(candidate: unknown, index: number): LearningSessionRecord | null {
  if (typeof candidate !== 'object' || candidate === null) return null;
  const raw = candidate as Partial<LearningSessionRecord>;
  if (typeof raw.playerId !== 'string' || !SAFE_ID_PATTERN.test(raw.playerId)) return null;
  if (typeof raw.gameId !== 'string' || !VALID_GAME_IDS.has(raw.gameId as GameId)) return null;

  const gameMeta = getGameRegistryEntry(raw.gameId as GameId);
  const totalAttempts = clampInt(raw.totalAttempts, 0, 5000, 0);
  const correctAttempts = clampInt(raw.correctAttempts, 0, totalAttempts, 0);
  const mistakes = clampInt(raw.mistakes, 0, 5000, Math.max(0, totalAttempts - correctAttempts));
  const accuracyPct = clampInt(
    raw.accuracyPct,
    0,
    100,
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100,
  );
  const conceptsTested = Array.isArray(raw.conceptsTested)
    ? raw.conceptsTested
        .filter((c): c is string => typeof c === 'string' && SAFE_ID_PATTERN.test(c))
        .slice(0, 40)
    : [];

  return {
    id:
      typeof raw.id === 'string' && SAFE_ID_PATTERN.test(raw.id)
        ? raw.id
        : `sess-${index}-${Date.now().toString(36)}`,
    playerId: raw.playerId,
    gameId: raw.gameId as GameId,
    activityRole: raw.activityRole === 'reward' ? 'reward' : gameMeta.activityRole,
    mode: sanitizeLabel(raw.mode, 'default'),
    totalAttempts,
    correctAttempts,
    mistakes,
    accuracyPct,
    flawless: Boolean(raw.flawless),
    durationMs: clampInt(raw.durationMs, 0, 3600000, 0),
    conceptsTested,
    playedAt: clampInt(raw.playedAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
  };
}

function seedFromLegacyStores(): StoredLearningState {
  const stats: Record<string, ConceptSkillStat> = {};
  const sessions: LearningSessionRecord[] = [];
  const now = Date.now();
  const defaultPlayerId = 'child';

  try {
    // 1. Bridge Letter Train A–Z mastery
    const ltRaw = window.localStorage.getItem('pebble.letterTrain.mastery.v1');
    if (ltRaw) {
      const parsed: unknown = JSON.parse(ltRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && /^[A-Z]$/.test(item)) {
            const conceptId = `letter:${item}`;
            const key = makeStatKey(defaultPlayerId, conceptId, 'initial_letter_sound');
            stats[key] = {
              key,
              playerId: defaultPlayerId,
              conceptId,
              conceptLabel: `Letter ${item}`,
              skillType: 'initial_letter_sound',
              gameIds: ['letter-train'],
              attempts: 3,
              correct: 3,
              mistakes: 0,
              totalAttemptsTaken: 3,
              recentOutcomes: [1, 1, 1],
              lastPracticedAt: now,
            };
          }
        }
      }
    }

    // 2. Bridge Letter River A–Z mastery
    const lrRaw = window.localStorage.getItem('pebble.letter-river.mastery.v1');
    if (lrRaw) {
      const parsed: unknown = JSON.parse(lrRaw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && /^[A-Z]$/.test(item)) {
            const conceptId = `letter:${item}`;
            const key = makeStatKey(defaultPlayerId, conceptId, 'initial_letter_sound');
            const existing = stats[key];
            if (existing) {
              if (!existing.gameIds.includes('letter-river')) {
                existing.gameIds.push('letter-river');
              }
            } else {
              stats[key] = {
                key,
                playerId: defaultPlayerId,
                conceptId,
                conceptLabel: `Letter ${item}`,
                skillType: 'initial_letter_sound',
                gameIds: ['letter-river'],
                attempts: 3,
                correct: 3,
                mistakes: 0,
                totalAttemptsTaken: 3,
                recentOutcomes: [1, 1, 1],
                lastPracticedAt: now,
              };
            }
          }
        }
      }
    }

    // 3. Bridge Memory Match historical runs
    const memRaw = window.localStorage.getItem('pebble.memory.stats.v1');
    if (memRaw) {
      const parsed = JSON.parse(memRaw) as { runs?: unknown[] };
      if (Array.isArray(parsed?.runs)) {
        for (let i = 0; i < Math.min(parsed.runs.length, 40); i += 1) {
          const run = parsed.runs[i] as Record<string, unknown>;
          if (!run || typeof run !== 'object') continue;
          const totalAttempts = clampInt(run.totalAttempts, 1, 999, 10);
          const pairs = clampInt(run.pairs, 4, 20, 10);
          const accuracyPct = Math.min(100, Math.round((pairs / totalAttempts) * 100));
          sessions.push({
            id: `legacy-mem-${i}`,
            playerId: defaultPlayerId,
            gameId: 'memory-match',
            activityRole: 'reward',
            mode: typeof run.boardSizeId === 'string' ? run.boardSizeId : '4x5',
            totalAttempts,
            correctAttempts: pairs,
            mistakes: Math.max(0, totalAttempts - pairs),
            accuracyPct,
            flawless: totalAttempts === pairs,
            durationMs: 0,
            conceptsTested: [
              typeof run.themeId === 'string' ? `theme:${run.themeId}` : 'theme:lion-king',
            ],
            playedAt: clampInt(run.completedAt, 0, Number.MAX_SAFE_INTEGER, now),
          });
        }
      }
    }
  } catch {
    // Ignore malformed legacy storage
  }

  return { version: 1, stats, sessions };
}

function loadState(): StoredLearningState {
  try {
    const raw = window.localStorage.getItem(LEARNING_STORAGE_KEY);
    if (!raw) {
      const seeded = seedFromLegacyStores();
      if (Object.keys(seeded.stats).length > 0 || seeded.sessions.length > 0) {
        saveState(seeded);
      }
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<StoredLearningState>;
    if (!parsed || typeof parsed !== 'object') {
      return { version: 1, stats: {}, sessions: [] };
    }

    const stats: Record<string, ConceptSkillStat> = {};
    if (parsed.stats && typeof parsed.stats === 'object') {
      const entries = Object.values(parsed.stats).slice(0, MAX_CONCEPT_KEYS);
      for (const item of entries) {
        const clean = sanitizeStat(item);
        if (clean) stats[clean.key] = clean;
      }
    }

    const sessions: LearningSessionRecord[] = [];
    if (Array.isArray(parsed.sessions)) {
      for (let i = 0; i < Math.min(parsed.sessions.length, MAX_SESSIONS); i += 1) {
        const clean = sanitizeSession(parsed.sessions[i], i);
        if (clean) sessions.push(clean);
      }
    }

    return { version: 1, stats, sessions };
  } catch {
    return { version: 1, stats: {}, sessions: [] };
  }
}

function saveState(state: StoredLearningState): void {
  try {
    const boundedSessions = state.sessions.slice(-MAX_SESSIONS);
    const statEntries = Object.entries(state.stats);
    const boundedStats =
      statEntries.length > MAX_CONCEPT_KEYS
        ? Object.fromEntries(
            statEntries
              .sort((a, b) => b[1].lastPracticedAt - a[1].lastPracticedAt)
              .slice(0, MAX_CONCEPT_KEYS),
          )
        : state.stats;

    window.localStorage.setItem(
      LEARNING_STORAGE_KEY,
      JSON.stringify({ version: 1, stats: boundedStats, sessions: boundedSessions }),
    );
  } catch {
    // Ignore quota errors
  }
}

export function getLearningSettings(): LearningSettings {
  try {
    const raw = window.localStorage.getItem(LEARNING_SETTINGS_KEY);
    if (!raw) {
      return {
        version: 1,
        adaptivePracticeEnabled: true,
        frameworkId: DEFAULT_FRAMEWORK_ID,
      };
    }
    const parsed = JSON.parse(raw) as Partial<LearningSettings>;
    return {
      version: 1,
      adaptivePracticeEnabled:
        typeof parsed?.adaptivePracticeEnabled === 'boolean'
          ? parsed.adaptivePracticeEnabled
          : true,
      frameworkId: isValidFrameworkId(parsed?.frameworkId)
        ? parsed.frameworkId
        : DEFAULT_FRAMEWORK_ID,
    };
  } catch {
    return {
      version: 1,
      adaptivePracticeEnabled: true,
      frameworkId: DEFAULT_FRAMEWORK_ID,
    };
  }
}

export function saveLearningSettings(patch: Partial<Omit<LearningSettings, 'version'>>): LearningSettings {
  const current = getLearningSettings();
  const next: LearningSettings = {
    version: 1,
    adaptivePracticeEnabled:
      patch.adaptivePracticeEnabled !== undefined
        ? Boolean(patch.adaptivePracticeEnabled)
        : current.adaptivePracticeEnabled,
    frameworkId:
      patch.frameworkId !== undefined && isValidFrameworkId(patch.frameworkId)
        ? patch.frameworkId
        : current.frameworkId,
  };
  try {
    window.localStorage.setItem(LEARNING_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
  return next;
}

export interface RecordSkillAttemptInput {
  playerId: string;
  gameId: GameId;
  conceptId: string;
  conceptLabel: string;
  skillType: SkillType;
  correct: boolean;
  attemptsTaken?: number;
}

export function recordSkillAttempt(input: RecordSkillAttemptInput): void {
  const playerId = SAFE_ID_PATTERN.test(input.playerId) ? input.playerId : 'child';
  const conceptId = SAFE_ID_PATTERN.test(input.conceptId) ? input.conceptId : '';
  if (!conceptId || !VALID_GAME_IDS.has(input.gameId) || !VALID_SKILL_TYPES.has(input.skillType)) {
    return;
  }

  const state = loadState();
  const key = makeStatKey(playerId, conceptId, input.skillType);
  const existing = state.stats[key];
  const now = Date.now();
  const attemptsIncrement = clampInt(input.attemptsTaken ?? 1, 1, 50, 1);

  if (existing) {
    existing.attempts += 1;
    if (input.correct) {
      existing.correct += 1;
    } else {
      existing.mistakes += 1;
    }
    existing.totalAttemptsTaken += attemptsIncrement;
    const outcomeBit: 0 | 1 = input.correct ? 1 : 0;
    existing.recentOutcomes = [...existing.recentOutcomes, outcomeBit].slice(
      -MAX_RECENT_OUTCOMES,
    );
    if (!existing.gameIds.includes(input.gameId)) {
      existing.gameIds.push(input.gameId);
    }
    existing.lastPracticedAt = now;
  } else {
    state.stats[key] = {
      key,
      playerId,
      conceptId,
      conceptLabel: sanitizeLabel(input.conceptLabel, conceptId),
      skillType: input.skillType,
      gameIds: [input.gameId],
      attempts: 1,
      correct: input.correct ? 1 : 0,
      mistakes: input.correct ? 0 : 1,
      totalAttemptsTaken: attemptsIncrement,
      recentOutcomes: [input.correct ? 1 : 0],
      lastPracticedAt: now,
    };
  }

  saveState(state);
}

export interface RecordSessionInput {
  playerId: string;
  gameId: GameId;
  mode: string;
  totalAttempts: number;
  correctAttempts: number;
  mistakes: number;
  flawless: boolean;
  durationMs?: number;
  conceptsTested?: string[];
}

export function recordLearningSession(input: RecordSessionInput): void {
  const playerId = SAFE_ID_PATTERN.test(input.playerId) ? input.playerId : 'child';
  if (!VALID_GAME_IDS.has(input.gameId)) return;

  const gameMeta = getGameRegistryEntry(input.gameId);
  const totalAttempts = clampInt(input.totalAttempts, 0, 5000, 0);
  const correctAttempts = clampInt(input.correctAttempts, 0, totalAttempts, 0);
  const mistakes = clampInt(input.mistakes, 0, 5000, Math.max(0, totalAttempts - correctAttempts));
  const accuracyPct =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;

  const state = loadState();
  state.sessions.push({
    id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    playerId,
    gameId: input.gameId,
    activityRole: gameMeta.activityRole,
    mode: sanitizeLabel(input.mode, 'default'),
    totalAttempts,
    correctAttempts,
    mistakes,
    accuracyPct,
    flawless: Boolean(input.flawless),
    durationMs: clampInt(input.durationMs ?? 0, 0, 3600000, 0),
    conceptsTested: (input.conceptsTested ?? [])
      .filter((c) => SAFE_ID_PATTERN.test(c))
      .slice(0, 40),
    playedAt: Date.now(),
  });

  saveState(state);
}

export function getStatAccuracyPct(stat: Pick<ConceptSkillStat, 'attempts' | 'correct'>): number {
  if (stat.attempts <= 0) return 0;
  return Math.round((stat.correct / stat.attempts) * 100);
}

export function getRecentAccuracyPct(stat: ConceptSkillStat): number {
  if (stat.recentOutcomes.length === 0) return getStatAccuracyPct(stat);
  const sum = stat.recentOutcomes.reduce<number>((acc, val) => acc + val, 0);
  return Math.round((sum / stat.recentOutcomes.length) * 100);
}

export function getMasteryTier(
  stat: ConceptSkillStat | undefined,
  thresholdPct = 85,
  minExposures = 3,
): MasteryTier {
  if (!stat || stat.attempts === 0) return 'unseen';
  const recentAcc = getRecentAccuracyPct(stat);
  if (recentAcc >= thresholdPct && stat.attempts >= minExposures) return 'mastered';
  if (recentAcc >= 60) return 'developing';
  return 'needs-practice';
}

export function getPlayerConceptStats(playerId: string): ConceptSkillStat[] {
  const state = loadState();
  return Object.values(state.stats).filter((s) => s.playerId === playerId);
}

export function getPlayerSessions(playerId: string): LearningSessionRecord[] {
  const state = loadState();
  return state.sessions
    .filter((s) => s.playerId === playerId)
    .sort((a, b) => a.playedAt - b.playedAt);
}

export function getConceptSkillBreakdown(
  playerId: string,
  conceptId: string,
): ConceptSkillStat[] {
  return getPlayerConceptStats(playerId).filter((s) => s.conceptId === conceptId);
}

/**
 * Aggregates multiple skill stats for the same concept (e.g., all skills on `word:cat` or `letter:M`)
 * into a single summary tier and weighted accuracy.
 */
export function getAggregateConceptSummary(
  stats: readonly ConceptSkillStat[],
  thresholdPct = 85,
  minExposures = 3,
): {
  attempts: number;
  correct: number;
  mistakes: number;
  accuracyPct: number;
  recentAccuracyPct: number;
  avgAttemptsPerSuccess: number | null;
  tier: MasteryTier;
  lastPracticedAt: number | null;
} {
  if (stats.length === 0) {
    return {
      attempts: 0,
      correct: 0,
      mistakes: 0,
      accuracyPct: 0,
      recentAccuracyPct: 0,
      avgAttemptsPerSuccess: null,
      tier: 'unseen',
      lastPracticedAt: null,
    };
  }

  let attempts = 0;
  let correct = 0;
  let mistakes = 0;
  let totalAttemptsTaken = 0;
  let recentSum = 0;
  let recentCount = 0;
  let lastPracticedAt = 0;

  for (const s of stats) {
    attempts += s.attempts;
    correct += s.correct;
    mistakes += s.mistakes;
    totalAttemptsTaken += s.totalAttemptsTaken;
    for (const o of s.recentOutcomes) {
      recentSum += o;
      recentCount += 1;
    }
    if (s.lastPracticedAt > lastPracticedAt) {
      lastPracticedAt = s.lastPracticedAt;
    }
  }

  const accuracyPct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const recentAccuracyPct = recentCount > 0 ? Math.round((recentSum / recentCount) * 100) : accuracyPct;
  const avgAttemptsPerSuccess =
    correct > 0 ? Math.round((totalAttemptsTaken / correct) * 10) / 10 : null;

  let tier: MasteryTier = 'unseen';
  if (attempts > 0) {
    if (recentAccuracyPct >= thresholdPct && attempts >= minExposures) tier = 'mastered';
    else if (recentAccuracyPct >= 60) tier = 'developing';
    else tier = 'needs-practice';
  }

  return {
    attempts,
    correct,
    mistakes,
    accuracyPct,
    recentAccuracyPct,
    avgAttemptsPerSuccess,
    tier,
    lastPracticedAt: lastPracticedAt || null,
  };
}

export interface DomainProgressSummary {
  domainId: CurriculumDomainId;
  title: string;
  subtitle: string;
  accentColor: string;
  attempts: number;
  accuracyPct: number | null;
  masteredCount: number;
  practicedCount: number;
}

export interface CurriculumOverview {
  classLevel: ClassLevelId;
  benchmarkTitle: string;
  lettersMastered: number;
  lettersTotal: number;
  coreWordsMastered: number;
  coreWordsPracticed: number;
  coreWordsTotal: number;
  cvcWordsMastered: number;
  cvcWordsTotal: number;
  numbersMastered: number;
  numbersTotal: number;
  learningSessionsCount: number;
  rewardSessionsCount: number;
  flawlessRatePct: number | null;
  domainSummaries: DomainProgressSummary[];
  strongestConcepts: { conceptId: string; label: string; accuracyPct: number; attempts: number }[];
  needsPracticeConcepts: { conceptId: string; label: string; accuracyPct: number; attempts: number }[];
}

export function getCurriculumOverview(
  playerId: string,
  classLevel: ClassLevelId,
): CurriculumOverview {
  const benchmark = getCurriculumForClass(classLevel);
  const allStats = getPlayerConceptStats(playerId);
  const sessions = getPlayerSessions(playerId);

  const statsByConcept = new Map<string, ConceptSkillStat[]>();
  for (const s of allStats) {
    const arr = statsByConcept.get(s.conceptId) ?? [];
    arr.push(s);
    statsByConcept.set(s.conceptId, arr);
  }

  let lettersMastered = 0;
  for (const letter of benchmark.targetLetters) {
    const agg = getAggregateConceptSummary(
      statsByConcept.get(`letter:${letter}`) ?? [],
      benchmark.masteryThresholdPct,
      benchmark.minExposuresForMastery,
    );
    if (agg.tier === 'mastered') lettersMastered += 1;
  }

  let coreWordsMastered = 0;
  let coreWordsPracticed = 0;
  for (const wordId of benchmark.coreWordIds) {
    const agg = getAggregateConceptSummary(
      statsByConcept.get(`word:${wordId}`) ?? [],
      benchmark.masteryThresholdPct,
      benchmark.minExposuresForMastery,
    );
    if (agg.tier !== 'unseen') coreWordsPracticed += 1;
    if (agg.tier === 'mastered') coreWordsMastered += 1;
  }

  let cvcWordsMastered = 0;
  for (const wordId of benchmark.cvcWordIds) {
    const stats = (statsByConcept.get(`word:${wordId}`) ?? []).filter(
      (s) => s.skillType === 'word_spelling',
    );
    const agg = getAggregateConceptSummary(
      stats,
      benchmark.masteryThresholdPct,
      2,
    );
    if (agg.tier === 'mastered') cvcWordsMastered += 1;
  }

  let numbersMastered = 0;
  for (const num of benchmark.targetNumbers) {
    const agg = getAggregateConceptSummary(
      statsByConcept.get(`number:${num}`) ?? [],
      benchmark.masteryThresholdPct,
      2,
    );
    if (agg.tier === 'mastered') numbersMastered += 1;
  }

  const learningSessions = sessions.filter((s) => s.activityRole === 'learning');
  const rewardSessions = sessions.filter((s) => s.activityRole === 'reward');
  const flawlessCount = learningSessions.filter((s) => s.flawless).length;
  const flawlessRatePct =
    learningSessions.length > 0
      ? Math.round((flawlessCount / learningSessions.length) * 100)
      : null;

  const domainSummaries: DomainProgressSummary[] = benchmark.domains.map((domain) => {
    if (domain.id === 'self-regulation') {
      return {
        domainId: domain.id,
        title: domain.title,
        subtitle: domain.subtitle,
        accentColor: domain.accentColor,
        attempts: learningSessions.length,
        accuracyPct: flawlessRatePct,
        masteredCount: flawlessCount,
        practicedCount: learningSessions.length,
      };
    }

    const matchingStats = allStats.filter((s) => domain.targetSkills.includes(s.skillType));
    const uniqueConcepts = new Set(matchingStats.map((s) => s.conceptId));
    let domainAttempts = 0;
    let domainCorrect = 0;
    let masteredCount = 0;

    for (const cId of uniqueConcepts) {
      const cStats = matchingStats.filter((s) => s.conceptId === cId);
      const agg = getAggregateConceptSummary(
        cStats,
        benchmark.masteryThresholdPct,
        benchmark.minExposuresForMastery,
      );
      domainAttempts += agg.attempts;
      domainCorrect += agg.correct;
      if (agg.tier === 'mastered') masteredCount += 1;
    }

    return {
      domainId: domain.id,
      title: domain.title,
      subtitle: domain.subtitle,
      accentColor: domain.accentColor,
      attempts: domainAttempts,
      accuracyPct: domainAttempts > 0 ? Math.round((domainCorrect / domainAttempts) * 100) : null,
      masteredCount,
      practicedCount: uniqueConcepts.size,
    };
  });

  const conceptRollups: {
    conceptId: string;
    label: string;
    accuracyPct: number;
    attempts: number;
    tier: MasteryTier;
  }[] = [];

  for (const [conceptId, cStats] of statsByConcept.entries()) {
    const agg = getAggregateConceptSummary(
      cStats,
      benchmark.masteryThresholdPct,
      benchmark.minExposuresForMastery,
    );
    if (agg.attempts === 0) continue;
    const rawLabel = cStats[0]?.conceptLabel ?? conceptId;
    const canonical = conceptId.startsWith('word:')
      ? getCanonicalWord(conceptId.slice(5))?.word
      : undefined;
    conceptRollups.push({
      conceptId,
      label: canonical ?? rawLabel,
      accuracyPct: agg.recentAccuracyPct,
      attempts: agg.attempts,
      tier: agg.tier,
    });
  }

  const strongestConcepts = conceptRollups
    .filter((c) => c.tier === 'mastered' || (c.accuracyPct >= 85 && c.attempts >= 2))
    .sort((a, b) => b.accuracyPct - a.accuracyPct || b.attempts - a.attempts)
    .slice(0, 6);

  const needsPracticeConcepts = conceptRollups
    .filter((c) => c.tier === 'needs-practice' || c.accuracyPct < 75)
    .sort((a, b) => a.accuracyPct - b.accuracyPct || b.attempts - a.attempts)
    .slice(0, 6);

  return {
    classLevel,
    benchmarkTitle: benchmark.title,
    lettersMastered,
    lettersTotal: benchmark.targetLetters.length,
    coreWordsMastered,
    coreWordsPracticed,
    coreWordsTotal: benchmark.coreWordIds.length,
    cvcWordsMastered,
    cvcWordsTotal: benchmark.cvcWordIds.length,
    numbersMastered,
    numbersTotal: benchmark.targetNumbers.length,
    learningSessionsCount: learningSessions.length,
    rewardSessionsCount: rewardSessions.length,
    flawlessRatePct,
    domainSummaries,
    strongestConcepts,
    needsPracticeConcepts,
  };
}

export interface GameMetricsSummary {
  gameId: GameId;
  sessions: LearningSessionRecord[];
  totalRounds: number;
  flawlessRounds: number;
  averageAccuracyPct: number | null;
  averageAttemptsPerRound: number | null;
  recentAccuracyTrend: number[];
  recentAttemptsTrend: number[];
  conceptStats: ConceptSkillStat[];
}

export function getGameMetricsSummary(playerId: string, gameId: GameId): GameMetricsSummary {
  const sessions = getPlayerSessions(playerId).filter((s) => s.gameId === gameId);
  const conceptStats = getPlayerConceptStats(playerId).filter((s) => s.gameIds.includes(gameId));

  const totalRounds = sessions.length;
  const flawlessRounds = sessions.filter((s) => s.flawless).length;
  const averageAccuracyPct =
    totalRounds > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.accuracyPct, 0) / totalRounds)
      : null;
  const averageAttemptsPerRound =
    totalRounds > 0
      ? Math.round((sessions.reduce((acc, s) => acc + s.totalAttempts, 0) / totalRounds) * 10) / 10
      : null;

  const recent = sessions.slice(-10);
  return {
    gameId,
    sessions,
    totalRounds,
    flawlessRounds,
    averageAccuracyPct,
    averageAttemptsPerRound,
    recentAccuracyTrend: recent.map((s) => s.accuracyPct),
    recentAttemptsTrend: recent.map((s) => s.totalAttempts),
    conceptStats,
  };
}

export function getLetterSummaryMap(
  playerId: string,
  letters: readonly LetterId[],
): Map<LetterId, ReturnType<typeof getAggregateConceptSummary>> {
  const allStats = getPlayerConceptStats(playerId);
  const map = new Map<LetterId, ReturnType<typeof getAggregateConceptSummary>>();
  for (const letter of letters) {
    const stats = allStats.filter((s) => s.conceptId === `letter:${letter}`);
    map.set(letter, getAggregateConceptSummary(stats));
  }
  return map;
}

export function resetAllLearningTelemetry(): void {
  try {
    window.localStorage.removeItem(LEARNING_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

import {
  BOARD_SIZES,
  CARD_THEMES,
  getBoardSizeSpec,
  type BoardSizeId,
  type ThemeId,
} from './themes';

// TODO(security): Pebble is a 100% client-side family game with no backend server, authentication,
// or database. All attempt history and best records stored in localStorage are treated as untrusted
// input and strictly validated against allow-lists and numeric bounds before rendering via React JSX.

export interface PlayerAttemptStat {
  playerId: string;
  attempts: number;
  matches: number;
}

export interface MemoryGameRun {
  id: string;
  roundKey: string;
  themeId: ThemeId;
  boardSizeId: BoardSizeId;
  pairs: number;
  totalAttempts: number;
  playerStats: PlayerAttemptStat[];
  completedAt: number;
}

interface StoredMemoryStatsState {
  version: 1;
  runs: MemoryGameRun[];
}

export interface ThemeBoardStatsSummary {
  themeId: ThemeId;
  boardSizeId: BoardSizeId;
  pairs: number;
  gamesPlayed: number;
  bestAttempts: number | null;
  lastAttempts: number | null;
  previousAttempts: number | null;
  firstAttempts: number | null;
  averageAttempts: number | null;
  /** Positive means the latest game used FEWER attempts than the game right before it. */
  improvementFromPrevious: number | null;
  /** Positive means the latest game used FEWER attempts than the first recorded game. */
  improvementFromFirst: number | null;
  /** Chronological order (oldest -> newest), bounded to last 8 games for trend display. */
  recentRuns: MemoryGameRun[];
}

export interface RecordCompletionOutcome {
  run: MemoryGameRun;
  gamesPlayed: number;
  bestAttempts: number;
  previousBestAttempts: number | null;
  previousLastAttempts: number | null;
  firstAttempts: number;
  isFirstRecord: boolean;
  isNewBest: boolean;
  tiedBest: boolean;
  improvementFromPrevious: number | null;
  improvementFromFirst: number | null;
  /** Chronological order (oldest -> newest), bounded to last 6 games including this run. */
  recentRuns: MemoryGameRun[];
}

export interface RecordMemoryGameInput {
  roundKey: string;
  themeId: ThemeId;
  boardSizeId: BoardSizeId;
  pairs: number;
  totalAttempts: number;
  playerStats: PlayerAttemptStat[];
}

const MEMORY_STATS_STORAGE_KEY = 'pebble.memory.stats.v1';
const MAX_RUNS_PER_BUCKET = 25;
const MAX_TOTAL_RUNS = 750;
const MAX_PLAYERS_PER_RUN = 4;
const MAX_ATTEMPTS = 999;

const VALID_THEME_IDS = new Set<ThemeId>(CARD_THEMES.map((t) => t.id));
const VALID_BOARD_SIZE_IDS = new Set<BoardSizeId>(BOARD_SIZES.map((b) => b.id));
const SAFE_ID_PATTERN = /^[a-z0-9-]{1,40}$/i;

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function sanitizePlayerStat(candidate: unknown): PlayerAttemptStat | null {
  if (typeof candidate !== 'object' || candidate === null) return null;
  const raw = candidate as Partial<PlayerAttemptStat>;
  if (typeof raw.playerId !== 'string' || !SAFE_ID_PATTERN.test(raw.playerId)) {
    return null;
  }
  const attempts = clampInt(raw.attempts, 0, MAX_ATTEMPTS, 0);
  const matches = clampInt(raw.matches, 0, 50, 0);
  return {
    playerId: raw.playerId,
    attempts,
    matches,
  };
}

function sanitizeRun(candidate: unknown, fallbackIndex: number): MemoryGameRun | null {
  if (typeof candidate !== 'object' || candidate === null) return null;
  const raw = candidate as Partial<MemoryGameRun>;

  if (typeof raw.themeId !== 'string' || !VALID_THEME_IDS.has(raw.themeId as ThemeId)) {
    return null;
  }
  if (
    typeof raw.boardSizeId !== 'string' ||
    !VALID_BOARD_SIZE_IDS.has(raw.boardSizeId as BoardSizeId)
  ) {
    return null;
  }

  const themeId = raw.themeId as ThemeId;
  const boardSizeId = raw.boardSizeId as BoardSizeId;
  const spec = getBoardSizeSpec(boardSizeId);
  const pairs = clampInt(raw.pairs, 1, 50, spec.pairs);
  const totalAttempts = clampInt(raw.totalAttempts, pairs, MAX_ATTEMPTS, pairs);
  const completedAt = clampInt(raw.completedAt, 1, 9_999_999_999_999, Date.now());

  const id =
    typeof raw.id === 'string' && SAFE_ID_PATTERN.test(raw.id)
      ? raw.id
      : `run-${completedAt.toString(36)}-${fallbackIndex.toString(36)}`;
  const roundKey =
    typeof raw.roundKey === 'string' && SAFE_ID_PATTERN.test(raw.roundKey)
      ? raw.roundKey
      : id;

  const rawStats = Array.isArray(raw.playerStats) ? raw.playerStats : [];
  const playerStats: PlayerAttemptStat[] = [];
  for (let i = 0; i < Math.min(rawStats.length, MAX_PLAYERS_PER_RUN); i += 1) {
    const cleaned = sanitizePlayerStat(rawStats[i]);
    if (cleaned) playerStats.push(cleaned);
  }

  return {
    id,
    roundKey,
    themeId,
    boardSizeId,
    pairs,
    totalAttempts,
    playerStats,
    completedAt,
  };
}

function boundRunsPerBucket(runs: readonly MemoryGameRun[]): MemoryGameRun[] {
  const bucketCounts = new Map<string, number>();
  // Keep newest runs per (themeId, boardSizeId) up to MAX_RUNS_PER_BUCKET, preserving chronological order
  const reversedKept: MemoryGameRun[] = [];

  for (let i = runs.length - 1; i >= 0; i -= 1) {
    if (reversedKept.length >= MAX_TOTAL_RUNS) break;
    const run = runs[i];
    const key = `${run.themeId}::${run.boardSizeId}`;
    const currentCount = bucketCounts.get(key) ?? 0;
    if (currentCount >= MAX_RUNS_PER_BUCKET) continue;
    bucketCounts.set(key, currentCount + 1);
    reversedKept.push(run);
  }

  return reversedKept.reverse();
}

export function loadMemoryStatsRuns(): MemoryGameRun[] {
  try {
    const raw = window.localStorage.getItem(MEMORY_STATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const record = parsed as Partial<StoredMemoryStatsState>;
    if (!Array.isArray(record.runs)) return [];

    const sanitized: MemoryGameRun[] = [];
    const seenRoundKeys = new Set<string>();

    for (let i = 0; i < Math.min(record.runs.length, MAX_TOTAL_RUNS); i += 1) {
      const cleaned = sanitizeRun(record.runs[i], i + 1);
      if (!cleaned) continue;
      if (seenRoundKeys.has(cleaned.roundKey)) continue;
      seenRoundKeys.add(cleaned.roundKey);
      sanitized.push(cleaned);
    }

    sanitized.sort((a, b) => a.completedAt - b.completedAt);
    return boundRunsPerBucket(sanitized);
  } catch {
    return [];
  }
}

function saveMemoryStatsRuns(runs: readonly MemoryGameRun[]): void {
  try {
    const bounded = boundRunsPerBucket(runs);
    const payload: StoredMemoryStatsState = {
      version: 1,
      runs: bounded,
    };
    window.localStorage.setItem(MEMORY_STATS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function clearMemoryStats(): void {
  try {
    window.localStorage.removeItem(MEMORY_STATS_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

function buildOutcomeFromHistory(
  priorBucketRuns: readonly MemoryGameRun[],
  currentRun: MemoryGameRun,
): RecordCompletionOutcome {
  const allBucketRuns = [...priorBucketRuns, currentRun];
  const gamesPlayed = allBucketRuns.length;
  const previousBestAttempts =
    priorBucketRuns.length > 0
      ? Math.min(...priorBucketRuns.map((r) => r.totalAttempts))
      : null;
  const previousLastAttempts =
    priorBucketRuns.length > 0
      ? priorBucketRuns[priorBucketRuns.length - 1].totalAttempts
      : null;
  const bestAttempts =
    previousBestAttempts !== null
      ? Math.min(previousBestAttempts, currentRun.totalAttempts)
      : currentRun.totalAttempts;
  const firstAttempts = allBucketRuns[0].totalAttempts;

  const isFirstRecord = priorBucketRuns.length === 0;
  const isNewBest =
    previousBestAttempts !== null && currentRun.totalAttempts < previousBestAttempts;
  const tiedBest =
    previousBestAttempts !== null && currentRun.totalAttempts === previousBestAttempts;

  const improvementFromPrevious =
    previousLastAttempts !== null ? previousLastAttempts - currentRun.totalAttempts : null;
  const improvementFromFirst =
    priorBucketRuns.length > 0 ? firstAttempts - currentRun.totalAttempts : null;

  return {
    run: currentRun,
    gamesPlayed,
    bestAttempts,
    previousBestAttempts,
    previousLastAttempts,
    firstAttempts,
    isFirstRecord,
    isNewBest,
    tiedBest,
    improvementFromPrevious,
    improvementFromFirst,
    recentRuns: allBucketRuns.slice(-6),
  };
}

export function recordCompletedMemoryGame(input: RecordMemoryGameInput): RecordCompletionOutcome {
  const allRuns = loadMemoryStatsRuns();
  const safeRoundKey = SAFE_ID_PATTERN.test(input.roundKey)
    ? input.roundKey
    : `round-${Date.now().toString(36)}`;

  const bucketRuns = allRuns.filter(
    (r) => r.themeId === input.themeId && r.boardSizeId === input.boardSizeId,
  );

  // Idempotency check: if this exact roundKey was already saved (e.g., StrictMode or page reload),
  // compute the same celebration outcome without inserting a duplicate record.
  const existingIdx = bucketRuns.findIndex((r) => r.roundKey === safeRoundKey);
  if (existingIdx >= 0) {
    const existingRun = bucketRuns[existingIdx];
    const priorRuns = bucketRuns.slice(0, existingIdx);
    return buildOutcomeFromHistory(priorRuns, existingRun);
  }

  const spec = getBoardSizeSpec(input.boardSizeId);
  const pairs = clampInt(input.pairs, 1, 50, spec.pairs);
  const totalAttempts = clampInt(input.totalAttempts, pairs, MAX_ATTEMPTS, pairs);
  const now = Date.now();

  const cleanedPlayerStats: PlayerAttemptStat[] = [];
  for (let i = 0; i < Math.min(input.playerStats.length, MAX_PLAYERS_PER_RUN); i += 1) {
    const stat = sanitizePlayerStat(input.playerStats[i]);
    if (stat) cleanedPlayerStats.push(stat);
  }

  const newRun: MemoryGameRun = {
    id: `run-${now.toString(36)}-${(allRuns.length + 1).toString(36)}`,
    roundKey: safeRoundKey,
    themeId: input.themeId,
    boardSizeId: input.boardSizeId,
    pairs,
    totalAttempts,
    playerStats: cleanedPlayerStats,
    completedAt: now,
  };

  const updatedAllRuns = boundRunsPerBucket([...allRuns, newRun]);
  saveMemoryStatsRuns(updatedAllRuns);

  const updatedBucketRuns = updatedAllRuns.filter(
    (r) => r.themeId === input.themeId && r.boardSizeId === input.boardSizeId,
  );
  const priorBucketRuns = updatedBucketRuns.slice(0, -1);

  return buildOutcomeFromHistory(priorBucketRuns, newRun);
}

export function getThemeBoardSummary(
  runs: readonly MemoryGameRun[],
  themeId: ThemeId,
  boardSizeId: BoardSizeId,
): ThemeBoardStatsSummary {
  const spec = getBoardSizeSpec(boardSizeId);
  const bucket = runs.filter((r) => r.themeId === themeId && r.boardSizeId === boardSizeId);

  if (bucket.length === 0) {
    return {
      themeId,
      boardSizeId,
      pairs: spec.pairs,
      gamesPlayed: 0,
      bestAttempts: null,
      lastAttempts: null,
      previousAttempts: null,
      firstAttempts: null,
      averageAttempts: null,
      improvementFromPrevious: null,
      improvementFromFirst: null,
      recentRuns: [],
    };
  }

  const bestAttempts = Math.min(...bucket.map((r) => r.totalAttempts));
  const lastAttempts = bucket[bucket.length - 1].totalAttempts;
  const previousAttempts = bucket.length >= 2 ? bucket[bucket.length - 2].totalAttempts : null;
  const firstAttempts = bucket[0].totalAttempts;
  const sum = bucket.reduce((acc, item) => acc + item.totalAttempts, 0);
  const averageAttempts = Math.round((sum / bucket.length) * 10) / 10;

  const improvementFromPrevious =
    previousAttempts !== null ? previousAttempts - lastAttempts : null;
  const improvementFromFirst = bucket.length >= 2 ? firstAttempts - lastAttempts : null;

  return {
    themeId,
    boardSizeId,
    pairs: spec.pairs,
    gamesPlayed: bucket.length,
    bestAttempts,
    lastAttempts,
    previousAttempts,
    firstAttempts,
    averageAttempts,
    improvementFromPrevious,
    improvementFromFirst,
    recentRuns: bucket.slice(-8),
  };
}

export function getAllThemesSummaryForBoard(
  runs: readonly MemoryGameRun[],
  boardSizeId: BoardSizeId,
): ThemeBoardStatsSummary[] {
  return CARD_THEMES.map((theme) => getThemeBoardSummary(runs, theme.id, boardSizeId));
}

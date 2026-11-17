import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS, isValidLetterId } from '../games/letter-train/letterData';
import { GAME_REGISTRY, type GameRegistryEntry } from '../games/registry';
import {
  CURRENT_JOURNEY_EPOCH,
  TOTAL_ACTIVITIES,
  type CompletedSlotSnapshot,
  type FunBreakPacingMode,
  type JourneyActivity,
  type JourneyDurationMode,
  type JourneyPlayerMode,
  type JourneyProgressState,
  type JourneySettings,
  type LettersPerLesson,
} from './journeyTypes';

// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. All journey settings, completed activity indices, frozen slot snapshots, and letter
// coverage read from localStorage are treated as untrusted input and validated against strict
// allow-lists and integer bounds before use. Add authenticated server persistence if cloud sync is ever introduced.

const JOURNEY_STORAGE_KEY = 'pebble.journey.v1';
const NAV_SESSION_KEY = 'pebble.nav.v1';

const ALL_GAME_IDS: GameRegistryEntry['id'][] = GAME_REGISTRY.map((g) => g.id);

export function getDefaultJourneySettings(
  catalogIds: readonly GameRegistryEntry['id'][] = ALL_GAME_IDS,
): JourneySettings {
  return {
    guidedModeEnabled: true,
    lettersPerLesson: 4,
    durationMode: 'short',
    waitForVoiceIntro: true,
    playerMode: 'solo',
    funBreakPacing: 'after-2',
    boostedGames: [],
    speakChildName: true,
    pacingVersion: 3,
    selectedLetters: [...ALL_LETTERS],
    enabledGames: [...catalogIds],
    knownGames: [...catalogIds],
  };
}

export function getDefaultJourneyState(
  catalogIds: readonly GameRegistryEntry['id'][] = ALL_GAME_IDS,
): JourneyProgressState {
  return {
    version: 1,
    curriculumEpoch: CURRENT_JOURNEY_EPOCH,
    settings: getDefaultJourneySettings(catalogIds),
    currentActivityIndex: 0,
    completedActivityIndices: [],
    coveredLetters: [],
    completedSnapshots: {},
    pendingIntroGames: [],
  };
}

function normalizeLettersList(raw: unknown, fallback: LetterId[]): LetterId[] {
  if (!Array.isArray(raw)) return fallback;
  const unique = new Set<LetterId>();
  for (const item of raw) {
    if (isValidLetterId(item)) {
      unique.add(item);
    }
  }
  if (unique.size === 0) return fallback;
  return ALL_LETTERS.filter((letter) => unique.has(letter));
}

function normalizeKnownGames(
  raw: unknown,
  validSet: Set<string>,
  fallbackIds: readonly GameRegistryEntry['id'][],
): Set<GameRegistryEntry['id']> {
  if (!Array.isArray(raw)) {
    return new Set<GameRegistryEntry['id']>(fallbackIds);
  }
  const set = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && validSet.has(item)) {
      set.add(item as GameRegistryEntry['id']);
    }
  }
  return set;
}

function normalizeEnabledGames(
  raw: unknown,
  knownSet: Set<GameRegistryEntry['id']>,
  catalogIds: readonly GameRegistryEntry['id'][],
  validSet: Set<string>,
): GameRegistryEntry['id'][] {
  if (!Array.isArray(raw)) return [...catalogIds];
  const unique = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && validSet.has(item)) {
      unique.add(item as GameRegistryEntry['id']);
    }
  }
  // Auto-enroll newly introduced games for returning learners
  for (const gameId of catalogIds) {
    if (!knownSet.has(gameId)) {
      unique.add(gameId);
    }
  }
  if (unique.size === 0) return [...catalogIds];
  return catalogIds.filter((id) => unique.has(id));
}

function normalizeFunBreakPacing(raw: unknown, pacingVersion: unknown): FunBreakPacingMode {
  if (
    pacingVersion !== 2 &&
    pacingVersion !== 3 &&
    (raw === 'balanced' || raw === undefined)
  ) {
    return 'after-2';
  }
  if (raw === 'every-2') return 'after-1';
  if (raw === 'every-3') return 'after-2';
  if (
    raw === 'after-2' ||
    raw === 'after-3' ||
    raw === 'after-1' ||
    raw === 'balanced' ||
    raw === 'off'
  ) {
    return raw;
  }
  return 'after-2';
}

function normalizeBoostedGames(
  raw: unknown,
  pacingVersion: unknown,
  catalogIds: readonly GameRegistryEntry['id'][],
  validSet: Set<string>,
): GameRegistryEntry['id'][] {
  // Clean up legacy accidental default boost from pacingVersion <= 2
  if (pacingVersion !== 3) return [];
  if (!Array.isArray(raw)) return [];
  const unique = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && validSet.has(item)) {
      unique.add(item as GameRegistryEntry['id']);
    }
  }
  return catalogIds.filter((id) => unique.has(id));
}

function sanitizeSettings(
  raw: unknown,
  catalogIds: readonly GameRegistryEntry['id'][],
  validSet: Set<string>,
  resetSelectionsForEpoch: boolean,
): { settings: JourneySettings; newlyDiscoveredGames: GameRegistryEntry['id'][] } {
  const defaults = getDefaultJourneySettings(catalogIds);
  if (typeof raw !== 'object' || raw === null) {
    return { settings: defaults, newlyDiscoveredGames: [] };
  }
  const candidate = raw as Partial<JourneySettings>;

  const lettersPerLesson: LettersPerLesson =
    candidate.lettersPerLesson === 3 ||
    candidate.lettersPerLesson === 4 ||
    candidate.lettersPerLesson === 5
      ? candidate.lettersPerLesson
      : defaults.lettersPerLesson;

  const durationMode: JourneyDurationMode =
    candidate.durationMode === 'standard' ? 'standard' : 'short';

  const playerMode: JourneyPlayerMode =
    candidate.playerMode === 'two-player' ? 'two-player' : 'solo';

  if (resetSelectionsForEpoch) {
    return {
      settings: {
        guidedModeEnabled:
          typeof candidate.guidedModeEnabled === 'boolean'
            ? candidate.guidedModeEnabled
            : defaults.guidedModeEnabled,
        lettersPerLesson,
        durationMode,
        waitForVoiceIntro:
          typeof candidate.waitForVoiceIntro === 'boolean'
            ? candidate.waitForVoiceIntro
            : defaults.waitForVoiceIntro,
        playerMode,
        funBreakPacing: normalizeFunBreakPacing(candidate.funBreakPacing, 3),
        boostedGames: [],
        speakChildName:
          typeof candidate.speakChildName === 'boolean'
            ? candidate.speakChildName
            : defaults.speakChildName,
        pacingVersion: 3,
        selectedLetters: [...ALL_LETTERS],
        enabledGames: [...catalogIds],
        knownGames: [...catalogIds],
      },
      newlyDiscoveredGames: [],
    };
  }

  const hasExplicitKnown = Array.isArray(candidate.knownGames);
  const knownSet = normalizeKnownGames(candidate.knownGames, validSet, catalogIds);
  const newlyDiscoveredGames = hasExplicitKnown
    ? catalogIds.filter((id) => !knownSet.has(id))
    : [];

  return {
    settings: {
      guidedModeEnabled:
        typeof candidate.guidedModeEnabled === 'boolean'
          ? candidate.guidedModeEnabled
          : defaults.guidedModeEnabled,
      lettersPerLesson,
      durationMode,
      waitForVoiceIntro:
        typeof candidate.waitForVoiceIntro === 'boolean'
          ? candidate.waitForVoiceIntro
          : defaults.waitForVoiceIntro,
      playerMode,
      funBreakPacing: normalizeFunBreakPacing(candidate.funBreakPacing, candidate.pacingVersion),
      boostedGames: normalizeBoostedGames(
        candidate.boostedGames,
        candidate.pacingVersion,
        catalogIds,
        validSet,
      ),
      speakChildName:
        typeof candidate.speakChildName === 'boolean'
          ? candidate.speakChildName
          : defaults.speakChildName,
      pacingVersion: 3,
      selectedLetters: normalizeLettersList(candidate.selectedLetters, defaults.selectedLetters),
      enabledGames: normalizeEnabledGames(candidate.enabledGames, knownSet, catalogIds, validSet),
      knownGames: [...catalogIds],
    },
    newlyDiscoveredGames,
  };
}

function clampActivityIndex(raw: unknown, fallback = 0): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return fallback;
  const rounded = Math.floor(raw);
  if (rounded < 0) return 0;
  if (rounded >= TOTAL_ACTIVITIES) return TOTAL_ACTIVITIES - 1;
  return rounded;
}

function sanitizeCompletedIndices(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<number>();
  for (const item of raw) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      const idx = Math.floor(item);
      if (idx >= 0 && idx < TOTAL_ACTIVITIES) {
        unique.add(idx);
      }
    }
    if (unique.size >= TOTAL_ACTIVITIES) break;
  }
  return Array.from(unique).sort((a, b) => a - b);
}

function sanitizeCompletedSnapshots(
  raw: unknown,
  validSet: Set<string>,
): Record<string, CompletedSlotSnapshot> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const result: Record<string, CompletedSlotSnapshot> = {};
  const entries = Object.entries(raw as Record<string, unknown>);
  for (let i = 0; i < Math.min(entries.length, TOTAL_ACTIVITIES); i += 1) {
    const [key, val] = entries[i];
    if (!/^\d{1,3}$/.test(key)) continue;
    const slotIdx = Number(key);
    if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= TOTAL_ACTIVITIES) continue;
    if (typeof val !== 'object' || val === null) continue;
    const snap = val as Partial<CompletedSlotSnapshot>;
    if (typeof snap.gameId !== 'string' || !validSet.has(snap.gameId)) continue;
    const gameOrdinal =
      typeof snap.gameOrdinal === 'number' && Number.isFinite(snap.gameOrdinal)
        ? Math.max(0, Math.min(TOTAL_ACTIVITIES, Math.floor(snap.gameOrdinal)))
        : 0;
    const lettersCovered = Array.isArray(snap.lettersCovered)
      ? normalizeLettersList(snap.lettersCovered, [])
      : undefined;
    result[String(slotIdx)] = {
      gameId: snap.gameId as GameRegistryEntry['id'],
      gameOrdinal,
      ...(lettersCovered && lettersCovered.length > 0 ? { lettersCovered } : {}),
    };
  }
  return result;
}

function sanitizePendingIntroGames(
  raw: unknown,
  newlyDiscovered: readonly GameRegistryEntry['id'][],
  enabledGames: readonly GameRegistryEntry['id'][],
  hasLearnerStarted: boolean,
  validSet: Set<string>,
): GameRegistryEntry['id'][] {
  if (!hasLearnerStarted) return [];
  const enabledSet = new Set<string>(enabledGames);
  const queue: GameRegistryEntry['id'][] = [];
  const seen = new Set<string>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (
        typeof item === 'string' &&
        validSet.has(item) &&
        enabledSet.has(item) &&
        !seen.has(item)
      ) {
        seen.add(item);
        queue.push(item as GameRegistryEntry['id']);
      }
    }
  }

  for (const gameId of newlyDiscovered) {
    if (enabledSet.has(gameId) && !seen.has(gameId)) {
      seen.add(gameId);
      queue.push(gameId);
    }
  }

  return queue.slice(0, enabledGames.length);
}

/**
 * Pure, deterministic state reconciler supporting Pebble's 3-Tier Journey Update Strategy:
 * - Tier C (saved.curriculumEpoch !== CURRENT_JOURNEY_EPOCH): Complete progress reset to #1 while preserving parent preferences.
 * - Tier A (new GameId added under same epoch): Preserves completedSnapshots, auto-enrolls new game, and queues a gameOrdinal=0 Welcome Lesson at currentActivityIndex.
 * - Tier B (new pack/mode in existing game): Preserves completedSnapshots and updates future lessons seamlessly.
 */
export function reconcileJourneyProgress(
  raw: unknown,
  catalogIds: readonly GameRegistryEntry['id'][] = ALL_GAME_IDS,
): { state: JourneyProgressState; didResetForEpoch: boolean } {
  const defaults = getDefaultJourneyState(catalogIds);
  if (typeof raw !== 'object' || raw === null) {
    return { state: defaults, didResetForEpoch: false };
  }
  const validSet = new Set<string>(catalogIds);
  const candidate = raw as Partial<JourneyProgressState>;
  const savedEpoch =
    typeof candidate.curriculumEpoch === 'number' ? candidate.curriculumEpoch : 1;

  if (savedEpoch !== CURRENT_JOURNEY_EPOCH) {
    const { settings } = sanitizeSettings(candidate.settings, catalogIds, validSet, true);
    return {
      state: {
        version: 1,
        curriculumEpoch: CURRENT_JOURNEY_EPOCH,
        settings,
        currentActivityIndex: 0,
        completedActivityIndices: [],
        coveredLetters: [],
        completedSnapshots: {},
        pendingIntroGames: [],
      },
      didResetForEpoch: true,
    };
  }

  const currentActivityIndex = clampActivityIndex(candidate.currentActivityIndex, 0);
  const completedActivityIndices = sanitizeCompletedIndices(candidate.completedActivityIndices);
  const hasLearnerStarted =
    currentActivityIndex > 0 || completedActivityIndices.length > 0;

  const { settings, newlyDiscoveredGames } = sanitizeSettings(
    candidate.settings,
    catalogIds,
    validSet,
    false,
  );
  const completedSnapshots = sanitizeCompletedSnapshots(
    candidate.completedSnapshots,
    validSet,
  );
  const pendingIntroGames = sanitizePendingIntroGames(
    candidate.pendingIntroGames,
    newlyDiscoveredGames,
    settings.enabledGames,
    hasLearnerStarted,
    validSet,
  );

  return {
    state: {
      version: 1,
      curriculumEpoch: CURRENT_JOURNEY_EPOCH,
      settings,
      currentActivityIndex,
      completedActivityIndices,
      coveredLetters: normalizeLettersList(candidate.coveredLetters, []),
      completedSnapshots,
      pendingIntroGames,
    },
    didResetForEpoch: false,
  };
}

function clearStaleJourneyNavSession(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const navRaw = window.sessionStorage.getItem(NAV_SESSION_KEY);
    if (!navRaw) return;
    const parsed = JSON.parse(navRaw) as { screen?: { view?: unknown } } | null;
    if (parsed?.screen?.view === 'journey-play') {
      window.sessionStorage.setItem(
        NAV_SESSION_KEY,
        JSON.stringify({ ...parsed, screen: { view: 'hub' } }),
      );
    }
  } catch {
    // Ignore restricted sessionStorage environments
  }
}

export function loadJourneyState(): JourneyProgressState {
  const defaults = getDefaultJourneyState();
  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    const { state, didResetForEpoch } = reconcileJourneyProgress(parsed);
    if (didResetForEpoch) {
      clearStaleJourneyNavSession();
      saveJourneyState(state);
    }
    return state;
  } catch {
    return defaults;
  }
}

export function saveJourneyState(state: JourneyProgressState): void {
  try {
    const { state: sanitized } = reconcileJourneyProgress(state);
    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore localStorage quota or private mode restrictions
  }
}

export function markJourneyActivityCompleted(
  state: JourneyProgressState,
  activity: JourneyActivity,
): JourneyProgressState {
  const completedSet = new Set<number>(state.completedActivityIndices);
  completedSet.add(activity.index);

  const coveredSet = new Set<LetterId>(state.coveredLetters);
  if (activity.lettersCovered) {
    for (const letter of activity.lettersCovered) {
      if (isValidLetterId(letter)) {
        coveredSet.add(letter);
      }
    }
  }

  const nextSnapshots: Record<string, CompletedSlotSnapshot> = {
    ...state.completedSnapshots,
    [String(activity.index)]: {
      gameId: activity.gameId,
      gameOrdinal: activity.gameOrdinal,
      ...(activity.lettersCovered && activity.lettersCovered.length > 0
        ? { lettersCovered: [...activity.lettersCovered] }
        : {}),
    },
  };

  const nextPendingIntroGames = state.pendingIntroGames.filter(
    (id) => id !== activity.gameId,
  );

  let nextIndex = state.currentActivityIndex;
  if (activity.index === state.currentActivityIndex) {
    nextIndex = Math.min(TOTAL_ACTIVITIES - 1, activity.index + 1);
  }

  return {
    version: 1,
    curriculumEpoch: CURRENT_JOURNEY_EPOCH,
    settings: state.settings,
    currentActivityIndex: nextIndex,
    completedActivityIndices: Array.from(completedSet).sort((a, b) => a - b),
    coveredLetters: ALL_LETTERS.filter((letter) => coveredSet.has(letter)),
    completedSnapshots: nextSnapshots,
    pendingIntroGames: nextPendingIntroGames,
  };
}

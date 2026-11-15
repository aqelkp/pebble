import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS, isValidLetterId } from '../games/letter-train/letterData';
import { GAME_REGISTRY, type GameRegistryEntry } from '../games/registry';
import {
  TOTAL_ACTIVITIES,
  type FunBreakPacingMode,
  type JourneyActivity,
  type JourneyDurationMode,
  type JourneyPlayerMode,
  type JourneyProgressState,
  type JourneySettings,
  type LettersPerLesson,
} from './journeyTypes';

// TODO(security): Pebble runs 100% locally in the browser with no backend server, authentication,
// or database. All journey settings, completed activity indices, and letter coverage read from
// localStorage are treated as untrusted input and validated against strict allow-lists and
// integer bounds before use. Add authenticated server persistence if cloud sync is ever introduced.

const JOURNEY_STORAGE_KEY = 'pebble.journey.v1';

const ALL_GAME_IDS: GameRegistryEntry['id'][] = GAME_REGISTRY.map((g) => g.id);
const VALID_GAME_ID_SET = new Set<string>(ALL_GAME_IDS);
const LEGACY_PRE_FUN_GAMES: GameRegistryEntry['id'][] = [
  'memory-match',
  'letter-train',
  'letter-river',
  'picture-sudoku',
  'number-safari',
  'word-fun',
];

export function getDefaultJourneySettings(): JourneySettings {
  return {
    guidedModeEnabled: true,
    lettersPerLesson: 4,
    durationMode: 'short',
    waitForVoiceIntro: true,
    playerMode: 'solo',
    funBreakPacing: 'after-2',
    boostedGames: ['rescue-road'],
    speakChildName: true,
    pacingVersion: 2,
    selectedLetters: [...ALL_LETTERS],
    enabledGames: [...ALL_GAME_IDS],
    knownGames: [...ALL_GAME_IDS],
  };
}

export function getDefaultJourneyState(): JourneyProgressState {
  return {
    version: 1,
    settings: getDefaultJourneySettings(),
    currentActivityIndex: 0,
    completedActivityIndices: [],
    coveredLetters: [],
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

function normalizeKnownGames(raw: unknown): Set<GameRegistryEntry['id']> {
  if (!Array.isArray(raw)) {
    return new Set<GameRegistryEntry['id']>(LEGACY_PRE_FUN_GAMES);
  }
  const set = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_GAME_ID_SET.has(item)) {
      set.add(item as GameRegistryEntry['id']);
    }
  }
  return set;
}

function normalizeEnabledGames(
  raw: unknown,
  knownSet: Set<GameRegistryEntry['id']>,
): GameRegistryEntry['id'][] {
  if (!Array.isArray(raw)) return [...ALL_GAME_IDS];
  const unique = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_GAME_ID_SET.has(item)) {
      unique.add(item as GameRegistryEntry['id']);
    }
  }
  // Auto-enroll newly introduced games for existing saved localStorage profiles
  for (const gameId of ALL_GAME_IDS) {
    if (!knownSet.has(gameId)) {
      unique.add(gameId);
    }
  }
  if (unique.size === 0) return [...ALL_GAME_IDS];
  return ALL_GAME_IDS.filter((id) => unique.has(id));
}

function normalizeFunBreakPacing(raw: unknown, pacingVersion: unknown): FunBreakPacingMode {
  if (pacingVersion !== 2 && (raw === 'balanced' || raw === undefined)) {
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

function normalizeBoostedGames(raw: unknown): GameRegistryEntry['id'][] {
  if (!Array.isArray(raw)) return ['rescue-road'];
  const unique = new Set<GameRegistryEntry['id']>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_GAME_ID_SET.has(item)) {
      unique.add(item as GameRegistryEntry['id']);
    }
  }
  return ALL_GAME_IDS.filter((id) => unique.has(id));
}

function sanitizeSettings(raw: unknown): JourneySettings {
  const defaults = getDefaultJourneySettings();
  if (typeof raw !== 'object' || raw === null) return defaults;
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

  const knownSet = normalizeKnownGames(candidate.knownGames);

  return {
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
    boostedGames: normalizeBoostedGames(candidate.boostedGames),
    speakChildName:
      typeof candidate.speakChildName === 'boolean'
        ? candidate.speakChildName
        : defaults.speakChildName,
    pacingVersion: 2,
    selectedLetters: normalizeLettersList(candidate.selectedLetters, defaults.selectedLetters),
    enabledGames: normalizeEnabledGames(candidate.enabledGames, knownSet),
    knownGames: [...ALL_GAME_IDS],
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

export function loadJourneyState(): JourneyProgressState {
  const defaults = getDefaultJourneyState();
  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults;
    const candidate = parsed as Partial<JourneyProgressState>;

    return {
      version: 1,
      settings: sanitizeSettings(candidate.settings),
      currentActivityIndex: clampActivityIndex(candidate.currentActivityIndex, 0),
      completedActivityIndices: sanitizeCompletedIndices(candidate.completedActivityIndices),
      coveredLetters: normalizeLettersList(candidate.coveredLetters, []),
    };
  } catch {
    return defaults;
  }
}

export function saveJourneyState(state: JourneyProgressState): void {
  try {
    const sanitized: JourneyProgressState = {
      version: 1,
      settings: sanitizeSettings(state.settings),
      currentActivityIndex: clampActivityIndex(state.currentActivityIndex, 0),
      completedActivityIndices: sanitizeCompletedIndices(state.completedActivityIndices),
      coveredLetters: normalizeLettersList(state.coveredLetters, []),
    };
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

  let nextIndex = state.currentActivityIndex;
  if (activity.index === state.currentActivityIndex) {
    nextIndex = Math.min(TOTAL_ACTIVITIES - 1, activity.index + 1);
  }

  return {
    version: 1,
    settings: state.settings,
    currentActivityIndex: nextIndex,
    completedActivityIndices: Array.from(completedSet).sort((a, b) => a - b),
    coveredLetters: ALL_LETTERS.filter((letter) => coveredSet.has(letter)),
  };
}

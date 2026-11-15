import type { FamilyProfile } from '../context/FamilyProfilesContext';
import type { LetterRiverConfig } from './letter-river/LetterRiverSetup';
import {
  getDefaultLetterTraceConfig,
  isValidLetterTraceConfig,
  type LetterTraceConfig,
} from './letter-trace/traceData';
import type { LetterTrainConfig } from './letter-train/LetterTrainSetup';
import { ALL_LETTERS, isValidLetterId } from './letter-train/letterData';
import type { MemoryGameConfig } from './memory-match/MemorySetup';
import {
  BOARD_SIZES,
  CARD_THEMES,
  DEFAULT_BOARD_SIZE_ID,
  DEFAULT_THEME_ID,
} from './memory-match/themes';
import type { SafariGameConfig } from './number-safari/SafariSetup';
import {
  DEFAULT_SAFARI_LENGTH_ID,
  DEFAULT_SAFARI_MODE_ID,
  isValidSafariLengthId,
  isValidSafariModeId,
} from './number-safari/safariData';
import type { PictureSudokuConfig } from './picture-sudoku/PictureSudokuSetup';
import { DEFAULT_SUDOKU_SIZE } from './picture-sudoku/sudokuEngine';
import type { GameId } from './registry';
import {
  getDefaultRescueRoadConfig,
  isValidRescueRoadConfig,
  type RescueRoadConfig,
} from './rescue-road/roadEngine';
import {
  getDefaultStickerJigsawConfig,
  isValidStickerJigsawConfig,
  type StickerJigsawConfig,
} from './sticker-jigsaw/jigsawEngine';
import {
  getDefaultSpotTheTwinConfig,
  isValidSpotTheTwinConfig,
  type SpotTheTwinConfig,
} from './spot-the-twin/twinEngine';
import {
  getDefaultStickerSceneConfig,
  isValidStickerSceneConfig,
  type StickerSceneConfig,
} from './sticker-scene/sceneEngine';
import type { WordGameConfig } from './word-fun/WordFunSetup';
import {
  DEFAULT_WORD_HELPER_MODE,
  DEFAULT_WORD_PACK_ID,
  DEFAULT_WORD_ROUND_SIZE_ID,
  isValidWordHelperMode,
  isValidWordPackId,
  isValidWordRoundSizeId,
} from './word-fun/wordBank';

// TODO(security): Pebble runs 100% locally in the browser as a static client-only PWA with no
// backend server, authentication, or database. All saved game configuration objects restored from
// sessionStorage are treated as untrusted input and validated against strict allow-lists, enum
// checks, and bounded array lengths before use. Add server-side validation if cloud sync is added.

export interface GameConfigMap {
  'memory-match': MemoryGameConfig;
  'letter-train': LetterTrainConfig;
  'letter-trace': LetterTraceConfig;
  'letter-river': LetterRiverConfig;
  'picture-sudoku': PictureSudokuConfig;
  'word-fun': WordGameConfig;
  'number-safari': SafariGameConfig;
  'rescue-road': RescueRoadConfig;
  'sticker-jigsaw': StickerJigsawConfig;
  'sticker-scene': StickerSceneConfig;
  'spot-the-twin': SpotTheTwinConfig;
}

export type SavedGameConfigs = Partial<{ [K in GameId]: GameConfigMap[K] }>;

function isBoundedPlayerIds(value: unknown, maxPlayers: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= maxPlayers &&
    value.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 40)
  );
}

function getDefaultFamilyPlayerIds(profiles: readonly FamilyProfile[]): string[] {
  const ids = profiles.slice(0, 2).map((p) => p.id);
  return ids.length > 0 ? ids : ['child'];
}

export function isValidMemoryConfig(value: unknown): value is MemoryGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<MemoryGameConfig>;
  const validTheme =
    typeof c.themeId === 'string' && CARD_THEMES.some((theme) => theme.id === c.themeId);
  const validBoardSize =
    typeof c.boardSizeId === 'string' && BOARD_SIZES.some((size) => size.id === c.boardSizeId);
  return validTheme && validBoardSize && isBoundedPlayerIds(c.playerIds, 4);
}

function isValidLetterCollectionConfig(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<LetterTrainConfig>;
  if (
    !Array.isArray(c.selectedLetters) ||
    c.selectedLetters.length === 0 ||
    c.selectedLetters.length > 26 ||
    !c.selectedLetters.every((item) => isValidLetterId(item))
  ) {
    return false;
  }
  if (c.orderMode !== 'alphabetical' && c.orderMode !== 'shuffle') {
    return false;
  }
  return true;
}

function hasValidWordLabelMode(
  value: unknown,
  allowedModes: readonly string[],
): boolean {
  if (!isValidLetterCollectionConfig(value)) return false;
  const mode = (value as { wordLabelMode?: unknown }).wordLabelMode;
  return typeof mode === 'string' && allowedModes.includes(mode);
}

export function isValidLetterTrainConfig(value: unknown): value is LetterTrainConfig {
  return hasValidWordLabelMode(value, ['on-mistake', 'show-all']);
}

export function isValidLetterRiverConfig(value: unknown): value is LetterRiverConfig {
  return hasValidWordLabelMode(value, ['after-drop', 'always']);
}

export function isValidPictureSudokuConfig(value: unknown): value is PictureSudokuConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<PictureSudokuConfig>;
  const validSize = c.size === 3 || c.size === 4 || c.size === 5;
  const validTheme =
    typeof c.themeId === 'string' && CARD_THEMES.some((theme) => theme.id === c.themeId);
  return validSize && validTheme;
}

export function isValidWordGameConfig(value: unknown): value is WordGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WordGameConfig>;
  return (
    isValidWordPackId(c.packId) &&
    isValidWordRoundSizeId(c.roundSizeId) &&
    isValidWordHelperMode(c.helperMode) &&
    isBoundedPlayerIds(c.playerIds, 4)
  );
}

export function isValidSafariConfig(value: unknown): value is SafariGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<SafariGameConfig>;
  return (
    isValidSafariModeId(c.modeId) &&
    isValidSafariLengthId(c.lengthId) &&
    isBoundedPlayerIds(c.playerIds, 6)
  );
}

type ConfigValidatorMap = {
  [K in GameId]: (value: unknown) => value is GameConfigMap[K];
};

const CONFIG_VALIDATORS: ConfigValidatorMap = {
  'memory-match': isValidMemoryConfig,
  'letter-train': isValidLetterTrainConfig,
  'letter-trace': isValidLetterTraceConfig,
  'letter-river': isValidLetterRiverConfig,
  'picture-sudoku': isValidPictureSudokuConfig,
  'word-fun': isValidWordGameConfig,
  'number-safari': isValidSafariConfig,
  'rescue-road': isValidRescueRoadConfig,
  'sticker-jigsaw': isValidStickerJigsawConfig,
  'sticker-scene': isValidStickerSceneConfig,
  'spot-the-twin': isValidSpotTheTwinConfig,
};

export function isValidGameConfig<K extends GameId>(
  gameId: K,
  value: unknown,
): value is GameConfigMap[K] {
  return CONFIG_VALIDATORS[gameId](value);
}

export function getDefaultGameConfig<K extends GameId>(
  gameId: K,
  profiles: readonly FamilyProfile[],
): GameConfigMap[K] {
  switch (gameId) {
    case 'memory-match':
      return {
        themeId: DEFAULT_THEME_ID,
        boardSizeId: DEFAULT_BOARD_SIZE_ID,
        playerIds: getDefaultFamilyPlayerIds(profiles),
      } as GameConfigMap[K];
    case 'letter-train':
      return {
        selectedLetters: [...ALL_LETTERS],
        orderMode: 'alphabetical',
        wordLabelMode: 'on-mistake',
      } as GameConfigMap[K];
    case 'letter-trace':
      return getDefaultLetterTraceConfig() as GameConfigMap[K];
    case 'letter-river':
      return {
        selectedLetters: [...ALL_LETTERS],
        orderMode: 'alphabetical',
        wordLabelMode: 'after-drop',
      } as GameConfigMap[K];
    case 'picture-sudoku':
      return {
        themeId: DEFAULT_THEME_ID,
        size: DEFAULT_SUDOKU_SIZE,
      } as GameConfigMap[K];
    case 'word-fun':
      return {
        packId: DEFAULT_WORD_PACK_ID,
        roundSizeId: DEFAULT_WORD_ROUND_SIZE_ID,
        helperMode: DEFAULT_WORD_HELPER_MODE,
        playerIds: getDefaultFamilyPlayerIds(profiles),
      } as GameConfigMap[K];
    case 'number-safari':
      return {
        modeId: DEFAULT_SAFARI_MODE_ID,
        lengthId: DEFAULT_SAFARI_LENGTH_ID,
        playerIds: getDefaultFamilyPlayerIds(profiles),
      } as GameConfigMap[K];
    case 'rescue-road':
      return getDefaultRescueRoadConfig() as GameConfigMap[K];
    case 'sticker-jigsaw':
      return getDefaultStickerJigsawConfig() as GameConfigMap[K];
    case 'sticker-scene':
      return getDefaultStickerSceneConfig() as GameConfigMap[K];
    case 'spot-the-twin':
      return getDefaultSpotTheTwinConfig() as GameConfigMap[K];
  }
}

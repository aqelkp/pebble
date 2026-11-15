import type { LetterId } from '../data/wordBank';
import type { LetterRiverConfig } from '../games/letter-river/LetterRiverSetup';
import type { LetterTraceConfig } from '../games/letter-trace/traceData';
import type { LetterTrainConfig } from '../games/letter-train/LetterTrainSetup';
import type { MemoryGameConfig } from '../games/memory-match/MemorySetup';
import type { ThemeId } from '../games/memory-match/themes';
import type { SafariGameConfig } from '../games/number-safari/SafariSetup';
import type { PictureSudokuConfig } from '../games/picture-sudoku/PictureSudokuSetup';
import type { GameRegistryEntry } from '../games/registry';
import type { RescueRoadConfig } from '../games/rescue-road/roadEngine';
import type { StickerJigsawConfig } from '../games/sticker-jigsaw/jigsawEngine';
import type { DotToDotConfig } from '../games/dot-to-dot/dotEngine';
import type { SpotTheTwinConfig } from '../games/spot-the-twin/twinEngine';
import type { StickerSceneConfig } from '../games/sticker-scene/sceneEngine';
import type { WordGameConfig } from '../games/word-fun/WordFunSetup';
import type { WordPeekabooConfig } from '../games/word-peekaboo/peekabooData';
import type { QuestGameConfig } from '../curriculum/questEngine/questTypes';

export const TOTAL_CHAPTERS = 20;
export const ACTIVITIES_PER_CHAPTER = 20;
export const TOTAL_ACTIVITIES = TOTAL_CHAPTERS * ACTIVITIES_PER_CHAPTER;

export type JourneyDurationMode = 'short' | 'standard';
export type LettersPerLesson = 3 | 4 | 5;
export type JourneyPlayerMode = 'solo' | 'two-player';
export type FunBreakPacingMode = 'after-2' | 'after-3' | 'after-1' | 'balanced' | 'off';

export type JourneyVoiceClipId =
  | 'memory-match'
  | 'letter-train'
  | 'letter-trace'
  | 'letter-river'
  | 'picture-sudoku'
  | 'word-fun'
  | 'number-safari-count'
  | 'number-safari-add'
  | 'rescue-road'
  | 'sticker-jigsaw'
  | 'sticker-scene'
  | 'spot-the-twin'
  | 'dot-to-dot'
  | 'word-peekaboo'
  | 'mystery-express'
  | 'pebble-creek'
  | 'cloud-balloon'
  | 'treasure-keys';

export interface JourneyBoardContext {
  chapterNumber: number;
  activityNumberInChapter: number;
  totalInChapter: number;
  globalActivityNumber: number;
  onActivityComplete: () => void;
}

export interface JourneySettings {
  guidedModeEnabled: boolean;
  lettersPerLesson: LettersPerLesson;
  durationMode: JourneyDurationMode;
  waitForVoiceIntro: boolean;
  playerMode: JourneyPlayerMode;
  funBreakPacing: FunBreakPacingMode;
  boostedGames: GameRegistryEntry['id'][];
  speakChildName: boolean;
  pacingVersion?: number;
  selectedLetters: LetterId[];
  enabledGames: GameRegistryEntry['id'][];
  knownGames?: GameRegistryEntry['id'][];
}

export interface JourneyProgressState {
  version: 1;
  settings: JourneySettings;
  currentActivityIndex: number;
  completedActivityIndices: number[];
  coveredLetters: LetterId[];
}

export type JourneyActivityPayload =
  | { gameId: 'memory-match'; config: MemoryGameConfig }
  | { gameId: 'letter-train'; config: LetterTrainConfig }
  | { gameId: 'letter-trace'; config: LetterTraceConfig }
  | { gameId: 'letter-river'; config: LetterRiverConfig }
  | { gameId: 'picture-sudoku'; config: PictureSudokuConfig }
  | { gameId: 'word-fun'; config: WordGameConfig }
  | { gameId: 'number-safari'; config: SafariGameConfig }
  | { gameId: 'rescue-road'; config: RescueRoadConfig }
  | { gameId: 'sticker-jigsaw'; config: StickerJigsawConfig }
  | { gameId: 'sticker-scene'; config: StickerSceneConfig }
  | { gameId: 'spot-the-twin'; config: SpotTheTwinConfig }
  | { gameId: 'dot-to-dot'; config: DotToDotConfig }
  | { gameId: 'word-peekaboo'; config: WordPeekabooConfig }
  | { gameId: 'mystery-express'; config: QuestGameConfig }
  | { gameId: 'pebble-creek'; config: QuestGameConfig }
  | { gameId: 'cloud-balloon'; config: QuestGameConfig }
  | { gameId: 'treasure-keys'; config: QuestGameConfig };

export interface JourneyActivity {
  index: number;
  activityNumber: number;
  chapterNumber: number;
  numberInChapter: number;
  gameId: GameRegistryEntry['id'];
  isFunBreak?: boolean;
  title: string;
  subtitle: string;
  detailLine: string;
  artPath: string;
  voiceClipId: JourneyVoiceClipId;
  lettersCovered?: LetterId[];
  previewThemeId?: ThemeId;
  payload: JourneyActivityPayload;
}

export interface ChapterSpec {
  chapterNumber: number;
  title: string;
  subtitle: string;
}

export interface JourneyAdapterContext {
  slotIndex: number;
  chapterNumber: number;
  numberInChapter: number;
  gameOrdinal: number;
  settings: JourneySettings;
  playerIds: string[];
  nextLetterSlice: (overrideLetters?: LetterId[]) => LetterId[];
  nextRngInt: (maxExclusive: number) => number;
}

export interface JourneyGeneratedFields {
  title: string;
  subtitle: string;
  detailLine: string;
  artPath: string;
  voiceClipId: JourneyVoiceClipId;
  lettersCovered?: LetterId[];
  previewThemeId?: ThemeId;
  payload: JourneyActivityPayload;
}

export interface JourneyActivityAdapter {
  gameId: GameRegistryEntry['id'];
  title: string;
  artPath: string;
  category: 'phonics' | 'math' | 'logic' | 'memory' | 'words' | 'fun';
  buildActivity: (ctx: JourneyAdapterContext) => JourneyGeneratedFields;
}

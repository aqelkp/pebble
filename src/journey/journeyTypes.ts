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
import type { CircleSortConfig } from '../games/circle-sort/circleSortData';
import type { DotToDotConfig } from '../games/dot-to-dot/dotEngine';
import type { SpotTheTwinConfig } from '../games/spot-the-twin/twinEngine';
import type { StickerSceneConfig } from '../games/sticker-scene/sceneEngine';
import type { WordGameConfig } from '../games/word-fun/WordFunSetup';
import type { WordPeekabooConfig } from '../games/word-peekaboo/peekabooData';
import type { CompareQuestConfig } from '../games/compare-quest/compareData';
import type { WordTraceConfig } from '../games/word-trace/wordTraceEngine';
import type { QuestGameConfig } from '../curriculum/questEngine/questTypes';
import type { PipeCountdownConfig } from '../games/pipe-countdown/countdownData';
import type { RocketSumsConfig } from '../games/rocket-sums/rocketData';

export const TOTAL_CHAPTERS = 20;
export const ACTIVITIES_PER_CHAPTER = 20;
export const TOTAL_ACTIVITIES = TOTAL_CHAPTERS * ACTIVITIES_PER_CHAPTER;

/**
 * Increment ONLY when performing an intentional, full-cohort curriculum reset
 * (Tier C: e.g. major syllabus/grade overhaul). Normal new-game additions (Tier A)
 * and new pack/mode additions (Tier B) MUST NOT bump CURRENT_JOURNEY_EPOCH — they
 * preserve completedSnapshots and induct new games via pendingIntroGames instead.
 */
export const CURRENT_JOURNEY_EPOCH = 2;

export type JourneyDurationMode = 'short' | 'standard';
export type LettersPerLesson = 3 | 4 | 5;
export type JourneyPlayerMode = 'solo' | 'two-player';
export type FunBreakPacingMode = 'after-2' | 'after-3' | 'after-1' | 'balanced' | 'off';

export type JourneyLearningPillar =
  | 'phonics-reading'
  | 'spelling-writing'
  | 'numbers-math'
  | 'logic-world'
  | 'fun-break';

export type JourneyVoiceClipId =
  | 'memory-match'
  | 'letter-train'
  | 'letter-trace'
  | 'letter-trace-numbers'
  | 'letter-trace-shapes'
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
  | 'dot-to-dot-countdown'
  | 'word-peekaboo'
  | 'compare-quest'
  | 'word-trace'
  | 'word-trace-numbers'
  | 'mystery-express'
  | 'pebble-creek'
  | 'cloud-balloon'
  | 'treasure-keys'
  | 'circle-sort'
  | 'pipe-countdown'
  | 'rocket-sums';

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

/**
 * Compact, allow-list-validated snapshot of a completed slot so adding new games
 * in future releases never rewrites or scrambles chapters the child already finished.
 */
export interface CompletedSlotSnapshot {
  gameId: GameRegistryEntry['id'];
  gameOrdinal: number;
  lettersCovered?: LetterId[];
}

export interface JourneyProgressState {
  version: 1;
  curriculumEpoch: number;
  settings: JourneySettings;
  currentActivityIndex: number;
  completedActivityIndices: number[];
  coveredLetters: LetterId[];
  completedSnapshots: Record<string, CompletedSlotSnapshot>;
  pendingIntroGames: GameRegistryEntry['id'][];
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
  | { gameId: 'compare-quest'; config: CompareQuestConfig }
  | { gameId: 'word-trace'; config: WordTraceConfig }
  | { gameId: 'mystery-express'; config: QuestGameConfig }
  | { gameId: 'pebble-creek'; config: QuestGameConfig }
  | { gameId: 'cloud-balloon'; config: QuestGameConfig }
  | { gameId: 'treasure-keys'; config: QuestGameConfig }
  | { gameId: 'circle-sort'; config: CircleSortConfig }
  | { gameId: 'pipe-countdown'; config: PipeCountdownConfig }
  | { gameId: 'rocket-sums'; config: RocketSumsConfig };

export interface JourneyActivity {
  index: number;
  activityNumber: number;
  chapterNumber: number;
  numberInChapter: number;
  gameId: GameRegistryEntry['id'];
  gameOrdinal: number;
  isFunBreak?: boolean;
  isNewGameIntro?: boolean;
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
  nextLetterSlice: (overrideLetters?: LetterId[], maxLetters?: number) => LetterId[];
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
  pillar: JourneyLearningPillar;
  category: 'phonics' | 'math' | 'logic' | 'memory' | 'words' | 'fun';
  buildActivity: (ctx: JourneyAdapterContext) => JourneyGeneratedFields;
}

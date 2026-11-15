import type { LetterId } from '../data/wordBank';
import type { LetterRiverConfig } from '../games/letter-river/LetterRiverSetup';
import type { LetterTrainConfig } from '../games/letter-train/LetterTrainSetup';
import type { MemoryGameConfig } from '../games/memory-match/MemorySetup';
import type { ThemeId } from '../games/memory-match/themes';
import type { SafariGameConfig } from '../games/number-safari/SafariSetup';
import type { PictureSudokuConfig } from '../games/picture-sudoku/PictureSudokuSetup';
import type { GameRegistryEntry } from '../games/registry';
import type { RescueRoadConfig } from '../games/rescue-road/roadEngine';
import type { StickerJigsawConfig } from '../games/sticker-jigsaw/jigsawEngine';
import type { WordGameConfig } from '../games/word-fun/WordFunSetup';

export const TOTAL_CHAPTERS = 20;
export const ACTIVITIES_PER_CHAPTER = 20;
export const TOTAL_ACTIVITIES = TOTAL_CHAPTERS * ACTIVITIES_PER_CHAPTER;

export type JourneyDurationMode = 'short' | 'standard';
export type LettersPerLesson = 3 | 4 | 5;
export type JourneyPlayerMode = 'solo' | 'two-player';
export type FunBreakPacingMode = 'balanced' | 'every-2' | 'every-3' | 'off';

export type JourneyVoiceClipId =
  | 'memory-match'
  | 'letter-train'
  | 'letter-river'
  | 'picture-sudoku'
  | 'word-fun'
  | 'number-safari-count'
  | 'number-safari-add'
  | 'rescue-road'
  | 'sticker-jigsaw';

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
  | { gameId: 'letter-river'; config: LetterRiverConfig }
  | { gameId: 'picture-sudoku'; config: PictureSudokuConfig }
  | { gameId: 'word-fun'; config: WordGameConfig }
  | { gameId: 'number-safari'; config: SafariGameConfig }
  | { gameId: 'rescue-road'; config: RescueRoadConfig }
  | { gameId: 'sticker-jigsaw'; config: StickerJigsawConfig };

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

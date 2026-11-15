import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS } from '../games/letter-train/letterData';
import { CARD_THEMES, type BoardSizeId } from '../games/memory-match/themes';
import { getSafariModeSpec, type SafariLengthId, type SafariModeId } from '../games/number-safari/safariData';
import type { SudokuSize } from '../games/picture-sudoku/sudokuEngine';
import type { GameRegistryEntry } from '../games/registry';
import { RESCUE_VEHICLES } from '../games/rescue-road/roadEngine';
import { getWordPackSpec, type WordPackId, type WordRoundSizeId } from '../games/word-fun/wordBank';
import type { JourneyActivityAdapter } from './journeyTypes';

const WORD_PACK_ROTATION: readonly WordPackId[] = ['animals', 'home', 'play', 'nature', 'all'];
const TRICKY_REVIEW_LETTERS: readonly LetterId[] = ['B', 'D', 'P', 'Q'];

function formatLettersLabel(letters: readonly LetterId[]): string {
  if (letters.length === 0) return 'Letters';
  if (letters.length === 1) return `Letter ${letters[0]}`;

  const indices = letters.map((l) => ALL_LETTERS.indexOf(l));
  let isContiguous = true;
  for (let i = 1; i < indices.length; i += 1) {
    if (indices[i] !== indices[i - 1] + 1) {
      isContiguous = false;
      break;
    }
  }
  if (isContiguous && letters.length >= 3) {
    return `Letters ${letters[0]}–${letters[letters.length - 1]}`;
  }
  return `Letters ${letters.join(', ')}`;
}

function getTrickyLettersForReview(selectedLetters: readonly LetterId[]): LetterId[] | undefined {
  const overlap = TRICKY_REVIEW_LETTERS.filter((l) => selectedLetters.includes(l));
  return overlap.length >= 3 ? overlap : undefined;
}

export const JOURNEY_LESSON_ADAPTERS: Record<
  GameRegistryEntry['id'],
  JourneyActivityAdapter
> = {
  'memory-match': {
    gameId: 'memory-match',
    title: 'Memory Match',
    artPath: 'hub/memory-match.png',
    category: 'memory',
    buildActivity: (ctx) => {
      const pawIndex = CARD_THEMES.findIndex((t) => t.id === 'paw-patrol');
      const startOffset = pawIndex >= 0 ? pawIndex : 0;
      const theme =
        ctx.slotIndex === 0 && pawIndex >= 0
          ? CARD_THEMES[pawIndex]
          : CARD_THEMES[(startOffset + ctx.gameOrdinal) % CARD_THEMES.length];

      const boardSizeId: BoardSizeId = ctx.settings.durationMode === 'short' ? '4x3' : '4x4';
      const sizeText = boardSizeId === '4x3' ? '4×3 (6 pairs)' : '4×4 (8 pairs)';

      return {
        title: 'Memory Match',
        subtitle: `${theme.title} • ${boardSizeId === '4x3' ? '4×3' : '4×4'}`,
        detailLine: `${theme.title} cards • ${sizeText}`,
        artPath: 'hub/memory-match.png',
        voiceClipId: 'memory-match',
        previewThemeId: theme.id,
        payload: {
          gameId: 'memory-match',
          config: {
            themeId: theme.id,
            boardSizeId,
            playerIds: ctx.playerIds,
          },
        },
      };
    },
  },

  'letter-train': {
    gameId: 'letter-train',
    title: 'Letter Train',
    artPath: 'hub/letter-train.png',
    category: 'phonics',
    buildActivity: (ctx) => {
      const isTrickyReview = ctx.gameOrdinal > 0 && ctx.gameOrdinal % 6 === 5;
      const trickySlice = isTrickyReview
        ? getTrickyLettersForReview(ctx.settings.selectedLetters)
        : undefined;
      const letters = ctx.nextLetterSlice(trickySlice);
      const label = formatLettersLabel(letters);
      const orderMode =
        ctx.chapterNumber <= 4 || ctx.gameOrdinal % 2 === 0 ? 'alphabetical' : 'shuffle';
      const wordLabelMode = ctx.chapterNumber <= 3 ? 'always' : 'after-drop';

      return {
        title: 'Letter Train',
        subtitle: label,
        detailLine: isTrickyReview
          ? `Tricky sounds review: ${letters.join(', ')}`
          : `Load 3 matching pictures per letter (${letters.length} letters)`,
        artPath: 'hub/letter-train.png',
        voiceClipId: 'letter-train',
        lettersCovered: letters,
        payload: {
          gameId: 'letter-train',
          config: {
            selectedLetters: letters,
            orderMode,
            wordLabelMode,
          },
        },
      };
    },
  },

  'letter-river': {
    gameId: 'letter-river',
    title: 'Letter River',
    artPath: 'hub/letter-river.png',
    category: 'phonics',
    buildActivity: (ctx) => {
      const isTrickyReview = ctx.gameOrdinal > 0 && ctx.gameOrdinal % 6 === 4;
      const trickySlice = isTrickyReview
        ? getTrickyLettersForReview(ctx.settings.selectedLetters)
        : undefined;
      const letters = ctx.nextLetterSlice(trickySlice);
      const label = formatLettersLabel(letters);
      const orderMode =
        ctx.chapterNumber <= 4 || ctx.gameOrdinal % 2 === 0 ? 'alphabetical' : 'shuffle';
      const wordLabelMode = ctx.chapterNumber <= 3 ? 'always' : 'after-drop';

      return {
        title: 'Letter River',
        subtitle: label,
        detailLine: isTrickyReview
          ? `Tricky pairs dock: ${letters.join(', ')}`
          : `Catch swimming picture fish for ${letters.join(', ')}`,
        artPath: 'hub/letter-river.png',
        voiceClipId: 'letter-river',
        lettersCovered: letters,
        payload: {
          gameId: 'letter-river',
          config: {
            selectedLetters: letters,
            orderMode,
            wordLabelMode,
          },
        },
      };
    },
  },

  'picture-sudoku': {
    gameId: 'picture-sudoku',
    title: 'Picture Sudoku',
    artPath: 'hub/picture-sudoku.png',
    category: 'logic',
    buildActivity: (ctx) => {
      const toyIdx = CARD_THEMES.findIndex((t) => t.id === 'toy-story');
      const offset = toyIdx >= 0 ? toyIdx : 3;
      const theme = CARD_THEMES[(offset + ctx.gameOrdinal) % CARD_THEMES.length];
      const size: SudokuSize = ctx.settings.durationMode === 'short' ? 3 : 4;

      return {
        title: 'Picture Sudoku',
        subtitle: `${theme.title} • ${size}×${size}`,
        detailLine: `${size}×${size} logic puzzle with ${theme.title} pictures`,
        artPath: 'hub/picture-sudoku.png',
        voiceClipId: 'picture-sudoku',
        previewThemeId: theme.id,
        payload: {
          gameId: 'picture-sudoku',
          config: {
            themeId: theme.id,
            size,
          },
        },
      };
    },
  },

  'word-fun': {
    gameId: 'word-fun',
    title: 'Word Fun',
    artPath: 'hub/word-fun.png',
    category: 'words',
    buildActivity: (ctx) => {
      const packId = WORD_PACK_ROTATION[ctx.gameOrdinal % WORD_PACK_ROTATION.length];
      const pack = getWordPackSpec(packId);
      const roundSizeId: WordRoundSizeId = ctx.settings.durationMode === 'short' ? '4' : '6';
      const helperMode = 'sound-out';

      return {
        title: 'Word Fun',
        subtitle: `${pack.title} • ${roundSizeId} words`,
        detailLine: `Spell ${roundSizeId} 3-letter words (${pack.title})`,
        artPath: 'hub/word-fun.png',
        voiceClipId: 'word-fun',
        payload: {
          gameId: 'word-fun',
          config: {
            packId,
            roundSizeId,
            helperMode,
            playerIds: ctx.playerIds,
          },
        },
      };
    },
  },

  'number-safari': {
    gameId: 'number-safari',
    title: 'Number Safari',
    artPath: 'hub/number-safari.png',
    category: 'math',
    buildActivity: (ctx) => {
      let modeId: SafariModeId = 'count-5';
      if (ctx.chapterNumber <= 2) {
        modeId = ctx.gameOrdinal % 3 === 2 ? 'count-10' : 'count-5';
      } else if (ctx.chapterNumber <= 5) {
        modeId = ctx.gameOrdinal % 3 === 0 ? 'count-5' : ctx.gameOrdinal % 3 === 1 ? 'count-10' : 'add-10';
      } else {
        modeId = ctx.gameOrdinal % 2 === 0 ? 'count-10' : 'add-10';
      }

      const modeSpec = getSafariModeSpec(modeId);
      const lengthId: SafariLengthId =
        ctx.settings.durationMode === 'short' ? '4-stops' : '6-stops';
      const stopsCount = lengthId === '4-stops' ? 4 : 6;

      return {
        title: 'Number Safari',
        subtitle: `${modeSpec.rangeBadge} • ${stopsCount} stops`,
        detailLine: `${modeSpec.title}: ${modeSpec.subtitle}`,
        artPath: 'hub/number-safari.png',
        voiceClipId: modeId === 'add-10' ? 'number-safari-add' : 'number-safari-count',
        payload: {
          gameId: 'number-safari',
          config: {
            modeId,
            lengthId,
            playerIds: ctx.playerIds,
          },
        },
      };
    },
  },

  'rescue-road': {
    gameId: 'rescue-road',
    title: 'Rescue Road',
    artPath: 'hub/rescue-road.png',
    category: 'fun',
    buildActivity: (ctx) => {
      const size =
        ctx.chapterNumber <= 2
          ? '3x3'
          : ctx.gameOrdinal % 2 === 1 && ctx.chapterNumber >= 3
            ? '4x4'
            : '3x4';
      const roundSize =
        ctx.settings.durationMode === 'short'
          ? '3-roads'
          : ctx.chapterNumber >= 3
            ? '5-roads'
            : '3-roads';
      const roadsCount = roundSize === '5-roads' ? 5 : 3;
      const vehicle = RESCUE_VEHICLES[ctx.gameOrdinal % RESCUE_VEHICLES.length];
      const theme = CARD_THEMES[(ctx.chapterNumber + ctx.gameOrdinal * 3) % CARD_THEMES.length];

      return {
        title: 'Rescue Road',
        subtitle: `${vehicle.label} • ${roadsCount} roads`,
        detailLine: `Fun Break · Connect road tiles for ${theme.title}`,
        artPath: 'hub/rescue-road.png',
        voiceClipId: 'rescue-road',
        previewThemeId: theme.id,
        payload: {
          gameId: 'rescue-road',
          config: {
            size,
            roundSize,
            vehicleId: vehicle.id,
            themeId: theme.id,
          },
        },
      };
    },
  },

  'sticker-jigsaw': {
    gameId: 'sticker-jigsaw',
    title: 'Sticker Jigsaw',
    artPath: 'hub/sticker-jigsaw.png',
    category: 'fun',
    buildActivity: (ctx) => {
      const size =
        ctx.settings.durationMode === 'short'
          ? '2x2'
          : ctx.chapterNumber >= 5 && ctx.gameOrdinal % 3 === 2
            ? '3x3'
            : '2x3';
      const roundSize = ctx.settings.durationMode === 'short' ? '2-puzzles' : '3-puzzles';
      const puzzlesCount = roundSize === '2-puzzles' ? 2 : 3;
      const theme = CARD_THEMES[(ctx.gameOrdinal * 5 + 2) % CARD_THEMES.length];

      return {
        title: 'Sticker Jigsaw',
        subtitle: `${theme.title} • ${puzzlesCount} stickers`,
        detailLine: `Fun Break · Snap ${size.replace('x', '×')} ${theme.title} stickers`,
        artPath: 'hub/sticker-jigsaw.png',
        voiceClipId: 'sticker-jigsaw',
        previewThemeId: theme.id,
        payload: {
          gameId: 'sticker-jigsaw',
          config: {
            size,
            roundSize,
            themeId: theme.id,
          },
        },
      };
    },
  },

  'sticker-scene': {
    gameId: 'sticker-scene',
    title: 'Sticker Scene',
    artPath: 'hub/sticker-scene.png',
    category: 'fun',
    buildActivity: (ctx) => {
      const stickerCount =
        ctx.settings.durationMode === 'short' || ctx.chapterNumber <= 2 ? 4 : 5;
      const roundSize = ctx.settings.durationMode === 'short' ? '2-scenes' : '3-scenes';
      const scenesCount = roundSize === '2-scenes' ? 2 : 3;
      const theme = CARD_THEMES[(ctx.chapterNumber + ctx.gameOrdinal * 2) % CARD_THEMES.length];

      return {
        title: 'Sticker Scene',
        subtitle: `${theme.title} • ${scenesCount} scenes`,
        detailLine: `Fun Break · Match ${stickerCount} stickers onto shadows in ${theme.title}`,
        artPath: 'hub/sticker-scene.png',
        voiceClipId: 'sticker-scene',
        previewThemeId: theme.id,
        payload: {
          gameId: 'sticker-scene',
          config: {
            stickerCount,
            roundSize,
            themeId: theme.id,
          },
        },
      };
    },
  },

  'spot-the-twin': {
    gameId: 'spot-the-twin',
    title: 'Spot the Twin',
    artPath: 'hub/spot-the-twin.png',
    category: 'fun',
    buildActivity: (ctx) => {
      const difficulty =
        ctx.settings.durationMode === 'short' && ctx.chapterNumber <= 2
          ? 'easy-4'
          : ctx.chapterNumber >= 5 && ctx.gameOrdinal % 2 === 1
            ? 'tricky-6'
            : 'standard-5';
      const roundSize = ctx.settings.durationMode === 'short' ? '5-cards' : '8-cards';
      const pairsCount = roundSize === '5-cards' ? 5 : 8;
      const picCount = difficulty === 'easy-4' ? 4 : difficulty === 'standard-5' ? 5 : 6;

      return {
        title: 'Spot the Twin',
        subtitle: `${picCount} pictures • ${pairsCount} pairs`,
        detailLine: `Fun Break · Spot the 1 matching picture across both cards!`,
        artPath: 'hub/spot-the-twin.png',
        voiceClipId: 'spot-the-twin',
        payload: {
          gameId: 'spot-the-twin',
          config: {
            difficulty,
            roundSize,
          },
        },
      };
    },
  },
};

export function getJourneyAdapter(gameId: GameRegistryEntry['id']): JourneyActivityAdapter {
  return JOURNEY_LESSON_ADAPTERS[gameId];
}

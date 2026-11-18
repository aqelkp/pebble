import type { LetterId } from '../data/wordBank';
import {
  getCircleSortPackSpec,
  type CircleSortGridMode,
  type CircleSortPackId,
  type CircleSortRoundLength,
} from '../games/circle-sort/circleSortData';
import type { DotCountId, DotSequenceMode } from '../games/dot-to-dot/dotEngine';
import { ALL_LETTERS } from '../games/letter-train/letterData';
import type { TraceNumberRange } from '../games/letter-trace/traceData';
import { CARD_THEMES, type BoardSizeId } from '../games/memory-match/themes';
import { getSafariModeSpec, type SafariLengthId, type SafariModeId } from '../games/number-safari/safariData';
import type { SudokuSize } from '../games/picture-sudoku/sudokuEngine';
import type { GameRegistryEntry } from '../games/registry';
import { RESCUE_VEHICLES } from '../games/rescue-road/roadEngine';
import { getWordPackSpec, type WordPackId, type WordRoundSizeId } from '../games/word-fun/wordBank';
import {
  PEEKABOO_WORLDS,
  getPeekabooPackSpec,
  type PeekabooPackId,
  type PeekabooRoundLength,
} from '../games/word-peekaboo/peekabooData';
import {
  getCompareModeSpec,
  type CompareModeId,
  type CompareRoundSize,
} from '../games/compare-quest/compareData';
import {
  getWordTracePackSpec,
  type WordTraceCaseMode,
  type WordTracePackId,
  type WordTraceRoundSize,
} from '../games/word-trace/wordTraceEngine';
import {
  getQuestPackSpec,
  type AdventureSkinId,
  type QuestPackId,
  type QuestRoundLength,
} from '../curriculum/questEngine/questTypes';
import {
  getCountdownModeSpec,
  type CountdownModeId,
  type CountdownRoundLength,
} from '../games/pipe-countdown/countdownData';
import type { JourneyActivityAdapter, JourneyLearningPillar } from './journeyTypes';

const COMPARE_MODE_ROTATION: readonly CompareModeId[] = [
  'quantity',
  'length',
  'measure',
  'numbers',
  'mix',
];

const WORD_PACK_ROTATION: readonly WordPackId[] = [
  'animals',
  'sight',
  'home',
  'play',
  'nature',
  'all',
];

const WORD_TRACE_PACK_ROTATION: readonly WordTracePackId[] = [
  'cvc',
  'sight',
  'numbers',
  'cvc-mix',
];

const PEEKABOO_PACK_ROTATION: readonly PeekabooPackId[] = [
  'sight-1',
  'cvc-ai',
  'sight-2',
  'cvc-o',
  'cvc-e',
  'all',
];

const MYSTERY_EXPRESS_PACKS: readonly QuestPackId[] = [
  'numbers-50',
  'place-value-lines',
  'numbers-50',
  'smart-mix',
];

const PEBBLE_CREEK_PACKS: readonly QuestPackId[] = [
  'shapes-patterns',
  'pre-math',
  'shapes-patterns',
  'pre-math',
  'smart-mix',
];

const CLOUD_BALLOON_PACKS: readonly QuestPackId[] = [
  'about-me-helpers',
  'animals-nature',
  'world-transport',
  'smart-mix',
];

const TREASURE_KEYS_PACKS: readonly QuestPackId[] = [
  'reading-phrases',
  'reading-phrases',
  'smart-mix',
];

const PEEKABOO_WORLD_ROTATION = PEEKABOO_WORLDS.filter((w) => w.id !== 'all-stories');
const CIRCLE_SORT_PACK_ROTATION: readonly CircleSortPackId[] = [
  'animal-world',
  'orchard-garden',
  'healthy-plate',
  'on-the-move',
  'mix',
];
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

function formatTraceRangeLabel(range: TraceNumberRange): string {
  if (range === '0-9') return 'Numbers 0–9';
  if (range === '10-20') return 'Numbers 10–20';
  if (range === '21-50') return 'Numbers 21–50';
  return 'Numbers 0–50';
}

export const JOURNEY_LESSON_ADAPTERS: Record<
  GameRegistryEntry['id'],
  JourneyActivityAdapter
> = {
  'memory-match': {
    gameId: 'memory-match',
    title: 'Memory Match',
    artPath: 'hub/memory-match.png',
    pillar: 'fun-break',
    category: 'memory',
    buildActivity: (ctx) => {
      const pawIndex = CARD_THEMES.findIndex((t) => t.id === 'paw-patrol');
      const startOffset = pawIndex >= 0 ? pawIndex : 0;
      const theme =
        ctx.gameOrdinal === 0 && pawIndex >= 0
          ? CARD_THEMES[pawIndex]
          : CARD_THEMES[(startOffset + ctx.gameOrdinal) % CARD_THEMES.length];

      const boardSizeId: BoardSizeId =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? '4x3' : '4x4';
      const sizeText = boardSizeId === '4x3' ? '4×3 (6 pairs)' : '4×4 (8 pairs)';

      return {
        title: 'Memory Match',
        subtitle: `${theme.title} • ${boardSizeId === '4x3' ? '4×3' : '4×4'}`,
        detailLine: `Fun Break · ${theme.title} cards • ${sizeText}`,
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
    pillar: 'phonics-reading',
    category: 'phonics',
    buildActivity: (ctx) => {
      const isTrickyReview = ctx.gameOrdinal > 0 && ctx.gameOrdinal % 6 === 5;
      const trickySlice = isTrickyReview
        ? getTrickyLettersForReview(ctx.settings.selectedLetters)
        : undefined;
      const letters = ctx.nextLetterSlice(trickySlice);
      const label = formatLettersLabel(letters);
      const orderMode =
        ctx.gameOrdinal === 0 || ctx.chapterNumber <= 4 || ctx.gameOrdinal % 2 === 0
          ? 'alphabetical'
          : 'shuffle';
      const wordLabelMode = 'on-mistake';

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

  'letter-trace': {
    gameId: 'letter-trace',
    title: 'Letter Trace',
    artPath: 'hub/letter-trace.png',
    pillar: 'spelling-writing',
    category: 'phonics',
    buildActivity: (ctx) => {
      const roundSize = ctx.settings.durationMode === 'short' ? 4 : 6;
      const fallbackLetters: LetterId[] =
        ctx.settings.selectedLetters.length > 0
          ? ctx.settings.selectedLetters.slice(0, 4)
          : ['A', 'B', 'C', 'D'];

      // Spiral K1 Number Stroke Tracing (0–9 -> 10–20 -> 21–50 -> 0–50)
      if (ctx.gameOrdinal > 0 && ctx.gameOrdinal % 5 === 2) {
        const numStep = Math.floor(ctx.gameOrdinal / 5);
        const numberRange: TraceNumberRange =
          numStep === 0
            ? '0-9'
            : numStep === 1
              ? '10-20'
              : numStep === 2
                ? '21-50'
                : '0-50';
        const rangeLabel = formatTraceRangeLabel(numberRange);
        return {
          title: 'Letter Trace',
          subtitle: `${rangeLabel} • ${roundSize} items`,
          detailLine: `Trace ${rangeLabel.toLowerCase()} in strict top-to-bottom stroke order!`,
          artPath: 'hub/letter-trace.png',
          voiceClipId: 'letter-trace-numbers',
          payload: {
            gameId: 'letter-trace',
            config: {
              selectedLetters: fallbackLetters,
              caseMode: 'both',
              roundSize,
              orderMode: numStep === 0 ? 'alphabetical' : 'shuffle',
              traceMode: 'numbers',
              numberRange,
            },
          },
        };
      }

      // Spiral K1 2D Shape Stroke Tracing (Circle, Square, Rectangle, Triangle)
      if (ctx.gameOrdinal > 0 && ctx.gameOrdinal % 5 === 3) {
        return {
          title: 'Letter Trace',
          subtitle: '2D Shapes • 4 shapes',
          detailLine: 'Trace Circle, Square, Rectangle, and Triangle corners & curves in order!',
          artPath: 'hub/letter-trace.png',
          voiceClipId: 'letter-trace-shapes',
          payload: {
            gameId: 'letter-trace',
            config: {
              selectedLetters: fallbackLetters,
              caseMode: 'both',
              roundSize: 4,
              orderMode: ctx.gameOrdinal <= 4 ? 'alphabetical' : 'shuffle',
              traceMode: 'shapes',
              numberRange: '0-9',
            },
          },
        };
      }

      const isReversalReview = ctx.gameOrdinal > 0 && ctx.gameOrdinal % 5 === 4;
      const trickySlice = isReversalReview
        ? getTrickyLettersForReview(ctx.settings.selectedLetters)
        : undefined;
      const letters = ctx.nextLetterSlice(trickySlice);
      const label = formatLettersLabel(letters);
      const orderMode =
        ctx.gameOrdinal === 0 || ctx.chapterNumber <= 3 || ctx.gameOrdinal % 2 === 0
          ? 'alphabetical'
          : 'shuffle';

      return {
        title: 'Letter Trace',
        subtitle: label,
        detailLine: isReversalReview
          ? `Mirror letter guard: trace ${letters.join(', ')} in strict stroke order`
          : `Trace Capital & Small pairs (${label}) along numbered arrows`,
        artPath: 'hub/letter-trace.png',
        voiceClipId: 'letter-trace',
        lettersCovered: letters,
        payload: {
          gameId: 'letter-trace',
          config: {
            selectedLetters: letters,
            caseMode: 'both',
            roundSize,
            orderMode,
            traceMode: 'letters',
          },
        },
      };
    },
  },

  'letter-river': {
    gameId: 'letter-river',
    title: 'Letter River',
    artPath: 'hub/letter-river.png',
    pillar: 'phonics-reading',
    category: 'phonics',
    buildActivity: (ctx) => {
      const isTrickyReview = ctx.gameOrdinal > 0 && ctx.gameOrdinal % 6 === 4;
      const rawTricky = isTrickyReview
        ? getTrickyLettersForReview(ctx.settings.selectedLetters)
        : undefined;
      const rotatedTricky =
        rawTricky && rawTricky.length > 3
          ? Array.from(
              { length: 3 },
              (_, i) => rawTricky[(ctx.gameOrdinal + i) % rawTricky.length],
            )
          : rawTricky;
      const letters = ctx.nextLetterSlice(rotatedTricky, 3);
      const label = formatLettersLabel(letters);
      const orderMode =
        ctx.gameOrdinal === 0 || ctx.chapterNumber <= 4 || ctx.gameOrdinal % 2 === 0
          ? 'alphabetical'
          : 'shuffle';
      const wordLabelMode = 'after-drop';

      return {
        title: 'Letter River',
        subtitle: label,
        detailLine: isTrickyReview
          ? `Tricky pairs dock (3 buckets): ${letters.join(', ')}`
          : `Fill the 3 letter buckets on the dock: ${letters.join(', ')}`,
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
    pillar: 'logic-world',
    category: 'logic',
    buildActivity: (ctx) => {
      const toyIdx = CARD_THEMES.findIndex((t) => t.id === 'toy-story');
      const offset = toyIdx >= 0 ? toyIdx : 3;
      const theme = CARD_THEMES[(offset + ctx.gameOrdinal) % CARD_THEMES.length];

      let size: SudokuSize = 3;
      if (ctx.gameOrdinal === 0) {
        size = 3;
      } else if (ctx.settings.durationMode === 'short') {
        size = ctx.chapterNumber >= 7 && ctx.gameOrdinal % 2 === 1 ? 4 : 3;
      } else if (ctx.chapterNumber <= 2) {
        size = 3;
      } else if (ctx.chapterNumber >= 12 && ctx.gameOrdinal % 3 === 2) {
        size = 5;
      } else {
        size = 4;
      }

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
    pillar: 'spelling-writing',
    category: 'words',
    buildActivity: (ctx) => {
      const packId: WordPackId =
        ctx.gameOrdinal === 0
          ? 'animals'
          : WORD_PACK_ROTATION[ctx.gameOrdinal % WORD_PACK_ROTATION.length];
      const pack = getWordPackSpec(packId);
      const roundSizeId: WordRoundSizeId = ctx.settings.durationMode === 'short' ? '4' : '6';
      const helperMode = ctx.gameOrdinal === 0 ? 'letter-trace' : 'sound-out';

      return {
        title: 'Word Fun',
        subtitle: `${pack.title} • ${roundSizeId} words`,
        detailLine:
          packId === 'sight'
            ? `Spell ${roundSizeId} K1 sight words (${pack.subtitle})`
            : `Spell ${roundSizeId} 3-letter words (${pack.title})`,
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
    pillar: 'numbers-math',
    category: 'math',
    buildActivity: (ctx) => {
      let modeId: SafariModeId = 'count-5';
      if (ctx.gameOrdinal === 0) {
        modeId = 'count-5';
      } else if (ctx.gameOrdinal === 1) {
        modeId = 'count-10';
      } else if (ctx.chapterNumber <= 4) {
        modeId =
          ctx.gameOrdinal % 3 === 0
            ? 'count-5'
            : ctx.gameOrdinal % 3 === 1
              ? 'count-10'
              : 'add-10';
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
    pillar: 'fun-break',
    category: 'fun',
    buildActivity: (ctx) => {
      const size =
        ctx.gameOrdinal === 0 || ctx.chapterNumber <= 2
          ? '3x3'
          : ctx.gameOrdinal % 2 === 1 && ctx.chapterNumber >= 4
            ? '4x4'
            : '3x4';
      const roundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' || ctx.chapterNumber <= 2
          ? '3-roads'
          : '5-roads';
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
    pillar: 'fun-break',
    category: 'fun',
    buildActivity: (ctx) => {
      const size =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short'
          ? '2x2'
          : ctx.chapterNumber >= 5 && ctx.gameOrdinal % 3 === 2
            ? '3x3'
            : '2x3';
      const roundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? '2-puzzles' : '3-puzzles';
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
    pillar: 'fun-break',
    category: 'fun',
    buildActivity: (ctx) => {
      const stickerCount =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' || ctx.chapterNumber <= 2
          ? 4
          : 5;
      const roundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? '2-scenes' : '3-scenes';
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
    pillar: 'fun-break',
    category: 'fun',
    buildActivity: (ctx) => {
      const difficulty =
        ctx.gameOrdinal === 0 || (ctx.settings.durationMode === 'short' && ctx.chapterNumber <= 2)
          ? 'easy-4'
          : ctx.chapterNumber >= 5 && ctx.gameOrdinal % 2 === 1
            ? 'tricky-6'
            : 'standard-5';
      const roundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? '5-cards' : '8-cards';
      const pairsCount = roundSize === '5-cards' ? 5 : 8;
      const picCount = difficulty === 'easy-4' ? 4 : difficulty === 'standard-5' ? 5 : 6;

      return {
        title: 'Spot the Twin',
        subtitle: `${picCount} pictures • ${pairsCount} pairs`,
        detailLine: 'Fun Break · Spot the 1 matching picture across both cards!',
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

  'dot-to-dot': {
    gameId: 'dot-to-dot',
    title: 'Dot-to-Dot',
    artPath: 'hub/dot-to-dot.png',
    pillar: 'numbers-math',
    category: 'math',
    buildActivity: (ctx) => {
      const MODE_SPIRAL: readonly DotSequenceMode[] = ['numbers', 'countdown', 'letters', 'mix'];
      const sequenceMode: DotSequenceMode =
        ctx.gameOrdinal === 0 ? 'numbers' : MODE_SPIRAL[ctx.gameOrdinal % MODE_SPIRAL.length];

      let dotCount: DotCountId = 8;
      if (ctx.gameOrdinal === 0) {
        dotCount = ctx.settings.durationMode === 'short' ? 6 : 8;
      } else if (sequenceMode === 'countdown') {
        dotCount = ctx.chapterNumber <= 7 ? 10 : ctx.chapterNumber <= 13 ? 15 : 20;
      } else if (sequenceMode === 'numbers') {
        dotCount =
          ctx.chapterNumber <= 4 ? 10 : ctx.chapterNumber <= 10 ? 15 : 20;
      } else if (sequenceMode === 'letters') {
        dotCount =
          ctx.chapterNumber <= 4 ? 8 : ctx.chapterNumber <= 9 ? 10 : ctx.chapterNumber <= 14 ? 15 : 20;
      } else {
        dotCount = ctx.chapterNumber <= 6 ? 10 : 15;
      }

      const roundLength = ctx.settings.durationMode === 'short' ? 3 : 5;
      const theme = CARD_THEMES[(ctx.chapterNumber + ctx.gameOrdinal) % CARD_THEMES.length];

      const modeLabel =
        sequenceMode === 'numbers'
          ? `1–${dotCount}`
          : sequenceMode === 'countdown'
            ? `${dotCount}→0 Countdown`
            : sequenceMode === 'letters'
              ? `A–${String.fromCharCode(64 + dotCount)}`
              : `1–${dotCount}, ${dotCount}→0 & A–Z`;

      return {
        title: 'Dot-to-Dot',
        subtitle: `${modeLabel} • ${theme.title}`,
        detailLine:
          sequenceMode === 'countdown'
            ? `Count backward from ${dotCount} down to 0 around ${theme.title} shadows (${roundLength} pictures)!`
            : `Connect pebbles in order (${modeLabel}) around ${theme.title} shadows (${roundLength} pictures)!`,
        artPath: 'hub/dot-to-dot.png',
        voiceClipId: sequenceMode === 'countdown' ? 'dot-to-dot-countdown' : 'dot-to-dot',
        previewThemeId: theme.id,
        payload: {
          gameId: 'dot-to-dot',
          config: {
            themeId: theme.id,
            sequenceMode,
            dotCount,
            roundLength,
          },
        },
      };
    },
  },

  'word-peekaboo': {
    gameId: 'word-peekaboo',
    title: 'Word Peekaboo',
    artPath: 'hub/word-peekaboo.png',
    pillar: 'phonics-reading',
    category: 'words',
    buildActivity: (ctx) => {
      const packId: PeekabooPackId =
        ctx.gameOrdinal === 0
          ? 'sight-1'
          : PEEKABOO_PACK_ROTATION[ctx.gameOrdinal % PEEKABOO_PACK_ROTATION.length];
      const world =
        PEEKABOO_WORLD_ROTATION[
          (ctx.chapterNumber + ctx.gameOrdinal) % PEEKABOO_WORLD_ROTATION.length
        ];
      const roundLength: PeekabooRoundLength =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? 1 : 3;
      const pack = getPeekabooPackSpec(packId);

      return {
        title: 'Word Peekaboo',
        subtitle: `${pack.title} • ${world.title}`,
        detailLine: `Listen for one word at a time and peel away tiles to discover ${roundLength} ${roundLength === 1 ? 'friend' : 'friends'} in ${world.title}!`,
        artPath: 'hub/word-peekaboo.png',
        voiceClipId: 'word-peekaboo',
        previewThemeId: world.id === 'all-stories' ? undefined : world.id,
        payload: {
          gameId: 'word-peekaboo',
          config: {
            packId,
            worldId: world.id,
            roundLength,
          },
        },
      };
    },
  },

  'compare-quest': {
    gameId: 'compare-quest',
    title: 'Compare Quest',
    artPath: 'hub/compare-quest.png',
    pillar: 'numbers-math',
    category: 'math',
    buildActivity: (ctx) => {
      const modeId: CompareModeId =
        ctx.gameOrdinal === 0
          ? 'quantity'
          : COMPARE_MODE_ROTATION[ctx.gameOrdinal % COMPARE_MODE_ROTATION.length];
      const roundSize: CompareRoundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short'
          ? 6
          : ctx.chapterNumber >= 12 && ctx.gameOrdinal % 3 === 2
            ? 12
            : 8;
      const spec = getCompareModeSpec(modeId);

      return {
        title: 'Compare Quest',
        subtitle: `${spec.title} • ${roundSize} prompts`,
        detailLine: `Compare both sides (${spec.rangeBadge}) and place >, =, or < in the center box!`,
        artPath: 'hub/compare-quest.png',
        voiceClipId: 'compare-quest',
        payload: {
          gameId: 'compare-quest',
          config: {
            modeId,
            roundSize,
          },
        },
      };
    },
  },

  'word-trace': {
    gameId: 'word-trace',
    title: 'Word Trace',
    artPath: 'hub/word-trace.png',
    pillar: 'spelling-writing',
    category: 'words',
    buildActivity: (ctx) => {
      const packId: WordTracePackId =
        ctx.gameOrdinal === 0
          ? 'cvc'
          : WORD_TRACE_PACK_ROTATION[ctx.gameOrdinal % WORD_TRACE_PACK_ROTATION.length];
      const caseMode: WordTraceCaseMode =
        ctx.gameOrdinal === 0 || ctx.chapterNumber <= 3
          ? 'lower'
          : ctx.gameOrdinal % 4 === 2
            ? 'upper'
            : 'mix';
      const roundSize: WordTraceRoundSize =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? 4 : 6;
      const pack = getWordTracePackSpec(packId);
      const caseBadge =
        caseMode === 'lower' ? 'abc small' : caseMode === 'upper' ? 'ABC CAPS' : 'abc & ABC';

      return {
        title: 'Word Trace',
        subtitle: `${pack.title} • ${roundSize} items`,
        detailLine:
          packId === 'numbers'
            ? `Listen to each number (${caseBadge}) and write it left-to-right on the 4-line notebook!`
            : `Listen to each word (${caseBadge}) and write letters left-to-right on the 4-line notebook!`,
        artPath: 'hub/word-trace.png',
        voiceClipId: packId === 'numbers' ? 'word-trace-numbers' : 'word-trace',
        payload: {
          gameId: 'word-trace',
          config: {
            packId,
            caseMode,
            roundSize,
          },
        },
      };
    },
  },

  'mystery-express': buildQuestJourneyAdapter(
    'mystery-express',
    'Mystery Express',
    MYSTERY_EXPRESS_PACKS,
    'numbers-math',
    'math',
  ),
  'pebble-creek': buildQuestJourneyAdapter(
    'pebble-creek',
    'Pebble Creek Bridge',
    PEBBLE_CREEK_PACKS,
    'logic-world',
    'logic',
  ),
  'cloud-balloon': buildQuestJourneyAdapter(
    'cloud-balloon',
    'Cloud Balloon Quest',
    CLOUD_BALLOON_PACKS,
    'logic-world',
    'words',
  ),
  'treasure-keys': buildQuestJourneyAdapter(
    'treasure-keys',
    '5-Key Treasure Chest',
    TREASURE_KEYS_PACKS,
    'phonics-reading',
    'words',
    true,
  ),

  'circle-sort': {
    gameId: 'circle-sort',
    title: 'Circle & Sort',
    artPath: 'hub/circle-sort.png',
    pillar: 'logic-world',
    category: 'logic',
    buildActivity: (ctx) => {
      const packId: CircleSortPackId =
        ctx.gameOrdinal === 0
          ? 'animal-world'
          : CIRCLE_SORT_PACK_ROTATION[ctx.gameOrdinal % CIRCLE_SORT_PACK_ROTATION.length];
      const pack = getCircleSortPackSpec(packId);
      const gridMode: CircleSortGridMode =
        ctx.gameOrdinal === 0 || (ctx.chapterNumber <= 2 && ctx.settings.durationMode === 'short')
          ? '2x3'
          : '3x3';
      const roundLength: CircleSortRoundLength =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? 1 : 3;

      return {
        title: 'Circle & Sort',
        subtitle: `${pack.title} • ${gridMode === '2x3' ? '2×3' : '3×3'}`,
        detailLine: `Listen to the group clue, then tap or draw a circle around every picture that belongs (${roundLength} ${roundLength === 1 ? 'page' : 'pages'})!`,
        artPath: 'hub/circle-sort.png',
        voiceClipId: 'circle-sort',
        payload: {
          gameId: 'circle-sort',
          config: {
            packId,
            gridMode,
            roundLength,
          },
        },
      };
    },
  },

  'pipe-countdown': {
    gameId: 'pipe-countdown',
    title: 'Pipe Countdown',
    artPath: 'hub/pipe-countdown.png',
    pillar: 'numbers-math',
    category: 'math',
    buildActivity: (ctx) => {
      let modeId: CountdownModeId = '9-to-0';
      if (ctx.gameOrdinal === 0 || (ctx.chapterNumber <= 2 && ctx.gameOrdinal % 2 === 0)) {
        modeId = '5-to-0';
      } else if (ctx.gameOrdinal % 3 === 1) {
        modeId = 'missing-rods';
      } else if (ctx.chapterNumber >= 5 && ctx.gameOrdinal % 3 === 2) {
        modeId = '10-to-0';
      }
      const modeSpec = getCountdownModeSpec(modeId);
      const roundLength: CountdownRoundLength =
        ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? 1 : 3;

      return {
        title: 'Pipe Countdown',
        subtitle: `${modeSpec.title} • ${roundLength} ${roundLength === 1 ? 'pipe' : 'pipes'}`,
        detailLine: modeSpec.subtitle,
        artPath: 'hub/pipe-countdown.png',
        voiceClipId: 'pipe-countdown',
        payload: {
          gameId: 'pipe-countdown',
          config: {
            modeId,
            roundLength,
          },
        },
      };
    },
  },
};

function buildQuestJourneyAdapter(
  skinId: AdventureSkinId,
  skinTitle: string,
  packRotation: readonly QuestPackId[],
  pillar: JourneyLearningPillar,
  category: JourneyActivityAdapter['category'],
  lockFiveStops = false,
): JourneyActivityAdapter {
  const artPath = `hub/${skinId}.png`;
  return {
    gameId: skinId,
    title: skinTitle,
    artPath,
    pillar,
    category,
    buildActivity: (ctx) => {
      const packId =
        ctx.gameOrdinal === 0
          ? packRotation[0]
          : packRotation[ctx.gameOrdinal % packRotation.length];
      const pack = getQuestPackSpec(packId);
      const roundLength: QuestRoundLength =
        lockFiveStops || ctx.gameOrdinal === 0 || ctx.settings.durationMode === 'short' ? 5 : 8;
      const stopWord = skinId === 'treasure-keys' ? 'keys' : 'stops';
      return {
        title: skinTitle,
        subtitle: `${pack.shortTitle} • ${roundLength} ${stopWord}`,
        detailLine: pack.subtitle,
        artPath,
        voiceClipId: skinId,
        payload: {
          gameId: skinId,
          config: {
            packId,
            roundLength,
            rotateWorlds: false,
          },
        },
      };
    },
  };
}

export function getJourneyAdapter(gameId: GameRegistryEntry['id']): JourneyActivityAdapter {
  return JOURNEY_LESSON_ADAPTERS[gameId];
}

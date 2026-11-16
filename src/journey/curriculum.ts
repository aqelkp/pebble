import type { FamilyProfile } from '../context/FamilyProfilesContext';
import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS } from '../games/letter-train/letterData';
import { getGameRegistryEntry, type GameRegistryEntry } from '../games/registry';
import {
  ACTIVITIES_PER_CHAPTER,
  TOTAL_ACTIVITIES,
  TOTAL_CHAPTERS,
  type ChapterSpec,
  type FunBreakPacingMode,
  type JourneyActivity,
  type JourneySettings,
} from './journeyTypes';
import { getJourneyAdapter } from './lessonRegistry';

const CHAPTER_THEMES: readonly { title: string; subtitle: string }[] = [
  { title: 'Warm-Up Trail', subtitle: 'Playful first steps across every Pebble world' },
  { title: 'Sunny Phonics', subtitle: 'Short sound & picture stops along the track' },
  { title: 'River & Savanna', subtitle: 'Counting friends and splashing letter buckets' },
  { title: 'Storybook Logic', subtitle: 'Patterns, first words, and memory pairs' },
  { title: 'Early Blending', subtitle: 'Putting letters together into cozy words' },
  { title: 'Animal Meadow', subtitle: 'Counting groups and matching friendly faces' },
  { title: 'Alphabet Breeze', subtitle: 'Fresh letter slices from A to Z' },
  { title: 'Curious Explorer', subtitle: 'Quick puzzles and tricky letter practice' },
  { title: 'Playful Crossing', subtitle: 'Switching between phonics, math, and logic' },
  { title: 'Halfway Summit', subtitle: 'Celebrating 200 mini-adventures together' },
  { title: 'Clever Builder', subtitle: 'Building words and solving 3×3 picture grids' },
  { title: 'Safari Helpers', subtitle: 'Joining animal groups and counting higher' },
  { title: 'Sparkling Stream', subtitle: 'Fast-paced sorting and calm memory focus' },
  { title: 'Word Garden', subtitle: 'Nature, home, and animal vocabulary fun' },
  { title: 'Pattern Meadow', subtitle: 'Spotting missing cards and matching pairs' },
  { title: 'Sound Detective', subtitle: 'Mastering similar sounds like B, D, P, and Q' },
  { title: 'Starlight Trail', subtitle: 'Confident reading, counting, and recall' },
  { title: 'Busy Station', subtitle: 'Loading the train across the whole alphabet' },
  { title: 'River Rapids', subtitle: 'Sharpening phonics speed with calm focus' },
  { title: 'Grand Celebration', subtitle: 'Final mastery chapter of the Activity Book' },
];

export const CHAPTER_SPECS: readonly ChapterSpec[] = Array.from(
  { length: TOTAL_CHAPTERS },
  (_, idx) => {
    const theme = CHAPTER_THEMES[idx % CHAPTER_THEMES.length];
    return {
      chapterNumber: idx + 1,
      title: theme.title,
      subtitle: theme.subtitle,
    };
  },
);

export function getChapterSpec(chapterNumber: number): ChapterSpec {
  const clamped = Math.max(1, Math.min(TOTAL_CHAPTERS, Math.floor(chapterNumber)));
  return CHAPTER_SPECS[clamped - 1];
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createBagDrawer(
  pool: readonly GameRegistryEntry['id'][],
  boostedGames: readonly GameRegistryEntry['id'][],
  rng: () => number,
  preferFirstId?: GameRegistryEntry['id'],
): (prevGame?: GameRegistryEntry['id']) => GameRegistryEntry['id'] {
  const weightedPool: GameRegistryEntry['id'][] = [];
  for (const id of pool) {
    weightedPool.push(id);
    if (boostedGames.includes(id)) {
      weightedPool.push(id);
    }
  }

  let bag: GameRegistryEntry['id'][] = [];
  let isFirstBag = true;

  return (prevGame) => {
    if (bag.length === 0) {
      if (isFirstBag && preferFirstId && pool.includes(preferFirstId)) {
        let removedOne = false;
        const rest = weightedPool.filter((id) => {
          if (!removedOne && id === preferFirstId) {
            removedOne = true;
            return false;
          }
          return true;
        });
        bag = [preferFirstId, ...seededShuffle(rest, rng)];
      } else {
        bag = seededShuffle(weightedPool, rng);
        if (prevGame && bag[0] === prevGame) {
          const swapIdx = bag.findIndex((g) => g !== prevGame);
          if (swapIdx > 0) {
            [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
          }
        }
      }
      isFirstBag = false;
    } else if (prevGame && bag[0] === prevGame) {
      const swapIdx = bag.findIndex((g) => g !== prevGame);
      if (swapIdx > 0) {
        [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
      } else {
        // Remaining items in current bag all equal prevGame — pick another pool item safely if possible
        const alt = pool.find((g) => g !== prevGame);
        if (alt) {
          return alt;
        }
      }
    }

    return bag.shift()!;
  };
}

function buildGameSequence(
  enabledGames: readonly GameRegistryEntry['id'][],
  boostedGames: readonly GameRegistryEntry['id'][],
  funBreakPacing: FunBreakPacingMode,
  totalSlots: number,
  rng: () => number,
): GameRegistryEntry['id'][] {
  const pool = enabledGames.length > 0 ? [...enabledGames] : (['memory-match'] as const);
  if (pool.length === 1) {
    return Array.from({ length: totalSlots }, () => pool[0]);
  }

  const funPool = pool.filter((id) => getGameRegistryEntry(id).activityRole === 'reward');
  const learningPool = pool.filter((id) => getGameRegistryEntry(id).activityRole !== 'reward');

  // If pacing is 'off' or only one role is active, rotate all enabled games via weighted non-repeating bags
  if (funBreakPacing === 'off' || funPool.length === 0 || learningPool.length === 0) {
    const drawAny = createBagDrawer(pool, boostedGames, rng, 'memory-match');
    const sequence: GameRegistryEntry['id'][] = [];
    for (let i = 0; i < totalSlots; i += 1) {
      sequence.push(drawAny(sequence[sequence.length - 1]));
    }
    return sequence;
  }

  const drawFun = createBagDrawer(funPool, boostedGames, rng);
  const drawLearning = createBagDrawer(learningPool, boostedGames, rng);
  const sequence: GameRegistryEntry['id'][] = [];

  if (funBreakPacing === 'balanced') {
    const R = funPool.length;
    const L = learningPool.length;
    const cycleLen = L + R;
    const funPositionsInCycle = new Set<number>();
    for (let m = 0; m < R; m += 1) {
      funPositionsInCycle.add(Math.floor((m * cycleLen + R - 1) / R));
    }

    for (let slot = 0; slot < totalSlots; slot += 1) {
      const inCycle = slot % cycleLen;
      const prevGame = sequence[sequence.length - 1];
      sequence.push(funPositionsInCycle.has(inCycle) ? drawFun(prevGame) : drawLearning(prevGame));
    }
    return sequence;
  }

  const cycleLen = funBreakPacing === 'after-1' ? 2 : funBreakPacing === 'after-3' ? 4 : 3;
  for (let slot = 0; slot < totalSlots; slot += 1) {
    const prevGame = sequence[sequence.length - 1];
    const isFunSlot = slot % cycleLen === cycleLen - 1;
    sequence.push(isFunSlot ? drawFun(prevGame) : drawLearning(prevGame));
  }
  return sequence;
}

export function buildJourneyCurriculum(
  settings: JourneySettings,
  profiles: readonly FamilyProfile[],
): JourneyActivity[] {
  const rng = createMulberry32(0x50454242);
  const nextRngInt = (maxExclusive: number): number =>
    maxExclusive <= 1 ? 0 : Math.floor(rng() * maxExclusive);

  const playerIds: string[] =
    settings.playerMode === 'two-player' && profiles.length >= 2
      ? profiles.slice(0, 2).map((p) => p.id)
      : [profiles[0]?.id ?? 'child'];

  const activeLetters: LetterId[] =
    settings.selectedLetters.length > 0 ? settings.selectedLetters : [...ALL_LETTERS];

  let letterCursor = 0;
  const nextLetterSlice = (overrideLetters?: LetterId[]): LetterId[] => {
    if (overrideLetters && overrideLetters.length >= 3) {
      return overrideLetters;
    }
    const sliceSize = Math.min(settings.lettersPerLesson, activeLetters.length);
    const picked: LetterId[] = [];
    for (let i = 0; i < sliceSize; i += 1) {
      picked.push(activeLetters[(letterCursor + i) % activeLetters.length]);
    }
    letterCursor = (letterCursor + sliceSize) % activeLetters.length;
    return picked;
  };

  const gameSequence = buildGameSequence(
    settings.enabledGames,
    settings.boostedGames ?? ['rescue-road'],
    settings.funBreakPacing,
    TOTAL_ACTIVITIES,
    rng,
  );
  const gameCounts: Record<GameRegistryEntry['id'], number> = {
    'memory-match': 0,
    'letter-train': 0,
    'letter-trace': 0,
    'letter-river': 0,
    'picture-sudoku': 0,
    'word-fun': 0,
    'number-safari': 0,
    'rescue-road': 0,
    'sticker-jigsaw': 0,
    'sticker-scene': 0,
    'spot-the-twin': 0,
    'dot-to-dot': 0,
    'word-peekaboo': 0,
    'circle-sort': 0,
  };

  return gameSequence.map((gameId, slotIndex) => {
    const chapterNumber = Math.floor(slotIndex / ACTIVITIES_PER_CHAPTER) + 1;
    const numberInChapter = (slotIndex % ACTIVITIES_PER_CHAPTER) + 1;
    const gameOrdinal = gameCounts[gameId];
    gameCounts[gameId] = gameOrdinal + 1;

    const adapter = getJourneyAdapter(gameId);
    const registryEntry = getGameRegistryEntry(gameId);
    const generated = adapter.buildActivity({
      slotIndex,
      chapterNumber,
      numberInChapter,
      gameOrdinal,
      settings,
      playerIds,
      nextLetterSlice,
      nextRngInt,
    });

    return {
      index: slotIndex,
      activityNumber: slotIndex + 1,
      chapterNumber,
      numberInChapter,
      gameId,
      isFunBreak: registryEntry.activityRole === 'reward',
      title: generated.title,
      subtitle: generated.subtitle,
      detailLine: generated.detailLine,
      artPath: generated.artPath,
      voiceClipId: generated.voiceClipId,
      lettersCovered: generated.lettersCovered,
      previewThemeId: generated.previewThemeId,
      payload: generated.payload,
    };
  });
}

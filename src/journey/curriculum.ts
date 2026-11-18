import type { FamilyProfile } from '../context/FamilyProfilesContext';
import type { LetterId } from '../data/wordBank';
import { ALL_LETTERS } from '../games/letter-train/letterData';
import { GAME_REGISTRY, getGameRegistryEntry, isValidGameId, type GameRegistryEntry } from '../games/registry';
import {
  ACTIVITIES_PER_CHAPTER,
  TOTAL_ACTIVITIES,
  TOTAL_CHAPTERS,
  type ChapterSpec,
  type CompletedSlotSnapshot,
  type FunBreakPacingMode,
  type JourneyActivity,
  type JourneyLearningPillar,
  type JourneyProgressState,
  type JourneySettings,
} from './journeyTypes';
import { getJourneyAdapter } from './lessonRegistry';

const CHAPTER_THEMES: readonly { title: string; subtitle: string }[] = [
  {
    title: 'Warm-Up Trail',
    subtitle: 'Friendly first steps across all 20 Pebble worlds — sounds, numbers, shapes, sorting & stickers',
  },
  {
    title: 'Sunny Phonics & Numbers',
    subtitle: 'Sight-word peekaboo, 1–10 savanna trails, number tracing & countdown pebbles',
  },
  {
    title: ' Creek, Sky & Savanna',
    subtitle: 'Stepping-stone shapes, lifecycles in the clouds, and comparing lengths & baskets',
  },
  {
    title: 'Notebook & Treasure',
    subtitle: '4-line word writing, 2D shape strokes, and golden-key reading phrases',
  },
  {
    title: 'Tens, Ones & Blending',
    subtitle: 'Railway place-value gates, CVC word building, and juice-jug comparisons',
  },
  {
    title: 'Curious World Explorer',
    subtitle: 'Community helpers, healthy habits, 3×3 picture logic, and alphabet dot trails',
  },
  {
    title: 'Alphabet & Sight Breeze',
    subtitle: 'Fresh A–Z slices, K1 sight words, and tricky mirror-letter guards',
  },
  {
    title: 'Bridges & Bar Graphs',
    subtitle: 'Volume beakers, bar graphs, 15→0 countdowns, and 4×4 sudoku grids',
  },
  {
    title: 'Playful K1 Crossing',
    subtitle: 'Switching smoothly between reading phrases, 0–50 math, handwriting & science',
  },
  {
    title: 'Halfway Summit',
    subtitle: 'Celebrating 200 joyful mini-lessons across every K1 skill!',
  },
  {
    title: 'Clever Word & Shape Builder',
    subtitle: 'Mixed-case 4-line words, 3D shapes, and joining savanna animal groups',
  },
  {
    title: 'Railway & River Helpers',
    subtitle: 'Number-line hops, 1st–10th ordinals, and multi-bucket river phonics',
  },
  {
    title: 'Nature & Sky Discovery',
    subtitle: 'Butterfly & plant lifecycles, Reduce-Reuse-Recycle, and Sun, Moon & Planets',
  },
  {
    title: 'Confident Reader Garden',
    subtitle: 'Silent short phrases, middle & ending sounds, and sight-word fluency',
  },
  {
    title: 'Pattern & Measure Meadow',
    subtitle: 'ABAB/ABC patterns, block-unit lengths, and workbook symbol comparisons',
  },
  {
    title: 'Sound & Stroke Detective',
    subtitle: 'Mastering B, D, P, Q sounds and writing numbers up to 50 in order',
  },
  {
    title: 'Starlight Countdown',
    subtitle: '20→0 backward dot trails, 1–20 sequences, and 4-line sight-word mastery',
  },
  {
    title: 'Busy K1 Station',
    subtitle: 'Full-alphabet phonics, place-value bundles, and smart K1 quest mixes',
  },
  {
    title: 'Rapids & Logic Mastery',
    subtitle: 'Sharp phonics sorting, multi-clue logic grids, and world-science review',
  },
  {
    title: 'Grand K1 Celebration',
    subtitle: 'Final mastery chapter across reading, writing, math 0–50, logic & our world!',
  },
];

export const CHAPTER_SPECS: readonly ChapterSpec[] = Array.from(
  { length: TOTAL_CHAPTERS },
  (_, idx) => {
    const theme = CHAPTER_THEMES[idx % CHAPTER_THEMES.length];
    return {
      chapterNumber: idx + 1,
      title: theme.title.trim(),
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

const LEARNING_PILLAR_ROTATION: readonly Exclude<JourneyLearningPillar, 'fun-break'>[] = [
  'phonics-reading',
  'numbers-math',
  'spelling-writing',
  'logic-world',
];

const STARTER_PILLAR_ORDER: Record<
  Exclude<JourneyLearningPillar, 'fun-break'>,
  readonly GameRegistryEntry['id'][]
> = {
  'phonics-reading': ['letter-train', 'word-peekaboo', 'letter-river', 'treasure-keys'],
  'numbers-math': ['number-safari', 'compare-quest', 'dot-to-dot', 'mystery-express'],
  'spelling-writing': ['letter-trace', 'word-fun', 'word-trace'],
  'logic-world': ['pebble-creek', 'circle-sort', 'picture-sudoku', 'cloud-balloon'],
};

const STARTER_FUN_ORDER: readonly GameRegistryEntry['id'][] = [
  'memory-match',
  'sticker-scene',
  'rescue-road',
  'spot-the-twin',
  'sticker-jigsaw',
];

function createBagDrawer(
  pool: readonly GameRegistryEntry['id'][],
  boostedGames: readonly GameRegistryEntry['id'][],
  rng: () => number,
  starterOrder?: readonly GameRegistryEntry['id'][],
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
      if (isFirstBag && starterOrder && starterOrder.length > 0) {
        const orderedFirst = starterOrder.filter((id) => pool.includes(id));
        const remaining = pool.filter((id) => !orderedFirst.includes(id));
        const boostedExtras = pool.filter((id) => boostedGames.includes(id));
        bag = [
          ...orderedFirst,
          ...seededShuffle(remaining, rng),
          ...seededShuffle(boostedExtras, rng),
        ];
      } else {
        bag = seededShuffle(weightedPool, rng);
      }
      if (prevGame && bag[0] === prevGame) {
        const swapIdx = bag.findIndex((g) => g !== prevGame);
        if (swapIdx > 0) {
          [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
        }
      }
      isFirstBag = false;
    } else if (prevGame && bag[0] === prevGame) {
      const swapIdx = bag.findIndex((g) => g !== prevGame);
      if (swapIdx > 0) {
        [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
      } else {
        const alt = pool.find((g) => g !== prevGame);
        if (alt) return alt;
      }
    }

    return bag.shift()!;
  };
}

/**
 * Draws learning games by interleaving Pebble's 4 K1 Learning Pillars
 * (Phonics & Reading -> Numbers & Math -> Spelling & Writing -> Logic & World)
 * so every enabled game is visited once per full cycle without back-to-back domain fatigue.
 */
function createPillarBalancedDrawer(
  learningPool: readonly GameRegistryEntry['id'][],
  boostedGames: readonly GameRegistryEntry['id'][],
  rng: () => number,
): (prevGame?: GameRegistryEntry['id']) => GameRegistryEntry['id'] {
  if (learningPool.length <= 2) {
    return createBagDrawer(learningPool, boostedGames, rng);
  }

  let bag: GameRegistryEntry['id'][] = [];
  let cycleIndex = 0;

  const refillCycleBag = () => {
    const queues = new Map<Exclude<JourneyLearningPillar, 'fun-break'>, GameRegistryEntry['id'][]>();
    for (const pillar of LEARNING_PILLAR_ROTATION) {
      const inPillar = learningPool.filter(
        (id) => getJourneyAdapter(id).pillar === pillar,
      );
      if (inPillar.length === 0) {
        queues.set(pillar, []);
        continue;
      }

      if (cycleIndex === 0) {
        const preferred = STARTER_PILLAR_ORDER[pillar].filter((id) => inPillar.includes(id));
        const extraNew = inPillar.filter((id) => !preferred.includes(id));
        const boostedExtras = inPillar.filter((id) => boostedGames.includes(id));
        queues.set(pillar, [
          ...preferred,
          ...seededShuffle(extraNew, rng),
          ...seededShuffle(boostedExtras, rng),
        ]);
      } else {
        const weighted: GameRegistryEntry['id'][] = [];
        for (const id of inPillar) {
          weighted.push(id);
          if (boostedGames.includes(id)) {
            weighted.push(id);
          }
        }
        queues.set(pillar, seededShuffle(weighted, rng));
      }
    }

    // Fallback for any learning game assigned to fun-break by mistake
    const uncategorized = learningPool.filter(
      (id) => getJourneyAdapter(id).pillar === 'fun-break',
    );
    if (uncategorized.length > 0) {
      queues.get('logic-world')?.push(...seededShuffle(uncategorized, rng));
    }

    const interleaved: GameRegistryEntry['id'][] = [];
    const pillarOffset = cycleIndex % LEARNING_PILLAR_ROTATION.length;
    let remainingCount = Array.from(queues.values()).reduce((sum, q) => sum + q.length, 0);

    while (remainingCount > 0) {
      for (let p = 0; p < LEARNING_PILLAR_ROTATION.length; p += 1) {
        const pillar =
          LEARNING_PILLAR_ROTATION[(pillarOffset + p) % LEARNING_PILLAR_ROTATION.length];
        const q = queues.get(pillar);
        if (q && q.length > 0) {
          interleaved.push(q.shift()!);
          remainingCount -= 1;
        }
      }
    }

    // Prevent adjacent duplicates inside the cycle when a boosted game appears twice
    for (let i = 1; i < interleaved.length; i += 1) {
      if (interleaved[i] === interleaved[i - 1]) {
        const swapIdx = interleaved.findIndex(
          (candidate, idx) => idx > i && candidate !== interleaved[i - 1],
        );
        if (swapIdx > i) {
          [interleaved[i], interleaved[swapIdx]] = [interleaved[swapIdx], interleaved[i]];
        }
      }
    }

    bag = interleaved;
    cycleIndex += 1;
  };

  return (prevGame) => {
    if (bag.length === 0) {
      refillCycleBag();
    }
    if (prevGame && bag[0] === prevGame) {
      const swapIdx = bag.findIndex((g) => g !== prevGame);
      if (swapIdx > 0) {
        [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
      } else {
        const alt = learningPool.find((g) => g !== prevGame);
        if (alt) return alt;
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

  if (funBreakPacing === 'off' || funPool.length === 0 || learningPool.length === 0) {
    const drawAny = createBagDrawer(pool, boostedGames, rng, ['letter-train', ...STARTER_FUN_ORDER]);
    const sequence: GameRegistryEntry['id'][] = [];
    for (let i = 0; i < totalSlots; i += 1) {
      sequence.push(drawAny(sequence[sequence.length - 1]));
    }
    return sequence;
  }

  const drawFun = createBagDrawer(funPool, boostedGames, rng, STARTER_FUN_ORDER);
  const drawLearning = createPillarBalancedDrawer(learningPool, boostedGames, rng);
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

export type JourneyProgressContext = Pick<
  JourneyProgressState,
  'currentActivityIndex' | 'completedSnapshots' | 'pendingIntroGames'
>;

export function buildJourneyCurriculum(
  settings: JourneySettings,
  profiles: readonly FamilyProfile[],
  progress?: JourneyProgressContext,
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
  const nextLetterSlice = (overrideLetters?: LetterId[], maxLetters?: number): LetterId[] => {
    const cap =
      typeof maxLetters === 'number' && maxLetters > 0
        ? Math.min(maxLetters, settings.lettersPerLesson)
        : settings.lettersPerLesson;
    if (overrideLetters && overrideLetters.length >= 3) {
      return overrideLetters.slice(0, cap);
    }
    const sliceSize = Math.min(cap, activeLetters.length);
    const picked: LetterId[] = [];
    for (let i = 0; i < sliceSize; i += 1) {
      picked.push(activeLetters[(letterCursor + i) % activeLetters.length]);
    }
    letterCursor = (letterCursor + sliceSize) % activeLetters.length;
    return picked;
  };

  const baseSequence = buildGameSequence(
    settings.enabledGames,
    settings.boostedGames ?? [],
    settings.funBreakPacing,
    TOTAL_ACTIVITIES,
    rng,
  );

  // Apply non-destructive frozen history for completed slots + New Game Welcome queue
  const snapshots: Record<string, CompletedSlotSnapshot> = progress?.completedSnapshots ?? {};
  const enabledSet = new Set<GameRegistryEntry['id']>(settings.enabledGames);
  const pendingIntroQueue: GameRegistryEntry['id'][] = (progress?.pendingIntroGames ?? []).filter(
    (id, idx, arr) => isValidGameId(id) && enabledSet.has(id) && arr.indexOf(id) === idx,
  );
  const introStartIdx = Math.max(
    0,
    Math.min(TOTAL_ACTIVITIES - 1, Math.floor(progress?.currentActivityIndex ?? 0)),
  );

  const introAssignedSlots = new Map<number, GameRegistryEntry['id']>();
  if (pendingIntroQueue.length > 0) {
    let cursor = introStartIdx;
    for (const newGameId of pendingIntroQueue) {
      while (cursor < TOTAL_ACTIVITIES && snapshots[String(cursor)]) {
        cursor += 1;
      }
      if (cursor < TOTAL_ACTIVITIES) {
        introAssignedSlots.set(cursor, newGameId);
        cursor += 1;
      }
    }
  }

  const finalSequence: GameRegistryEntry['id'][] = [...baseSequence];
  for (let slot = 0; slot < TOTAL_ACTIVITIES; slot += 1) {
    const snap = snapshots[String(slot)];
    if (snap && isValidGameId(snap.gameId)) {
      finalSequence[slot] = snap.gameId;
      continue;
    }
    const introGame = introAssignedSlots.get(slot);
    if (introGame) {
      finalSequence[slot] = introGame;
      continue;
    }
    // Avoid accidental back-to-back repeat right after a frozen snapshot or new-game welcome slot
    if (
      slot > 0 &&
      finalSequence[slot] === finalSequence[slot - 1] &&
      settings.enabledGames.length > 1
    ) {
      const sameRoleAlt = settings.enabledGames.find(
        (id) =>
          id !== finalSequence[slot - 1] &&
          id !== baseSequence[slot + 1] &&
          getGameRegistryEntry(id).activityRole ===
            getGameRegistryEntry(finalSequence[slot]).activityRole,
      );
      const anyAlt = settings.enabledGames.find(
        (id) => id !== finalSequence[slot - 1] && id !== baseSequence[slot + 1],
      );
      if (sameRoleAlt) {
        finalSequence[slot] = sameRoleAlt;
      } else if (anyAlt) {
        finalSequence[slot] = anyAlt;
      }
    }
  }

  const gameCounts = Object.fromEntries(
    GAME_REGISTRY.map((g) => [g.id, 0]),
  ) as Record<GameRegistryEntry['id'], number>;

  return finalSequence.map((gameId, slotIndex) => {
    const chapterNumber = Math.floor(slotIndex / ACTIVITIES_PER_CHAPTER) + 1;
    const numberInChapter = (slotIndex % ACTIVITIES_PER_CHAPTER) + 1;
    const snap = snapshots[String(slotIndex)];
    const isNewGameIntro = !snap && introAssignedSlots.get(slotIndex) === gameId;

    const gameOrdinal = snap
      ? Math.max(0, Math.min(TOTAL_ACTIVITIES, Math.floor(snap.gameOrdinal)))
      : isNewGameIntro
        ? 0
        : gameCounts[gameId];

    gameCounts[gameId] = Math.max(gameCounts[gameId], gameOrdinal + 1);

    const adapter = getJourneyAdapter(gameId);
    const registryEntry = getGameRegistryEntry(gameId);
    const generated = adapter.buildActivity({
      slotIndex,
      chapterNumber,
      numberInChapter,
      gameOrdinal,
      settings,
      playerIds,
      nextLetterSlice: (overrideLetters?: LetterId[], maxLetters?: number) => {
        if (snap?.lettersCovered && snap.lettersCovered.length > 0) {
          // Advance shared cursor proportionally so subsequent lessons stay cleanly distributed
          nextLetterSlice(overrideLetters, maxLetters);
          return snap.lettersCovered;
        }
        return nextLetterSlice(overrideLetters, maxLetters);
      },
      nextRngInt,
    });

    return {
      index: slotIndex,
      activityNumber: slotIndex + 1,
      chapterNumber,
      numberInChapter,
      gameId,
      gameOrdinal,
      isFunBreak: registryEntry.activityRole === 'reward',
      ...(isNewGameIntro ? { isNewGameIntro: true } : {}),
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

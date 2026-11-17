import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { useGameLoop } from '../../engine';
import { pickWeightedAdaptive } from '../../learning/adaptiveSelector';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import {
  playWrongLetterExplanation,
  preloadLetterMistakeAudio,
  preloadLettersAudio,
  preloadWordsAudio,
} from '../../utils/wordAudio';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { WordIllustration } from '../letter-train/WordIllustration';
import type { LetterRiverConfig } from './LetterRiverSetup';
import {
  ALL_LETTERS,
  FISH_THEMES,
  GOLDEN_FISH_THEME,
  getStationSpec,
  isValidLetterId,
  loadRiverMasteredLetters,
  pickRandomInt,
  saveRiverMasteredLetter,
  type FishThemeSpec,
  type LetterId,
  type LetterWordSpec,
} from './riverData';
import {
  playBucketFullSound,
  playCorrectCatchSound,
  playFishPlopSound,
  playGentleWrongBucketSound,
  playRiverCompleteSound,
  speakRiverLetter,
  speakRiverWord,
  stopRiverSpeech,
} from './riverSounds';

interface LetterRiverBoardProps {
  gameKey: number;
  config: LetterRiverConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BannerTone = 'neutral' | 'mint' | 'golden' | 'calm-hint';

interface DockBucket {
  slotIndex: 0 | 1 | 2;
  letter: LetterId;
  caughtWords: LetterWordSpec[];
  state: 'active' | 'popping' | 'entering';
}

interface SwimmingFish {
  uid: string;
  spec: LetterWordSpec;
  lane: 0 | 1 | 2;
  direction: 1 | -1;
  theme: FishThemeSpec;
  isGolden: boolean;
  spawnXPct: number;
}

interface DragFishState {
  fish: SwimmingFish;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoveredSlot: number | null;
}

interface BucketFeedback {
  slotIndex: number;
  kind: 'splash' | 'bucket-full' | 'gentle-nope';
  key: number;
  wordLabel?: string;
  wordLetter?: LetterId;
  wordSpec?: LetterWordSpec;
  isGolden?: boolean;
}

const ACTIVE_RIVER_STORAGE_KEY = 'pebble.letter-river.active.v1';
const LANE_SPEEDS_PCT_PER_SEC: readonly [number, number, number] = [5.4, 6.1, 4.9];
const LANE_DIRECTIONS: readonly [1, -1, 1] = [1, -1, 1];
const BUCKET_CAPACITY = 3;
const GOLDEN_STREAK_STEP = 4;

interface SavedDockSlot {
  letter: LetterId;
  caughtWordIds: string[];
}

interface SavedRiverState {
  gameKey: number;
  letterQueue: LetterId[];
  nextQueueIdx: number;
  slots: (SavedDockSlot | null)[];
  completedLetters: LetterId[];
  totalScore: number;
  streak: number;
  bestStreak: number;
  goldenCaught: number;
  mistakeCount: number;
  finished: boolean;
}

function AudioSpeakerIcon({ muted = false, size = 16 }: { muted?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.2" />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.8 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

/**
 * Illustrated SVG River Fish carrying an upright circular picture medallion.
 * The fish body/tail faces the swim direction while the inner picture never mirrors.
 */
function RiverFishSprite({
  fish,
  showWord,
  isHooked,
}: {
  fish: SwimmingFish;
  showWord: boolean;
  isHooked?: boolean;
}) {
  const facingLeft = fish.direction === -1;
  const theme = fish.isGolden ? GOLDEN_FISH_THEME : fish.theme;

  return (
    <div
      className={`lr-fish-visual ${fish.isGolden ? 'lr-fish-visual--golden' : ''} ${
        isHooked ? 'lr-fish-visual--hooked' : ''
      }`}
    >
      <svg
        className={`lr-fish-svg ${facingLeft ? 'lr-fish-svg--left' : ''}`}
        viewBox="0 0 154 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top dorsal fin */}
        <path
          d="M58 22 C66 6, 92 7, 102 22 Z"
          fill={theme.finColor}
        />
        {/* Bottom pelvic fin */}
        <path
          d="M68 74 C76 89, 96 87, 101 73 Z"
          fill={theme.finColor}
        />
        {/* Animated wagging tail */}
        <g className="lr-fish-tail">
          <path
            d="M36 48 L10 26 C6 33, 8 44, 15 48 C8 52, 6 63, 10 70 Z"
            fill={theme.finColor}
          />
          <path
            d="M34 48 L16 34 C14 40, 15 45, 20 48 C15 51, 14 56, 16 62 Z"
            fill={theme.bodyColor}
            opacity="0.7"
          />
        </g>
        {/* Main rounded fish body */}
        <path
          d="M30 48 C34 22, 68 14, 106 18 C132 21, 148 35, 148 48 C148 61, 132 75, 106 78 C68 82, 34 74, 30 48 Z"
          fill={theme.bodyColor}
        />
        {/* Soft belly highlight */}
        <path
          d="M42 54 C52 70, 96 75, 136 58 C126 68, 100 75, 72 74 C52 73, 44 64, 42 54 Z"
          fill={theme.bellyColor}
          opacity="0.45"
        />
        {/* Side fin */}
        <path
          d="M64 52 C54 55, 52 65, 62 67 C70 69, 75 60, 64 52 Z"
          fill={theme.finColor}
          opacity="0.88"
        />
        {/* Cute cheek & smiling mouth */}
        <circle cx="127" cy="54" r="4.5" fill={theme.cheekColor} />
        <path
          d="M134 55 Q139 59 144 53"
          stroke="#1E2433"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.72"
        />
        {/* Friendly eye */}
        <circle cx="131" cy="40" r="6" fill="#FFFFFF" />
        <circle cx="132.5" cy="40" r="3.4" fill="#1E2433" />
        <circle cx="133.6" cy="38.5" r="1.3" fill="#FFFFFF" />
      </svg>

      {/* Upright circular picture medallion (never mirrored) */}
      <div
        className={`lr-fish-medallion ${facingLeft ? 'lr-fish-medallion--left' : 'lr-fish-medallion--right'}`}
      >
        <WordIllustration id={fish.spec.id} size={46} />
      </div>

      {/* Golden Crown tag (strictly zero 4-point sparkle stars) */}
      {fish.isGolden && (
        <span className="lr-fish-golden-tag" title="Golden Fish! 2x Catch" aria-hidden="true">
          <CrownIcon size={14} />
          <span>2×</span>
        </span>
      )}

      {/* Optional printed word badge (only when Show Words mode is active) */}
      {showWord && (
        <span className="lr-fish-word-pill">
          <strong>{fish.spec.word.slice(0, 1)}</strong>
          {fish.spec.word.slice(1)}
        </span>
      )}
    </div>
  );
}

/**
 * Animated SVG splash crown + rising round water droplets for super-playful correct drops.
 */
function BucketSplashBurst({
  burstKey,
  isGolden,
  isFull,
}: {
  burstKey: number;
  isGolden?: boolean;
  isFull?: boolean;
}) {
  const dropColor = isGolden ? '#F2B84B' : isFull ? '#3BA99C' : '#4BA3E3';
  const accentColor = isGolden ? '#F27A5E' : '#85D8CE';

  return (
    <div key={burstKey} className="lr-splash-burst" aria-hidden="true">
      <svg viewBox="0 0 140 84" fill="none" className="lr-splash-burst__svg">
        <path
          d="M24 72 Q45 28 70 44 Q95 28 116 72"
          stroke={dropColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.82"
        />
        <circle cx="20" cy="40" r="8" fill={dropColor} className="lr-drop lr-drop--1" />
        <circle cx="40" cy="22" r="7" fill={accentColor} className="lr-drop lr-drop--2" />
        <circle cx="70" cy="12" r="9" fill={dropColor} className="lr-drop lr-drop--3" />
        <circle cx="100" cy="22" r="7" fill={accentColor} className="lr-drop lr-drop--4" />
        <circle cx="120" cy="40" r="8" fill={dropColor} className="lr-drop lr-drop--5" />
        <circle cx="54" cy="28" r="5" fill="#FFFFFF" opacity="0.95" className="lr-drop lr-drop--2" />
        <circle cx="86" cy="28" r="5" fill="#FFFFFF" opacity="0.95" className="lr-drop lr-drop--4" />
      </svg>
    </div>
  );
}

const MAX_DOCK_BUCKETS = 3;

function buildInitialQueue(config: LetterRiverConfig, playerId: string): LetterId[] {
  const clean = ALL_LETTERS.filter((l) => config.selectedLetters.includes(l));
  const base = clean.length > 0 ? clean : [...ALL_LETTERS];
  const pickCount = Math.min(MAX_DOCK_BUCKETS, base.length);

  if (base.length <= MAX_DOCK_BUCKETS) {
    return config.orderMode === 'shuffle'
      ? pickWeightedAdaptive(base, (l) => `letter:${l}`, playerId, 'initial_letter_sound', pickCount)
      : base;
  }

  // Strictly cap every round to 3 buckets on the dock so a completed bucket never spawns a surprise 4th bucket.
  const picked = pickWeightedAdaptive(
    base,
    (l) => `letter:${l}`,
    playerId,
    'initial_letter_sound',
    pickCount,
  );
  if (config.orderMode === 'alphabetical') {
    const pickedSet = new Set<LetterId>(picked);
    return ALL_LETTERS.filter((l) => pickedSet.has(l));
  }
  return picked;
}

function buildInitialBuckets(queue: LetterId[]): {
  buckets: (DockBucket | null)[];
  nextQueueIdx: number;
} {
  const slotCount = Math.min(MAX_DOCK_BUCKETS, queue.length);
  const buckets: (DockBucket | null)[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    buckets.push({
      slotIndex: i as 0 | 1 | 2,
      letter: queue[i],
      caughtWords: [],
      state: 'active',
    });
  }
  return { buckets, nextQueueIdx: slotCount };
}

function targetStreamSize(openBuckets: readonly DockBucket[]): number {
  if (openBuckets.length === 0) return 0;
  if (openBuckets.length === 1) return 3;
  if (openBuckets.length === 2) return 4;
  return 5;
}

function pickThemeNotMatching(excludeThemeId?: string): FishThemeSpec {
  const candidates = excludeThemeId
    ? FISH_THEMES.filter((t) => t.id !== excludeThemeId)
    : FISH_THEMES;
  return candidates[pickRandomInt(candidates.length)] ?? FISH_THEMES[0];
}

function pickBestSpawnPosition(lane: 0 | 1 | 2, existingFish: readonly SwimmingFish[], existingPosMap: Map<string, number>, fromEdge: boolean): number {
  const direction = LANE_DIRECTIONS[lane];
  const lanePositions = existingFish
    .filter((f) => f.lane === lane)
    .map((f) => existingPosMap.get(f.uid) ?? f.spawnXPct);

  if (fromEdge) {
    if (direction === 1) {
      const leftMost = lanePositions.length > 0 ? Math.min(...lanePositions) : 100;
      return leftMost < 24 ? Math.min(-12, leftMost - 34) : -10;
    }
    const rightMost = lanePositions.length > 0 ? Math.max(...lanePositions) : 0;
    return rightMost > 76 ? Math.max(112, rightMost + 34) : 110;
  }

  if (lanePositions.length === 0) {
    return 22 + pickRandomInt(56);
  }
  // Test candidate spots across 16..84 and choose the farthest from other fish in this lane
  let bestX = 50;
  let bestMinDist = -1;
  for (let x = 16; x <= 84; x += 6) {
    const minDist = Math.min(...lanePositions.map((px) => Math.abs(px - x)));
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      bestX = x;
    }
  }
  return bestX;
}

function createFishUid(letter: LetterId, wordId: string): string {
  return `${letter}-${wordId}-${Date.now().toString(36)}-${pickRandomInt(1_000_000)}`;
}

/**
 * Ensures every open bucket has at least 1 matching uncaught fish in the river,
 * all fish belong strictly to open buckets, and stream stays full at targetStreamSize.
 */
function reconcileRiverFish(
  currentFish: readonly SwimmingFish[],
  buckets: readonly (DockBucket | null)[],
  posMap: Map<string, number>,
  pendingGolden: { current: boolean },
  initialFill = false,
): SwimmingFish[] {
  const openBuckets = buckets.filter(
    (b): b is DockBucket => b !== null && b.state !== 'popping' && b.caughtWords.length < BUCKET_CAPACITY,
  );
  if (openBuckets.length === 0) {
    return [];
  }

  const openBucketByLetter = new Map<LetterId, DockBucket>(
    openBuckets.map((b) => [b.letter, b]),
  );

  // Keep only fish belonging to still-open buckets whose word hasn't been caught yet
  const kept: SwimmingFish[] = [];
  const usedWordIds = new Set<string>();
  for (const fish of currentFish) {
    const bucket = openBucketByLetter.get(fish.spec.letter);
    if (!bucket) continue;
    const alreadyCaught = bucket.caughtWords.some((w) => w.id === fish.spec.id);
    if (alreadyCaught || usedWordIds.has(fish.spec.id)) continue;
    usedWordIds.add(fish.spec.id);
    kept.push(fish);
  }

  const pickUncaughtWord = (bucket: DockBucket): LetterWordSpec | null => {
    const caughtSet = new Set(bucket.caughtWords.map((w) => w.id));
    const station = getStationSpec(bucket.letter);
    const available = station.words.filter(
      (w) => !caughtSet.has(w.id) && !usedWordIds.has(w.id),
    );
    if (available.length > 0) {
      return available[pickRandomInt(available.length)];
    }
    const fallback = station.words.filter((w) => !caughtSet.has(w.id));
    return fallback.length > 0 ? fallback[pickRandomInt(fallback.length)] : null;
  };

  const spawnFishForBucket = (bucket: DockBucket, forceEdge: boolean): SwimmingFish | null => {
    const spec = pickUncaughtWord(bucket);
    if (!spec) return null;
    usedWordIds.add(spec.id);

    // Pick least populated lane, breaking ties by clearest entry edge
    const laneCounts: [number, number, number] = [0, 0, 0];
    for (const f of kept) {
      laneCounts[f.lane] += 1;
    }
    const minCount = Math.min(...laneCounts);
    const candidateLanes = ([0, 1, 2] as const).filter((l) => laneCounts[l] === minCount);
    const getEntryClearance = (l: 0 | 1 | 2): number => {
      const dir = LANE_DIRECTIONS[l];
      const positions = kept
        .filter((f) => f.lane === l)
        .map((f) => posMap.get(f.uid) ?? f.spawnXPct);
      if (positions.length === 0) return 200;
      return dir === 1 ? Math.min(...positions) : 100 - Math.max(...positions);
    };
    const lane =
      [...candidateLanes].sort((a, b) => getEntryClearance(b) - getEntryClearance(a))[0] ?? 0;

    const isGolden = pendingGolden.current && !kept.some((f) => f.isGolden);
    if (isGolden) {
      pendingGolden.current = false;
    }

    const uid = createFishUid(bucket.letter, spec.id);
    const spawnXPct = pickBestSpawnPosition(lane, kept, posMap, forceEdge);
    posMap.set(uid, spawnXPct);

    return {
      uid,
      spec,
      lane,
      direction: LANE_DIRECTIONS[lane],
      theme: pickThemeNotMatching(),
      isGolden,
      spawnXPct,
    };
  };

  // 1. Guarantee every open bucket has >= 1 matching fish in the stream
  for (const bucket of openBuckets) {
    const hasMatch = kept.some((f) => f.spec.letter === bucket.letter);
    if (!hasMatch) {
      const created = spawnFishForBucket(bucket, !initialFill && kept.length >= 2);
      if (created) {
        kept.push(created);
      }
    }
  }

  // 2. Top up to desired stream density
  const desired = targetStreamSize(openBuckets);
  let safety = 0;
  while (kept.length < desired && safety < 12) {
    safety += 1;
    // Prefer buckets with fewer fish currently swimming
    const sortedByFishCount = [...openBuckets].sort((a, b) => {
      const countA = kept.filter((f) => f.spec.letter === a.letter).length;
      const countB = kept.filter((f) => f.spec.letter === b.letter).length;
      return countA - countB;
    });
    let addedAny = false;
    for (const candidateBucket of sortedByFishCount) {
      const created = spawnFishForBucket(candidateBucket, !initialFill);
      if (created) {
        kept.push(created);
        addedAny = true;
        break;
      }
    }
    if (!addedAny) break;
  }

  return kept;
}

function loadSavedRiverState(gameKey: number): SavedRiverState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(ACTIVE_RIVER_STORAGE_KEY);
    if (!raw || raw.length > 32768) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const s = parsed as Partial<SavedRiverState>;
    if (
      s.gameKey !== gameKey ||
      !Array.isArray(s.letterQueue) ||
      s.letterQueue.length === 0 ||
      s.letterQueue.length > MAX_DOCK_BUCKETS ||
      !s.letterQueue.every((l) => isValidLetterId(l)) ||
      typeof s.nextQueueIdx !== 'number' ||
      !Number.isInteger(s.nextQueueIdx) ||
      s.nextQueueIdx < 0 ||
      s.nextQueueIdx > s.letterQueue.length ||
      !Array.isArray(s.slots) ||
      s.slots.length === 0 ||
      s.slots.length > 3 ||
      !Array.isArray(s.completedLetters) ||
      s.completedLetters.length > 26 ||
      !s.completedLetters.every((l) => isValidLetterId(l)) ||
      typeof s.totalScore !== 'number' ||
      s.totalScore < 0 ||
      typeof s.streak !== 'number' ||
      s.streak < 0 ||
      typeof s.bestStreak !== 'number' ||
      s.bestStreak < 0 ||
      typeof s.goldenCaught !== 'number' ||
      s.goldenCaught < 0 ||
      typeof s.mistakeCount !== 'number' ||
      s.mistakeCount < 0 ||
      typeof s.finished !== 'boolean'
    ) {
      return null;
    }

    for (const slot of s.slots) {
      if (slot === null) continue;
      if (typeof slot !== 'object' || !isValidLetterId(slot.letter)) return null;
      if (!Array.isArray(slot.caughtWordIds) || slot.caughtWordIds.length > BUCKET_CAPACITY) {
        return null;
      }
      const validIds = new Set<string>(getStationSpec(slot.letter).words.map((w) => w.id));
      if (!slot.caughtWordIds.every((id) => typeof id === 'string' && validIds.has(id))) {
        return null;
      }
    }

    return {
      gameKey,
      letterQueue: s.letterQueue,
      nextQueueIdx: s.nextQueueIdx,
      slots: s.slots,
      completedLetters: s.completedLetters,
      totalScore: s.totalScore,
      streak: s.streak,
      bestStreak: s.bestStreak,
      goldenCaught: s.goldenCaught,
      mistakeCount: s.mistakeCount,
      finished: s.finished,
    };
  } catch {
    return null;
  }
}

export function clearSavedLetterRiverGame(): void {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ACTIVE_RIVER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function LetterRiverBoard({
  gameKey,
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: LetterRiverBoardProps) {
  const [initialBoot] = useState(() => {
    const saved = loadSavedRiverState(gameKey);
    if (saved) {
      const hydratedBuckets: (DockBucket | null)[] = saved.slots.map((slot, idx) => {
        if (!slot) return null;
        const station = getStationSpec(slot.letter);
        const wordMap = new Map<string, LetterWordSpec>(
          station.words.map((w) => [w.id, w]),
        );
        const caughtWords = slot.caughtWordIds
          .map((id) => wordMap.get(id))
          .filter((w): w is LetterWordSpec => w !== undefined);
        return {
          slotIndex: idx as 0 | 1 | 2,
          letter: slot.letter,
          caughtWords,
          state: 'active',
        };
      });
      return { saved, buckets: hydratedBuckets };
    }

    const queue = buildInitialQueue(config, childProfile.id);
    const { buckets, nextQueueIdx } = buildInitialBuckets(queue);
    return {
      saved: {
        gameKey,
        letterQueue: queue,
        nextQueueIdx,
        slots: [],
        completedLetters: [],
        totalScore: 0,
        streak: 0,
        bestStreak: 0,
        goldenCaught: 0,
        mistakeCount: 0,
        finished: false,
      } satisfies SavedRiverState,
      buckets,
    };
  });

  const fishPosRef = useRef<Map<string, number>>(new Map());
  const pendingGoldenRef = useRef<boolean>(false);

  const [letterQueue, setLetterQueue] = useState<LetterId[]>(initialBoot.saved.letterQueue);
  const [nextQueueIdx, setNextQueueIdx] = useState<number>(initialBoot.saved.nextQueueIdx);
  const [buckets, setBuckets] = useState<(DockBucket | null)[]>(initialBoot.buckets);
  const [completedLetters, setCompletedLetters] = useState<LetterId[]>(
    initialBoot.saved.completedLetters,
  );
  const [fishList, setFishList] = useState<SwimmingFish[]>(() =>
    initialBoot.saved.finished
      ? []
      : reconcileRiverFish([], initialBoot.buckets, fishPosRef.current, pendingGoldenRef, true),
  );
  const [totalScore, setTotalScore] = useState<number>(initialBoot.saved.totalScore);
  const [streak, setStreak] = useState<number>(initialBoot.saved.streak);
  const [bestStreak, setBestStreak] = useState<number>(initialBoot.saved.bestStreak);
  const [goldenCaught, setGoldenCaught] = useState<number>(initialBoot.saved.goldenCaught);
  const [mistakeCount, setMistakeCount] = useState<number>(initialBoot.saved.mistakeCount);
  const [finished, setFinished] = useState<boolean>(initialBoot.saved.finished);
  const [masteredCount, setMasteredCount] = useState<number>(() => loadRiverMasteredLetters().length);

  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;
  const journeyCompletedFiredRef = useRef(false);
  const isJourneyMode = Boolean(journeyContext);

  useEffect(() => {
    if (!isJourneyMode || !finished || journeyCompletedFiredRef.current) return;
    const timer = window.setTimeout(() => {
      if (journeyCompletedFiredRef.current) return;
      journeyCompletedFiredRef.current = true;
      journeyOnCompleteRef.current?.();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [finished, isJourneyMode]);

  // Silently preload MP3 clips for the active dock buckets plus the next 2 queued letters
  useEffect(() => {
    const activeLetters = buckets
      .filter((b): b is DockBucket => b !== null)
      .map((b) => b.letter);
    const lookaheadLetters = letterQueue.slice(nextQueueIdx, nextQueueIdx + 2);
    const targetLetters = Array.from(new Set([...activeLetters, ...lookaheadLetters]));
    if (targetLetters.length === 0) return;
    preloadLettersAudio(targetLetters);
    preloadLetterMistakeAudio(targetLetters);
    preloadWordsAudio(targetLetters.flatMap((letter) => getStationSpec(letter).words.map((w) => w.id)));
  }, [buckets, letterQueue, nextQueueIdx]);

  const [hookedFishId, setHookedFishId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragFishState | null>(null);
  const [bucketFeedback, setBucketFeedback] = useState<BucketFeedback | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win' | null>(null);
  const [bannerTone, setBannerTone] = useState<BannerTone>('neutral');
  const [bannerText, setBannerText] = useState<string>(
    'Scoop a fish and drop it in the matching letter bucket!',
  );
  const [explainingWrong, setExplainingWrong] = useState<boolean>(false);
  const [thinkAgainHint, setThinkAgainHint] = useState<string | null>(null);

  const riverLanesRef = useRef<HTMLDivElement | null>(null);
  const riverWidthRef = useRef<number>(680);
  const fishDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bucketRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null]);
  const timersRef = useRef<number[]>([]);
  const dragFishIdRef = useRef<string | null>(null);
  const hookedFishIdRef = useRef<string | null>(null);
  const fishListRef = useRef<SwimmingFish[]>(fishList);
  const bucketsRef = useRef<(DockBucket | null)[]>(buckets);
  const nextQueueIdxRef = useRef<number>(nextQueueIdx);

  dragFishIdRef.current = dragState?.isDragging ? dragState.fish.uid : null;
  hookedFishIdRef.current = hookedFishId;
  fishListRef.current = fishList;
  bucketsRef.current = buckets;
  nextQueueIdxRef.current = nextQueueIdx;

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      stopRiverSpeech();
    };
  }, [clearTimers]);

  useEffect(() => {
    onGameActiveChange?.(!finished && totalScore > 0);
  }, [finished, onGameActiveChange, totalScore]);

  // Persist active river game state in sessionStorage
  useEffect(() => {
    try {
      const payload: SavedRiverState = {
        gameKey,
        letterQueue,
        nextQueueIdx,
        slots: buckets.map((b) =>
          b ? { letter: b.letter, caughtWordIds: b.caughtWords.map((w) => w.id) } : null,
        ),
        completedLetters,
        totalScore,
        streak,
        bestStreak,
        goldenCaught,
        mistakeCount,
        finished,
      };
      window.sessionStorage.setItem(ACTIVE_RIVER_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }, [
    bestStreak,
    buckets,
    completedLetters,
    finished,
    gameKey,
    goldenCaught,
    letterQueue,
    mistakeCount,
    nextQueueIdx,
    streak,
    totalScore,
  ]);

  const applyFishTransform = useCallback((fish: SwimmingFish, xPct: number, width: number) => {
    const node = fishDomRefs.current.get(fish.uid);
    if (!node) return;
    const xPx = (xPct / 100) * Math.max(width, 320);
    node.style.transform = `translate3d(${xPx}px, 0, 0)`;
  }, []);

  // Measure river container width and resync fish positions on resize or wave changes
  useEffect(() => {
    const el = riverLanesRef.current;
    if (!el) return;

    const syncAllPositions = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        riverWidthRef.current = width;
      }
      for (const fish of fishListRef.current) {
        const xPct = fishPosRef.current.get(fish.uid) ?? fish.spawnXPct;
        applyFishTransform(fish, xPct, riverWidthRef.current);
      }
    };

    syncAllPositions();

    const observer = new ResizeObserver(() => {
      syncAllPositions();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyFishTransform, fishList]);

  // Update swimming fish transforms at 60fps via shared Pebble game loop
  useGameLoop(
    (dtSec) => {
      const width = riverWidthRef.current;
      for (const fish of fishListRef.current) {
        const isPaused =
          dragFishIdRef.current === fish.uid || hookedFishIdRef.current === fish.uid;
        let xPct = fishPosRef.current.get(fish.uid) ?? fish.spawnXPct;

        if (!isPaused) {
          const speed = LANE_SPEEDS_PCT_PER_SEC[fish.lane];
          xPct += fish.direction * speed * dtSec;
          if (fish.direction === 1 && xPct > 112) {
            const others = fishListRef.current
              .filter((other) => other.uid !== fish.uid && other.lane === fish.lane)
              .map((other) => fishPosRef.current.get(other.uid) ?? other.spawnXPct);
            const leftMost = others.length > 0 ? Math.min(...others) : 100;
            xPct = leftMost < 24 ? Math.min(-12, leftMost - 34) : -12;
          } else if (fish.direction === -1 && xPct < -12) {
            const others = fishListRef.current
              .filter((other) => other.uid !== fish.uid && other.lane === fish.lane)
              .map((other) => fishPosRef.current.get(other.uid) ?? other.spawnXPct);
            const rightMost = others.length > 0 ? Math.max(...others) : 0;
            xPct = rightMost > 76 ? Math.max(112, rightMost + 34) : 112;
          }
          fishPosRef.current.set(fish.uid, xPct);
        }

        applyFishTransform(fish, xPct, width);
      }
    },
    { enabled: !finished },
  );

  const hitTestBucket = useCallback(
    (clientX: number, clientY: number): number | null => {
      const pad = 16;
      for (let i = 0; i < buckets.length; i += 1) {
        const bucket = buckets[i];
        if (!bucket || bucket.state === 'popping') continue;
        const el = bucketRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left - pad &&
          clientX <= rect.right + pad &&
          clientY >= rect.top - pad &&
          clientY <= rect.bottom + pad
        ) {
          return i;
        }
      }
      return null;
    },
    [buckets],
  );

  const handleDropFishIntoBucket = useCallback(
    (fish: SwimmingFish, slotIndex: number) => {
      if (finished || explainingWrong || thinkAgainHint !== null) return;
      const targetBucket = buckets[slotIndex];
      if (!targetBucket || targetBucket.state === 'popping') return;

      setHookedFishId(null);
      setDragState(null);

      const station = getStationSpec(fish.spec.letter);

      /* ==============================================================
         WRONG BUCKET: Calm, understated, zero splash, helpful phonics cue
         ============================================================== */
      if (fish.spec.letter !== targetBucket.letter) {
        setStreak(0);
        setMistakeCount((prev) => prev + 1);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'letter-river',
          conceptId: `letter:${fish.spec.letter}`,
          conceptLabel: `Letter ${fish.spec.letter}`,
          skillType: 'initial_letter_sound',
          correct: false,
        });
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'letter-river',
          conceptId: `word:${fish.spec.id}`,
          conceptLabel: fish.spec.word,
          skillType: 'initial_letter_sound',
          correct: false,
        });
        playGentleWrongBucketSound(soundEnabled);

        const correctBucketOnDock = buckets.some(
          (b) => b && b.state !== 'popping' && b.letter === fish.spec.letter,
        );
        const hintLine = correctBucketOnDock
          ? `${fish.spec.word} starts with "${station.phonicsHint}" — try bucket ${fish.spec.letter}${fish.spec.letter.toLowerCase()}!`
          : `${fish.spec.word} starts with ${fish.spec.letter} ("${station.phonicsHint}")!`;

        const boardExplainLine = `Okay, hey — ${fish.spec.word} starts with ${fish.spec.letter}, not ${targetBucket.letter}!`;
        setBannerTone('calm-hint');
        setBannerText(boardExplainLine);
        setExplainingWrong(true);

        const fbKey = Date.now();
        setBucketFeedback({ slotIndex, kind: 'gentle-nope', key: fbKey });

        const startedAt = Date.now();
        let opened = false;
        const openPauseDialog = () => {
          if (opened) return;
          opened = true;
          setBucketFeedback((prev) => (prev && prev.key === fbKey ? null : prev));
          setExplainingWrong(false);
          setThinkAgainHint(hintLine);
        };

        if (soundEnabled) {
          playWrongLetterExplanation(
            fish.spec.id,
            fish.spec.word,
            fish.spec.letter,
            targetBucket.letter,
            true,
            () => {
              const elapsed = Date.now() - startedAt;
              const remainingBeat = Math.max(320, 2200 - elapsed);
              scheduleTimer(openPauseDialog, remainingBeat);
            },
          );
          scheduleTimer(openPauseDialog, 4800);
        } else {
          scheduleTimer(openPauseDialog, 2200);
        }
        return;
      }

      /* ==============================================================
         CORRECT BUCKET: REALLY, REALLY PLAYFUL!
         ============================================================== */
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));

      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'letter-river',
        conceptId: `letter:${targetBucket.letter}`,
        conceptLabel: `Letter ${targetBucket.letter}`,
        skillType: 'initial_letter_sound',
        correct: true,
      });
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'letter-river',
        conceptId: `word:${fish.spec.id}`,
        conceptLabel: fish.spec.word,
        skillType: 'initial_letter_sound',
        correct: true,
      });
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'letter-river',
        conceptId: `word:${fish.spec.id}`,
        conceptLabel: fish.spec.word,
        skillType: 'picture_recognition',
        correct: true,
      });

      if (nextStreak % GOLDEN_STREAK_STEP === 0) {
        pendingGoldenRef.current = true;
      }

      // Compute caught words for this catch (Golden Fish fills 2 slots when room allows!)
      const existingCaughtIds = new Set(targetBucket.caughtWords.map((w) => w.id));
      const newCaught: LetterWordSpec[] = [];
      if (!existingCaughtIds.has(fish.spec.id)) {
        newCaught.push(fish.spec);
        existingCaughtIds.add(fish.spec.id);
      }

      let wasDoubleGoldenFill = false;
      if (fish.isGolden && targetBucket.caughtWords.length + newCaught.length < BUCKET_CAPACITY) {
        const bonusPool = station.words.filter((w) => !existingCaughtIds.has(w.id));
        if (bonusPool.length > 0) {
          const bonusWord = bonusPool[pickRandomInt(bonusPool.length)];
          newCaught.push(bonusWord);
          wasDoubleGoldenFill = true;
        }
      }

      const nextCaughtWords = [...targetBucket.caughtWords, ...newCaught].slice(0, BUCKET_CAPACITY);
      const isNowFull = nextCaughtWords.length >= BUCKET_CAPACITY;
      const fillStep = Math.min(3, Math.max(1, nextCaughtWords.length)) as 1 | 2 | 3;

      const catchPoints = fish.isGolden ? 3 : 1;
      const bucketFullBonus = isNowFull ? 3 : 0;
      setTotalScore((prev) => prev + catchPoints + bucketFullBonus);
      if (fish.isGolden) {
        setGoldenCaught((prev) => prev + 1);
      }

      const fbKey = Date.now() + pickRandomInt(1000);
      setBucketFeedback({
        slotIndex,
        kind: isNowFull ? 'bucket-full' : 'splash',
        key: fbKey,
        wordLabel: fish.spec.word,
        wordLetter: fish.spec.letter,
        wordSpec: fish.spec,
        isGolden: fish.isGolden,
      });

      if (!isNowFull) {
        // Playful catch splash + AI letter confirmation (TTS only if MP3 missing)
        playCorrectCatchSound(fillStep, fish.isGolden, soundEnabled);
        speakRiverLetter(
          targetBucket.letter,
          `Letter ${targetBucket.letter}`,
          soundEnabled,
        );
        setBannerTone(fish.isGolden ? 'golden' : 'mint');
        setBannerText(
          fish.isGolden
            ? wasDoubleGoldenFill
              ? `GOLDEN SPLASH! ${fish.spec.word} (${targetBucket.letter}) fills 2 slots! +3 PTS`
              : `GOLDEN CATCH! ${fish.spec.word} starts with ${targetBucket.letter}! +3 PTS`
            : `SPLASH! ${fish.spec.word} starts with ${targetBucket.letter} ("${station.phonicsHint}")! (${nextCaughtWords.length}/3)`,
        );

        const nextBuckets = buckets.map((b, idx) =>
          idx === slotIndex && b ? { ...b, caughtWords: nextCaughtWords } : b,
        );
        bucketsRef.current = nextBuckets;
        setBuckets(nextBuckets);

        const remainingFish = fishList.filter((f) => f.uid !== fish.uid);
        fishPosRef.current.delete(fish.uid);
        const reconciled = reconcileRiverFish(
          remainingFish,
          nextBuckets,
          fishPosRef.current,
          pendingGoldenRef,
        );
        fishListRef.current = reconciled;
        setFishList(reconciled);

        scheduleTimer(() => {
          setBucketFeedback((prev) => (prev && prev.key === fbKey ? null : prev));
        }, 980);
        return;
      }

      /* ==============================================================
         BUCKET FULL (3/3): MEGA POP + CONFETTI + NEW LETTER SLIDE-IN!
         ============================================================== */
      const updatedCompleted = completedLetters.includes(targetBucket.letter)
        ? completedLetters
        : [...completedLetters, targetBucket.letter];
      setCompletedLetters(updatedCompleted);

      const updatedMastered = saveRiverMasteredLetter(targetBucket.letter);
      setMasteredCount(updatedMastered.length);

      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'letter-river',
        mode: targetBucket.letter,
        totalAttempts: 3,
        correctAttempts: 3,
        mistakes: 0,
        flawless: streak >= 3,
        conceptsTested: [`letter:${targetBucket.letter}`, `word:${fish.spec.id}`],
      });

      stopRiverSpeech();
      playCorrectCatchSound(3, fish.isGolden, soundEnabled);
      playBucketFullSound(soundEnabled);

      setConfettiMode('match');
      setConfettiKey((k) => k + 1);
      setBannerTone(fish.isGolden ? 'golden' : 'mint');
      setBannerText(
        `WHOOSH! Bucket ${targetBucket.letter}${targetBucket.letter.toLowerCase()} is full! +${
          catchPoints + bucketFullBonus
        } PTS!`,
      );

      // Put bucket into 'popping' celebration state and purge any swimming fish of this letter
      const poppingBuckets = buckets.map((b, idx) =>
        idx === slotIndex && b
          ? { ...b, caughtWords: nextCaughtWords, state: 'popping' as const }
          : b,
      );
      bucketsRef.current = poppingBuckets;
      setBuckets(poppingBuckets);

      const cleanedFish = fishList.filter((f) => f.spec.letter !== targetBucket.letter);
      for (const f of fishList) {
        if (f.spec.letter === targetBucket.letter) {
          fishPosRef.current.delete(f.uid);
        }
      }
      fishListRef.current = cleanedFish;
      setFishList(cleanedFish);

      scheduleTimer(() => {
        setBucketFeedback((prev) => (prev && prev.key === fbKey ? null : prev));

        // Keep only the initial dock buckets: completed slot becomes 'All Caught!' with zero new bucket replacement.
        const updatedBuckets = bucketsRef.current.map((b, idx) => (idx === slotIndex ? null : b));
        bucketsRef.current = updatedBuckets;
        setBuckets(updatedBuckets);

        const remainingActive = updatedBuckets.filter((b): b is DockBucket => b !== null);
        if (remainingActive.length === 0) {
          setFinished(true);
          setConfettiMode('win');
          setConfettiKey((k) => k + 1);
          setBannerTone('mint');
          setBannerText(`Amazing fishing, ${childProfile.name}! All river buckets caught!`);
          stopRiverSpeech();
          playRiverCompleteSound(soundEnabled);
          fishListRef.current = [];
          setFishList([]);
        } else {
          setBannerTone('neutral');
          setBannerText(
            remainingActive.length === 1
              ? `1 bucket left on the dock (${remainingActive[0].letter}${remainingActive[0].letter.toLowerCase()}) — you've got this!`
              : `${remainingActive.length} buckets left on the dock — keep fishing!`,
          );
          const replenished = reconcileRiverFish(
            fishListRef.current,
            updatedBuckets,
            fishPosRef.current,
            pendingGoldenRef,
          );
          fishListRef.current = replenished;
          setFishList(replenished);
        }
      }, 1050);
    },
    [
      buckets,
      childProfile.name,
      completedLetters,
      explainingWrong,
      finished,
      fishList,
      letterQueue,
      scheduleTimer,
      soundEnabled,
      streak,
      thinkAgainHint,
    ],
  );

  const handleFishPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    fish: SwimmingFish,
  ) => {
    if (finished || explainingWrong || thinkAgainHint !== null) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    playFishPlopSound(soundEnabled);
    speakRiverWord(fish.spec.id, fish.spec.word, soundEnabled);

    setDragState({
      fish,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoveredSlot: hitTestBucket(e.clientX, e.clientY),
    });
  };

  const handleFishPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const movedEnough = dragState.isDragging || Math.hypot(dx, dy) > 10;
    const hoveredSlot = movedEnough ? hitTestBucket(e.clientX, e.clientY) : null;

    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: movedEnough,
      hoveredSlot,
    });
  };

  const handleFishPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const active = dragState;
    setDragState(null);

    if (active.isDragging) {
      const hitSlot = hitTestBucket(e.clientX, e.clientY);
      if (hitSlot !== null) {
        handleDropFishIntoBucket(active.fish, hitSlot);
      }
      return;
    }

    // Was a clean tap -> hook/unhook fish so child can tap any bucket
    setHookedFishId((prev) => {
      if (prev === active.fish.uid) {
        setBannerTone('neutral');
        setBannerText('Scoop a fish and drop it in the matching letter bucket!');
        return null;
      }
      setBannerTone('neutral');
      setBannerText(`Tap the matching letter bucket for "${active.fish.spec.word}"!`);
      return active.fish.uid;
    });
  };

  const handleFishPointerCancel = () => {
    setDragState(null);
  };

  const handleBucketClick = (slotIndex: number) => {
    if (finished) return;
    const targetBucket = buckets[slotIndex];
    if (!targetBucket || targetBucket.state === 'popping') return;

    if (hookedFishId) {
      const hooked = fishList.find((f) => f.uid === hookedFishId);
      if (hooked) {
        handleDropFishIntoBucket(hooked, slotIndex);
        return;
      }
      setHookedFishId(null);
    }

    // No fish hooked: speak the bucket's letter via AI MP3 (TTS only as fallback)
    const station = getStationSpec(targetBucket.letter);
    playFishPlopSound(soundEnabled);
    speakRiverLetter(targetBucket.letter, `Letter ${targetBucket.letter}`, soundEnabled);
    setBannerTone('neutral');
    setBannerText(
      `Bucket ${targetBucket.letter}${targetBucket.letter.toLowerCase()} catches "${station.phonicsHint}" words! Grab a fish!`,
    );
  };

  const handleRestartRiver = () => {
    clearTimers();
    stopRiverSpeech();
    clearSavedLetterRiverGame();
    setExplainingWrong(false);
    setThinkAgainHint(null);

    fishPosRef.current.clear();
    pendingGoldenRef.current = false;

    const freshQueue = buildInitialQueue(config, childProfile.id);
    const { buckets: freshBuckets, nextQueueIdx: freshNextIdx } = buildInitialBuckets(freshQueue);
    const freshFish = reconcileRiverFish(
      [],
      freshBuckets,
      fishPosRef.current,
      pendingGoldenRef,
      true,
    );

    nextQueueIdxRef.current = freshNextIdx;
    bucketsRef.current = freshBuckets;
    fishListRef.current = freshFish;

    setLetterQueue(freshQueue);
    setNextQueueIdx(freshNextIdx);
    setBuckets(freshBuckets);
    setCompletedLetters([]);
    setFishList(freshFish);
    setTotalScore(0);
    setStreak(0);
    setBestStreak(0);
    setGoldenCaught(0);
    setMistakeCount(0);
    setFinished(false);
    setHookedFishId(null);
    setDragState(null);
    setBucketFeedback(null);
    setConfettiMode(null);
    setBannerTone('neutral');
    setBannerText('Scoop a fish and drop it in the matching letter bucket!');
  };

  // Compact sliding letter ribbon around progress
  const visibleLetterWindow = useMemo(() => {
    const completedSet = new Set<LetterId>(completedLetters);
    const activeSet = new Set<LetterId>(
      buckets.filter((b): b is DockBucket => b !== null).map((b) => b.letter),
    );
    const total = letterQueue.length;
    const windowSize = Math.min(8, total);
    const pivot = Math.min(total - 1, Math.max(0, completedLetters.length));
    let start = Math.max(0, pivot - 3);
    if (start + windowSize > total) {
      start = Math.max(0, total - windowSize);
    }
    return letterQueue.slice(start, start + windowSize).map((letter) => ({
      letter,
      isCompleted: completedSet.has(letter),
      isActive: activeSet.has(letter),
    }));
  }, [buckets, completedLetters, letterQueue]);

  const streakProgressInCycle = streak === 0 ? 0 : streak % GOLDEN_STREAK_STEP || GOLDEN_STREAK_STEP;
  const hookedFish = hookedFishId ? fishList.find((f) => f.uid === hookedFishId) ?? null : null;

  return (
    <div className="app-shell app-shell--board lr-board-shell">
      {confettiMode !== null && (
        <ConfettiBurst active={true} mode={confettiMode} burstKey={confettiKey} />
      )}

      {/* 1. Top Utility Bar */}
      <header className="top-bar lr-top-bar">
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>

          {journeyContext ? (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          ) : (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
            >
              Setup
            </button>
          )}
        </div>

        <div className="lr-top-pills">
          <span className="lr-progress-pill" aria-label="Completed letter buckets">
            <span className="lr-progress-pill__dot" aria-hidden="true" />
            Buckets: {completedLetters.length} / {letterQueue.length}
          </span>

          {/* 4-pebble streak meter for Golden River Fish (zero 4-point sparkle stars!) */}
          <div
            className={`lr-streak-pill ${streak >= GOLDEN_STREAK_STEP ? 'lr-streak-pill--hot' : ''}`}
            title="Catch 4 fish in a row for a Golden 2x Fish!"
            aria-label={`Streak ${streak}. ${streakProgressInCycle} of 4 toward Golden Fish`}
          >
            <span className="lr-streak-pill__label">Golden</span>
            <span className="lr-streak-dots" aria-hidden="true">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`lr-streak-dot ${
                    streak > 0 && step <= streakProgressInCycle ? 'lr-streak-dot--lit' : ''
                  }`}
                />
              ))}
            </span>
          </div>
        </div>

        <div className="top-bar__right">
          <GameHelpButton onClick={onRequestHelp} />
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--square icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Turn sound on'}
            title={soundEnabled ? 'Sound On' : 'Sound Muted'}
          >
            <AudioSpeakerIcon muted={!soundEnabled} size={17} />
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={handleRestartRiver}
          >
            Restart
          </button>
        </div>
      </header>

      {/* 2. Angler HUD & Letter Queue Progress */}
      <section className="lr-hud" aria-label="Angler score and letter progress">
        <div
          className={`lr-angler-card ${
            bannerTone === 'golden'
              ? 'lr-angler-card--gold'
              : bannerTone === 'mint'
                ? 'lr-angler-card--mint'
                : ''
          }`}
        >
          <div className="lr-angler-card__left">
            <img
              className="lr-angler-card__avatar"
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
            />
            <div className="lr-angler-card__meta">
              <span className="lr-angler-card__name">{childProfile.name}</span>
              <span className="lr-angler-card__role">
                {streak >= 2 ? `${streak} Catch Streak!` : `${masteredCount}/26 River Badges`}
              </span>
            </div>
          </div>

          <div
            className="lr-angler-card__pts"
            aria-label={`Buckets filled: ${completedLetters.length} of ${letterQueue.length}`}
          >
            <strong>
              {completedLetters.length}/{letterQueue.length}
            </strong>
            <span>BUCKETS</span>
          </div>
        </div>

        <div className="lr-queue-strip" aria-label="Letter bucket queue">
          {visibleLetterWindow.map((item) => (
            <span
              key={item.letter}
              className={`lr-queue-node ${
                item.isCompleted
                  ? 'lr-queue-node--done'
                  : item.isActive
                    ? 'lr-queue-node--active'
                    : ''
              }`}
              aria-label={
                item.isCompleted
                  ? `Letter ${item.letter} completed`
                  : item.isActive
                    ? `Letter ${item.letter} on dock`
                    : `Letter ${item.letter} upcoming`
              }
            >
              {item.isCompleted ? '✓' : item.letter}
            </span>
          ))}
        </div>
      </section>

      {/* 3. Fixed-Height Status / Celebration Banner */}
      <div
        className={`lr-banner lr-banner--${bannerTone}`}
        role="status"
        aria-live="polite"
      >
        {bannerText}
      </div>

      {/* 4. Sunlit River Stage (flex: 1, zero vertical overflow) */}
      <main className="lr-stage" aria-label="Letter River fishing stage">
        <section className="lr-river-box" aria-label="Swimming word fish stream">
          {/* Top Pebble Shore Bank */}
          <div className="lr-shore-bank" aria-hidden="true">
            <span className="lr-shore-pebble lr-shore-pebble--mint" />
            <span className="lr-shore-pebble lr-shore-pebble--coral" />
            <span className="lr-shore-pebble lr-shore-pebble--indigo" />
            <span className="lr-shore-pebble lr-shore-pebble--honey" />
            <span className="lr-shore-pebble lr-shore-pebble--mint" />
            <span className="lr-shore-pebble lr-shore-pebble--coral" />
          </div>

          {/* 3 Gentle Water Lanes */}
          <div ref={riverLanesRef} className="lr-river-lanes">
            {[0, 1, 2].map((laneIdx) => (
              <div key={laneIdx} className={`lr-water-lane lr-water-lane--${laneIdx}`} aria-hidden="true">
                <svg className="lr-wave-svg" viewBox="0 0 800 32" preserveAspectRatio="none">
                  <path
                    d="M0 16 Q50 6 100 16 T200 16 T300 16 T400 16 T500 16 T600 16 T700 16 T800 16"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            ))}

            {/* Swimming Fish */}
            {fishList.map((fish) => {
              const isDragged = dragState?.fish.uid === fish.uid && dragState.isDragging;
              const isHooked = hookedFishId === fish.uid;
              const laneTopPct = fish.lane === 0 ? 10 : fish.lane === 1 ? 40 : 70;

              return (
                <div
                  key={fish.uid}
                  ref={(el) => {
                    if (el) {
                      fishDomRefs.current.set(fish.uid, el);
                    } else {
                      fishDomRefs.current.delete(fish.uid);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Fish: ${fish.spec.word}${fish.isGolden ? ' (Golden Fish 2x)' : ''}. Grab or tap to sort into bucket ${fish.spec.letter}`}
                  data-fish-word={fish.spec.word}
                  data-fish-letter={fish.spec.letter}
                  data-fish-golden={fish.isGolden ? 'true' : 'false'}
                  className={`lr-fish-actor ${isDragged ? 'lr-fish-actor--hidden' : ''} ${
                    isHooked ? 'lr-fish-actor--hooked' : ''
                  }`}
                  style={{ top: `${laneTopPct}%` }}
                  onPointerDown={(e) => handleFishPointerDown(e, fish)}
                  onPointerMove={handleFishPointerMove}
                  onPointerUp={handleFishPointerUp}
                  onPointerCancel={handleFishPointerCancel}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      playFishPlopSound(soundEnabled);
                      speakRiverWord(fish.spec.id, fish.spec.word, soundEnabled);
                      setHookedFishId((prev) => (prev === fish.uid ? null : fish.uid));
                    }
                  }}
                >
                  <RiverFishSprite
                    fish={fish}
                    showWord={config.wordLabelMode === 'always'}
                    isHooked={isHooked}
                  />
                </div>
              );
            })}

            {/* Hooked Fish Floating Helper Indicator */}
            {hookedFish && !dragState?.isDragging && (
              <div className="lr-hooked-pill" role="status">
                <span>Hooked:</span>
                <strong>{hookedFish.spec.word}</strong>
                <span>— tap a bucket below!</span>
              </div>
            )}
          </div>
        </section>

        {/* 5. Wooden Fishing Dock & 1-3 Letter Buckets */}
        <section className="lr-dock" aria-label="Letter buckets dock">
          <div className="lr-dock-planks" aria-hidden="true" />
          <div
            className="lr-buckets-row"
            style={{ '--bucket-cols': Math.max(1, buckets.length) } as CSSProperties}
          >
            {buckets.map((bucket, idx) => {
              if (!bucket) {
                return (
                  <div key={`empty-${idx}`} className="lr-buoy-done" aria-label="Slot completed">
                    <span className="lr-buoy-done__check" aria-hidden="true">
                      ✓
                    </span>
                    <strong>All Caught!</strong>
                    <span>Finish the dock!</span>
                  </div>
                );
              }

              const station = getStationSpec(bucket.letter);
              const isDropTarget = dragState?.isDragging && dragState.hoveredSlot === idx;
              const isHookReady = Boolean(hookedFishId) && bucket.state !== 'popping';
              const isPopping = bucket.state === 'popping';
              const isEntering = bucket.state === 'entering';
              const activeFb = bucketFeedback?.slotIndex === idx ? bucketFeedback : null;
              const fillPct =
                bucket.caughtWords.length === 0
                  ? 0
                  : bucket.caughtWords.length === 1
                    ? 34
                    : bucket.caughtWords.length === 2
                      ? 68
                      : 100;

              return (
                <div key={`slot-${idx}-${bucket.letter}`} className="lr-bucket-slot">
                  {/* Playful SVG Splash & Word Reveal Pop above bucket on correct drop */}
                  {(activeFb?.kind === 'splash' || activeFb?.kind === 'bucket-full') && (
                    <>
                      <BucketSplashBurst
                        burstKey={activeFb.key}
                        isGolden={activeFb.isGolden}
                        isFull={activeFb.kind === 'bucket-full'}
                      />
                      {activeFb.wordLabel && activeFb.wordSpec && (
                        <div
                          key={`pop-${activeFb.key}`}
                          className={`lr-word-reveal-pop ${
                            activeFb.isGolden ? 'lr-word-reveal-pop--golden' : ''
                          }`}
                        >
                          <WordIllustration id={activeFb.wordSpec.id} size={26} />
                          <span>
                            <strong>{activeFb.wordLabel.slice(0, 1)}</strong>
                            {activeFb.wordLabel.slice(1)}!
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    ref={(el) => {
                      bucketRefs.current[idx] = el;
                    }}
                    type="button"
                    data-bucket-letter={bucket.letter}
                    data-bucket-slot={idx}
                    disabled={isPopping}
                    onClick={() => handleBucketClick(idx)}
                    aria-label={`Letter ${bucket.letter} bucket (${bucket.caughtWords.length} of 3 caught)`}
                    className={`lr-bucket ${isDropTarget ? 'lr-bucket--drop-target' : ''} ${
                      isHookReady ? 'lr-bucket--hook-ready' : ''
                    } ${isPopping ? 'lr-bucket--full-pop' : ''} ${
                      isEntering ? 'lr-bucket--entering' : ''
                    } ${activeFb?.kind === 'splash' ? 'lr-bucket--splash-bounce' : ''} ${
                      activeFb?.kind === 'gentle-nope' ? 'lr-bucket--gentle-nope' : ''
                    }`}
                    style={{ '--bucket-accent': station.accentColor } as CSSProperties}
                  >
                    {/* Wooden Bucket Rim */}
                    <div className="lr-bucket__rim">
                      <span className="lr-bucket__letter-badge">
                        <span className="lr-bucket__upper">{bucket.letter}</span>
                        <span className="lr-bucket__lower">{bucket.letter.toLowerCase()}</span>
                      </span>
                      <span className="lr-bucket__count">{bucket.caughtWords.length}/3</span>
                    </div>

                    {/* Bucket Body with Rising Water Level & 3 Caught-Word Slots */}
                    <div className="lr-bucket__body">
                      <div
                        className={`lr-bucket__water ${
                          isPopping ? 'lr-bucket__water--full' : ''
                        }`}
                        style={{ height: `${fillPct}%` }}
                        aria-hidden="true"
                      />

                      <div className="lr-bucket__slots">
                        {[0, 1, 2].map((slotIdx) => {
                          const caught = bucket.caughtWords[slotIdx];
                          if (!caught) {
                            return (
                              <div key={slotIdx} className="lr-caught-slot lr-caught-slot--empty">
                                <span aria-hidden="true">?</span>
                              </div>
                            );
                          }
                          return (
                            <div key={caught.id} className="lr-caught-slot lr-caught-slot--filled">
                              <WordIllustration id={caught.id} size={26} />
                              <span className="lr-caught-slot__word">
                                <strong>{caught.word.slice(0, 1)}</strong>
                                {caught.word.slice(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Floating Dragged Fish Following Pointer */}
      {dragState?.isDragging && (
        <div
          className={`lr-drag-ghost ${
            dragState.hoveredSlot !== null ? 'lr-drag-ghost--over' : ''
          }`}
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
          }}
          aria-hidden="true"
        >
          <RiverFishSprite
            fish={dragState.fish}
            showWord={config.wordLabelMode === 'always'}
            isHooked={true}
          />
        </div>
      )}

      {/* Master Angler Celebration Modal */}
      {finished && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lr-win-headline"
        >
          <div className="winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={46} />
              <div className="winner-avatars-row">
                <div
                  className="winner-avatar-halo"
                  style={{ '--winner-ring': childProfile.accentColor } as CSSProperties}
                >
                  <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
                </div>
              </div>
            </div>

            <h2 id="lr-win-headline">Master Angler, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You caught all {letterQueue.length}{' '}
              {letterQueue.length === 1 ? 'letter bucket' : 'letter buckets'}!{' '}
              {bestStreak > 0 ? `Best streak: ${bestStreak}` : ''}
              {goldenCaught > 0 ? ` • ${goldenCaught} Golden` : ''}
              {mistakeCount === 0 ? ' • Zero Mistakes!' : ''}
            </p>

            <div className="standings-list" aria-label="Fishing Trip Summary">
              <div className="standing-row standing-row--winner">
                <div className="standing-row__left">
                  <span className="standing-rank-pill">ANGLER</span>
                  <img
                    className="standing-row__avatar"
                    src={getAvatarSrc(childProfile.avatar)}
                    alt={childProfile.name}
                  />
                  <span className="standing-row__name">{childProfile.name}</span>
                </div>
                <div className="standing-row__pts">
                  <strong>
                    {completedLetters.length}/{letterQueue.length}
                  </strong>
                  <span>BUCKETS</span>
                </div>
              </div>
              <div className="standing-row">
                <div className="standing-row__left">
                  <span className="standing-rank-pill">A–Z</span>
                  <span className="standing-row__name">River Badges Mastered</span>
                </div>
                <div className="standing-row__pts">
                  <strong>{masteredCount}</strong>
                  <span>OF 26</span>
                </div>
              </div>
            </div>

            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleRestartRiver}
              >
                Fish Again
              </button>
              <div className="winner-actions__row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onChangeSetup}
                >
                  Change Letters
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onBackToHub}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ThinkAgainOverlay
        open={thinkAgainHint !== null}
        hint={thinkAgainHint ?? undefined}
        soundEnabled={soundEnabled}
        onReady={() => setThinkAgainHint(null)}
        onStartAgain={handleRestartRiver}
      />
    </div>
  );
}

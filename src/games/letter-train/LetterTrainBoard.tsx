import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  ALL_LETTERS,
  buildPlatformCards,
  getStationSpec,
  isValidLetterId,
  loadMasteredLetters,
  loadPerfectLetters,
  saveMasteredLetter,
  savePerfectLetter,
  shuffleArray,
  type LetterId,
  type PlatformCardItem,
} from './letterData';
import type { LetterTrainConfig } from './LetterTrainSetup';
import {
  playCalmWrongHintSound,
  playCardPickupSound,
  playCorrectSeatSound,
  playPerfectApplauseAndTrainSound,
  playTrainArrivalSound,
  playTrainDepartureSound,
  playTripCompleteSound,
  speakPhrase,
  stopTrainSpeech,
} from './trainSounds';
import { WordIllustration } from './WordIllustration';

interface LetterTrainBoardProps {
  gameKey: number;
  config: LetterTrainConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange?: (active: boolean) => void;
}

type CarPhase = 'arriving' | 'idle' | 'departing-normal' | 'departing-perfect' | 'finished';

type BannerTone = 'neutral' | 'mint' | 'gold' | 'muted';

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
 * Playful animated clapping hands illustration (strictly circular clap waves, zero 4-point stars).
 */
function ClappingHandsBadge() {
  return (
    <span className="lt-clap-icon" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        {/* Circular sound-wave arcs */}
        <path
          d="M11 8 Q20 3 29 8"
          stroke="#F2B84B"
          strokeWidth="3"
          strokeLinecap="round"
          className="lt-clap-wave"
        />
        <circle cx="8" cy="14" r="2.2" fill="#3BA99C" />
        <circle cx="32" cy="14" r="2.2" fill="#F27A5E" />
        {/* Left clapping palm */}
        <g className="lt-clap-hand-left">
          <rect
            x="9"
            y="15"
            width="12"
            height="18"
            rx="6"
            transform="rotate(-16 15 24)"
            fill="#F5B982"
            stroke="#8C4A27"
            strokeWidth="2"
          />
        </g>
        {/* Right clapping palm */}
        <g className="lt-clap-hand-right">
          <rect
            x="19"
            y="15"
            width="12"
            height="18"
            rx="6"
            transform="rotate(16 25 24)"
            fill="#FAD0A6"
            stroke="#8C4A27"
            strokeWidth="2"
          />
        </g>
      </svg>
    </span>
  );
}

const ACTIVE_TRAIN_STORAGE_KEY = 'pebble.letter-train.active.v2';

const PERFECT_CHEERS = [
  'CLAP! CLAP! ZERO MISTAKES! +2 BONUS PTS!',
  'BRAVO, SUPER CONDUCTOR! +2 GOLDEN BONUS!',
  'WOOHOO! 3 IN A ROW! EVERYBODY CLAP!',
  'GOLDEN EXPRESS UNLOCKED! +2 BONUS PTS!',
] as const;

interface SavedTrainState {
  gameKey: number;
  stationQueue: LetterId[];
  stationIdx: number;
  platformCards: PlatformCardItem[];
  loadedUids: string[];
  triedWrongUids: Record<string, true>;
  mistakes: number;
  totalScore: number;
  carsCleared: number;
  perfectCarsCount: number;
  perfectStreak: number;
  perfectStationIndices: Record<number, true>;
  finished: boolean;
}

function isValidPlatformCard(value: unknown): value is PlatformCardItem {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<PlatformCardItem>;
  if (typeof c.uid !== 'string' || c.uid.length > 80 || typeof c.isTarget !== 'boolean') {
    return false;
  }
  if (typeof c.spec !== 'object' || c.spec === null) return false;
  const s = c.spec as Partial<PlatformCardItem['spec']>;
  return (
    typeof s.id === 'string' &&
    typeof s.word === 'string' &&
    s.word.length <= 32 &&
    isValidLetterId(s.letter) &&
    typeof s.tintBg === 'string' &&
    s.tintBg.length <= 16
  );
}

function loadSavedTrainState(gameKey: number): SavedTrainState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(ACTIVE_TRAIN_STORAGE_KEY);
    if (!raw || raw.length > 32768) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const s = parsed as Partial<SavedTrainState>;
    if (
      s.gameKey !== gameKey ||
      !Array.isArray(s.stationQueue) ||
      s.stationQueue.length === 0 ||
      s.stationQueue.length > 26 ||
      !s.stationQueue.every((l) => isValidLetterId(l)) ||
      typeof s.stationIdx !== 'number' ||
      !Number.isInteger(s.stationIdx) ||
      s.stationIdx < 0 ||
      s.stationIdx >= s.stationQueue.length ||
      !Array.isArray(s.platformCards) ||
      s.platformCards.length !== 6 ||
      !s.platformCards.every((c) => isValidPlatformCard(c)) ||
      !Array.isArray(s.loadedUids) ||
      s.loadedUids.length > 3 ||
      !s.loadedUids.every((u) => typeof u === 'string' && u.length <= 80) ||
      typeof s.triedWrongUids !== 'object' ||
      s.triedWrongUids === null ||
      typeof s.mistakes !== 'number' ||
      s.mistakes < 0 ||
      typeof s.totalScore !== 'number' ||
      s.totalScore < 0 ||
      typeof s.carsCleared !== 'number' ||
      s.carsCleared < 0 ||
      typeof s.perfectCarsCount !== 'number' ||
      s.perfectCarsCount < 0 ||
      typeof s.perfectStreak !== 'number' ||
      s.perfectStreak < 0 ||
      typeof s.perfectStationIndices !== 'object' ||
      s.perfectStationIndices === null ||
      typeof s.finished !== 'boolean'
    ) {
      return null;
    }
    return {
      gameKey,
      stationQueue: s.stationQueue,
      stationIdx: s.stationIdx,
      platformCards: s.platformCards,
      loadedUids: s.loadedUids,
      triedWrongUids: s.triedWrongUids,
      mistakes: s.mistakes,
      totalScore: s.totalScore,
      carsCleared: s.carsCleared,
      perfectCarsCount: s.perfectCarsCount,
      perfectStreak: s.perfectStreak,
      perfectStationIndices: s.perfectStationIndices,
      finished: s.finished,
    };
  } catch {
    return null;
  }
}

export function clearSavedLetterTrainGame(): void {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ACTIVE_TRAIN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

interface DragState {
  card: PlatformCardItem;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  overDropZone: boolean;
}

function buildInitialQueue(config: LetterTrainConfig): LetterId[] {
  const base =
    config.selectedLetters.length > 0
      ? ALL_LETTERS.filter((l) => config.selectedLetters.includes(l))
      : [...ALL_LETTERS];
  return config.orderMode === 'shuffle' ? shuffleArray(base) : base;
}

export function LetterTrainBoard({
  gameKey,
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onGameActiveChange,
}: LetterTrainBoardProps) {
  const [saved] = useState<SavedTrainState | null>(() => loadSavedTrainState(gameKey));

  const [stationQueue, setStationQueue] = useState<LetterId[]>(
    () => saved?.stationQueue ?? buildInitialQueue(config),
  );
  const [stationIdx, setStationIdx] = useState<number>(() => saved?.stationIdx ?? 0);
  const currentLetter: LetterId = stationQueue[stationIdx] ?? stationQueue[0] ?? 'A';
  const stationSpec = useMemo(() => getStationSpec(currentLetter), [currentLetter]);

  const [platformCards, setPlatformCards] = useState<PlatformCardItem[]>(
    () => saved?.platformCards ?? buildPlatformCards(currentLetter),
  );
  const [loadedUids, setLoadedUids] = useState<string[]>(() => saved?.loadedUids ?? []);
  const [triedWrongUids, setTriedWrongUids] = useState<Record<string, true>>(
    () => saved?.triedWrongUids ?? {},
  );
  const [mistakes, setMistakes] = useState<number>(() => saved?.mistakes ?? 0);
  const [totalScore, setTotalScore] = useState<number>(() => saved?.totalScore ?? 0);
  const [carsCleared, setCarsCleared] = useState<number>(() => saved?.carsCleared ?? 0);
  const [perfectCarsCount, setPerfectCarsCount] = useState<number>(
    () => saved?.perfectCarsCount ?? 0,
  );
  const [perfectStreak, setPerfectStreak] = useState<number>(
    () => saved?.perfectStreak ?? 0,
  );
  const [perfectStationIndices, setPerfectStationIndices] = useState<Record<number, true>>(
    () => saved?.perfectStationIndices ?? {},
  );
  const [masteredLetters, setMasteredLetters] = useState<LetterId[]>(() => loadMasteredLetters());
  const [perfectLetters, setPerfectLetters] = useState<LetterId[]>(() => loadPerfectLetters());

  const [phase, setPhase] = useState<CarPhase>(() =>
    saved?.finished ? 'finished' : 'arriving',
  );
  const [bannerTone, setBannerTone] = useState<BannerTone>('neutral');
  const [bannerText, setBannerText] = useState<string>(
    `Pick all 3 ${currentLetter} words with zero mistakes for a Clapping Party!`,
  );
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [showDepartureConfetti, setShowDepartureConfetti] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [thinkAgainHint, setThinkAgainHint] = useState<string | null>(null);

  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const initialArrivalPlayedRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      stopTrainSpeech();
    };
  }, [clearTimers]);

  // Announce initial train arrival once on mount
  useEffect(() => {
    if (initialArrivalPlayedRef.current) return;
    initialArrivalPlayedRef.current = true;
    if (phase === 'finished') return;
    playTrainArrivalSound(currentLetter, soundEnabled);
    const id = window.setTimeout(() => {
      setPhase((prev) => (prev === 'arriving' ? 'idle' : prev));
    }, 520);
    timersRef.current.push(id);
  }, [currentLetter, phase, soundEnabled]);

  // Report active game state for back-button guard
  useEffect(() => {
    const hasProgress =
      phase !== 'finished' && (stationIdx > 0 || loadedUids.length > 0 || totalScore > 0);
    onGameActiveChange?.(hasProgress);
  }, [loadedUids.length, onGameActiveChange, phase, stationIdx, totalScore]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
    };
  }, [onGameActiveChange]);

  // Persist session state across reloads
  useEffect(() => {
    try {
      const payload: SavedTrainState = {
        gameKey,
        stationQueue,
        stationIdx,
        platformCards,
        loadedUids,
        triedWrongUids,
        mistakes,
        totalScore,
        carsCleared,
        perfectCarsCount,
        perfectStreak,
        perfectStationIndices,
        finished: phase === 'finished',
      };
      window.sessionStorage.setItem(ACTIVE_TRAIN_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    carsCleared,
    gameKey,
    loadedUids,
    mistakes,
    perfectCarsCount,
    perfectStationIndices,
    perfectStreak,
    phase,
    platformCards,
    stationIdx,
    stationQueue,
    totalScore,
    triedWrongUids,
  ]);

  const advanceToNextStation = useCallback(
    (nextIdx: number, queue: LetterId[]) => {
      if (nextIdx >= queue.length) {
        setPhase('finished');
        playTripCompleteSound(soundEnabled);
        speakPhrase(`Hooray, ${childProfile.name}! All stations complete!`, soundEnabled);
        return;
      }
      const nextLetter = queue[nextIdx];
      setStationIdx(nextIdx);
      setPlatformCards(buildPlatformCards(nextLetter));
      setLoadedUids([]);
      setTriedWrongUids({});
      setMistakes(0);
      setShowDepartureConfetti(false);
      setBannerTone('neutral');
      setBannerText(
        `Pick all 3 ${nextLetter} words with zero mistakes for a Golden Clapping Party!`,
      );
      setPhase('arriving');
      playTrainArrivalSound(nextLetter, soundEnabled);

      scheduleTimer(() => {
        setPhase((prev) => (prev === 'arriving' ? 'idle' : prev));
      }, 520);
    },
    [childProfile.name, scheduleTimer, soundEnabled],
  );

  const attemptBoardCard = useCallback(
    (card: PlatformCardItem) => {
      if (thinkAgainHint !== null) return;
      if (phase !== 'idle' && phase !== 'arriving') return;
      if (loadedUids.includes(card.uid)) return;

      if (card.isTarget) {
        const nextLoaded = [...loadedUids, card.uid];
        const seatCount = nextLoaded.length;
        setLoadedUids(nextLoaded);

        playCorrectSeatSound(seatCount, soundEnabled);

        if (seatCount >= 3) {
          const updatedMastered = saveMasteredLetter(currentLetter);
          setMasteredLetters(updatedMastered);
          setCarsCleared((prev) => prev + 1);

          const isFlawless = mistakes === 0;

          if (isFlawless) {
            // PERFECT 3-FOR-3 WITH ZERO MISTAKES!
            // Big Clapping Crowd + Cheering + Golden Crown + +2 Bonus Points!
            const updatedPerfect = savePerfectLetter(currentLetter);
            setPerfectLetters(updatedPerfect);
            const nextStreak = perfectStreak + 1;
            const nextPerfectTotal = perfectCarsCount + 1;
            setPerfectCarsCount(nextPerfectTotal);
            setPerfectStreak(nextStreak);
            setPerfectStationIndices((prev) => ({ ...prev, [stationIdx]: true }));
            // +1 for the 3rd card + 2 bonus points = +3 on this final step (5 PTS total for the car!)
            setTotalScore((prev) => prev + 3);

            const cheerBanner =
              PERFECT_CHEERS[(stationIdx + nextPerfectTotal) % PERFECT_CHEERS.length];
            setBannerTone('gold');
            setBannerText(cheerBanner);
            setConfettiMode('win');
            setConfettiKey((prev) => prev + 1);
            setShowDepartureConfetti(true);
            setPhase('departing-perfect');

            const spokenCheers = [
              `Bravo, ${childProfile.name}! Zero mistakes! Everybody clap!`,
              `Woohoo! Three out of three! Clap clap clap for ${childProfile.name}!`,
              `Golden Crown on ${currentLetter}! Amazing ears, ${childProfile.name}!`,
            ];
            speakPhrase(
              spokenCheers[(stationIdx + nextStreak) % spokenCheers.length],
              soundEnabled,
            );

            scheduleTimer(() => {
              playPerfectApplauseAndTrainSound(soundEnabled);
            }, 140);

            scheduleTimer(() => {
              advanceToNextStation(stationIdx + 1, stationQueue);
            }, 2650);
          } else {
            // Completed after >= 1 mistake: polite regular departure (+1 PT, no clapping party)
            setTotalScore((prev) => prev + 1);
            setBannerTone('mint');
            const nextLetter = stationQueue[stationIdx + 1];
            setBannerText(
              nextLetter
                ? `All 3 ${currentLetter} words aboard! Try for Zero Mistakes on ${nextLetter}!`
                : `All 3 ${currentLetter} words aboard! Trip complete!`,
            );
            setConfettiMode('match');
            setConfettiKey((prev) => prev + 1);
            setShowDepartureConfetti(true);
            setPhase('departing-normal');

            speakPhrase(`${currentLetter}! ${card.spec.word}! All aboard!`, soundEnabled);
            scheduleTimer(() => {
              playTrainDepartureSound(soundEnabled);
            }, 260);

            scheduleTimer(() => {
              advanceToNextStation(stationIdx + 1, stationQueue);
            }, 1850);
          }
        } else {
          setTotalScore((prev) => prev + 1);
          setBannerTone('mint');
          setBannerText(
            mistakes === 0
              ? `${currentLetter} — ${card.spec.word}! +1 PT (${3 - seatCount} more for Clapping Party!)`
              : `${currentLetter} — ${card.spec.word}! +1 PT (${seatCount} of 3 aboard)`,
          );
          speakPhrase(`${currentLetter}! ${card.spec.word}!`, soundEnabled);
        }
      } else {
        // Calm, intentionally un-dramatic wrong pick:
        // No explosion, no boing, no shake — quietly shows starting letter and dims Golden Bonus.
        setMistakes((prev) => prev + 1);
        setPerfectStreak(0);
        setTriedWrongUids((prev) => ({ ...prev, [card.uid]: true }));
        const hintMsg = `${card.spec.word} starts with ${card.spec.letter} — listen and pick a word starting with ${currentLetter}.`;
        setBannerTone('muted');
        setBannerText(hintMsg);
        setThinkAgainHint(hintMsg);
        playCalmWrongHintSound(soundEnabled);
        speakPhrase(
          `${card.spec.word} starts with ${card.spec.letter}. Pick a word starting with ${currentLetter}.`,
          soundEnabled,
        );
      }
    },
    [
      advanceToNextStation,
      childProfile.name,
      currentLetter,
      loadedUids,
      mistakes,
      perfectCarsCount,
      perfectStreak,
      phase,
      scheduleTimer,
      soundEnabled,
      stationIdx,
      stationQueue,
      thinkAgainHint,
    ],
  );

  const isPointOverDropZone = (clientX: number, clientY: number): boolean => {
    const el = dropZoneRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const pad = 18;
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  };

  const handleCardPointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    card: PlatformCardItem,
  ) => {
    if (thinkAgainHint !== null) return;
    if (phase !== 'idle' && phase !== 'arriving') return;
    if (loadedUids.includes(card.uid)) return;
    if (triedWrongUids[card.uid]) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const targetEl = e.target as HTMLElement | null;
    if (targetEl?.closest('[data-listen-btn="true"]')) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    playCardPickupSound(soundEnabled);
    speakPhrase(card.spec.word, soundEnabled);

    setDragState({
      card,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      overDropZone: isPointOverDropZone(e.clientX, e.clientY),
    });
  };

  const handleCardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const movedEnough = dragState.isDragging || Math.hypot(dx, dy) > 9;
    const overDropZone = movedEnough && isPointOverDropZone(e.clientX, e.clientY);

    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: movedEnough,
      overDropZone,
    });
  };

  const handleCardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState) return;
    const active = dragState;
    setDragState(null);

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;
    const wasTap = !active.isDragging && Math.hypot(dx, dy) <= 9;

    if (wasTap || isPointOverDropZone(e.clientX, e.clientY)) {
      attemptBoardCard(active.card);
    }
  };

  const handleCardPointerCancel = () => {
    setDragState(null);
  };

  const handleRestartTrip = () => {
    clearTimers();
    stopTrainSpeech();
    clearSavedLetterTrainGame();

    const freshQueue = buildInitialQueue(config);
    const firstLetter = freshQueue[0] ?? 'A';
    setStationQueue(freshQueue);
    setStationIdx(0);
    // Deals a brand-new set of 3 target words + 3 distractors from the 156-word bank!
    setPlatformCards(buildPlatformCards(firstLetter));
    setLoadedUids([]);
    setTriedWrongUids({});
    setMistakes(0);
    setTotalScore(0);
    setCarsCleared(0);
    setPerfectCarsCount(0);
    setPerfectStreak(0);
    setPerfectStationIndices({});
    setShowDepartureConfetti(false);
    setBannerTone('neutral');
    setBannerText(
      `Pick all 3 ${firstLetter} words with zero mistakes for a Clapping Party!`,
    );
    setPhase('arriving');
    playTrainArrivalSound(firstLetter, soundEnabled);

    scheduleTimer(() => {
      setPhase((prev) => (prev === 'arriving' ? 'idle' : prev));
    }, 520);
  };

  const loadedCards = useMemo(
    () =>
      loadedUids
        .map((uid) => platformCards.find((c) => c.uid === uid))
        .filter((c): c is PlatformCardItem => c !== undefined),
    [loadedUids, platformCards],
  );

  const visibleTrackWindow = useMemo(() => {
    const total = stationQueue.length;
    const windowSize = Math.min(7, total);
    let start = Math.max(0, stationIdx - 3);
    if (start + windowSize > total) {
      start = Math.max(0, total - windowSize);
    }
    return stationQueue.slice(start, start + windowSize).map((letter, offset) => ({
      letter,
      idx: start + offset,
    }));
  }, [stationIdx, stationQueue]);

  const isPerfectParty = phase === 'departing-perfect';
  const isDeparting = phase === 'departing-normal' || phase === 'departing-perfect';
  const trainMotionClass =
    phase === 'arriving'
      ? 'lt-train--arriving'
      : isPerfectParty
        ? 'lt-train--departing-perfect'
        : phase === 'departing-normal'
          ? 'lt-train--departing'
          : '';

  const wheelsSpinning = phase === 'arriving' || isDeparting;
  const goldenBonusActive = mistakes === 0;

  return (
    <div className="app-shell app-shell--board lt-board-shell">
      <ConfettiBurst
        active={showDepartureConfetti}
        mode={confettiMode}
        burstKey={confettiKey}
      />

      {/* 1. Top Utility Bar */}
      <header className="top-bar lt-top-bar">
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>

          <button
            type="button"
            className="lt-station-pill"
            onClick={() =>
              speakPhrase(
                `Letter ${currentLetter}! Pick words starting with ${currentLetter}!`,
                true,
              )
            }
            aria-label={`Station ${stationIdx + 1} of ${stationQueue.length}, Letter ${currentLetter}. Tap to hear letter`}
          >
            <span className="lt-station-pill__dot" />
            <span>
              Car {stationIdx + 1} / {stationQueue.length}
            </span>
          </button>
        </div>

        <div className="top-bar__right">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact icon-pill-btn--square"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute game sounds' : 'Unmute game sounds'}
            title={soundEnabled ? 'Sound On' : 'Sound Muted'}
          >
            <AudioSpeakerIcon muted={!soundEnabled} size={17} />
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onChangeSetup}
          >
            <span>Letters</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={handleRestartTrip}
          >
            <span>New Words</span>
          </button>
        </div>
      </header>

      {/* 2. Solo Child Conductor HUD + Sliding Station Track */}
      <section className="lt-hud" aria-label="Conductor Score and Station Map">
        <div
          className={`lt-conductor-card ${
            isPerfectParty
              ? 'lt-conductor-card--gold'
              : bannerTone === 'mint'
                ? 'lt-conductor-card--mint'
                : ''
          }`}
        >
          <div className="lt-conductor-card__left">
            <img
              className="lt-conductor-card__avatar"
              src={getAvatarSrc(childProfile.avatar)}
              alt={childProfile.name}
            />
            <div className="lt-conductor-card__meta">
              <span className="lt-conductor-card__name">{childProfile.name}</span>
              <span className="lt-conductor-card__role">
                {perfectStreak >= 2
                  ? `${perfectStreak} PERFECT IN A ROW!`
                  : perfectStreak === 1
                    ? '1 PERFECT CROWN!'
                    : `CROWNS: ${perfectLetters.length}/26`}
              </span>
            </div>
          </div>

          <div className="lt-conductor-card__pts" aria-label={`Train cars cleared: ${carsCleared} of ${stationQueue.length}`}>
            <strong>
              {carsCleared}/{stationQueue.length}
            </strong>
            <span>CARS</span>
          </div>
        </div>

        <div className="lt-track-progress" aria-label="Upcoming letter stations">
          {visibleTrackWindow.map(({ letter, idx }) => {
            const isCurrent = idx === stationIdx;
            const isPast = idx < stationIdx;
            const wasPerfect = Boolean(perfectStationIndices[idx]);
            return (
              <span
                key={`${letter}-${idx}`}
                className={`lt-track-node ${
                  isCurrent
                    ? 'lt-track-node--current'
                    : isPast
                      ? wasPerfect
                        ? 'lt-track-node--perfect'
                        : 'lt-track-node--done'
                      : ''
                }`}
              >
                {letter}
              </span>
            );
          })}
        </div>
      </section>

      {/* 3. Fixed-Height Status Banner */}
      <div
        className={`lt-status-banner lt-status-banner--${bannerTone}`}
        role="status"
        aria-live="polite"
      >
        <span>{bannerText}</span>
      </div>

      {/* 4. Wooden Steam Train Stage & Perfect Clapping Celebration */}
      <section
        ref={dropZoneRef}
        className={`lt-stage ${
          dragState?.overDropZone ? 'lt-stage--drop-active' : ''
        } ${isPerfectParty ? 'lt-stage--party' : ''}`}
        aria-label={`Letter ${currentLetter} Train Car. ${loadedCards.length} of 3 seats filled.`}
      >
        {/* Soft Scenic Hills */}
        <div className="lt-stage__hills" aria-hidden="true" />

        {/* Sky / Celebration Layer: Animated Clapping Crowd on Perfect 3/3! */}
        <div className="lt-sky-fx" aria-hidden="true">
          {isPerfectParty ? (
            <div className="lt-clap-party-bar">
              <ClappingHandsBadge />
              <span className="lt-clap-party-bar__text">
                <CrownIcon size={17} /> BRAVO, {childProfile.name.toUpperCase()}! CLAP! CLAP! +2
                BONUS!
              </span>
              <ClappingHandsBadge />
            </div>
          ) : phase === 'departing-normal' ? (
            <div className="lt-whistle-badge">TOOT-TOOT! ALL ABOARD!</div>
          ) : (
            <div className="lt-idle-puffs">
              <span />
              <span />
            </div>
          )}
        </div>

        {/* Locomotive + Passenger Car */}
        <div className={`lt-train-assembly ${trainMotionClass}`}>
          {/* Steam Locomotive with Golden Crown Perfect Bonus Box */}
          <div
            className={`lt-locomotive ${
              isPerfectParty
                ? 'lt-locomotive--golden'
                : goldenBonusActive
                  ? 'lt-locomotive--bonus-ready'
                  : ''
            }`}
          >
            <div className="lt-chimney-wrap" aria-hidden="true">
              <div className="lt-chimney-cap" />
              <div className="lt-chimney-pipe" />
            </div>

            <div
              className={`lt-bonus-box ${
                goldenBonusActive ? 'lt-bonus-box--active' : 'lt-bonus-box--dim'
              }`}
              aria-label={
                goldenBonusActive
                  ? 'Golden Crown Bonus active: zero mistakes so far!'
                  : 'Golden Crown Bonus missed on this car'
              }
            >
              <span className="lt-bonus-box__title">
                {goldenBonusActive ? 'NO MISTAKES' : 'KEEP GOING'}
              </span>
              <div className="lt-bonus-box__crown">
                <CrownIcon size={24} />
              </div>
              <span className="lt-bonus-box__status">
                {isPerfectParty
                  ? 'WON +2 PTS!'
                  : goldenBonusActive
                    ? '+2 PARTY!'
                    : 'NEXT CAR'}
              </span>
            </div>

            <div className="lt-cowcatcher" aria-hidden="true" />
          </div>

          {/* Coupler Link */}
          <div className="lt-coupler" aria-hidden="true" />

          {/* Letter Passenger Car (3 Seats) */}
          <div
            className={`lt-passenger-car ${
              isPerfectParty
                ? 'lt-passenger-car--golden'
                : loadedCards.length === 3
                  ? 'lt-passenger-car--full'
                  : ''
            } ${dragState?.overDropZone ? 'lt-passenger-car--hover' : ''}`}
          >
            <div className="lt-car-header">
              <button
                type="button"
                className="lt-letter-sign"
                style={{ backgroundColor: stationSpec.accentColor }}
                onClick={() =>
                  speakPhrase(
                    `Letter ${currentLetter}! Find words that start with ${currentLetter}!`,
                    true,
                  )
                }
                title={`Tap to hear Letter ${currentLetter}`}
              >
                <span>{currentLetter}</span>
                <span className="lt-letter-sign__lower">
                  {currentLetter.toLowerCase()}
                </span>
                <span className="lt-letter-sign__audio" aria-hidden="true">
                  <AudioSpeakerIcon size={15} />
                </span>
              </button>

              <div className="lt-car-header__info">
                <strong>Starts with {currentLetter}</strong>
                <span>{loadedCards.length} of 3 aboard</span>
              </div>
            </div>

            <div className="lt-seats-grid">
              {[0, 1, 2].map((seatIdx) => {
                const occupant = loadedCards[seatIdx];
                if (occupant) {
                  const firstChar = occupant.spec.word.slice(0, 1);
                  const restChars = occupant.spec.word.slice(1);
                  return (
                    <button
                      key={occupant.uid}
                      type="button"
                      className={`lt-seat lt-seat--filled ${
                        isPerfectParty ? 'lt-seat--dancing' : ''
                      }`}
                      onClick={() =>
                        speakPhrase(
                          `${currentLetter}! ${occupant.spec.word}!`,
                          true,
                        )
                      }
                    >
                      <div className="lt-seat__art">
                        <WordIllustration id={occupant.spec.id} size={48} />
                      </div>
                      <span className="lt-seat__word">
                        <u>{firstChar}</u>
                        {restChars}
                      </span>
                    </button>
                  );
                }

                return (
                  <div key={seatIdx} className="lt-seat lt-seat--empty">
                    <span className="lt-seat__placeholder">{currentLetter} ?</span>
                    <span className="lt-seat__sub">Seat {seatIdx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Train Wheels */}
          <div className="lt-wheels-row" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((wheelIdx) => (
              <span
                key={wheelIdx}
                className={`lt-wheel ${wheelsSpinning ? 'lt-wheel--spin' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Wooden Sleepers & Rail Track */}
        <div className="lt-rails" aria-hidden="true">
          <div className="lt-rails__steel" />
          <div className="lt-rails__sleepers" />
        </div>
      </section>

      {/* 5. Station Platform: 3 x 2 Picture Cards */}
      <section className="lt-platform" aria-label="Station Platform Word Cards">
        <div className="lt-platform__header">
          <span>STATION PLATFORM — LISTEN CAREFULLY FOR ZERO MISTAKES!</span>
          <span className="lt-platform__listen-hint">
            <AudioSpeakerIcon size={13} /> TAP SPEAKER TO CHECK FIRST
          </span>
        </div>

        <div className="lt-platform-grid">
          {platformCards.map((card) => {
            const isLoaded = loadedUids.includes(card.uid);
            const wasTriedWrong = Boolean(triedWrongUids[card.uid]);
            const isBeingDragged =
              dragState?.isDragging && dragState.card.uid === card.uid;

            if (isLoaded) {
              return (
                <div
                  key={card.uid}
                  className="lt-card lt-card--aboard"
                  aria-label={`${card.spec.word} is aboard the train`}
                >
                  <span className="lt-card__aboard-check">✓</span>
                  <span className="lt-card__aboard-text">Aboard!</span>
                </div>
              );
            }

            const showWordLabel = config.wordLabelMode === 'always' || wasTriedWrong;
            const firstChar = card.spec.word.slice(0, 1);
            const restChars = card.spec.word.slice(1);

            return (
              <div
                key={card.uid}
                role="button"
                tabIndex={wasTriedWrong ? -1 : 0}
                aria-disabled={wasTriedWrong}
                aria-label={`${card.spec.word}. ${
                  wasTriedWrong
                    ? `Starts with ${firstChar}`
                    : `Tap or drag onto the ${currentLetter} train`
                }`}
                className={`lt-card ${wasTriedWrong ? 'lt-card--wrong-calm' : ''} ${
                  isBeingDragged ? 'lt-card--dragging-origin' : ''
                }`}
                onPointerDown={(e) => handleCardPointerDown(e, card)}
                onPointerMove={handleCardPointerMove}
                onPointerUp={handleCardPointerUp}
                onPointerCancel={handleCardPointerCancel}
                onKeyDown={(e) => {
                  if (!wasTriedWrong && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    attemptBoardCard(card);
                  }
                }}
              >
                <button
                  type="button"
                  data-listen-btn="true"
                  className="lt-card__listen-btn"
                  aria-label={`Hear word: ${card.spec.word}`}
                  title="Hear word"
                  onClick={(e) => {
                    e.stopPropagation();
                    playCardPickupSound(true);
                    speakPhrase(card.spec.word, true);
                  }}
                >
                  <AudioSpeakerIcon size={15} />
                </button>

                {wasTriedWrong && (
                  <span className="lt-card__calm-tag">
                    Starts with {firstChar}
                  </span>
                )}

                <div
                  className="lt-card__art-frame"
                  style={{ backgroundColor: card.spec.tintBg }}
                >
                  <WordIllustration id={card.spec.id} size={106} />
                </div>

                {showWordLabel ? (
                  <span
                    className={`lt-card__label ${
                      wasTriedWrong ? 'lt-card__label--muted' : ''
                    }`}
                  >
                    <strong>{firstChar}</strong>
                    {restChars}
                  </span>
                ) : (
                  <span className="lt-card__label lt-card__label--mystery">
                    Tap or Drag
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Drag Ghost Under Finger/Pointer */}
      {dragState?.isDragging && (
        <div
          className={`lt-drag-ghost ${
            dragState.overDropZone ? 'lt-drag-ghost--over' : ''
          }`}
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
          }}
          aria-hidden="true"
        >
          <div
            className="lt-card__art-frame"
            style={{ backgroundColor: dragState.card.spec.tintBg }}
          >
            <WordIllustration id={dragState.card.spec.id} size={74} />
          </div>
          {config.wordLabelMode === 'always' && (
            <span className="lt-card__label">{dragState.card.spec.word}</span>
          )}
        </div>
      )}

      {/* Trip Complete Celebration Modal */}
      {phase === 'finished' && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lt-complete-headline"
        >
          <ConfettiBurst active mode="win" burstKey={999} />
          <div className="winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={46} />
              <div className="winner-avatars-row">
                <div className="winner-avatar-halo">
                  <img
                    src={getAvatarSrc(childProfile.avatar)}
                    alt={childProfile.name}
                  />
                </div>
              </div>
            </div>

            <h2 id="lt-complete-headline">Bravo, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You earned {perfectCarsCount} Perfect Golden{' '}
              {perfectCarsCount === 1 ? 'Crown' : 'Crowns'} on this trip and now hold{' '}
              {perfectLetters.length} of 26 Golden A–Z Crowns ({masteredLetters.length}/26 cleared)!
            </p>

            <div className="standings-list" aria-label="Trip Summary">
              <div className="standing-row standing-row--winner">
                <div className="standing-row__left">
                  <span className="standing-rank-pill">CONDUCTOR</span>
                  <img
                    className="standing-row__avatar"
                    src={getAvatarSrc(childProfile.avatar)}
                    alt={childProfile.name}
                  />
                  <span className="standing-row__name">{childProfile.name}</span>
                </div>
                <div className="standing-row__pts">
                  <strong>
                    {carsCleared}/{stationQueue.length}
                  </strong>
                  <span>CARS</span>
                </div>
              </div>
            </div>

            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleRestartTrip}
              >
                Ride Again with New Words
              </button>
              <div className="winner-actions__row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onChangeSetup}
                >
                  Choose Letters
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
        onReady={() => setThinkAgainHint(null)}
      />
    </div>
  );
}

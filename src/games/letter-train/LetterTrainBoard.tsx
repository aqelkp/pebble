import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  ALL_LETTERS,
  buildPlatformCards,
  getStationSpec,
  isValidLetterId,
  loadMasteredLetters,
  saveMasteredLetter,
  shuffleArray,
  type LetterId,
  type PlatformCardItem,
} from './letterData';
import type { LetterTrainConfig } from './LetterTrainSetup';
import {
  playBoilerBlowoutSound,
  playCardPickupSound,
  playCorrectSeatSound,
  playTrainArrivalSound,
  playTrainDepartureSound,
  playTripCompleteSound,
  playWrongStrikeSound,
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

type CarPhase = 'arriving' | 'idle' | 'strike-anim' | 'blowout' | 'departing' | 'finished';

type BannerTone = 'neutral' | 'mint' | 'coral' | 'blowout';

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

const ACTIVE_TRAIN_STORAGE_KEY = 'pebble.letter-train.active.v1';

interface SavedTrainState {
  gameKey: number;
  stationQueue: LetterId[];
  stationIdx: number;
  platformCards: PlatformCardItem[];
  loadedUids: string[];
  bouncedUids: Record<string, true>;
  strikes: number;
  totalScore: number;
  carScore: number;
  carsCleared: number;
  finished: boolean;
}

function isValidPlatformCard(value: unknown): value is PlatformCardItem {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<PlatformCardItem>;
  if (typeof c.uid !== 'string' || c.uid.length > 64 || typeof c.isTarget !== 'boolean') {
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
      !s.loadedUids.every((u) => typeof u === 'string' && u.length <= 64) ||
      typeof s.bouncedUids !== 'object' ||
      s.bouncedUids === null ||
      typeof s.strikes !== 'number' ||
      s.strikes < 0 ||
      s.strikes > 3 ||
      typeof s.totalScore !== 'number' ||
      s.totalScore < 0 ||
      typeof s.carScore !== 'number' ||
      s.carScore < 0 ||
      typeof s.carsCleared !== 'number' ||
      s.carsCleared < 0 ||
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
      bouncedUids: s.bouncedUids,
      strikes: s.strikes,
      totalScore: s.totalScore,
      carScore: s.carScore,
      carsCleared: s.carsCleared,
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
  const [bouncedUids, setBouncedUids] = useState<Record<string, true>>(
    () => saved?.bouncedUids ?? {},
  );
  const [justEjectedUid, setJustEjectedUid] = useState<string | null>(null);
  const [strikes, setStrikes] = useState<number>(() => saved?.strikes ?? 0);
  const [totalScore, setTotalScore] = useState<number>(() => saved?.totalScore ?? 0);
  const [carScore, setCarScore] = useState<number>(() => saved?.carScore ?? 0);
  const [carsCleared, setCarsCleared] = useState<number>(() => saved?.carsCleared ?? 0);
  const [blownStationMap, setBlownStationMap] = useState<Record<number, true>>({});
  const [masteredLetters, setMasteredLetters] = useState<LetterId[]>(() => loadMasteredLetters());

  const [phase, setPhase] = useState<CarPhase>(() =>
    saved?.finished ? 'finished' : 'arriving',
  );
  const [bannerTone, setBannerTone] = useState<BannerTone>('neutral');
  const [bannerText, setBannerText] = useState<string>(
    `Load the 3 pictures that start with ${currentLetter}!`,
  );
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [showDepartureConfetti, setShowDepartureConfetti] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
        bouncedUids,
        strikes,
        totalScore,
        carScore,
        carsCleared,
        finished: phase === 'finished',
      };
      window.sessionStorage.setItem(ACTIVE_TRAIN_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    bouncedUids,
    carScore,
    carsCleared,
    gameKey,
    loadedUids,
    phase,
    platformCards,
    stationIdx,
    stationQueue,
    strikes,
    totalScore,
  ]);

  const advanceToNextStation = useCallback(
    (nextIdx: number, queue: LetterId[]) => {
      if (nextIdx >= queue.length) {
        setPhase('finished');
        playTripCompleteSound(soundEnabled);
        speakPhrase(`Amazing job, ${childProfile.name}! Train trip complete!`, soundEnabled);
        return;
      }
      const nextLetter = queue[nextIdx];
      setStationIdx(nextIdx);
      setPlatformCards(buildPlatformCards(nextLetter));
      setLoadedUids([]);
      setBouncedUids({});
      setJustEjectedUid(null);
      setStrikes(0);
      setCarScore(0);
      setShowDepartureConfetti(false);
      setBannerTone('neutral');
      setBannerText(`All aboard for ${nextLetter}! Pick 3 ${nextLetter} words!`);
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
      if (phase !== 'idle' && phase !== 'arriving') return;
      if (loadedUids.includes(card.uid)) return;

      if (card.isTarget) {
        const nextLoaded = [...loadedUids, card.uid];
        const seatCount = nextLoaded.length;
        setLoadedUids(nextLoaded);
        setJustEjectedUid(null);
        setTotalScore((prev) => prev + 1);
        setCarScore((prev) => prev + 1);

        playCorrectSeatSound(seatCount, soundEnabled);

        if (seatCount >= 3) {
          // All 3 correct cards are aboard -> Mastered + Train Whistle Departure!
          const updatedMastered = saveMasteredLetter(currentLetter);
          setMasteredLetters(updatedMastered);
          setCarsCleared((prev) => prev + 1);
          setBannerTone('mint');
          const nextLetter = stationQueue[stationIdx + 1];
          setBannerText(
            nextLetter
              ? `CHOO-CHOO! All 3 ${currentLetter} words aboard! Next stop: ${nextLetter}!`
              : `CHOO-CHOO! All 3 ${currentLetter} words aboard! Final station complete!`,
          );
          setConfettiKey((prev) => prev + 1);
          setShowDepartureConfetti(true);
          setPhase('departing');

          speakPhrase(`${currentLetter}! ${card.spec.word}! All aboard!`, soundEnabled);
          scheduleTimer(() => {
            playTrainDepartureSound(soundEnabled);
          }, 260);

          scheduleTimer(() => {
            advanceToNextStation(stationIdx + 1, stationQueue);
          }, 2050);
        } else {
          setBannerTone('mint');
          setBannerText(
            `${currentLetter} — ${card.spec.word}! +1 POINT (${seatCount} of 3 aboard)`,
          );
          speakPhrase(`${currentLetter}! ${card.spec.word}!`, soundEnabled);
        }
      } else {
        // Wrong word dropped onto the train -> Danger! Boiler clogs & launches card out!
        const nextStrikes = strikes + 1;
        setStrikes(nextStrikes);
        setBouncedUids((prev) => ({ ...prev, [card.uid]: true }));
        setJustEjectedUid(card.uid);

        if (nextStrikes >= 3) {
          // 3rd Strike = BOILER BLOWOUT! Seated cards pop off and runaway car leaves with 0 PTS
          setTotalScore((prev) => Math.max(0, prev - carScore));
          setCarScore(0);
          setLoadedUids([]);
          setBlownStationMap((prev) => ({ ...prev, [stationIdx]: true }));
          setBannerTone('blowout');
          setBannerText(
            `KABOOM-CHOO! ${card.spec.word} starts with ${card.spec.letter}! Boiler blew!`,
          );
          setPhase('blowout');
          playBoilerBlowoutSound(soundEnabled);
          speakPhrase(
            `Uh oh! ${card.spec.word} starts with ${card.spec.letter}! Boiler blew its lid!`,
            soundEnabled,
          );

          scheduleTimer(() => {
            setJustEjectedUid(null);
            advanceToNextStation(stationIdx + 1, stationQueue);
          }, 2200);
        } else {
          setBannerTone('coral');
          setBannerText(
            nextStrikes === 2
              ? `DANGER (2/3)! ${card.spec.word} starts with ${card.spec.letter} — 1 strike left!`
              : `CLANK-HISS! ${card.spec.word} starts with ${card.spec.letter}! (Boiler ${nextStrikes}/3)`,
          );
          setPhase('strike-anim');
          playWrongStrikeSound(nextStrikes, soundEnabled);
          speakPhrase(`Oops! ${card.spec.word} starts with ${card.spec.letter}!`, soundEnabled);

          scheduleTimer(() => {
            setPhase((prev) => (prev === 'strike-anim' ? 'idle' : prev));
          }, 760);

          scheduleTimer(() => {
            setJustEjectedUid((prev) => (prev === card.uid ? null : prev));
          }, 1150);
        }
      }
    },
    [
      advanceToNextStation,
      carScore,
      currentLetter,
      loadedUids,
      phase,
      scheduleTimer,
      soundEnabled,
      stationIdx,
      stationQueue,
      strikes,
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
    if (phase !== 'idle' && phase !== 'arriving') return;
    if (loadedUids.includes(card.uid)) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Ignore pointer down if user tapped the dedicated speaker button
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
    setPlatformCards(buildPlatformCards(firstLetter));
    setLoadedUids([]);
    setBouncedUids({});
    setJustEjectedUid(null);
    setStrikes(0);
    setTotalScore(0);
    setCarScore(0);
    setCarsCleared(0);
    setBlownStationMap({});
    setShowDepartureConfetti(false);
    setBannerTone('neutral');
    setBannerText(`Load the 3 pictures that start with ${firstLetter}!`);
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

  // Show a compact sliding window of 7 stations around stationIdx
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

  const isDangerTremble = strikes === 2 && phase !== 'departing' && phase !== 'finished';
  const trainMotionClass =
    phase === 'arriving'
      ? 'lt-train--arriving'
      : phase === 'departing'
        ? 'lt-train--departing'
        : phase === 'blowout'
          ? 'lt-train--blowout'
          : phase === 'strike-anim'
            ? 'lt-train--clank'
            : isDangerTremble
              ? 'lt-train--tremble'
              : '';

  const wheelsSpinning = phase === 'arriving' || phase === 'departing' || phase === 'blowout';

  return (
    <div className="app-shell app-shell--board lt-board-shell">
      <ConfettiBurst active={showDepartureConfetti} mode="match" burstKey={confettiKey} />

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
            <span>Restart</span>
          </button>
        </div>
      </header>

      {/* 2. Solo Child Conductor HUD + Sliding Station Track */}
      <section className="lt-hud" aria-label="Conductor Score and Station Map">
        <div
          className={`lt-conductor-card ${
            bannerTone === 'mint'
              ? 'lt-conductor-card--mint'
              : strikes >= 2
                ? 'lt-conductor-card--danger'
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
                {strikes >= 2
                  ? 'CAREFUL! 2/3 STEAM'
                  : bannerTone === 'mint'
                    ? 'GREAT EAR!'
                    : `STICKERS: ${masteredLetters.length}/26`}
              </span>
            </div>
          </div>

          <div className="lt-conductor-card__pts">
            <strong>{totalScore}</strong>
            <span>PTS</span>
          </div>
        </div>

        <div className="lt-track-progress" aria-label="Upcoming letter stations">
          {visibleTrackWindow.map(({ letter, idx }) => {
            const isCurrent = idx === stationIdx;
            const isPast = idx < stationIdx;
            const wasBlown = Boolean(blownStationMap[idx]);
            return (
              <span
                key={`${letter}-${idx}`}
                className={`lt-track-node ${
                  isCurrent
                    ? 'lt-track-node--current'
                    : isPast
                      ? wasBlown
                        ? 'lt-track-node--blown'
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

      {/* 4. Wooden Steam Train & Boiler Stage (Drop Target) */}
      <section
        ref={dropZoneRef}
        className={`lt-stage ${
          dragState?.overDropZone ? 'lt-stage--drop-active' : ''
        } ${strikes >= 2 ? 'lt-stage--danger' : ''}`}
        aria-label={`Letter ${currentLetter} Train Car. ${loadedCards.length} of 3 seats filled.`}
      >
        {/* Soft Scenic Hills */}
        <div className="lt-stage__hills" aria-hidden="true" />

        {/* Steam / Smoke / Whistle Effects Layer */}
        <div className="lt-sky-fx" aria-hidden="true">
          {phase === 'departing' && (
            <div className="lt-whistle-badge">TOOT-TOOT!</div>
          )}
          {phase === 'blowout' && (
            <div className="lt-blowout-cloud">POOF-KABOOM!</div>
          )}
          {phase === 'strike-anim' && (
            <div className="lt-smoke-puff-dark">CLANK-HISS!</div>
          )}
          {phase === 'idle' && strikes === 0 && (
            <div className="lt-idle-puffs">
              <span />
              <span />
            </div>
          )}
        </div>

        {/* Locomotive + Passenger Car */}
        <div className={`lt-train-assembly ${trainMotionClass}`}>
          {/* Steam Locomotive with 3-Step Boiler Pressure Gauge */}
          <div
            className={`lt-locomotive ${
              strikes === 2 ? 'lt-locomotive--danger' : ''
            } ${phase === 'blowout' ? 'lt-locomotive--blown' : ''}`}
          >
            <div className="lt-chimney-wrap" aria-hidden="true">
              <div
                className={`lt-chimney-cap ${
                  phase === 'blowout' ? 'lt-chimney-cap--popped' : ''
                }`}
              />
              <div className="lt-chimney-pipe" />
            </div>

            <div className="lt-boiler-box">
              <span className="lt-boiler-box__title">BOILER</span>
              <div
                className="lt-boiler-bulbs"
                aria-label={`Boiler strikes: ${strikes} of 3`}
              >
                {[1, 2, 3].map((step) => {
                  const lit = strikes >= step;
                  const bulbClass = !lit
                    ? ''
                    : strikes === 1
                      ? 'lt-boiler-bulb--warm'
                      : 'lt-boiler-bulb--hot';
                  return (
                    <span
                      key={step}
                      className={`lt-boiler-bulb ${bulbClass}`}
                    />
                  );
                })}
              </div>
              <span
                className={`lt-boiler-box__status ${
                  strikes >= 2 ? 'lt-boiler-box__status--hot' : ''
                }`}
              >
                {strikes >= 3
                  ? 'BLOWN!'
                  : strikes === 2
                    ? 'DANGER!'
                    : strikes === 1
                      ? '1 / 3 WARM'
                      : 'CALM'}
              </span>
            </div>

            <div className="lt-cowcatcher" aria-hidden="true" />
          </div>

          {/* Coupler Link */}
          <div className="lt-coupler" aria-hidden="true" />

          {/* Letter Passenger Car (3 Seats) */}
          <div
            className={`lt-passenger-car ${
              loadedCards.length === 3 ? 'lt-passenger-car--full' : ''
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
                      className="lt-seat lt-seat--filled"
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
          <span>STATION PLATFORM — DRAG OR TAP TO BOARD</span>
          <span className="lt-platform__listen-hint">
            <AudioSpeakerIcon size={13} /> TAP SPEAKER TO LISTEN
          </span>
        </div>

        <div className="lt-platform-grid">
          {platformCards.map((card) => {
            const isLoaded = loadedUids.includes(card.uid);
            const wasBounced = Boolean(bouncedUids[card.uid]);
            const isEjecting = justEjectedUid === card.uid;
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

            const showWordLabel = config.wordLabelMode === 'always' || wasBounced;
            const firstChar = card.spec.word.slice(0, 1);
            const restChars = card.spec.word.slice(1);

            return (
              <div
                key={card.uid}
                role="button"
                tabIndex={0}
                aria-label={`${card.spec.word}. Tap or drag onto the ${currentLetter} train`}
                className={`lt-card ${wasBounced ? 'lt-card--bounced' : ''} ${
                  isEjecting ? 'lt-card--ejecting' : ''
                } ${isBeingDragged ? 'lt-card--dragging-origin' : ''}`}
                onPointerDown={(e) => handleCardPointerDown(e, card)}
                onPointerMove={handleCardPointerMove}
                onPointerUp={handleCardPointerUp}
                onPointerCancel={handleCardPointerCancel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
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

                {wasBounced && (
                  <span className="lt-card__bounce-tag">
                    Starts with {firstChar}!
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
                      wasBounced ? 'lt-card__label--coral' : ''
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
            <WordIllustration id={dragState.card.spec.id} size={68} />
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

            <h2 id="lt-complete-headline">All Stations Complete, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You cleared {carsCleared} of {stationQueue.length}{' '}
              {stationQueue.length === 1 ? 'letter train' : 'letter trains'} and now hold{' '}
              {masteredLetters.length} of 26 A–Z badges!
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
                  <strong>{totalScore}</strong>
                  <span>PTS</span>
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
                Ride Again
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
    </div>
  );
}

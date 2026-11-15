import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { WinnerModal, type PlayerStanding } from '../../components/WinnerModal';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import {
  buildSafariTrail,
  getSafariLengthSpec,
  getSafariModeSpec,
  type SafariAnimalInstance,
  type SafariStop,
} from './safariData';
import type { SafariGameConfig } from './SafariSetup';
import {
  playAnimalCountSound,
  playAnimalNudgeSound,
  playSafariCorrectSound,
  playSafariTryAgainSound,
  playSafariWinSound,
} from './safariSounds';

interface SafariBoardProps {
  gameKey: number;
  config: SafariGameConfig;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type SafariPhase = 'idle' | 'resolving-correct' | 'resolving-wrong' | 'finished';

const ACTIVE_SAFARI_STORAGE_KEY = 'pebble.safari.active.v1';

interface SavedSafariGameState {
  gameKey: number;
  trail: SafariStop[];
  currentStopIdx: number;
  scores: Record<string, number>;
  currentPlayerIdx: number;
  triedNumbers: number[];
  phase: SafariPhase;
}

function isValidAnimalInstance(value: unknown): value is SafariAnimalInstance {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<SafariAnimalInstance>;
  return (
    typeof item.uid === 'string' &&
    item.uid.length <= 48 &&
    typeof item.label === 'string' &&
    item.label.length <= 48 &&
    typeof item.imageSrc === 'string' &&
    item.imageSrc.length <= 200 &&
    (item.groupIndex === 0 || item.groupIndex === 1)
  );
}

function isValidSafariStop(value: unknown): value is SafariStop {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<SafariStop>;
  return (
    typeof s.uid === 'string' &&
    typeof s.stopNumber === 'number' &&
    (s.kind === 'count' || s.kind === 'addition') &&
    typeof s.answer === 'number' &&
    s.answer >= 1 &&
    s.answer <= 10 &&
    typeof s.promptText === 'string' &&
    s.promptText.length <= 120 &&
    typeof s.celebrationDetail === 'string' &&
    s.celebrationDetail.length <= 120 &&
    typeof s.primaryAnimalLabel === 'string' &&
    typeof s.leftCount === 'number' &&
    typeof s.rightCount === 'number' &&
    Array.isArray(s.animals) &&
    s.animals.length === s.answer &&
    s.animals.every(isValidAnimalInstance)
  );
}

function loadSavedSafariState(gameKey: number): SavedSafariGameState | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_SAFARI_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<SavedSafariGameState>;
    if (
      candidate.gameKey !== gameKey ||
      !Array.isArray(candidate.trail) ||
      candidate.trail.length === 0 ||
      candidate.trail.length > 20 ||
      !candidate.trail.every(isValidSafariStop) ||
      typeof candidate.currentStopIdx !== 'number' ||
      candidate.currentStopIdx < 0 ||
      candidate.currentStopIdx >= candidate.trail.length ||
      typeof candidate.scores !== 'object' ||
      candidate.scores === null ||
      typeof candidate.currentPlayerIdx !== 'number' ||
      candidate.currentPlayerIdx < 0
    ) {
      return null;
    }

    const sanitizedScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(candidate.scores)) {
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
        sanitizedScores[key] = Math.floor(val);
      }
    }

    const sanitizedTried = Array.isArray(candidate.triedNumbers)
      ? candidate.triedNumbers.filter(
          (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10,
        )
      : [];

    const restoredPhase: SafariPhase = candidate.phase === 'finished' ? 'finished' : 'idle';
    return {
      gameKey,
      trail: candidate.trail,
      currentStopIdx: candidate.currentStopIdx,
      scores: sanitizedScores,
      currentPlayerIdx: candidate.currentPlayerIdx,
      triedNumbers: sanitizedTried,
      phase: restoredPhase,
    };
  } catch {
    return null;
  }
}

export function clearSavedSafariGame(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_SAFARI_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

function buildInitialScores(players: FamilyProfile[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const player of players) {
    scores[player.id] = 0;
  }
  return scores;
}

/**
 * Circular pebble dot pips rendered underneath each numeral on the Number Blocks
 * (strictly circular river-pebble dots in 5-groups — zero star shapes).
 */
function NumberBlockPips({ count, active }: { count: number; active: boolean }) {
  const topRowCount = Math.min(5, count);
  const bottomRowCount = Math.max(0, count - 5);

  return (
    <span className="safari-block-pips" aria-hidden="true">
      <span className="safari-block-pips__row">
        {Array.from({ length: topRowCount }, (_, idx) => (
          <span
            key={`t-${idx}`}
            className={`safari-block-pip ${active ? 'safari-block-pip--active' : ''}`}
          />
        ))}
      </span>
      {bottomRowCount > 0 && (
        <span className="safari-block-pips__row">
          {Array.from({ length: bottomRowCount }, (_, idx) => (
            <span
              key={`b-${idx}`}
              className={`safari-block-pip ${active ? 'safari-block-pip--active' : ''}`}
            />
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * Soft botanical leaf motif for the Savanna Clearing corners (pure rounded organic leaf paths).
 */
function SavannaLeafCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 30C6 17 15 8 29 7C28 20 19 29 6 30Z"
        fill="#3BA99C"
        fillOpacity="0.16"
      />
      <path
        d="M8 28C13 21 20 15 27 9"
        stroke="#3BA99C"
        strokeOpacity="0.34"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function splitIntoRows<T>(items: readonly T[], maxPerRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += maxPerRow) {
    rows.push(items.slice(i, i + maxPerRow));
  }
  return rows;
}

export function SafariBoard({
  gameKey,
  config,
  profiles,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onGameActiveChange,
  journeyContext,
}: SafariBoardProps) {
  const modeSpec = useMemo(() => getSafariModeSpec(config.modeId), [config.modeId]);
  const lengthSpec = useMemo(() => getSafariLengthSpec(config.lengthId), [config.lengthId]);

  const players = useMemo(() => {
    const selected = config.playerIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is FamilyProfile => p !== undefined);
    return selected.length > 0 ? selected : profiles.slice(0, 2);
  }, [config.playerIds, profiles]);

  const [savedState] = useState<SavedSafariGameState | null>(() => loadSavedSafariState(gameKey));

  const [trail, setTrail] = useState<SafariStop[]>(
    () => savedState?.trail ?? buildSafariTrail(config.modeId, config.lengthId),
  );
  const [thinkAgainHint, setThinkAgainHint] = useState<string | null>(null);
  const [currentStopIdx, setCurrentStopIdx] = useState<number>(
    () => savedState?.currentStopIdx ?? 0,
  );
  const [scores, setScores] = useState<Record<string, number>>(
    () => savedState?.scores ?? buildInitialScores(players),
  );
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(
    () => savedState?.currentPlayerIdx ?? 0,
  );
  const [phase, setPhase] = useState<SafariPhase>(() => savedState?.phase ?? 'idle');
  const [countedUids, setCountedUids] = useState<string[]>([]);
  const [nudgedUid, setNudgedUid] = useState<string | null>(null);
  const [triedNumbers, setTriedNumbers] = useState<number[]>(
    () => savedState?.triedNumbers ?? [],
  );
  const [lastWrongNumber, setLastWrongNumber] = useState<number | null>(null);
  const [nextPlayerName, setNextPlayerName] = useState<string | null>(null);
  const [matchBurstCount, setMatchBurstCount] = useState<number>(0);

  const clearingBodyRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nudgeTimeoutRef = useRef<number | null>(null);

  const [animalTileSize, setAnimalTileSize] = useState<number>(108);
  const [maxColsPerRow, setMaxColsPerRow] = useState<number>(5);

  const currentStop = trail[currentStopIdx] ?? trail[0];
  const activePlayer = players[currentPlayerIdx % players.length] ?? players[0];

  const clearPendingTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (nudgeTimeoutRef.current !== null) {
      window.clearTimeout(nudgeTimeoutRef.current);
      nudgeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimers();
  }, [clearPendingTimers]);

  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;
  const journeyCompletedFiredRef = useRef(false);
  const isJourneyMode = Boolean(journeyContext);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'finished');
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    if (!isJourneyMode || phase !== 'finished' || journeyCompletedFiredRef.current) return;
    const timer = window.setTimeout(() => {
      if (journeyCompletedFiredRef.current) return;
      journeyCompletedFiredRef.current = true;
      journeyOnCompleteRef.current?.();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isJourneyMode, phase]);

  useEffect(() => {
    try {
      const snapshot: SavedSafariGameState = {
        gameKey,
        trail,
        currentStopIdx,
        scores,
        currentPlayerIdx,
        triedNumbers,
        phase: phase === 'finished' ? 'finished' : 'idle',
      };
      window.sessionStorage.setItem(ACTIVE_SAFARI_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [currentPlayerIdx, currentStopIdx, gameKey, phase, scores, trail, triedNumbers]);

  // Dynamically size animal cards inside the Savanna Clearing so 1..10 items or 2 addition pods
  // fit cleanly inside 100dvh with zero vertical scrolling across tablet, phone, and desktop.
  useEffect(() => {
    const element = clearingBodyRef.current;
    if (!element || !currentStop) return;

    const computeLayout = () => {
      const rect = element.getBoundingClientRect();
      const availW = Math.max(220, rect.width - 12);
      const availH = Math.max(140, rect.height - 8);
      const rowCap = availW < 420 ? 3 : 5;
      setMaxColsPerRow(rowCap);

      const gap = availW < 420 ? 8 : 12;

      if (currentStop.kind === 'addition') {
        const leftCols = Math.min(rowCap, currentStop.leftCount);
        const rightCols = Math.min(rowCap, currentStop.rightCount);
        const leftRows = Math.ceil(currentStop.leftCount / rowCap);
        const rightRows = Math.ceil(currentStop.rightCount / rowCap);
        const widestCols = Math.max(leftCols, rightCols, 2);
        const totalRows = leftRows + rightRows;

        // Reserve vertical space for pod padding + the "+" connector pill between pods
        const chromeH = 74 + Math.max(0, totalRows - 2) * gap;
        const chromeW = 36;

        const maxTileW = (availW - chromeW - (widestCols - 1) * gap) / widestCols;
        const maxTileH = (availH - chromeH - (totalRows - 1) * gap) / totalRows;
        const clamped = Math.max(52, Math.min(118, Math.floor(Math.min(maxTileW, maxTileH))));
        setAnimalTileSize(clamped);
        return;
      }

      const cols = Math.min(rowCap, currentStop.answer);
      const rows = Math.max(1, Math.ceil(currentStop.answer / rowCap));
      const maxTileW = (availW - (cols - 1) * gap) / Math.max(1, cols);
      const maxTileH = (availH - (rows - 1) * gap) / rows;
      const maxCap = currentStop.answer <= 2 ? 156 : currentStop.answer <= 5 ? 132 : 116;
      const clamped = Math.max(56, Math.min(maxCap, Math.floor(Math.min(maxTileW, maxTileH))));
      setAnimalTileSize(clamped);
    };

    computeLayout();
    const observer = new ResizeObserver(() => computeLayout());
    observer.observe(element);
    return () => observer.disconnect();
  }, [currentStop]);

  const restartGame = useCallback(() => {
    clearPendingTimers();
    setTrail(buildSafariTrail(config.modeId, config.lengthId));
    setCurrentStopIdx(0);
    setScores(buildInitialScores(players));
    setCurrentPlayerIdx(0);
    setCountedUids([]);
    setNudgedUid(null);
    setTriedNumbers([]);
    setLastWrongNumber(null);
    setNextPlayerName(null);
    setPhase('idle');
  }, [clearPendingTimers, config.lengthId, config.modeId, players]);

  const handleAnimalTap = (animal: SafariAnimalInstance) => {
    if (phase !== 'idle') return;

    const existingIdx = countedUids.indexOf(animal.uid);
    if (existingIdx !== -1) {
      // Gentle bounce reminder showing its already-assigned count badge
      playAnimalNudgeSound(soundEnabled);
      setNudgedUid(animal.uid);
      if (nudgeTimeoutRef.current !== null) {
        window.clearTimeout(nudgeTimeoutRef.current);
      }
      nudgeTimeoutRef.current = window.setTimeout(() => {
        setNudgedUid(null);
      }, 320);
      return;
    }

    const nextCountNumber = countedUids.length + 1;
    playAnimalCountSound(soundEnabled, nextCountNumber);
    setCountedUids((prev) => [...prev, animal.uid]);
  };

  const handleResetCount = () => {
    if (phase !== 'idle') return;
    setCountedUids([]);
  };

  const handleNumberBlockClick = (chosenNumber: number) => {
    if (phase !== 'idle' || !currentStop) return;
    if (triedNumbers.includes(chosenNumber)) return;

    if (chosenNumber === currentStop.answer) {
      // Reveal sequential 1..N count badges across every animal in the clearing for celebration!
      setCountedUids(currentStop.animals.map((a) => a.uid));
      setScores((prev) => ({
        ...prev,
        [activePlayer.id]: (prev[activePlayer.id] ?? 0) + 1,
      }));
      setMatchBurstCount((c) => c + 1);
      setLastWrongNumber(null);
      setPhase('resolving-correct');
      playSafariCorrectSound(soundEnabled);

      clearPendingTimers();
      const isFinalStop = currentStopIdx + 1 >= trail.length;
      if (isFinalStop) {
        timeoutRef.current = window.setTimeout(() => {
          setPhase('finished');
          playSafariWinSound(soundEnabled);
        }, 820);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setCurrentStopIdx((idx) => idx + 1);
          setCurrentPlayerIdx((idx) => (idx + 1) % players.length);
          setCountedUids([]);
          setTriedNumbers([]);
          setPhase('idle');
        }, 940);
      }
      return;
    }

    // Gentle non-punitive feedback when a wrong block is tapped
    setTriedNumbers((prev) => [...prev, chosenNumber]);
    setLastWrongNumber(chosenNumber);
    setPhase('resolving-wrong');
    playSafariTryAgainSound(soundEnabled);

    clearPendingTimers();
    if (players.length > 1) {
      const nextIdx = (currentPlayerIdx + 1) % players.length;
      setNextPlayerName(players[nextIdx]?.name ?? activePlayer.name);
      timeoutRef.current = window.setTimeout(() => {
        setCurrentPlayerIdx(nextIdx);
        setLastWrongNumber(null);
        setNextPlayerName(null);
        setPhase('idle');
      }, 920);
    } else {
      setThinkAgainHint(
        'Tap each animal on the clearing to count 1, 2, 3… then pick the matching number!',
      );
    }
  };

  const standings: PlayerStanding[] = players.map((player) => ({
    profile: player,
    score: scores[player.id] ?? 0,
  }));

  const completedStopsCount =
    phase === 'finished'
      ? trail.length
      : phase === 'resolving-correct'
        ? currentStopIdx + 1
        : currentStopIdx;

  let bannerClass = 'status-banner';
  let bannerText =
    countedUids.length > 0
      ? `${activePlayer.name} counted ${countedUids.length} — keep tapping or pick a number block!`
      : `${activePlayer.name}'s Turn — Tap animals to count, then pick a block`;

  if (phase === 'resolving-correct' && currentStop) {
    bannerClass = 'status-banner status-banner--match';
    bannerText =
      players.length === 1
        ? `SPOT ON! ${currentStop.celebrationDetail}`
        : `SPOT ON! +1 POINT — ${currentStop.celebrationDetail}`;
  } else if (phase === 'resolving-wrong') {
    bannerClass = 'status-banner status-banner--mismatch';
    bannerText =
      players.length > 1 && nextPlayerName
        ? `Not ${lastWrongNumber ?? ''} — ${nextPlayerName}'s turn to count!`
        : `That's ${lastWrongNumber ?? ''} — tap each animal to count together!`;
  }

  const numberBlocks = useMemo(() => {
    const blocks: number[] = [];
    for (let n = 1; n <= modeSpec.maxNumber; n += 1) {
      blocks.push(n);
    }
    return blocks;
  }, [modeSpec.maxNumber]);

  const leftAnimals = useMemo(
    () => currentStop?.animals.filter((a) => a.groupIndex === 0) ?? [],
    [currentStop],
  );
  const rightAnimals = useMemo(
    () => currentStop?.animals.filter((a) => a.groupIndex === 1) ?? [],
    [currentStop],
  );

  const renderAnimalRows = (groupItems: readonly SafariAnimalInstance[]) => {
    const rows = splitIntoRows(groupItems, maxColsPerRow);
    return rows.map((row, rowIdx) => (
      <div key={`row-${rowIdx}`} className="safari-animal-row">
        {row.map((animal, colIdx) => {
          const countIdx = countedUids.indexOf(animal.uid);
          const isCounted = countIdx !== -1;
          const badgeNum = isCounted ? countIdx + 1 : null;
          const isCelebrating = phase === 'resolving-correct';
          const isNudged = nudgedUid === animal.uid;

          return (
            <button
              key={animal.uid}
              type="button"
              className={`safari-animal-card ${isCounted ? 'safari-animal-card--counted' : ''} ${
                isCelebrating ? 'safari-animal-card--celebrating' : ''
              } ${isNudged ? 'safari-animal-card--nudged' : ''}`}
              style={{ width: animalTileSize, height: animalTileSize }}
              onClick={() => handleAnimalTap(animal)}
              disabled={phase !== 'idle'}
              aria-label={
                isCounted
                  ? `${animal.label}, counted number ${badgeNum}`
                  : `Tap to count ${animal.label} ${rowIdx * maxColsPerRow + colIdx + 1}`
              }
              aria-pressed={isCounted}
            >
              <img
                className="safari-animal-card__img"
                src={animal.imageSrc}
                alt={animal.label}
                loading="eager"
              />
              {badgeNum !== null && (
                <span className="safari-count-badge" aria-hidden="true">
                  {badgeNum}
                </span>
              )}
            </button>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="app-shell app-shell--board">
      <ConfettiBurst
        active={matchBurstCount > 0 && phase === 'resolving-correct'}
        mode="match"
        burstKey={matchBurstCount}
      />

      {/* Compact Top Utility Bar */}
      <header className="top-bar" style={{ minHeight: 42 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            aria-label={journeyContext ? 'Back to Activity Book' : 'Back to Game Hub'}
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          <BrandLogo size="sm" />
        </div>

        <div className="top-bar__right">
          {journeyContext && (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          )}
          <span
            className="section-pill"
            aria-label={`Safari stop ${Math.min(trail.length, currentStopIdx + 1)} of ${trail.length}`}
          >
            Stop: <strong>{Math.min(trail.length, currentStopIdx + 1)}</strong>/{lengthSpec.stops}
          </span>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
            >
              <span>Setup</span>
            </button>
          )}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={restartGame}
          >
            <span>Restart</span>
          </button>
        </div>
      </header>

      {/* Prominent Multi-Player Scoreboard HUD */}
      <section
        className={`scoreboard-hud scoreboard-hud--${players.length}`}
        aria-label="Scoreboard"
      >
        {players.map((player, index) => {
          const isTurn = index === currentPlayerIdx % players.length && phase !== 'finished';
          const isCelebrating = isTurn && phase === 'resolving-correct';
          const score = scores[player.id] ?? 0;

          return (
            <div
              key={player.id}
              className={`player-score-card ${isTurn ? 'player-score-card--active' : ''} ${
                isCelebrating ? 'player-score-card--celebrating' : ''
              }`}
            >
              <div className="player-score-card__identity">
                <img
                  className="player-score-card__avatar"
                  src={getAvatarSrc(player.avatar)}
                  alt=""
                />
                <div className="player-score-card__meta">
                  <span className="player-score-card__name">{player.name}</span>
                  {isCelebrating ? (
                    <span className="turn-badge turn-badge--match">
                      {players.length === 1 ? 'Great Count!' : '+1 Point!'}
                    </span>
                  ) : isTurn ? (
                    <span className="turn-badge">Your Turn</span>
                  ) : (
                    <span className="turn-badge turn-badge--idle">Waiting</span>
                  )}
                </div>
              </div>

              <div
                className="pts-tile"
                aria-label={
                  players.length === 1
                    ? `${score} of ${trail.length} stops`
                    : `${player.name} ${score} points`
                }
              >
                <span className="pts-tile__value">
                  {players.length === 1 ? `${score}/${trail.length}` : score}
                </span>
                <span className="pts-tile__label">
                  {players.length === 1 ? 'STOPS' : 'PTS'}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Fixed-Height Celebration / Turn Banner */}
      <div className={bannerClass} role="status" aria-live="polite">
        <span>{bannerText}</span>
      </div>

      {/* Main Portrait Safari Stage: Savanna Clearing + Tactile Number Block Tray */}
      <main className="safari-stage">
        <section className="safari-clearing" aria-label="Savanna animal clearing">
          <SavannaLeafCorner className="safari-leaf safari-leaf--tl" />
          <SavannaLeafCorner className="safari-leaf safari-leaf--br" />

          <div className="safari-clearing__header">
            <div className="safari-clearing__prompt-wrap">
              {currentStop?.kind === 'addition' && (
                <span className="safari-equation-pill" aria-label={`${currentStop.leftCount} plus ${currentStop.rightCount}`}>
                  <span>{currentStop.leftCount}</span>
                  <span className="safari-equation-pill__op">+</span>
                  <span>{currentStop.rightCount}</span>
                  <span className="safari-equation-pill__op">=</span>
                  <span className="safari-equation-pill__q">
                    {phase === 'resolving-correct' ? currentStop.answer : '?'}
                  </span>
                </span>
              )}
              <h2 className="safari-clearing__prompt">{currentStop?.promptText}</h2>
            </div>

            <div className="safari-clearing__counter">
              {countedUids.length > 0 ? (
                <>
                  <span className="badge-pill badge-pill--mint">
                    Counted: {countedUids.length}
                  </span>
                  {phase === 'idle' && (
                    <button
                      type="button"
                      className="safari-reset-count-btn"
                      onClick={handleResetCount}
                    >
                      Clear
                    </button>
                  )}
                </>
              ) : (
                <span className="safari-tap-hint">Tap animals to count 1, 2, 3…</span>
              )}
            </div>
          </div>

          <div ref={clearingBodyRef} className="safari-clearing__body">
            {currentStop?.kind === 'addition' ? (
              <div className="safari-addition-groups">
                <div className="safari-group-pod">
                  <div className="safari-animal-rows">{renderAnimalRows(leftAnimals)}</div>
                </div>

                <div className="safari-plus-medallion" aria-hidden="true">
                  <span>+</span>
                </div>

                <div className="safari-group-pod safari-group-pod--warm">
                  <div className="safari-animal-rows">{renderAnimalRows(rightAnimals)}</div>
                </div>
              </div>
            ) : (
              <div className="safari-animal-rows">{renderAnimalRows(leftAnimals)}</div>
            )}
          </div>
        </section>

        {/* Tactile Wooden / River-Pebble Number Block Tray */}
        <section
          className={`safari-block-tray safari-block-tray--${modeSpec.maxNumber}`}
          aria-label="Number blocks"
        >
          {numberBlocks.map((num) => {
            const isTriedWrong = triedNumbers.includes(num);
            const isJustWrong = lastWrongNumber === num && phase === 'resolving-wrong';
            const isCorrectWinner =
              phase === 'resolving-correct' && currentStop?.answer === num;

            return (
              <button
                key={num}
                type="button"
                className={`safari-num-block ${
                  isCorrectWinner ? 'safari-num-block--correct' : ''
                } ${isTriedWrong ? 'safari-num-block--wrong' : ''} ${
                  isJustWrong ? 'safari-num-block--shake' : ''
                }`}
                onClick={() => handleNumberBlockClick(num)}
                disabled={phase !== 'idle' || isTriedWrong}
                aria-label={`Number ${num}${isTriedWrong ? ' (already tried)' : ''}`}
              >
                <span className="safari-num-block__digit">{num}</span>
                <NumberBlockPips count={num} active={isCorrectWinner} />
              </button>
            );
          })}
        </section>
      </main>

      {phase === 'finished' && !journeyContext && (
        <WinnerModal
          standings={standings}
          totalPairs={completedStopsCount}
          themeTitle={modeSpec.title}
          unitLabel="safari stops"
          soloVerb="completed"
          onPlayAgain={restartGame}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}

      <ThinkAgainOverlay
        open={thinkAgainHint !== null}
        hint={thinkAgainHint ?? undefined}
        soundEnabled={soundEnabled}
        onReady={() => {
          setThinkAgainHint(null);
          setLastWrongNumber(null);
          setPhase('idle');
        }}
      />
    </div>
  );
}

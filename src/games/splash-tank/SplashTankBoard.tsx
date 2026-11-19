import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import {
  generateSplashPrompt,
  getSplashModeSpec,
  isValidSplashModeId,
  isValidSplashRoundLength,
  recordSplashPipeFill,
  recordSplashRoundFinished,
  SPLASH_TANK_SESSION_KEY,
  type SplashTankConfig,
  type SplashTankPrompt,
} from './tankData';
import {
  playSplashExactChime,
  playSplashMistakeTap,
  playSplashNumberVoice,
  playSplashPourStart,
  playSplashRoundFanfare,
  preloadSplashAssets,
} from './tankSounds';
import './SplashTank.css';

interface SplashTankBoardProps {
  gameKey?: number | string;
  config: SplashTankConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'playing' | 'celebrating' | 'teach-mistake' | 'think-again' | 'won';

interface PersistedSplashSession {
  version: 1;
  modeId: SplashTankConfig['modeId'];
  roundLength: SplashTankConfig['roundLength'];
  solvedCount: number;
  mistakes: number;
  firstTryCount: number;
  totalAttempts: number;
  currentPrompt: SplashTankPrompt;
}

interface DragState {
  value: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  overTank: boolean;
}

function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H2v6h4l5 4V5z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M23 9l-6 6M17 9l6 6"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function WaterwheelGlyph({ spinning, size = 56 }: { spinning: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`st-wheel-svg ${spinning ? 'is-spinning' : ''}`}
    >
      <circle cx="32" cy="32" r="21" fill="#FFFDF8" stroke="#5B5BD6" strokeWidth="4.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 32 32)`}>
          <line x1="32" y1="11" x2="32" y2="53" stroke="#5B5BD6" strokeWidth="3.2" />
          <rect x="27" y="6" width="10" height="6" rx="3" fill="#F2B84B" />
        </g>
      ))}
      <circle cx="32" cy="32" r="7" fill="#3BA99C" stroke="#FFFFFF" strokeWidth="2.5" />
    </svg>
  );
}

// TODO(security): Pebble runs locally as a static client-only PWA; all restored sessionStorage
// prompt objects and counters are validated against strict allow-lists and bounds.
function tryRestoreSplashSession(config: SplashTankConfig): PersistedSplashSession | null {
  try {
    const raw = window.sessionStorage.getItem(SPLASH_TANK_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSplashSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !isValidSplashModeId(parsed.modeId) ||
      parsed.modeId !== config.modeId ||
      !isValidSplashRoundLength(parsed.roundLength) ||
      parsed.roundLength !== config.roundLength ||
      typeof parsed.solvedCount !== 'number' ||
      !Number.isInteger(parsed.solvedCount) ||
      parsed.solvedCount < 0 ||
      parsed.solvedCount >= config.roundLength ||
      !parsed.currentPrompt ||
      typeof parsed.currentPrompt !== 'object'
    ) {
      return null;
    }

    const p = parsed.currentPrompt as Partial<SplashTankPrompt>;
    const tankMax = p.tankMax === 20 ? 20 : p.tankMax === 10 ? 10 : null;
    if (
      tankMax === null ||
      typeof p.startLevel !== 'number' ||
      !Number.isInteger(p.startLevel) ||
      p.startLevel < 1 ||
      p.startLevel >= tankMax ||
      typeof p.targetLevel !== 'number' ||
      !Number.isInteger(p.targetLevel) ||
      p.targetLevel <= p.startLevel ||
      p.targetLevel > tankMax ||
      !Array.isArray(p.buckets) ||
      p.buckets.length !== 4 ||
      !p.buckets.every(
        (b) => typeof b === 'number' && Number.isInteger(b) && b >= 1 && b <= 20,
      )
    ) {
      return null;
    }

    const clamp = (v: unknown, max: number) =>
      typeof v === 'number' && Number.isFinite(v)
        ? Math.max(0, Math.min(max, Math.floor(v)))
        : 0;

    return {
      version: 1,
      modeId: config.modeId,
      roundLength: config.roundLength,
      solvedCount: parsed.solvedCount,
      mistakes: clamp(parsed.mistakes, 999),
      firstTryCount: clamp(parsed.firstTryCount, config.roundLength),
      totalAttempts: clamp(parsed.totalAttempts, 999),
      currentPrompt: {
        uid: typeof p.uid === 'string' && p.uid.length <= 48 ? p.uid : 'st-restored',
        startLevel: p.startLevel,
        targetLevel: p.targetLevel,
        missingAddend: p.targetLevel - p.startLevel,
        tankMax,
        buckets: p.buckets,
      },
    };
  } catch {
    return null;
  }
}

function saveSplashSession(state: PersistedSplashSession): void {
  try {
    window.sessionStorage.setItem(SPLASH_TANK_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function clearSplashSession(): void {
  try {
    window.sessionStorage.removeItem(SPLASH_TANK_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function SplashTankBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: SplashTankBoardProps) {
  const restored = useMemo(() => tryRestoreSplashSession(config), [config]);

  const [solvedCount, setSolvedCount] = useState<number>(restored?.solvedCount ?? 0);
  const [mistakes, setMistakes] = useState<number>(restored?.mistakes ?? 0);
  const [firstTryCount, setFirstTryCount] = useState<number>(restored?.firstTryCount ?? 0);
  const [totalAttempts, setTotalAttempts] = useState<number>(restored?.totalAttempts ?? 0);
  const [prompt, setPrompt] = useState<SplashTankPrompt>(
    () => restored?.currentPrompt ?? generateSplashPrompt(config.modeId),
  );
  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [pouredBucket, setPouredBucket] = useState<number | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const tankDropRef = useRef<HTMLDivElement | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const pipeMistakesRef = useRef<number>(0);
  const teachTimerRef = useRef<number | null>(null);
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;

  const modeSpec = useMemo(() => getSplashModeSpec(config.modeId), [config.modeId]);

  const clearPendingTimers = useCallback(() => {
    if (teachTimerRef.current !== null) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    voiceCleanupRef.current?.();
    voiceCleanupRef.current = null;
  }, []);

  useEffect(() => {
    preloadSplashAssets();
  }, []);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'won');
    return () => {
      onGameActiveChange?.(false);
    };
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  useEffect(() => {
    if (phase === 'won') {
      clearSplashSession();
      return;
    }
    saveSplashSession({
      version: 1,
      modeId: config.modeId,
      roundLength: config.roundLength,
      solvedCount,
      mistakes,
      firstTryCount,
      totalAttempts,
      currentPrompt: prompt,
    });
  }, [
    config.modeId,
    config.roundLength,
    firstTryCount,
    mistakes,
    phase,
    prompt,
    solvedCount,
    totalAttempts,
  ]);

  const handlePourBucket = useCallback(
    (bucketValue: number) => {
      if (phase !== 'playing') return;
      clearPendingTimers();
      setDragState(null);

      const nextAttempts = totalAttempts + 1;
      setTotalAttempts(nextAttempts);
      setPouredBucket(bucketValue);
      playSplashPourStart(soundEnabled);

      const resultingLevel = prompt.startLevel + bucketValue;

      if (resultingLevel === prompt.targetLevel) {
        const isFirstTry = pipeMistakesRef.current === 0;
        const nextSolved = solvedCount + 1;
        const nextFirstTry = firstTryCount + (isFirstTry ? 1 : 0);

        setFirstTryCount(nextFirstTry);
        setPhase('celebrating');
        setConfettiKey((k) => k + 1);

        recordSplashPipeFill(isFirstTry);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'splash-tank',
          conceptId: `delta:${prompt.startLevel}+?=${prompt.targetLevel}`,
          conceptLabel: `${prompt.startLevel} + ${prompt.missingAddend} = ${prompt.targetLevel}`,
          skillType: 'group_joining',
          correct: isFirstTry,
          attemptsTaken: pipeMistakesRef.current + 1,
        });

        playSplashExactChime(solvedCount, soundEnabled);

        voiceCleanupRef.current = playSplashNumberVoice(
          prompt.missingAddend,
          soundEnabled,
          () => {
            teachTimerRef.current = window.setTimeout(() => {
              if (nextSolved >= config.roundLength) {
                const roundFlawless = mistakes === 0;
                recordSplashRoundFinished(roundFlawless);
                recordLearningSession({
                  playerId: childProfile.id,
                  gameId: 'splash-tank',
                  mode: config.modeId,
                  totalAttempts: nextAttempts,
                  correctAttempts: nextSolved,
                  mistakes,
                  flawless: roundFlawless,
                  durationMs: Date.now() - sessionStartRef.current,
                  conceptsTested: [`${modeSpec.classBadge}:${modeSpec.title}`],
                });
                setSolvedCount(nextSolved);
                setPhase('won');
                setConfettiKey((k) => k + 1);
                playSplashRoundFanfare(roundFlawless, soundEnabled);
                journeyOnCompleteRef.current?.();
              } else {
                pipeMistakesRef.current = 0;
                setSolvedCount(nextSolved);
                setPouredBucket(null);
                setPrompt(
                  generateSplashPrompt(
                    config.modeId,
                    `${prompt.startLevel}->${prompt.targetLevel}`,
                  ),
                );
                setPhase('playing');
              }
            }, 500);
          },
        );
        return;
      }

      // Overflow or Underfill -> Step 1: Teach-First on visible board (~2.5s, input locked)
      pipeMistakesRef.current += 1;
      setMistakes((m) => m + 1);
      setPhase('teach-mistake');
      playSplashMistakeTap(soundEnabled);

      teachTimerRef.current = window.setTimeout(() => {
        setPhase('think-again');
      }, 2500);
    },
    [
      childProfile.id,
      clearPendingTimers,
      config.modeId,
      config.roundLength,
      firstTryCount,
      mistakes,
      modeSpec.classBadge,
      modeSpec.title,
      phase,
      prompt.missingAddend,
      prompt.startLevel,
      prompt.targetLevel,
      solvedCount,
      soundEnabled,
      totalAttempts,
    ],
  );

  // Pointer drag-and-drop + tap support for buckets
  const isPointOverTank = useCallback((clientX: number, clientY: number): boolean => {
    const el = tankDropRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      clientX >= rect.left - 24 &&
      clientX <= rect.right + 24 &&
      clientY >= rect.top - 24 &&
      clientY <= rect.bottom + 24
    );
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const moved = dragState.moved || Math.hypot(dx, dy) > 10;
      const overTank = isPointOverTank(e.clientX, e.clientY);
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX,
              y: e.clientY,
              moved,
              overTank,
            }
          : null,
      );
    };

    const handleUp = (e: PointerEvent) => {
      const overTank = isPointOverTank(e.clientX, e.clientY);
      const val = dragState.value;
      const wasTap = !dragState.moved;
      setDragState(null);
      if (wasTap || overTank) {
        handlePourBucket(val);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragState, handlePourBucket, isPointOverTank]);

  const handleReadyAfterThinkAgain = () => {
    clearPendingTimers();
    setPouredBucket(null);
    setPhase('playing');
  };

  const handlePlayAgain = () => {
    clearPendingTimers();
    clearSplashSession();
    sessionStartRef.current = Date.now();
    pipeMistakesRef.current = 0;
    setSolvedCount(0);
    setMistakes(0);
    setFirstTryCount(0);
    setTotalAttempts(0);
    setPouredBucket(null);
    setPrompt(generateSplashPrompt(config.modeId));
    setPhase('playing');
  };

  // Water level computation
  const currentTotal =
    pouredBucket !== null ? prompt.startLevel + pouredBucket : prompt.startLevel;
  const isOverflow = pouredBucket !== null && currentTotal > prompt.targetLevel;
  const isUnderfill = pouredBucket !== null && currentTotal < prompt.targetLevel;
  const isExact = pouredBucket !== null && currentTotal === prompt.targetLevel;

  const clampedFillLevel = Math.min(prompt.tankMax, currentTotal);
  const startPct = (prompt.startLevel / prompt.tankMax) * 100;
  const fillPct = (clampedFillLevel / prompt.tankMax) * 100;
  const targetPct = (prompt.targetLevel / prompt.tankMax) * 100;
  const overflowZoneHeightPct = Math.max(0, 100 - targetPct);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let n = prompt.tankMax; n >= 1; n -= 1) {
      arr.push(n);
    }
    return arr;
  }, [prompt.tankMax]);

  const mistakeHint = useMemo(() => {
    if (pouredBucket === null) return '';
    const sum = prompt.startLevel + pouredBucket;
    if (sum > prompt.targetLevel) {
      return `${prompt.startLevel} + ${pouredBucket} = ${sum} — that overflowed past ${prompt.targetLevel}! From ${prompt.startLevel} to ${prompt.targetLevel} needs ${prompt.missingAddend}.`;
    }
    return `${prompt.startLevel} + ${pouredBucket} = ${sum} — too low for ${prompt.targetLevel}! From ${prompt.startLevel} to ${prompt.targetLevel} needs ${prompt.missingAddend}.`;
  }, [pouredBucket, prompt.missingAddend, prompt.startLevel, prompt.targetLevel]);

  return (
    <div className="app-shell app-shell--board">
      <ConfettiBurst
        active={phase === 'celebrating' || phase === 'won'}
        mode={phase === 'won' ? 'win' : 'match'}
        burstKey={confettiKey}
      />

      <header className="top-bar">
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="splash-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onChangeSetup}
            data-testid="splash-setup-btn"
          >
            Setup
          </button>
        </div>

        <BrandLogo size="sm" />

        <div className="top-bar__right">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <SpeakerIcon muted={!soundEnabled} />
          </button>
          <GameHelpButton onClick={onRequestHelp} />
        </div>
      </header>

      <main className="st-board-stage" data-testid="splash-tank-board">
        {phase === 'won' ? (
          <section className="st-win-card" data-testid="splash-win-card">
            <WaterwheelGlyph spinning size={72} />
            <h2>All Tanks Filled!</h2>
            <p>
              Awesome job, {childProfile.name}! You filled {config.roundLength} tanks right to the
              target{firstTryCount > 0 ? ` with ${firstTryCount} exact first-tries!` : '!'}
            </p>
            {mistakes === 0 && (
              <span className="st-stat-chip st-stat-chip--honey">
                <CrownIcon size={16} />
                <span>Zero-Spill Master Plumber!</span>
              </span>
            )}
            <div className="st-win-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handlePlayAgain}
                data-testid="splash-play-again-btn"
              >
                Play Again
              </button>
              <button type="button" className="btn-secondary" onClick={onBackToHub}>
                All Games
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Top Status & Equation Strip */}
            <div className="st-status-strip">
              <div className="st-progress-pills">
                <span className="st-progress-badge" data-testid="splash-progress-badge">
                  Tank {Math.min(solvedCount + 1, config.roundLength)} of {config.roundLength}
                </span>
                <span
                  className={`st-perfect-badge ${mistakes === 0 ? 'is-intact' : 'is-dimmed'}`}
                >
                  <CrownIcon size={14} />
                  <span>{mistakes === 0 ? 'Perfect Run' : 'Keep Going!'}</span>
                </span>
              </div>

              <div className="st-equation-pill" data-testid="splash-equation-pill">
                <span className="st-eq-start">{prompt.startLevel}</span>
                <span className="st-eq-op">+</span>
                <span
                  className={`st-eq-slot ${isExact ? 'is-exact' : ''} ${
                    isOverflow || isUnderfill ? 'is-mistake' : ''
                  }`}
                >
                  {pouredBucket !== null ? pouredBucket : '?'}
                </span>
                <span className="st-eq-op">=</span>
                <span className="st-eq-target">{prompt.targetLevel}</span>
              </div>
            </div>

            {/* Center Graduated Water Tank Stage */}
            <section
              ref={tankDropRef}
              className={`st-tank-stage ${dragState?.overTank ? 'is-drop-ready' : ''}`}
              aria-label={`Graduated water tank from 1 to ${prompt.tankMax}, currently at ${prompt.startLevel}, target ${prompt.targetLevel}`}
            >
              <div className="st-tank-assembly">
                {/* Waterwheel sitting above the tank */}
                <div className="st-wheel-mount">
                  <WaterwheelGlyph spinning={phase === 'celebrating'} size={54} />
                </div>

                <div className="st-tank-body-row">
                  {/* Left Scale Numbers */}
                  <div
                    className={`st-scale-col ${prompt.tankMax === 20 ? 'is-20' : ''}`}
                    aria-hidden="true"
                  >
                    {ticks.map((n) => (
                      <div
                        key={n}
                        className={`st-scale-tick ${
                          n === prompt.targetLevel ? 'is-target' : ''
                        } ${n === prompt.startLevel ? 'is-start' : ''}`}
                      >
                        <span>{n}</span>
                        <span className="st-tick-line" />
                      </div>
                    ))}
                  </div>

                  {/* Graduated Glass Pipe / Tank */}
                  <div
                    className={`st-tank-vessel ${isOverflow ? 'is-overflow' : ''} ${
                      isExact ? 'is-exact' : ''
                    }`}
                    data-testid="splash-tank-vessel"
                  >
                    {/* Overflow Zone above Target */}
                    {overflowZoneHeightPct > 0 && (
                      <div
                        className="st-overflow-zone"
                        style={{ height: `${overflowZoneHeightPct}%` }}
                      >
                        <span className="st-overflow-label">OVERFLOW ZONE</span>
                      </div>
                    )}

                    {/* Calm spill ripple if overflowed */}
                    {isOverflow && <div className="st-calm-spill" aria-hidden="true" />}

                    {/* Starting Water Level (A) */}
                    <div
                      className="st-water-start"
                      style={{ height: `${startPct}%` }}
                      aria-hidden="true"
                    />

                    {/* Added Water Level (A + B) */}
                    <div
                      className={`st-water-added ${isOverflow ? 'is-overflow' : ''} ${
                        isExact ? 'is-exact' : ''
                      }`}
                      style={{ height: `${fillPct}%` }}
                      aria-hidden="true"
                    >
                      <div className="st-water-surface" />
                    </div>

                    {/* Teach-First Gap Highlight Bracket (A -> T) */}
                    {phase === 'teach-mistake' && (
                      <div
                        className="st-gap-bracket"
                        style={{
                          bottom: `${startPct}%`,
                          height: `${targetPct - startPct}%`,
                        }}
                      >
                        <span>+{prompt.missingAddend} needed</span>
                      </div>
                    )}

                    {/* Target Line & Flag at T */}
                    <div
                      className="st-target-line"
                      style={{ bottom: `${targetPct}%` }}
                      data-testid="splash-target-line"
                    >
                      <span className="st-target-flag">TARGET {prompt.targetLevel}</span>
                    </div>

                    {/* Starting Level Marker */}
                    <div className="st-start-tag" style={{ bottom: `${startPct}%` }}>
                      <span>Start {prompt.startLevel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Context Teach-First / Celebration Banner */}
              <div
                className={`st-feedback-banner ${
                  phase === 'celebrating' ? 'is-success' : ''
                } ${phase === 'teach-mistake' ? 'is-teach' : ''}`}
                aria-live="polite"
                data-testid="splash-feedback-banner"
              >
                {phase === 'celebrating' ? (
                  <span>
                    Splash! {prompt.startLevel} + {prompt.missingAddend} = {prompt.targetLevel} —
                    Exact Fill!
                  </span>
                ) : phase === 'teach-mistake' ? (
                  <span>{mistakeHint}</span>
                ) : (
                  <span>
                    Water is at <strong>{prompt.startLevel}</strong>. Pour a bucket to reach{' '}
                    <strong>{prompt.targetLevel}</strong> without spilling!
                  </span>
                )}
              </div>
            </section>

            {/* Bottom 4 Capacity Bucket Options (Tap or Drag) */}
            <section className="st-bucket-tray" aria-label="Capacity buckets">
              {prompt.buckets.map((val) => {
                const maxBucketVis = prompt.tankMax === 10 ? 10 : 12;
                const waterPct = Math.min(92, Math.max(16, (val / maxBucketVis) * 100));
                const isDraggingThis = dragState?.value === val && dragState.moved;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={phase !== 'playing'}
                    className={`st-bucket-btn ${isDraggingThis ? 'is-dragging' : ''} ${
                      pouredBucket === val && phase === 'celebrating' ? 'is-correct' : ''
                    } ${pouredBucket === val && phase === 'teach-mistake' ? 'is-wrong' : ''}`}
                    data-testid={`splash-bucket-${val}`}
                    aria-label={`Pour ${val} units`}
                    onPointerDown={(e) => {
                      if (phase !== 'playing') return;
                      e.preventDefault();
                      setDragState({
                        value: val,
                        startX: e.clientX,
                        startY: e.clientY,
                        x: e.clientX,
                        y: e.clientY,
                        moved: false,
                        overTank: false,
                      });
                    }}
                  >
                    <div className="st-bucket-cup" aria-hidden="true">
                      <div
                        className="st-bucket-water"
                        style={{ height: `${waterPct}%` }}
                      />
                      <span className="st-bucket-num">{val}</span>
                    </div>
                    <span className="st-bucket-label">+{val}</span>
                  </button>
                );
              })}
            </section>
          </>
        )}
      </main>

      {/* Floating Drag Ghost */}
      {dragState?.moved && (
        <div
          className={`st-drag-ghost ${dragState.overTank ? 'is-over-tank' : ''}`}
          style={{
            left: dragState.x,
            top: dragState.y,
          }}
          aria-hidden="true"
        >
          <span>+{dragState.value}</span>
        </div>
      )}

      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Let's take a calm breath and try this tank again!"
        hint={mistakeHint}
        readyLabel="Try This Tank"
        onStartAgain={handlePlayAgain}
        startAgainLabel="New Round"
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleReadyAfterThinkAgain}
      />
    </div>
  );
}

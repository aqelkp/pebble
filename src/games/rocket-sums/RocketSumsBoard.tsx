import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import {
  generateRocketPrompt,
  getRocketItemSpec,
  getRocketModeSpec,
  getRocketPadNumbers,
  isValidRocketItemId,
  isValidRocketModeId,
  isValidRocketRoundLength,
  isValidRocketVisualMode,
  recordRocketPromptSolve,
  recordRocketRoundFinished,
  recordRocketTimeoutStat,
  ROCKET_ACTIVE_SESSION_KEY,
  ROCKET_FAST_THRESHOLD_MS,
  ROCKET_ROUND_SECONDS,
  type RocketPromptSpec,
  type RocketSumsConfig,
} from './rocketData';
import {
  playRocketAnswerVoice,
  playRocketCorrectChime,
  playRocketLaunchFanfare,
  playRocketTimeoutPauseChime,
  playRocketWrongTap,
  preloadRocketAssets,
} from './rocketSounds';
import './RocketSums.css';

interface RocketSumsBoardProps {
  gameKey?: number | string;
  config: RocketSumsConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'playing' | 'celebrating' | 'timeout-reveal' | 'teach-mistake' | 'think-again' | 'won';

interface PersistedRocketSession {
  version: 1;
  modeId: RocketSumsConfig['modeId'];
  visualMode: RocketSumsConfig['visualMode'];
  roundLength: RocketSumsConfig['roundLength'];
  solvedCount: number;
  mistakes: number;
  fastCount: number;
  totalAttempts: number;
  currentPrompt: RocketPromptSpec;
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

function RocketGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 5C31 11 35 19 35 28L29 34H19L13 28C13 19 17 11 24 5Z"
        fill="#F27A5E"
        stroke="#2E3552"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="20" r="5" fill="#E4F6F3" stroke="#3BA99C" strokeWidth="2.5" />
      <path d="M13 25L7 32L14 33" fill="#5B5BD6" stroke="#2E3552" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M35 25L41 32L34 33" fill="#5B5BD6" stroke="#2E3552" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20 35L24 44L28 35Z" fill="#F2B84B" />
    </svg>
  );
}

// TODO(security): Pebble runs locally as a static client-only PWA; all restored sessionStorage
// prompt objects and counters are validated against strict allow-lists and bounds.
function tryRestoreRocketSession(config: RocketSumsConfig): PersistedRocketSession | null {
  try {
    const raw = window.sessionStorage.getItem(ROCKET_ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedRocketSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !isValidRocketModeId(parsed.modeId) ||
      parsed.modeId !== config.modeId ||
      !isValidRocketVisualMode(parsed.visualMode) ||
      parsed.visualMode !== config.visualMode ||
      !isValidRocketRoundLength(parsed.roundLength) ||
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

    const p = parsed.currentPrompt as Partial<RocketPromptSpec>;
    if (
      typeof p.left !== 'number' ||
      !Number.isInteger(p.left) ||
      p.left < 0 ||
      p.left > 30 ||
      typeof p.right !== 'number' ||
      !Number.isInteger(p.right) ||
      p.right < 0 ||
      p.right > 30 ||
      !isValidRocketItemId(p.itemId)
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
      visualMode: config.visualMode,
      roundLength: config.roundLength,
      solvedCount: parsed.solvedCount,
      mistakes: clamp(parsed.mistakes, 999),
      fastCount: clamp(parsed.fastCount, config.roundLength),
      totalAttempts: clamp(parsed.totalAttempts, 999),
      currentPrompt: {
        uid: typeof p.uid === 'string' && p.uid.length <= 48 ? p.uid : 'rs-restored',
        left: p.left,
        right: p.right,
        answer: p.left + p.right,
        itemId: p.itemId,
      },
    };
  } catch {
    return null;
  }
}

function saveRocketSession(state: PersistedRocketSession): void {
  try {
    window.sessionStorage.setItem(ROCKET_ACTIVE_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function clearRocketSession(): void {
  try {
    window.sessionStorage.removeItem(ROCKET_ACTIVE_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function RocketSumsBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: RocketSumsBoardProps) {
  const restored = useMemo(() => tryRestoreRocketSession(config), [config]);

  const [solvedCount, setSolvedCount] = useState<number>(restored?.solvedCount ?? 0);
  const [mistakes, setMistakes] = useState<number>(restored?.mistakes ?? 0);
  const [fastCount, setFastCount] = useState<number>(restored?.fastCount ?? 0);
  const [totalAttempts, setTotalAttempts] = useState<number>(restored?.totalAttempts ?? 0);
  const [prompt, setPrompt] = useState<RocketPromptSpec>(
    () => restored?.currentPrompt ?? generateRocketPrompt(config.modeId),
  );
  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [selectedWrong, setSelectedWrong] = useState<number | null>(null);
  const [lastWasFast, setLastWasFast] = useState<boolean>(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(ROCKET_ROUND_SECONDS * 1000);
  const [confettiKey, setConfettiKey] = useState<number>(0);

  const sessionStartRef = useRef<number>(Date.now());
  const promptStartRef = useRef<number>(Date.now());
  const promptMistakesRef = useRef<number>(0);
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const teachTimerRef = useRef<number | null>(null);
  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;

  const modeSpec = useMemo(() => getRocketModeSpec(config.modeId), [config.modeId]);
  const itemSpec = useMemo(() => getRocketItemSpec(prompt.itemId), [prompt.itemId]);
  const padNumbers = useMemo(
    () => getRocketPadNumbers(config.modeId, prompt.answer),
    [config.modeId, prompt.answer],
  );

  const showPictures =
    config.visualMode === 'pictures-and-numbers' &&
    modeSpec.supportsPictures &&
    prompt.left <= 10 &&
    prompt.right <= 10;

  const clearPendingTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (teachTimerRef.current !== null) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    voiceCleanupRef.current?.();
    voiceCleanupRef.current = null;
  }, []);

  useEffect(() => {
    preloadRocketAssets([prompt]);
  }, [prompt]);

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
      clearRocketSession();
      return;
    }
    saveRocketSession({
      version: 1,
      modeId: config.modeId,
      visualMode: config.visualMode,
      roundLength: config.roundLength,
      solvedCount,
      mistakes,
      fastCount,
      totalAttempts,
      currentPrompt: prompt,
    });
  }, [
    config.modeId,
    config.roundLength,
    config.visualMode,
    fastCount,
    mistakes,
    phase,
    prompt,
    solvedCount,
    totalAttempts,
  ]);

  // 10-second calm fuel timer during active 'playing' phase
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    promptStartRef.current = Date.now();
    setTimeLeftMs(ROCKET_ROUND_SECONDS * 1000);

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - promptStartRef.current;
      const remaining = Math.max(0, ROCKET_ROUND_SECONDS * 1000 - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        recordRocketTimeoutStat();
        playRocketTimeoutPauseChime(soundEnabled);
        setPhase('timeout-reveal');
        voiceCleanupRef.current = playRocketAnswerVoice(prompt.answer, soundEnabled);
      }
    }, 100);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, prompt.answer, prompt.uid, soundEnabled]);

  const handleSelectAnswer = (chosen: number) => {
    if (phase !== 'playing') return;
    clearPendingTimers();

    const responseMs = Date.now() - promptStartRef.current;
    const nextAttempts = totalAttempts + 1;
    setTotalAttempts(nextAttempts);

    if (chosen === prompt.answer) {
      const isFast =
        promptMistakesRef.current === 0 && responseMs <= ROCKET_FAST_THRESHOLD_MS;
      const nextSolved = solvedCount + 1;
      const nextFast = fastCount + (isFast ? 1 : 0);

      setSelectedWrong(null);
      setLastWasFast(isFast);
      setFastCount(nextFast);
      setPhase('celebrating');
      setConfettiKey((k) => k + 1);

      recordRocketPromptSolve(responseMs, isFast);
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'rocket-sums',
        conceptId: `add:${prompt.left}+${prompt.right}`,
        conceptLabel: `${prompt.left} + ${prompt.right} = ${prompt.answer}`,
        skillType: 'group_joining',
        correct: promptMistakesRef.current === 0,
        attemptsTaken: promptMistakesRef.current + 1,
      });

      playRocketCorrectChime(solvedCount, isFast, soundEnabled);

      voiceCleanupRef.current = playRocketAnswerVoice(prompt.answer, soundEnabled, () => {
        teachTimerRef.current = window.setTimeout(() => {
          if (nextSolved >= config.roundLength) {
            const roundFlawless = mistakes === 0;
            recordRocketRoundFinished(roundFlawless);
            recordLearningSession({
              playerId: childProfile.id,
              gameId: 'rocket-sums',
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
            playRocketLaunchFanfare(roundFlawless, soundEnabled);
            journeyOnCompleteRef.current?.();
          } else {
            promptMistakesRef.current = 0;
            setSolvedCount(nextSolved);
            setLastWasFast(false);
            setPrompt(
              generateRocketPrompt(
                config.modeId,
                `${prompt.left}+${prompt.right}`,
                nextSolved,
              ),
            );
            setPhase('playing');
          }
        }, 420);
      });
      return;
    }

    // Wrong answer -> Step 1: Teach-First on visible board (~2.2s, input locked)
    promptMistakesRef.current += 1;
    setMistakes((m) => m + 1);
    setSelectedWrong(chosen);
    setPhase('teach-mistake');
    playRocketWrongTap(soundEnabled);

    voiceCleanupRef.current = playRocketAnswerVoice(prompt.answer, soundEnabled, () => {
      teachTimerRef.current = window.setTimeout(() => {
        setPhase('think-again');
      }, 1100);
    });
  };

  const handleReadyAfterTimeout = () => {
    clearPendingTimers();
    promptMistakesRef.current = 0;
    setSelectedWrong(null);
    setPrompt(
      generateRocketPrompt(
        config.modeId,
        `${prompt.left}+${prompt.right}`,
        solvedCount + 1,
      ),
    );
    setPhase('playing');
  };

  const handleReadyAfterThinkAgain = () => {
    clearPendingTimers();
    setSelectedWrong(null);
    setPhase('playing');
  };

  const handlePlayAgain = () => {
    clearPendingTimers();
    clearRocketSession();
    sessionStartRef.current = Date.now();
    promptMistakesRef.current = 0;
    setSolvedCount(0);
    setMistakes(0);
    setFastCount(0);
    setTotalAttempts(0);
    setSelectedWrong(null);
    setLastWasFast(false);
    setPrompt(generateRocketPrompt(config.modeId));
    setPhase('playing');
  };

  const timerPct = Math.max(0, Math.min(100, (timeLeftMs / (ROCKET_ROUND_SECONDS * 1000)) * 100));
  const timerSecondsDisplay = Math.ceil(timeLeftMs / 1000);

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
            data-testid="rocket-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onChangeSetup}
            data-testid="rocket-setup-btn"
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

      <main className="rs-board-stage" data-testid="rocket-sums-board">
        {phase === 'won' ? (
          <section className="rs-win-card" data-testid="rocket-win-card">
            <RocketGlyph size={68} />
            <h2>Moon Launch Complete!</h2>
            <p>
              Awesome mental math, {childProfile.name}! You solved {config.roundLength} sums
              {fastCount > 0 ? ` with ${fastCount} Turbo Fast recalls!` : '!'}
            </p>
            {mistakes === 0 && (
              <span className="rs-stat-chip rs-stat-chip--honey">
                <CrownIcon size={16} />
                <span>Zero-Mistake Launch Crown!</span>
              </span>
            )}
            <div className="rs-win-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handlePlayAgain}
                data-testid="rocket-play-again-btn"
              >
                Launch Again
              </button>
              <button type="button" className="btn-secondary" onClick={onBackToHub}>
                Back to Games
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="rs-hud-strip">
              <div className="rs-track-rocket">
                <RocketGlyph size={24} />
                <span>
                  {solvedCount} / {config.roundLength}
                </span>
              </div>
              <div className="rs-track" aria-label={`Progress ${solvedCount} of ${config.roundLength}`}>
                {Array.from({ length: config.roundLength }, (_, idx) => {
                  const isDone = idx < solvedCount;
                  const isCurrent = idx === solvedCount;
                  return (
                    <span
                      key={idx}
                      className={`rs-track-node ${isDone ? 'is-done' : isCurrent ? 'is-current' : ''}`}
                    />
                  );
                })}
              </div>
              {fastCount > 0 && (
                <span className="rs-rocket-badge">{fastCount} Turbo</span>
              )}
            </div>

            <section
              className={`rs-question-card ${
                phase === 'celebrating'
                  ? 'is-celebrating'
                  : phase === 'teach-mistake'
                    ? 'is-mistake'
                    : phase === 'timeout-reveal'
                      ? 'is-timeout'
                      : ''
              }`}
            >
              <div className="rs-timer-row">
                <div className="rs-timer-bar-wrap" aria-hidden="true">
                  <div className="rs-timer-bar-fill" style={{ width: `${timerPct}%` }} />
                </div>
                <span className="rs-timer-pill" data-testid="rocket-timer-pill">
                  {phase === 'playing' ? `${timerSecondsDisplay}s` : 'Paused'}
                </span>
              </div>

              <div className="rs-visual-equation" data-testid="rocket-equation">
                <div className="rs-addend-pod">
                  {showPictures && (
                    <div className="rs-item-grid" aria-hidden="true">
                      {prompt.left === 0 ? (
                        <span className="rs-zero-label">0 {itemSpec.plural}</span>
                      ) : (
                        Array.from({ length: prompt.left }, (_, idx) => (
                          <img
                            key={idx}
                            src={assetUrl(itemSpec.imagePath)}
                            alt=""
                            className="rs-item-img"
                          />
                        ))
                      )}
                    </div>
                  )}
                  <span className="rs-numeral-big">{prompt.left}</span>
                </div>

                <span className="rs-operator" aria-hidden="true">
                  +
                </span>

                <div className="rs-addend-pod">
                  {showPictures && (
                    <div className="rs-item-grid" aria-hidden="true">
                      {prompt.right === 0 ? (
                        <span className="rs-zero-label">0 {itemSpec.plural}</span>
                      ) : (
                        Array.from({ length: prompt.right }, (_, idx) => (
                          <img
                            key={idx}
                            src={assetUrl(itemSpec.imagePath)}
                            alt=""
                            className="rs-item-img"
                          />
                        ))
                      )}
                    </div>
                  )}
                  <span className="rs-numeral-big">{prompt.right}</span>
                </div>

                <span className="rs-operator" aria-hidden="true">
                  =
                </span>

                <div
                  className={`rs-answer-slot ${
                    phase === 'celebrating'
                      ? 'is-correct'
                      : phase === 'timeout-reveal' || phase === 'teach-mistake'
                        ? 'is-revealed'
                        : ''
                  }`}
                  data-testid="rocket-answer-slot"
                >
                  {phase === 'celebrating' ||
                  phase === 'timeout-reveal' ||
                  phase === 'teach-mistake'
                    ? prompt.answer
                    : '?'}
                </div>
              </div>

              {phase === 'timeout-reveal' ? (
                <div className="rs-ready-panel" data-testid="rocket-timeout-panel">
                  <p>
                    {prompt.left} + {prompt.right} = {prompt.answer}! Are you ready for a fresh one?
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleReadyAfterTimeout}
                    data-testid="rocket-ready-next-btn"
                  >
                    I&apos;m Ready!
                  </button>
                </div>
              ) : (
                <div
                  className={`rs-feedback-banner ${
                    phase === 'celebrating'
                      ? 'rs-feedback-banner--success'
                      : phase === 'teach-mistake'
                        ? 'rs-feedback-banner--teach'
                        : 'rs-feedback-banner--neutral'
                  }`}
                >
                  {phase === 'celebrating'
                    ? lastWasFast
                      ? `Turbo Boost! ${prompt.left} + ${prompt.right} = ${prompt.answer}!`
                      : `Great! ${prompt.left} + ${prompt.right} = ${prompt.answer}!`
                    : phase === 'teach-mistake'
                      ? `Look closely: ${prompt.left} + ${prompt.right} = ${prompt.answer}`
                      : `How many ${showPictures ? itemSpec.plural : ''} altogether?`}
                </div>
              )}
            </section>

            <section className="rs-pad-wrap" aria-label="Answer number pad">
              <div className="rs-pad-grid">
                {padNumbers.map((num) => {
                  const isCorrectShown =
                    (phase === 'celebrating' || phase === 'teach-mistake') && num === prompt.answer;
                  const isWrongShown = phase === 'teach-mistake' && num === selectedWrong;
                  return (
                    <button
                      key={num}
                      type="button"
                      className={`rs-pad-btn ${
                        isCorrectShown ? 'is-correct' : isWrongShown ? 'is-wrong' : ''
                      }`}
                      disabled={phase !== 'playing'}
                      onClick={() => handleSelectAnswer(num)}
                      data-testid={`rocket-pad-${num}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Take a calm breath and try again!"
        hint={`${prompt.left} + ${prompt.right} = ${prompt.answer}`}
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleReadyAfterThinkAgain}
      />
    </div>
  );
}

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
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { WinnerModal } from '../../components/WinnerModal';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import { clientToLogicalPoint, usePointerStroke } from '../../engine/usePointerStroke';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import {
  playLetterAudio,
  playNumberAudio,
  playTraceOrderVoice,
  playWordAudio,
  preloadLettersAudio,
  preloadNumbersAudio,
  preloadTraceOrderVoice,
  preloadWordsAudio,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import { isValidLetterId, type LetterId } from '../letter-train/letterData';
import { WordIllustration } from '../letter-train/WordIllustration';
import {
  buildAnyTraceDeck,
  buildGenericTraceItem,
  isValidTraceDeckItem,
} from './k1ExtraTraces';
import {
  FENCE_LINE_Y,
  GRASS_LINE_Y,
  REVERSAL_GUARD_LETTERS,
  ROOT_LINE_Y,
  SKY_LINE_Y,
  SLATE_HEIGHT,
  SLATE_WIDTH,
  STROKE_WIDTH,
  loadTraceMastery,
  pickRotatingWordForLetter,
  pointAlongStroke,
  saveTraceLetterMastery,
  type LetterTraceConfig,
  type ResolvedTraceStroke,
  type TracePoint,
} from './traceData';
import {
  playLockedStrokeTap,
  playPairCompleteFanfare,
  playRoundCompleteFanfare,
  playStrokeCompleteNote,
  playStrokeStartTick,
} from './traceSounds';

const ACTIVE_TRACE_STORAGE_KEY = 'pebble.letter-trace.active.v1';

const START_RADIUS = 50;
const DOT_TAP_RADIUS = 50;
const CORRIDOR_TOLERANCE = 56;
const AUTO_COMPLETE_PROGRESS = 0.87;
const WRONG_DRAG_THRESHOLD = 22;
const RETRACT_TAP_MAX_TRAVEL = 18;
const STEP_MILESTONES = [0.34, 0.68, 1.0] as const;

interface LetterTraceBoardProps {
  gameKey: number;
  config: LetterTraceConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'tracing' | 'teaching-mistake' | 'pair-complete' | 'won';

type BannerTone = 'neutral' | 'warn' | 'success' | 'gold';

interface ActiveDragState {
  mode: 'drawing' | 'blocked';
  downPt: TracePoint;
  lastPt: TracePoint;
  maxTravel: number;
  maxProgress: number;
  sawReverseAttempt: boolean;
  triggeredBlock: boolean;
}

interface StoredTraceSession {
  gameKey: number;
  deck: string[];
  deckIndex: number;
  crownedThisRound: string[];
  wrongDragsCount: number;
}

function clampSafeInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function loadActiveTraceSession(
  gameKey: number,
  config: LetterTraceConfig,
): StoredTraceSession | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(ACTIVE_TRACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTraceSession>;
    if (parsed.gameKey !== gameKey) return null;
    if (!Array.isArray(parsed.deck) || parsed.deck.length === 0 || parsed.deck.length > 51) {
      return null;
    }
    const cleanDeck = parsed.deck.filter((item): item is string =>
      isValidTraceDeckItem(item, config),
    );
    if (cleanDeck.length !== parsed.deck.length) return null;
    const deckIndex = clampSafeInt(parsed.deckIndex, 0, cleanDeck.length - 1, 0);
    const crownedThisRound = Array.isArray(parsed.crownedThisRound)
      ? parsed.crownedThisRound.filter((l): l is string => isValidTraceDeckItem(l, config))
      : [];
    const wrongDragsCount = clampSafeInt(parsed.wrongDragsCount, 0, 5000, 0);
    return {
      gameKey,
      deck: cleanDeck,
      deckIndex,
      crownedThisRound,
      wrongDragsCount,
    };
  } catch {
    return null;
  }
}

function saveActiveTraceSession(state: StoredTraceSession | null): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (!state) {
      window.sessionStorage.removeItem(ACTIVE_TRACE_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(ACTIVE_TRACE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore sessionStorage errors in restricted containers
  }
}

/**
 * Forward-window projection along active stroke [max(0, prev - 0.06), min(1, prev + 0.34)]
 * so closed loops (O, o, a, d, g, q) and self-crossings (e) cannot be completed backwards.
 */
function projectForwardOntoStroke(
  strokeSpec: ResolvedTraceStroke,
  pt: TracePoint,
  currentProgress: number,
): { progress: number; distance: number } {
  const samples = strokeSpec.samples;
  const cumLen = strokeSpec.cumulativeLengths;
  const total = strokeSpec.totalLength || 1;
  if (strokeSpec.kind === 'dot' || samples.length <= 1) {
    return {
      progress: 1,
      distance: Math.hypot(pt.x - strokeSpec.start.x, pt.y - strokeSpec.start.y),
    };
  }

  const minWindow = Math.max(0, currentProgress - 0.06);
  const maxWindow = Math.min(1, currentProgress + 0.34);
  const segCount = samples.length - 1;
  const startIdx = Math.max(0, Math.floor(minWindow * segCount));
  const endIdx = Math.min(segCount - 1, Math.ceil(maxWindow * segCount));

  let bestDistSq = Infinity;
  let bestLen = currentProgress * total;

  for (let i = startIdx; i <= endIdx; i += 1) {
    const a = samples[i];
    const b = samples[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const lenSq = vx * vx + vy * vy;
    let t = 0;
    if (lenSq > 1e-6) {
      t = Math.max(0, Math.min(1, ((pt.x - a.x) * vx + (pt.y - a.y) * vy) / lenSq));
    }
    const cx = a.x + vx * t;
    const cy = a.y + vy * t;
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      const segSpan = cumLen[i + 1] - cumLen[i];
      bestLen = cumLen[i] + segSpan * t;
    }
  }

  return {
    progress: Math.max(currentProgress, Math.min(1, bestLen / total)),
    distance: Math.sqrt(bestDistSq),
  };
}

function minDistanceToStroke(strokeSpec: ResolvedTraceStroke, pt: TracePoint): number {
  let minD = Infinity;
  for (const s of strokeSpec.samples) {
    const d = Math.hypot(pt.x - s.x, pt.y - s.y);
    if (d < minD) minD = d;
  }
  return minD;
}

function buildPartialPolylinePoints(
  strokeSpec: ResolvedTraceStroke,
  progress: number,
): string {
  const samples = strokeSpec.samples;
  if (samples.length <= 1 || progress <= 0.005) return '';
  const exactIdx = progress * (samples.length - 1);
  const fullCount = Math.floor(exactIdx) + 1;
  const pts = samples.slice(0, fullCount);
  const tip = pointAlongStroke(strokeSpec, progress);
  const last = pts[pts.length - 1];
  if (!last || Math.hypot(tip.x - last.x, tip.y - last.y) > 0.5) {
    pts.push(tip);
  }
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function SpeakerIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.18" />
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

export function LetterTraceBoard({
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
}: LetterTraceBoardProps) {
  const activeTraceMode = config.traceMode ?? 'letters';

  const initialSession = useMemo(() => {
    const saved = !journeyContext ? loadActiveTraceSession(gameKey, config) : null;
    if (saved) return saved;
    const mastery = loadTraceMastery();
    return {
      gameKey,
      deck: buildAnyTraceDeck(config, mastery),
      deckIndex: 0,
      crownedThisRound: [] as string[],
      wrongDragsCount: 0,
    };
  }, [gameKey, config, journeyContext]);

  const [deck] = useState<string[]>(initialSession.deck);
  const [deckIndex, setDeckIndex] = useState<number>(initialSession.deckIndex);
  const [crownedThisRound, setCrownedThisRound] = useState<string[]>(
    initialSession.crownedThisRound,
  );
  const [wrongDragsCount, setWrongDragsCount] = useState<number>(initialSession.wrongDragsCount);

  const [activeStrokeIdx, setActiveStrokeIdx] = useState<number>(0);
  const [liveProgress, setLiveProgress] = useState<number>(0);
  const [phase, setPhase] = useState<BoardPhase>('tracing');
  const [strokeMistakes, setStrokeMistakes] = useState<number>(0);
  const [letterMistakeCount, setLetterMistakeCount] = useState<number>(0);
  const [letterHadMistake, setLetterHadMistake] = useState<boolean>(false);
  const [pauseOpen, setPauseOpen] = useState<boolean>(false);
  const [stepDotsEnabled, setStepDotsEnabled] = useState<boolean>(false);
  const [milestoneIdx, setMilestoneIdx] = useState<number>(0);
  const [blockedCue, setBlockedCue] = useState<{ x: number; y: number; key: number } | null>(null);
  const [guideProgress, setGuideProgress] = useState<number | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [banner, setBanner] = useState<{ tone: BannerTone; text: string }>({
    tone: 'neutral',
    text: 'Start at Circle 1 and trace along the arrows!',
  });

  const currentItem = deck[deckIndex] ?? deck[0] ?? 'A';
  const currentLetter: LetterId = isValidLetterId(currentItem) ? currentItem : 'A';
  const genericItem = useMemo(
    () => buildGenericTraceItem(currentItem, config),
    [currentItem, config],
  );
  const traceSpec = genericItem.spec;
  const activeStroke: ResolvedTraceStroke | undefined = traceSpec.strokes[activeStrokeIdx];

  const [wordSpec, setWordSpec] = useState(() => pickRotatingWordForLetter(currentLetter));

  const slateWrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<ActiveDragState | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef<boolean>(false);
  const nextTimerRef = useRef<number | null>(null);
  const retractRafRef = useRef<number | null>(null);
  const guideRafRef = useRef<number | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const teachVoiceCancelRef = useRef<(() => void) | null>(null);

  const cancelRetractAnim = useCallback(() => {
    if (retractRafRef.current !== null) {
      window.cancelAnimationFrame(retractRafRef.current);
      retractRafRef.current = null;
    }
  }, []);

  const cancelGuideAnim = useCallback(() => {
    if (guideRafRef.current !== null) {
      window.cancelAnimationFrame(guideRafRef.current);
      guideRafRef.current = null;
    }
    setGuideProgress(null);
  }, []);

  const runGuidePebbleDemo = useCallback(
    (durationMs: number, repeatCount = 1) => {
      cancelGuideAnim();
      const startTs = performance.now();
      const totalMs = durationMs * Math.max(1, repeatCount);
      const step = (now: number) => {
        const elapsed = now - startTs;
        if (elapsed >= totalMs) {
          setGuideProgress(null);
          guideRafRef.current = null;
          return;
        }
        const cycle = (elapsed % durationMs) / durationMs;
        // Ease-in-out
        const eased =
          cycle < 0.5 ? 2 * cycle * cycle : 1 - Math.pow(-2 * cycle + 2, 2) / 2;
        setGuideProgress(eased);
        guideRafRef.current = window.requestAnimationFrame(step);
      };
      guideRafRef.current = window.requestAnimationFrame(step);
    },
    [cancelGuideAnim],
  );

  // Sync rotating word + preload audio whenever letter advances
  useEffect(() => {
    setWordSpec(pickRotatingWordForLetter(currentLetter));
  }, [currentLetter]);

  useEffect(() => {
    if (activeTraceMode === 'letters') {
      const validLetters = deck.filter((l): l is LetterId => isValidLetterId(l));
      preloadLettersAudio(validLetters);
      preloadWordsAudio(validLetters.map((l) => pickRotatingWordForLetter(l).id));
    } else if (activeTraceMode === 'numbers') {
      preloadNumbersAudio(50, true);
    } else {
      preloadWordsAudio(deck);
    }
    preloadTraceOrderVoice();
    return () => {
      stopAllSpokenAudio();
      if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
      if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
      cancelRetractAnim();
      cancelGuideAnim();
      teachVoiceCancelRef.current?.();
    };
  }, [activeTraceMode, deck, cancelGuideAnim, cancelRetractAnim]);

  useEffect(() => {
    if (phase === 'won') {
      if (!journeyContext) saveActiveTraceSession(null);
      onGameActiveChange?.(false);
      return;
    }
    if (!journeyContext) {
      saveActiveTraceSession({
        gameKey,
        deck,
        deckIndex,
        crownedThisRound,
        wrongDragsCount,
      });
    }
    const hasProgress = deckIndex > 0 || activeStrokeIdx > 0 || wrongDragsCount > 0;
    onGameActiveChange?.(hasProgress);
  }, [
    phase,
    journeyContext,
    gameKey,
    deck,
    deckIndex,
    crownedThisRound,
    wrongDragsCount,
    activeStrokeIdx,
    onGameActiveChange,
  ]);

  const finishRound = useCallback(
    (finalCrownedCount: number, finalWrongCount: number) => {
      setPhase('won');
      playRoundCompleteFanfare(soundEnabled);
      setConfettiMode('win');
      setConfettiKey((k) => k + 1);

      if (!roundLoggedRef.current) {
        roundLoggedRef.current = true;
        const total = Math.max(1, deck.length + finalWrongCount);
        recordLearningSession({
          playerId: childProfile.id,
          gameId: 'letter-trace',
          mode: `${activeTraceMode}-${config.caseMode}-${deck.length}`,
          totalAttempts: total,
          correctAttempts: deck.length,
          mistakes: finalWrongCount,
          flawless: finalWrongCount === 0 && finalCrownedCount === deck.length,
          durationMs: Math.max(1000, Date.now() - startedAtRef.current),
          conceptsTested: deck.map((item) => buildGenericTraceItem(item, config).conceptId),
        });
      }

      if (journeyContext) {
        journeyContext.onActivityComplete();
      }
    },
    [activeTraceMode, childProfile.id, config, deck, journeyContext, soundEnabled],
  );

  const completeActiveStroke = useCallback(() => {
    if (!activeStroke || phase !== 'tracing') return;
    cancelRetractAnim();
    cancelGuideAnim();
    dragRef.current = null;
    setLiveProgress(0);
    setStrokeMistakes(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);

    const isFinalStrokeOfPair = activeStrokeIdx + 1 >= traceSpec.strokes.length;

    if (!isFinalStrokeOfPair) {
      playStrokeCompleteNote(activeStrokeIdx, soundEnabled);
      const nextIdx = activeStrokeIdx + 1;
      const nextStroke = traceSpec.strokes[nextIdx];
      setActiveStrokeIdx(nextIdx);
      setBanner({
        tone: 'neutral',
        text:
          nextStroke?.kind === 'dot'
            ? `Stroke ${activeStroke.order} done! Now tap Circle ${nextStroke.order} to make the dot.`
            : `Great! Now trace Stroke ${nextStroke.order}: ${nextStroke.hint}.`,
      });
      return;
    }

    // Completed all strokes for this letter / number / shape / word!
    const earnedCrown = !letterHadMistake;
    if (activeTraceMode === 'letters' && isValidLetterId(currentItem)) {
      saveTraceLetterMastery(currentItem, earnedCrown);
    }

    const nextCrownedList =
      earnedCrown && !crownedThisRound.includes(currentItem)
        ? [...crownedThisRound, currentItem]
        : crownedThisRound;
    if (earnedCrown) {
      setCrownedThisRound(nextCrownedList);
    }

    recordSkillAttempt({
      playerId: childProfile.id,
      gameId: 'letter-trace',
      conceptId: genericItem.conceptId,
      conceptLabel: genericItem.conceptLabel,
      skillType: genericItem.skillType,
      correct: earnedCrown,
      attemptsTaken: 1 + letterMistakeCount,
    });

    setActiveStrokeIdx(traceSpec.strokes.length);
    setPhase('pair-complete');
    setConfettiMode(deckIndex + 1 >= deck.length ? 'win' : 'match');
    setConfettiKey((k) => k + 1);
    playPairCompleteFanfare(earnedCrown, soundEnabled);

    if (soundEnabled) {
      window.setTimeout(() => {
        if (genericItem.audioKind === 'letter') {
          playLetterAudio(currentLetter, `Letter ${currentLetter}`, true);
        } else if (genericItem.audioKind === 'number') {
          playNumberAudio(Number(genericItem.audioTarget) || 0, true);
        } else {
          playWordAudio(genericItem.audioTarget, genericItem.title, true);
        }
      }, 240);
    }

    const displayPair = genericItem.title;

    setBanner({
      tone: earnedCrown ? 'gold' : 'success',
      text: earnedCrown
        ? `Golden Crown! You wrote ${displayPair} in perfect stroke order!`
        : `${displayPair} complete! Every stroke is in the right order!`,
    });

    if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
    nextTimerRef.current = window.setTimeout(() => {
      const nextDeckIdx = deckIndex + 1;
      if (nextDeckIdx >= deck.length) {
        finishRound(nextCrownedList.length, wrongDragsCount);
      } else {
        setDeckIndex(nextDeckIdx);
        setActiveStrokeIdx(0);
        setStrokeMistakes(0);
        setLetterMistakeCount(0);
        setLetterHadMistake(false);
        setLiveProgress(0);
        setMilestoneIdx(0);
        setStepDotsEnabled(false);
        setPhase('tracing');
        setBanner({
          tone: 'neutral',
          text: 'Start at Circle 1 and follow the arrows!',
        });
      }
    }, 1450);
  }, [
    activeStroke,
    activeStrokeIdx,
    activeTraceMode,
    cancelGuideAnim,
    cancelRetractAnim,
    childProfile.id,
    crownedThisRound,
    currentItem,
    currentLetter,
    deck.length,
    deckIndex,
    finishRound,
    genericItem,
    letterHadMistake,
    letterMistakeCount,
    phase,
    soundEnabled,
    traceSpec.strokes,
    wrongDragsCount,
  ]);

  const handleBlockedStroke = useCallback(
    (pt: TracePoint, wasReverse: boolean) => {
      if (!activeStroke || phase !== 'tracing') return;
      playLockedStrokeTap(soundEnabled);

      const nextWrongTotal = wrongDragsCount + 1;
      const nextStrokeMistakes = strokeMistakes + 1;
      setWrongDragsCount(nextWrongTotal);
      setStrokeMistakes(nextStrokeMistakes);
      setLetterMistakeCount((c) => c + 1);
      setLetterHadMistake(true);

      if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
      setBlockedCue({ x: pt.x, y: pt.y, key: Date.now() });
      cueTimerRef.current = window.setTimeout(() => {
        setBlockedCue(null);
      }, 820);

      if (nextStrokeMistakes === 1) {
        setBanner({
          tone: 'warn',
          text:
            activeStroke.kind === 'dot'
              ? `Wait! Tap Circle ${activeStroke.order} above the fence to make the dot.`
              : wasReverse
                ? `Oops, backwards! Start at Circle ${activeStroke.order} and follow the arrow!`
                : `Hold on! Circle ${activeStroke.order} comes first — follow its arrow!`,
        });
        runGuidePebbleDemo(1050, 1);
        return;
      }

      // 2nd+ wrong attempt on same stroke: Teach-First (watch guide pebble + calm voice), THEN ThinkAgainOverlay!
      setPhase('teaching-mistake');
      setBanner({
        tone: 'warn',
        text: `Watch the gold pebble! Always start at Circle ${activeStroke.order} and follow the arrow.`,
      });
      runGuidePebbleDemo(1050, 2);

      teachVoiceCancelRef.current?.();
      teachVoiceCancelRef.current = playTraceOrderVoice(soundEnabled, () => {
        setPauseOpen(true);
      });
    },
    [
      activeStroke,
      phase,
      runGuidePebbleDemo,
      soundEnabled,
      strokeMistakes,
      wrongDragsCount,
    ],
  );

  const handleRestartLetter = useCallback(() => {
    teachVoiceCancelRef.current?.();
    cancelGuideAnim();
    cancelRetractAnim();
    setPauseOpen(false);
    setPhase('tracing');
    setActiveStrokeIdx(0);
    setStrokeMistakes(0);
    setLetterMistakeCount(0);
    setLetterHadMistake(false);
    setLiveProgress(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);
    setBanner({
      tone: 'neutral',
      text: 'Fresh start! Begin at Circle 1 for your Golden Crown!',
    });
  }, [cancelGuideAnim, cancelRetractAnim]);

  const handleResumeAfterPause = useCallback(() => {
    teachVoiceCancelRef.current?.();
    cancelGuideAnim();
    setPauseOpen(false);
    setPhase('tracing');
    setStrokeMistakes(0);
    if (activeStroke) {
      setBanner({
        tone: 'neutral',
        text: `Ready! Trace Stroke ${activeStroke.order}: ${activeStroke.hint}.`,
      });
      runGuidePebbleDemo(950, 1);
    }
  }, [activeStroke, cancelGuideAnim, runGuidePebbleDemo]);

  const handleResetWholeRound = useCallback(() => {
    if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
    teachVoiceCancelRef.current?.();
    cancelGuideAnim();
    cancelRetractAnim();
    saveActiveTraceSession(null);
    roundLoggedRef.current = false;
    startedAtRef.current = Date.now();
    setDeckIndex(0);
    setCrownedThisRound([]);
    setWrongDragsCount(0);
    setActiveStrokeIdx(0);
    setStrokeMistakes(0);
    setLetterMistakeCount(0);
    setLetterHadMistake(false);
    setLiveProgress(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);
    setPauseOpen(false);
    setPhase('tracing');
    setBanner({
      tone: 'neutral',
      text: 'Start at Circle 1 and trace along the arrows!',
    });
  }, [cancelGuideAnim, cancelRetractAnim]);

  const retractPartialInk = useCallback(
    (fromProgress: number) => {
      cancelRetractAnim();
      if (fromProgress <= 0.01) {
        setLiveProgress(0);
        return;
      }
      const startVal = fromProgress;
      const startTs = performance.now();
      const durationMs = 240;
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTs) / durationMs);
        const nextVal = startVal * (1 - t);
        if (t >= 1) {
          setLiveProgress(0);
          retractRafRef.current = null;
          return;
        }
        setLiveProgress(nextVal);
        retractRafRef.current = window.requestAnimationFrame(tick);
      };
      retractRafRef.current = window.requestAnimationFrame(tick);
    },
    [cancelRetractAnim],
  );

  const resolveSvgPoint = useCallback((event: ReactPointerEvent<HTMLElement>): TracePoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    return clientToLogicalPoint(
      svg,
      event.clientX,
      event.clientY,
      SLATE_WIDTH,
      SLATE_HEIGHT,
      'contain',
    );
  }, []);

  const handleStrokeStart = useCallback(
    (pt: TracePoint) => {
      if (phase !== 'tracing' || pauseOpen || !activeStroke) return;
      cancelRetractAnim();

      // Special fast-path for dot strokes ('i', 'j')
      if (activeStroke.kind === 'dot') {
        const distToDot = Math.hypot(pt.x - activeStroke.start.x, pt.y - activeStroke.start.y);
        if (distToDot <= DOT_TAP_RADIUS) {
          playStrokeStartTick(soundEnabled);
          completeActiveStroke();
          return;
        }
        dragRef.current = {
          mode: 'blocked',
          downPt: pt,
          lastPt: pt,
          maxTravel: 0,
          maxProgress: 0,
          sawReverseAttempt: false,
          triggeredBlock: false,
        };
        return;
      }

      // Check sequential stepping-stone tap if step dots are visible
      if (stepDotsEnabled) {
        const targetFraction = STEP_MILESTONES[milestoneIdx];
        if (typeof targetFraction === 'number') {
          const targetPt = pointAlongStroke(activeStroke, targetFraction);
          if (Math.hypot(pt.x - targetPt.x, pt.y - targetPt.y) <= 38) {
            playStrokeStartTick(soundEnabled);
            if (milestoneIdx >= STEP_MILESTONES.length - 1) {
              completeActiveStroke();
            } else {
              const nextMilestone = milestoneIdx + 1;
              setMilestoneIdx(nextMilestone);
              setLiveProgress(targetFraction);
              setBanner({
                tone: 'neutral',
                text: `Nice! Now tap Step ${nextMilestone + 1} along Stroke ${activeStroke.order}!`,
              });
            }
            return;
          }
          // Reject tapping later stepping stones out of order!
          const hitFutureStone = STEP_MILESTONES.slice(milestoneIdx + 1).some((f) => {
            const p = pointAlongStroke(activeStroke, f);
            return Math.hypot(pt.x - p.x, pt.y - p.y) <= 34;
          });
          if (hitFutureStone) {
            handleBlockedStroke(pt, false);
            return;
          }
        }
      }

      const distToStart = Math.hypot(pt.x - activeStroke.start.x, pt.y - activeStroke.start.y);
      const distToEnd = Math.hypot(pt.x - activeStroke.end.x, pt.y - activeStroke.end.y);

      // Allow resuming right at Badge k (or from current liveProgress if stepping was active)
      const resumeAnchor =
        liveProgress > 0.05 ? pointAlongStroke(activeStroke, liveProgress) : activeStroke.start;
      const distToAnchor = Math.hypot(pt.x - resumeAnchor.x, pt.y - resumeAnchor.y);

      const touchedStartArea = distToStart <= START_RADIUS || distToAnchor <= START_RADIUS;

      if (touchedStartArea) {
        playStrokeStartTick(soundEnabled);
        dragRef.current = {
          mode: 'drawing',
          downPt: pt,
          lastPt: pt,
          maxTravel: 0,
          maxProgress: liveProgress,
          sawReverseAttempt: false,
          triggeredBlock: false,
        };
        return;
      }

      // Check if starting backwards from stroke end (for non-closed strokes)
      const isClosedLoop =
        Math.hypot(activeStroke.start.x - activeStroke.end.x, activeStroke.start.y - activeStroke.end.y) <
        36;
      const isNearEndBackwards = !isClosedLoop && distToEnd <= START_RADIUS + 8;

      dragRef.current = {
        mode: 'blocked',
        downPt: pt,
        lastPt: pt,
        maxTravel: 0,
        maxProgress: 0,
        sawReverseAttempt: isNearEndBackwards,
        triggeredBlock: false,
      };
    },
    [
      activeStroke,
      cancelRetractAnim,
      completeActiveStroke,
      liveProgress,
      milestoneIdx,
      pauseOpen,
      phase,
      soundEnabled,
      stepDotsEnabled,
    ],
  );

  const handleStrokeMove = useCallback(
    (pt: TracePoint) => {
      const drag = dragRef.current;
      if (!drag || !activeStroke || phase !== 'tracing' || pauseOpen) return;

      const travelFromDown = Math.hypot(pt.x - drag.downPt.x, pt.y - drag.downPt.y);
      drag.maxTravel = Math.max(drag.maxTravel, travelFromDown);
      drag.lastPt = pt;

      if (drag.mode === 'blocked') {
        if (!drag.triggeredBlock && drag.maxTravel >= WRONG_DRAG_THRESHOLD) {
          drag.triggeredBlock = true;
          handleBlockedStroke(pt, drag.sawReverseAttempt);
        }
        return;
      }

      // Active stroke drawing mode
      const proj = projectForwardOntoStroke(activeStroke, pt, drag.maxProgress);

      if (proj.distance <= CORRIDOR_TOLERANCE) {
        if (proj.progress > drag.maxProgress) {
          drag.maxProgress = proj.progress;
          setLiveProgress(proj.progress);
          if (proj.progress >= AUTO_COMPLETE_PROGRESS) {
            completeActiveStroke();
          }
        }
      } else if (
        drag.maxProgress < 0.08 &&
        drag.maxTravel >= WRONG_DRAG_THRESHOLD + 6
      ) {
        // Child started at Circle k but immediately dragged off in the wrong direction (e.g. clockwise on Magic C / O!)
        drag.mode = 'blocked';
        drag.triggeredBlock = true;
        drag.sawReverseAttempt = true;
        drag.maxProgress = 0;
        setLiveProgress(0);
        handleBlockedStroke(pt, true);
      }
    },
    [activeStroke, completeActiveStroke, handleBlockedStroke, pauseOpen, phase],
  );

  const handleStrokeEnd = useCallback(
    (pt: TracePoint | null) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || !activeStroke || phase !== 'tracing') return;

      if (drag.mode === 'blocked') {
        // If user tapped a future locked stroke badge cleanly, show gentle locked tap without drawing
        if (!drag.triggeredBlock && pt) {
          const hitFutureBadge = traceSpec.strokes
            .slice(activeStrokeIdx + 1)
            .some(
              (s) =>
                Math.hypot(pt.x - s.start.x, pt.y - s.start.y) <= 36 ||
                minDistanceToStroke(s, pt) <= 28,
            );
          if (hitFutureBadge) {
            handleBlockedStroke(pt, drag.sawReverseAttempt);
          }
        }
        return;
      }

      if (drag.maxProgress >= AUTO_COMPLETE_PROGRESS) {
        completeActiveStroke();
        return;
      }

      // Tapping active Badge k cleanly toggles Step Dots for dual-input support without penalty!
      if (drag.maxTravel <= RETRACT_TAP_MAX_TRAVEL && drag.maxProgress < 0.12) {
        setStepDotsEnabled((prev) => {
          const next = !prev;
          if (next) {
            setBanner({
              tone: 'neutral',
              text: `Step Dots on! Tap Dots 1 → 2 → 3 in order along Stroke ${activeStroke.order}.`,
            });
          }
          return next;
        });
        setMilestoneIdx(0);
        setLiveProgress(0);
        return;
      }

      // Finger slip mid-stroke: retract calmly to start with zero mistake penalty!
      const fallbackMilestoneProgress = stepDotsEnabled && milestoneIdx > 0
        ? STEP_MILESTONES[milestoneIdx - 1]
        : 0;
      if (fallbackMilestoneProgress > 0) {
        setLiveProgress(fallbackMilestoneProgress);
      } else {
        retractPartialInk(drag.maxProgress);
      }
      setBanner({
        tone: 'neutral',
        text: `Keep going from Circle ${activeStroke.order} all the way to the arrow tip!`,
      });
    },
    [
      activeStroke,
      activeStrokeIdx,
      completeActiveStroke,
      handleBlockedStroke,
      milestoneIdx,
      phase,
      retractPartialInk,
      stepDotsEnabled,
      traceSpec.strokes,
    ],
  );

  const { handlers: slatePointerHandlers } = usePointerStroke<TracePoint>({
    enabled: phase === 'tracing' && !pauseOpen,
    resolvePoint: resolveSvgPoint,
    onStrokeStart: handleStrokeStart,
    onStrokeMove: handleStrokeMove,
    onStrokeEnd: handleStrokeEnd,
    onStrokeCancel: () => {
      dragRef.current = null;
      retractPartialInk(liveProgress);
    },
  });

  const completedStrokes = traceSpec.strokes.slice(0, activeStrokeIdx);
  const futureStrokes = activeStroke
    ? traceSpec.strokes.slice(activeStrokeIdx + 1)
    : [];

  const livePolylinePoints = useMemo(() => {
    if (!activeStroke || liveProgress <= 0.01) return '';
    return buildPartialPolylinePoints(activeStroke, liveProgress);
  }, [activeStroke, liveProgress]);

  const guidePoint = useMemo(() => {
    if (guideProgress === null || !activeStroke) return null;
    return pointAlongStroke(activeStroke, guideProgress);
  }, [activeStroke, guideProgress]);

  const isReversalPair =
    activeTraceMode === 'letters' &&
    config.caseMode !== 'upper' &&
    REVERSAL_GUARD_LETTERS.includes(currentLetter);
  const reversalCue =
    currentLetter === 'B'
      ? 'Bat down first, then ball'
      : currentLetter === 'D'
        ? 'Donut curve first, then stick'
        : currentLetter === 'P'
          ? 'Dive down first, then bump'
          : currentLetter === 'Q'
            ? 'Magic curve first, then dive tail'
            : null;

  const pairDisplayTitle = genericItem.badgeText;

  const completedStrokeColor = phase === 'pair-complete' ? '#3BA99C' : '#5B5BD6';

  return (
    <main className="app-shell app-shell--board tr-board-shell">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseOpen}
        title="Let's Write in Order!"
        hint="Always start at the glowing purple circle and trace along the arrow — locked strokes cannot draw out of order."
        readyLabel="Keep Trying"
        startAgainLabel="Restart Letter"
        durationSeconds={2}
        soundEnabled={soundEnabled}
        onReady={handleResumeAfterPause}
        onStartAgain={handleRestartLetter}
      />

      <header className="top-bar tr-top-bar">
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="trace-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
        </div>

        <div className="tr-progress-center">
          <div className="tr-progress-dots" aria-label={`Item ${deckIndex + 1} of ${deck.length}`}>
            {deck.map((item, idx) => {
              const isDone = idx < deckIndex || (idx === deckIndex && phase === 'pair-complete');
              const isCurrent = idx === deckIndex && phase !== 'pair-complete';
              const pillLabel =
                activeTraceMode === 'letters' && config.caseMode === 'lower'
                  ? item.toLowerCase()
                  : activeTraceMode === 'shapes'
                    ? item.slice(0, 3)
                    : item;
              return (
                <span
                  key={`${item}-${idx}`}
                  className={`tr-prog-pill ${isDone ? 'is-done' : ''} ${
                    isCurrent ? 'is-current' : ''
                  }`}
                >
                  {pillLabel}
                </span>
              );
            })}
          </div>
          <span
            className={`tr-crown-status ${letterHadMistake ? 'is-muted' : 'is-clean'}`}
            data-testid="trace-crown-status"
          >
            <CrownIcon size={13} />
            <span>{letterHadMistake ? 'Finish Together' : 'Clean Crown Active'}</span>
          </span>
        </div>

        <div className="top-bar__right" style={{ gap: 6 }}>
          <GameHelpButton onClick={onRequestHelp} />
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <SpeakerIcon muted={!soundEnabled} />
            <span>{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="trace-setup-btn"
            >
              Setup
            </button>
          )}
        </div>
      </header>

      <section className="tr-prompt-card" aria-label="Active letter and word clue">
        <div className="tr-prompt-left">
          <div className="tr-pair-badge" data-testid="trace-pair-heading">
            {pairDisplayTitle}
          </div>
          <div className="tr-prompt-copy">
            <h1 className="tr-prompt-title">
              {phase === 'pair-complete'
                ? `${genericItem.title} Complete!`
                : activeStroke
                  ? `${genericItem.title} • Stroke ${activeStroke.order} of ${traceSpec.strokes.length}`
                  : genericItem.title}
            </h1>
            <p className="tr-prompt-sub">
              {phase === 'pair-complete'
                ? activeTraceMode === 'letters'
                  ? `${currentLetter} is for ${wordSpec.word}!`
                  : genericItem.completeSubtext
                : activeStroke
                  ? activeStroke.hint
                  : 'Trace along the arrows!'}
            </p>
          </div>
        </div>

        {activeTraceMode === 'letters' ? (
          <div className="tr-word-chip">
            <WordIllustration id={wordSpec.id} size={46} />
            <div className="tr-word-chip__meta">
              <strong>{wordSpec.word}</strong>
              <button
                type="button"
                className="tr-hear-btn"
                onClick={() => playWordAudio(wordSpec.id, wordSpec.word, true)}
                data-testid="trace-hear-word-btn"
              >
                <SpeakerIcon />
                <span>Hear Word</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="tr-word-chip">
            <div className="tr-word-chip__meta">
              <strong>{genericItem.title}</strong>
              <button
                type="button"
                className="tr-hear-btn"
                onClick={() => {
                  if (genericItem.audioKind === 'number') {
                    playNumberAudio(Number(genericItem.audioTarget) || 0, true);
                  } else {
                    playWordAudio(genericItem.audioTarget, genericItem.title, true);
                  }
                }}
                data-testid="trace-hear-word-btn"
              >
                <SpeakerIcon />
                <span>Hear It</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <div
        className="tr-slate-wrap"
        ref={slateWrapRef}
        {...slatePointerHandlers}
        data-testid="trace-slate-wrap"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SLATE_WIDTH} ${SLATE_HEIGHT}`}
          className="tr-slate-svg"
          role="img"
          aria-label={`Ruled handwriting slate for ${pairDisplayTitle}`}
          data-testid="trace-slate-svg"
        >
          <rect x="0" y="0" width={SLATE_WIDTH} height={SLATE_HEIGHT} rx="22" fill="#FFFFFF" />

          {/* Ruled lines zone background tint */}
          {traceSpec.hasDescender ? (
            <rect
              x="28"
              y={GRASS_LINE_Y}
              width={SLATE_WIDTH - 56}
              height={ROOT_LINE_Y - GRASS_LINE_Y}
              rx="10"
              fill="#FFF8EC"
            />
          ) : null}

          {/* Sky, Fence, Grass, Root ruled lines */}
          <line x1="28" y1={SKY_LINE_Y} x2={SLATE_WIDTH - 28} y2={SKY_LINE_Y} stroke="#BFD7F5" strokeWidth="2.4" />
          <line
            x1="28"
            y1={FENCE_LINE_Y}
            x2={SLATE_WIDTH - 28}
            y2={FENCE_LINE_Y}
            stroke="#C7CDD8"
            strokeWidth="2.4"
            strokeDasharray="10 9"
          />
          <line x1="28" y1={GRASS_LINE_Y} x2={SLATE_WIDTH - 28} y2={GRASS_LINE_Y} stroke="#8FD3C8" strokeWidth="3.2" />
          <line
            x1="28"
            y1={ROOT_LINE_Y}
            x2={SLATE_WIDTH - 28}
            y2={ROOT_LINE_Y}
            stroke={traceSpec.hasDescender ? '#E8B872' : '#E7E9F0'}
            strokeWidth={traceSpec.hasDescender ? 2.4 : 1.6}
            strokeDasharray={traceSpec.hasDescender ? undefined : '5 7'}
          />

          {/* Margin labels */}
          <text x="42" y={SKY_LINE_Y - 12} className="tr-line-tag tr-line-tag--sky">
            SKY
          </text>
          <text x="42" y={FENCE_LINE_Y - 10} className="tr-line-tag">
            FENCE
          </text>
          <text x="42" y={GRASS_LINE_Y - 10} className="tr-line-tag tr-line-tag--grass">
            GRASS
          </text>
          <text
            x="42"
            y={ROOT_LINE_Y + 18}
            className={`tr-line-tag ${traceSpec.hasDescender ? 'tr-line-tag--root' : ''}`}
          >
            {traceSpec.hasDescender ? 'ROOT (dip below grass!)' : 'ROOT'}
          </text>

          {/* Divider between Capital and Small when side-by-side */}
          {activeTraceMode === 'letters' && config.caseMode === 'both' && (
            <line
              x1="376"
              y1="36"
              x2="376"
              y2={ROOT_LINE_Y + 18}
              stroke="#EAECEF"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          )}

          {/* Zone header pills inside the slate */}
          {traceSpec.glyphs.map((glyph) => (
            <g key={`${glyph.glyphCase}-${glyph.centerX}`} transform={`translate(${glyph.centerX} 34)`}>
              <rect
                x="-64"
                y="-15"
                width="128"
                height="28"
                rx="14"
                fill={glyph.glyphCase === 'upper' ? '#ECEBFF' : '#E4F6F3'}
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                className="tr-zone-label"
                fill={glyph.glyphCase === 'upper' ? '#4949B8' : '#237A6F'}
              >
                {glyph.label.toUpperCase()} ({glyph.startOrder}
                {glyph.endOrder > glyph.startOrder ? `–${glyph.endOrder}` : ''})
              </text>
            </g>
          ))}

          {/* Anti-reversal reminder pill for B/D/P/Q */}
          {isReversalPair && reversalCue && (
            <g transform={`translate(${config.caseMode === 'both' ? 522 : 350} ${ROOT_LINE_Y + 24})`}>
              <rect x="-126" y="-14" width="252" height="26" rx="13" fill="#FFF3D6" stroke="#F2B84B" strokeWidth="1.4" />
              <text x="0" y="3" textAnchor="middle" className="tr-reversal-tag">
                {reversalCue}
              </text>
            </g>
          )}

          {/* Layer 1: Base light ghost tracks for all strokes */}
          {traceSpec.strokes.map((s) =>
            s.kind === 'dot' ? (
              <circle
                key={`ghost-${s.order}`}
                cx={s.start.x}
                cy={s.start.y}
                r={15}
                fill="#E8E4DA"
              />
            ) : (
              <path
                key={`ghost-${s.order}`}
                d={s.svgPath}
                fill="none"
                stroke="#E8E4DA"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ),
          )}

          {/* Layer 2: Highlighted dashed directional guide for the active stroke */}
          {phase !== 'pair-complete' && activeStroke && activeStroke.kind === 'line' && (
            <path
              d={activeStroke.svgPath}
              fill="none"
              stroke="#C9CCFA"
              strokeWidth={STROKE_WIDTH + 6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="14 14"
              opacity={0.7}
            />
          )}

          {/* Layer 3: Future locked stroke subtle directional arrows & muted badges */}
          {phase !== 'pair-complete' &&
            futureStrokes.map((s) => (
              <g key={`future-${s.order}`} opacity={0.85}>
                {s.arrows.slice(0, 1).map((a, aIdx) => (
                  <g
                    key={aIdx}
                    transform={`translate(${a.x} ${a.y}) rotate(${a.angleDeg})`}
                  >
                    <path
                      d="M -4 -5 L 4 0 L -4 5"
                      fill="none"
                      stroke="#9DA4B5"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ))}
                <circle
                  cx={s.ghostBadgePos.x}
                  cy={s.ghostBadgePos.y}
                  r="16"
                  fill="#F7F5F0"
                  stroke="#9AA2B5"
                  strokeWidth="2.4"
                  data-testid={`trace-locked-badge-${s.order}`}
                />
                <text
                  x={s.ghostBadgePos.x}
                  y={s.ghostBadgePos.y + 5}
                  textAnchor="middle"
                  className="tr-badge-num tr-badge-num--locked"
                >
                  {s.order}
                </text>
              </g>
            ))}

          {/* Layer 4: Completed strokes (Indigo while in progress, Mint on pair complete!) */}
          {completedStrokes.map((s) =>
            s.kind === 'dot' ? (
              <circle
                key={`done-${s.order}`}
                cx={s.start.x}
                cy={s.start.y}
                r={15}
                fill={completedStrokeColor}
                data-testid={`trace-completed-stroke-${s.order}`}
              />
            ) : (
              <path
                key={`done-${s.order}`}
                d={s.svgPath}
                fill="none"
                stroke={completedStrokeColor}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                data-testid={`trace-completed-stroke-${s.order}`}
              />
            ),
          )}

          {/* Layer 5: Active stroke directional chevron arrows */}
          {phase !== 'pair-complete' &&
            activeStroke &&
            activeStroke.arrows.map((a, idx) => (
              <g
                key={`active-arrow-${activeStroke.order}-${idx}`}
                transform={`translate(${a.x} ${a.y}) rotate(${a.angleDeg})`}
              >
                <path
                  d="M -5 -6 L 5 0 L -5 6"
                  fill="none"
                  stroke="#5B5BD6"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

          {/* Layer 6: Live partial ink traced along active stroke */}
          {livePolylinePoints && (
            <polyline
              points={livePolylinePoints}
              fill="none"
              stroke="#5B5BD6"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              data-testid="trace-live-ink"
            />
          )}

          {/* Layer 7: Dual-Input Sequential Stepping Stones (when toggled on or via Badge tap) */}
          {phase === 'tracing' &&
            activeStroke &&
            stepDotsEnabled &&
            activeStroke.kind === 'line' &&
            STEP_MILESTONES.map((frac, idx) => {
              const stonePt = pointAlongStroke(activeStroke, frac);
              const isDone = idx < milestoneIdx;
              const isNext = idx === milestoneIdx;
              return (
                <g
                  key={`step-${activeStroke.order}-${idx}`}
                  data-testid={`trace-step-dot-${idx}`}
                  style={{ cursor: isNext ? 'pointer' : 'default' }}
                >
                  <circle
                    cx={stonePt.x}
                    cy={stonePt.y}
                    r={isNext ? 19 : 15}
                    fill={isDone ? '#3BA99C' : isNext ? '#FFF3D6' : '#FFFFFF'}
                    stroke={isDone ? '#2B877C' : isNext ? '#F2B84B' : '#9AA2B5'}
                    strokeWidth={isNext ? 3.5 : 2.2}
                  />
                  <text
                    x={stonePt.x}
                    y={stonePt.y + 4.5}
                    textAnchor="middle"
                    className="tr-step-dot-label"
                    fill={isDone ? '#FFFFFF' : isNext ? '#9A5F04' : '#6A7285'}
                  >
                    {isDone ? '✓' : idx + 1}
                  </text>
                </g>
              );
            })}

          {/* Layer 8: Active numbered circle badge */}
          {phase !== 'pair-complete' && activeStroke && (
            <g data-testid={`trace-active-badge-${activeStroke.order}`}>
              <circle
                cx={activeStroke.start.x}
                cy={activeStroke.start.y}
                r="29"
                fill="rgba(91, 91, 214, 0.16)"
                className="tr-active-halo"
              />
              <circle
                cx={activeStroke.start.x}
                cy={activeStroke.start.y}
                r="21"
                fill="#5B5BD6"
                stroke="#FFFFFF"
                strokeWidth="3.5"
              />
              <text
                x={activeStroke.start.x}
                y={activeStroke.start.y + 6.5}
                textAnchor="middle"
                className="tr-badge-num tr-badge-num--active"
              >
                {activeStroke.order}
              </text>
            </g>
          )}

          {/* Layer 9: Completed green checkmark dots */}
          {completedStrokes.map((s) => (
            <g key={`done-badge-${s.order}`}>
              <circle
                cx={s.start.x}
                cy={s.start.y}
                r="13"
                fill={phase === 'pair-complete' ? '#3BA99C' : '#FFFFFF'}
                stroke={phase === 'pair-complete' ? '#FFFFFF' : '#5B5BD6'}
                strokeWidth="2.4"
              />
              <path
                d={`M ${s.start.x - 4.5} ${s.start.y + 0.5} L ${s.start.x - 1} ${s.start.y + 4} L ${s.start.x + 5} ${s.start.y - 3.5}`}
                fill="none"
                stroke={phase === 'pair-complete' ? '#FFFFFF' : '#5B5BD6'}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Layer 10: Warm Honey guide pebble animation (shows exact start -> arrow trajectory) */}
          {guidePoint && (
            <g data-testid="trace-guide-pebble">
              <circle
                cx={guidePoint.x}
                cy={guidePoint.y}
                r="24"
                fill="rgba(242, 184, 75, 0.34)"
              />
              <circle
                cx={guidePoint.x}
                cy={guidePoint.y}
                r="14"
                fill="#F2B84B"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
            </g>
          )}

          {/* Layer 11: Rejected touch ripple (draws ZERO ink path!) */}
          {blockedCue && (
            <g key={blockedCue.key} data-testid="trace-blocked-cue">
              <circle
                cx={blockedCue.x}
                cy={blockedCue.y}
                r="24"
                fill="rgba(242, 122, 94, 0.16)"
                stroke="#F27A5E"
                strokeWidth="3"
              />
              <circle cx={blockedCue.x} cy={blockedCue.y} r="7" fill="#F27A5E" />
            </g>
          )}
        </svg>
      </div>

      <footer className="tr-footer-bar">
        <div
          className={`tr-status-pill tr-status-pill--${banner.tone}`}
          role="status"
          aria-live="polite"
          data-testid="trace-status-banner"
        >
          {banner.text}
        </div>

        <div className="tr-footer-actions">
          {phase === 'tracing' && activeStroke && activeStroke.kind === 'line' && (
            <button
              type="button"
              className={`icon-pill-btn icon-pill-btn--compact ${
                stepDotsEnabled ? 'tr-btn-active' : ''
              }`}
              data-testid="trace-step-dots-toggle"
              onClick={() => {
                setStepDotsEnabled((prev) => !prev);
                setMilestoneIdx(0);
              }}
            >
              {stepDotsEnabled ? 'Step Dots: On' : 'Step Dots'}
            </button>
          )}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            data-testid="trace-restart-letter-btn"
            onClick={handleRestartLetter}
            disabled={phase === 'pair-complete' || phase === 'won'}
          >
            Clear {pairDisplayTitle}
          </button>
        </div>
      </footer>

      {phase === 'won' && !journeyContext && (
        <WinnerModal
          standings={[
            {
              profile: childProfile,
              score: deck.length,
              attempts: deck.length + wrongDragsCount,
            },
          ]}
          totalPairs={deck.length}
          themeTitle="Letter Trace"
          unitLabel="letters"
          soloVerb="traced"
          soundEnabled={soundEnabled}
          onPlayAgain={handleResetWholeRound}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}
    </main>
  );
}

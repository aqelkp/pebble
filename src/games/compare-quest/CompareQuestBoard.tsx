import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  clientToLogicalPoint,
  usePointerStroke,
  type LogicalPoint,
} from '../../engine/usePointerStroke';
import { useStageSize } from '../../engine/useStageSize';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import {
  buildCompareRoundDeck,
  classifyDrawnCompareSymbol,
  COMPARE_ACTIVE_SESSION_KEY,
  computeCompareSymbol,
  formatComparisonSentence,
  formatTeachFirstExplanation,
  getCompareItemSpec,
  getCompareJuiceSpec,
  getCompareModeSpec,
  isValidCompareConcreteKind,
  isValidCompareItemId,
  isValidCompareJuiceId,
  isValidCompareModeId,
  isValidCompareRoundSize,
  recordComparePromptOutcome,
  recordCompareRoundFinished,
  type ComparePromptSpec,
  type CompareQuestConfig,
  type CompareSymbol,
} from './compareData';
import {
  playCompareCorrectChime,
  playCompareNumberTapVoice,
  playComparePromptCueVoice,
  playCompareRelationPreviewVoice,
  playCompareRoundFanfare,
  playCompareSuccessVoice,
  playCompareTeachMistakeVoice,
  playCompareTilePickupSound,
  playCompareWrongTap,
  playItemCountMarimbaNote,
  preloadCompareRoundAssets,
  stopCompareVoice,
} from './compareSounds';
import './CompareQuest.css';

interface CompareQuestBoardProps {
  gameKey?: number | string;
  config: CompareQuestConfig;
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

interface PersistedCompareSession {
  version: 1;
  modeId: CompareQuestConfig['modeId'];
  roundSize: CompareQuestConfig['roundSize'];
  prompts: ComparePromptSpec[];
  promptIndex: number;
  promptMistakes: number;
  roundMistakes: number;
  totalAttempts: number;
  flawlessSolved: number;
}

interface DragTileState {
  symbol: CompareSymbol;
  pointerId: number;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  moved: boolean;
}

const CENTER_LOGICAL_SIZE = 160;
const SYMBOL_CHOICES: readonly { symbol: CompareSymbol; label: string }[] = [
  { symbol: '>', label: 'Greater than' },
  { symbol: '=', label: 'Equal to' },
  { symbol: '<', label: 'Less than' },
];

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

function AcornArt({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 9C33 5 37 4 40 6"
        stroke="#6B4423"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M16 27C16 17 23 12 32 12C41 12 48 17 48 27H16Z"
        fill="#7C4F2B"
      />
      <rect x="13" y="23" width="38" height="7" rx="3.5" fill="#633D1F" />
      <path
        d="M18 30H46C46 44 39 53 32 56C25 53 18 44 18 30Z"
        fill="#C98A4B"
      />
      <ellipse cx="26" cy="39" rx="3.5" ry="7" fill="#E3AE74" opacity="0.65" />
    </svg>
  );
}

/**
 * Friendly visual symbol glyph showing wide-open side dots (2 dots = bigger side,
 * 1 dot = smaller side) for `>` and `<`, and balanced twin bars for `=`.
 */
function SymbolCueGlyph({ symbol }: { symbol: CompareSymbol }) {
  if (symbol === '>') {
    return (
      <svg width="68" height="44" viewBox="0 0 68 44" fill="none" aria-hidden="true">
        <circle cx="15" cy="10" r="4" fill="#3BA99C" opacity="0.85" />
        <circle cx="15" cy="34" r="4" fill="#3BA99C" opacity="0.85" />
        <circle cx="54" cy="22" r="3" fill="#5B5BD6" opacity="0.65" />
        <path
          d="M23 9L46 22L23 35"
          stroke="#2E3552"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (symbol === '<') {
    return (
      <svg width="68" height="44" viewBox="0 0 68 44" fill="none" aria-hidden="true">
        <circle cx="14" cy="22" r="3" fill="#5B5BD6" opacity="0.65" />
        <circle cx="53" cy="10" r="4" fill="#3BA99C" opacity="0.85" />
        <circle cx="53" cy="34" r="4" fill="#3BA99C" opacity="0.85" />
        <path
          d="M45 9L22 22L45 35"
          stroke="#2E3552"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="68" height="44" viewBox="0 0 68 44" fill="none" aria-hidden="true">
      <circle cx="15" cy="15" r="3.4" fill="#5B5BD6" opacity="0.7" />
      <circle cx="53" cy="15" r="3.4" fill="#5B5BD6" opacity="0.7" />
      <circle cx="15" cy="29" r="3.4" fill="#5B5BD6" opacity="0.7" />
      <circle cx="53" cy="29" r="3.4" fill="#5B5BD6" opacity="0.7" />
      <path
        d="M22 15H46M22 29H46"
        stroke="#2E3552"
        strokeWidth="6.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// TODO(security): Pebble runs locally as a static client-only PWA; all restored sessionStorage
// prompt decks, values, and counters are validated against strict allow-lists and bounds.
function tryRestoreCompareSession(config: CompareQuestConfig): {
  prompts: ComparePromptSpec[];
  promptIndex: number;
  promptMistakes: number;
  roundMistakes: number;
  totalAttempts: number;
  flawlessSolved: number;
} | null {
  try {
    const raw = window.sessionStorage.getItem(COMPARE_ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedCompareSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !isValidCompareModeId(parsed.modeId) ||
      parsed.modeId !== config.modeId ||
      !isValidCompareRoundSize(parsed.roundSize) ||
      parsed.roundSize !== config.roundSize ||
      !Array.isArray(parsed.prompts) ||
      parsed.prompts.length !== config.roundSize ||
      typeof parsed.promptIndex !== 'number' ||
      !Number.isInteger(parsed.promptIndex) ||
      parsed.promptIndex < 0 ||
      parsed.promptIndex >= config.roundSize
    ) {
      return null;
    }

    const prompts: ComparePromptSpec[] = [];
    for (let i = 0; i < parsed.prompts.length; i += 1) {
      const p = parsed.prompts[i];
      if (!p || typeof p !== 'object') return null;
      if (
        !isValidCompareConcreteKind(p.kind) ||
        typeof p.leftValue !== 'number' ||
        !Number.isInteger(p.leftValue) ||
        p.leftValue < 0 ||
        p.leftValue > 10 ||
        typeof p.rightValue !== 'number' ||
        !Number.isInteger(p.rightValue) ||
        p.rightValue < 0 ||
        p.rightValue > 10 ||
        (p.kind === 'length' && (p.leftValue < 1 || p.rightValue < 1)) ||
        !isValidCompareItemId(p.itemThemeId) ||
        (p.lengthVariant !== 'sticks' && p.lengthVariant !== 'towers') ||
        !isValidCompareJuiceId(p.juiceFlavorId)
      ) {
        return null;
      }

      prompts.push({
        uid: typeof p.uid === 'string' && p.uid.length <= 48 ? p.uid : `cmp-restored-${i}`,
        kind: p.kind,
        leftValue: p.leftValue,
        rightValue: p.rightValue,
        answer: computeCompareSymbol(p.leftValue, p.rightValue),
        itemThemeId: p.itemThemeId,
        lengthVariant: p.lengthVariant,
        juiceFlavorId: p.juiceFlavorId,
      });
    }

    const clamp = (v: unknown, max: number) =>
      typeof v === 'number' && Number.isFinite(v)
        ? Math.max(0, Math.min(max, Math.floor(v)))
        : 0;

    return {
      prompts,
      promptIndex: parsed.promptIndex,
      promptMistakes: clamp(parsed.promptMistakes, 99),
      roundMistakes: clamp(parsed.roundMistakes, 999),
      totalAttempts: clamp(parsed.totalAttempts, 999),
      flawlessSolved: clamp(parsed.flawlessSolved, config.roundSize),
    };
  } catch {
    return null;
  }
}

function saveCompareSession(state: PersistedCompareSession): void {
  try {
    window.sessionStorage.setItem(COMPARE_ACTIVE_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function clearCompareSession(): void {
  try {
    window.sessionStorage.removeItem(COMPARE_ACTIVE_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

function strokePointsToPathD(points: readonly LogicalPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} l 0.1 0.1`;
  }
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}

export function CompareQuestBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: CompareQuestBoardProps) {
  const initialRestored = useMemo(() => tryRestoreCompareSession(config), [config]);

  const [prompts, setPrompts] = useState<ComparePromptSpec[]>(
    () => initialRestored?.prompts ?? buildCompareRoundDeck(config),
  );
  const [promptIndex, setPromptIndex] = useState<number>(initialRestored?.promptIndex ?? 0);
  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [promptMistakes, setPromptMistakes] = useState<number>(
    initialRestored?.promptMistakes ?? 0,
  );
  const [roundMistakes, setRoundMistakes] = useState<number>(initialRestored?.roundMistakes ?? 0);
  const [totalAttempts, setTotalAttempts] = useState<number>(initialRestored?.totalAttempts ?? 0);
  const [flawlessSolved, setFlawlessSolved] = useState<number>(
    initialRestored?.flawlessSolved ?? 0,
  );

  const [lockedSymbol, setLockedSymbol] = useState<CompareSymbol | null>(null);
  const [wrongSymbol, setWrongSymbol] = useState<CompareSymbol | null>(null);
  const [countedLeft, setCountedLeft] = useState<number[]>([]);
  const [countedRight, setCountedRight] = useState<number[]>([]);

  const [completedStrokes, setCompletedStrokes] = useState<LogicalPoint[][]>([]);
  const [activeStroke, setActiveStroke] = useState<LogicalPoint[]>([]);
  const [drawHintNote, setDrawHintNote] = useState<string>('');
  const [dragState, setDragState] = useState<DragTileState | null>(null);
  const [isDropHover, setIsDropHover] = useState<boolean>(false);
  const [confettiKey, setConfettiKey] = useState<number>(0);

  const [stageRef, stageSize] = useStageSize<HTMLDivElement>();
  const centerBoxRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const voiceCleanupRef = useRef<(() => void) | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const secondStrokeTimerRef = useRef<number | null>(null);
  const strokesRef = useRef<LogicalPoint[][]>([]);
  const activeStrokeRef = useRef<LogicalPoint[]>([]);

  const currentPrompt = prompts[promptIndex] ?? prompts[0];
  const modeSpec = useMemo(() => getCompareModeSpec(config.modeId), [config.modeId]);

  const clearTimersAndVoice = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (secondStrokeTimerRef.current !== null) {
      window.clearTimeout(secondStrokeTimerRef.current);
      secondStrokeTimerRef.current = null;
    }
    voiceCleanupRef.current?.();
    voiceCleanupRef.current = null;
    stopCompareVoice();
  }, []);

  useEffect(() => {
    preloadCompareRoundAssets(prompts);
  }, [prompts]);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'won');
    return () => {
      onGameActiveChange?.(false);
    };
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    return () => {
      clearTimersAndVoice();
    };
  }, [clearTimersAndVoice]);

  useEffect(() => {
    if (phase === 'won') {
      clearCompareSession();
      return;
    }
    saveCompareSession({
      version: 1,
      modeId: config.modeId,
      roundSize: config.roundSize,
      prompts,
      promptIndex,
      promptMistakes,
      roundMistakes,
      totalAttempts,
      flawlessSolved,
    });
  }, [
    config.modeId,
    config.roundSize,
    flawlessSolved,
    phase,
    promptIndex,
    promptMistakes,
    prompts,
    roundMistakes,
    totalAttempts,
  ]);

  // Speak calm prompt cue when entering a new prompt
  useEffect(() => {
    if (!currentPrompt) return;
    setCountedLeft([]);
    setCountedRight([]);
    setCompletedStrokes([]);
    setActiveStroke([]);
    strokesRef.current = [];
    activeStrokeRef.current = [];
    setDrawHintNote('');

    const cancelCue = playComparePromptCueVoice(currentPrompt, soundEnabled);
    return () => {
      cancelCue();
    };
  }, [currentPrompt, promptIndex, soundEnabled]);

  const resetDrawCanvas = useCallback(() => {
    if (secondStrokeTimerRef.current !== null) {
      window.clearTimeout(secondStrokeTimerRef.current);
      secondStrokeTimerRef.current = null;
    }
    strokesRef.current = [];
    activeStrokeRef.current = [];
    setCompletedStrokes([]);
    setActiveStroke([]);
  }, []);

  const submitSymbolChoice = useCallback(
    (chosen: CompareSymbol) => {
      if (!currentPrompt || phase !== 'playing') return;
      clearTimersAndVoice();
      resetDrawCanvas();
      setDrawHintNote('');

      const nextTotalAttempts = totalAttempts + 1;
      setTotalAttempts(nextTotalAttempts);

      if (chosen === currentPrompt.answer) {
        const cleanFirstTry = promptMistakes === 0;
        const nextFlawless = flawlessSolved + (cleanFirstTry ? 1 : 0);
        setFlawlessSolved(nextFlawless);
        setLockedSymbol(chosen);
        setWrongSymbol(null);
        setPhase('celebrating');
        setConfettiKey((k) => k + 1);

        const conceptId =
          currentPrompt.answer === '>'
            ? 'compare:greater-than'
            : currentPrompt.answer === '<'
              ? 'compare:less-than'
              : 'compare:equal-to';
        const conceptLabel =
          currentPrompt.answer === '>'
            ? 'Greater Than (>)'
            : currentPrompt.answer === '<'
              ? 'Less Than (<)'
              : 'Equal To (=)';

        recordComparePromptOutcome(currentPrompt.answer, currentPrompt.kind, cleanFirstTry);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'compare-quest',
          conceptId,
          conceptLabel,
          skillType: 'quantity_counting',
          correct: cleanFirstTry,
          attemptsTaken: promptMistakes + 1,
        });

        playCompareCorrectChime(promptIndex, soundEnabled);

        const advanceNext = () => {
          advanceTimerRef.current = window.setTimeout(() => {
            if (promptIndex + 1 >= prompts.length) {
              const roundFlawless = roundMistakes === 0;
              recordCompareRoundFinished(roundFlawless);
              recordLearningSession({
                playerId: childProfile.id,
                gameId: 'compare-quest',
                mode: config.modeId,
                totalAttempts: nextTotalAttempts,
                correctAttempts: prompts.length,
                mistakes: roundMistakes,
                flawless: roundFlawless,
                durationMs: Date.now() - startedAtRef.current,
                conceptsTested: Array.from(
                  new Set(
                    prompts.map((p) =>
                      p.answer === '>'
                        ? 'compare:greater-than'
                        : p.answer === '<'
                          ? 'compare:less-than'
                          : 'compare:equal-to',
                    ),
                  ),
                ),
              });
              setPhase('won');
              setConfettiKey((k) => k + 1);
              voiceCleanupRef.current = playCompareRoundFanfare(roundFlawless, soundEnabled);
            } else {
              setLockedSymbol(null);
              setWrongSymbol(null);
              setPromptMistakes(0);
              setPromptIndex((idx) => idx + 1);
              setPhase('playing');
            }
          }, 520);
        };

        voiceCleanupRef.current = playCompareSuccessVoice(
          currentPrompt.leftValue,
          currentPrompt.rightValue,
          soundEnabled,
          advanceNext,
        );
        return;
      }

      // Wrong choice -> Step 1: Teach-First on visible board (~2.8s+, input locked)
      setPromptMistakes((m) => m + 1);
      setRoundMistakes((m) => m + 1);
      setWrongSymbol(chosen);
      setLockedSymbol(null);
      setPhase('teach-mistake');
      playCompareWrongTap(soundEnabled);

      voiceCleanupRef.current = playCompareTeachMistakeVoice(
        currentPrompt.leftValue,
        currentPrompt.rightValue,
        soundEnabled,
        () => {
          setPhase('think-again');
        },
      );
    },
    [
      childProfile.id,
      clearTimersAndVoice,
      config.modeId,
      currentPrompt,
      flawlessSolved,
      phase,
      promptIndex,
      promptMistakes,
      prompts,
      resetDrawCanvas,
      roundMistakes,
      soundEnabled,
      totalAttempts,
    ],
  );

  const handleResumeAfterThinkAgain = useCallback(() => {
    setWrongSymbol(null);
    setLockedSymbol(null);
    resetDrawCanvas();
    setPhase('playing');
    if (currentPrompt) {
      voiceCleanupRef.current = playComparePromptCueVoice(currentPrompt, soundEnabled);
    }
  }, [currentPrompt, resetDrawCanvas, soundEnabled]);

  const handleStartAgainFreshRound = useCallback(() => {
    clearTimersAndVoice();
    resetDrawCanvas();
    clearCompareSession();
    startedAtRef.current = Date.now();
    const freshDeck = buildCompareRoundDeck(config);
    setPrompts(freshDeck);
    setPromptIndex(0);
    setPromptMistakes(0);
    setRoundMistakes(0);
    setTotalAttempts(0);
    setFlawlessSolved(0);
    setLockedSymbol(null);
    setWrongSymbol(null);
    setPhase('playing');
  }, [clearTimersAndVoice, config, resetDrawCanvas]);

  // Finger writing inside center `[ ? ]` box via `usePointerStroke`
  const evaluateDrawnStrokes = useCallback(
    (strokes: LogicalPoint[][], finalizingTimeout: boolean) => {
      const result = classifyDrawnCompareSymbol(strokes, finalizingTimeout);
      if (result.status === 'recognized') {
        submitSymbolChoice(result.symbol);
        return;
      }
      if (result.status === 'await-second-stroke') {
        setDrawHintNote('Add 2nd line for =');
        secondStrokeTimerRef.current = window.setTimeout(() => {
          evaluateDrawnStrokes(strokesRef.current, true);
        }, 720);
        return;
      }
      if (result.status === 'unrecognized') {
        setDrawHintNote('Draw >, <, or = — or tap a tile!');
      }
      resetDrawCanvas();
    },
    [resetDrawCanvas, submitSymbolChoice],
  );

  const { isDrawing, handlers: drawHandlers } = usePointerStroke<LogicalPoint>({
    enabled: phase === 'playing' && dragState === null,
    resolvePoint: (event) =>
      clientToLogicalPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
        CENTER_LOGICAL_SIZE,
        CENTER_LOGICAL_SIZE,
        'stretch',
      ),
    onStrokeStart: (pt) => {
      if (secondStrokeTimerRef.current !== null) {
        window.clearTimeout(secondStrokeTimerRef.current);
        secondStrokeTimerRef.current = null;
      }
      setDrawHintNote('');
      activeStrokeRef.current = [pt];
      setActiveStroke([pt]);
    },
    onStrokeMove: (pt) => {
      const prev = activeStrokeRef.current[activeStrokeRef.current.length - 1];
      if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 2.2) return;
      const next = [...activeStrokeRef.current, pt];
      activeStrokeRef.current = next;
      setActiveStroke(next);
    },
    onStrokeEnd: (pt) => {
      const finished =
        pt && activeStrokeRef.current.length > 0
          ? [...activeStrokeRef.current, pt]
          : [...activeStrokeRef.current];
      activeStrokeRef.current = [];
      setActiveStroke([]);
      if (finished.length < 2) {
        if (strokesRef.current.length === 0) {
          resetDrawCanvas();
        }
        return;
      }
      const nextStrokes = [...strokesRef.current, finished];
      strokesRef.current = nextStrokes;
      setCompletedStrokes(nextStrokes);
      evaluateDrawnStrokes(nextStrokes, false);
    },
    onStrokeCancel: () => {
      resetDrawCanvas();
    },
  });

  // Dual Tap + Drag on `[ > ]`, `[ = ]`, `[ < ]` tiles
  const isClientNearCenterBox = useCallback((clientX: number, clientY: number): boolean => {
    const el = centerBoxRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const pad = 34;
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  }, []);

  const handleTilePointerDown = (
    symbol: CompareSymbol,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (phase !== 'playing') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignore synthetic event capture errors
    }
    playCompareTilePickupSound(soundEnabled);
    setDragState({
      symbol,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: false,
    });
    setIsDropHover(false);
  };

  const handleTilePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dist = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    const moved = dragState.moved || dist >= 10;
    setDragState({
      ...dragState,
      clientX: event.clientX,
      clientY: event.clientY,
      moved,
    });
    if (moved) {
      setIsDropHover(isClientNearCenterBox(event.clientX, event.clientY));
    }
  };

  const handleTilePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore release errors
    }
    const chosen = dragState.symbol;
    const wasDrag = dragState.moved;
    const overCenter = isClientNearCenterBox(event.clientX, event.clientY);
    setDragState(null);
    setIsDropHover(false);

    if (!wasDrag || overCenter) {
      submitSymbolChoice(chosen);
    }
  };

  const handleTilePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setDragState(null);
    setIsDropHover(false);
  };

  // Tap-to-count items in Quantity mode
  const handleBasketItemTap = (side: 'left' | 'right', itemIdx: number) => {
    if (phase !== 'playing') return;
    if (side === 'left') {
      const existingPos = countedLeft.indexOf(itemIdx);
      if (existingPos >= 0) {
        playItemCountMarimbaNote(existingPos + 1, soundEnabled, true);
        return;
      }
      const next = [...countedLeft, itemIdx];
      setCountedLeft(next);
      playItemCountMarimbaNote(next.length, soundEnabled, true);
    } else {
      const existingPos = countedRight.indexOf(itemIdx);
      if (existingPos >= 0) {
        playItemCountMarimbaNote(existingPos + 1, soundEnabled, true);
        return;
      }
      const next = [...countedRight, itemIdx];
      setCountedRight(next);
      playItemCountMarimbaNote(next.length, soundEnabled, true);
    }
  };

  const showNumeralsOnConcrete = phase === 'celebrating' || phase === 'teach-mistake';
  const showTeachScaffolding = phase === 'teach-mistake';

  const itemBtnSize = useMemo(() => {
    if (!stageSize.ready) return 42;
    const cardBudgetW = Math.max(180, (stageSize.width - 160) / 2);
    return Math.max(32, Math.min(44, Math.floor((cardBudgetW - 44) / 5)));
  }, [stageSize.ready, stageSize.width]);

  const hudHeadline = useMemo(() => {
    if (!currentPrompt) return 'Compare Quest';
    if (phase === 'celebrating') {
      return formatComparisonSentence(currentPrompt.leftValue, currentPrompt.rightValue);
    }
    if (phase === 'teach-mistake') {
      return formatTeachFirstExplanation(currentPrompt.leftValue, currentPrompt.rightValue);
    }
    if (currentPrompt.kind === 'quantity') {
      return 'Count both baskets (tap items to count!) and place >, =, or <';
    }
    if (currentPrompt.kind === 'length') {
      return currentPrompt.lengthVariant === 'sticks'
        ? 'Compare Top Rod vs. Bottom Rod from the left line!'
        : 'Compare both block towers on the ground line!';
    }
    if (currentPrompt.kind === 'measure') {
      return 'Compare the juice cup levels in both pitchers!';
    }
    return 'Compare both numbers — tap, drag, or write >, =, or <!';
  }, [currentPrompt, phase]);

  const kindTagLabel = useMemo(() => {
    if (!currentPrompt) return '';
    if (currentPrompt.kind === 'quantity') return 'Count Baskets';
    if (currentPrompt.kind === 'length') {
      return currentPrompt.lengthVariant === 'sticks' ? 'Length Rods' : 'Block Towers';
    }
    if (currentPrompt.kind === 'measure') return 'Juice Jugs';
    return 'Numbers';
  }, [currentPrompt]);

  const renderQuantitySide = (side: 'left' | 'right', count: number) => {
    const itemSpec = getCompareItemSpec(currentPrompt.itemThemeId);
    const countedArr = side === 'left' ? countedLeft : countedRight;

    if (count === 0) {
      return (
        <div className="cq-basket-tray" data-testid={`compare-basket-${side}`} data-count="0">
          <div className="cq-empty-basket">
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none" aria-hidden="true">
              <path
                d="M6 12H50L44 34C43.4 36.2 41.4 38 39 38H17C14.6 38 12.6 36.2 12 34L6 12Z"
                fill="#EFE1C6"
                stroke="#C9AF82"
                strokeWidth="2.5"
              />
              <rect x="3" y="8" width="50" height="6" rx="3" fill="#DFC598" />
            </svg>
            <span>Empty Basket</span>
          </div>
        </div>
      );
    }

    const row1Count = Math.min(5, count);
    const row2Count = Math.max(0, count - 5);
    const row1Indices = Array.from({ length: row1Count }, (_, i) => i);
    const row2Indices = Array.from({ length: row2Count }, (_, i) => i + 5);

    const renderItemBtn = (idx: number) => {
      const badgeOrder = countedArr.indexOf(idx);
      const isCounted = badgeOrder >= 0;
      const shownBadge = showTeachScaffolding ? idx + 1 : isCounted ? badgeOrder + 1 : null;

      return (
        <button
          key={idx}
          type="button"
          className={`cq-item-btn ${isCounted || showTeachScaffolding ? 'is-counted' : ''}`}
          style={{ width: itemBtnSize, height: itemBtnSize }}
          onClick={() => handleBasketItemTap(side, idx)}
          aria-label={`${itemSpec.singularLabel} ${idx + 1}`}
          data-testid={`compare-item-${side}-${idx}`}
        >
          {itemSpec.imagePath ? (
            <img src={assetUrl(itemSpec.imagePath)} alt="" />
          ) : (
            <AcornArt size={Math.max(24, itemBtnSize - 8)} />
          )}
          {shownBadge !== null && <span className="cq-item-count-badge">{shownBadge}</span>}
        </button>
      );
    };

    return (
      <div
        className="cq-basket-tray"
        data-testid={`compare-basket-${side}`}
        data-count={String(count)}
      >
        <div className="cq-basket-row">{row1Indices.map(renderItemBtn)}</div>
        {row2Indices.length > 0 && (
          <div className="cq-basket-row">{row2Indices.map(renderItemBtn)}</div>
        )}
      </div>
    );
  };

  const renderTowerSide = (side: 'left' | 'right', count: number) => {
    const groundY = 214;
    const blockH = 18;
    const blockW = 86;
    const fillPrimary = side === 'left' ? '#5B5BD6' : '#F27A5E';
    const fillLight = side === 'left' ? '#7E7EE6' : '#F79A83';

    return (
      <svg
        viewBox="0 0 180 232"
        className="cq-tower-svg"
        aria-label={`${count} blocks high`}
        data-testid={`compare-tower-${side}`}
      >
        {/* Subtle 1..10 height ruler ticks */}
        {Array.from({ length: 10 }, (_, idx) => {
          const level = idx + 1;
          const y = groundY - level * blockH;
          const isMajor = level === 5 || level === 10;
          return (
            <g key={level}>
              <line
                x1="20"
                y1={y}
                x2="160"
                y2={y}
                stroke={isMajor ? '#D8D2C5' : '#ECE8DF'}
                strokeWidth={isMajor ? '1.6' : '1'}
                strokeDasharray={isMajor ? undefined : '3 3'}
              />
              {(isMajor || showNumeralsOnConcrete) && level === count && (
                <text
                  x="16"
                  y={y + 4}
                  textAnchor="end"
                  fontFamily="Fredoka, sans-serif"
                  fontSize="12"
                  fontWeight="700"
                  fill="#5B5BD6"
                >
                  {level}
                </text>
              )}
            </g>
          );
        })}

        {/* Shared ground line */}
        <line
          x1="14"
          y1={groundY}
          x2="166"
          y2={groundY}
          stroke="#8D7B65"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Stacked tactile blocks */}
        {Array.from({ length: count }, (_, idx) => {
          const y = groundY - (idx + 1) * blockH + 1;
          return (
            <g key={idx}>
              <rect
                x={(180 - blockW) / 2}
                y={y}
                width={blockW}
                height={blockH - 2}
                rx="5"
                fill={idx % 2 === 0 ? fillPrimary : fillLight}
              />
              <rect
                x={(180 - blockW) / 2 + 6}
                y={y + 3}
                width={blockW - 12}
                height="3"
                rx="1.5"
                fill="#FFFFFF"
                opacity="0.32"
              />
            </g>
          );
        })}

        {/* Top alignment marker when teaching or celebrating */}
        {showNumeralsOnConcrete && (
          <line
            x1="24"
            y1={groundY - count * blockH}
            x2="156"
            y2={groundY - count * blockH}
            stroke="#3BA99C"
            strokeWidth="2.8"
            strokeDasharray="5 4"
          />
        )}
      </svg>
    );
  };

  const renderJugSide = (side: 'left' | 'right', cups: number) => {
    const juice = getCompareJuiceSpec(currentPrompt.juiceFlavorId);
    const bottomY = 204;
    const topCupY = 44; // 10 cups -> 16px per cup
    const pxPerCup = (bottomY - topCupY) / 10;
    const liquidTopY = bottomY - cups * pxPerCup;
    const clipId = `cq-jug-clip-${side}`;
    const gradId = `cq-jug-grad-${side}`;

    return (
      <svg
        viewBox="0 0 186 228"
        className="cq-jug-svg"
        aria-label={`${cups} cups of ${juice.label}`}
        data-testid={`compare-jug-${side}`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="44" y="34" width="88" height="170" rx="14" />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={juice.fillTop} />
            <stop offset="100%" stopColor={juice.fillBottom} />
          </linearGradient>
        </defs>

        {/* Pitcher handle */}
        <path
          d="M132 62H148C156 62 162 68 162 76V154C162 162 156 168 148 168H132"
          stroke="#C5D5E2"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Glass interior */}
        <rect
          x="44"
          y="34"
          width="88"
          height="170"
          rx="14"
          fill="#F4F9FC"
          stroke="#B4C8D8"
          strokeWidth="3.5"
        />

        {/* Juice fill */}
        {cups > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <rect
              x="44"
              y={liquidTopY}
              width="88"
              height={bottomY - liquidTopY + 6}
              fill={`url(#${gradId})`}
            />
            <ellipse
              cx="88"
              cy={liquidTopY}
              rx="43"
              ry="3.5"
              fill={juice.rimHighlight}
              opacity="0.85"
            />
          </g>
        )}

        {/* Pouring rim */}
        <path
          d="M38 34H136"
          stroke="#9EB6CA"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* 0..10 cup graduation ticks */}
        {Array.from({ length: 11 }, (_, level) => {
          const y = bottomY - level * pxPerCup;
          const isMajor = level === 0 || level === 5 || level === 10;
          return (
            <g key={level}>
              <line
                x1="48"
                y1={y}
                x2={isMajor ? '68' : '60'}
                y2={y}
                stroke={isMajor ? '#4A5B6D' : '#7E90A2'}
                strokeWidth={isMajor ? '2.2' : '1.4'}
                strokeLinecap="round"
              />
              {isMajor && (
                <text
                  x="35"
                  y={y + 4}
                  textAnchor="end"
                  fontFamily="Fredoka, sans-serif"
                  fontSize="12"
                  fontWeight="700"
                  fill="#5C6478"
                >
                  {level}
                </text>
              )}
            </g>
          );
        })}

        {/* Gloss reflection */}
        <rect x="116" y="44" width="6" height="146" rx="3" fill="#FFFFFF" opacity="0.55" />

        {cups === 0 && (
          <text
            x="88"
            y="132"
            textAnchor="middle"
            fontFamily="Fredoka, sans-serif"
            fontSize="14"
            fontWeight="600"
            fill="#7B8A9A"
          >
            Empty
          </text>
        )}

        {showNumeralsOnConcrete && (
          <line
            x1="40"
            y1={liquidTopY}
            x2="138"
            y2={liquidTopY}
            stroke="#3BA99C"
            strokeWidth="2.6"
            strokeDasharray="5 4"
          />
        )}
      </svg>
    );
  };

  const renderPureNumberSide = (side: 'left' | 'right', value: number) => {
    const row1 = Math.min(5, value);
    const row2 = Math.max(0, value - 5);
    const isBigger =
      (side === 'left' && currentPrompt.leftValue > currentPrompt.rightValue) ||
      (side === 'right' && currentPrompt.rightValue > currentPrompt.leftValue);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          type="button"
          className="cq-big-numeral-btn"
          onClick={() => playCompareNumberTapVoice(value, soundEnabled)}
          data-testid={`compare-numeral-${side}`}
          aria-label={`Number ${value}`}
        >
          {value}
        </button>

        {showTeachScaffolding && (
          <div className="cq-teach-dot-frame" data-testid={`compare-teach-dots-${side}`}>
            {value === 0 ? (
              <span className="cq-teach-zero-label">0 (zero dots)</span>
            ) : (
              <>
                <div className="cq-teach-dot-row">
                  {Array.from({ length: row1 }, (_, idx) => (
                    <span
                      key={idx}
                      className={`cq-teach-dot ${isBigger ? 'cq-teach-dot--mint' : ''}`}
                    />
                  ))}
                </div>
                {row2 > 0 && (
                  <div className="cq-teach-dot-row">
                    {Array.from({ length: row2 }, (_, idx) => (
                      <span
                        key={idx + 5}
                        className={`cq-teach-dot ${isBigger ? 'cq-teach-dot--mint' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHorizontalSticksTrack = () => {
    const leftVal = currentPrompt.leftValue;
    const rightVal = currentPrompt.rightValue;
    const baselineX = 76;
    const maxEndX = 636;
    const unitPx = (maxEndX - baselineX) / 10; // 56px per unit
    const topEnd = baselineX + leftVal * unitPx;
    const botEnd = baselineX + rightVal * unitPx;

    return (
      <div className="cq-sticks-track-card" data-testid="compare-sticks-track">
        <div className="cq-sticks-track-header">
          <span>Shared Start Line (0)</span>
          <span>1–10 Unit Ruler</span>
        </div>

        <svg viewBox="0 0 680 164" className="cq-sticks-svg" aria-label="Horizontal length rods">
          {/* Ruler ticks 0..10 */}
          {Array.from({ length: 11 }, (_, tick) => {
            const x = baselineX + tick * unitPx;
            const isMajor = tick === 0 || tick === 5 || tick === 10;
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1="16"
                  x2={x}
                  y2="136"
                  stroke={tick === 0 ? '#5C6478' : isMajor ? '#D4CEC0' : '#EBE7DD'}
                  strokeWidth={tick === 0 ? '3' : isMajor ? '1.8' : '1.2'}
                  strokeDasharray={tick === 0 || isMajor ? undefined : '4 4'}
                />
                {(isMajor || showNumeralsOnConcrete) && (
                  <text
                    x={x}
                    y="154"
                    textAnchor="middle"
                    fontFamily="Fredoka, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                    fill={
                      showNumeralsOnConcrete && (tick === leftVal || tick === rightVal)
                        ? '#3BA99C'
                        : '#7B8398'
                    }
                  >
                    {tick}
                  </text>
                )}
              </g>
            );
          })}

          {/* Top Rod (Left side value) */}
          <text
            x="12"
            y="55"
            fontFamily="Fredoka, sans-serif"
            fontSize="14"
            fontWeight="700"
            fill="#4949C0"
          >
            Rod A
          </text>
          <rect
            x={baselineX}
            y="34"
            width={Math.max(12, topEnd - baselineX)}
            height="30"
            rx="8"
            fill="#5B5BD6"
          />
          {Array.from({ length: Math.max(0, leftVal - 1) }, (_, idx) => (
            <line
              key={idx}
              x1={baselineX + (idx + 1) * unitPx}
              y1="36"
              x2={baselineX + (idx + 1) * unitPx}
              y2="62"
              stroke="#FFFFFF"
              strokeOpacity="0.36"
              strokeWidth="2"
            />
          ))}
          <polygon
            points={`${topEnd},35 ${topEnd + 14},49 ${topEnd},63`}
            fill="#F3D19C"
          />
          <polygon
            points={`${topEnd + 9},44 ${topEnd + 14},49 ${topEnd + 9},54`}
            fill="#4949C0"
          />

          {/* Bottom Rod (Right side value) */}
          <text
            x="12"
            y="111"
            fontFamily="Fredoka, sans-serif"
            fontSize="14"
            fontWeight="700"
            fill="#C25138"
          >
            Rod B
          </text>
          <rect
            x={baselineX}
            y="90"
            width={Math.max(12, botEnd - baselineX)}
            height="30"
            rx="8"
            fill="#F27A5E"
          />
          {Array.from({ length: Math.max(0, rightVal - 1) }, (_, idx) => (
            <line
              key={idx}
              x1={baselineX + (idx + 1) * unitPx}
              y1="92"
              x2={baselineX + (idx + 1) * unitPx}
              y2="118"
              stroke="#FFFFFF"
              strokeOpacity="0.36"
              strokeWidth="2"
            />
          ))}
          <polygon
            points={`${botEnd},91 ${botEnd + 14},105 ${botEnd},119`}
            fill="#F3D19C"
          />
          <polygon
            points={`${botEnd + 9},100 ${botEnd + 14},105 ${botEnd + 9},110`}
            fill="#C25138"
          />
        </svg>
      </div>
    );
  };

  const isHorizontalSticks =
    currentPrompt?.kind === 'length' && currentPrompt.lengthVariant === 'sticks';

  const leftHighlightClass = useMemo(() => {
    if (!showNumeralsOnConcrete || !currentPrompt) return '';
    if (currentPrompt.leftValue === currentPrompt.rightValue) return 'is-equal-highlight';
    return currentPrompt.leftValue > currentPrompt.rightValue ? 'is-bigger-highlight' : '';
  }, [currentPrompt, showNumeralsOnConcrete]);

  const rightHighlightClass = useMemo(() => {
    if (!showNumeralsOnConcrete || !currentPrompt) return '';
    if (currentPrompt.leftValue === currentPrompt.rightValue) return 'is-equal-highlight';
    return currentPrompt.rightValue > currentPrompt.leftValue ? 'is-bigger-highlight' : '';
  }, [currentPrompt, showNumeralsOnConcrete]);

  const getConcreteUnitLabel = (val: number): string => {
    if (!currentPrompt) return '';
    if (currentPrompt.kind === 'length') return val === 1 ? 'unit' : 'units';
    if (currentPrompt.kind === 'measure') return val === 1 ? 'cup' : 'cups';
    return '';
  };

  return (
    <div className="cq-screen" data-testid="compare-quest-board">
      <ConfettiBurst
        active={confettiKey > 0}
        mode={phase === 'won' ? 'win' : 'match'}
        burstKey={confettiKey}
      />

      <header className="cq-top-bar">
        <div className="cq-top-bar__side">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="compare-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="compare-setup-btn"
            >
              Setup
            </button>
          )}
        </div>

        <BrandLogo size="sm" />

        <div className="cq-top-bar__side">
          {journeyContext && (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          )}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <SpeakerIcon muted={!soundEnabled} />
            <span>{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>
          <GameHelpButton onClick={onRequestHelp} />
        </div>
      </header>

      <section
        className={`cq-hud-card ${
          phase === 'celebrating' ? 'is-celebrating' : phase === 'teach-mistake' ? 'is-teach' : ''
        }`}
        aria-live="polite"
      >
        <div className="cq-hud-card__left">
          <img
            src={getAvatarSrc(childProfile.avatar)}
            alt=""
            className="cq-hud-card__avatar"
          />
          <div className="cq-hud-card__text">
            <span className="cq-hud-card__eyebrow">
              {modeSpec.shortTitle} • Prompt {promptIndex + 1} of {prompts.length} ({kindTagLabel})
            </span>
            <span className="cq-hud-card__headline" data-testid="compare-hud-headline">
              {hudHeadline}
            </span>
          </div>
        </div>

        <div className="cq-hud-card__right">
          <button
            type="button"
            className="cq-speak-btn"
            onClick={() => {
              if (currentPrompt) {
                voiceCleanupRef.current = playComparePromptCueVoice(currentPrompt, true);
              }
            }}
            aria-label="Hear prompt instructions"
            data-testid="compare-listen-btn"
          >
            <SpeakerIcon />
          </button>

          <div
            className={`cq-crown-badge ${roundMistakes > 0 ? 'is-dimmed' : ''}`}
            data-testid="compare-crown-badge"
            title={
              roundMistakes === 0
                ? 'Zero-mistake Perfect Crown active'
                : 'Keep going carefully to finish strong!'
            }
          >
            <CrownIcon size={17} />
            <span>{roundMistakes === 0 ? 'Perfect' : 'Keep Going'}</span>
          </div>
        </div>
      </section>

      <div className="cq-meta-strip">
        <div className="cq-legend-bar" role="group" aria-label="Comparison symbol legend">
          {(
            [
              { sym: '<' as const, text: 'Less than' },
              { sym: '>' as const, text: 'Greater than' },
              { sym: '=' as const, text: 'Equal to' },
            ] as const
          ).map((entry) => {
            const isHighlighted =
              (phase === 'celebrating' || phase === 'teach-mistake') &&
              currentPrompt?.answer === entry.sym;
            return (
              <button
                key={entry.sym}
                type="button"
                className={`cq-legend-chip ${isHighlighted ? 'is-highlighted' : ''}`}
                onClick={() => playCompareRelationPreviewVoice(entry.sym, soundEnabled)}
                data-testid={`compare-legend-${entry.sym === '>' ? 'gt' : entry.sym === '<' ? 'lt' : 'eq'}`}
              >
                <span>{entry.text}</span>
                <strong>{entry.sym}</strong>
              </button>
            );
          })}
        </div>

        <div className="cq-pebble-progress" aria-label="Round progress">
          {prompts.map((p, idx) => {
            const isDone = idx < promptIndex || phase === 'won';
            const isCurrent = idx === promptIndex && phase !== 'won';
            return (
              <span
                key={p.uid}
                className={`cq-pebble-dot ${
                  isDone ? 'is-done' : isCurrent ? 'is-current' : ''
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="cq-stage" ref={stageRef}>
        {currentPrompt && (
          <div
            className="cq-arena"
            data-prompt-kind={currentPrompt.kind}
            data-left-value={currentPrompt.leftValue}
            data-right-value={currentPrompt.rightValue}
            data-answer={currentPrompt.answer}
          >
            {isHorizontalSticks && renderHorizontalSticksTrack()}

            <div
              className={`cq-compare-row ${isHorizontalSticks ? 'cq-compare-row--compact' : ''}`}
            >
              {/* LEFT SIDE */}
              <div
                className={`cq-side-card ${leftHighlightClass}`}
                data-testid="compare-left-card"
              >
                <span
                  className={`cq-side-card__tag ${
                    isHorizontalSticks ? 'cq-side-card__tag--indigo' : ''
                  }`}
                >
                  {isHorizontalSticks ? 'Rod A (Top)' : 'Left Side'}
                </span>

                {!isHorizontalSticks && (
                  <div className="cq-side-card__body">
                    {currentPrompt.kind === 'quantity' &&
                      renderQuantitySide('left', currentPrompt.leftValue)}
                    {currentPrompt.kind === 'length' &&
                      renderTowerSide('left', currentPrompt.leftValue)}
                    {currentPrompt.kind === 'measure' &&
                      renderJugSide('left', currentPrompt.leftValue)}
                    {currentPrompt.kind === 'numbers' &&
                      renderPureNumberSide('left', currentPrompt.leftValue)}
                  </div>
                )}

                {currentPrompt.kind !== 'numbers' && (
                  <div
                    className={`cq-numeral-pill ${
                      showNumeralsOnConcrete ? 'is-revealed' : ''
                    } ${phase === 'celebrating' ? 'is-celebrating' : ''}`}
                    data-testid="compare-left-numeral-pill"
                  >
                    {showNumeralsOnConcrete ? (
                      <>
                        <span>{currentPrompt.leftValue}</span>
                        {getConcreteUnitLabel(currentPrompt.leftValue) && (
                          <span className="cq-numeral-pill__unit">
                            {getConcreteUnitLabel(currentPrompt.leftValue)}
                          </span>
                        )}
                      </>
                    ) : currentPrompt.kind === 'quantity' && countedLeft.length > 0 ? (
                      <span>{countedLeft.length}</span>
                    ) : (
                      <span>?</span>
                    )}
                  </div>
                )}
              </div>

              {/* CENTER [ ? ] COMPARISON BOX (Tap, Drop, OR Finger-Write!) */}
              <div className="cq-center-column">
                <div
                  ref={centerBoxRef}
                  className={`cq-center-box ${isDropHover ? 'is-drop-hover' : ''} ${
                    isDrawing ? 'is-drawing' : ''
                  } ${phase === 'celebrating' ? 'is-locked-correct' : ''} ${
                    phase === 'teach-mistake' && wrongSymbol ? 'is-wrong-nudge' : ''
                  } ${phase === 'teach-mistake' ? 'is-teach-answer' : ''}`}
                  data-testid="compare-center-box"
                  role="region"
                  aria-label="Center comparison symbol box. Write >, <, or = inside, or tap or drag a symbol tile."
                  {...drawHandlers}
                >
                  {phase === 'celebrating' && lockedSymbol ? (
                    <span className="cq-locked-symbol" data-testid="compare-locked-symbol">
                      {lockedSymbol}
                    </span>
                  ) : phase === 'teach-mistake' ? (
                    <span
                      className="cq-locked-symbol cq-locked-symbol--teach"
                      data-testid="compare-teach-symbol"
                    >
                      {currentPrompt.answer}
                    </span>
                  ) : (
                    <>
                      {completedStrokes.length === 0 && activeStroke.length === 0 && (
                        <div className="cq-center-placeholder">
                          <span className="cq-center-placeholder__q">?</span>
                          <span className="cq-center-placeholder__sub">Write or Drop</span>
                        </div>
                      )}
                      <svg
                        viewBox={`0 0 ${CENTER_LOGICAL_SIZE} ${CENTER_LOGICAL_SIZE}`}
                        className="cq-center-draw-svg"
                      >
                        {completedStrokes.map((stroke, idx) => (
                          <path
                            key={idx}
                            d={strokePointsToPathD(stroke)}
                            fill="none"
                            stroke="#5B5BD6"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                        {activeStroke.length > 0 && (
                          <path
                            d={strokePointsToPathD(activeStroke)}
                            fill="none"
                            stroke="#5B5BD6"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                    </>
                  )}
                </div>

                <span className="cq-center-caption" data-testid="compare-center-caption">
                  {phase === 'celebrating'
                    ? `${currentPrompt.leftValue} ${currentPrompt.answer} ${currentPrompt.rightValue}`
                    : phase === 'teach-mistake'
                      ? `${currentPrompt.leftValue} ${currentPrompt.answer} ${currentPrompt.rightValue}`
                      : drawHintNote || 'Tap, drag, or draw!'}
                </span>
              </div>

              {/* RIGHT SIDE */}
              <div
                className={`cq-side-card ${rightHighlightClass}`}
                data-testid="compare-right-card"
              >
                <span
                  className={`cq-side-card__tag ${
                    isHorizontalSticks ? 'cq-side-card__tag--coral' : ''
                  }`}
                >
                  {isHorizontalSticks ? 'Rod B (Bottom)' : 'Right Side'}
                </span>

                {!isHorizontalSticks && (
                  <div className="cq-side-card__body">
                    {currentPrompt.kind === 'quantity' &&
                      renderQuantitySide('right', currentPrompt.rightValue)}
                    {currentPrompt.kind === 'length' &&
                      renderTowerSide('right', currentPrompt.rightValue)}
                    {currentPrompt.kind === 'measure' &&
                      renderJugSide('right', currentPrompt.rightValue)}
                    {currentPrompt.kind === 'numbers' &&
                      renderPureNumberSide('right', currentPrompt.rightValue)}
                  </div>
                )}

                {currentPrompt.kind !== 'numbers' && (
                  <div
                    className={`cq-numeral-pill ${
                      showNumeralsOnConcrete ? 'is-revealed' : ''
                    } ${phase === 'celebrating' ? 'is-celebrating' : ''}`}
                    data-testid="compare-right-numeral-pill"
                  >
                    {showNumeralsOnConcrete ? (
                      <>
                        <span>{currentPrompt.rightValue}</span>
                        {getConcreteUnitLabel(currentPrompt.rightValue) && (
                          <span className="cq-numeral-pill__unit">
                            {getConcreteUnitLabel(currentPrompt.rightValue)}
                          </span>
                        )}
                      </>
                    ) : currentPrompt.kind === 'quantity' && countedRight.length > 0 ? (
                      <span>{countedRight.length}</span>
                    ) : (
                      <span>?</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tactile Symbol Tiles (>, =, <) */}
      <footer className="cq-tray" aria-label="Comparison symbol choices">
        <div className="cq-tray__row">
          {SYMBOL_CHOICES.map(({ symbol, label }) => {
            const testSlug = symbol === '>' ? 'gt' : symbol === '<' ? 'lt' : 'eq';
            const isDraggingThis = dragState?.moved && dragState.symbol === symbol;
            const isWrongThis = phase === 'teach-mistake' && wrongSymbol === symbol;
            const isCorrectThis =
              (phase === 'celebrating' || phase === 'teach-mistake') &&
              currentPrompt?.answer === symbol;

            return (
              <button
                key={symbol}
                type="button"
                disabled={phase !== 'playing'}
                className={`cq-symbol-tile ${isDraggingThis ? 'is-dragging-source' : ''} ${
                  isWrongThis ? 'is-wrong-nudge' : ''
                } ${isCorrectThis ? 'is-correct-choice' : ''}`}
                data-testid={`compare-tile-${testSlug}`}
                aria-label={`${label} (${symbol})`}
                onPointerDown={(e) => handleTilePointerDown(symbol, e)}
                onPointerMove={handleTilePointerMove}
                onPointerUp={handleTilePointerUp}
                onPointerCancel={handleTilePointerCancel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    submitSymbolChoice(symbol);
                  }
                }}
              >
                <span className="cq-symbol-tile__glyph">
                  <SymbolCueGlyph symbol={symbol} />
                </span>
                <span className="cq-symbol-tile__label">{label}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {dragState?.moved && (
        <div
          className="cq-drag-ghost"
          style={{ left: dragState.clientX, top: dragState.clientY }}
          aria-hidden="true"
        >
          {dragState.symbol}
        </div>
      )}

      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Let's take a calm look!"
        hint={
          currentPrompt
            ? currentPrompt.leftValue === currentPrompt.rightValue
              ? `Both sides show ${currentPrompt.leftValue} — they match, so we use the equal sign (=)!`
              : `Remember: the wide open mouth of ${currentPrompt.answer} opens toward the bigger side (${Math.max(
                  currentPrompt.leftValue,
                  currentPrompt.rightValue,
                )})!`
            : 'Take a breath and check which side has more!'
        }
        readyLabel="Keep Trying"
        startAgainLabel="Start Again"
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleResumeAfterThinkAgain}
        onStartAgain={handleStartAgainFreshRound}
      />

      {phase === 'won' && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cq-win-title"
        >
          <div className="winner-modal" data-testid="compare-winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={36} />
              <div className="winner-avatar-halo">
                <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
              </div>
            </div>

            <h2 id="cq-win-title">
              {roundMistakes === 0
                ? `Perfect Crown, ${childProfile.name}!`
                : `Great Comparing, ${childProfile.name}!`}
            </h2>

            <p className="winner-subtitle">
              {roundMistakes === 0
                ? `You solved all ${prompts.length} comparisons with zero mistakes!`
                : `You completed all ${prompts.length} comparisons in ${modeSpec.title}!`}
            </p>

            <div className="cq-win-summary-pills">
              <span className="cq-win-pill cq-win-pill--mint">
                {flawlessSolved} / {prompts.length} First-Try Spot On
              </span>
              <span className="cq-win-pill">&gt; &bull; = &bull; &lt; Practiced</span>
            </div>

            <div className="winner-actions">
              {journeyContext ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => journeyContext.onActivityComplete()}
                  data-testid="compare-journey-continue-btn"
                >
                  Continue Adventure →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleStartAgainFreshRound}
                    data-testid="compare-play-again-btn"
                  >
                    Play Again
                  </button>
                  <div className="winner-actions__row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onChangeSetup}
                    >
                      Change Setup
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={onBackToHub}
                      data-testid="compare-win-hub-btn"
                    >
                      Games
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

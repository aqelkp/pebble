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
import { normalizeSpokenName } from '../../utils/childNameTts';
import type { TracePoint } from '../letter-trace/traceData';
import { WordTraceCardArt } from './WordTraceCardArt';
import {
  WORD_SLATE_HEIGHT,
  WORD_SLATE_WIDTH,
  WORD_TRACE_ACTIVE_KEY,
  WT_FENCE_Y,
  WT_GRASS_Y,
  WT_ROOT_Y,
  WT_SKY_Y,
  buildWordTraceDeck,
  buildWordTraceSlateSpec,
  getWordTraceItem,
  isValidWordTraceItemId,
  loadWordTraceMastery,
  minDistanceToWordStroke,
  pointAlongWordStroke,
  projectForwardOntoWordStroke,
  saveWordTraceItemMastery,
  type ResolvedGlyphCase,
  type ResolvedWordStroke,
  type WordTraceConfig,
  type WordTraceDeckEntry,
} from './wordTraceEngine';
import {
  playLetterFinishedChord,
  playPersonalizedWordPrompt,
  playWordCompleteWave,
  playWordStrokeTick,
  playWordSubStrokeNote,
  playWordTraceLockedTap,
  playWordTraceRoundFanfare,
  playWordTraceSpokenWord,
  playWordTraceTeachHint,
  preloadWordTraceClips,
  stopWordTraceVoice,
} from './wordTraceSounds';
import './WordTrace.css';

const START_RADIUS = 46;
const DOT_TAP_RADIUS = 46;
const CORRIDOR_TOLERANCE = 52;
const AUTO_COMPLETE_PROGRESS = 0.86;
const WRONG_DRAG_THRESHOLD = 22;
const RETRACT_TAP_MAX_TRAVEL = 18;
const STEP_MILESTONES = [0.34, 0.68, 1.0] as const;

interface WordTraceBoardProps {
  gameKey: number;
  config: WordTraceConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'tracing' | 'teaching-mistake' | 'word-complete' | 'won';
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

interface StoredWordTraceSession {
  gameKey: number;
  deck: WordTraceDeckEntry[];
  deckIndex: number;
  crownedThisRound: string[];
  wrongDragsCount: number;
}

interface PebblePopEffect {
  charIdx: number;
  x: number;
  y: number;
  key: number;
}

function clampSafeInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function isValidResolvedCase(val: unknown): val is ResolvedGlyphCase {
  return val === 'lower' || val === 'upper';
}

function loadActiveWordTraceSession(gameKey: number): StoredWordTraceSession | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(WORD_TRACE_ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWordTraceSession>;
    if (parsed.gameKey !== gameKey) return null;
    if (!Array.isArray(parsed.deck) || parsed.deck.length === 0 || parsed.deck.length > 12) {
      return null;
    }
    const cleanDeck: WordTraceDeckEntry[] = [];
    for (const entry of parsed.deck) {
      if (
        typeof entry === 'object' &&
        entry !== null &&
        isValidWordTraceItemId((entry as WordTraceDeckEntry).itemId) &&
        isValidResolvedCase((entry as WordTraceDeckEntry).resolvedCase)
      ) {
        cleanDeck.push({
          itemId: (entry as WordTraceDeckEntry).itemId,
          resolvedCase: (entry as WordTraceDeckEntry).resolvedCase,
        });
      } else {
        return null;
      }
    }
    const deckIndex = clampSafeInt(parsed.deckIndex, 0, cleanDeck.length - 1, 0);
    const crownedThisRound = Array.isArray(parsed.crownedThisRound)
      ? parsed.crownedThisRound.filter((id): id is string => isValidWordTraceItemId(id))
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

function saveActiveWordTraceSession(state: StoredWordTraceSession | null): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (!state) {
      window.sessionStorage.removeItem(WORD_TRACE_ACTIVE_KEY);
      return;
    }
    window.sessionStorage.setItem(WORD_TRACE_ACTIVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota / sandbox errors
  }
}

function buildPartialWordPolylinePoints(
  strokeSpec: ResolvedWordStroke,
  progress: number,
): string {
  const samples = strokeSpec.samples;
  if (samples.length <= 1 || progress <= 0.005) return '';
  const exactIdx = progress * (samples.length - 1);
  const fullCount = Math.floor(exactIdx) + 1;
  const pts: string[] = [];
  for (let i = 0; i < Math.min(samples.length, fullCount); i += 1) {
    pts.push(`${samples[i].x.toFixed(1)},${samples[i].y.toFixed(1)}`);
  }
  const nextIdx = Math.min(samples.length - 1, fullCount);
  const frac = exactIdx - Math.floor(exactIdx);
  if (frac > 0.01 && fullCount < samples.length) {
    const a = samples[fullCount - 1];
    const b = samples[nextIdx];
    const ix = a.x + (b.x - a.x) * frac;
    const iy = a.y + (b.y - a.y) * frac;
    pts.push(`${ix.toFixed(1)},${iy.toFixed(1)}`);
  }
  return pts.join(' ');
}

function SpeakerIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H3V15H6L11 19V5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M22 9L16 15M16 9L22 15"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5 8.5C16.5 9.5 17 10.7 17 12C17 13.3 16.5 14.5 15.5 15.5M18.8 5.8C20.5 7.4 21.5 9.6 21.5 12C21.5 14.4 20.5 16.6 18.8 18.2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function WordTraceBoard({
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
}: WordTraceBoardProps) {
  const initialSaved = useMemo(() => loadActiveWordTraceSession(gameKey), [gameKey]);

  const [deck, setDeck] = useState<WordTraceDeckEntry[]>(() => {
    if (initialSaved) return initialSaved.deck;
    const mastery = loadWordTraceMastery();
    return buildWordTraceDeck(config, mastery);
  });
  const [deckIndex, setDeckIndex] = useState<number>(() => initialSaved?.deckIndex ?? 0);
  const [crownedThisRound, setCrownedThisRound] = useState<string[]>(
    () => initialSaved?.crownedThisRound ?? [],
  );
  const [wrongDragsCount, setWrongDragsCount] = useState<number>(
    () => initialSaved?.wrongDragsCount ?? 0,
  );

  const [activeStrokeIdx, setActiveStrokeIdx] = useState(0);
  const [liveProgress, setLiveProgress] = useState(0);
  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [wordMistakeCount, setWordMistakeCount] = useState(0);
  const [wordHadMistake, setWordHadMistake] = useState(false);
  const [stepDotsEnabled, setStepDotsEnabled] = useState(false);
  const [milestoneIdx, setMilestoneIdx] = useState(0);

  const [phase, setPhase] = useState<BoardPhase>('tracing');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [banner, setBanner] = useState<{ tone: BannerTone; text: string }>({
    tone: 'neutral',
    text: 'Write left to right! Start at Circle 1 and follow the arrow.',
  });

  const [blockedCue, setBlockedCue] = useState<{ x: number; y: number; key: number } | null>(
    null,
  );
  const [guideProgress, setGuideProgress] = useState<number | null>(null);
  const [pebblePop, setPebblePop] = useState<PebblePopEffect | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<ActiveDragState | null>(null);
  const retractRafRef = useRef<number | null>(null);
  const guideRafRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const wordAudioTimerRef = useRef<number | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const popTimerRef = useRef<number | null>(null);
  const promptVoiceCancelRef = useRef<(() => void) | null>(null);
  const teachVoiceCancelRef = useRef<(() => void) | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef(false);

  const currentEntry: WordTraceDeckEntry = deck[deckIndex] ?? {
    itemId: 'cat',
    resolvedCase: 'lower',
  };
  const currentItem = useMemo(
    () => getWordTraceItem(currentEntry.itemId),
    [currentEntry.itemId],
  );
  const slateSpec = useMemo(
    () => buildWordTraceSlateSpec(currentItem.text, currentEntry.resolvedCase),
    [currentEntry.resolvedCase, currentItem.text],
  );

  const activeStroke: ResolvedWordStroke | null =
    phase === 'word-complete' || phase === 'won'
      ? null
      : slateSpec.strokes[activeStrokeIdx] ?? null;

  const activeCharIdx = activeStroke
    ? activeStroke.charIdx
    : slateSpec.characters.length;

  const customChildName = useMemo(
    () => normalizeSpokenName(childProfile.name),
    [childProfile.name],
  );

  // Preload audio clips for the entire round deck
  useEffect(() => {
    const items = deck.map((d) => getWordTraceItem(d.itemId));
    preloadWordTraceClips(items);
  }, [deck]);

  // Speak personalized prompt ("<Name>, can you write cat?" or "Can you write cat?") on each new card
  useEffect(() => {
    if (phase === 'won') return;
    promptVoiceCancelRef.current?.();
    const timer = window.setTimeout(() => {
      promptVoiceCancelRef.current = playPersonalizedWordPrompt(
        currentItem,
        childProfile.name,
        soundEnabled,
      );
    }, 120);
    return () => {
      window.clearTimeout(timer);
    };
  }, [childProfile.name, currentItem, deckIndex, gameKey, soundEnabled]); // intentionally keyed on item/card arrival

  // Persist active round state in sessionStorage
  useEffect(() => {
    if (phase === 'won') {
      saveActiveWordTraceSession(null);
      return;
    }
    saveActiveWordTraceSession({
      gameKey,
      deck,
      deckIndex,
      crownedThisRound,
      wrongDragsCount,
    });
  }, [crownedThisRound, deck, deckIndex, gameKey, phase, wrongDragsCount]);

  // Report active gameplay for PWA Back Guard
  useEffect(() => {
    const isActive =
      phase !== 'won' && (deckIndex > 0 || activeStrokeIdx > 0 || liveProgress > 0.05);
    onGameActiveChange?.(isActive);
  }, [activeStrokeIdx, deckIndex, liveProgress, onGameActiveChange, phase]);

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

  // Cleanup all timers, RAFs, and voice playback on unmount
  useEffect(() => {
    return () => {
      cancelRetractAnim();
      cancelGuideAnim();
      if (nextTimerRef.current !== null) window.clearTimeout(nextTimerRef.current);
      if (wordAudioTimerRef.current !== null) window.clearTimeout(wordAudioTimerRef.current);
      if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
      promptVoiceCancelRef.current?.();
      teachVoiceCancelRef.current?.();
      stopWordTraceVoice();
      onGameActiveChange?.(false);
    };
  }, [cancelGuideAnim, cancelRetractAnim, onGameActiveChange]);

  const runGuidePebbleDemo = useCallback(
    (passDurationMs: number, passes: number) => {
      cancelGuideAnim();
      const totalDuration = passDurationMs * passes;
      const startTime = performance.now();
      const tick = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed >= totalDuration) {
          guideRafRef.current = null;
          setGuideProgress(null);
          return;
        }
        const passElapsed = elapsed % passDurationMs;
        const rawT = Math.min(1, passElapsed / (passDurationMs * 0.85));
        const eased = 1 - (1 - rawT) * (1 - rawT);
        setGuideProgress(eased);
        guideRafRef.current = window.requestAnimationFrame(tick);
      };
      setGuideProgress(0);
      guideRafRef.current = window.requestAnimationFrame(tick);
    },
    [cancelGuideAnim],
  );

  const retractPartialInk = useCallback(
    (fromVal: number) => {
      cancelRetractAnim();
      if (fromVal <= 0.02) {
        setLiveProgress(0);
        return;
      }
      const startTime = performance.now();
      const durationMs = 210;
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        const nextVal = fromVal * (1 - t);
        if (t >= 1 || nextVal <= 0.01) {
          setLiveProgress(0);
          retractRafRef.current = null;
          return;
        }
        setLiveProgress(nextVal);
        retractRafRef.current = window.requestAnimationFrame(step);
      };
      retractRafRef.current = window.requestAnimationFrame(step);
    },
    [cancelRetractAnim],
  );

  const finishRound = useCallback(
    (finalCrownedCount: number, finalWrongCount: number) => {
      setPhase('won');
      saveActiveWordTraceSession(null);
      playWordTraceRoundFanfare(soundEnabled);
      setConfettiMode('win');
      setConfettiKey((k) => k + 1);

      if (!roundLoggedRef.current) {
        roundLoggedRef.current = true;
        const total = Math.max(1, deck.length + finalWrongCount);
        const concepts = Array.from(
          new Set(deck.map((entry) => getWordTraceItem(entry.itemId).conceptId)),
        );
        recordLearningSession({
          playerId: childProfile.id,
          gameId: 'word-trace',
          mode: `${config.packId}-${config.caseMode}-${deck.length}`,
          totalAttempts: total,
          correctAttempts: deck.length,
          mistakes: finalWrongCount,
          flawless: finalWrongCount === 0 && finalCrownedCount === deck.length,
          durationMs: Math.max(1000, Date.now() - startedAtRef.current),
          conceptsTested: concepts,
        });
      }

      if (journeyContext) {
        journeyContext.onActivityComplete();
      }
    },
    [childProfile.id, config.caseMode, config.packId, deck, journeyContext, soundEnabled],
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

    const isFinalStrokeOfWord = activeStrokeIdx + 1 >= slateSpec.strokes.length;

    if (!isFinalStrokeOfWord) {
      const nextIdx = activeStrokeIdx + 1;
      const nextStroke = slateSpec.strokes[nextIdx];
      const finishedCharacter =
        nextStroke && nextStroke.charIdx > activeStroke.charIdx
          ? slateSpec.characters[activeStroke.charIdx]
          : null;

      if (finishedCharacter) {
        playLetterFinishedChord(activeStroke.charIdx, soundEnabled);
        if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current);
        setPebblePop({
          charIdx: finishedCharacter.charIdx,
          x: finishedCharacter.centerX,
          y: (WT_FENCE_Y + WT_GRASS_Y) / 2,
          key: Date.now(),
        });
        popTimerRef.current = window.setTimeout(() => {
          setPebblePop(null);
        }, 620);
      } else {
        playWordSubStrokeNote(activeStroke.orderInChar - 1, soundEnabled);
      }

      setActiveStrokeIdx(nextIdx);
      const nextChar = nextStroke ? slateSpec.characters[nextStroke.charIdx] : null;
      setBanner({
        tone: 'neutral',
        text:
          nextStroke?.kind === 'dot'
            ? `Nice! Tap Circle ${nextStroke.orderInChar} to dot "${nextChar?.displayChar ?? ''}".`
            : finishedCharacter && nextChar
              ? `"${finishedCharacter.displayChar}" done! Next, start "${nextChar.displayChar}" at Circle 1.`
              : `Great! Trace Stroke ${nextStroke.orderInChar}: ${nextStroke.hint}.`,
      });
      return;
    }

    // Completed the final stroke of the entire word / numeral!
    const earnedCrown = !wordHadMistake;
    saveWordTraceItemMastery(currentItem.id, earnedCrown);

    const nextCrownedList =
      earnedCrown && !crownedThisRound.includes(currentItem.id)
        ? [...crownedThisRound, currentItem.id]
        : crownedThisRound;
    if (earnedCrown) {
      setCrownedThisRound(nextCrownedList);
    }

    // Record telemetry for curriculum & parent mastery
    if (currentItem.subKind === 'numeral') {
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'word-trace',
        conceptId: currentItem.conceptId,
        conceptLabel: currentItem.conceptLabel,
        skillType: 'letter_formation',
        correct: earnedCrown,
        attemptsTaken: 1 + wordMistakeCount,
      });
    } else {
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'word-trace',
        conceptId: currentItem.conceptId,
        conceptLabel: currentItem.conceptLabel,
        skillType: 'word_spelling',
        correct: earnedCrown,
        attemptsTaken: 1 + wordMistakeCount,
      });
      const seenLetterIds = new Set<string>();
      for (const ch of slateSpec.characters) {
        if (ch.letterId && !seenLetterIds.has(ch.letterId)) {
          seenLetterIds.add(ch.letterId);
          recordSkillAttempt({
            playerId: childProfile.id,
            gameId: 'word-trace',
            conceptId: `letter:${ch.letterId}`,
            conceptLabel: `Letter ${ch.letterId}${ch.letterId.toLowerCase()}`,
            skillType: 'letter_formation',
            correct: earnedCrown,
            attemptsTaken: 1 + wordMistakeCount,
          });
        }
      }
    }

    setActiveStrokeIdx(slateSpec.strokes.length);
    setPhase('word-complete');
    setConfettiMode(deckIndex + 1 >= deck.length ? 'win' : 'match');
    setConfettiKey((k) => k + 1);

    // Left-to-Right Sound & Glow Wave across all letters, followed by spoken word!
    playWordCompleteWave(slateSpec.characters.length, earnedCrown, soundEnabled);
    if (wordAudioTimerRef.current !== null) window.clearTimeout(wordAudioTimerRef.current);
    wordAudioTimerRef.current = window.setTimeout(
      () => {
        playWordTraceSpokenWord(currentItem, soundEnabled);
      },
      slateSpec.characters.length * 130 + 130,
    );

    setBanner({
      tone: earnedCrown ? 'gold' : 'success',
      text: earnedCrown
        ? `Golden Crown! You wrote "${slateSpec.displayText}" left to right — sticker collected!`
        : `"${slateSpec.displayText}" complete! Sticker stamped in your notebook!`,
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
        setWordMistakeCount(0);
        setWordHadMistake(false);
        setLiveProgress(0);
        setMilestoneIdx(0);
        setStepDotsEnabled(false);
        setPhase('tracing');
        setBanner({
          tone: 'neutral',
          text: 'Write left to right! Start at Circle 1 and follow the arrow.',
        });
      }
    }, 1750);
  }, [
    activeStroke,
    activeStrokeIdx,
    cancelGuideAnim,
    cancelRetractAnim,
    childProfile.id,
    crownedThisRound,
    currentItem,
    deck.length,
    deckIndex,
    finishRound,
    phase,
    slateSpec.characters,
    slateSpec.displayText,
    slateSpec.strokes,
    soundEnabled,
    wordHadMistake,
    wordMistakeCount,
    wrongDragsCount,
  ]);

  const handleBlockedStroke = useCallback(
    (pt: TracePoint, wasReverse: boolean) => {
      if (!activeStroke || phase !== 'tracing') return;
      playWordTraceLockedTap(soundEnabled);

      const nextWrongTotal = wrongDragsCount + 1;
      const nextStrokeMistakes = strokeMistakes + 1;
      setWrongDragsCount(nextWrongTotal);
      setStrokeMistakes(nextStrokeMistakes);
      setWordMistakeCount((c) => c + 1);
      setWordHadMistake(true);

      if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
      setBlockedCue({ x: pt.x, y: pt.y, key: Date.now() });
      cueTimerRef.current = window.setTimeout(() => {
        setBlockedCue(null);
      }, 820);

      const activeCharLabel =
        slateSpec.characters[activeStroke.charIdx]?.displayChar ?? '';

      if (nextStrokeMistakes === 1) {
        setBanner({
          tone: 'warn',
          text: wasReverse
            ? `Oops, backwards! Start at Circle ${activeStroke.orderInChar} on "${activeCharLabel}" and follow the arrow.`
            : `Write left to right! Start at Circle ${activeStroke.orderInChar} on "${activeCharLabel}" first.`,
        });
        runGuidePebbleDemo(1050, 1);
        return;
      }

      // 2nd+ blocked drag on the same stroke: Teach-First on visible slate (~2.5s), THEN ThinkAgainOverlay!
      setPhase('teaching-mistake');
      setBanner({
        tone: 'warn',
        text: `Watch the gold pebble! Start at Circle ${activeStroke.orderInChar} on "${activeCharLabel}" and follow the arrow.`,
      });
      runGuidePebbleDemo(1180, 2);

      teachVoiceCancelRef.current?.();
      teachVoiceCancelRef.current = playWordTraceTeachHint(soundEnabled, () => {
        setPauseOpen(true);
      });
    },
    [
      activeStroke,
      phase,
      runGuidePebbleDemo,
      slateSpec.characters,
      soundEnabled,
      strokeMistakes,
      wrongDragsCount,
    ],
  );

  const handleResumeAfterPause = useCallback(() => {
    teachVoiceCancelRef.current?.();
    cancelGuideAnim();
    setPauseOpen(false);
    setStrokeMistakes(1);
    setPhase('tracing');
    if (activeStroke) {
      const ch = slateSpec.characters[activeStroke.charIdx]?.displayChar ?? '';
      setBanner({
        tone: 'neutral',
        text: `Ready! Touch Circle ${activeStroke.orderInChar} on "${ch}" and follow the arrow.`,
      });
    }
  }, [activeStroke, cancelGuideAnim, slateSpec.characters]);

  const handleRestartCurrentWord = useCallback(() => {
    teachVoiceCancelRef.current?.();
    cancelGuideAnim();
    cancelRetractAnim();
    dragRef.current = null;
    setPauseOpen(false);
    setPhase('tracing');
    setActiveStrokeIdx(0);
    setStrokeMistakes(0);
    setLiveProgress(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);
    setBanner({
      tone: 'neutral',
      text: `Fresh slate! Start "${slateSpec.displayText}" on the left at Circle 1.`,
    });
  }, [cancelGuideAnim, cancelRetractAnim, slateSpec.displayText]);

  const handleToggleCurrentWordCase = useCallback(() => {
    if (currentItem.subKind === 'numeral' || phase === 'word-complete' || phase === 'won') {
      return;
    }
    const nextCase: ResolvedGlyphCase =
      currentEntry.resolvedCase === 'lower' ? 'upper' : 'lower';
    setDeck((prev) =>
      prev.map((entry, idx) =>
        idx === deckIndex ? { ...entry, resolvedCase: nextCase } : entry,
      ),
    );
    cancelGuideAnim();
    cancelRetractAnim();
    dragRef.current = null;
    setActiveStrokeIdx(0);
    setStrokeMistakes(0);
    setLiveProgress(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);
    const previewText =
      nextCase === 'upper' ? currentItem.text.toUpperCase() : currentItem.text.toLowerCase();
    setBanner({
      tone: 'neutral',
      text: `Switched to ${nextCase === 'upper' ? 'CAPITALS' : 'small letters'}: write "${previewText}" from Circle 1!`,
    });
  }, [
    cancelGuideAnim,
    cancelRetractAnim,
    currentEntry.resolvedCase,
    currentItem.subKind,
    currentItem.text,
    deckIndex,
    phase,
  ]);

  const handleResetWholeRound = useCallback(() => {
    const mastery = loadWordTraceMastery();
    const freshDeck = buildWordTraceDeck(config, mastery);
    roundLoggedRef.current = false;
    startedAtRef.current = Date.now();
    setDeck(freshDeck);
    setDeckIndex(0);
    setCrownedThisRound([]);
    setWrongDragsCount(0);
    setActiveStrokeIdx(0);
    setStrokeMistakes(0);
    setWordMistakeCount(0);
    setWordHadMistake(false);
    setLiveProgress(0);
    setMilestoneIdx(0);
    setStepDotsEnabled(false);
    setPauseOpen(false);
    setPhase('tracing');
    setBanner({
      tone: 'neutral',
      text: 'New notebook page! Write left to right starting at Circle 1.',
    });
  }, [config]);

  const resolveSvgPoint = useCallback(
    (e: ReactPointerEvent<HTMLElement>): TracePoint | null => {
      const svgEl = svgRef.current;
      if (!svgEl) return null;
      return clientToLogicalPoint(
        svgEl,
        e.clientX,
        e.clientY,
        WORD_SLATE_WIDTH,
        WORD_SLATE_HEIGHT,
        'contain',
      );
    },
    [],
  );

  const handleStrokeStart = useCallback(
    (pt: TracePoint) => {
      if (!activeStroke || phase !== 'tracing' || pauseOpen) return;
      cancelRetractAnim();

      if (activeStroke.kind === 'dot') {
        const distToDot = Math.hypot(pt.x - activeStroke.start.x, pt.y - activeStroke.start.y);
        if (distToDot <= DOT_TAP_RADIUS) {
          playWordStrokeTick(soundEnabled);
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

      if (stepDotsEnabled) {
        const targetFraction = STEP_MILESTONES[milestoneIdx];
        if (typeof targetFraction === 'number') {
          const targetPt = pointAlongWordStroke(activeStroke, targetFraction);
          if (Math.hypot(pt.x - targetPt.x, pt.y - targetPt.y) <= 38) {
            playWordStrokeTick(soundEnabled);
            if (milestoneIdx >= STEP_MILESTONES.length - 1) {
              completeActiveStroke();
            } else {
              const nextMilestone = milestoneIdx + 1;
              setMilestoneIdx(nextMilestone);
              setLiveProgress(targetFraction);
              setBanner({
                tone: 'neutral',
                text: `Nice! Now tap Step ${nextMilestone + 1} along Stroke ${activeStroke.orderInChar}!`,
              });
            }
            return;
          }
          const hitFutureStone = STEP_MILESTONES.slice(milestoneIdx + 1).some((f) => {
            const p = pointAlongWordStroke(activeStroke, f);
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
      const resumeAnchor =
        liveProgress > 0.05
          ? pointAlongWordStroke(activeStroke, liveProgress)
          : activeStroke.start;
      const distToAnchor = Math.hypot(pt.x - resumeAnchor.x, pt.y - resumeAnchor.y);

      if (distToStart <= START_RADIUS || distToAnchor <= START_RADIUS) {
        playWordStrokeTick(soundEnabled);
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

      const isClosedLoop =
        Math.hypot(
          activeStroke.start.x - activeStroke.end.x,
          activeStroke.start.y - activeStroke.end.y,
        ) < 34;
      const isNearEndBackwards = !isClosedLoop && distToEnd <= START_RADIUS + 6;

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
      handleBlockedStroke,
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

      const proj = projectForwardOntoWordStroke(activeStroke, pt, drag.maxProgress);

      if (proj.distance <= CORRIDOR_TOLERANCE) {
        if (proj.progress > drag.maxProgress) {
          drag.maxProgress = proj.progress;
          setLiveProgress(proj.progress);
          if (proj.progress >= AUTO_COMPLETE_PROGRESS) {
            completeActiveStroke();
          }
        }
      } else if (drag.maxProgress < 0.08 && drag.maxTravel >= WRONG_DRAG_THRESHOLD + 6) {
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
        if (!drag.triggeredBlock && pt) {
          const hitFutureStroke = slateSpec.strokes
            .slice(activeStrokeIdx + 1)
            .some(
              (s) =>
                Math.hypot(pt.x - s.start.x, pt.y - s.start.y) <= 34 ||
                minDistanceToWordStroke(s, pt) <= 26,
            );
          if (hitFutureStroke) {
            handleBlockedStroke(pt, drag.sawReverseAttempt);
          }
        }
        return;
      }

      if (drag.maxProgress >= AUTO_COMPLETE_PROGRESS) {
        completeActiveStroke();
        return;
      }

      if (drag.maxTravel <= RETRACT_TAP_MAX_TRAVEL && drag.maxProgress < 0.12) {
        setStepDotsEnabled((prev) => {
          const next = !prev;
          if (next) {
            setBanner({
              tone: 'neutral',
              text: `Step Dots on! Tap Dots 1 → 2 → 3 in order along Stroke ${activeStroke.orderInChar}.`,
            });
          }
          return next;
        });
        setMilestoneIdx(0);
        setLiveProgress(0);
        return;
      }

      const fallbackMilestoneProgress =
        stepDotsEnabled && milestoneIdx > 0 ? STEP_MILESTONES[milestoneIdx - 1] : 0;
      if (fallbackMilestoneProgress > 0) {
        setLiveProgress(fallbackMilestoneProgress);
      } else {
        retractPartialInk(drag.maxProgress);
      }
      setBanner({
        tone: 'neutral',
        text: `Keep going from Circle ${activeStroke.orderInChar} all the way to the arrow tip!`,
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
      slateSpec.strokes,
      stepDotsEnabled,
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

  const completedStrokes = slateSpec.strokes.slice(0, activeStrokeIdx);
  const futureStrokes = activeStroke ? slateSpec.strokes.slice(activeStrokeIdx + 1) : [];

  const livePolylinePoints = useMemo(() => {
    if (!activeStroke || liveProgress <= 0.01) return '';
    return buildPartialWordPolylinePoints(activeStroke, liveProgress);
  }, [activeStroke, liveProgress]);

  const guidePoint = useMemo(() => {
    if (guideProgress === null || !activeStroke) return null;
    return pointAlongWordStroke(activeStroke, guideProgress);
  }, [activeStroke, guideProgress]);

  const categoryBadgeText =
    currentItem.category === 'cvc'
      ? 'CVC Picture Word'
      : currentItem.category === 'sight'
        ? currentItem.art.kind === 'sight-badge' && currentItem.art.isHomework
          ? 'School Sight Word'
          : 'K1 Sight Word'
        : currentItem.subKind === 'numeral'
          ? 'Number Digit'
          : 'Number Word';

  return (
    <main className="app-shell app-shell--board wt-board-shell">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseOpen}
        title="Let's Write Left to Right!"
        hint="Start on the left letter at the glowing purple circle and trace along the arrow — future letters unlock in order!"
        readyLabel="Keep Trying"
        startAgainLabel="Restart Word"
        durationSeconds={2}
        soundEnabled={soundEnabled}
        onReady={handleResumeAfterPause}
        onStartAgain={handleRestartCurrentWord}
      />

      <header className="top-bar wt-top-bar">
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="wt-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
        </div>

        <div className="wt-notebook-progress">
          <div
            className="wt-stamp-strip"
            aria-label={`Word ${deckIndex + 1} of ${deck.length}`}
            data-testid="wt-stamp-strip"
          >
            {deck.map((entry, idx) => {
              const slotItem = getWordTraceItem(entry.itemId);
              const isStamped =
                idx < deckIndex || (idx === deckIndex && phase === 'word-complete');
              const isCurrent = idx === deckIndex && phase !== 'word-complete';
              const isCrowned = isStamped && crownedThisRound.includes(slotItem.id);
              const slotLabel =
                slotItem.subKind === 'numeral'
                  ? slotItem.text
                  : entry.resolvedCase === 'upper'
                    ? slotItem.text.toUpperCase()
                    : slotItem.text;
              return (
                <span
                  key={`${entry.itemId}-${idx}`}
                  data-testid={`wt-stamp-slot-${idx}`}
                  className={`wt-stamp-slot ${isStamped ? 'is-stamped' : ''} ${
                    isCrowned ? 'is-crowned' : ''
                  } ${isCurrent ? 'is-current' : ''}`}
                >
                  {isStamped && <WordTraceCardArt art={slotItem.art} size={18} />}
                  <span>{slotLabel}</span>
                  {isCrowned && <CrownIcon size={10} />}
                </span>
              );
            })}
          </div>

          <span
            className={`wt-crown-pill ${wordHadMistake ? 'is-muted' : 'is-clean'}`}
            data-testid="wt-crown-status"
          >
            <CrownIcon size={12} />
            <span>{wordHadMistake ? 'Finish Together' : 'Clean Crown Active'}</span>
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
              data-testid="wt-setup-btn"
            >
              Setup
            </button>
          )}
        </div>
      </header>

      <section className="wt-prompt-card" aria-label="Word prompt and illustration">
        <div
          className={`wt-prompt-art-wrap ${phase === 'word-complete' ? 'is-stamped' : ''}`}
          data-testid="wt-prompt-art"
        >
          <WordTraceCardArt art={currentItem.art} size={80} />
          {phase === 'word-complete' && <span className="wt-stamp-seal">STAMPED!</span>}
        </div>

        <div className="wt-prompt-center">
          <div className="wt-prompt-kicker-row">
            <span className={`wt-category-tag wt-category-tag--${currentItem.category}`}>
              {categoryBadgeText}
            </span>
          </div>

          <h1 className="wt-prompt-question" data-testid="wt-prompt-heading">
            {phase === 'word-complete' ? (
              <>
                Wonderful! You wrote <strong>{slateSpec.displayText}</strong>!
              </>
            ) : customChildName ? (
              <>
                {customChildName}, can you write <strong>{slateSpec.displayText}</strong>?
              </>
            ) : (
              <>
                Can you write <strong>{slateSpec.displayText}</strong>?
              </>
            )}
          </h1>

          {currentItem.art.kind === 'sight-badge' ? (
            <p className="wt-prompt-clue">
              {currentItem.art.beforeText}
              <mark>
                {currentEntry.resolvedCase === 'upper'
                  ? currentItem.art.highlightWord.toUpperCase()
                  : currentItem.art.highlightWord}
              </mark>
              {currentItem.art.afterText}
            </p>
          ) : (
            <p className="wt-prompt-clue">{currentItem.clue}</p>
          )}

          <div
            className="wt-char-wave-row"
            aria-label="Left-to-right letter progress"
            data-testid="wt-char-wave-row"
          >
            {slateSpec.characters.map((ch, idx) => {
              const isWave = phase === 'word-complete';
              const isWritten = !isWave && idx < activeCharIdx;
              const isActive = !isWave && idx === activeCharIdx;
              return (
                <span key={`wave-slot-${ch.charIdx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    data-testid={`wt-char-chip-${idx}`}
                    className={`wt-char-chip ${isWave ? 'is-wave' : ''} ${
                      isWritten ? 'is-written' : ''
                    } ${isActive ? 'is-active' : ''}`}
                    style={isWave ? { animationDelay: `${idx * 130}ms` } : undefined}
                  >
                    {ch.displayChar}
                  </span>
                  {idx < slateSpec.characters.length - 1 && (
                    <span className="wt-char-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="wt-prompt-controls">
          <button
            type="button"
            className="wt-hear-btn"
            data-testid="wt-hear-prompt-btn"
            onClick={() => {
              promptVoiceCancelRef.current?.();
              promptVoiceCancelRef.current = playPersonalizedWordPrompt(
                currentItem,
                childProfile.name,
                true,
              );
            }}
          >
            <SpeakerIcon />
            <span>Hear Prompt</span>
          </button>

          {currentItem.subKind !== 'numeral' && (
            <button
              type="button"
              className="wt-case-switch-btn"
              data-testid="wt-case-toggle-btn"
              disabled={phase === 'word-complete' || phase === 'won'}
              onClick={handleToggleCurrentWordCase}
            >
              {currentEntry.resolvedCase === 'lower' ? (
                <>
                  Try <span>ABC</span>
                </>
              ) : (
                <>
                  Try <span>abc</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>

      <div
        className="wt-slate-wrap"
        {...slatePointerHandlers}
        data-testid="wt-slate-wrap"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WORD_SLATE_WIDTH} ${WORD_SLATE_HEIGHT}`}
          className="wt-slate-svg"
          role="img"
          aria-label={`4-line school handwriting slate for ${slateSpec.displayText}`}
          data-testid="wt-slate-svg"
        >
          <rect
            x="0"
            y="0"
            width={WORD_SLATE_WIDTH}
            height={WORD_SLATE_HEIGHT}
            rx="22"
            fill="#FFFEFB"
          />

          {/* Soft notebook x-height band tint between Fence & Grass */}
          <rect
            x="22"
            y={WT_FENCE_Y}
            width={WORD_SLATE_WIDTH - 44}
            height={WT_GRASS_Y - WT_FENCE_Y}
            fill="rgba(108, 166, 224, 0.065)"
          />

          {/* Descender zone soft highlight when word contains g, j, p, q, y */}
          {slateSpec.hasDescender && (
            <rect
              x="22"
              y={WT_GRASS_Y}
              width={WORD_SLATE_WIDTH - 44}
              height={WT_ROOT_Y - WT_GRASS_Y}
              fill="rgba(232, 111, 88, 0.06)"
            />
          )}

          {/* Authentic K1 Notebook Left Margin Line */}
          <line
            x1="44"
            y1="20"
            x2="44"
            y2={WORD_SLATE_HEIGHT - 20}
            stroke="rgba(232, 111, 88, 0.25)"
            strokeWidth="2"
          />

          {/* 4-Line Red & Blue School Ruled Paper: Sky (Red), Fence (Blue), Grass (Blue), Root (Red) */}
          <line
            x1="22"
            y1={WT_SKY_Y}
            x2={WORD_SLATE_WIDTH - 22}
            y2={WT_SKY_Y}
            stroke="#E86F58"
            strokeWidth="2.4"
          />
          <line
            x1="22"
            y1={WT_FENCE_Y}
            x2={WORD_SLATE_WIDTH - 22}
            y2={WT_FENCE_Y}
            stroke="#6CA6E0"
            strokeWidth="2.1"
            strokeDasharray="10 8"
          />
          <line
            x1="22"
            y1={WT_GRASS_Y}
            x2={WORD_SLATE_WIDTH - 22}
            y2={WT_GRASS_Y}
            stroke="#4B8FD6"
            strokeWidth="2.8"
          />
          <line
            x1="22"
            y1={WT_ROOT_Y}
            x2={WORD_SLATE_WIDTH - 22}
            y2={WT_ROOT_Y}
            stroke="#E86F58"
            strokeWidth="2.4"
          />

          {/* Subtle margin line labels */}
          <text x="52" y={WT_SKY_Y - 7} fill="#D96B55" className="wt-rule-label">
            Sky
          </text>
          <text x="52" y={WT_FENCE_Y - 7} fill="#5C93CC" className="wt-rule-label">
            Fence
          </text>
          <text x="52" y={WT_GRASS_Y - 7} fill="#3E7EC2" className="wt-rule-label">
            Grass
          </text>
          <text x="52" y={WT_ROOT_Y + 15} fill="#D96B55" className="wt-rule-label">
            Root
          </text>

          {/* Layer 1: Upcoming ghost strokes (calm outlines, ZERO future badges/arrows!) */}
          {futureStrokes.map((s) => {
            const isSameChar = activeStroke && s.charIdx === activeStroke.charIdx;
            const ghostStrokeColor = isSameChar ? '#D8D3EE' : '#E7E2D6';
            return s.kind === 'dot' ? (
              <circle
                key={`future-${s.globalIdx}`}
                cx={s.start.x}
                cy={s.start.y}
                r={slateSpec.strokeWidth * 0.56}
                fill={ghostStrokeColor}
              />
            ) : (
              <path
                key={`future-${s.globalIdx}`}
                d={s.svgPath}
                fill="none"
                stroke={ghostStrokeColor}
                strokeWidth={slateSpec.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Layer 2: Active stroke guide corridor */}
          {activeStroke &&
            (activeStroke.kind === 'dot' ? (
              <circle
                cx={activeStroke.start.x}
                cy={activeStroke.start.y}
                r={slateSpec.strokeWidth * 0.72}
                fill="#ECEBFF"
                stroke="#B9B6F5"
                strokeWidth="2.5"
                data-testid="wt-active-corridor"
              />
            ) : (
              <path
                d={activeStroke.svgPath}
                fill="none"
                stroke="#ECEBFF"
                strokeWidth={slateSpec.strokeWidth + 8}
                strokeLinecap="round"
                strokeLinejoin="round"
                data-testid="wt-active-corridor"
              />
            ))}

          {/* Layer 3: Active stroke inner dashed centerline + directional arrows */}
          {activeStroke && activeStroke.kind === 'line' && (
            <g pointerEvents="none">
              <path
                d={activeStroke.svgPath}
                fill="none"
                stroke="#9C98EC"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 9"
              />
              {activeStroke.arrows.map((arrow, idx) => (
                <g
                  key={`arrow-${idx}`}
                  transform={`translate(${arrow.x.toFixed(1)}, ${arrow.y.toFixed(1)}) rotate(${arrow.angleDeg.toFixed(1)})`}
                >
                  <circle r="9" fill="#5B5BD6" opacity="0.9" />
                  <path
                    d="M -3.2 -4.2 L 3.6 0 L -3.2 4.2"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              ))}
            </g>
          )}

          {/* Layer 4: Completed strokes (Warm Indigo, plus Left-to-Right Glow Wave on completion!) */}
          {completedStrokes.map((s) =>
            s.kind === 'dot' ? (
              <circle
                key={`done-${s.globalIdx}`}
                cx={s.start.x}
                cy={s.start.y}
                r={slateSpec.strokeWidth * 0.58}
                fill={phase === 'word-complete' ? '#3BA99C' : '#5B5BD6'}
              />
            ) : (
              <path
                key={`done-${s.globalIdx}`}
                d={s.svgPath}
                fill="none"
                stroke={phase === 'word-complete' ? '#3BA99C' : '#5B5BD6'}
                strokeWidth={slateSpec.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={phase === 'word-complete' ? 'wt-stroke-wave' : undefined}
                style={
                  phase === 'word-complete'
                    ? { animationDelay: `${s.charIdx * 130}ms` }
                    : undefined
                }
              />
            ),
          )}

          {/* Layer 5: Live ink polyline along active stroke */}
          {activeStroke && livePolylinePoints && (
            <polyline
              points={livePolylinePoints}
              fill="none"
              stroke="#5B5BD6"
              strokeWidth={slateSpec.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}

          {/* Layer 6: Optional Dual-Input Stepping Dots (1 -> 2 -> 3) */}
          {activeStroke && activeStroke.kind === 'line' && stepDotsEnabled && (
            <g data-testid="wt-step-dots-group">
              {STEP_MILESTONES.map((fraction, mIdx) => {
                const pt = pointAlongWordStroke(activeStroke, fraction);
                const isDone = mIdx < milestoneIdx;
                const isNext = mIdx === milestoneIdx;
                return (
                  <g key={`step-${mIdx}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isNext ? 16 : 13}
                      fill={isDone ? '#3BA99C' : isNext ? '#F2B84B' : '#FFFFFF'}
                      stroke={isDone ? '#FFFFFF' : '#5B5BD6'}
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 4.5}
                      textAnchor="middle"
                      fill={isDone || isNext ? '#FFFFFF' : '#5B5BD6'}
                      className="wt-step-num"
                    >
                      {mIdx + 1}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Layer 7: Sparkle-Free Circular River-Pebble Pop on Letter Completion */}
          {pebblePop && (
            <g key={pebblePop.key} pointerEvents="none" data-testid="wt-pebble-pop">
              <circle
                cx={pebblePop.x}
                cy={pebblePop.y}
                r="46"
                fill="none"
                stroke="#3BA99C"
                strokeWidth="4"
                className="wt-pebble-pop-ring"
              />
              <ellipse
                cx={pebblePop.x - 36}
                cy={pebblePop.y - 34}
                rx="8"
                ry="6"
                fill="#3BA99C"
                className="wt-pebble-pop-ring"
              />
              <ellipse
                cx={pebblePop.x + 38}
                cy={pebblePop.y - 28}
                rx="7"
                ry="5.5"
                fill="#F2B84B"
                className="wt-pebble-pop-ring"
              />
              <circle
                cx={pebblePop.x}
                cy={pebblePop.y - 46}
                r="6"
                fill="#F27A5E"
                className="wt-pebble-pop-ring"
              />
            </g>
          )}

          {/* Layer 8: ONLY Active Stroke's Glowing Numbered Start Circle */}
          {activeStroke && (
            <g
              data-testid="wt-active-badge"
              data-stroke-kind={activeStroke.kind}
              data-start-x={activeStroke.start.x.toFixed(1)}
              data-start-y={activeStroke.start.y.toFixed(1)}
              data-end-x={activeStroke.end.x.toFixed(1)}
              data-end-y={activeStroke.end.y.toFixed(1)}
            >
              <circle
                cx={activeStroke.start.x}
                cy={activeStroke.start.y}
                r="28"
                fill="#5B5BD6"
                className="wt-active-halo"
              />
              <circle
                cx={activeStroke.start.x}
                cy={activeStroke.start.y}
                r="19"
                fill="#5B5BD6"
                stroke="#FFFFFF"
                strokeWidth="3.2"
              />
              <text
                x={activeStroke.start.x}
                y={activeStroke.start.y + 6}
                textAnchor="middle"
                className="wt-badge-num"
              >
                {activeStroke.orderInChar}
              </text>
            </g>
          )}

          {/* Layer 9: Warm Honey Tracer Pebble (Teach-First stroke demonstration) */}
          {guidePoint && (
            <g data-testid="wt-guide-pebble" pointerEvents="none">
              <circle
                cx={guidePoint.x}
                cy={guidePoint.y}
                r="24"
                fill="rgba(242, 184, 75, 0.36)"
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

          {/* Layer 10: Quiet Blocked Drag Ripple (draws zero ink) */}
          {blockedCue && (
            <g key={blockedCue.key} data-testid="wt-blocked-cue" pointerEvents="none">
              <circle
                cx={blockedCue.x}
                cy={blockedCue.y}
                r="23"
                fill="rgba(242, 122, 94, 0.16)"
                stroke="#F27A5E"
                strokeWidth="3"
              />
              <circle cx={blockedCue.x} cy={blockedCue.y} r="6.5" fill="#F27A5E" />
            </g>
          )}
        </svg>
      </div>

      <footer className="wt-footer-bar">
        <div
          className={`wt-status-pill wt-status-pill--${banner.tone}`}
          role="status"
          aria-live="polite"
          data-testid="wt-status-banner"
        >
          {banner.text}
        </div>

        <div className="wt-footer-actions">
          {phase === 'tracing' && activeStroke && activeStroke.kind === 'line' && (
            <button
              type="button"
              className={`icon-pill-btn icon-pill-btn--compact ${
                stepDotsEnabled ? 'wt-btn-active' : ''
              }`}
              data-testid="wt-step-dots-toggle"
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
            data-testid="wt-restart-word-btn"
            onClick={handleRestartCurrentWord}
            disabled={phase === 'word-complete' || phase === 'won'}
          >
            Clear {slateSpec.displayText}
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
          themeTitle="Word Trace"
          unitLabel="words"
          soloVerb="wrote"
          soundEnabled={soundEnabled}
          onPlayAgain={handleResetWholeRound}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}
    </main>
  );
}

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
import { clientToLogicalPoint, usePointerStroke } from '../../engine/usePointerStroke';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import {
  playAwesomeJobVoice,
  playDotMistakeAudio,
  playLetterAudio,
  playNumberAudio,
  playWordAudio,
  preloadDotMistakeAudio,
  preloadImages,
  stopAllSpokenAudio,
} from '../../utils/wordAudio';
import { ALL_LETTERS, type LetterId } from '../letter-train/letterData';
import { CARD_THEMES } from '../memory-match/themes';
import { StickerCutoutCanvas } from '../sticker-scene/StickerCutoutCanvas';
import {
  LOGICAL_CANVAS_SIZE,
  buildDotPuzzleDeck,
  buildSmoothPathFromDots,
  extractContourDotsForImage,
  type DotPoint,
  type DotPuzzleItem,
  type DotToDotConfig,
} from './dotEngine';
import {
  playColorBloomFanfare,
  playDotConnectChime,
  playRoundCompleteFanfare,
  playWrongDotTap,
} from './dotSounds';
import './DotToDot.css';

interface DotToDotBoardProps {
  gameKey?: number | string;
  config: DotToDotConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'playing' | 'teach-mistake' | 'think-again' | 'bloom' | 'won';

interface Point2D {
  x: number;
  y: number;
}

interface DragState {
  active: boolean;
  connectedThisGesture: boolean;
  downOnWrongIdx: number | null;
  lastPt: Point2D;
}

interface MistakeInfo {
  wrongIdx: number;
  targetIdx: number;
  wrongLabel: string;
  targetLabel: string;
}

interface PersistedDotSession {
  version: 1;
  deckIds: string[];
  puzzleIndex: number;
  connectedCount: number;
  totalMistakes: number;
  puzzleMistakes: number;
  flawlessCount: number;
}

const SESSION_KEY = 'pebble.dotToDot.v1';
const SNAP_HIT_RADIUS = 39;
const START_HIT_RADIUS = 44;
const WRONG_HIT_RADIUS = 34;

function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H2v6h4l5 4V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M23 9l-6 6M17 9l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// TODO(security): Re-verify bounds and shape before trusting sessionStorage resume data.
function tryRestoreDotSession(config: DotToDotConfig): {
  deck: DotPuzzleItem[];
  puzzleIndex: number;
  connectedCount: number;
  totalMistakes: number;
  puzzleMistakes: number;
  flawlessCount: number;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDotSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.deckIds) ||
      parsed.deckIds.length !== config.roundLength ||
      typeof parsed.puzzleIndex !== 'number' ||
      parsed.puzzleIndex < 0 ||
      parsed.puzzleIndex >= config.roundLength ||
      typeof parsed.connectedCount !== 'number' ||
      parsed.connectedCount < 0 ||
      parsed.connectedCount > config.dotCount + 1 ||
      typeof parsed.totalMistakes !== 'number' ||
      typeof parsed.puzzleMistakes !== 'number' ||
      typeof parsed.flawlessCount !== 'number'
    ) {
      return null;
    }

    const baseDeck = buildDotPuzzleDeck(config);
    const byId = new Map<string, { word: string; imagePath: string; themeId: typeof CARD_THEMES[number]['id']; themeTitle: string }>();
    for (const theme of CARD_THEMES) {
      for (const c of theme.characters) {
        byId.set(`${theme.id}:${c.pairId}`, {
          word: c.label,
          imagePath: c.imagePath,
          themeId: theme.id,
          themeTitle: theme.title,
        });
      }
    }

    const rebuilt: DotPuzzleItem[] = [];
    for (let i = 0; i < parsed.deckIds.length; i += 1) {
      const id = parsed.deckIds[i];
      if (typeof id !== 'string') return null;
      const card = byId.get(id);
      if (!card) return null;
      const fallbackEntry = baseDeck[i];
      rebuilt.push({
        ...fallbackEntry,
        id,
        word: card.word,
        imagePath: card.imagePath,
        themeId: card.themeId,
        themeTitle: card.themeTitle,
      });
    }

    return {
      deck: rebuilt,
      puzzleIndex: Math.floor(parsed.puzzleIndex),
      connectedCount: Math.floor(parsed.connectedCount),
      totalMistakes: Math.max(0, Math.floor(parsed.totalMistakes)),
      puzzleMistakes: Math.max(0, Math.floor(parsed.puzzleMistakes)),
      flawlessCount: Math.max(0, Math.floor(parsed.flawlessCount)),
    };
  } catch {
    return null;
  }
}

function saveDotSession(state: PersistedDotSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearDotSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function DotToDotBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: DotToDotBoardProps) {
  const initialState = useMemo(() => {
    if (!journeyContext) {
      const restored = tryRestoreDotSession(config);
      if (restored) return restored;
    }
    return {
      deck: buildDotPuzzleDeck(config),
      puzzleIndex: 0,
      connectedCount: 0,
      totalMistakes: 0,
      puzzleMistakes: 0,
      flawlessCount: 0,
    };
  }, [config, journeyContext]);

  const [deck, setDeck] = useState<DotPuzzleItem[]>(initialState.deck);
  const [puzzleIndex, setPuzzleIndex] = useState<number>(initialState.puzzleIndex);
  const [connectedCount, setConnectedCount] = useState<number>(initialState.connectedCount);
  const [totalMistakes, setTotalMistakeCount] = useState<number>(initialState.totalMistakes);
  const [puzzleMistakes, setPuzzleMistakes] = useState<number>(initialState.puzzleMistakes);
  const [flawlessCount, setFlawlessCount] = useState<number>(initialState.flawlessCount);
  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [mistakeInfo, setMistakeInfo] = useState<MistakeInfo | null>(null);
  const [livePointerPt, setLivePointerPt] = useState<Point2D | null>(null);
  const [sparkDotPt, setSparkDotPt] = useState<Point2D | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');

  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const teachTimerRef = useRef<number | null>(null);
  const sparkTimerRef = useRef<number | null>(null);
  const bloomAudioTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef<boolean>(false);
  const [deckSeed, setDeckSeed] = useState<number>(0);

  const currentPuzzle = deck[puzzleIndex] ?? deck[0];
  const dots: DotPoint[] = currentPuzzle?.dots ?? [];

  // Extract organic silhouette contour dots for each deck item whenever a round starts
  useEffect(() => {
    let cancelled = false;
    preloadImages(deck.map((item) => item.imagePath));
    preloadDotMistakeAudio(
      config.dotCount,
      ALL_LETTERS.slice(0, config.dotCount) as LetterId[],
    );

    void Promise.all(
      deck.map((item, idx) =>
        extractContourDotsForImage(
          item.imagePath,
          config.dotCount,
          item.sequenceKind,
          idx,
        ),
      ),
    ).then((allDots) => {
      if (cancelled) return;
      setDeck((prev) =>
        prev.map((item, idx) =>
          allDots[idx] && allDots[idx].length > 0
            ? { ...item, dots: allDots[idx] }
            : item,
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [config.dotCount, deckSeed]);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'won');
  }, [phase, onGameActiveChange]);

  useEffect(() => {
    if (journeyContext) return;
    if (phase === 'won') {
      clearDotSession();
      return;
    }
    saveDotSession({
      version: 1,
      deckIds: deck.map((d) => d.id),
      puzzleIndex,
      connectedCount,
      totalMistakes,
      puzzleMistakes,
      flawlessCount,
    });
  }, [
    journeyContext,
    phase,
    deck,
    puzzleIndex,
    connectedCount,
    totalMistakes,
    puzzleMistakes,
    flawlessCount,
  ]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
      stopAllSpokenAudio();
      if (teachTimerRef.current !== null) window.clearTimeout(teachTimerRef.current);
      if (sparkTimerRef.current !== null) window.clearTimeout(sparkTimerRef.current);
      if (bloomAudioTimerRef.current !== null) window.clearTimeout(bloomAudioTimerRef.current);
    };
  }, [onGameActiveChange]);

  const announceDot = useCallback((dot: DotPoint, enabled: boolean) => {
    if (!enabled) return;
    if (dot.isLetter) {
      playLetterAudio(dot.label.toUpperCase() as LetterId, `Letter ${dot.label}`, true);
    } else {
      const parsed = Number(dot.label);
      playNumberAudio(Number.isFinite(parsed) ? parsed : dot.index + 1, true);
    }
  }, []);

  const completePuzzleBloom = useCallback(
    (puzzleMistakeTotal: number) => {
      if (!currentPuzzle) return;
      const wasFlawless = puzzleMistakeTotal === 0;
      setConnectedCount(dots.length);
      setLivePointerPt(null);
      dragRef.current = null;
      if (wasFlawless) {
        setFlawlessCount((c) => c + 1);
      }

      setPhase('bloom');
      setConfettiMode('match');
      setConfettiKey((k) => k + 1);
      playColorBloomFanfare(wasFlawless, soundEnabled);

      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'dot-to-dot',
        conceptId:
          currentPuzzle.sequenceKind === 'letters'
            ? `dot-letters:${dots.length}`
            : currentPuzzle.sequenceKind === 'countdown'
              ? `dot-countdown:${config.dotCount}`
              : `dot-numbers:${dots.length}`,
        conceptLabel:
          currentPuzzle.sequenceKind === 'letters'
            ? `Letters A–${dots[dots.length - 1]?.label ?? 'H'}`
            : currentPuzzle.sequenceKind === 'countdown'
              ? `Countdown ${config.dotCount}→0`
              : `Numbers 1–${dots.length}`,
        skillType:
          currentPuzzle.sequenceKind === 'letters'
            ? 'letter_formation'
            : currentPuzzle.sequenceKind === 'countdown'
              ? 'sequence_order'
              : 'quantity_counting',
        correct: wasFlawless,
        attemptsTaken: 1 + puzzleMistakeTotal,
      });

      if (bloomAudioTimerRef.current !== null) {
        window.clearTimeout(bloomAudioTimerRef.current);
      }
      bloomAudioTimerRef.current = window.setTimeout(() => {
        if (currentPuzzle.canonicalWordId) {
          playWordAudio(currentPuzzle.canonicalWordId, currentPuzzle.word, soundEnabled);
        } else {
          playAwesomeJobVoice(soundEnabled);
        }
      }, 280);
    },
    [childProfile.id, config.dotCount, currentPuzzle, dots, soundEnabled],
  );

  const advanceNextDot = useCallback(
    (targetIdx: number) => {
      const dot = dots[targetIdx];
      if (!dot) return;

      playDotConnectChime(targetIdx, soundEnabled);
      setSparkDotPt({ x: dot.x, y: dot.y });
      if (sparkTimerRef.current !== null) window.clearTimeout(sparkTimerRef.current);
      sparkTimerRef.current = window.setTimeout(() => setSparkDotPt(null), 520);

      const nextCount = targetIdx + 1;
      if (nextCount >= dots.length) {
        completePuzzleBloom(puzzleMistakes);
      } else {
        setConnectedCount(nextCount);
        announceDot(dot, soundEnabled);
      }
    },
    [announceDot, completePuzzleBloom, dots, puzzleMistakes, soundEnabled],
  );

  const triggerMistakeTeachFirst = useCallback(
    (wrongIdx: number) => {
      if (phase !== 'playing' || !currentPuzzle) return;
      const targetIdx = connectedCount;
      const wrongDot = dots[wrongIdx];
      const targetDot = dots[targetIdx];
      if (!wrongDot || !targetDot) return;

      setLivePointerPt(null);
      dragRef.current = null;
      setPuzzleMistakes((c) => c + 1);
      setTotalMistakeCount((c) => c + 1);
      setPhase('teach-mistake');
      setMistakeInfo({
        wrongIdx,
        targetIdx,
        wrongLabel: wrongDot.label,
        targetLabel: targetDot.label,
      });

      playWrongDotTap(soundEnabled);

      let audioFinished = !soundEnabled;
      let timerFinished = false;
      const maybeOpenThinkAgain = () => {
        if (audioFinished && timerFinished) {
          setPhase('think-again');
        }
      };

      if (teachTimerRef.current !== null) window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = window.setTimeout(() => {
        timerFinished = true;
        maybeOpenThinkAgain();
      }, 2150);

      const safetyTimer = window.setTimeout(() => {
        audioFinished = true;
        timerFinished = true;
        setPhase((cur) => (cur === 'teach-mistake' ? 'think-again' : cur));
      }, 4300);

      playDotMistakeAudio(targetDot.label, targetDot.isLetter, soundEnabled, () => {
        window.clearTimeout(safetyTimer);
        audioFinished = true;
        maybeOpenThinkAgain();
      });
    },
    [connectedCount, currentPuzzle, dots, phase, soundEnabled],
  );

  const resolveLogicalPoint = useCallback(
    (event: ReactPointerEvent<HTMLElement>): Point2D | null => {
      const target = svgRef.current ?? stageRef.current;
      if (!target) return null;
      return clientToLogicalPoint(
        target,
        event.clientX,
        event.clientY,
        LOGICAL_CANVAS_SIZE,
        LOGICAL_CANVAS_SIZE,
        'contain',
      );
    },
    [],
  );

  const findHitDotIndex = useCallback(
    (pt: Point2D, minIdx: number, maxIdx: number, radius: number): number | null => {
      let bestIdx: number | null = null;
      let bestDist = Infinity;
      for (let i = minIdx; i <= maxIdx && i < dots.length; i += 1) {
        const d = Math.hypot(pt.x - dots[i].x, pt.y - dots[i].y);
        if (d <= radius && d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    },
    [dots],
  );

  const connectedCountRef = useRef<number>(connectedCount);
  connectedCountRef.current = connectedCount;

  const handleStrokeStart = useCallback(
    (pt: Point2D) => {
      if (phase !== 'playing' || dots.length === 0) return;
      const nextIdx = connectedCountRef.current;
      const targetDot = dots[nextIdx];
      if (!targetDot) return;

      // Did pointer press directly on the expected next dot?
      if (Math.hypot(pt.x - targetDot.x, pt.y - targetDot.y) <= START_HIT_RADIUS) {
        dragRef.current = {
          active: true,
          connectedThisGesture: true,
          downOnWrongIdx: null,
          lastPt: pt,
        };
        setLivePointerPt(pt);
        advanceNextDot(nextIdx);
        return;
      }

      // Did pointer start from the current anchor (last connected dot) to drag to next dot?
      if (nextIdx > 0) {
        const anchorDot = dots[nextIdx - 1];
        if (anchorDot && Math.hypot(pt.x - anchorDot.x, pt.y - anchorDot.y) <= START_HIT_RADIUS) {
          dragRef.current = {
            active: true,
            connectedThisGesture: false,
            downOnWrongIdx: null,
            lastPt: pt,
          };
          setLivePointerPt(pt);
          return;
        }
      }

      // Pressed a wrong higher dot: defer check to release/tap so accidental initial graze doesn't punish
      const wrongIdx = findHitDotIndex(pt, nextIdx + 1, dots.length - 1, WRONG_HIT_RADIUS);
      dragRef.current = {
        active: false,
        connectedThisGesture: false,
        downOnWrongIdx: wrongIdx,
        lastPt: pt,
      };
    },
    [advanceNextDot, dots, findHitDotIndex, phase],
  );

  const handleStrokeMove = useCallback(
    (pt: Point2D) => {
      if (phase !== 'playing' || !dragRef.current) return;
      dragRef.current.lastPt = pt;
      if (!dragRef.current.active) return;

      setLivePointerPt(pt);
      const nextIdx = connectedCountRef.current;
      const targetDot = dots[nextIdx];
      if (!targetDot) return;

      // Never trigger mistake while transiting over other dots during drag — only snap onto targetDot
      if (Math.hypot(pt.x - targetDot.x, pt.y - targetDot.y) <= SNAP_HIT_RADIUS) {
        dragRef.current.connectedThisGesture = true;
        advanceNextDot(nextIdx);
        if (nextIdx + 1 >= dots.length) {
          dragRef.current.active = false;
          setLivePointerPt(null);
        }
      }
    },
    [advanceNextDot, dots, phase],
  );

  const handleStrokeEnd = useCallback(
    (pt: Point2D | null) => {
      const curDrag = dragRef.current;
      dragRef.current = null;
      setLivePointerPt(null);
      if (phase !== 'playing') return;

      const finalPt = pt ?? curDrag?.lastPt ?? null;
      if (!finalPt) return;

      const nextIdx = connectedCountRef.current;
      if (nextIdx >= dots.length) return;

      // Final check: did stroke finish on targetDot?
      const targetDot = dots[nextIdx];
      if (targetDot && Math.hypot(finalPt.x - targetDot.x, finalPt.y - targetDot.y) <= SNAP_HIT_RADIUS) {
        advanceNextDot(nextIdx);
        return;
      }

      // If no dot was connected in this gesture and pointer released onto a wrong higher dot -> teach mistake!
      if (!curDrag?.connectedThisGesture) {
        const hitWrong =
          findHitDotIndex(finalPt, nextIdx + 1, dots.length - 1, WRONG_HIT_RADIUS) ??
          curDrag?.downOnWrongIdx ??
          null;
        if (hitWrong !== null && hitWrong > nextIdx) {
          triggerMistakeTeachFirst(hitWrong);
        }
      }
    },
    [advanceNextDot, dots, findHitDotIndex, phase, triggerMistakeTeachFirst],
  );

  const handleStrokeCancel = useCallback(() => {
    dragRef.current = null;
    setLivePointerPt(null);
  }, []);

  const { handlers: pointerHandlers } = usePointerStroke<Point2D>({
    enabled: phase === 'playing',
    resolvePoint: resolveLogicalPoint,
    onStrokeStart: handleStrokeStart,
    onStrokeMove: handleStrokeMove,
    onStrokeEnd: handleStrokeEnd,
    onStrokeCancel: handleStrokeCancel,
  });

  const finishWholeRound = useCallback(() => {
    setPhase('won');
    playRoundCompleteFanfare(soundEnabled);
    setConfettiMode('win');
    setConfettiKey((k) => k + 1);

    if (!roundLoggedRef.current) {
      roundLoggedRef.current = true;
      const total = Math.max(1, deck.length + totalMistakes);
      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'dot-to-dot',
        mode: `${config.sequenceMode}-${config.dotCount}-${deck.length}`,
        totalAttempts: total,
        correctAttempts: deck.length,
        mistakes: totalMistakes,
        flawless: totalMistakes === 0,
        durationMs: Math.max(1000, Date.now() - startedAtRef.current),
        conceptsTested: deck.map((item) => `picture:${item.id}`),
      });
    }

    if (journeyContext) {
      journeyContext.onActivityComplete();
    }
  }, [childProfile.id, config.dotCount, config.sequenceMode, deck, journeyContext, soundEnabled, totalMistakes]);

  const handleAdvancePuzzle = useCallback(() => {
    stopAllSpokenAudio();
    if (puzzleIndex + 1 >= deck.length) {
      finishWholeRound();
      return;
    }
    setPuzzleIndex((idx) => idx + 1);
    setConnectedCount(0);
    setPuzzleMistakes(0);
    setMistakeInfo(null);
    setLivePointerPt(null);
    setPhase('playing');
  }, [deck.length, finishWholeRound, puzzleIndex]);

  const handleResetCurrentDots = useCallback(() => {
    stopAllSpokenAudio();
    setConnectedCount(0);
    setMistakeInfo(null);
    setLivePointerPt(null);
    setPhase('playing');
  }, []);

  const handlePlayAgain = useCallback(() => {
    stopAllSpokenAudio();
    clearDotSession();
    roundLoggedRef.current = false;
    startedAtRef.current = Date.now();
    const freshDeck = buildDotPuzzleDeck(config);
    setDeck(freshDeck);
    setDeckSeed((s) => s + 1);
    setPuzzleIndex(0);
    setConnectedCount(0);
    setTotalMistakeCount(0);
    setPuzzleMistakes(0);
    setFlawlessCount(0);
    setMistakeInfo(null);
    setLivePointerPt(null);
    setPhase('playing');
  }, [config]);

  const handleHearPrompt = useCallback(() => {
    if (phase === 'bloom' && currentPuzzle) {
      if (currentPuzzle.canonicalWordId) {
        playWordAudio(currentPuzzle.canonicalWordId, currentPuzzle.word, true);
      } else {
        playAwesomeJobVoice(true);
      }
      return;
    }
    const nextDot = dots[connectedCount];
    if (nextDot) {
      announceDot(nextDot, true);
    }
  }, [announceDot, connectedCount, currentPuzzle, dots, phase]);

  const connectedDots = dots.slice(0, Math.min(connectedCount, dots.length));
  const isBloomed = phase === 'bloom' || phase === 'won';
  const connectedPathD = useMemo(
    () => buildSmoothPathFromDots(connectedDots, isBloomed),
    [connectedDots, isBloomed],
  );

  const lastConnectedDot = connectedCount > 0 ? dots[connectedCount - 1] : null;
  const nextExpectedDot = dots[connectedCount] ?? null;
  const showStartGuide = connectedCount === 0 && phase === 'playing';
  const showStuckHint = puzzleMistakes >= 2 && connectedCount >= 1 && phase === 'playing';

  const bannerTone =
    phase === 'bloom' ? 'is-bloom' : phase === 'teach-mistake' ? 'is-warn' : '';

  const headlineText = useMemo(() => {
    if (!currentPuzzle) return 'Dot-to-Dot';
    if (phase === 'bloom') {
      return `Color Bloom! You revealed ${currentPuzzle.word}!`;
    }
    if (phase === 'teach-mistake' && mistakeInfo) {
      return `Connect in order! You tapped ${mistakeInfo.wrongLabel} — find ${mistakeInfo.targetLabel} next!`;
    }
    if (connectedCount === 0) {
      return `Start at ${dots[0]?.label ?? '1'} — drag or tap in order!`;
    }
    const target = dots[connectedCount];
    return target
      ? `Nice! Connect ${dots[connectedCount - 1]?.label} → ${target.label} next!`
      : `Revealing ${currentPuzzle.word}...`;
  }, [connectedCount, currentPuzzle, dots, mistakeInfo, phase]);

  return (
    <div className="dtd-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <header className="dtd-top-bar">
        <div className="dtd-top-bar__side">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="dot-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="dot-setup-btn"
            >
              Setup
            </button>
          )}
        </div>

        <BrandLogo size="sm" />

        <div className="dtd-top-bar__side">
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

      <section className={`dtd-banner-card ${bannerTone}`} aria-live="polite">
        <div className="dtd-banner-card__player">
          <img
            src={getAvatarSrc(childProfile.avatar)}
            alt=""
            className="dtd-banner-card__avatar"
          />
          <div className="dtd-banner-card__text">
            <span className="dtd-banner-card__eyebrow">
              {currentPuzzle?.themeTitle ?? 'Dot-to-Dot'} • Picture {puzzleIndex + 1} of{' '}
              {deck.length}
            </span>
            <span className="dtd-banner-card__headline" data-testid="dot-banner-headline">
              {headlineText}
            </span>
          </div>
        </div>

        <div className="dtd-round-pills" aria-label="Round progress">
          {deck.map((item, idx) => (
            <span
              key={`${item.id}-${idx}`}
              className={`dtd-round-pill ${
                idx < puzzleIndex || (idx === puzzleIndex && isBloomed)
                  ? 'is-done'
                  : idx === puzzleIndex
                    ? 'is-current'
                    : ''
              }`}
            >
              {idx + 1}
            </span>
          ))}
        </div>
      </section>

      <div className="dtd-stage-shell">
        <div
          ref={stageRef}
          className={`dtd-art-stage ${isBloomed ? 'dtd-art-stage--bloom' : ''}`}
          data-testid="dot-art-stage"
          {...pointerHandlers}
        >
          <div className="dtd-paper-dots" aria-hidden="true" />

          {currentPuzzle && (
            <div className="dtd-cutout-frame" aria-hidden="true">
              <div
                className={`dtd-cutout-layer dtd-cutout-layer--silhouette ${
                  isBloomed ? 'is-hidden' : ''
                }`}
              >
                <StickerCutoutCanvas
                  imagePath={currentPuzzle.imagePath}
                  alt={currentPuzzle.word}
                  mode="silhouette"
                  size={340}
                  className="dtd-cutout-canvas"
                />
              </div>
              <div
                className={`dtd-cutout-layer dtd-cutout-layer--color ${
                  isBloomed ? 'is-revealed' : ''
                }`}
              >
                <StickerCutoutCanvas
                  imagePath={currentPuzzle.imagePath}
                  alt={currentPuzzle.word}
                  mode="cutout"
                  size={340}
                  className="dtd-cutout-canvas"
                />
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${LOGICAL_CANVAS_SIZE} ${LOGICAL_CANVAS_SIZE}`}
            className="dtd-svg-overlay"
            role="img"
            aria-label={`Dot-to-dot board with ${dots.length} ${
              currentPuzzle?.sequenceKind === 'letters' ? 'letters' : 'numbers'
            }`}
            data-testid="dot-svg-canvas"
          >
            {/* Connected ribbon stroke */}
            {connectedPathD && (
              <path
                d={connectedPathD}
                fill="none"
                stroke={isBloomed ? '#3BA99C' : '#5B5BD6'}
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isBloomed ? 0.52 : 0.9}
              />
            )}

            {/* Elastic live drag ribbon from active anchor to finger */}
            {lastConnectedDot && livePointerPt && phase === 'playing' && (
              <line
                x1={lastConnectedDot.x}
                y1={lastConnectedDot.y}
                x2={livePointerPt.x}
                y2={livePointerPt.y}
                stroke="#F27A5E"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray="10 8"
                opacity="0.88"
              />
            )}

            {/* Brief sparkle ring on successful snap */}
            {sparkDotPt && (
              <circle
                cx={sparkDotPt.x}
                cy={sparkDotPt.y}
                r="32"
                fill="none"
                stroke="#3BA99C"
                strokeWidth="4"
                opacity="0.7"
              />
            )}

            {/* Numbered / Lettered Pebble Dots */}
            {dots.map((dot, idx) => {
              const isConnected = idx < connectedCount;
              const isAnchor = idx === connectedCount - 1 && !isBloomed;
              const isStartDot = idx === 0 && showStartGuide;
              const isTeachTarget =
                mistakeInfo !== null && mistakeInfo.targetIdx === idx && phase === 'teach-mistake';
              const isTeachWrong =
                mistakeInfo !== null && mistakeInfo.wrongIdx === idx && phase === 'teach-mistake';
              const isHintDot = showStuckHint && idx === connectedCount;

              let fill = '#FFFDF9';
              let stroke = '#B9C0D4';
              let textFill = '#1E2433';

              if (isConnected) {
                fill = isAnchor ? '#5B5BD6' : '#3BA99C';
                stroke = isAnchor ? '#3E3EB0' : '#268176';
                textFill = '#FFFFFF';
              } else if (isStartDot || isTeachTarget) {
                fill = '#5B5BD6';
                stroke = '#3E3EB0';
                textFill = '#FFFFFF';
              } else if (isTeachWrong) {
                fill = '#F27A5E';
                stroke = '#C85136';
                textFill = '#FFFFFF';
              }

              return (
                <g
                  key={`${dot.index}-${dot.label}`}
                  transform={`translate(${dot.x}, ${dot.y})`}
                  className={`dtd-dot-group ${isBloomed ? 'dtd-dot-group--muted' : ''}`}
                  data-testid={`dot-node-${dot.index}`}
                  data-dot-label={dot.label}
                  data-dot-x={dot.x}
                  data-dot-y={dot.y}
                  data-connected={isConnected ? 'true' : 'false'}
                >
                  {(isStartDot || isAnchor || isTeachTarget || isHintDot) && !isBloomed && (
                    <circle
                      cx="0"
                      cy="0"
                      r="27"
                      fill="none"
                      stroke={isTeachTarget || isStartDot || isAnchor ? '#5B5BD6' : '#3BA99C'}
                      strokeWidth="3.2"
                      strokeDasharray={isHintDot ? '6 5' : undefined}
                      className="dtd-dot-pulse"
                    />
                  )}

                  {/* Soft drop shadow */}
                  <circle cx="0" cy="3" r="21" fill="rgba(30, 36, 51, 0.14)" />

                  {/* Tactile pebble disc */}
                  <circle
                    cx="0"
                    cy="0"
                    r="21"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="3.2"
                  />

                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="Fredoka, sans-serif"
                    fontSize="19"
                    fontWeight="700"
                    fill={textFill}
                  >
                    {dot.label}
                  </text>

                  {isTeachTarget && (
                    <g transform="translate(0, -33)">
                      <rect x="-34" y="-12" width="68" height="22" rx="11" fill="#5B5BD6" />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="Fredoka, sans-serif"
                        fontSize="12"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        Next: {dot.label}
                      </text>
                    </g>
                  )}

                  {isTeachWrong && (
                    <g transform="translate(0, -33)">
                      <rect x="-38" y="-12" width="76" height="22" rx="11" fill="#D96B52" />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="Fredoka, sans-serif"
                        fontSize="11.5"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        Tapped {dot.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {phase === 'bloom' && currentPuzzle && (
            <div className="dtd-bloom-badge" data-testid="dot-bloom-label">
              {currentPuzzle.word}
            </div>
          )}
        </div>
      </div>

      <footer className="dtd-footer-bar">
        <div className="dtd-footer-progress">
          <div className="dtd-footer-progress__row">
            <span>
              {phase === 'bloom'
                ? 'Picture Revealed!'
                : `Dots Connected: ${connectedCount} / ${dots.length}`}
            </span>
            {nextExpectedDot && phase === 'playing' && (
              <span style={{ color: '#5B5BD6' }}>Next: {nextExpectedDot.label}</span>
            )}
          </div>
          <div className="dtd-footer-progress__track" aria-hidden="true">
            <div
              className="dtd-footer-progress__fill"
              style={{
                width: `${dots.length > 0 ? Math.round((connectedCount / dots.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="dtd-footer-actions">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={handleHearPrompt}
            data-testid="dot-hear-btn"
          >
            <SpeakerIcon />
            <span>{phase === 'bloom' ? 'Hear Word' : 'Hear Next'}</span>
          </button>

          {phase === 'bloom' ? (
            <button
              type="button"
              className="dtd-next-btn"
              onClick={handleAdvancePuzzle}
              data-testid="dot-next-picture-btn"
            >
              {puzzleIndex + 1 >= deck.length ? 'Celebrate!' : 'Next Picture →'}
            </button>
          ) : (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={handleResetCurrentDots}
              data-testid="dot-reset-btn"
            >
              Reset
            </button>
          )}
        </div>
      </footer>

      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Connect in Order!"
        hint={
          mistakeInfo
            ? `Start from dot ${mistakeInfo.targetLabel} next so your ribbon connects every pebble in order!`
            : 'Take a breath and look for the next pebble in order.'
        }
        readyLabel="Try Again"
        startAgainLabel="Start Picture Over"
        soundEnabled={soundEnabled}
        onReady={() => {
          setMistakeInfo(null);
          setPhase('playing');
        }}
        onStartAgain={handleResetCurrentDots}
      />

      {phase === 'won' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="dot-win-title">
          <div className="winner-modal" data-testid="dot-winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={36} />
              <div className="winner-avatar-halo">
                <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
              </div>
            </div>
            <h2 id="dot-win-title">
              {flawlessCount === deck.length
                ? `Super Artist, ${childProfile.name}!`
                : `Great Job, ${childProfile.name}!`}
            </h2>
            <p className="winner-subtitle">
              You connected all {deck.length} mystery pictures and brought every color to life!
            </p>

            <div className="dtd-win-gallery">
              {deck.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="dtd-win-thumb" title={item.word}>
                  <img src={assetUrl(item.imagePath)} alt={item.word} />
                </div>
              ))}
            </div>

            <div className="winner-actions">
              {journeyContext ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => journeyContext.onActivityComplete()}
                  data-testid="dot-journey-continue-btn"
                >
                  Continue Adventure →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePlayAgain}
                    data-testid="dot-play-again-btn"
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
                      data-testid="dot-win-hub-btn"
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

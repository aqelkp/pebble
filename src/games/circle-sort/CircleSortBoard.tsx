import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  clientToLogicalPoint,
  distanceBetweenPoints,
  usePointerStroke,
  type LogicalPoint,
} from '../../engine/usePointerStroke';
import { solveGridFit, useStageSize } from '../../engine/useStageSize';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { CircleSortItemIllustration } from './CircleSortArt';
import {
  CIRCLE_SORT_SESSION_KEY,
  buildCircleSortDeck,
  buildPageForQuest,
  getCircleSortItemSpec,
  getCircleSortQuestSpec,
  isValidCircleSortItemId,
  isValidCircleSortQuestId,
  recordCircleSortQuestMastery,
  type CircleSortCardSlot,
  type CircleSortConfig,
  type CircleSortItemId,
  type CircleSortPageSpec,
  type CircleSortQuestId,
} from './circleSortData';
import {
  playCirclePageFanfare,
  playCircleSortCheerVoice,
  playCircleSortItemConfirmation,
  playCircleSortMissionPrompt,
  playCircleSortMistakeExplanation,
  playCircleSuccessChime,
  playCircleWrongTap,
  preloadCircleSortPageAssets,
  stopCircleSortVoice,
} from './circleSortSounds';
import './CircleSort.css';

interface CircleSortBoardProps {
  gameKey?: number | string;
  config: CircleSortConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase =
  | 'playing'
  | 'teach-mistake'
  | 'think-again'
  | 'page-complete'
  | 'won';

interface PersistedPageSlot {
  itemId: CircleSortItemId;
  isTarget: boolean;
}

interface PersistedPageSpec {
  questId: CircleSortQuestId;
  cols: number;
  rows: number;
  targetCount: number;
  slots: PersistedPageSlot[];
}

interface PersistedCircleSortSession {
  version: 1;
  pages: PersistedPageSpec[];
  pageIndex: number;
  circledSlots: number[];
  pageMistakes: number;
  totalMistakes: number;
  flawlessPagesCount: number;
  circledTotalCount: number;
}

interface WrongSelectionState {
  slotIndex: number;
  itemId: CircleSortItemId;
  pillLabel: string;
  spokenText: string;
}

function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

/**
 * Hand-sketched workbook oval loop SVG drawn around circled target pictures.
 */
function HandSketchedCircleLoop() {
  return (
    <svg
      viewBox="0 0 120 112"
      preserveAspectRatio="none"
      className="cs-circle-loop-svg"
      aria-hidden="true"
    >
      <path
        className="cs-circle-loop-path"
        d="M 56 8 C 93 6, 114 27, 113 56 C 112 87, 89 106, 58 105 C 25 104, 6 84, 7 54 C 8 24, 31 9, 66 11"
      />
    </svg>
  );
}

// TODO(security): Pebble runs 100% locally in the browser; sessionStorage payloads are treated as
// untrusted and validated against strict quest/item allow-lists and integer bounds before restore.
function tryRestoreCircleSortSession(config: CircleSortConfig): {
  deck: CircleSortPageSpec[];
  pageIndex: number;
  circledSlots: number[];
  pageMistakes: number;
  totalMistakes: number;
  flawlessPagesCount: number;
  circledTotalCount: number;
} | null {
  try {
    const raw = window.sessionStorage.getItem(CIRCLE_SORT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedCircleSortSession>;
    const expectedRows = config.gridMode === '2x3' ? 2 : 3;
    const expectedSlots = 3 * expectedRows;

    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.pages) ||
      parsed.pages.length !== config.roundLength ||
      typeof parsed.pageIndex !== 'number' ||
      !Number.isInteger(parsed.pageIndex) ||
      parsed.pageIndex < 0 ||
      parsed.pageIndex >= config.roundLength ||
      !Array.isArray(parsed.circledSlots) ||
      typeof parsed.pageMistakes !== 'number' ||
      typeof parsed.totalMistakes !== 'number' ||
      typeof parsed.flawlessPagesCount !== 'number' ||
      typeof parsed.circledTotalCount !== 'number'
    ) {
      return null;
    }

    const deck: CircleSortPageSpec[] = [];
    for (let i = 0; i < parsed.pages.length; i += 1) {
      const p = parsed.pages[i];
      if (
        !p ||
        typeof p !== 'object' ||
        !isValidCircleSortQuestId(p.questId) ||
        p.cols !== 3 ||
        p.rows !== expectedRows ||
        typeof p.targetCount !== 'number' ||
        p.targetCount < 3 ||
        p.targetCount > 5 ||
        !Array.isArray(p.slots) ||
        p.slots.length !== expectedSlots
      ) {
        return null;
      }

      const quest = getCircleSortQuestSpec(p.questId);
      const distractorMap = new Map(quest.distractors.map((d) => [d.itemId, d]));
      const targetSet = new Set(quest.targets);
      const seenItems = new Set<CircleSortItemId>();

      const slots: CircleSortCardSlot[] = [];
      let actualTargets = 0;
      for (let s = 0; s < p.slots.length; s += 1) {
        const rawSlot = p.slots[s];
        if (!rawSlot || !isValidCircleSortItemId(rawSlot.itemId) || seenItems.has(rawSlot.itemId)) {
          return null;
        }
        seenItems.add(rawSlot.itemId);
        const itemSpec = getCircleSortItemSpec(rawSlot.itemId);

        if (rawSlot.isTarget) {
          if (!targetSet.has(rawSlot.itemId)) return null;
          actualTargets += 1;
          slots.push({
            slotIndex: s,
            itemId: rawSlot.itemId,
            label: itemSpec.label,
            isTarget: true,
          });
        } else {
          const dSpec = distractorMap.get(rawSlot.itemId);
          if (!dSpec) return null;
          slots.push({
            slotIndex: s,
            itemId: rawSlot.itemId,
            label: itemSpec.label,
            isTarget: false,
            pillLabel: dSpec.pillLabel,
            mistakeAudioKey: dSpec.mistakeAudioKey,
            mistakeSpokenText: dSpec.mistakeSpokenText,
          });
        }
      }

      if (actualTargets !== p.targetCount) return null;

      deck.push({
        pageUid: `${p.questId}-${i}-restored`,
        questId: p.questId,
        cols: p.cols,
        rows: p.rows,
        targetCount: p.targetCount,
        slots,
      });
    }

    const activePage = deck[parsed.pageIndex];
    const validCircled = Array.from(
      new Set(
        parsed.circledSlots.filter(
          (idx): idx is number =>
            typeof idx === 'number' &&
            Number.isInteger(idx) &&
            idx >= 0 &&
            idx < expectedSlots &&
            Boolean(activePage.slots[idx]?.isTarget),
        ),
      ),
    );

    if (validCircled.length >= activePage.targetCount) {
      return null;
    }

    return {
      deck,
      pageIndex: parsed.pageIndex,
      circledSlots: validCircled,
      pageMistakes: Math.max(0, Math.min(999, Math.floor(parsed.pageMistakes))),
      totalMistakes: Math.max(0, Math.min(999, Math.floor(parsed.totalMistakes))),
      flawlessPagesCount: Math.max(
        0,
        Math.min(config.roundLength, Math.floor(parsed.flawlessPagesCount)),
      ),
      circledTotalCount: Math.max(0, Math.min(999, Math.floor(parsed.circledTotalCount))),
    };
  } catch {
    return null;
  }
}

function saveCircleSortSession(state: PersistedCircleSortSession): void {
  try {
    window.sessionStorage.setItem(CIRCLE_SORT_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearCircleSortSession(): void {
  try {
    window.sessionStorage.removeItem(CIRCLE_SORT_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

interface CardGeometry {
  slotIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

function detectCircledSlotFromStroke(
  points: readonly LogicalPoint[],
  cards: readonly CardGeometry[],
): { kind: 'tap' | 'circle' | 'none'; slotIndex: number } {
  if (points.length === 0 || cards.length === 0) {
    return { kind: 'none', slotIndex: -1 };
  }

  let pathLen = 0;
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  let sumX = points[0].x;
  let sumY = points[0].y;

  for (let i = 1; i < points.length; i += 1) {
    pathLen += distanceBetweenPoints(points[i - 1], points[i]);
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].x > maxX) maxX = points[i].x;
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].y > maxY) maxY = points[i].y;
    sumX += points[i].x;
    sumY += points[i].y;
  }

  // Short pointer travel -> direct Tap
  if (pathLen < 18) {
    const pt = points[points.length - 1];
    for (const c of cards) {
      if (pt.x >= c.left && pt.x <= c.left + c.width && pt.y >= c.top && pt.y <= c.top + c.height) {
        return { kind: 'tap', slotIndex: c.slotIndex };
      }
    }
    return { kind: 'none', slotIndex: -1 };
  }

  // Longer pointer stroke -> evaluate workbook circle / loop around a card
  const centroidX = sumX / points.length;
  const centroidY = sumY / points.length;

  let bestSlot = -1;
  let bestScore = -Infinity;

  for (const c of cards) {
    // Cumulative unsigned angle swept around card center (c.cx, c.cy)
    let sweptAngle = 0;
    for (let i = 1; i < points.length; i += 1) {
      const ax = points[i - 1].x - c.cx;
      const ay = points[i - 1].y - c.cy;
      const bx = points[i].x - c.cx;
      const by = points[i].y - c.cy;
      const cross = ax * by - ay * bx;
      const dot = ax * bx + ay * by;
      sweptAngle += Math.abs(Math.atan2(cross, dot));
    }

    const distToCenter = Math.hypot(centroidX - c.cx, centroidY - c.cy);
    const maxRadius = Math.max(c.width, c.height) * 0.78;
    if (distToCenter > maxRadius) continue;

    const overlapW = Math.max(0, Math.min(maxX, c.left + c.width) - Math.max(minX, c.left));
    const overlapH = Math.max(0, Math.min(maxY, c.top + c.height) - Math.max(minY, c.top));
    const widthFrac = overlapW / Math.max(1, c.width);
    const heightFrac = overlapH / Math.max(1, c.height);

    const hasLoopArc = sweptAngle >= 2.15 && pathLen >= Math.min(c.width, c.height) * 0.85;
    const hasBoundingWrap =
      widthFrac >= 0.42 &&
      heightFrac >= 0.42 &&
      sweptAngle >= 1.55 &&
      pathLen >= Math.min(c.width, c.height) * 1.05;

    if (hasLoopArc || hasBoundingWrap) {
      const score = sweptAngle * 2 - distToCenter / Math.max(1, c.width);
      if (score > bestScore) {
        bestScore = score;
        bestSlot = c.slotIndex;
      }
    }
  }

  if (bestSlot >= 0) {
    return { kind: 'circle', slotIndex: bestSlot };
  }
  return { kind: 'none', slotIndex: -1 };
}

export function CircleSortBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: CircleSortBoardProps) {
  const initialState = useMemo(() => {
    if (!journeyContext) {
      const restored = tryRestoreCircleSortSession(config);
      if (restored) return restored;
    }
    return {
      deck: buildCircleSortDeck(config),
      pageIndex: 0,
      circledSlots: [] as number[],
      pageMistakes: 0,
      totalMistakes: 0,
      flawlessPagesCount: 0,
      circledTotalCount: 0,
    };
  }, [config, journeyContext]);

  const [deck, setDeck] = useState<CircleSortPageSpec[]>(initialState.deck);
  const [pageIndex, setPageIndex] = useState<number>(initialState.pageIndex);
  const [circledSlots, setCircledSlots] = useState<number[]>(initialState.circledSlots);
  const [pageMistakes, setPageMistakes] = useState<number>(initialState.pageMistakes);
  const [crownDimmed, setCrownDimmed] = useState<boolean>(initialState.pageMistakes > 0);
  const [totalMistakes, setTotalMistakes] = useState<number>(initialState.totalMistakes);
  const [flawlessPagesCount, setFlawlessPagesCount] = useState<number>(
    initialState.flawlessPagesCount,
  );
  const [circledTotalCount, setCircledTotalCount] = useState<number>(
    initialState.circledTotalCount,
  );

  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [wrongState, setWrongState] = useState<WrongSelectionState | null>(null);
  const [liveStroke, setLiveStroke] = useState<LogicalPoint[]>([]);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');

  const [stageRef, stageSize] = useStageSize<HTMLDivElement>();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const strokePointsRef = useRef<LogicalPoint[]>([]);
  const lastPointerHandledAtRef = useRef<number>(0);

  const cheerTimerRef = useRef<number | null>(null);
  const teachMinTimerRef = useRef<number | null>(null);
  const teachSafetyTimerRef = useRef<number | null>(null);
  const resumePromptTimerRef = useRef<number | null>(null);
  const cancelAudioRef = useRef<(() => void) | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef<boolean>(false);
  const testedConceptsRef = useRef<Set<string>>(new Set());

  const currentPage = deck[pageIndex] ?? deck[0];
  const currentQuest = getCircleSortQuestSpec(currentPage.questId);
  const circledSet = useMemo(() => new Set(circledSlots), [circledSlots]);

  const clearPendingTimers = useCallback(() => {
    if (cheerTimerRef.current !== null) {
      window.clearTimeout(cheerTimerRef.current);
      cheerTimerRef.current = null;
    }
    if (teachMinTimerRef.current !== null) {
      window.clearTimeout(teachMinTimerRef.current);
      teachMinTimerRef.current = null;
    }
    if (teachSafetyTimerRef.current !== null) {
      window.clearTimeout(teachSafetyTimerRef.current);
      teachSafetyTimerRef.current = null;
    }
    if (resumePromptTimerRef.current !== null) {
      window.clearTimeout(resumePromptTimerRef.current);
      resumePromptTimerRef.current = null;
    }
    cancelAudioRef.current?.();
    cancelAudioRef.current = null;
  }, []);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'won');
  }, [phase, onGameActiveChange]);

  useEffect(() => {
    if (journeyContext) return;
    if (phase === 'won') {
      clearCircleSortSession();
      return;
    }
    saveCircleSortSession({
      version: 1,
      pages: deck.map((p) => ({
        questId: p.questId,
        cols: p.cols,
        rows: p.rows,
        targetCount: p.targetCount,
        slots: p.slots.map((s) => ({ itemId: s.itemId, isTarget: s.isTarget })),
      })),
      pageIndex,
      circledSlots,
      pageMistakes,
      totalMistakes,
      flawlessPagesCount,
      circledTotalCount,
    });
  }, [
    journeyContext,
    phase,
    deck,
    pageIndex,
    circledSlots,
    pageMistakes,
    totalMistakes,
    flawlessPagesCount,
    circledTotalCount,
  ]);

  // Preload current + next workbook page assets
  useEffect(() => {
    if (currentPage) {
      preloadCircleSortPageAssets(currentPage);
    }
    const nextPage = deck[pageIndex + 1];
    if (nextPage) {
      preloadCircleSortPageAssets(nextPage);
    }
  }, [currentPage, deck, pageIndex]);

  // Speak Mission Header prompt at the start of every new page
  useEffect(() => {
    if (!currentPage) return;
    const timer = window.setTimeout(() => {
      playCircleSortMissionPrompt(currentPage.questId, currentPage.targetCount, soundEnabled);
    }, 120);
    return () => {
      window.clearTimeout(timer);
    };
    // Only speak automatically when the active pageUid changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage?.pageUid]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
      clearPendingTimers();
      stopCircleSortVoice();
    };
  }, [clearPendingTimers, onGameActiveChange]);

  const SHEET_PAD = 12;
  const GRID_GAP = 10;
  const gridFit = useMemo(() => {
    const sw = stageSize.ready ? stageSize.width : 720;
    const sh = stageSize.ready ? stageSize.height : 620;
    return solveGridFit({
      stageWidth: Math.min(720, sw - SHEET_PAD * 2 - 8),
      stageHeight: sh - SHEET_PAD * 2 - 8,
      cols: currentPage.cols,
      rows: currentPage.rows,
      cardAspectRatio: currentPage.rows === 2 ? 1.08 : 1.04,
      gap: GRID_GAP,
      minItemWidth: 82,
      minItemHeight: 82,
      paddingPx: 4,
    });
  }, [currentPage.cols, currentPage.rows, stageSize.height, stageSize.ready, stageSize.width]);

  const sheetWidth = gridFit.gridWidth + SHEET_PAD * 2;
  const sheetHeight = gridFit.gridHeight + SHEET_PAD * 2;
  const artSize = Math.max(46, Math.round(Math.min(gridFit.width, gridFit.height) * 0.62));
  const labelFontSize = Math.max(13, Math.min(18, Math.round(gridFit.height * 0.115)));

  const cardGeometries = useMemo<CardGeometry[]>(() => {
    return currentPage.slots.map((slot) => {
      const col = slot.slotIndex % currentPage.cols;
      const row = Math.floor(slot.slotIndex / currentPage.cols);
      const left = SHEET_PAD + col * (gridFit.width + gridFit.gap);
      const top = SHEET_PAD + row * (gridFit.height + gridFit.gap);
      return {
        slotIndex: slot.slotIndex,
        left,
        top,
        width: gridFit.width,
        height: gridFit.height,
        cx: left + gridFit.width / 2,
        cy: top + gridFit.height / 2,
      };
    });
  }, [currentPage.cols, currentPage.slots, gridFit.gap, gridFit.height, gridFit.width]);

  const handleReplayPrompt = useCallback(() => {
    if (!currentPage) return;
    playCircleSortMissionPrompt(currentPage.questId, currentPage.targetCount, true);
  }, [currentPage]);

  const evaluateSlotSelection = useCallback(
    (slotIndex: number) => {
      if (phase !== 'playing' || !currentPage) return;
      const slot = currentPage.slots[slotIndex];
      if (!slot) return;

      // Tapping/circling an already-circled item calmly replays its name without penalty
      if (circledSet.has(slotIndex)) {
        playCircleSortItemConfirmation(slot.itemId, soundEnabled);
        return;
      }

      const itemSpec = getCircleSortItemSpec(slot.itemId);
      testedConceptsRef.current.add(itemSpec.conceptId);

      if (slot.isTarget) {
        const nextCircled = [...circledSlots, slotIndex];
        const nextTotalCircled = circledTotalCount + 1;

        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'circle-sort',
          conceptId: itemSpec.conceptId,
          conceptLabel: itemSpec.label,
          skillType: 'picture_recognition',
          correct: true,
          attemptsTaken: 1,
        });

        setWrongState(null);
        setCircledSlots(nextCircled);
        setCircledTotalCount(nextTotalCircled);
        playCircleSuccessChime(nextCircled.length - 1, soundEnabled);

        if (nextCircled.length >= currentPage.targetCount) {
          const pageFlawless = pageMistakes === 0;
          if (pageFlawless) {
            setFlawlessPagesCount((c) => c + 1);
          }
          recordCircleSortQuestMastery(currentPage.questId, pageFlawless);

          setPhase('page-complete');
          setConfettiMode('match');
          setConfettiKey((k) => k + 1);
          playCirclePageFanfare(pageFlawless, soundEnabled);
          playCircleSortItemConfirmation(slot.itemId, soundEnabled);

          cheerTimerRef.current = window.setTimeout(() => {
            playCircleSortCheerVoice(
              pageFlawless ? 'flawless-page' : 'page-complete',
              soundEnabled,
            );
          }, 820);
          return;
        }

        playCircleSortItemConfirmation(slot.itemId, soundEnabled);
        return;
      }

      // Wrong Item Selected -> Step 1: Teach First on Visible Board (~2.6s, input locked)
      clearPendingTimers();
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'circle-sort',
        conceptId: itemSpec.conceptId,
        conceptLabel: itemSpec.label,
        skillType: 'picture_recognition',
        correct: false,
        attemptsTaken: 1,
      });

      const pillLabel = slot.pillLabel ?? `${slot.label} → Not in Group`;
      const spokenText =
        slot.mistakeSpokenText ?? `No, ${slot.label.toLowerCase()} does not belong in this group.`;
      const audioKey = slot.mistakeAudioKey ?? 'not-fruit-carrot';

      setPageMistakes((m) => m + 1);
      setTotalMistakes((m) => m + 1);
      setWrongState({
        slotIndex,
        itemId: slot.itemId,
        pillLabel,
        spokenText,
      });
      setPhase('teach-mistake');
      playCircleWrongTap(soundEnabled);

      let audioDone = false;
      let minHoldDone = false;

      const openDelayedThinkAgain = () => {
        if (audioDone && minHoldDone) {
          // Step 2: Dim Perfect Crown & open ThinkAgainOverlay only AFTER spoken explanation completes
          setCrownDimmed(true);
          setPhase('think-again');
        }
      };

      teachMinTimerRef.current = window.setTimeout(() => {
        minHoldDone = true;
        openDelayedThinkAgain();
      }, 2500);

      teachSafetyTimerRef.current = window.setTimeout(() => {
        audioDone = true;
        minHoldDone = true;
        setCrownDimmed(true);
        setPhase((cur) => (cur === 'teach-mistake' ? 'think-again' : cur));
      }, 4900);

      cancelAudioRef.current = playCircleSortMistakeExplanation(
        audioKey,
        spokenText,
        soundEnabled,
        () => {
          if (teachSafetyTimerRef.current !== null) {
            window.clearTimeout(teachSafetyTimerRef.current);
            teachSafetyTimerRef.current = null;
          }
          audioDone = true;
          openDelayedThinkAgain();
        },
      );
    },
    [
      childProfile.id,
      circledSlots,
      circledSet,
      circledTotalCount,
      clearPendingTimers,
      currentPage,
      pageMistakes,
      phase,
      soundEnabled,
    ],
  );

  // Dual Input: Pointer Stroke (supports both Tap and Finger-Circling)
  const { handlers: pointerHandlers } = usePointerStroke<LogicalPoint>({
    enabled: phase === 'playing',
    resolvePoint: (event) => {
      if (!sheetRef.current) return null;
      return clientToLogicalPoint(
        sheetRef.current,
        event.clientX,
        event.clientY,
        sheetWidth,
        sheetHeight,
        'stretch',
      );
    },
    onStrokeStart: (pt) => {
      strokePointsRef.current = [pt];
      setLiveStroke([]);
    },
    onStrokeMove: (pt) => {
      const pts = strokePointsRef.current;
      const last = pts[pts.length - 1];
      if (!last || distanceBetweenPoints(last, pt) >= 3.5) {
        pts.push(pt);
        if (pts.length >= 4) {
          setLiveStroke([...pts]);
        }
      }
    },
    onStrokeEnd: (pt) => {
      const pts = strokePointsRef.current;
      if (pt) pts.push(pt);
      setLiveStroke([]);
      strokePointsRef.current = [];

      const result = detectCircledSlotFromStroke(pts, cardGeometries);
      if (result.slotIndex >= 0) {
        lastPointerHandledAtRef.current = performance.now();
        evaluateSlotSelection(result.slotIndex);
      }
    },
    onStrokeCancel: () => {
      strokePointsRef.current = [];
      setLiveStroke([]);
    },
  });

  const handleCardButtonClick = useCallback(
    (slotIndex: number) => {
      if (performance.now() - lastPointerHandledAtRef.current < 380) {
        return;
      }
      evaluateSlotSelection(slotIndex);
    },
    [evaluateSlotSelection],
  );

  const handleResumeAfterThinkAgain = useCallback(() => {
    setWrongState(null);
    setPhase('playing');
    if (currentPage) {
      resumePromptTimerRef.current = window.setTimeout(() => {
        playCircleSortMissionPrompt(currentPage.questId, currentPage.targetCount, soundEnabled);
      }, 220);
    }
  }, [currentPage, soundEnabled]);

  const handleRestartCurrentPage = useCallback(() => {
    if (!currentPage) return;
    clearPendingTimers();
    stopCircleSortVoice();
    const freshPage = buildPageForQuest(currentPage.questId, config.gridMode, pageIndex);
    setDeck((prev) => prev.map((p, idx) => (idx === pageIndex ? freshPage : p)));
    setCircledSlots([]);
    setPageMistakes(0);
    setCrownDimmed(false);
    setWrongState(null);
    setLiveStroke([]);
    setPhase('playing');
  }, [clearPendingTimers, config.gridMode, currentPage, pageIndex]);

  const finishWholeRound = useCallback(() => {
    clearPendingTimers();
    stopCircleSortVoice();
    setPhase('won');
    setConfettiMode('win');
    setConfettiKey((k) => k + 1);
    const allFlawless = totalMistakes === 0;
    playCirclePageFanfare(allFlawless, soundEnabled);
    playCircleSortCheerVoice(allFlawless ? 'round-flawless' : 'round-complete', soundEnabled);

    if (!roundLoggedRef.current) {
      roundLoggedRef.current = true;
      const totalAttempts = Math.max(1, circledTotalCount + totalMistakes);
      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'circle-sort',
        mode: `${config.packId}-${config.gridMode}-${deck.length}`,
        totalAttempts,
        correctAttempts: Math.max(1, circledTotalCount),
        mistakes: totalMistakes,
        flawless: allFlawless,
        durationMs: Math.max(1000, Date.now() - startedAtRef.current),
        conceptsTested: Array.from(testedConceptsRef.current),
      });
    }

    if (journeyContext) {
      journeyContext.onActivityComplete();
    }
  }, [
    childProfile.id,
    circledTotalCount,
    clearPendingTimers,
    config.gridMode,
    config.packId,
    deck.length,
    journeyContext,
    soundEnabled,
    totalMistakes,
  ]);

  const handleNextPage = useCallback(() => {
    clearPendingTimers();
    stopCircleSortVoice();
    if (pageIndex + 1 >= deck.length) {
      finishWholeRound();
      return;
    }
    setPageIndex((idx) => idx + 1);
    setCircledSlots([]);
    setPageMistakes(0);
    setCrownDimmed(false);
    setWrongState(null);
    setLiveStroke([]);
    setPhase('playing');
  }, [clearPendingTimers, deck.length, finishWholeRound, pageIndex]);

  const handlePlayAgain = useCallback(() => {
    clearPendingTimers();
    stopCircleSortVoice();
    clearCircleSortSession();
    roundLoggedRef.current = false;
    testedConceptsRef.current.clear();
    startedAtRef.current = Date.now();
    setDeck(buildCircleSortDeck(config));
    setPageIndex(0);
    setCircledSlots([]);
    setPageMistakes(0);
    setCrownDimmed(false);
    setTotalMistakes(0);
    setFlawlessPagesCount(0);
    setCircledTotalCount(0);
    setWrongState(null);
    setLiveStroke([]);
    setPhase('playing');
  }, [clearPendingTimers, config]);

  const liveStrokeD = useMemo(() => {
    if (liveStroke.length < 2) return '';
    return liveStroke
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
  }, [liveStroke]);

  const circledItemsList = useMemo(() => {
    return circledSlots
      .map((sIdx) => currentPage.slots[sIdx])
      .filter((s): s is CircleSortCardSlot => Boolean(s));
  }, [circledSlots, currentPage.slots]);

  const isPageDone = phase === 'page-complete' || phase === 'won';

  return (
    <div className="cs-screen" data-testid="circle-sort-board">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <header className="cs-top-bar">
        <div className="cs-top-bar__side">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="circle-sort-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="circle-sort-setup-btn"
            >
              Setup
            </button>
          )}
        </div>

        <BrandLogo size="sm" />

        <div className="cs-top-bar__side">
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

      {/* Mission Header */}
      <section
        className={`cs-mission-card ${
          isPageDone ? 'is-complete' : phase === 'teach-mistake' ? 'is-teach' : ''
        }`}
        aria-live="polite"
      >
        <div className="cs-mission-card__left">
          <img
            src={getAvatarSrc(childProfile.avatar)}
            alt=""
            className="cs-mission-avatar"
          />
          <div className="cs-mission-copy">
            <span className="cs-mission-eyebrow">
              <span>
                Page {pageIndex + 1} of {deck.length}
              </span>
              <span className="cs-mission-tag">{currentQuest.shortBadge}</span>
            </span>
            <span className="cs-mission-headline" data-testid="circle-sort-mission-headline">
              {currentQuest.buildHeadline(currentPage.targetCount)}
            </span>
            <span className="cs-mission-sub">{currentQuest.promptSubHint}</span>
          </div>
        </div>

        <div className="cs-mission-card__right">
          <button
            type="button"
            className="cs-replay-btn"
            disabled={phase === 'teach-mistake' || phase === 'think-again'}
            onClick={handleReplayPrompt}
            data-testid="circle-sort-replay-btn"
            aria-label="Replay mission instruction"
          >
            <SpeakerIcon />
            <span>Hear Clue</span>
          </button>

          <div
            className={`cs-crown-pill ${crownDimmed ? 'is-dimmed' : ''}`}
            data-testid="circle-sort-crown-pill"
            data-dimmed={crownDimmed ? 'true' : 'false'}
          >
            <CrownIcon size={17} />
            <span>{crownDimmed ? 'Keep Going' : 'Perfect'}</span>
          </div>
        </div>
      </section>

      {/* Collection Progress Strip */}
      <div className="cs-progress-bar" aria-label="Circled items progress">
        <div className="cs-progress-slots">
          <span className="cs-progress-count" data-testid="circle-sort-progress-count">
            {circledSlots.length} / {currentPage.targetCount} Circled
          </span>
          {Array.from({ length: currentPage.targetCount }, (_, idx) => {
            const foundSlot = circledItemsList[idx];
            return (
              <span
                key={idx}
                className={`cs-progress-badge ${foundSlot ? 'is-filled' : ''}`}
              >
                {foundSlot ? `✓ ${foundSlot.label}` : `Spot ${idx + 1}`}
              </span>
            );
          })}
        </div>
        <span className="cs-progress-hint">Tap OR draw a circle with your finger!</span>
      </div>

      {/* Tactile Workbook Grid Stage */}
      <div className="cs-stage" ref={stageRef}>
        <div
          ref={sheetRef}
          className="cs-workbook-sheet"
          style={{ width: sheetWidth, height: sheetHeight }}
          data-testid="circle-sort-sheet"
          {...pointerHandlers}
        >
          <div
            className="cs-grid"
            role="group"
            aria-label={currentQuest.buildHeadline(currentPage.targetCount)}
            style={{
              gridTemplateColumns: `repeat(${currentPage.cols}, ${gridFit.width}px)`,
              gridTemplateRows: `repeat(${currentPage.rows}, ${gridFit.height}px)`,
              gap: `${gridFit.gap}px`,
            }}
          >
            {currentPage.slots.map((slot) => {
              const isCircled = circledSet.has(slot.slotIndex);
              const isWrongTeach =
                phase === 'teach-mistake' && wrongState?.slotIndex === slot.slotIndex;

              return (
                <button
                  key={`${currentPage.pageUid}-${slot.slotIndex}-${slot.itemId}`}
                  type="button"
                  disabled={phase !== 'playing'}
                  className={`cs-card ${isCircled ? 'is-circled' : ''} ${
                    isWrongTeach ? 'is-wrong-teach' : ''
                  }`}
                  style={{ width: gridFit.width, height: gridFit.height }}
                  data-testid={`cs-card-${slot.itemId}`}
                  data-slot-index={slot.slotIndex}
                  data-is-target={slot.isTarget ? 'true' : 'false'}
                  data-circled={isCircled ? 'true' : 'false'}
                  onClick={() => handleCardButtonClick(slot.slotIndex)}
                >
                  {isCircled && (
                    <>
                      <HandSketchedCircleLoop />
                      <span className="cs-check-badge" aria-hidden="true">
                        ✓
                      </span>
                    </>
                  )}

                  <span className="cs-card__art-wrap">
                    <CircleSortItemIllustration itemId={slot.itemId} size={artSize} />
                  </span>

                  <span className="cs-card__label" style={{ fontSize: labelFontSize }}>
                    {slot.label}
                  </span>

                  {isWrongTeach && wrongState && (
                    <span className="cs-teach-pill" data-testid="circle-sort-teach-pill">
                      {wrongState.pillLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {liveStrokeD && (
            <svg
              viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
              className="cs-live-stroke-svg"
              aria-hidden="true"
            >
              <path d={liveStrokeD} className="cs-live-stroke-path" />
            </svg>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`cs-footer ${
          phase === 'page-complete' ? 'is-complete' : phase === 'teach-mistake' ? 'is-teach' : ''
        }`}
      >
        {phase === 'page-complete' ? (
          <>
            <span className="cs-footer__text" data-testid="circle-sort-complete-text">
              {pageMistakes === 0
                ? `Bravo! All ${currentPage.targetCount} ${currentQuest.title.toLowerCase()} circled with zero mistakes!`
                : `Wonderful! You circled all ${currentPage.targetCount} ${currentQuest.title.toLowerCase()}!`}
            </span>
            <button
              type="button"
              className="cs-next-btn"
              onClick={handleNextPage}
              data-testid="circle-sort-next-btn"
            >
              {pageIndex + 1 >= deck.length ? 'Finish & Celebrate!' : 'Next Page →'}
            </button>
          </>
        ) : phase === 'teach-mistake' && wrongState ? (
          <span className="cs-footer__text" data-testid="circle-sort-teach-banner">
            {wrongState.spokenText}
          </span>
        ) : (
          <span className="cs-footer__text">
            Find {currentPage.targetCount - circledSlots.length} more to finish this workbook page!
          </span>
        )}
      </footer>

      {/* Delayed Step-2 ThinkAgainOverlay */}
      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Let's pause and think!"
        hint={
          wrongState
            ? `${wrongState.spokenText} Look carefully for ${currentQuest.title.toLowerCase()}!`
            : `Take a calm breath and look carefully for ${currentQuest.title.toLowerCase()}!`
        }
        readyLabel="Keep Trying"
        startAgainLabel="Start Again"
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleResumeAfterThinkAgain}
        onStartAgain={handleRestartCurrentPage}
      />

      {/* Round Winner Modal */}
      {phase === 'won' && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cs-win-title"
        >
          <div className="winner-modal" data-testid="circle-sort-winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={36} />
              <div className="winner-avatar-halo">
                <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
              </div>
            </div>
            <h2 id="cs-win-title">
              {flawlessPagesCount === deck.length
                ? `Super Sorter, ${childProfile.name}!`
                : `Great Job, ${childProfile.name}!`}
            </h2>
            <p className="winner-subtitle">
              You circled {circledTotalCount} matching pictures across{' '}
              {deck.length === 1 ? 'your workbook page' : `all ${deck.length} workbook pages`}!
            </p>

            <div className="cs-win-summary-chips">
              {deck.map((p) => {
                const q = getCircleSortQuestSpec(p.questId);
                return (
                  <span key={p.pageUid} className="cs-win-quest-chip">
                    ✓ {q.title}
                  </span>
                );
              })}
            </div>

            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handlePlayAgain}
                data-testid="circle-sort-play-again-btn"
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
                  data-testid="circle-sort-win-hub-btn"
                >
                  Games
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

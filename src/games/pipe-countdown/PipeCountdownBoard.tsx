import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { useStageSize } from '../../engine/useStageSize';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import {
  GARDEN_SCENES,
  PIPE_COUNTDOWN_SESSION_KEY,
  buildCountdownSessionDeck,
  buildSingleCountdownRound,
  getCountdownModeSpec,
  getModeAllNumbers,
  getNotebookRows,
  getRodPalette,
  recordPipeCountdownRepairMastery,
  shuffleNumbers,
  type CountdownRoundSpec,
  type PipeCountdownConfig,
} from './countdownData';
import {
  playCountdownHintVoice,
  playCountdownIntroVoice,
  playCountdownNumberVoice,
  playCountdownSealNote,
  playCountdownWrongTap,
  playWrongRodTeachVoice,
  playZeroFountainFanfare,
  playZeroSealedCelebrationVoice,
  preloadCountdownRoundAssets,
  stopCountdownVoice,
} from './countdownSounds';
import './PipeCountdown.css';

interface PipeCountdownBoardProps {
  gameKey?: number | string;
  config: PipeCountdownConfig;
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
  | 'round-celebrate'
  | 'won';

interface PersistedRoundItem {
  sceneId: string;
  preSealedNumbers: number[];
  initialTrayOrder: number[];
}

interface PersistedCountdownSession {
  version: 1;
  modeId: PipeCountdownConfig['modeId'];
  roundLength: PipeCountdownConfig['roundLength'];
  rounds: PersistedRoundItem[];
  roundIndex: number;
  sealedNumbers: number[];
  trayOrder: number[];
  roundMistakes: number;
  currentSlotMistakes: number;
  totalMistakes: number;
  flawlessCount: number;
  rodsPlacedCount: number;
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
 * 6-spoke round shut-off valve wheel ring for Cap 0 (zero 4-point sparkle stars).
 */
function ZeroValveWheelGraphic({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, margin: 'auto', pointerEvents: 'none' }}
    >
      <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
      <line x1="20" y1="3" x2="20" y2="37" stroke="rgba(120,76,8,0.34)" strokeWidth="2.4" />
      <line x1="5.3" y1="11.5" x2="34.7" y2="28.5" stroke="rgba(120,76,8,0.34)" strokeWidth="2.4" />
      <line x1="34.7" y1="11.5" x2="5.3" y2="28.5" stroke="rgba(120,76,8,0.34)" strokeWidth="2.4" />
    </svg>
  );
}

function GardenFountainArtwork({
  flowing,
  wheelAccent,
  basinAccent,
}: {
  flowing: boolean;
  wheelAccent: string;
  basinAccent: string;
}) {
  return (
    <svg viewBox="0 0 180 205" className="pcd-fountain-svg" aria-hidden="true">
      {/* Soft sunny garden backdrop arch */}
      <rect x="10" y="10" width="160" height="185" rx="26" fill="#FFFFFF" opacity="0.72" />
      <circle cx="142" cy="36" r="15" fill="#F2B84B" opacity="0.88" />

      {/* Feed pipe entering from Shut-Off Valve 0 on the left */}
      <rect x="0" y="92" width="54" height="16" rx="6" fill={flowing ? '#3BA99C' : '#9EB0BA'} />
      <rect x="46" y="89" width="8" height="22" rx="3" fill="#6F838E" />

      {/* Flowing water arcs when 0 is sealed */}
      {flowing && (
        <g className="pcd-fountain-jet">
          <path
            d="M 54 100 Q 72 88 86 96"
            stroke="#45B3E0"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 90 144 Q 70 112 52 136"
            stroke="#45B3E0"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 90 144 Q 110 112 128 136"
            stroke="#3BA99C"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="62" cy="118" r="4.5" fill="#45B3E0" />
          <circle cx="90" cy="108" r="5" fill="#73CCF0" />
          <circle cx="118" cy="118" r="4.5" fill="#3BA99C" />
        </g>
      )}

      {/* Waterwheel support post */}
      <path d="M 74 160 L 90 96 L 106 160 Z" fill="#D5C3A6" />

      {/* 6-paddle Garden Waterwheel */}
      <g className={`pcd-wheel-rotor ${flowing ? 'is-spinning' : ''}`}>
        <circle cx="90" cy="94" r="34" fill="#FFFDF8" stroke={wheelAccent} strokeWidth="6" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 90 94)`}>
            <line x1="90" y1="60" x2="90" y2="128" stroke={wheelAccent} strokeWidth="4" />
            <rect x="83" y="53" width="14" height="8" rx="4" fill="#F2B84B" />
          </g>
        ))}
        <circle cx="90" cy="94" r="10" fill={basinAccent} stroke="#FFFFFF" strokeWidth="3" />
      </g>

      {/* Terracotta / Stone Garden Fountain Basin */}
      <ellipse
        cx="90"
        cy="162"
        rx="58"
        ry="12"
        fill={flowing ? '#73CCF0' : '#DCE7EE'}
        stroke="#B8C9D4"
        strokeWidth="2"
      />
      <path
        d="M 32 162 Q 36 188 90 188 Q 144 188 148 162 Z"
        fill={basinAccent}
        opacity="0.9"
      />
      {flowing && (
        <>
          <ellipse cx="90" cy="162" rx="38" ry="5.5" fill="#FFFFFF" opacity="0.55" />
          <circle cx="72" cy="154" r="3.5" fill="#45B3E0" />
          <circle cx="108" cy="153" r="3.5" fill="#3BA99C" />
        </>
      )}
    </svg>
  );
}

// TODO(security): Pebble runs locally as a static client-only PWA; all session state restored
// from sessionStorage is strictly validated against mode bounds, number sets, and array lengths.
function tryRestoreCountdownSession(config: PipeCountdownConfig): {
  deck: CountdownRoundSpec[];
  roundIndex: number;
  sealedNumbers: number[];
  trayOrder: number[];
  roundMistakes: number;
  currentSlotMistakes: number;
  totalMistakes: number;
  flawlessCount: number;
  rodsPlacedCount: number;
} | null {
  try {
    const raw = window.sessionStorage.getItem(PIPE_COUNTDOWN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedCountdownSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      parsed.modeId !== config.modeId ||
      parsed.roundLength !== config.roundLength ||
      !Array.isArray(parsed.rounds) ||
      parsed.rounds.length !== config.roundLength ||
      typeof parsed.roundIndex !== 'number' ||
      !Number.isInteger(parsed.roundIndex) ||
      parsed.roundIndex < 0 ||
      parsed.roundIndex >= config.roundLength ||
      !Array.isArray(parsed.sealedNumbers) ||
      !Array.isArray(parsed.trayOrder) ||
      typeof parsed.roundMistakes !== 'number' ||
      typeof parsed.currentSlotMistakes !== 'number' ||
      typeof parsed.totalMistakes !== 'number' ||
      typeof parsed.flawlessCount !== 'number' ||
      typeof parsed.rodsPlacedCount !== 'number'
    ) {
      return null;
    }

    const expectedAll = getModeAllNumbers(config.modeId);
    const expectedSet = new Set<number>(expectedAll);

    const deck: CountdownRoundSpec[] = [];
    for (let i = 0; i < parsed.rounds.length; i += 1) {
      const item = parsed.rounds[i];
      if (!item || typeof item !== 'object') return null;
      const scene =
        GARDEN_SCENES.find((s) => s.id === item.sceneId) ??
        GARDEN_SCENES[i % GARDEN_SCENES.length];
      if (
        !Array.isArray(item.preSealedNumbers) ||
        !item.preSealedNumbers.every(
          (n) => typeof n === 'number' && Number.isInteger(n) && expectedSet.has(n),
        )
      ) {
        return null;
      }
      const preSet = new Set<number>(item.preSealedNumbers);
      if (
        !Array.isArray(item.initialTrayOrder) ||
        item.initialTrayOrder.length !== expectedAll.length - preSet.size ||
        !item.initialTrayOrder.every(
          (n) =>
            typeof n === 'number' &&
            Number.isInteger(n) &&
            expectedSet.has(n) &&
            !preSet.has(n),
        )
      ) {
        return null;
      }
      deck.push({
        roundUid: `pcd-restored-${i}`,
        modeId: config.modeId,
        scene,
        allNumbers: [...expectedAll],
        preSealedNumbers: [...preSet],
        initialTrayOrder: [...new Set(item.initialTrayOrder)],
      });
    }

    const sealedClean = Array.from(
      new Set(
        parsed.sealedNumbers.filter(
          (n): n is number => typeof n === 'number' && Number.isInteger(n) && expectedSet.has(n),
        ),
      ),
    );
    const sealedSet = new Set<number>(sealedClean);
    // Ensure countdown invariant: no unsealed number has a smaller user-sealed number unless pre-sealed
    const activeRound = deck[parsed.roundIndex];
    for (const pre of activeRound.preSealedNumbers) {
      if (!sealedSet.has(pre)) return null;
    }

    const expectedRemaining = expectedAll.filter((n) => !sealedSet.has(n));
    if (expectedRemaining.length === 0) {
      // Do not restore onto an already-finished round
      return null;
    }

    const trayClean = Array.from(
      new Set(
        parsed.trayOrder.filter(
          (n): n is number =>
            typeof n === 'number' &&
            Number.isInteger(n) &&
            expectedSet.has(n) &&
            !sealedSet.has(n),
        ),
      ),
    );
    if (trayClean.length !== expectedRemaining.length) {
      return null;
    }

    return {
      deck,
      roundIndex: parsed.roundIndex,
      sealedNumbers: sealedClean,
      trayOrder: trayClean,
      roundMistakes: Math.max(0, Math.min(999, Math.floor(parsed.roundMistakes))),
      currentSlotMistakes: Math.max(0, Math.min(99, Math.floor(parsed.currentSlotMistakes))),
      totalMistakes: Math.max(0, Math.min(999, Math.floor(parsed.totalMistakes))),
      flawlessCount: Math.max(0, Math.min(config.roundLength, Math.floor(parsed.flawlessCount))),
      rodsPlacedCount: Math.max(0, Math.min(999, Math.floor(parsed.rodsPlacedCount))),
    };
  } catch {
    return null;
  }
}

function saveCountdownSession(state: PersistedCountdownSession): void {
  try {
    window.sessionStorage.setItem(PIPE_COUNTDOWN_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearCountdownSession(): void {
  try {
    window.sessionStorage.removeItem(PIPE_COUNTDOWN_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function PipeCountdownBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: PipeCountdownBoardProps) {
  const initialState = useMemo(() => {
    if (!journeyContext) {
      const restored = tryRestoreCountdownSession(config);
      if (restored) return restored;
    }
    const freshDeck = buildCountdownSessionDeck(config);
    const first = freshDeck[0];
    return {
      deck: freshDeck,
      roundIndex: 0,
      sealedNumbers: [...first.preSealedNumbers],
      trayOrder: [...first.initialTrayOrder],
      roundMistakes: 0,
      currentSlotMistakes: 0,
      totalMistakes: 0,
      flawlessCount: 0,
      rodsPlacedCount: 0,
    };
  }, [config, journeyContext]);

  const [deck, setDeck] = useState<CountdownRoundSpec[]>(initialState.deck);
  const [roundIndex, setRoundIndex] = useState<number>(initialState.roundIndex);
  const [sealedNumbers, setSealedNumbers] = useState<number[]>(initialState.sealedNumbers);
  const [trayOrder, setTrayOrder] = useState<number[]>(initialState.trayOrder);
  const [roundMistakes, setRoundMistakes] = useState<number>(initialState.roundMistakes);
  const [currentSlotMistakes, setCurrentSlotMistakes] = useState<number>(
    initialState.currentSlotMistakes,
  );
  const [totalMistakes, setTotalMistakes] = useState<number>(initialState.totalMistakes);
  const [flawlessCount, setFlawlessCount] = useState<number>(initialState.flawlessCount);
  const [rodsPlacedCount, setRodsPlacedCount] = useState<number>(initialState.rodsPlacedCount);

  const [phase, setPhase] = useState<BoardPhase>('playing');
  const [justSealedNum, setJustSealedNum] = useState<number | null>(null);
  const [wrongRodNum, setWrongRodNum] = useState<number | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');

  // Pointer drag-and-drop state
  const [dragState, setDragState] = useState<{
    rodNum: number;
    x: number;
    y: number;
    overStage: boolean;
  } | null>(null);

  const [stageRef, stageSize] = useStageSize<HTMLDivElement>();
  const wasDraggedRef = useRef<boolean>(false);
  const teachCleanupRef = useRef<(() => void) | null>(null);
  const teachTimerRef = useRef<number | null>(null);
  const sealPopTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef<boolean>(false);
  const testedNumbersRef = useRef<Set<number>>(new Set());

  const currentRound = deck[roundIndex] ?? deck[0];
  const modeSpec = useMemo(() => getCountdownModeSpec(config.modeId), [config.modeId]);
  const notebookRows = useMemo(() => getNotebookRows(config.modeId), [config.modeId]);

  const sealedSet = useMemo(() => new Set<number>(sealedNumbers), [sealedNumbers]);

  /**
   * The ONLY active open leak is the widest unsealed number (strictly descending order!).
   */
  const activeLeakNum = useMemo<number | null>(() => {
    for (const num of currentRound.allNumbers) {
      if (!sealedSet.has(num)) return num;
    }
    return null;
  }, [currentRound.allNumbers, sealedSet]);

  const clearPendingTimers = useCallback(() => {
    if (teachCleanupRef.current) {
      teachCleanupRef.current();
      teachCleanupRef.current = null;
    }
    if (teachTimerRef.current !== null) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    if (sealPopTimerRef.current !== null) {
      window.clearTimeout(sealPopTimerRef.current);
      sealPopTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimers();
      stopCountdownVoice();
    };
  }, [clearPendingTimers]);

  useEffect(() => {
    if (currentRound) {
      preloadCountdownRoundAssets(currentRound);
    }
  }, [currentRound]);

  // Speak calm mode intro on the first repair start
  const spokenIntroRoundUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentRound) return;
    if (spokenIntroRoundUidRef.current === currentRound.roundUid) return;
    spokenIntroRoundUidRef.current = currentRound.roundUid;
    if (roundIndex === 0 && rodsPlacedCount === 0 && roundMistakes === 0) {
      playCountdownIntroVoice(config.modeId, soundEnabled);
    }
  }, [config.modeId, currentRound, rodsPlacedCount, roundIndex, roundMistakes, soundEnabled]);

  // Guard hardware/browser Back navigation while round is active
  useEffect(() => {
    const isActive =
      phase !== 'won' && (rodsPlacedCount > 0 || roundMistakes > 0 || roundIndex > 0);
    onGameActiveChange?.(isActive);
  }, [onGameActiveChange, phase, rodsPlacedCount, roundIndex, roundMistakes]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
    };
  }, [onGameActiveChange]);

  // Persist active state in sessionStorage
  useEffect(() => {
    if (journeyContext) return;
    if (phase === 'won' || phase === 'round-celebrate') {
      if (phase === 'won') {
        clearCountdownSession();
      }
      return;
    }
    saveCountdownSession({
      version: 1,
      modeId: config.modeId,
      roundLength: config.roundLength,
      rounds: deck.map((r) => ({
        sceneId: r.scene.id,
        preSealedNumbers: r.preSealedNumbers,
        initialTrayOrder: r.initialTrayOrder,
      })),
      roundIndex,
      sealedNumbers,
      trayOrder,
      roundMistakes,
      currentSlotMistakes,
      totalMistakes,
      flawlessCount,
      rodsPlacedCount,
    });
  }, [
    config.modeId,
    config.roundLength,
    currentSlotMistakes,
    deck,
    flawlessCount,
    journeyContext,
    phase,
    rodsPlacedCount,
    roundIndex,
    roundMistakes,
    sealedNumbers,
    totalMistakes,
    trayOrder,
  ]);

  // Dynamic responsive sizing for portrait 768x1024 zero-scroll fit
  const slotCount = currentRound.allNumbers.length;
  const topNum = modeSpec.topNumber;

  const { slotHeight, pipeUnitPx, zeroSlotDiameter, trayUnitPx, trayRodHeight } = useMemo(() => {
    const stageH = stageSize.ready ? stageSize.height : 490;
    const stageW = stageSize.ready ? stageSize.width : 700;

    const availStackH = Math.max(240, stageH - 46);
    const computedSlotH = Math.max(
      27,
      Math.min(46, Math.floor((availStackH - (slotCount - 1) * 4) / slotCount)),
    );

    // Aqueduct left column gets ~61% of stage width minus spine + spray margin
    const availPipeW = Math.max(170, Math.floor(stageW * 0.58) - 66);
    const computedPipeUnit = Math.max(
      17,
      Math.min(54, Math.floor(availPipeW / Math.max(5, topNum))),
    );
    const computedZeroDiam = Math.max(30, Math.min(44, computedSlotH));

    const computedTrayUnit = topNum <= 5 ? 30 : topNum === 9 ? 21 : 19;
    const computedTrayH = topNum >= 10 ? 35 : 38;

    return {
      slotHeight: computedSlotH,
      pipeUnitPx: computedPipeUnit,
      zeroSlotDiameter: computedZeroDiam,
      trayUnitPx: computedTrayUnit,
      trayRodHeight: computedTrayH,
    };
  }, [slotCount, stageSize.height, stageSize.ready, stageSize.width, topNum]);

  const getPipeSlotWidth = useCallback(
    (num: number): number => {
      if (num === 0) return zeroSlotDiameter;
      return Math.max(36, num * pipeUnitPx);
    },
    [pipeUnitPx, zeroSlotDiameter],
  );

  const getTrayRodWidth = useCallback(
    (num: number): number => {
      if (num === 0) return trayRodHeight + 2;
      return Math.max(34, num * trayUnitPx);
    },
    [trayRodHeight, trayUnitPx],
  );

  const evaluateRodAttempt = useCallback(
    (pickedNum: number) => {
      if (phase !== 'playing' || activeLeakNum === null) return;
      if (sealedSet.has(pickedNum)) return;

      if (pickedNum === activeLeakNum) {
        const cleanSlot = currentSlotMistakes === 0;
        testedNumbersRef.current.add(activeLeakNum);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'pipe-countdown',
          conceptId: `number:${activeLeakNum}`,
          conceptLabel: `Number ${activeLeakNum}`,
          skillType: 'quantity_counting',
          correct: cleanSlot,
          attemptsTaken: 1 + currentSlotMistakes,
        });

        const nextSealed = [...sealedNumbers, pickedNum];
        const nextTray = trayOrder.filter((n) => n !== pickedNum);
        const isFinalZero = nextTray.length === 0;

        setSealedNumbers(nextSealed);
        setTrayOrder(nextTray);
        setRodsPlacedCount((c) => c + 1);
        setCurrentSlotMistakes(0);
        setWrongRodNum(null);
        setJustSealedNum(pickedNum);

        if (sealPopTimerRef.current !== null) {
          window.clearTimeout(sealPopTimerRef.current);
        }
        sealPopTimerRef.current = window.setTimeout(() => {
          setJustSealedNum(null);
        }, 420);

        playCountdownSealNote(pickedNum, soundEnabled);

        if (isFinalZero) {
          const wasFlawless = roundMistakes === 0;
          if (wasFlawless) {
            setFlawlessCount((c) => c + 1);
          }
          recordPipeCountdownRepairMastery(config.modeId, wasFlawless);
          setPhase('round-celebrate');
          setConfettiMode('match');
          setConfettiKey((k) => k + 1);
          playZeroFountainFanfare(wasFlawless, soundEnabled);
          playZeroSealedCelebrationVoice(roundIndex, wasFlawless, soundEnabled);
        } else {
          playCountdownNumberVoice(pickedNum, soundEnabled);
        }
        return;
      }

      // Wrong rod selected -> Playfulness Asymmetry + Teach-First on visible board (~2.6s), then ThinkAgainOverlay
      clearPendingTimers();
      setCurrentSlotMistakes((c) => c + 1);
      setRoundMistakes((c) => c + 1);
      setTotalMistakes((c) => c + 1);
      setWrongRodNum(pickedNum);
      setPhase('teach-mistake');
      playCountdownWrongTap(soundEnabled);

      let voiceDone = false;
      let minHoldDone = false;

      const maybeTransitionToThinkAgain = () => {
        if (voiceDone && minHoldDone) {
          setPhase('think-again');
        }
      };

      teachTimerRef.current = window.setTimeout(() => {
        minHoldDone = true;
        maybeTransitionToThinkAgain();
      }, 2550);

      teachCleanupRef.current = playWrongRodTeachVoice(
        activeLeakNum,
        pickedNum,
        soundEnabled,
        () => {
          voiceDone = true;
          maybeTransitionToThinkAgain();
        },
      );
    },
    [
      activeLeakNum,
      childProfile.id,
      clearPendingTimers,
      config.modeId,
      currentSlotMistakes,
      phase,
      roundIndex,
      roundMistakes,
      sealedNumbers,
      sealedSet,
      soundEnabled,
      trayOrder,
    ],
  );

  // Pointer drag-and-drop handlers
  const handleRodPointerDown = useCallback(
    (rodNum: number, e: React.PointerEvent<HTMLButtonElement>) => {
      if (phase !== 'playing') return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const startX = e.clientX;
      const startY = e.clientY;
      wasDraggedRef.current = false;

      const checkOverStage = (cx: number, cy: number): boolean => {
        const el = stageRef.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
          cx >= rect.left - 24 &&
          cx <= rect.right + 24 &&
          cy >= rect.top - 24 &&
          cy <= rect.bottom + 28
        );
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!wasDraggedRef.current && Math.hypot(dx, dy) >= 12) {
          wasDraggedRef.current = true;
        }
        if (wasDraggedRef.current) {
          setDragState({
            rodNum,
            x: ev.clientX,
            y: ev.clientY,
            overStage: checkOverStage(ev.clientX, ev.clientY),
          });
        }
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);

        if (wasDraggedRef.current) {
          const droppedOverStage = checkOverStage(ev.clientX, ev.clientY);
          setDragState(null);
          if (droppedOverStage) {
            evaluateRodAttempt(rodNum);
          }
          // Reset flag on next tick so synthetic click after drag is ignored
          window.setTimeout(() => {
            wasDraggedRef.current = false;
          }, 0);
        } else {
          setDragState(null);
        }
      };

      const onCancel = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        setDragState(null);
        wasDraggedRef.current = false;
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    },
    [evaluateRodAttempt, phase, stageRef],
  );

  const handleRodClick = useCallback(
    (rodNum: number) => {
      if (wasDraggedRef.current) return;
      evaluateRodAttempt(rodNum);
    },
    [evaluateRodAttempt],
  );

  const handleHearHint = useCallback(() => {
    if (activeLeakNum === null || phase !== 'playing') return;
    playCountdownHintVoice(activeLeakNum, true);
  }, [activeLeakNum, phase]);

  const handleResumeAfterThinkAgain = useCallback(() => {
    setWrongRodNum(null);
    setPhase('playing');
    if (activeLeakNum !== null) {
      playCountdownHintVoice(activeLeakNum, soundEnabled);
    }
  }, [activeLeakNum, soundEnabled]);

  const handleRestartCurrentPipe = useCallback(() => {
    clearPendingTimers();
    stopCountdownVoice();
    const freshRound = buildSingleCountdownRound(config.modeId, roundIndex);
    setDeck((prev) => prev.map((r, idx) => (idx === roundIndex ? freshRound : r)));
    setSealedNumbers([...freshRound.preSealedNumbers]);
    setTrayOrder(shuffleNumbers(freshRound.initialTrayOrder));
    setRoundMistakes(0);
    setCurrentSlotMistakes(0);
    setJustSealedNum(null);
    setWrongRodNum(null);
    setPhase('playing');
  }, [clearPendingTimers, config.modeId, roundIndex]);

  const finishWholeSession = useCallback(() => {
    clearPendingTimers();
    stopCountdownVoice();
    clearCountdownSession();
    setPhase('won');
    setConfettiMode('win');
    setConfettiKey((k) => k + 1);
    playZeroFountainFanfare(totalMistakes === 0, soundEnabled);

    if (!roundLoggedRef.current) {
      roundLoggedRef.current = true;
      const totalAttempts = Math.max(1, rodsPlacedCount + totalMistakes);
      const conceptsTested = Array.from(testedNumbersRef.current).map((n) => `number:${n}`);
      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'pipe-countdown',
        mode: `${config.modeId}-${deck.length}`,
        totalAttempts,
        correctAttempts: Math.max(1, rodsPlacedCount),
        mistakes: totalMistakes,
        flawless: totalMistakes === 0,
        durationMs: Math.max(1000, Date.now() - startedAtRef.current),
        conceptsTested,
      });
    }

    if (journeyContext) {
      journeyContext.onActivityComplete();
    }
  }, [
    childProfile.id,
    clearPendingTimers,
    config.modeId,
    deck.length,
    journeyContext,
    rodsPlacedCount,
    soundEnabled,
    totalMistakes,
  ]);

  const handleNextPipeRepair = useCallback(() => {
    clearPendingTimers();
    stopCountdownVoice();
    if (roundIndex + 1 >= deck.length) {
      finishWholeSession();
      return;
    }
    const nextIdx = roundIndex + 1;
    const nextRound = deck[nextIdx];
    setRoundIndex(nextIdx);
    setSealedNumbers([...nextRound.preSealedNumbers]);
    setTrayOrder([...nextRound.initialTrayOrder]);
    setRoundMistakes(0);
    setCurrentSlotMistakes(0);
    setJustSealedNum(null);
    setWrongRodNum(null);
    setPhase('playing');
  }, [clearPendingTimers, deck, finishWholeSession, roundIndex]);

  const handlePlayAgain = useCallback(() => {
    clearPendingTimers();
    stopCountdownVoice();
    clearCountdownSession();
    roundLoggedRef.current = false;
    testedNumbersRef.current.clear();
    startedAtRef.current = Date.now();
    const freshDeck = buildCountdownSessionDeck(config);
    const first = freshDeck[0];
    spokenIntroRoundUidRef.current = null;
    setDeck(freshDeck);
    setRoundIndex(0);
    setSealedNumbers([...first.preSealedNumbers]);
    setTrayOrder([...first.initialTrayOrder]);
    setRoundMistakes(0);
    setCurrentSlotMistakes(0);
    setTotalMistakes(0);
    setFlawlessCount(0);
    setRodsPlacedCount(0);
    setJustSealedNum(null);
    setWrongRodNum(null);
    setPhase('playing');
  }, [clearPendingTimers, config]);

  const isFountainFlowing = phase === 'round-celebrate' || phase === 'won';
  const progressPct = Math.round((sealedNumbers.length / currentRound.allNumbers.length) * 100);

  const hudHeadline = useMemo(() => {
    if (isFountainFlowing) {
      return '0 leaks left! The garden fountain is spinning!';
    }
    if (phase === 'teach-mistake' && wrongRodNum !== null && activeLeakNum !== null) {
      return `Look at the wide gap! We need ${activeLeakNum} next, before ${wrongRodNum}.`;
    }
    if (activeLeakNum === 0) {
      return 'Last step! Seal round valve cap 0 for zero leaks!';
    }
    if (config.modeId === 'missing-rods') {
      return 'Plug the widest missing countdown pipe next!';
    }
    return 'Plug the widest leaking pipe first — biggest down to 0!';
  }, [activeLeakNum, config.modeId, isFountainFlowing, phase, wrongRodNum]);

  const dragPalette = dragState ? getRodPalette(dragState.rodNum) : null;

  return (
    <div className="pcd-screen" data-testid="pipe-countdown-board">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <header className="pcd-top-bar">
        <div className="pcd-top-bar__side">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="countdown-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="countdown-setup-btn"
            >
              Setup
            </button>
          )}
        </div>

        <BrandLogo size="sm" />

        <div className="pcd-top-bar__side">
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

      {/* HUD + K1 2-Row School Notebook Countdown Strip */}
      <section
        className={`pcd-hud-panel ${
          isFountainFlowing ? 'is-celebrate' : phase === 'teach-mistake' ? 'is-teach' : ''
        }`}
        aria-live="polite"
      >
        <div className="pcd-hud-header">
          <div className="pcd-hud-player">
            <img
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
              className="pcd-hud-avatar"
            />
            <div className="pcd-hud-titles">
              <span className="pcd-hud-eyebrow">
                {currentRound.scene.title} • Pipe {roundIndex + 1} of {deck.length}
              </span>
              <span className="pcd-hud-headline" data-testid="countdown-hud-headline">
                {hudHeadline}
              </span>
            </div>
          </div>

          <div className="pcd-hud-controls">
            <button
              type="button"
              className="pcd-hint-btn"
              disabled={phase !== 'playing' || activeLeakNum === null}
              onClick={handleHearHint}
              data-testid="countdown-hint-btn"
              aria-label="Hear countdown hint"
            >
              <SpeakerIcon />
              <span>Hint</span>
            </button>

            <div
              className={`pcd-crown-pill ${roundMistakes > 0 ? 'is-dimmed' : ''}`}
              data-testid="countdown-crown-pill"
              title={
                roundMistakes === 0
                  ? 'Zero-mistake Perfect Crown active'
                  : 'Mistake made on this pipe'
              }
            >
              <CrownIcon size={16} />
              <span>{roundMistakes === 0 ? 'Perfect' : 'Keep Going'}</span>
            </div>
          </div>
        </div>

        <div
          className="pcd-notebook-strip"
          aria-label="Countdown notebook strip"
          data-testid="countdown-notebook-strip"
        >
          {notebookRows.map((row, rIdx) => (
            <div
              key={rIdx}
              className="pcd-notebook-row"
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
            >
              {row.map((num) => {
                const isSealed = sealedSet.has(num);
                const isActiveNext = !isSealed && activeLeakNum === num;
                const isJust = justSealedNum === num;
                return (
                  <div
                    key={num}
                    className={`pcd-notebook-cell ${isSealed ? 'is-sealed' : ''} ${
                      num === 0 ? 'is-zero-cell' : ''
                    } ${isActiveNext ? 'is-active-next' : ''} ${
                      isJust ? 'is-just-stamped' : ''
                    }`}
                    data-testid={`notebook-cell-${num}`}
                    data-sealed={isSealed ? 'true' : 'false'}
                  >
                    {isSealed ? num : isActiveNext ? '?' : '·'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Main Stage: Stepped Aqueduct Pipe + Garden Waterwheel Fountain */}
      <div className="pcd-stage" ref={stageRef} data-testid="countdown-aqueduct-stage">
        <div className="pcd-aqueduct-col">
          <div className="pcd-tank-header">
            <span>Water Tank ({topNum} → 0)</span>
            <span>{isFountainFlowing ? 'All Sealed!' : 'Biggest Gap Leaks First ↓'}</span>
          </div>

          <div className="pcd-pipe-stack" role="group" aria-label="Stepped water pipe slots">
            {currentRound.allNumbers.map((slotNum) => {
              const isSealed = sealedSet.has(slotNum);
              const isActiveLeak = !isSealed && activeLeakNum === slotNum;
              const isZero = slotNum === 0;
              const slotWidth = getPipeSlotWidth(slotNum);
              const palette = getRodPalette(slotNum);
              const showGhostCompare =
                isActiveLeak &&
                phase === 'teach-mistake' &&
                wrongRodNum !== null &&
                wrongRodNum < slotNum;
              const ghostWidth =
                showGhostCompare && wrongRodNum !== null
                  ? Math.max(28, Math.min(slotWidth - 10, getPipeSlotWidth(wrongRodNum)))
                  : 0;

              // Water flows cleanly down through every sealed pipe above the active leak
              const waterReachedHere =
                isSealed || isActiveLeak || isFountainFlowing;

              return (
                <div key={slotNum} className="pcd-slot-row" style={{ height: slotHeight }}>
                  <div
                    className={`pcd-pipe-spine ${waterReachedHere ? 'is-flowing' : ''}`}
                    aria-hidden="true"
                  >
                    {isZero ? '0' : '↓'}
                  </div>

                  <div
                    className={`pcd-pipe-slot ${isZero ? 'is-zero-slot' : ''} ${
                      isSealed ? 'is-sealed' : ''
                    } ${isActiveLeak ? 'is-active-leak' : ''} ${
                      isActiveLeak && dragState?.overStage ? 'is-drag-hover' : ''
                    }`}
                    style={{
                      width: slotWidth,
                      height: isZero ? zeroSlotDiameter : slotHeight,
                    }}
                    data-testid={`pipe-slot-${slotNum}`}
                    data-active-leak={isActiveLeak ? 'true' : 'false'}
                    data-sealed={isSealed ? 'true' : 'false'}
                    onClick={() => {
                      if (isActiveLeak && phase === 'playing') {
                        handleHearHint();
                      }
                    }}
                  >
                    {isSealed ? (
                      <div
                        className={`pcd-sealed-rod ${isZero ? 'is-zero-cap' : ''} ${
                          justSealedNum === slotNum ? 'is-just-sealed' : ''
                        }`}
                        style={{
                          backgroundColor: palette.fill,
                          borderColor: palette.border,
                        }}
                      >
                        {isZero ? (
                          <ZeroValveWheelGraphic size={zeroSlotDiameter - 4} />
                        ) : (
                          <div
                            className="pcd-rod-segments"
                            style={{
                              gridTemplateColumns: `repeat(${slotNum}, minmax(0, 1fr))`,
                            }}
                            aria-hidden="true"
                          >
                            {Array.from({ length: slotNum }, (_, segIdx) => (
                              <span key={segIdx} className="pcd-rod-segment" />
                            ))}
                          </div>
                        )}
                        <span className="pcd-rod-num-badge">{slotNum}</span>
                      </div>
                    ) : (
                      <>
                        {!isZero && (
                          <div
                            className="pcd-slot-notches"
                            style={{
                              gridTemplateColumns: `repeat(${slotNum}, minmax(0, 1fr))`,
                            }}
                            aria-hidden="true"
                          >
                            {Array.from({ length: slotNum }, (_, segIdx) => (
                              <span key={segIdx} className="pcd-slot-notch" />
                            ))}
                          </div>
                        )}

                        {showGhostCompare && wrongRodNum !== null && (
                          <div
                            className="pcd-ghost-compare"
                            style={{ width: ghostWidth }}
                            data-testid="countdown-ghost-compare"
                          >
                            {wrongRodNum}
                          </div>
                        )}

                        {isActiveLeak && (
                          <span
                            className={`pcd-slot-mystery-pill ${
                              phase === 'teach-mistake' ? 'is-teach-reveal' : ''
                            }`}
                          >
                            {phase === 'teach-mistake' ? slotNum : '?'}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Active widest open leak sprays gentle water droplets! */}
                  {isActiveLeak && phase !== 'teach-mistake' && (
                    <span className="pcd-leak-spray" aria-hidden="true">
                      <span className="pcd-droplet" />
                      <span className="pcd-droplet pcd-droplet--2" />
                      <span className="pcd-droplet pcd-droplet--3" />
                    </span>
                  )}

                  {isActiveLeak && phase === 'teach-mistake' && wrongRodNum !== null && (
                    <span className="pcd-teach-callout" data-testid="countdown-teach-callout">
                      Need {slotNum} next!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sunny Garden Waterwheel & Fountain Pavilion */}
        <aside
          className={`pcd-fountain-card ${isFountainFlowing ? 'is-flowing' : ''}`}
          data-testid="countdown-fountain-card"
        >
          <div>
            <h2 className="pcd-fountain-title">{currentRound.scene.fountainLabel}</h2>
            <p className="pcd-fountain-sub">
              {isFountainFlowing
                ? 'Zero leaks! Waterwheel spinning!'
                : 'Count down to 0 to power the fountain'}
            </p>
          </div>

          <GardenFountainArtwork
            flowing={isFountainFlowing}
            wheelAccent={currentRound.scene.wheelAccent}
            basinAccent={currentRound.scene.basinAccent}
          />

          {isFountainFlowing && phase === 'round-celebrate' ? (
            <button
              type="button"
              className="pcd-next-repair-btn"
              onClick={handleNextPipeRepair}
              data-testid="countdown-next-btn"
            >
              {roundIndex + 1 >= deck.length ? 'Finish & Celebrate!' : 'Next Pipe Repair →'}
            </button>
          ) : (
            <div className="pcd-pressure-meter">
              <div className="pcd-pressure-meter__label">
                <span>Fountain Pressure</span>
                <span>
                  {sealedNumbers.length} / {currentRound.allNumbers.length}
                </span>
              </div>
              <div className="pcd-pressure-meter__track">
                <div
                  className="pcd-pressure-meter__fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Shuffled Proportional Repair Rod Tray */}
      <section className="pcd-tray-panel" aria-label="Proportional repair rod tool tray">
        <div className="pcd-tray-header">
          <span className="pcd-tray-title">
            {isFountainFlowing
              ? 'Pipe Repair Complete!'
              : 'Repair Rod Tray — Drag or Tap Biggest Remaining Rod'}
          </span>
          <span className="pcd-tray-hint">
            {trayOrder.length === 0
              ? '0 leaks left!'
              : `${trayOrder.length} ${trayOrder.length === 1 ? 'cap' : 'rods'} left`}
          </span>
        </div>

        {phase === 'round-celebrate' ? (
          <div className="pcd-tray-celebrate-banner" data-testid="countdown-zero-banner">
            <div>
              <strong>Zero Leaks! Wonderful Countdown!</strong>
              <p>
                You sealed every pipe down to 0 and started the{' '}
                {currentRound.scene.fountainLabel.toLowerCase()}!
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNextPipeRepair}
              data-testid="countdown-banner-next-btn"
            >
              {roundIndex + 1 >= deck.length ? 'Celebrate!' : 'Next Pipe →'}
            </button>
          </div>
        ) : (
          <div className="pcd-tray-items" data-testid="countdown-rod-tray">
            {trayOrder.map((rodNum) => {
              const palette = getRodPalette(rodNum);
              const isZero = rodNum === 0;
              const rodWidth = getTrayRodWidth(rodNum);
              const isDraggingThis = dragState?.rodNum === rodNum;
              const isWrongNudge = phase === 'teach-mistake' && wrongRodNum === rodNum;

              return (
                <button
                  key={rodNum}
                  type="button"
                  disabled={phase !== 'playing'}
                  className={`pcd-tray-rod-btn ${isZero ? 'is-zero-cap' : ''} ${
                    isDraggingThis ? 'is-dragging' : ''
                  } ${isWrongNudge ? 'is-wrong-nudge' : ''}`}
                  style={{
                    width: rodWidth,
                    height: isZero ? trayRodHeight + 2 : trayRodHeight,
                    backgroundColor: palette.fill,
                    borderColor: palette.border,
                  }}
                  data-testid={`countdown-rod-${rodNum}`}
                  data-rod-num={rodNum}
                  aria-label={
                    isZero
                      ? 'Shut-off valve cap 0'
                      : `Repair rod ${rodNum}, ${rodNum} unit blocks wide`
                  }
                  onPointerDown={(e) => handleRodPointerDown(rodNum, e)}
                  onClick={() => handleRodClick(rodNum)}
                >
                  {isZero ? (
                    <ZeroValveWheelGraphic size={trayRodHeight - 2} />
                  ) : (
                    <span
                      className="pcd-rod-segments"
                      style={{
                        gridTemplateColumns: `repeat(${rodNum}, minmax(0, 1fr))`,
                      }}
                      aria-hidden="true"
                    >
                      {Array.from({ length: rodNum }, (_, segIdx) => (
                        <span key={segIdx} className="pcd-rod-segment" />
                      ))}
                    </span>
                  )}
                  <span className="pcd-rod-num-badge">{rodNum}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating proportional ghost while dragging */}
      {dragState && dragPalette && (
        <div
          className={`pcd-drag-ghost ${dragState.rodNum === 0 ? 'is-zero-cap' : ''}`}
          style={{
            left: dragState.x,
            top: dragState.y,
            width: getPipeSlotWidth(dragState.rodNum),
            height: dragState.rodNum === 0 ? zeroSlotDiameter : slotHeight,
            backgroundColor: dragPalette.fill,
            borderColor: dragPalette.border,
          }}
          aria-hidden="true"
        >
          {dragState.rodNum === 0 ? (
            <ZeroValveWheelGraphic size={zeroSlotDiameter - 4} />
          ) : (
            <span
              className="pcd-rod-segments"
              style={{
                gridTemplateColumns: `repeat(${dragState.rodNum}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: dragState.rodNum }, (_, segIdx) => (
                <span key={segIdx} className="pcd-rod-segment" />
              ))}
            </span>
          )}
          <span className="pcd-rod-num-badge">{dragState.rodNum}</span>
        </div>
      )}

      {/* Step 2: Delayed Calm Think Again Overlay */}
      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Take a calm look at the pipe!"
        hint={
          wrongRodNum !== null && activeLeakNum !== null
            ? `Rod ${wrongRodNum} is smaller than wide gap ${activeLeakNum}. Count down to ${activeLeakNum} next!`
            : 'Find the widest remaining repair rod for the leaking gap!'
        }
        readyLabel="Keep Trying"
        startAgainLabel="Start Again"
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleResumeAfterThinkAgain}
        onStartAgain={handleRestartCurrentPipe}
      />

      {/* Session Winner Celebration Modal */}
      {phase === 'won' && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pcd-win-title"
        >
          <div className="winner-modal" data-testid="countdown-winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={36} />
              <div className="winner-avatar-halo">
                <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
              </div>
            </div>
            <h2 id="pcd-win-title">
              {flawlessCount === deck.length
                ? `Master Plumber, ${childProfile.name}!`
                : `Great Job, ${childProfile.name}!`}
            </h2>
            <p className="winner-subtitle">
              You counted down to 0 and powered{' '}
              {deck.length === 1
                ? 'the sunny garden fountain'
                : `all ${deck.length} garden fountains`}
              !
            </p>

            <div className="pcd-win-summary-strip" aria-label="Completed countdown sequence">
              {currentRound.allNumbers.map((num) => (
                <span
                  key={num}
                  className={`pcd-win-num-pill ${num === 0 ? 'is-zero' : ''}`}
                >
                  {num}
                </span>
              ))}
            </div>

            <div className="winner-actions">
              {journeyContext ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => journeyContext.onActivityComplete()}
                  data-testid="countdown-journey-continue-btn"
                >
                  Continue Adventure →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePlayAgain}
                    data-testid="countdown-play-again-btn"
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
                      data-testid="countdown-win-hub-btn"
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

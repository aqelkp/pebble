import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import { getThemeSpec } from '../memory-match/themes';
import {
  buildRoadMismatchLesson,
  generateRescueRoadPuzzle,
  getRoadBiomeSpec,
  getRoadsCount,
  getRoadSizeSpec,
  getVehicleSpec,
  roadCellKey,
  SEGMENT_LABELS,
  traceConnectedRoadPath,
  type CardinalDir,
  type RescueRoadConfig,
  type RescueRoadPuzzle,
  type RoadCell,
  type RoadPathStep,
  type RoadSegmentType,
  type RoadTrayTile,
  type VehicleSpec,
} from './roadEngine';
import {
  playRescueHonkFanfare,
  playRoadCheckpointChime,
  playRoadMismatchSound,
  playRoadPickupSound,
  playRoadSnapSound,
} from './roadSounds';

const RESCUE_ROAD_STORAGE_KEY = 'pebble.rescueRoad.v1';
const TEACH_BEFORE_PAUSE_MS = 1900;
const DRIVE_ANIMATION_MS = 1450;
const DRIVE_WATCHDOG_MS = DRIVE_ANIMATION_MS + 650;
const FALLBACK_EMPHASIS_MS = DRIVE_ANIMATION_MS + 1050;

export function clearSavedRescueRoadGame(): void {
  try {
    window.sessionStorage.removeItem(RESCUE_ROAD_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

interface RescueRoadBoardProps {
  gameKey: number;
  config: RescueRoadConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange: (active: boolean) => void;
  onRequestHelp?: () => void;
  journeyContext?: JourneyBoardContext;
}

interface DragState {
  tile: RoadTrayTile;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoverSlotKey: string | null;
}

interface TeachFeedbackState {
  slotKey: string;
  attemptedTile: RoadTrayTile;
  title: string;
  explanation: string;
  hint: string;
  wrongDirs: CardinalDir[];
  neededDirs: CardinalDir[];
}

interface SavedRescueRoadState {
  configKey: string;
  puzzleIndex: number;
  puzzle: RescueRoadPuzzle;
  placedSlots: Record<string, RoadTrayTile>;
  tray: RoadTrayTile[];
  movesCount: number;
  mistakesCount: number;
  startedAt: number;
}

const SEGMENT_SVG_PATHS: Record<RoadSegmentType, string> = {
  NS: 'M 50 0 L 50 100',
  EW: 'M 0 50 L 100 50',
  NE: 'M 50 0 Q 50 50 100 50',
  NW: 'M 50 0 Q 50 50 0 50',
  SE: 'M 50 100 Q 50 50 100 50',
  SW: 'M 50 100 Q 50 50 0 50',
};

const DIR_EDGE_COORDS: Record<CardinalDir, { x: number; y: number }> = {
  N: { x: 50, y: 12 },
  E: { x: 88, y: 50 },
  S: { x: 50, y: 88 },
  W: { x: 12, y: 50 },
};

function RoadTileSvg({
  segment,
  isMismatch = false,
  wrongDirs = [],
  neededDirs = [],
  shoulderColor = '#D5C39D',
  tileBg = '#EAF5EF',
}: {
  segment: RoadSegmentType;
  isMismatch?: boolean;
  wrongDirs?: CardinalDir[];
  neededDirs?: CardinalDir[];
  shoulderColor?: string;
  tileBg?: string;
}) {
  const pathD = SEGMENT_SVG_PATHS[segment];
  return (
    <svg viewBox="0 0 100 100" className="rr-tile-svg" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="16"
        fill={isMismatch ? '#FDECE7' : tileBg}
      />
      <path
        d={pathD}
        fill="none"
        stroke={isMismatch ? '#F27A5E' : shoulderColor}
        strokeWidth="46"
        strokeLinecap="butt"
      />
      <path
        d={pathD}
        fill="none"
        stroke={isMismatch ? '#8A4E44' : '#4C556A'}
        strokeWidth="36"
        strokeLinecap="butt"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#FFF8EA"
        strokeWidth="4.5"
        strokeDasharray="8 8"
        strokeLinecap="round"
      />
      {wrongDirs.map((dir) => {
        const pt = DIR_EDGE_COORDS[dir];
        return (
          <g key={`wrong-${dir}`}>
            <circle cx={pt.x} cy={pt.y} r="10" fill="#D94B30" />
            <path
              d={`M ${pt.x - 4} ${pt.y - 4} L ${pt.x + 4} ${pt.y + 4} M ${pt.x + 4} ${pt.y - 4} L ${pt.x - 4} ${pt.y + 4}`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {neededDirs.map((dir) => {
        const pt = DIR_EDGE_COORDS[dir];
        return (
          <circle
            key={`need-${dir}`}
            cx={pt.x}
            cy={pt.y}
            r="9"
            fill="#5B5BD6"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
        );
      })}
    </svg>
  );
}

function SceneryTileSvg({
  variant,
  bgColor = '#E3F2EA',
}: {
  variant?: RoadCell['sceneryVariant'];
  bgColor?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className="rr-tile-svg" aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" rx="16" fill={bgColor} />
      {variant === 'pond' ? (
        <>
          <ellipse cx="52" cy="54" rx="28" ry="20" fill="#BEE5E0" />
          <ellipse cx="47" cy="50" rx="18" ry="12" fill="#8CD2C9" />
          <circle cx="24" cy="28" r="5" fill="#77C39B" />
        </>
      ) : variant === 'pebbles' ? (
        <>
          <ellipse cx="38" cy="58" rx="14" ry="10" fill="#B7DFC9" />
          <ellipse cx="58" cy="60" rx="12" ry="9" fill="#9ED1B7" />
          <ellipse cx="48" cy="44" rx="10" ry="7" fill="#C9E7D7" />
        </>
      ) : variant === 'bush' ? (
        <>
          <circle cx="38" cy="58" r="16" fill="#88CA9F" />
          <circle cx="58" cy="56" r="18" fill="#6FBA89" />
          <circle cx="48" cy="44" r="16" fill="#99D6AE" />
          <circle cx="42" cy="42" r="3" fill="#F27A5E" />
          <circle cx="62" cy="52" r="3" fill="#F2B84B" />
        </>
      ) : (
        <>
          <rect x="44" y="58" width="12" height="22" rx="4" fill="#B99067" />
          <circle cx="50" cy="44" r="24" fill="#6EB888" />
          <circle cx="42" cy="36" r="12" fill="#89CD9F" />
        </>
      )}
    </svg>
  );
}

function RescueVehicleSvg({
  vehicle,
  size = 44,
}: {
  vehicle: VehicleSpec;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="rr-vehicle-svg"
      aria-hidden="true"
    >
      {/* Toy Rescue Vehicle (facing right -> rotated in movement direction) */}
      <rect x="8" y="16" width="44" height="32" rx="11" fill={vehicle.bodyColor} />
      <rect x="33" y="20" width="15" height="24" rx="6" fill="#FFF8EB" opacity="0.92" />
      <rect x="13" y="21" width="16" height="22" rx="5" fill={vehicle.accentColor} opacity="0.88" />
      {vehicle.id === 'tow-truck' ? (
        <path
          d="M 10 32 L 23 32 M 12 27 L 20 32 L 12 37"
          stroke={vehicle.roofColor}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : vehicle.id === 'school-bus' ? (
        <>
          <rect x="15" y="24" width="6" height="16" rx="2" fill={vehicle.roofColor} />
          <rect x="24" y="24" width="6" height="16" rx="2" fill={vehicle.roofColor} />
        </>
      ) : (
        <rect x="24" y="24" width="8" height="16" rx="4" fill={vehicle.roofColor} />
      )}
      <circle cx="19" cy="14" r="5" fill="#2F374B" />
      <circle cx="41" cy="14" r="5" fill="#2F374B" />
      <circle cx="19" cy="50" r="5" fill="#2F374B" />
      <circle cx="41" cy="50" r="5" fill="#2F374B" />
      <circle cx="53" cy="24" r="2.8" fill="#F2B84B" />
      <circle cx="53" cy="40" r="2.8" fill="#F2B84B" />
    </svg>
  );
}

function directionAngleDeg(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return 90;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function RescueRoadBoard({
  gameKey,
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onGameActiveChange,
  onRequestHelp,
  journeyContext,
}: RescueRoadBoardProps) {
  const totalRoads = getRoadsCount(config.roundSize);
  const sizeSpec = getRoadSizeSpec(config.size);
  const vehicle = getVehicleSpec(config.vehicleId);
  const theme = getThemeSpec(config.themeId);

  const configKey = useMemo(
    () => `${config.size}:${config.roundSize}:${config.vehicleId}:${config.themeId}:${gameKey}`,
    [config.size, config.roundSize, config.vehicleId, config.themeId, gameKey],
  );

  const initialRestored = useMemo<SavedRescueRoadState | null>(() => {
    if (journeyContext) return null;
    try {
      const raw = window.sessionStorage.getItem(RESCUE_ROAD_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedRescueRoadState;
      if (parsed && parsed.configKey === configKey && parsed.puzzle?.cells?.length && parsed.puzzle?.biome) {
        return parsed;
      }
    } catch {
      // Ignore corrupt session state
    }
    return null;
  }, [configKey, journeyContext]);

  const [puzzleIndex, setPuzzleIndex] = useState<number>(initialRestored?.puzzleIndex ?? 0);
  const [puzzle, setPuzzle] = useState<RescueRoadPuzzle>(
    () => initialRestored?.puzzle ?? generateRescueRoadPuzzle(config.size, 0),
  );
  const biomeSpec = getRoadBiomeSpec(puzzle.biome ?? 'sunny-town');
  const finishFriend = theme.characters[puzzleIndex % theme.characters.length] ?? theme.characters[0];
  const [placedSlots, setPlacedSlots] = useState<Record<string, RoadTrayTile>>(
    () => initialRestored?.placedSlots ?? {},
  );
  const [tray, setTray] = useState<RoadTrayTile[]>(
    () => initialRestored?.tray ?? puzzle.initialTray,
  );
  const [selectedTileUid, setSelectedTileUid] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [teachFeedback, setTeachFeedback] = useState<TeachFeedbackState | null>(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'neutral' | 'success' | 'warn'; text: string }>({
    tone: 'neutral',
    text: 'Tap or drag road tiles into empty spots to join the path!',
  });

  const [drivingPhase, setDrivingPhase] = useState<'idle' | 'driving' | 'arrived'>('idle');
  const [bonusCollected, setBonusCollected] = useState(false);
  const bonusPlayedRef = useRef(false);
  const [driveCoord, setDriveCoord] = useState<{ x: number; y: number; angle: number }>({
    x: 0.5,
    y: -0.2,
    angle: 90,
  });
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [roundWon, setRoundWon] = useState(false);
  const [fallbackEmphasized, setFallbackEmphasized] = useState(false);

  const [movesCount, setMovesCount] = useState(initialRestored?.movesCount ?? 0);
  const [mistakesCount, setMistakesCount] = useState(initialRestored?.mistakesCount ?? 0);
  const startedAtRef = useRef<number>(initialRestored?.startedAt ?? Date.now());
  const loggedSessionRef = useRef(false);

  // Keep latest journeyContext in a ref so parent daily-limit re-renders don't recreate timers/callbacks
  const journeyContextRef = useRef(journeyContext);
  journeyContextRef.current = journeyContext;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const teachTimerRef = useRef<number | null>(null);
  const driveRafRef = useRef<number | null>(null);
  const driveWatchdogTimerRef = useRef<number | null>(null);
  const nextRoadTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const autoDrivenPuzzleIdRef = useRef<string | null>(null);
  const advancedPuzzleIdRef = useRef<string | null>(null);
  const completedJourneyRef = useRef(false);

  const [tileSize, setTileSize] = useState(96);

  const placedSegmentMap = useMemo<Record<string, RoadSegmentType>>(() => {
    const map: Record<string, RoadSegmentType> = {};
    for (const [key, tile] of Object.entries(placedSlots)) {
      map[key] = tile.segment;
    }
    return map;
  }, [placedSlots]);

  const connectedRoadPath = useMemo(
    () => traceConnectedRoadPath(puzzle, placedSegmentMap),
    [puzzle, placedSegmentMap],
  );

  const isRoadConnected =
    connectedRoadPath !== null || Object.keys(placedSlots).length >= puzzle.missingCount;

  const clearMotionTimers = useCallback(() => {
    if (driveRafRef.current) {
      window.cancelAnimationFrame(driveRafRef.current);
      driveRafRef.current = null;
    }
    if (driveWatchdogTimerRef.current) {
      window.clearTimeout(driveWatchdogTimerRef.current);
      driveWatchdogTimerRef.current = null;
    }
    if (nextRoadTimerRef.current) {
      window.clearTimeout(nextRoadTimerRef.current);
      nextRoadTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Measure portrait stage height/width so the entire board + tray fit with zero scroll
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(240, rect.width - 28);
      const availH = Math.max(220, rect.height - 160); // room for top garage + truck bay & bottom finish row
      const maxByWidth = Math.floor((availW - (puzzle.cols - 1) * 10) / puzzle.cols);
      const maxByHeight = Math.floor((availH - (puzzle.rows - 1) * 10) / puzzle.rows);
      const clamped = Math.max(58, Math.min(118, maxByWidth, maxByHeight));
      setTileSize(clamped);
    };

    computeSize();
    const ro = new ResizeObserver(computeSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [puzzle.cols, puzzle.rows]);

  // Keep game active flag synced
  useEffect(() => {
    onGameActiveChange(!roundWon);
  }, [onGameActiveChange, roundWon]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      clearMotionTimers();
    };
  }, [clearMotionTimers]);

  // Persist standalone progress in sessionStorage
  useEffect(() => {
    if (journeyContext || roundWon) return;
    try {
      const payload: SavedRescueRoadState = {
        configKey,
        puzzleIndex,
        puzzle,
        placedSlots,
        tray,
        movesCount,
        mistakesCount,
        startedAt: startedAtRef.current,
      };
      window.sessionStorage.setItem(RESCUE_ROAD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota issues
    }
  }, [
    configKey,
    journeyContext,
    mistakesCount,
    movesCount,
    placedSlots,
    puzzle,
    puzzleIndex,
    roundWon,
    tray,
  ]);

  // Reset vehicle position and fallback highlight when puzzle changes
  useEffect(() => {
    setDrivingPhase('idle');
    setFallbackEmphasized(false);
    setBonusCollected(false);
    bonusPlayedRef.current = false;
    setDriveCoord({
      x: puzzle.startCol + 0.5,
      y: -0.2,
      angle: 90,
    });
  }, [puzzle]);

  const startNewRound = useCallback(() => {
    if (teachTimerRef.current) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    clearMotionTimers();
    autoDrivenPuzzleIdRef.current = null;
    advancedPuzzleIdRef.current = null;
    completedJourneyRef.current = false;

    clearSavedRescueRoadGame();
    const first = generateRescueRoadPuzzle(config.size, 0);
    setPuzzleIndex(0);
    setPuzzle(first);
    setPlacedSlots({});
    setTray(first.initialTray);
    setSelectedTileUid(null);
    setDragState(null);
    setTeachFeedback(null);
    setPauseActive(false);
    setRoundWon(false);
    setFallbackEmphasized(false);
    setMovesCount(0);
    setMistakesCount(0);
    startedAtRef.current = Date.now();
    loggedSessionRef.current = false;
    setBanner({
      tone: 'neutral',
      text: 'Tap or drag road tiles into empty spots to join the path!',
    });
  }, [clearMotionTimers, config.size]);

  const triggerJourneyComplete = useCallback(() => {
    if (completedJourneyRef.current) return;
    completedJourneyRef.current = true;
    journeyContextRef.current?.onActivityComplete();
  }, []);

  const advanceToNextPuzzle = useCallback(
    (
      expectedPuzzleId: string,
      nextIdx: number,
      finalMoves: number,
      finalMistakes: number,
      immediateJourneyComplete = false,
    ) => {
      if (nextIdx >= totalRoads) {
        if (advancedPuzzleIdRef.current === expectedPuzzleId && !immediateJourneyComplete) {
          return;
        }
        advancedPuzzleIdRef.current = expectedPuzzleId;
        clearSavedRescueRoadGame();
        setRoundWon(true);
        setConfettiMode('win');
        setConfettiKey((k) => k + 1);

        if (!loggedSessionRef.current) {
          loggedSessionRef.current = true;
          const totalAttempts = Math.max(1, finalMoves);
          const correct = Math.max(0, totalAttempts - finalMistakes);
          recordLearningSession({
            playerId: childProfile.id,
            gameId: 'rescue-road',
            mode: `${config.size}-${config.roundSize}`,
            totalAttempts,
            correctAttempts: correct,
            mistakes: finalMistakes,
            flawless: finalMistakes === 0,
            durationMs: Math.max(1000, Date.now() - startedAtRef.current),
          });
        }

        if (journeyContextRef.current) {
          if (immediateJourneyComplete) {
            triggerJourneyComplete();
          } else {
            if (nextRoadTimerRef.current) window.clearTimeout(nextRoadTimerRef.current);
            nextRoadTimerRef.current = window.setTimeout(() => {
              triggerJourneyComplete();
            }, 950);
            if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = window.setTimeout(() => {
              setFallbackEmphasized(true);
            }, 1100);
          }
        }
        return;
      }

      if (advancedPuzzleIdRef.current === expectedPuzzleId) return;
      advancedPuzzleIdRef.current = expectedPuzzleId;

      const nextPuzzle = generateRescueRoadPuzzle(config.size, nextIdx);
      setPuzzleIndex(nextIdx);
      setPuzzle(nextPuzzle);
      setPlacedSlots({});
      setTray(nextPuzzle.initialTray);
      setSelectedTileUid(null);
      setFallbackEmphasized(false);
      setBanner({
        tone: 'neutral',
        text: `Road ${nextIdx + 1} of ${totalRoads}: Join the garage to the finish flag!`,
      });
    },
    [childProfile.id, config.roundSize, config.size, totalRoads, triggerJourneyComplete],
  );

  const launchTruckDrive = useCallback(
    (
      currentPuzzle: RescueRoadPuzzle,
      nextIdx: number,
      finalMoves: number,
      finalMistakes: number,
      connectedPathOverride?: RoadPathStep[] | null,
    ) => {
      clearMotionTimers();
      autoDrivenPuzzleIdRef.current = currentPuzzle.id;
      setFallbackEmphasized(false);
      setDrivingPhase('driving');
      playRescueHonkFanfare(soundEnabled);
      setBanner({
        tone: 'success',
        text: 'Beep beep! Road complete — watch the rescue truck drive!',
      });

      const drivePath = connectedPathOverride ?? currentPuzzle.path;
      const waypoints = [
        { x: currentPuzzle.startCol + 0.5, y: -0.2 },
        ...drivePath.map((s) => ({ x: s.col + 0.5, y: s.row + 0.5 })),
        { x: currentPuzzle.finishCol + 0.5, y: currentPuzzle.rows + 0.22 },
      ];

      const totalSegments = Math.max(1, waypoints.length - 1);
      const bonusStepIdx = currentPuzzle.bonusCellKey
        ? drivePath.findIndex(
            (s) => roadCellKey(s.row, s.col) === currentPuzzle.bonusCellKey,
          )
        : -1;
      const bonusProgress = bonusStepIdx >= 0 ? (bonusStepIdx + 1) / totalSegments : 2;
      // Latch startTime on the first rAF callback rather than before scheduling:
      // input handlers can see a higher performance.now() than the frame's document.timeline timestamp.
      let startTime: number | null = null;
      let arrived = false;

      const finishTruckArrival = () => {
        if (arrived) return;
        arrived = true;
        if (driveRafRef.current) {
          window.cancelAnimationFrame(driveRafRef.current);
          driveRafRef.current = null;
        }
        if (driveWatchdogTimerRef.current) {
          window.clearTimeout(driveWatchdogTimerRef.current);
          driveWatchdogTimerRef.current = null;
        }
        if (bonusStepIdx >= 0 && !bonusPlayedRef.current) {
          bonusPlayedRef.current = true;
          setBonusCollected(true);
        }

        const lastPt = waypoints[waypoints.length - 1] ?? {
          x: currentPuzzle.finishCol + 0.5,
          y: currentPuzzle.rows + 0.22,
        };
        setDriveCoord({
          x: lastPt.x,
          y: lastPt.y,
          angle: 90,
        });
        setDrivingPhase('arrived');
        setConfettiMode('match');
        setConfettiKey((k) => k + 1);

        nextRoadTimerRef.current = window.setTimeout(() => {
          advanceToNextPuzzle(currentPuzzle.id, nextIdx, finalMoves, finalMistakes, false);
        }, 700);
      };

      const stepFrame = (now: number) => {
        if (arrived) return;
        try {
          if (startTime === null) {
            startTime = now;
          }
          const elapsed = Math.max(0, now - startTime);
          const t = Math.max(0, Math.min(1, elapsed / DRIVE_ANIMATION_MS));
          const scaled = t * totalSegments;
          const segIdx = Math.max(0, Math.min(totalSegments - 1, Math.floor(scaled)));
          const localT = Math.max(0, Math.min(1, scaled - segIdx));
          const fromPt = waypoints[segIdx] ?? waypoints[0];
          const toPt = waypoints[segIdx + 1] ?? waypoints[waypoints.length - 1];

          if (!bonusPlayedRef.current && t >= bonusProgress) {
            bonusPlayedRef.current = true;
            setBonusCollected(true);
            playRoadCheckpointChime(soundEnabled);
          }

          setDriveCoord({
            x: fromPt.x + (toPt.x - fromPt.x) * localT,
            y: fromPt.y + (toPt.y - fromPt.y) * localT,
            angle: directionAngleDeg(fromPt, toPt),
          });

          if (t < 1) {
            driveRafRef.current = window.requestAnimationFrame(stepFrame);
          } else {
            finishTruckArrival();
          }
        } catch {
          finishTruckArrival();
        }
      };

      driveRafRef.current = window.requestAnimationFrame(stepFrame);
      driveWatchdogTimerRef.current = window.setTimeout(
        finishTruckArrival,
        DRIVE_WATCHDOG_MS,
      );
      fallbackTimerRef.current = window.setTimeout(() => {
        setFallbackEmphasized(true);
      }, FALLBACK_EMPHASIS_MS);
    },
    [advanceToNextPuzzle, clearMotionTimers, soundEnabled],
  );

  // Safety net: if a connected board ever sits idle (e.g. restored from sessionStorage), auto-launch drive
  useEffect(() => {
    if (
      isRoadConnected &&
      drivingPhase === 'idle' &&
      !roundWon &&
      !teachFeedback &&
      !pauseActive &&
      autoDrivenPuzzleIdRef.current !== puzzle.id
    ) {
      launchTruckDrive(puzzle, puzzleIndex + 1, movesCount, mistakesCount, connectedRoadPath);
    }
  }, [
    connectedRoadPath,
    drivingPhase,
    isRoadConnected,
    launchTruckDrive,
    mistakesCount,
    movesCount,
    pauseActive,
    puzzle,
    puzzleIndex,
    roundWon,
    teachFeedback,
  ]);

  const handleManualAdvance = useCallback(() => {
    clearMotionTimers();
    advanceToNextPuzzle(puzzle.id, puzzleIndex + 1, movesCount, mistakesCount, true);
  }, [advanceToNextPuzzle, clearMotionTimers, mistakesCount, movesCount, puzzle.id, puzzleIndex]);

  const handlePlaceTileInSlot = useCallback(
    (slotKey: string, tile: RoadTrayTile) => {
      if (teachFeedback || pauseActive || drivingPhase !== 'idle' || roundWon) return;
      if (placedSlots[slotKey]) return;
      const expectedSegment = puzzle.slotTargets[slotKey];
      if (!expectedSegment) return;

      const nextMoves = movesCount + 1;
      setMovesCount(nextMoves);
      setSelectedTileUid(null);

      const candidateSegments = { ...placedSegmentMap, [slotKey]: tile.segment };
      const candidateConnected = traceConnectedRoadPath(puzzle, candidateSegments);

      if (tile.segment === expectedSegment || candidateConnected !== null) {
        playRoadSnapSound(soundEnabled);
        const nextPlaced = { ...placedSlots, [slotKey]: tile };
        const nextTray = tray.filter((t) => t.uid !== tile.uid);
        setPlacedSlots(nextPlaced);
        setTray(nextTray);

        const placedCount = Object.keys(nextPlaced).length;
        if (candidateConnected !== null || placedCount >= puzzle.missingCount) {
          launchTruckDrive(
            puzzle,
            puzzleIndex + 1,
            nextMoves,
            mistakesCount,
            candidateConnected,
          );
        } else {
          setBanner({
            tone: 'success',
            text: `Nice fit! ${puzzle.missingCount - placedCount} more road tile${
              puzzle.missingCount - placedCount === 1 ? '' : 's'
            } to connect!`,
          });
        }
        return;
      }

      // Teach-First + Pause-Second: keep wrong tile visibly on slot showing broken edge for ~1.9s before ThinkAgainOverlay
      const nextMistakes = mistakesCount + 1;
      setMistakesCount(nextMistakes);
      playRoadMismatchSound(soundEnabled);

      const lesson = buildRoadMismatchLesson(tile.segment, expectedSegment);
      setBanner({
        tone: 'warn',
        text: lesson.explanation,
      });
      setTeachFeedback({
        slotKey,
        attemptedTile: tile,
        ...lesson,
      });

      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = window.setTimeout(() => {
        setPauseActive(true);
      }, TEACH_BEFORE_PAUSE_MS);
    },
    [
      drivingPhase,
      launchTruckDrive,
      mistakesCount,
      movesCount,
      pauseActive,
      placedSegmentMap,
      placedSlots,
      puzzle,
      puzzleIndex,
      roundWon,
      soundEnabled,
      teachFeedback,
      tray,
    ],
  );

  const handleThinkAgainReady = useCallback(() => {
    setPauseActive(false);
    setTeachFeedback(null);
    setBanner({
      tone: 'neutral',
      text: 'Try another road tile that connects cleanly!',
    });
  }, []);

  const findHoveredSlotKey = useCallback(
    (clientX: number, clientY: number): string | null => {
      for (const [key, btn] of Object.entries(slotRefs.current)) {
        if (!btn || placedSlots[key]) continue;
        const rect = btn.getBoundingClientRect();
        if (
          clientX >= rect.left - 8 &&
          clientX <= rect.right + 8 &&
          clientY >= rect.top - 8 &&
          clientY <= rect.bottom + 8
        ) {
          return key;
        }
      }
      return null;
    },
    [placedSlots],
  );

  const handleTrayPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, tile: RoadTrayTile) => {
    if (teachFeedback || pauseActive || drivingPhase !== 'idle' || roundWon) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    playRoadPickupSound(soundEnabled);
    setDragState({
      tile,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoverSlotKey: null,
    });
  };

  const handleTrayPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const movedEnough = dragState.isDragging || Math.hypot(dx, dy) > 8;
    const hoverSlotKey = movedEnough ? findHoveredSlotKey(e.clientX, e.clientY) : null;
    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: movedEnough,
      hoverSlotKey,
    });
  };

  const handleTrayPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const { isDragging, tile } = dragState;
    const dropKey = isDragging ? findHoveredSlotKey(e.clientX, e.clientY) : null;
    setDragState(null);

    if (isDragging) {
      if (dropKey) {
        handlePlaceTileInSlot(dropKey, tile);
      }
      return;
    }

    // Tap to select/deselect
    setSelectedTileUid((prev) => (prev === tile.uid ? null : tile.uid));
  };

  const handleTrayPointerCancel = () => {
    setDragState(null);
  };

  const handleSlotTap = (slotKey: string) => {
    if (teachFeedback || pauseActive || drivingPhase !== 'idle' || roundWon) return;
    if (placedSlots[slotKey]) return;
    if (!selectedTileUid) {
      setBanner({
        tone: 'neutral',
        text: 'Pick a road tile below, then tap an empty road spot!',
      });
      return;
    }
    const chosen = tray.find((t) => t.uid === selectedTileUid);
    if (chosen) {
      handlePlaceTileInSlot(slotKey, chosen);
    }
  };

  const draggedTile = dragState?.tile ?? null;
  const showFallbackControls = isRoadConnected || (roundWon && Boolean(journeyContext));
  const nextStepLabel =
    puzzleIndex + 1 < totalRoads
      ? 'Next Road →'
      : journeyContext
        ? 'Finish Activity →'
        : 'See Celebration →';
  const gridWidthPx = puzzle.cols * tileSize + (puzzle.cols - 1) * 10;
  const gridHeightPx = puzzle.rows * tileSize + (puzzle.rows - 1) * 10;
  const totalGridW = gridWidthPx;
  const truckXPct = (driveCoord.x / puzzle.cols) * 100;
  const truckYPct = (driveCoord.y / puzzle.rows) * 100;

  return (
    <div className="game-screen rr-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseActive}
        title={teachFeedback?.title ?? 'Check the Road Ends!'}
        hint={teachFeedback?.hint ?? 'Find the road tile that meets both open edges.'}
        durationSeconds={2}
        soundEnabled={soundEnabled}
        onReady={handleThinkAgainReady}
      />

      <header className="game-topbar">
        <div className="game-topbar__left">
          <button
            type="button"
            className="btn-secondary"
            onClick={journeyContext ? onBackToHub : onChangeSetup}
          >
            {journeyContext ? '← Activity Book' : '← Setup'}
          </button>
          <span className="game-topbar__title">
            {journeyContext
              ? `Activity #${journeyContext.globalActivityNumber}: Rescue Road`
              : 'Rescue Road'}
          </span>
        </div>

        <div className="game-topbar__right">
          <span className="badge-pill badge-pill--coral">
            Road {Math.min(puzzleIndex + 1, totalRoads)} of {totalRoads}
          </span>
          <span className="badge-pill badge-pill--mint">
            {Object.keys(placedSlots).length}/{puzzle.missingCount} Joined
          </span>
          <GameHelpButton onClick={onRequestHelp} />
          <button
            type="button"
            className="btn-icon-pill"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? 'Sound On' : 'Muted'}
          </button>
        </div>
      </header>

      <div
        className={`status-banner ${
          banner.tone === 'success'
            ? 'status-banner--match'
            : banner.tone === 'warn'
              ? 'status-banner--warn'
              : ''
        }`}
        role="status"
        aria-live="polite"
      >
        {banner.text}
      </div>

      <main className="rr-stage" ref={stageRef}>
        <div
          className={`rr-board-card rr-board-card--${biomeSpec.id}`}
          style={{
            width: `${Math.max(300, totalGridW + 40)}px`,
            background: biomeSpec.boardTint,
          }}
        >
          {/* Start Garage Row */}
          <div
            className="rr-endpoint-row"
            style={{
              width: `${gridWidthPx}px`,
              gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
            }}
          >
            {Array.from({ length: puzzle.cols }, (_, c) => (
              <div key={`start-${c}`} className="rr-endpoint-cell">
                {c === puzzle.startCol && (
                  <div className="rr-garage-pill">
                    <span>Garage</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Road Grid */}
          <div
            className="rr-grid-wrap"
            style={{ width: `${gridWidthPx}px`, height: `${gridHeightPx}px` }}
          >
            <div
              className="rr-grid"
              style={
                {
                  '--rr-cols': puzzle.cols,
                  '--rr-rows': puzzle.rows,
                  '--rr-tile': `${tileSize}px`,
                } as CSSProperties
              }
            >
              {puzzle.cells.flatMap((row) =>
                row.map((cell) => {
                  const key = roadCellKey(cell.row, cell.col);
                  const isBonusCell = puzzle.bonusCellKey === key;
                  if (cell.kind === 'scenery') {
                    return (
                      <div key={key} className="rr-cell rr-cell--scenery">
                        <SceneryTileSvg
                          variant={cell.sceneryVariant}
                          bgColor={biomeSpec.sceneryBg}
                        />
                      </div>
                    );
                  }
                  if (cell.kind === 'fixed' && cell.segment) {
                    return (
                      <div key={key} className="rr-cell rr-cell--fixed">
                        <RoadTileSvg
                          segment={cell.segment}
                          shoulderColor={biomeSpec.shoulderColor}
                          tileBg={biomeSpec.sceneryBg}
                        />
                        {isBonusCell && (
                          <span
                            className={`rr-checkpoint-dot ${
                              bonusCollected ? 'rr-checkpoint-dot--collected' : ''
                            }`}
                            title="Bonus Star Stop"
                            aria-label="Bonus Star Stop"
                          >
                            ★
                          </span>
                        )}
                      </div>
                    );
                  }

                  const placed = placedSlots[key];
                  const isTeachHere = teachFeedback?.slotKey === key;
                  const isDragHover = dragState?.hoverSlotKey === key;
                  const canTapPlace = !placed && Boolean(selectedTileUid) && drivingPhase === 'idle';

                  return (
                    <button
                      key={key}
                      type="button"
                      ref={(node) => {
                        slotRefs.current[key] = node;
                      }}
                      className={`rr-cell rr-cell--slot ${
                        placed ? 'rr-cell--placed' : ''
                      } ${isTeachHere ? 'rr-cell--teach-wrong' : ''} ${
                        isDragHover ? 'rr-cell--hover' : ''
                      } ${canTapPlace ? 'rr-cell--tap-ready' : ''}`}
                      onClick={() => handleSlotTap(key)}
                      aria-label={
                        placed
                          ? `Placed ${SEGMENT_LABELS[placed.segment]}`
                          : `Empty road spot row ${cell.row + 1} column ${cell.col + 1}`
                      }
                      disabled={Boolean(placed) || drivingPhase !== 'idle'}
                    >
                      {placed ? (
                        <RoadTileSvg
                          segment={placed.segment}
                          shoulderColor={biomeSpec.shoulderColor}
                          tileBg={biomeSpec.sceneryBg}
                        />
                      ) : isTeachHere && teachFeedback ? (
                        <RoadTileSvg
                          segment={teachFeedback.attemptedTile.segment}
                          isMismatch
                          wrongDirs={teachFeedback.wrongDirs}
                          neededDirs={teachFeedback.neededDirs}
                          shoulderColor={biomeSpec.shoulderColor}
                          tileBg={biomeSpec.sceneryBg}
                        />
                      ) : (
                        <div className="rr-slot-empty">
                          <span className="rr-slot-empty__dot" />
                          <span className="rr-slot-empty__text">Road?</span>
                        </div>
                      )}
                      {isBonusCell && (
                        <span
                          className={`rr-checkpoint-dot ${
                            bonusCollected ? 'rr-checkpoint-dot--collected' : ''
                          }`}
                          aria-hidden="true"
                        >
                          ★
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>

            {/* Animated Rescue Truck Overlay */}
            <div
              className={`rr-truck-overlay ${
                drivingPhase === 'driving' ? 'rr-truck-overlay--driving' : ''
              }`}
              style={{
                left: `${truckXPct}%`,
                top: `${truckYPct}%`,
                transform: `translate(-50%, -50%) rotate(${driveCoord.angle}deg)`,
              }}
              aria-hidden="true"
            >
              <RescueVehicleSvg vehicle={vehicle} size={Math.max(40, Math.round(tileSize * 0.56))} />
            </div>
          </div>

          {/* Finish Line Row */}
          <div
            className="rr-endpoint-row"
            style={{
              width: `${gridWidthPx}px`,
              gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
            }}
          >
            {Array.from({ length: puzzle.cols }, (_, c) => (
              <div key={`finish-${c}`} className="rr-endpoint-cell">
                {c === puzzle.finishCol && (
                  <div className="rr-finish-pill">
                    <img
                      src={assetUrl(finishFriend.imagePath)}
                      alt={finishFriend.label}
                      className="rr-finish-pill__friend"
                    />
                    <span>Finish</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Road Tile Tray Dock */}
      <section className="rr-tray-dock" aria-label="Road tiles tray">
        <div className="rr-tray-dock__head">
          <span className="rr-tray-dock__title">
            {showFallbackControls ? 'Road Connected!' : `Road Tiles (${sizeSpec.label})`}
          </span>
          <span className="rr-tray-dock__hint">
            {showFallbackControls
              ? roundWon
                ? 'All rescue roads complete!'
                : drivingPhase === 'driving'
                  ? `${vehicle.label} is driving to the finish flag…`
                  : 'Tap below to continue!'
              : selectedTileUid
                ? 'Now tap an empty Road spot above!'
                : 'Tap or drag a road piece into an empty spot'}
          </span>
        </div>

        {showFallbackControls ? (
          <div className="rr-connected-actions">
            {drivingPhase === 'idle' && !roundWon && (
              <button
                type="button"
                className="btn-primary rr-fallback-next-btn"
                onClick={() =>
                  launchTruckDrive(
                    puzzle,
                    puzzleIndex + 1,
                    movesCount,
                    mistakesCount,
                    connectedRoadPath,
                  )
                }
              >
                Drive {vehicle.label}!
              </button>
            )}
            <button
              type="button"
              className={`${
                fallbackEmphasized && !(drivingPhase === 'idle' && !roundWon)
                  ? 'btn-primary'
                  : 'btn-secondary'
              } rr-fallback-next-btn`}
              onClick={handleManualAdvance}
            >
              {nextStepLabel}
            </button>
          </div>
        ) : (
          <div className="rr-tray-tiles">
            {tray.map((tile) => {
              const isSelected = selectedTileUid === tile.uid;
              const isDraggingThis = dragState?.isDragging && dragState.tile.uid === tile.uid;
              return (
                <button
                  key={tile.uid}
                  type="button"
                  className={`rr-tray-btn ${isSelected ? 'rr-tray-btn--selected' : ''} ${
                    isDraggingThis ? 'rr-tray-btn--ghosted' : ''
                  }`}
                  onPointerDown={(e) => handleTrayPointerDown(e, tile)}
                  onPointerMove={handleTrayPointerMove}
                  onPointerUp={handleTrayPointerUp}
                  onPointerCancel={handleTrayPointerCancel}
                  disabled={Boolean(teachFeedback) || pauseActive || drivingPhase !== 'idle'}
                  aria-pressed={isSelected}
                  aria-label={SEGMENT_LABELS[tile.segment]}
                >
                  <RoadTileSvg segment={tile.segment} />
                  <span className="rr-tray-btn__label">{SEGMENT_LABELS[tile.segment]}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {dragState?.isDragging && draggedTile && (
        <div
          className={`rr-drag-ghost ${dragState.hoverSlotKey ? 'rr-drag-ghost--over' : ''}`}
          style={{ left: `${dragState.currentX}px`, top: `${dragState.currentY}px` }}
          aria-hidden="true"
        >
          <RoadTileSvg segment={draggedTile.segment} />
        </div>
      )}

      {roundWon && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rr-win-title"
        >
          <div className="winner-modal">
            <div className="winner-crown">
              <CrownIcon size={54} />
            </div>
            <img
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '4px auto 8px',
                border: '3px solid var(--mint-match)',
              }}
            />
            <h2 id="rr-win-title">Great Job, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              Your {vehicle.label} completed all {totalRoads} rescue roads in {movesCount}{' '}
              {movesCount === 1 ? 'tile' : 'tiles'}
              {mistakesCount === 0
                ? ' with zero wrong turns!'
                : ` (${mistakesCount} wrong turn${mistakesCount === 1 ? '' : 's'})!`}
            </p>
            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={startNewRound}
              >
                Drive More Roads
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={onChangeSetup}
              >
                Change Truck or Size
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={onBackToHub}
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

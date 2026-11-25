import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import {
  formatWordCase,
  generateWordHuntPuzzle,
  getLineCells,
  getWordHuntGridSpec,
  isValidStraightLinePair,
  isValidWordHuntCaseMode,
  isValidWordHuntGridSize,
  isValidWordHuntPackId,
  recordWordHuntGridFinished,
  WORD_HUNT_SESSION_KEY,
  type GridCoord,
  type PlacedWord,
  type WordHuntConfig,
  type WordHuntPuzzle,
} from './wordHuntData';
import {
  playCellStepTick,
  playGridCompleteFanfare,
  playWordFoundChime,
  playWordHuntWordVoice,
  playWrongTraceTap,
  preloadWordHuntAudio,
} from './wordHuntSounds';
import './WordHunt.css';

interface WordHuntBoardProps {
  gameKey?: number | string;
  config: WordHuntConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type BoardPhase = 'playing' | 'teach-mistake' | 'think-again' | 'won';

interface PersistedWordHuntSession {
  version: 1;
  gridSize: WordHuntConfig['gridSize'];
  packId: WordHuntConfig['packId'];
  caseMode: WordHuntConfig['caseMode'];
  puzzle: WordHuntPuzzle;
  foundIds: string[];
  mistakes: number;
  consecutiveMistakes: number;
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

function MiniSpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H2v6h4l5 4V5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MagnifierIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function isValidPersistedPuzzle(raw: unknown, expectedSize: number): raw is WordHuntPuzzle {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Partial<WordHuntPuzzle>;
  if (typeof p.id !== 'string' || p.size !== expectedSize) return false;
  if (!Array.isArray(p.grid) || p.grid.length !== expectedSize) return false;
  for (const row of p.grid) {
    if (!Array.isArray(row) || row.length !== expectedSize) return false;
    for (const ch of row) {
      if (typeof ch !== 'string' || ch.length !== 1) return false;
    }
  }
  if (!Array.isArray(p.words) || p.words.length === 0 || p.words.length > 10) return false;
  for (const w of p.words) {
    if (
      !w ||
      typeof w.id !== 'string' ||
      typeof w.word !== 'string' ||
      typeof w.audioId !== 'string' ||
      !Array.isArray(w.cells) ||
      w.cells.length < 2
    ) {
      return false;
    }
  }
  return true;
}

// TODO(security): Pebble runs locally as a static client-only PWA; all restored sessionStorage
// puzzle data and counters are strictly validated against allow-lists and bounds.
function tryRestoreWordHuntSession(config: WordHuntConfig): PersistedWordHuntSession | null {
  try {
    const raw = window.sessionStorage.getItem(WORD_HUNT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWordHuntSession>;
    if (parsed.version !== 1) return null;
    if (
      !isValidWordHuntGridSize(parsed.gridSize) ||
      !isValidWordHuntPackId(parsed.packId) ||
      !isValidWordHuntCaseMode(parsed.caseMode)
    ) {
      return null;
    }
    if (
      parsed.gridSize !== config.gridSize ||
      parsed.packId !== config.packId ||
      parsed.caseMode !== config.caseMode
    ) {
      return null;
    }
    const spec = getWordHuntGridSpec(config.gridSize);
    if (!isValidPersistedPuzzle(parsed.puzzle, spec.size)) return null;
    if (!Array.isArray(parsed.foundIds)) return null;
    const validWordIds = new Set(parsed.puzzle.words.map((w) => w.id));
    const foundIds = parsed.foundIds.filter(
      (id): id is string => typeof id === 'string' && validWordIds.has(id),
    );
    if (foundIds.length >= parsed.puzzle.words.length) return null;

    return {
      version: 1,
      gridSize: parsed.gridSize,
      packId: parsed.packId,
      caseMode: parsed.caseMode,
      puzzle: parsed.puzzle,
      foundIds,
      mistakes:
        typeof parsed.mistakes === 'number' && parsed.mistakes >= 0
          ? Math.min(99, Math.floor(parsed.mistakes))
          : 0,
      consecutiveMistakes:
        typeof parsed.consecutiveMistakes === 'number' && parsed.consecutiveMistakes >= 0
          ? Math.min(10, Math.floor(parsed.consecutiveMistakes))
          : 0,
    };
  } catch {
    return null;
  }
}

function saveWordHuntSession(session: PersistedWordHuntSession | null): void {
  try {
    if (!session) {
      window.sessionStorage.removeItem(WORD_HUNT_SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(WORD_HUNT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

function cellsMatchWord(cells: readonly GridCoord[], placed: PlacedWord): boolean {
  if (cells.length !== placed.cells.length) return false;
  const forward = cells.every(
    (c, idx) => c.row === placed.cells[idx].row && c.col === placed.cells[idx].col,
  );
  if (forward) return true;
  const reverse = cells.every(
    (c, idx) =>
      c.row === placed.cells[placed.cells.length - 1 - idx].row &&
      c.col === placed.cells[placed.cells.length - 1 - idx].col,
  );
  return reverse;
}

export function WordHuntBoard({
  gameKey,
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: WordHuntBoardProps) {
  const gridSpec = getWordHuntGridSpec(config.gridSize);
  const allowDiagonal = gridSpec.directions.includes('D');

  const initialRestored = useMemo(() => {
    if (journeyContext) return null;
    return tryRestoreWordHuntSession(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameKey, config.gridSize, config.packId, config.caseMode]);

  const [puzzle, setPuzzle] = useState<WordHuntPuzzle>(
    () => initialRestored?.puzzle ?? generateWordHuntPuzzle(config),
  );
  const [foundIds, setFoundIds] = useState<string[]>(() => initialRestored?.foundIds ?? []);
  const [mistakes, setMistakes] = useState<number>(() => initialRestored?.mistakes ?? 0);
  const [consecutiveMistakes, setConsecutiveMistakes] = useState<number>(
    () => initialRestored?.consecutiveMistakes ?? 0,
  );
  const [phase, setPhase] = useState<BoardPhase>('playing');

  // Interactive selection state (dual input: drag OR tap-start + tap-end)
  const [dragStart, setDragStart] = useState<GridCoord | null>(null);
  const [dragCells, setDragCells] = useState<GridCoord[]>([]);
  const [tapAnchor, setTapAnchor] = useState<GridCoord | null>(null);

  // Feedback & hint state
  const [bannerText, setBannerText] = useState<string>(
    'Swipe across a word or tap its first and last letter!',
  );
  const [bannerTone, setBannerTone] = useState<'neutral' | 'success' | 'teach'>('neutral');
  const [wrongCells, setWrongCells] = useState<GridCoord[]>([]);
  const [hintCell, setHintCell] = useState<GridCoord | null>(null);
  const [hintWordId, setHintWordId] = useState<string | null>(null);
  const [recentlyFoundId, setRecentlyFoundId] = useState<string | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Dynamic ResizeObserver for zero-scroll 768x1024 portrait fit
  const stageRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [gridPixelSize, setGridPixelSize] = useState<number>(420);

  const dragMovedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const teachTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const sessionLoggedRef = useRef<boolean>(false);

  const foundSet = useMemo(() => new Set(foundIds), [foundIds]);
  const allFound = foundIds.length >= puzzle.words.length;

  // Preload bundled word audio for this grid
  useEffect(() => {
    preloadWordHuntAudio(puzzle.words.map((w) => w.audioId));
  }, [puzzle]);

  // Report active state for PWA Back Guard
  useEffect(() => {
    onGameActiveChange?.(!allFound && phase !== 'won');
    return () => {
      onGameActiveChange?.(false);
    };
  }, [allFound, phase, onGameActiveChange]);

  // Persist sessionStorage for standalone play
  useEffect(() => {
    if (journeyContext) return;
    if (phase === 'won' || allFound) {
      saveWordHuntSession(null);
      return;
    }
    saveWordHuntSession({
      version: 1,
      gridSize: config.gridSize,
      packId: config.packId,
      caseMode: config.caseMode,
      puzzle,
      foundIds,
      mistakes,
      consecutiveMistakes,
    });
  }, [
    journeyContext,
    phase,
    allFound,
    config.gridSize,
    config.packId,
    config.caseMode,
    puzzle,
    foundIds,
    mistakes,
    consecutiveMistakes,
  ]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (teachTimerRef.current !== null) window.clearTimeout(teachTimerRef.current);
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    };
  }, []);

  // Dynamically measure available stage box so grid fits with ZERO vertical scroll
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const pad = 16;
      const availableW = Math.max(240, rect.width - pad);
      const availableH = Math.max(240, rect.height - pad);
      const maxCap = config.gridSize === '5x5' ? 460 : config.gridSize === '6x6' ? 500 : 540;
      const next = Math.floor(Math.min(availableW, availableH, maxCap));
      setGridPixelSize(next);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [config.gridSize]);

  const startFreshGrid = useCallback(() => {
    if (teachTimerRef.current !== null) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    const prevIds = puzzle.words.map((w) => w.id);
    const nextPuzzle = generateWordHuntPuzzle(config, prevIds);
    setPuzzle(nextPuzzle);
    setFoundIds([]);
    setMistakes(0);
    setConsecutiveMistakes(0);
    setPhase('playing');
    setDragStart(null);
    setDragCells([]);
    setTapAnchor(null);
    setWrongCells([]);
    setHintCell(null);
    setHintWordId(null);
    setRecentlyFoundId(null);
    setBannerText('Swipe across a word or tap its first and last letter!');
    setBannerTone('neutral');
    sessionStartedAtRef.current = Date.now();
    sessionLoggedRef.current = false;
  }, [config, puzzle.words]);

  const evaluateSelection = useCallback(
    (cells: GridCoord[]) => {
      if (phase !== 'playing' || cells.length < 2) return;

      const unfoundWords = puzzle.words.filter((w) => !foundSet.has(w.id));
      const matched = unfoundWords.find((w) => cellsMatchWord(cells, w));

      if (matched) {
        const nextFound = [...foundIds, matched.id];
        setFoundIds(nextFound);
        setConsecutiveMistakes(0);
        setTapAnchor(null);
        setHintCell(null);
        setHintWordId(null);
        setRecentlyFoundId(matched.id);

        playWordFoundChime(nextFound.length - 1, soundEnabled);
        playWordHuntWordVoice(matched.audioId, matched.word, soundEnabled);

        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'word-hunt',
          skillType: 'sight_word_reading',
          conceptId: matched.word.toLowerCase(),
          conceptLabel: matched.word,
          correct: true,
          attemptsTaken: 1,
        });

        const formatted = formatWordCase(matched.word, config.caseMode);
        if (nextFound.length >= puzzle.words.length) {
          const flawless = mistakes === 0;
          setBannerText(
            flawless
              ? `Found ${formatted}! Perfect Word Hunt!`
              : `Found ${formatted}! You found every word!`,
          );
          setBannerTone('success');
          setConfettiTrigger((c) => c + 1);
          setPhase('won');
          playGridCompleteFanfare(flawless, soundEnabled);
          recordWordHuntGridFinished(nextFound.length, flawless);

          if (!sessionLoggedRef.current) {
            sessionLoggedRef.current = true;
            recordLearningSession({
              playerId: childProfile.id,
              gameId: 'word-hunt',
              mode: `${config.gridSize}:${config.packId}`,
              totalAttempts: nextFound.length + mistakes,
              correctAttempts: nextFound.length,
              mistakes,
              flawless,
              durationMs: Math.max(500, Date.now() - sessionStartedAtRef.current),
              conceptsTested: puzzle.words.map((w) => w.word.toLowerCase()),
            });
          }
        } else {
          setBannerText(`Found ${formatted}! Great spotting!`);
          setBannerTone('success');
        }
        return;
      }

      // Check if they re-traced an already-found word (don't penalize!)
      const alreadyFound = puzzle.words.find(
        (w) => foundSet.has(w.id) && cellsMatchWord(cells, w),
      );
      if (alreadyFound) {
        setTapAnchor(null);
        const formatted = formatWordCase(alreadyFound.word, config.caseMode);
        setBannerText(`You already found ${formatted}! Look for another word in the bank.`);
        setBannerTone('neutral');
        playWordHuntWordVoice(alreadyFound.audioId, alreadyFound.word, soundEnabled);
        return;
      }

      // Wrong trace -> Teach First, Pause Second (input locked during Step 1)
      const tracedText = cells.map((c) => puzzle.grid[c.row][c.col]).join('');
      const displayTraced = formatWordCase(tracedText, config.caseMode);
      const nextMistakes = mistakes + 1;
      const nextConsecutive = consecutiveMistakes + 1;

      setMistakes(nextMistakes);
      setConsecutiveMistakes(nextConsecutive);
      setTapAnchor(null);
      setWrongCells(cells);
      setPhase('teach-mistake');
      playWrongTraceTap(soundEnabled);

      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'word-hunt',
        skillType: 'sight_word_reading',
        conceptId: unfoundWords[0]?.word.toLowerCase() ?? 'grid',
        conceptLabel: tracedText,
        correct: false,
        attemptsTaken: nextMistakes,
      });

      // Helpful in-context explanation
      const prefixTarget = unfoundWords.find(
        (w) => w.word.startsWith(tracedText) && tracedText.length < w.word.length,
      );
      if (prefixTarget) {
        const targetDisplay = formatWordCase(prefixTarget.word, config.caseMode);
        const remaining = prefixTarget.word.length - tracedText.length;
        setBannerText(
          `Close! "${displayTraced}" starts "${targetDisplay}" — go ${remaining} more ${
            remaining === 1 ? 'letter' : 'letters'
          }!`,
        );
      } else {
        setBannerText(
          `You traced "${displayTraced}" — check the Word Bank and scan for the first letter!`,
        );
      }
      setBannerTone('teach');

      if (teachTimerRef.current !== null) window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = window.setTimeout(() => {
        setWrongCells([]);
        if (nextConsecutive >= 2) {
          setPhase('think-again');
        } else {
          setPhase('playing');
          setBannerText('Swipe across a word or tap its first and last letter!');
          setBannerTone('neutral');
        }
      }, 2000);
    },
    [
      phase,
      puzzle,
      foundSet,
      foundIds,
      soundEnabled,
      childProfile.id,
      config.caseMode,
      mistakes,
      consecutiveMistakes,
    ],
  );

  const getCoordFromClientPoint = useCallback(
    (clientX: number, clientY: number): GridCoord | null => {
      const container = gridContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      const cellW = rect.width / puzzle.size;
      const cellH = rect.height / puzzle.size;
      const col = Math.min(puzzle.size - 1, Math.max(0, Math.floor((clientX - rect.left) / cellW)));
      const row = Math.min(puzzle.size - 1, Math.max(0, Math.floor((clientY - rect.top) / cellH)));
      return { row, col };
    },
    [puzzle.size],
  );

  const handleGridPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phase !== 'playing') return;
      const coord = getCoordFromClientPoint(e.clientX, e.clientY);
      if (!coord) return;

      activePointerIdRef.current = e.pointerId;
      dragMovedRef.current = false;
      setDragStart(coord);
      setDragCells([coord]);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors in synthetic events
      }
    },
    [phase, getCoordFromClientPoint],
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phase !== 'playing' || !dragStart) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      const coord = getCoordFromClientPoint(e.clientX, e.clientY);
      if (!coord) return;

      if (coord.row !== dragStart.row || coord.col !== dragStart.col) {
        dragMovedRef.current = true;
      }

      const nextLine = getLineCells(dragStart, coord, puzzle.size, allowDiagonal);
      setDragCells((prev) => {
        const changed =
          prev.length !== nextLine.length ||
          prev.some((c, i) => c.row !== nextLine[i].row || c.col !== nextLine[i].col);
        if (changed && nextLine.length > prev.length) {
          playCellStepTick(nextLine.length - 1, soundEnabled);
        }
        return changed ? nextLine : prev;
      });
    },
    [phase, dragStart, getCoordFromClientPoint, puzzle.size, allowDiagonal, soundEnabled],
  );

  const handleGridPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phase !== 'playing' || !dragStart) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      activePointerIdRef.current = null;

      const finalCells = dragCells;
      const startCoord = dragStart;
      const didDrag = dragMovedRef.current && finalCells.length >= 2;

      setDragStart(null);
      setDragCells([]);

      if (didDrag) {
        evaluateSelection(finalCells);
        return;
      }

      // Single tap behavior: Tap Start Letter -> Tap End Letter
      if (!tapAnchor) {
        setTapAnchor(startCoord);
        playCellStepTick(0, soundEnabled);
        const letter = formatWordCase(puzzle.grid[startCoord.row][startCoord.col], config.caseMode);
        setBannerText(`Starting at "${letter}" — now tap the last letter of the word!`);
        setBannerTone('neutral');
        return;
      }

      if (tapAnchor.row === startCoord.row && tapAnchor.col === startCoord.col) {
        setTapAnchor(null);
        setBannerText('Swipe across a word or tap its first and last letter!');
        setBannerTone('neutral');
        return;
      }

      if (isValidStraightLinePair(tapAnchor, startCoord, allowDiagonal)) {
        const line = getLineCells(tapAnchor, startCoord, puzzle.size, allowDiagonal);
        evaluateSelection(line);
      } else {
        // Move anchor to the newly tapped letter
        setTapAnchor(startCoord);
        playCellStepTick(0, soundEnabled);
        const letter = formatWordCase(puzzle.grid[startCoord.row][startCoord.col], config.caseMode);
        setBannerText(`Starting at "${letter}" — tap a letter in the same row or column!`);
        setBannerTone('neutral');
      }
    },
    [
      phase,
      dragStart,
      dragCells,
      tapAnchor,
      soundEnabled,
      puzzle.grid,
      puzzle.size,
      config.caseMode,
      allowDiagonal,
      evaluateSelection,
    ],
  );

  const handleWordPillClick = useCallback(
    (placed: PlacedWord) => {
      playWordHuntWordVoice(placed.audioId, placed.word, soundEnabled);
    },
    [soundEnabled],
  );

  const handleHintClick = useCallback(() => {
    if (phase !== 'playing') return;
    const nextUnfound = puzzle.words.find((w) => !foundSet.has(w.id));
    if (!nextUnfound) return;

    const firstCell = nextUnfound.cells[0];
    setHintCell(firstCell);
    setHintWordId(nextUnfound.id);
    playWordHuntWordVoice(nextUnfound.audioId, nextUnfound.word, soundEnabled);
    const displayWord = formatWordCase(nextUnfound.word, config.caseMode);
    const firstLetter = formatWordCase(nextUnfound.word[0], config.caseMode);
    setBannerText(`Clue: Look for "${displayWord}" starting at the glowing "${firstLetter}"!`);
    setBannerTone('neutral');

    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintCell(null);
      setHintWordId(null);
    }, 3200);
  }, [phase, puzzle.words, foundSet, soundEnabled, config.caseMode]);

  // Build lookup sets for active/wrong/found cell styling
  const activeKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const c of dragCells) s.add(`${c.row},${c.col}`);
    if (tapAnchor) s.add(`${tapAnchor.row},${tapAnchor.col}`);
    return s;
  }, [dragCells, tapAnchor]);

  const wrongKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const c of wrongCells) s.add(`${c.row},${c.col}`);
    return s;
  }, [wrongCells]);

  const foundWords = useMemo(
    () => puzzle.words.filter((w) => foundSet.has(w.id)),
    [puzzle.words, foundSet],
  );

  // SVG coordinate helper in viewBox [0..size*100, 0..size*100]
  const viewBoxSize = puzzle.size * 100;
  const lineCenter = (c: GridCoord) => ({
    x: c.col * 100 + 50,
    y: c.row * 100 + 50,
  });

  const cellFontPx = Math.max(
    20,
    Math.min(40, Math.round((gridPixelSize / puzzle.size) * 0.48)),
  );

  return (
    <div className="wh-board-shell" data-testid="word-hunt-board">
      <ConfettiBurst
        active={confettiTrigger > 0}
        mode={phase === 'won' ? 'win' : 'match'}
        burstKey={confettiTrigger}
      />

      {/* Compact Top Bar */}
      <header className="wh-top-bar">
        <div className="wh-top-bar__left">
          <button
            type="button"
            className="icon-pill-btn wh-back-btn"
            onClick={onBackToHub}
            data-testid="word-hunt-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Book' : 'Games'}</span>
          </button>
          <span className="wh-grid-pill">{gridSpec.label}</span>
        </div>

        <div className="wh-top-bar__center">
          <BrandLogo size="sm" />
        </div>

        <div className="wh-top-bar__right">
          <span
            className={`wh-star-badge ${mistakes > 0 ? 'is-dimmed' : ''}`}
            title={
              mistakes === 0
                ? 'Zero mistakes so far — keep going for a Perfect Crown!'
                : `${mistakes} ${mistakes === 1 ? 'slip' : 'slips'} so far`
            }
            data-testid="wh-perfect-badge"
          >
            <CrownIcon size={15} />
            <span>
              {foundIds.length}/{puzzle.words.length}
            </span>
          </span>

          <button
            type="button"
            className="icon-pill-btn wh-icon-only-btn"
            onClick={handleHintClick}
            disabled={phase !== 'playing' || allFound}
            aria-label="Show a gentle first-letter clue"
            title="Clue"
            data-testid="wh-hint-btn"
          >
            <MagnifierIcon />
          </button>

          <button
            type="button"
            className="icon-pill-btn wh-icon-only-btn"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            <SpeakerIcon muted={!soundEnabled} />
          </button>

          {onRequestHelp && <GameHelpButton onClick={onRequestHelp} />}
        </div>
      </header>

      {/* Word Bank Tray */}
      <section className="wh-word-bank" aria-label="Words to find" data-testid="wh-word-bank">
        <div className="wh-word-bank__header">
          <span className="wh-word-bank__title">Find these {puzzle.words.length} words</span>
          <span className="wh-word-bank__hint">{gridSpec.directionHint}</span>
        </div>
        <div className="wh-word-bank__pills">
          {puzzle.words.map((placed) => {
            const isFound = foundSet.has(placed.id);
            const isHinted = hintWordId === placed.id;
            const isJustFound = recentlyFoundId === placed.id;
            return (
              <button
                key={placed.id}
                type="button"
                className={`wh-word-pill ${isFound ? 'is-found' : ''} ${
                  isHinted ? 'is-hinted' : ''
                } ${isJustFound ? 'is-just-found' : ''}`}
                style={
                  isFound
                    ? {
                        borderColor: placed.color,
                        backgroundColor: `${placed.color}1F`,
                        color: '#1E2433',
                      }
                    : undefined
                }
                onClick={() => handleWordPillClick(placed)}
                data-testid={`wh-word-pill-${placed.id}`}
                aria-label={`${placed.word}, ${isFound ? 'found' : 'tap to hear word'}`}
              >
                <span className="wh-word-pill__icon" aria-hidden="true">
                  {isFound ? '✓' : <MiniSpeakerIcon />}
                </span>
                <span className="wh-word-pill__text">
                  {formatWordCase(placed.word, config.caseMode)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Fixed-Height Status / Teach-First Banner */}
      <div
        className={`wh-banner wh-banner--${bannerTone}`}
        role="status"
        aria-live="polite"
        data-testid="wh-status-banner"
      >
        <span>{bannerText}</span>
      </div>

      {/* Dynamic Center Letter Grid Stage */}
      <main className="wh-stage" ref={stageRef}>
        <div
          ref={gridContainerRef}
          className={`wh-grid-frame ${phase === 'teach-mistake' ? 'is-nudge' : ''}`}
          style={{
            width: gridPixelSize,
            height: gridPixelSize,
          }}
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={() => {
            activePointerIdRef.current = null;
            setDragStart(null);
            setDragCells([]);
          }}
          data-testid="wh-letter-grid"
        >
          {/* SVG Highlighter Ribbons Layer */}
          <svg
            className="wh-highlight-svg"
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            aria-hidden="true"
          >
            {/* Found word permanent ribbons */}
            {foundWords.map((fw) => {
              const start = lineCenter(fw.cells[0]);
              const end = lineCenter(fw.cells[fw.cells.length - 1]);
              return (
                <line
                  key={fw.id}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={fw.color}
                  strokeOpacity={0.34}
                  strokeWidth={68}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Active drag selection ribbon */}
            {dragCells.length >= 2 && (
              <line
                x1={lineCenter(dragCells[0]).x}
                y1={lineCenter(dragCells[0]).y}
                x2={lineCenter(dragCells[dragCells.length - 1]).x}
                y2={lineCenter(dragCells[dragCells.length - 1]).y}
                stroke="#5B5BD6"
                strokeOpacity={0.3}
                strokeWidth={70}
                strokeLinecap="round"
              />
            )}

            {/* Wrong-trace calm teaching ribbon */}
            {wrongCells.length >= 2 && (
              <line
                x1={lineCenter(wrongCells[0]).x}
                y1={lineCenter(wrongCells[0]).y}
                x2={lineCenter(wrongCells[wrongCells.length - 1]).x}
                y2={lineCenter(wrongCells[wrongCells.length - 1]).y}
                stroke="#B88A44"
                strokeOpacity={0.28}
                strokeWidth={68}
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* N x N Letter Tiles */}
          <div
            className="wh-grid-cells"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
              gridTemplateRows: `repeat(${puzzle.size}, 1fr)`,
            }}
          >
            {puzzle.grid.map((rowArr, r) =>
              rowArr.map((letter, c) => {
                const key = `${r},${c}`;
                const isActive = activeKeySet.has(key);
                const isWrong = wrongKeySet.has(key);
                const isAnchor = tapAnchor?.row === r && tapAnchor?.col === c;
                const isHinted = hintCell?.row === r && hintCell?.col === c;
                const displayLetter = formatWordCase(letter, config.caseMode);

                return (
                  <div
                    key={key}
                    className={`wh-cell ${isActive ? 'is-active' : ''} ${
                      isAnchor ? 'is-anchor' : ''
                    } ${isWrong ? 'is-wrong' : ''} ${isHinted ? 'is-hint' : ''}`}
                    style={{ fontSize: `${cellFontPx}px` }}
                    data-testid={`wh-cell-${r}-${c}`}
                    data-row={r}
                    data-col={c}
                    aria-label={`Row ${r + 1} Column ${c + 1} Letter ${displayLetter}`}
                  >
                    <span className="wh-cell__letter">{displayLetter}</span>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </main>

      {/* Step 2: Delayed Calm Think Again Overlay */}
      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Let's Slow Down"
        hint="Take a calm breath, tap a word in the Word Bank to hear it, and look for its first letter!"
        durationSeconds={2}
        readyLabel="Keep Trying"
        startAgainLabel="New Grid"
        soundEnabled={soundEnabled}
        onReady={() => {
          setConsecutiveMistakes(0);
          setPhase('playing');
          setBannerText('Tap a word to hear it, or tap the magnifying glass for a clue!');
          setBannerTone('neutral');
        }}
        onStartAgain={startFreshGrid}
      />

      {/* Completion Celebration Modal */}
      {phase === 'won' && (
        <div
          className="wh-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wh-win-title"
          data-testid="wh-win-modal"
        >
          <div className="wh-win-card">
            <div className="wh-win-badge">
              <CrownIcon size={34} />
            </div>
            <h2 id="wh-win-title">
              {mistakes === 0
                ? `Perfect Word Hunt, ${childProfile.name}!`
                : `Great Job, ${childProfile.name}!`}
            </h2>
            <p className="wh-win-sub">
              You spotted all {puzzle.words.length} hidden words on the {gridSpec.label}!
            </p>

            <div className="wh-win-words">
              {puzzle.words.map((w) => (
                <span
                  key={w.id}
                  className="wh-win-word-chip"
                  style={{
                    borderColor: w.color,
                    backgroundColor: `${w.color}1C`,
                  }}
                >
                  ✓ {formatWordCase(w.word, config.caseMode)}
                </span>
              ))}
            </div>

            <div className="wh-win-actions">
              {journeyContext ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={journeyContext.onActivityComplete}
                  data-testid="wh-journey-continue-btn"
                >
                  Continue Activity Book →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={startFreshGrid}
                    data-testid="wh-play-again-btn"
                  >
                    New Word Grid
                  </button>
                  <button
                    type="button"
                    className="icon-pill-btn wh-secondary-btn"
                    onClick={onChangeSetup}
                    data-testid="wh-change-setup-btn"
                  >
                    Change Pack / Size
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

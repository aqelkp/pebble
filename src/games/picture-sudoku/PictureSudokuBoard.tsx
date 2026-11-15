import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { getThemeSpec, type CharacterCardSpec } from '../memory-match/themes';
import type { PictureSudokuConfig } from './PictureSudokuSetup';
import {
  findPlacementConflict,
  generateSudokuPuzzle,
  getRowColBandCells,
  getSudokuSizeSpec,
  isBoardSolved,
  type SudokuPuzzle,
  type TrayCard,
} from './sudokuEngine';
import {
  playConflictSound,
  playPickupSound,
  playPlaceSuccessSound,
  playSolvedFanfare,
} from './sudokuSounds';

const SUDOKU_STORAGE_KEY = 'pebble.sudoku.v1';
const TRY_AGAIN_COOLDOWN_SEC = 3;

export function clearSavedSudokuGame(): void {
  try {
    window.sessionStorage.removeItem(SUDOKU_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

interface PictureSudokuBoardProps {
  gameKey: number;
  config: PictureSudokuConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onRequestHelp?: () => void;
  onGameActiveChange: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

interface PlacedCellMeta {
  uid: string;
  symbolIndex: number;
}

interface DragState {
  card: TrayCard;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoverCell: { row: number; col: number } | null;
}

interface BannerFeedback {
  tone: 'neutral' | 'success' | 'warn';
  text: string;
}

interface TryAgainPauseState {
  symbol: CharacterCardSpec;
  message: string;
  attemptedKey: string;
  secondsLeft: number;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function PictureSudokuBoard({
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
}: PictureSudokuBoardProps) {
  const theme = getThemeSpec(config.themeId);
  const sizeSpec = getSudokuSizeSpec(config.size);

  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() =>
    generateSudokuPuzzle(config.size, theme.characters),
  );
  const [placedMap, setPlacedMap] = useState<Record<string, PlacedCellMeta>>({});
  const [tray, setTray] = useState<TrayCard[]>(() => puzzle.initialTray);
  const [selectedTrayUid, setSelectedTrayUid] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [conflictKeys, setConflictKeys] = useState<Set<string>>(() => new Set());
  const [bandKeys, setBandKeys] = useState<Set<string>>(() => new Set());
  const [tryAgainPause, setTryAgainPause] = useState<TryAgainPauseState | null>(null);
  const [justPlacedKey, setJustPlacedKey] = useState<string | null>(null);
  const [movesCount, setMovesCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [banner, setBanner] = useState<BannerFeedback>({
    tone: 'neutral',
    text: `Drag a card into an empty spot—no repeats in any row or column!`,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [boardPx, setBoardPx] = useState(380);
  const placedAnimTimerRef = useRef<number | null>(null);

  // Build combined board view: givens + player placements
  const board: (number | null)[][] = puzzle.givens.map((row, r) =>
    row.map((givenVal, c) => {
      if (givenVal !== null) return givenVal;
      const placed = placedMap[cellKey(r, c)];
      return placed ? placed.symbolIndex : null;
    }),
  );

  const startNewPuzzle = useCallback(() => {
    const nextPuzzle = generateSudokuPuzzle(config.size, theme.characters);
    setPuzzle(nextPuzzle);
    setPlacedMap({});
    setTray(nextPuzzle.initialTray);
    setSelectedTrayUid(null);
    setDragState(null);
    setConflictKeys(new Set());
    setBandKeys(new Set());
    setTryAgainPause(null);
    setJustPlacedKey(null);
    setMovesCount(0);
    setMistakesCount(0);
    setHintsUsed(0);
    setSolved(false);
    setBanner({
      tone: 'neutral',
      text: `Drag a card into an empty spot—no repeats in any row or column!`,
    });
    onGameActiveChange(true);
  }, [config.size, onGameActiveChange, theme.characters]);

  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;
  const journeyCompletedFiredRef = useRef(false);
  const isJourneyMode = Boolean(journeyContext);

  useEffect(() => {
    onGameActiveChange(!solved);
  }, [onGameActiveChange, solved]);

  useEffect(() => {
    if (!isJourneyMode || !solved || journeyCompletedFiredRef.current) return;
    const timer = window.setTimeout(() => {
      if (journeyCompletedFiredRef.current) return;
      journeyCompletedFiredRef.current = true;
      journeyOnCompleteRef.current?.();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isJourneyMode, solved]);

  useEffect(() => {
    return () => {
      onGameActiveChange(false);
      if (placedAnimTimerRef.current) window.clearTimeout(placedAnimTimerRef.current);
    };
  }, [onGameActiveChange]);

  useEffect(() => {
    void gameKey;
  }, [gameKey]);

  // Countdown timer for the "Oh no, try again!" pause overlay
  useEffect(() => {
    if (!tryAgainPause || tryAgainPause.secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setTryAgainPause((prev) =>
        prev ? { ...prev, secondsLeft: Math.max(0, prev.secondsLeft - 1) } : null,
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [tryAgainPause]);

  // Measure stage with ResizeObserver so the grid fits inside 100dvh with zero scroll
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const maxSquare = Math.floor(Math.min(rect.width - 16, rect.height - 12, 520));
      setBoardPx(Math.max(220, maxSquare));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dismissTryAgain = useCallback(() => {
    if (tryAgainPause && tryAgainPause.secondsLeft > 0) return;
    setTryAgainPause(null);
    setConflictKeys(new Set());
    setBandKeys(new Set());
    setBanner({
      tone: 'neutral',
      text: `Look closely at each row and column—pick the right spot!`,
    });
  }, [tryAgainPause]);

  const triggerWrongFeedback = useCallback(
    (
      symbol: CharacterCardSpec,
      attemptedRow: number,
      attemptedCol: number,
      focusCells: Array<{ row: number; col: number }>,
      highlightBand: Array<{ row: number; col: number }>,
      message: string,
    ) => {
      playConflictSound(soundEnabled);
      setMistakesCount((m) => m + 1);
      recordSkillAttempt({
        playerId: childProfile.id,
        gameId: 'picture-sudoku',
        conceptId: `sudoku:${puzzle.size}x${puzzle.size}`,
        conceptLabel: `${puzzle.size}×${puzzle.size} Grid`,
        skillType: 'grid_deduction',
        correct: false,
      });
      setSelectedTrayUid(null);
      setConflictKeys(new Set(focusCells.map((cell) => cellKey(cell.row, cell.col))));
      setBandKeys(new Set(highlightBand.map((cell) => cellKey(cell.row, cell.col))));
      setBanner({ tone: 'warn', text: `Oh no, try again! ${message}` });
      setTryAgainPause({
        symbol,
        message,
        attemptedKey: cellKey(attemptedRow, attemptedCol),
        secondsLeft: TRY_AGAIN_COOLDOWN_SEC,
      });
    },
    [childProfile.id, soundEnabled],
  );

  const attemptPlaceCard = useCallback(
    (card: TrayCard, row: number, col: number) => {
      if (solved || tryAgainPause) return;
      if (puzzle.givens[row][col] !== null) return;
      if (placedMap[cellKey(row, col)]) return;

      const symbol = puzzle.symbols[card.symbolIndex];
      const conflict = findPlacementConflict(
        board,
        row,
        col,
        card.symbolIndex,
        puzzle.size,
        puzzle.symbols,
      );

      if (conflict) {
        triggerWrongFeedback(
          symbol,
          row,
          col,
          conflict.conflictCells,
          conflict.bandCells,
          conflict.message,
        );
        return;
      }

      // Check against the unique solution so two blanks in one row cannot be brute-forced
      if (puzzle.solution[row][col] !== card.symbolIndex) {
        triggerWrongFeedback(
          symbol,
          row,
          col,
          [{ row, col }],
          getRowColBandCells(row, col, puzzle.size),
          `${symbol.label} belongs in a different spot—check the other rows and columns!`,
        );
        return;
      }

      const key = cellKey(row, col);
      const nextPlacedMap: Record<string, PlacedCellMeta> = {
        ...placedMap,
        [key]: { uid: card.uid, symbolIndex: card.symbolIndex },
      };
      const nextTray = tray.filter((item) => item.uid !== card.uid);
      const nextBoard = board.map((rVals, rIdx) =>
        rVals.map((val, cIdx) => (rIdx === row && cIdx === col ? card.symbolIndex : val)),
      );

      setPlacedMap(nextPlacedMap);
      setTray(nextTray);
      setSelectedTrayUid(null);
      setMovesCount((m) => m + 1);
      setConflictKeys(new Set());
      setBandKeys(new Set());

      if (placedAnimTimerRef.current) window.clearTimeout(placedAnimTimerRef.current);
      setJustPlacedKey(key);
      placedAnimTimerRef.current = window.setTimeout(() => {
        setJustPlacedKey(null);
      }, 450);

      if (isBoardSolved(nextBoard, puzzle.size)) {
        setSolved(true);
        setConfettiSeed((s) => s + 1);
        playSolvedFanfare(soundEnabled);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'picture-sudoku',
          conceptId: `sudoku:${puzzle.size}x${puzzle.size}`,
          conceptLabel: `${puzzle.size}×${puzzle.size} Grid`,
          skillType: 'grid_deduction',
          correct: mistakesCount === 0,
          attemptsTaken: movesCount + 1 + mistakesCount,
        });
        recordLearningSession({
          playerId: childProfile.id,
          gameId: 'picture-sudoku',
          mode: `${puzzle.size}x${puzzle.size}`,
          totalAttempts: movesCount + 1 + mistakesCount,
          correctAttempts: movesCount + 1,
          mistakes: mistakesCount,
          flawless: mistakesCount === 0,
          conceptsTested: [`sudoku:${puzzle.size}x${puzzle.size}`],
        });
        setBanner({
          tone: 'success',
          text: `Puzzle solved! Every row and column is complete!`,
        });
        onGameActiveChange(false);
      } else {
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'picture-sudoku',
          conceptId: `sudoku:${puzzle.size}x${puzzle.size}`,
          conceptLabel: `${puzzle.size}×${puzzle.size} Grid`,
          skillType: 'grid_deduction',
          correct: true,
        });
        playPlaceSuccessSound(soundEnabled);
        const remaining = nextTray.length;
        setBanner({
          tone: 'success',
          text:
            remaining === 1
              ? 'Great spot! Only 1 card left!'
              : `Great spot! ${remaining} cards left.`,
        });
      }
    },
    [
      board,
      childProfile.id,
      mistakesCount,
      movesCount,
      onGameActiveChange,
      placedMap,
      puzzle.givens,
      puzzle.size,
      puzzle.solution,
      puzzle.symbols,
      solved,
      soundEnabled,
      tray,
      triggerWrongFeedback,
      tryAgainPause,
    ],
  );

  const handleHint = useCallback(() => {
    if (solved || tryAgainPause || tray.length === 0) return;

    for (let r = 0; r < puzzle.size; r += 1) {
      for (let c = 0; c < puzzle.size; c += 1) {
        if (board[r][c] === null) {
          const targetSymbol = puzzle.solution[r][c];
          const matchingCard = tray.find((t) => t.symbolIndex === targetSymbol);
          if (matchingCard) {
            setHintsUsed((h) => h + 1);
            attemptPlaceCard(matchingCard, r, c);
            return;
          }
        }
      }
    }
  }, [attemptPlaceCard, board, puzzle.size, puzzle.solution, solved, tray, tryAgainPause]);

  const hitTestCell = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const elements = document.elementsFromPoint(clientX, clientY);
      for (const el of elements) {
        const cellAttr = (el as HTMLElement).dataset?.sudokuCell;
        if (cellAttr) {
          const [rStr, cStr] = cellAttr.split('-');
          const row = Number(rStr);
          const col = Number(cStr);
          if (
            Number.isInteger(row) &&
            Number.isInteger(col) &&
            puzzle.givens[row]?.[col] === null &&
            !placedMap[cellKey(row, col)]
          ) {
            return { row, col };
          }
        }
      }
      return null;
    },
    [placedMap, puzzle.givens],
  );

  const handleTrayPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, card: TrayCard) => {
    if (solved || tryAgainPause) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    playPickupSound(soundEnabled);

    setDragState({
      card,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoverCell: null,
    });
  };

  const handleTrayPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const movedEnough = dragState.isDragging || Math.hypot(dx, dy) > 8;
    const hoverCell = movedEnough ? hitTestCell(e.clientX, e.clientY) : null;

    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: movedEnough,
      hoverCell,
    });
  };

  const handleTrayPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const active = dragState;
    setDragState(null);

    if (active.isDragging) {
      const target = active.hoverCell ?? hitTestCell(e.clientX, e.clientY);
      if (target) {
        attemptPlaceCard(active.card, target.row, target.col);
      }
    } else {
      setSelectedTrayUid((prev) => (prev === active.card.uid ? null : active.card.uid));
    }
  };

  const handleTrayPointerCancel = () => {
    setDragState(null);
  };

  const handleCellClick = (row: number, col: number) => {
    if (solved || tryAgainPause) return;
    if (puzzle.givens[row][col] !== null) return;
    if (placedMap[cellKey(row, col)]) return;

    if (selectedTrayUid) {
      const card = tray.find((item) => item.uid === selectedTrayUid);
      if (card) {
        attemptPlaceCard(card, row, col);
      }
    } else {
      setBanner({
        tone: 'neutral',
        text: 'Pick or drag a card from the tray below into this empty spot!',
      });
    }
  };

  const draggedSymbol = dragState ? puzzle.symbols[dragState.card.symbolIndex] : null;

  return (
    <div className="app-shell app-shell--board ps-shell">
      <ConfettiBurst active={solved} mode="win" burstKey={confettiSeed} />

      <header className="top-bar ps-top-bar">
        <div className="top-bar__left">
          <button type="button" className="icon-pill-btn" onClick={onBackToHub}>
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          {journeyContext ? (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          ) : (
            <button type="button" className="icon-pill-btn" onClick={onChangeSetup}>
              <span>Setup</span>
            </button>
          )}
        </div>

        <div className="ps-player-pill">
          <img src={getAvatarSrc(childProfile.avatar)} alt="" />
          <span>{childProfile.name}</span>
          <span className="ps-player-pill__meta">
            {sizeSpec.label} • {theme.title}
          </span>
        </div>

        <div className="top-bar__right">
          <GameHelpButton onClick={onRequestHelp} />
          <button
            type="button"
            className="icon-pill-btn"
            onClick={handleHint}
            disabled={solved || Boolean(tryAgainPause) || tray.length === 0}
            aria-label="Get a hint"
          >
            <span>Hint</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn"
            onClick={startNewPuzzle}
            aria-label="New Puzzle"
          >
            <span>New</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
          </button>
        </div>
      </header>

      <div className={`ps-banner ps-banner--${banner.tone}`} role="status" aria-live="polite">
        <span>{banner.text}</span>
        <div className="ps-banner__pills">
          <span
            className={`ps-mistake-pill ${
              mistakesCount === 0 ? 'ps-mistake-pill--clean' : 'ps-mistake-pill--warn'
            }`}
          >
            {mistakesCount === 0 ? 'No Mistakes' : `Mistakes: ${mistakesCount}`}
          </span>
          <span className="ps-banner__counter">
            {tray.length === 0 ? 'Complete!' : `${tray.length} left`}
          </span>
        </div>
      </div>

      <main className="ps-stage" ref={stageRef}>
        <div
          className={`ps-grid ps-grid--${puzzle.size}`}
          style={{
            width: `${boardPx}px`,
            height: `${boardPx}px`,
            gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label={`${puzzle.size} by ${puzzle.size} Picture Sudoku board`}
        >
          {board.map((rowVals, r) =>
            rowVals.map((val, c) => {
              const key = cellKey(r, c);
              const isGiven = puzzle.givens[r][c] !== null;
              const isPlaced = !isGiven && placedMap[key] !== undefined;
              const isHovered =
                dragState?.isDragging &&
                dragState.hoverCell?.row === r &&
                dragState.hoverCell?.col === c;
              const isConflictFocus = conflictKeys.has(key);
              const isConflictBand = bandKeys.has(key);
              const isAttemptedCell = tryAgainPause?.attemptedKey === key;
              const isJustPlaced = justPlacedKey === key;
              const symbol = val !== null ? puzzle.symbols[val] : null;

              const boxClasses =
                puzzle.size === 4
                  ? `${c === 1 ? 'ps-cell--box-right' : ''} ${r === 1 ? 'ps-cell--box-bottom' : ''}`
                  : '';

              return (
                <button
                  key={key}
                  type="button"
                  data-sudoku-cell={key}
                  onClick={() => handleCellClick(r, c)}
                  className={`ps-cell ${
                    isGiven
                      ? 'ps-cell--given'
                      : isPlaced
                        ? 'ps-cell--placed'
                        : 'ps-cell--empty'
                  } ${isHovered ? 'ps-cell--drop-hover' : ''} ${
                    isConflictBand ? 'ps-cell--conflict-band' : ''
                  } ${isConflictFocus ? 'ps-cell--conflict-focus' : ''} ${
                    isJustPlaced ? 'ps-cell--just-placed' : ''
                  } ${boxClasses}`}
                  aria-label={
                    symbol
                      ? `Row ${r + 1} Column ${c + 1}: ${symbol.label}${
                          isGiven ? ' (fixed clue)' : ' (placed)'
                        }`
                      : `Row ${r + 1} Column ${c + 1}: empty`
                  }
                >
                  {symbol ? (
                    <img
                      src={assetUrl(symbol.imagePath)}
                      alt={symbol.label}
                      className="ps-cell__img"
                      draggable={false}
                    />
                  ) : isAttemptedCell && tryAgainPause ? (
                    <img
                      src={assetUrl(tryAgainPause.symbol.imagePath)}
                      alt={tryAgainPause.symbol.label}
                      className="ps-cell__img ps-cell__img--wrong-preview"
                      draggable={false}
                    />
                  ) : (
                    <span className="ps-cell__placeholder" aria-hidden="true">
                      ?
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </main>

      <section
        className={`ps-tray-dock ${tryAgainPause ? 'ps-tray-dock--paused' : ''}`}
        aria-label={tryAgainPause ? 'Try again pause' : 'Missing picture cards'}
      >
        {tryAgainPause ? (
          <div className="ps-try-again-panel" role="alert">
            <img
              src={assetUrl(tryAgainPause.symbol.imagePath)}
              alt={tryAgainPause.symbol.label}
              className="ps-try-again-panel__img"
            />
            <div className="ps-try-again-panel__body">
              <div className="ps-try-again-panel__title">Oh no, try again!</div>
              <div className="ps-try-again-panel__msg">{tryAgainPause.message}</div>
            </div>
            <button
              type="button"
              className="btn-primary ps-try-again-panel__btn"
              disabled={tryAgainPause.secondsLeft > 0}
              onClick={dismissTryAgain}
            >
              {tryAgainPause.secondsLeft > 0
                ? `Look (${tryAgainPause.secondsLeft}s)`
                : 'Try Again'}
            </button>
          </div>
        ) : (
          <>
            <div className="ps-tray-dock__head">
              <span className="ps-tray-dock__title">Missing Cards ({tray.length})</span>
              <span className="ps-tray-dock__hint">
                Drag onto the grid, or tap a card then tap a spot
              </span>
            </div>

            <div className="ps-tray-cards">
              {tray.length === 0 ? (
                <div className="ps-tray-empty">All cards placed!</div>
              ) : (
                tray.map((card) => {
                  const symbol = puzzle.symbols[card.symbolIndex];
                  const isDraggingThis = dragState?.isDragging && dragState.card.uid === card.uid;
                  const isSelected = selectedTrayUid === card.uid;

                  return (
                    <button
                      key={card.uid}
                      type="button"
                      className={`ps-tray-card ${isSelected ? 'ps-tray-card--selected' : ''} ${
                        isDraggingThis ? 'ps-tray-card--ghosted' : ''
                      }`}
                      onPointerDown={(e) => handleTrayPointerDown(e, card)}
                      onPointerMove={handleTrayPointerMove}
                      onPointerUp={handleTrayPointerUp}
                      onPointerCancel={handleTrayPointerCancel}
                      aria-label={`Drag or select ${symbol.label}`}
                    >
                      <img
                        src={assetUrl(symbol.imagePath)}
                        alt={symbol.label}
                        draggable={false}
                      />
                      <span className="ps-tray-card__label">{symbol.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>

      {dragState?.isDragging && draggedSymbol && (
        <div
          className={`ps-drag-ghost ${dragState.hoverCell ? 'ps-drag-ghost--over' : ''}`}
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
          }}
          aria-hidden="true"
        >
          <img src={assetUrl(draggedSymbol.imagePath)} alt="" />
        </div>
      )}

      {solved && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sudoku-win-title"
        >
          <div className="winner-modal">
            <div className="winner-crown">
              <CrownIcon size={54} />
            </div>
            <img
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
              className="winner-avatar"
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '4px auto 8px',
                border: '3px solid var(--mint-500)',
              }}
            />
            <h2 id="sudoku-win-title">Great Job, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You solved the {sizeSpec.label} {theme.title} Picture Sudoku in {movesCount}{' '}
              {movesCount === 1 ? 'move' : 'moves'}
              {mistakesCount === 0
                ? ' with zero mistakes!'
                : ` (${mistakesCount} mistake${mistakesCount === 1 ? '' : 's'})!`}
              {hintsUsed > 0 ? ` • ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}` : ''}
            </p>
            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={startNewPuzzle}
              >
                Play Another Puzzle
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={onChangeSetup}
              >
                Change Size or Theme
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

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import { getThemeSpec } from '../memory-match/themes';
import type { PictureSudokuConfig } from './PictureSudokuSetup';
import {
  findPlacementConflict,
  generateSudokuPuzzle,
  getSudokuSizeSpec,
  isBoardSolved,
  type SudokuPuzzle,
  type TrayCard,
} from './sudokuEngine';
import {
  playConflictSound,
  playPickupSound,
  playPlaceSuccessSound,
  playReturnSound,
  playSolvedFanfare,
} from './sudokuSounds';

const SUDOKU_STORAGE_KEY = 'pebble.sudoku.v1';

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
  onGameActiveChange: (active: boolean) => void;
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
  onGameActiveChange,
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
  const [justPlacedKey, setJustPlacedKey] = useState<string | null>(null);
  const [movesCount, setMovesCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [banner, setBanner] = useState<BannerFeedback>({
    tone: 'neutral',
    text: `Drag a card into an empty spot—no repeats in any row or column!`,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [boardPx, setBoardPx] = useState(380);
  const conflictTimerRef = useRef<number | null>(null);
  const placedAnimTimerRef = useRef<number | null>(null);

  // Build combined board view: givens + player placements
  const board: (number | null)[][] = puzzle.givens.map((row, r) =>
    row.map((givenVal, c) => {
      if (givenVal !== null) return givenVal;
      const placed = placedMap[cellKey(r, c)];
      return placed ? placed.symbolIndex : null;
    }),
  );

  // Reset puzzle when gameKey or config changes
  const startNewPuzzle = useCallback(() => {
    const nextPuzzle = generateSudokuPuzzle(config.size, theme.characters);
    setPuzzle(nextPuzzle);
    setPlacedMap({});
    setTray(nextPuzzle.initialTray);
    setSelectedTrayUid(null);
    setDragState(null);
    setConflictKeys(new Set());
    setJustPlacedKey(null);
    setMovesCount(0);
    setHintsUsed(0);
    setSolved(false);
    setBanner({
      tone: 'neutral',
      text: `Drag a card into an empty spot—no repeats in any row or column!`,
    });
    onGameActiveChange(true);
  }, [config.size, onGameActiveChange, theme.characters]);

  useEffect(() => {
    onGameActiveChange(!solved);
  }, [onGameActiveChange, solved]);

  useEffect(() => {
    return () => {
      onGameActiveChange(false);
      if (conflictTimerRef.current) window.clearTimeout(conflictTimerRef.current);
      if (placedAnimTimerRef.current) window.clearTimeout(placedAnimTimerRef.current);
    };
  }, [onGameActiveChange]);

  // Keep gameKey dependency explicit for fresh mounts
  useEffect(() => {
    void gameKey;
  }, [gameKey]);

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

  const flashConflicts = useCallback((cells: Array<{ row: number; col: number }>) => {
    if (conflictTimerRef.current) window.clearTimeout(conflictTimerRef.current);
    setConflictKeys(new Set(cells.map((cell) => cellKey(cell.row, cell.col))));
    conflictTimerRef.current = window.setTimeout(() => {
      setConflictKeys(new Set());
    }, 1150);
  }, []);

  const attemptPlaceCard = useCallback(
    (card: TrayCard, row: number, col: number) => {
      if (solved) return;
      if (puzzle.givens[row][col] !== null) return;
      if (placedMap[cellKey(row, col)]) return;

      const conflict = findPlacementConflict(
        board,
        row,
        col,
        card.symbolIndex,
        puzzle.size,
        puzzle.symbols,
      );

      if (conflict) {
        playConflictSound(soundEnabled);
        flashConflicts(conflict.conflictCells);
        setBanner({ tone: 'warn', text: conflict.message });
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

      if (placedAnimTimerRef.current) window.clearTimeout(placedAnimTimerRef.current);
      setJustPlacedKey(key);
      placedAnimTimerRef.current = window.setTimeout(() => {
        setJustPlacedKey(null);
      }, 450);

      if (isBoardSolved(nextBoard, puzzle.size)) {
        setSolved(true);
        setConfettiSeed((s) => s + 1);
        playSolvedFanfare(soundEnabled);
        setBanner({
          tone: 'success',
          text: `Puzzle solved! Every row and column is complete!`,
        });
        onGameActiveChange(false);
      } else {
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
      flashConflicts,
      onGameActiveChange,
      placedMap,
      puzzle.givens,
      puzzle.size,
      puzzle.symbols,
      solved,
      soundEnabled,
      tray,
    ],
  );

  const handleReturnPlacedCell = useCallback(
    (row: number, col: number) => {
      if (solved) return;
      const key = cellKey(row, col);
      const placed = placedMap[key];
      if (!placed) return;

      playReturnSound(soundEnabled);
      const nextPlaced = { ...placedMap };
      delete nextPlaced[key];
      setPlacedMap(nextPlaced);
      setTray((prev) => [...prev, { uid: placed.uid, symbolIndex: placed.symbolIndex }]);
      setBanner({
        tone: 'neutral',
        text: 'Card returned to tray. Pick another spot!',
      });
    },
    [placedMap, solved, soundEnabled],
  );

  const handleHint = useCallback(() => {
    if (solved || tray.length === 0) return;

    // Find an empty cell whose solution symbol is still in the tray
    for (let r = 0; r < puzzle.size; r += 1) {
      for (let c = 0; c < puzzle.size; c += 1) {
        if (board[r][c] === null) {
          const targetSymbol = puzzle.solution[r][c];
          const matchingCard = tray.find((t) => t.symbolIndex === targetSymbol);
          if (matchingCard) {
            // Only place if it doesn't conflict with a misplaced user card
            const conflict = findPlacementConflict(
              board,
              r,
              c,
              targetSymbol,
              puzzle.size,
              puzzle.symbols,
            );
            if (!conflict) {
              setHintsUsed((h) => h + 1);
              attemptPlaceCard(matchingCard, r, c);
              return;
            }
          }
        }
      }
    }

    // If a user-placed card blocks the hint, return one misplaced card to tray
    for (const [key, placed] of Object.entries(placedMap)) {
      const [rStr, cStr] = key.split('-');
      const r = Number(rStr);
      const c = Number(cStr);
      if (puzzle.solution[r][c] !== placed.symbolIndex) {
        handleReturnPlacedCell(r, c);
        setHintsUsed((h) => h + 1);
        setBanner({
          tone: 'neutral',
          text: 'Hint: Moved a tricky card back to the tray so you can try again!',
        });
        return;
      }
    }
  }, [
    attemptPlaceCard,
    board,
    handleReturnPlacedCell,
    placedMap,
    puzzle.size,
    puzzle.solution,
    puzzle.symbols,
    solved,
    tray,
  ]);

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
    if (solved) return;
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
      // Tap to select/deselect for tap-to-place mode
      setSelectedTrayUid((prev) => (prev === active.card.uid ? null : active.card.uid));
    }
  };

  const handleTrayPointerCancel = () => {
    setDragState(null);
  };

  const handleCellClick = (row: number, col: number) => {
    if (solved) return;
    if (puzzle.givens[row][col] !== null) return;

    const key = cellKey(row, col);
    if (placedMap[key]) {
      handleReturnPlacedCell(row, col);
      return;
    }

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
            <span>Games</span>
          </button>
          <button type="button" className="icon-pill-btn" onClick={onChangeSetup}>
            <span>Setup</span>
          </button>
        </div>

        <div className="ps-player-pill">
          <img src={getAvatarSrc(childProfile.avatar)} alt="" />
          <span>{childProfile.name}</span>
          <span className="ps-player-pill__meta">
            {sizeSpec.label} • {theme.title}
          </span>
        </div>

        <div className="top-bar__right">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={handleHint}
            disabled={solved || tray.length === 0}
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
        <span className="ps-banner__counter">
          {tray.length === 0 ? 'Complete!' : `${tray.length} left`}
        </span>
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
              const isConflict = conflictKeys.has(key);
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
                    isConflict ? 'ps-cell--conflict' : ''
                  } ${isJustPlaced ? 'ps-cell--just-placed' : ''} ${boxClasses}`}
                  aria-label={
                    symbol
                      ? `Row ${r + 1} Column ${c + 1}: ${symbol.label}${
                          isGiven ? ' (fixed clue)' : ' (tap to remove)'
                        }`
                      : `Row ${r + 1} Column ${c + 1}: empty`
                  }
                >
                  {symbol ? (
                    <>
                      <img
                        src={assetUrl(symbol.imagePath)}
                        alt={symbol.label}
                        className="ps-cell__img"
                        draggable={false}
                      />
                      {isPlaced && !solved && (
                        <span className="ps-cell__remove-hint" aria-hidden="true">
                          ×
                        </span>
                      )}
                    </>
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

      <section className="ps-tray-dock" aria-label="Missing picture cards">
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

      {solved && (
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
              {hintsUsed > 0 ? ` (${hintsUsed} hint${hintsUsed === 1 ? '' : 's'})` : ''}!
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

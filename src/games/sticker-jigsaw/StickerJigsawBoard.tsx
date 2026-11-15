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
  generateJigsawPuzzle,
  getJigsawSizeSpec,
  getPuzzlesCount,
  jigsawSlotKey,
  pickRoundCharacters,
  type JigsawPieceSpec,
  type StickerJigsawConfig,
  type StickerJigsawPuzzle,
} from './jigsawEngine';
import {
  playJigsawMismatchSound,
  playJigsawPickupSound,
  playJigsawSnapSound,
  playJigsawSolvedSound,
} from './jigsawSounds';

const STICKER_JIGSAW_STORAGE_KEY = 'pebble.stickerJigsaw.v1';
const TEACH_BEFORE_PAUSE_MS = 1900;

export function clearSavedStickerJigsawGame(): void {
  try {
    window.sessionStorage.removeItem(STICKER_JIGSAW_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

interface StickerJigsawBoardProps {
  gameKey: number;
  config: StickerJigsawConfig;
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
  piece: JigsawPieceSpec;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoverSlotKey: string | null;
}

interface TeachFeedbackState {
  attemptedSlotKey: string;
  correctSlotKey: string;
  attemptedPiece: JigsawPieceSpec;
  title: string;
  explanation: string;
  hint: string;
}

interface SavedStickerJigsawState {
  configKey: string;
  puzzles: StickerJigsawPuzzle[];
  puzzleIndex: number;
  placedSlots: Record<string, JigsawPieceSpec>;
  tray: JigsawPieceSpec[];
  movesCount: number;
  mistakesCount: number;
  startedAt: number;
}

function CroppedStickerSlice({
  imagePath,
  rows,
  cols,
  row,
  col,
}: {
  imagePath: string;
  rows: number;
  cols: number;
  row: number;
  col: number;
}) {
  return (
    <div className="sj-crop-box" aria-hidden="true">
      <img
        src={assetUrl(imagePath)}
        alt=""
        draggable={false}
        style={{
          width: `${cols * 100}%`,
          height: `${rows * 100}%`,
          left: `${-col * 100}%`,
          top: `${-row * 100}%`,
        }}
      />
    </div>
  );
}

function createRoundPuzzles(config: StickerJigsawConfig): StickerJigsawPuzzle[] {
  const count = getPuzzlesCount(config.roundSize);
  const characters = pickRoundCharacters(config.themeId, count);
  return characters.map((char, idx) => generateJigsawPuzzle(config.size, char, idx));
}

export function StickerJigsawBoard({
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
}: StickerJigsawBoardProps) {
  const sizeSpec = getJigsawSizeSpec(config.size);
  const theme = getThemeSpec(config.themeId);
  const totalPuzzles = getPuzzlesCount(config.roundSize);

  const configKey = useMemo(
    () => `${config.size}:${config.roundSize}:${config.themeId}:${gameKey}`,
    [config.size, config.roundSize, config.themeId, gameKey],
  );

  const initialRestored = useMemo<SavedStickerJigsawState | null>(() => {
    if (journeyContext) return null;
    try {
      const raw = window.sessionStorage.getItem(STICKER_JIGSAW_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedStickerJigsawState;
      if (parsed && parsed.configKey === configKey && parsed.puzzles?.length > 0) {
        return parsed;
      }
    } catch {
      // Ignore corrupt saved state
    }
    return null;
  }, [configKey, journeyContext]);

  const [puzzles, setPuzzles] = useState<StickerJigsawPuzzle[]>(
    () => initialRestored?.puzzles ?? createRoundPuzzles(config),
  );
  const [puzzleIndex, setPuzzleIndex] = useState<number>(initialRestored?.puzzleIndex ?? 0);
  const puzzle = puzzles[puzzleIndex] ?? puzzles[0];

  const [placedSlots, setPlacedSlots] = useState<Record<string, JigsawPieceSpec>>(
    () => initialRestored?.placedSlots ?? puzzle.preplacedSlots,
  );
  const [tray, setTray] = useState<JigsawPieceSpec[]>(
    () => initialRestored?.tray ?? puzzle.initialTray,
  );
  const [selectedPieceUid, setSelectedPieceUid] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [teachFeedback, setTeachFeedback] = useState<TeachFeedbackState | null>(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [stickerCompleted, setStickerCompleted] = useState(false);
  const [roundWon, setRoundWon] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [banner, setBanner] = useState<{ tone: 'neutral' | 'success' | 'warn'; text: string }>({
    tone: 'neutral',
    text: `Place each piece to complete ${puzzle.character.label}'s sticker!`,
  });

  const [movesCount, setMovesCount] = useState(initialRestored?.movesCount ?? 0);
  const [mistakesCount, setMistakesCount] = useState(initialRestored?.mistakesCount ?? 0);
  const startedAtRef = useRef<number>(initialRestored?.startedAt ?? Date.now());
  const loggedSessionRef = useRef(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const teachTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const [boardPx, setBoardPx] = useState(320);

  // Measure portrait stage height/width so board + character nameplate + tray fit with zero scroll
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      const maxW = Math.max(220, rect.width - 40);
      const maxH = Math.max(220, rect.height - 64);
      const size = Math.max(220, Math.min(390, maxW, maxH));
      setBoardPx(Math.floor(size));
    };

    computeSize();
    const ro = new ResizeObserver(computeSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    onGameActiveChange(!roundWon);
  }, [onGameActiveChange, roundWon]);

  useEffect(() => {
    return () => {
      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (journeyContext || roundWon) return;
    try {
      const payload: SavedStickerJigsawState = {
        configKey,
        puzzles,
        puzzleIndex,
        placedSlots,
        tray,
        movesCount,
        mistakesCount,
        startedAt: startedAtRef.current,
      };
      window.sessionStorage.setItem(STICKER_JIGSAW_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    configKey,
    journeyContext,
    mistakesCount,
    movesCount,
    placedSlots,
    puzzleIndex,
    puzzles,
    roundWon,
    tray,
  ]);

  const startNewRound = useCallback(() => {
    if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);

    clearSavedStickerJigsawGame();
    const fresh = createRoundPuzzles(config);
    setPuzzles(fresh);
    setPuzzleIndex(0);
    setPlacedSlots(fresh[0].preplacedSlots);
    setTray(fresh[0].initialTray);
    setSelectedPieceUid(null);
    setDragState(null);
    setTeachFeedback(null);
    setPauseActive(false);
    setStickerCompleted(false);
    setRoundWon(false);
    setMovesCount(0);
    setMistakesCount(0);
    startedAtRef.current = Date.now();
    loggedSessionRef.current = false;
    setBanner({
      tone: 'neutral',
      text: `Place each piece to complete ${fresh[0].character.label}'s sticker!`,
    });
  }, [config]);

  const advanceAfterCompleteSticker = useCallback(
    (nextIdx: number, finalMoves: number, finalMistakes: number) => {
      if (nextIdx >= puzzles.length) {
        clearSavedStickerJigsawGame();
        setRoundWon(true);
        setConfettiMode('win');
        setConfettiKey((k) => k + 1);

        if (!loggedSessionRef.current) {
          loggedSessionRef.current = true;
          const totalAttempts = Math.max(1, finalMoves);
          const correct = Math.max(0, totalAttempts - finalMistakes);
          recordLearningSession({
            playerId: childProfile.id,
            gameId: 'sticker-jigsaw',
            mode: `${config.size}-${config.roundSize}`,
            totalAttempts,
            correctAttempts: correct,
            mistakes: finalMistakes,
            flawless: finalMistakes === 0,
            durationMs: Math.max(1000, Date.now() - startedAtRef.current),
          });
        }

        if (journeyContext) {
          advanceTimerRef.current = window.setTimeout(() => {
            journeyContext.onActivityComplete();
          }, 950);
        }
        return;
      }

      const nextPuzzle = puzzles[nextIdx];
      setPuzzleIndex(nextIdx);
      setPlacedSlots(nextPuzzle.preplacedSlots);
      setTray(nextPuzzle.initialTray);
      setSelectedPieceUid(null);
      setStickerCompleted(false);
      setBanner({
        tone: 'neutral',
        text: `Sticker ${nextIdx + 1} of ${puzzles.length}: Build ${nextPuzzle.character.label}!`,
      });
    },
    [childProfile.id, config.roundSize, config.size, journeyContext, puzzles, totalPuzzles],
  );

  const handlePlacePiece = useCallback(
    (targetSlotKey: string, piece: JigsawPieceSpec) => {
      if (teachFeedback || pauseActive || stickerCompleted || roundWon) return;
      if (placedSlots[targetSlotKey]) return;

      const nextMoves = movesCount + 1;
      setMovesCount(nextMoves);
      setSelectedPieceUid(null);

      if (piece.slotKey === targetSlotKey) {
        const nextPlaced = { ...placedSlots, [targetSlotKey]: piece };
        const nextTray = tray.filter((p) => p.uid !== piece.uid);
        setPlacedSlots(nextPlaced);
        setTray(nextTray);

        if (nextTray.length === 0) {
          playJigsawSolvedSound(soundEnabled);
          setStickerCompleted(true);
          setConfettiMode(puzzleIndex + 1 >= puzzles.length ? 'win' : 'match');
          setConfettiKey((k) => k + 1);
          setBanner({
            tone: 'success',
            text: `Sticker Complete! You built ${puzzle.character.label}!`,
          });

          advanceTimerRef.current = window.setTimeout(() => {
            advanceAfterCompleteSticker(puzzleIndex + 1, nextMoves, mistakesCount);
          }, 1250);
        } else {
          playJigsawSnapSound(soundEnabled);
          setBanner({
            tone: 'success',
            text: `Snap! ${nextTray.length} puzzle piece${nextTray.length === 1 ? '' : 's'} left!`,
          });
        }
        return;
      }

      // Teach-First + Pause-Second: highlight attempted wrong spot AND true matching spot for ~1.9s first
      const nextMistakes = mistakesCount + 1;
      setMistakesCount(nextMistakes);
      playJigsawMismatchSound(soundEnabled);

      const explanation = `Look closely at the picture! That piece belongs in Row ${piece.row + 1}, Column ${piece.col + 1} where the lines match!`;
      setBanner({
        tone: 'warn',
        text: explanation,
      });
      setTeachFeedback({
        attemptedSlotKey: targetSlotKey,
        correctSlotKey: piece.slotKey,
        attemptedPiece: piece,
        title: 'Match the Picture Lines!',
        explanation,
        hint: `Look at the glowing spot on ${puzzle.character.label}'s sticker silhouette.`,
      });

      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = window.setTimeout(() => {
        setPauseActive(true);
      }, TEACH_BEFORE_PAUSE_MS);
    },
    [
      advanceAfterCompleteSticker,
      mistakesCount,
      movesCount,
      pauseActive,
      placedSlots,
      puzzle.character.label,
      puzzleIndex,
      puzzles.length,
      roundWon,
      soundEnabled,
      stickerCompleted,
      teachFeedback,
      tray,
    ],
  );

  const handleThinkAgainReady = useCallback(() => {
    setPauseActive(false);
    setTeachFeedback(null);
    setBanner({
      tone: 'neutral',
      text: `Match each piece to ${puzzle.character.label}'s sticker spot!`,
    });
  }, [puzzle.character.label]);

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

  const handleTrayPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, piece: JigsawPieceSpec) => {
    if (teachFeedback || pauseActive || stickerCompleted || roundWon) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    playJigsawPickupSound(soundEnabled);
    setDragState({
      piece,
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
    const { isDragging, piece } = dragState;
    const dropKey = isDragging ? findHoveredSlotKey(e.clientX, e.clientY) : null;
    setDragState(null);

    if (isDragging) {
      if (dropKey) {
        handlePlacePiece(dropKey, piece);
      }
      return;
    }

    setSelectedPieceUid((prev) => (prev === piece.uid ? null : piece.uid));
  };

  const handleTrayPointerCancel = () => {
    setDragState(null);
  };

  const handleSlotTap = (slotKey: string) => {
    if (teachFeedback || pauseActive || stickerCompleted || roundWon) return;
    if (placedSlots[slotKey]) return;
    if (!selectedPieceUid) {
      setBanner({
        tone: 'neutral',
        text: 'Pick a piece below, then tap where it fits on the sticker!',
      });
      return;
    }
    const piece = tray.find((p) => p.uid === selectedPieceUid);
    if (piece) {
      handlePlacePiece(slotKey, piece);
    }
  };

  const draggedPiece = dragState?.piece ?? null;

  return (
    <div className="game-screen sj-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseActive}
        title={teachFeedback?.title ?? 'Check the Picture!'}
        hint={teachFeedback?.hint ?? 'Match the puzzle colors and edges cleanly.'}
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
              ? `Activity #${journeyContext.globalActivityNumber}: Sticker Jigsaw`
              : 'Sticker Jigsaw'}
          </span>
        </div>

        <div className="game-topbar__right">
          <span className="badge-pill badge-pill--coral">
            Sticker {Math.min(puzzleIndex + 1, puzzles.length)} of {puzzles.length}
          </span>
          <span className="badge-pill badge-pill--mint">
            {puzzle.rows * puzzle.cols - tray.length}/{puzzle.rows * puzzle.cols} Pieces
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

      <main className="sj-stage" ref={stageRef}>
        <div className="sj-sticker-frame">
          <div className="sj-character-pill">
            <span>{theme.title}</span>
            <strong>{puzzle.character.label}</strong>
          </div>

          <div
            className={`sj-board ${stickerCompleted ? 'sj-board--completed' : ''}`}
            style={
              {
                width: `${boardPx}px`,
                height: `${boardPx}px`,
                gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
                gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
              } as CSSProperties
            }
          >
            {/* Faint Silhouette Guide behind empty slots */}
            <img
              src={assetUrl(puzzle.character.imagePath)}
              alt=""
              className="sj-board-silhouette"
              draggable={false}
              aria-hidden="true"
            />

            {Array.from({ length: puzzle.rows }, (_, r) =>
              Array.from({ length: puzzle.cols }, (__, c) => {
                const key = jigsawSlotKey(r, c);
                const placed = placedSlots[key];
                const isTeachAttempt = teachFeedback?.attemptedSlotKey === key;
                const isTeachCorrectSpot = teachFeedback?.correctSlotKey === key;
                const isDragHover = dragState?.hoverSlotKey === key;
                const canTapPlace =
                  !placed && Boolean(selectedPieceUid) && !stickerCompleted;

                return (
                  <button
                    key={key}
                    type="button"
                    ref={(node) => {
                      slotRefs.current[key] = node;
                    }}
                    className={`sj-slot ${placed ? 'sj-slot--placed' : 'sj-slot--empty'} ${
                      isTeachAttempt ? 'sj-slot--teach-wrong' : ''
                    } ${isTeachCorrectSpot ? 'sj-slot--teach-target' : ''} ${
                      isDragHover ? 'sj-slot--hover' : ''
                    } ${canTapPlace ? 'sj-slot--tap-ready' : ''}`}
                    onClick={() => handleSlotTap(key)}
                    disabled={Boolean(placed) || stickerCompleted}
                    aria-label={
                      placed
                        ? `${puzzle.character.label} piece row ${r + 1} column ${c + 1} placed`
                        : `Empty sticker spot row ${r + 1} column ${c + 1}`
                    }
                  >
                    {placed ? (
                      <CroppedStickerSlice
                        imagePath={puzzle.character.imagePath}
                        rows={puzzle.rows}
                        cols={puzzle.cols}
                        row={placed.row}
                        col={placed.col}
                      />
                    ) : isTeachAttempt && teachFeedback ? (
                      <div className="sj-teach-wrong-wrap">
                        <CroppedStickerSlice
                          imagePath={puzzle.character.imagePath}
                          rows={puzzle.rows}
                          cols={puzzle.cols}
                          row={teachFeedback.attemptedPiece.row}
                          col={teachFeedback.attemptedPiece.col}
                        />
                        <span className="sj-teach-badge">Not here</span>
                      </div>
                    ) : isTeachCorrectSpot ? (
                      <span className="sj-target-pulse">Match here!</span>
                    ) : (
                      <span className="sj-slot-hint">{r * puzzle.cols + c + 1}</span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </main>

      <section className="sj-tray-dock" aria-label="Puzzle pieces tray">
        <div className="sj-tray-dock__head">
          <span className="sj-tray-dock__title">Sticker Pieces ({sizeSpec.label})</span>
          <span className="sj-tray-dock__hint">
            {selectedPieceUid
              ? 'Tap the matching spot on the sticker board!'
              : 'Tap or drag a puzzle piece into its spot'}
          </span>
        </div>

        <div className="sj-tray-pieces">
          {tray.map((piece) => {
            const isSelected = selectedPieceUid === piece.uid;
            const isDraggingThis = dragState?.isDragging && dragState.piece.uid === piece.uid;
            return (
              <button
                key={piece.uid}
                type="button"
                className={`sj-tray-piece ${isSelected ? 'sj-tray-piece--selected' : ''} ${
                  isDraggingThis ? 'sj-tray-piece--ghosted' : ''
                }`}
                style={{
                  aspectRatio: `${puzzle.rows} / ${puzzle.cols}`,
                }}
                onPointerDown={(e) => handleTrayPointerDown(e, piece)}
                onPointerMove={handleTrayPointerMove}
                onPointerUp={handleTrayPointerUp}
                onPointerCancel={handleTrayPointerCancel}
                disabled={Boolean(teachFeedback) || pauseActive || stickerCompleted}
                aria-pressed={isSelected}
                aria-label={`Puzzle piece row ${piece.row + 1} column ${piece.col + 1}`}
              >
                <CroppedStickerSlice
                  imagePath={puzzle.character.imagePath}
                  rows={puzzle.rows}
                  cols={puzzle.cols}
                  row={piece.row}
                  col={piece.col}
                />
              </button>
            );
          })}
        </div>
      </section>

      {dragState?.isDragging && draggedPiece && (
        <div
          className={`sj-drag-ghost ${dragState.hoverSlotKey ? 'sj-drag-ghost--over' : ''}`}
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
            aspectRatio: `${puzzle.rows} / ${puzzle.cols}`,
          }}
          aria-hidden="true"
        >
          <CroppedStickerSlice
            imagePath={puzzle.character.imagePath}
            rows={puzzle.rows}
            cols={puzzle.cols}
            row={draggedPiece.row}
            col={draggedPiece.col}
          />
        </div>
      )}

      {roundWon && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sj-win-title"
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
            <h2 id="sj-win-title">Great Job, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You built all {puzzles.length} {theme.title} stickers ({sizeSpec.label}) in{' '}
              {movesCount} {movesCount === 1 ? 'move' : 'moves'}
              {mistakesCount === 0
                ? ' with zero mistakes!'
                : ` (${mistakesCount} mistake${mistakesCount === 1 ? '' : 's'})!`}
            </p>
            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={startNewRound}
              >
                Build More Stickers
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

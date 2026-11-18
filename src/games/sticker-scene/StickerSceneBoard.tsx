import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { ReadAlongWordPill, WordSoundButton } from '../../components/WordSoundButton';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession } from '../../learning/learningStore';
import {
  playThemeCharacterWord,
  preloadThemeAudioForPairIds,
} from '../../utils/readAlongAudio';
import { getThemeSpec } from '../memory-match/themes';
import { StickerCutoutCanvas } from './StickerCutoutCanvas';
import {
  buildStickerSceneDeck,
  buildStickerSceneMismatchLesson,
  type SceneBackdropSpec,
  type StickerSceneConfig,
  type StickerScenePuzzle,
  type StickerSceneSlot,
  type StickerTrayItem,
} from './sceneEngine';
import {
  playSceneCompleteFanfare,
  playStickerMissSound,
  playStickerPickupSound,
  playStickerPlaceSound,
} from './sceneSounds';

const STICKER_SCENE_STORAGE_KEY = 'pebble.stickerScene.v1';
const TEACH_BEFORE_PAUSE_MS = 1850;

export function clearSavedStickerSceneGame(): void {
  try {
    window.sessionStorage.removeItem(STICKER_SCENE_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors
  }
}

interface StickerSceneBoardProps {
  gameKey: number;
  config: StickerSceneConfig;
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
  item: StickerTrayItem;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  hoverSlotUid: string | null;
}

interface TeachFeedback {
  slotUid: string;
  attemptedItem: StickerTrayItem;
  title: string;
  explanation: string;
  hint: string;
}

function SceneBackdropSvg({ backdrop }: { backdrop: SceneBackdropSpec }) {
  return (
    <svg
      viewBox="0 0 600 380"
      preserveAspectRatio="none"
      className="ss-backdrop-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${backdrop.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={backdrop.skyTop} />
          <stop offset="100%" stopColor={backdrop.skyBottom} />
        </linearGradient>
      </defs>
      <rect width="600" height="380" fill={`url(#sky-${backdrop.id})`} />

      {backdrop.id === 'starry-camp' ? (
        <>
          <path
            d="M474 44C461 52 456 68 463 81C470 94 486 100 499 94C487 95 476 88 472 76C468 65 473 52 483 45C480 44 477 44 474 44Z"
            fill="#F2B84B"
          />
          <circle cx="120" cy="56" r="4" fill="#F2B84B" fillOpacity="0.65" />
          <circle cx="240" cy="42" r="3" fill="#FFFFFF" fillOpacity="0.85" />
          <circle cx="385" cy="64" r="3.5" fill="#F2B84B" fillOpacity="0.55" />
        </>
      ) : (
        <>
          <circle cx="496" cy="68" r="30" fill="#F2B84B" fillOpacity="0.85" />
          <circle cx="496" cy="68" r="44" fill="#F2B84B" fillOpacity="0.16" />
          <path
            d="M84 72C84 62 92 54 102 55C107 46 117 40 129 40C143 40 155 51 156 65C164 67 170 73 170 81C170 90 163 97 154 97H97C89.8 97 84 91.2 84 84V72Z"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
        </>
      )}

      <path
        d="M0 245 Q150 185 330 232 T600 218 L600 380 L0 380 Z"
        fill={backdrop.groundBack}
      />
      <path
        d="M0 278 Q190 228 380 272 T600 264 L600 380 L0 380 Z"
        fill={backdrop.groundMain}
      />

      {backdrop.id === 'cozy-harbor' && (
        <ellipse cx="435" cy="316" rx="145" ry="34" fill="#8CD2C9" fillOpacity="0.72" />
      )}
      {backdrop.id === 'sunny-meadow' && (
        <>
          <circle cx="96" cy="322" r="7" fill="#F27A5E" fillOpacity="0.55" />
          <circle cx="515" cy="330" r="6" fill="#5B5BD6" fillOpacity="0.4" />
        </>
      )}
    </svg>
  );
}

export function StickerSceneBoard({
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
}: StickerSceneBoardProps) {
  const theme = getThemeSpec(config.themeId);
  const [deck, setDeck] = useState<StickerScenePuzzle[]>(() => buildStickerSceneDeck(config));
  const [sceneIndex, setSceneIndex] = useState(0);
  const [placedBySlotUid, setPlacedBySlotUid] = useState<Record<string, StickerTrayItem>>({});
  const [tray, setTray] = useState<StickerTrayItem[]>(() => deck[0]?.initialTray ?? []);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [teachFeedback, setTeachFeedback] = useState<TeachFeedback | null>(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [roundWon, setRoundWon] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [banner, setBanner] = useState<{ tone: 'neutral' | 'success' | 'warn'; text: string }>({
    tone: 'neutral',
    text: 'Tap or drag each colorful sticker onto its matching shadow!',
  });
  const [movesCount, setMovesCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const teachTimerRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);

  const [sceneDims, setSceneDims] = useState<{ width: number; height: number; stickerSize: number }>({
    width: 640,
    height: 410,
    stickerSize: 108,
  });

  const currentScene = deck[sceneIndex] ?? deck[0];

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(280, rect.width - 16);
      const availH = Math.max(240, rect.height - 16);
      const ratio = 16 / 10;
      let width = Math.min(availW, 690);
      let height = Math.round(width / ratio);
      if (height > availH) {
        height = Math.floor(availH);
        width = Math.round(height * ratio);
      }
      const stickerSize = Math.max(76, Math.min(126, Math.round(Math.min(width, height) * 0.25)));
      setSceneDims({ width, height, stickerSize });
    };

    computeSize();
    const ro = new ResizeObserver(computeSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    preloadThemeAudioForPairIds(deck.flatMap((scene) => scene.slots.map((s) => s.stickerId)));
  }, [deck]);

  useEffect(() => {
    onGameActiveChange(!roundWon);
  }, [onGameActiveChange, roundWon]);

  useEffect(() => {
    return () => {
      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Reset cleanly if gameKey or config changes externally
    const fresh = buildStickerSceneDeck(config);
    setDeck(fresh);
    setSceneIndex(0);
    setPlacedBySlotUid({});
    setTray(fresh[0]?.initialTray ?? []);
    setSelectedUid(null);
    setDragState(null);
    setTeachFeedback(null);
    setPauseActive(false);
    setRoundWon(false);
    setMovesCount(0);
    setMistakesCount(0);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
  }, [config, gameKey]);

  const startNewRound = useCallback(() => {
    if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    const fresh = buildStickerSceneDeck(config);
    setDeck(fresh);
    setSceneIndex(0);
    setPlacedBySlotUid({});
    setTray(fresh[0]?.initialTray ?? []);
    setSelectedUid(null);
    setDragState(null);
    setTeachFeedback(null);
    setPauseActive(false);
    setRoundWon(false);
    setMovesCount(0);
    setMistakesCount(0);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
    setBanner({
      tone: 'neutral',
      text: 'Tap or drag each colorful sticker onto its matching shadow!',
    });
  }, [config]);

  const handlePlaceSticker = useCallback(
    (slot: StickerSceneSlot, item: StickerTrayItem) => {
      if (teachFeedback || pauseActive || roundWon) return;
      if (placedBySlotUid[slot.slotUid]) return;

      const nextMoves = movesCount + 1;
      setMovesCount(nextMoves);
      setSelectedUid(null);

      if (item.stickerId === slot.stickerId) {
        playStickerPlaceSound(soundEnabled);
        const nextPlaced = { ...placedBySlotUid, [slot.slotUid]: item };
        const nextTray = tray.filter((t) => t.uid !== item.uid);
        setPlacedBySlotUid(nextPlaced);
        setTray(nextTray);

        if (Object.keys(nextPlaced).length >= currentScene.slots.length) {
          playSceneCompleteFanfare(soundEnabled);
          setConfettiMode('win');
          setConfettiKey((k) => k + 1);
          setBanner({
            tone: 'success',
            text: `Scene complete! Every ${theme.title} sticker found its cozy spot!`,
          });

          const isLastScene = sceneIndex + 1 >= deck.length;
          if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
          nextTimerRef.current = window.setTimeout(() => {
            if (isLastScene) {
              setRoundWon(true);
              if (!loggedRef.current) {
                loggedRef.current = true;
                recordLearningSession({
                  playerId: childProfile.id,
                  gameId: 'sticker-scene',
                  mode: `${config.stickerCount}-${config.roundSize}-${config.themeId}`,
                  totalAttempts: Math.max(1, nextMoves),
                  correctAttempts: Math.max(0, nextMoves - mistakesCount),
                  mistakes: mistakesCount,
                  flawless: mistakesCount === 0,
                  durationMs: Math.max(1000, Date.now() - startedAtRef.current),
                });
              }
              if (journeyContext) {
                journeyContext.onActivityComplete();
              }
            } else {
              const nextIdx = sceneIndex + 1;
              setSceneIndex(nextIdx);
              setPlacedBySlotUid({});
              setTray(deck[nextIdx]?.initialTray ?? []);
              setSelectedUid(null);
              setBanner({
                tone: 'neutral',
                text: `Scene ${nextIdx + 1} of ${deck.length}: Fill the shadows with stickers!`,
              });
            }
          }, 950);
        } else {
          playThemeCharacterWord(item.stickerId, item.label, soundEnabled);
          setConfettiMode('match');
          setConfettiKey((k) => k + 1);
          const remaining = currentScene.slots.length - Object.keys(nextPlaced).length;
          setBanner({
            tone: 'success',
            text: `Great spot for ${item.label}! ${remaining} more sticker${remaining === 1 ? '' : 's'} left!`,
          });
        }
        return;
      }

      // Teach-First, Pause-Second: keep mismatched sticker beside shadow for ~1.85s before ThinkAgainOverlay
      const nextMistakes = mistakesCount + 1;
      setMistakesCount(nextMistakes);
      playStickerMissSound(soundEnabled);
      const lesson = buildStickerSceneMismatchLesson(item.label, slot.label);
      setBanner({
        tone: 'warn',
        text: lesson.explanation,
      });
      setTeachFeedback({
        slotUid: slot.slotUid,
        attemptedItem: item,
        ...lesson,
      });

      if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = window.setTimeout(() => {
        setPauseActive(true);
      }, TEACH_BEFORE_PAUSE_MS);
    },
    [
      childProfile.id,
      config.roundSize,
      config.stickerCount,
      config.themeId,
      currentScene.slots.length,
      deck,
      journeyContext,
      mistakesCount,
      movesCount,
      pauseActive,
      placedBySlotUid,
      roundWon,
      sceneIndex,
      soundEnabled,
      teachFeedback,
      theme.title,
      tray,
    ],
  );

  const handleThinkAgainReady = useCallback(() => {
    setPauseActive(false);
    setTeachFeedback(null);
    setBanner({
      tone: 'neutral',
      text: 'Look closely at the shadow outlines and try again!',
    });
  }, []);

  const findHoverSlotUid = useCallback(
    (clientX: number, clientY: number): string | null => {
      for (const [uid, btn] of Object.entries(slotRefs.current)) {
        if (!btn || placedBySlotUid[uid]) continue;
        const rect = btn.getBoundingClientRect();
        if (
          clientX >= rect.left - 12 &&
          clientX <= rect.right + 12 &&
          clientY >= rect.top - 12 &&
          clientY <= rect.bottom + 12
        ) {
          return uid;
        }
      }
      return null;
    },
    [placedBySlotUid],
  );

  const handleTrayPointerDown = (e: ReactPointerEvent<HTMLDivElement>, item: StickerTrayItem) => {
    if ((e.target as HTMLElement | null)?.closest('[data-sound-btn="true"]')) return;
    if (teachFeedback || pauseActive || roundWon) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    playStickerPickupSound(soundEnabled);
    setDragState({
      item,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      hoverSlotUid: null,
    });
  };

  const handleTrayPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const moved = dragState.isDragging || Math.hypot(dx, dy) > 8;
    const hoverSlotUid = moved ? findHoverSlotUid(e.clientX, e.clientY) : null;
    setDragState({
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: moved,
      hoverSlotUid,
    });
  };

  const handleTrayPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const { isDragging, item } = dragState;
    const dropUid = isDragging ? findHoverSlotUid(e.clientX, e.clientY) : null;
    setDragState(null);

    if (isDragging) {
      const targetSlot = dropUid
        ? currentScene.slots.find((s) => s.slotUid === dropUid)
        : undefined;
      if (targetSlot) {
        handlePlaceSticker(targetSlot, item);
      }
      return;
    }

    setSelectedUid((prev) => (prev === item.uid ? null : item.uid));
  };

  const handleSlotTap = (slot: StickerSceneSlot) => {
    if (teachFeedback || pauseActive || roundWon) return;
    if (placedBySlotUid[slot.slotUid]) return;
    if (!selectedUid) {
      setBanner({
        tone: 'neutral',
        text: 'Pick a colorful sticker below first, then tap its shadow!',
      });
      return;
    }
    const chosen = tray.find((t) => t.uid === selectedUid);
    if (chosen) {
      handlePlaceSticker(slot, chosen);
    }
  };

  return (
    <div className="game-screen ss-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseActive}
        title={teachFeedback?.title ?? 'Check the Shadow Shape!'}
        hint={teachFeedback?.hint ?? 'Match the sticker shape carefully.'}
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
              ? `Activity #${journeyContext.globalActivityNumber}: Sticker Scene`
              : 'Sticker Scene'}
          </span>
        </div>

        <div className="game-topbar__right">
          <span className="badge-pill badge-pill--coral">
            Scene {Math.min(sceneIndex + 1, deck.length)} of {deck.length}
          </span>
          <span className="badge-pill badge-pill--mint">
            {Object.keys(placedBySlotUid).length}/{currentScene.slots.length} Placed
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

      <main className="ss-stage" ref={stageRef}>
        <div
          className="ss-scene-canvas-card"
          style={{ width: `${sceneDims.width}px`, height: `${sceneDims.height}px` }}
        >
          <SceneBackdropSvg backdrop={currentScene.backdrop} />
          <div className="ss-backdrop-badge-wrap">
            <ReadAlongWordPill
              text={currentScene.backdrop.label}
              className="ss-backdrop-pill"
            />
          </div>

          {currentScene.slots.map((slot) => {
            const placed = placedBySlotUid[slot.slotUid];
            const isTeachHere = teachFeedback?.slotUid === slot.slotUid;
            const isDragHover = dragState?.hoverSlotUid === slot.slotUid;
            const canTapPlace = !placed && Boolean(selectedUid);
            const itemSize = Math.round(sceneDims.stickerSize * slot.scale);

            return (
              <button
                key={slot.slotUid}
                type="button"
                ref={(node) => {
                  slotRefs.current[slot.slotUid] = node;
                }}
                data-testid={`ss-slot-${slot.stickerId}`}
                data-sticker-id={slot.stickerId}
                className={`ss-scene-slot ${placed ? 'ss-scene-slot--placed' : ''} ${
                  isTeachHere ? 'ss-scene-slot--teach-wrong' : ''
                } ${isDragHover ? 'ss-scene-slot--hover' : ''} ${
                  canTapPlace ? 'ss-scene-slot--tap-ready' : ''
                }`}
                style={{
                  left: `${slot.xPct}%`,
                  top: `${slot.yPct}%`,
                  width: `${itemSize}px`,
                  height: `${itemSize}px`,
                }}
                onClick={() => handleSlotTap(slot)}
                disabled={Boolean(placed)}
                aria-label={
                  placed
                    ? `Placed ${slot.label} sticker`
                    : `Shadow spot for ${slot.label}`
                }
              >
                {placed ? (
                  <StickerCutoutCanvas
                    imagePath={placed.imagePath}
                    alt={placed.label}
                    mode="cutout"
                    size={itemSize - 6}
                    className="ss-cutout-placed"
                  />
                ) : isTeachHere && teachFeedback ? (
                  <div className="ss-teach-pair">
                    <StickerCutoutCanvas
                      imagePath={slot.imagePath}
                      alt={slot.label}
                      mode="silhouette"
                      size={Math.round(itemSize * 0.78)}
                    />
                    <div className="ss-teach-wrong-sticker">
                      <StickerCutoutCanvas
                        imagePath={teachFeedback.attemptedItem.imagePath}
                        alt={teachFeedback.attemptedItem.label}
                        mode="cutout"
                        size={Math.round(itemSize * 0.72)}
                      />
                    </div>
                  </div>
                ) : (
                  <StickerCutoutCanvas
                    imagePath={slot.imagePath}
                    alt={`Shadow for ${slot.label}`}
                    mode="silhouette"
                    size={itemSize - 8}
                  />
                )}
              </button>
            );
          })}
        </div>
      </main>

      <section className="ss-tray-dock" aria-label="Sticker book tray">
        <div className="ss-tray-dock__head">
          <span className="ss-tray-dock__title">{theme.title} Stickers</span>
          <span className="ss-tray-dock__hint">
            {selectedUid
              ? 'Now tap the matching shadow in the scene!'
              : 'Tap or drag a sticker onto its shadow'}
          </span>
        </div>

        <div className="ss-tray-items">
          {tray.map((item) => {
            const selected = selectedUid === item.uid;
            const draggingThis = dragState?.isDragging && dragState.item.uid === item.uid;
            const isDisabled = Boolean(teachFeedback) || pauseActive || roundWon;
            return (
              <div
                key={item.uid}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                aria-disabled={isDisabled}
                data-testid={`ss-tray-sticker-${item.stickerId}`}
                data-sticker-id={item.stickerId}
                className={`ss-tray-sticker-btn ${
                  selected ? 'ss-tray-sticker-btn--selected' : ''
                } ${draggingThis ? 'ss-tray-sticker-btn--ghosted' : ''}`}
                onPointerDown={(e) => handleTrayPointerDown(e, item)}
                onPointerMove={handleTrayPointerMove}
                onPointerUp={handleTrayPointerUp}
                onPointerCancel={() => setDragState(null)}
                onKeyDown={(e) => {
                  if (isDisabled || e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedUid((prev) => (prev === item.uid ? null : item.uid));
                  }
                }}
                aria-pressed={selected}
                aria-label={`${item.label} sticker`}
              >
                <StickerCutoutCanvas
                  imagePath={item.imagePath}
                  alt={item.label}
                  mode="cutout"
                  size={74}
                />
                <span className="ss-tray-sticker-btn__label-row">
                  <span className="ss-tray-sticker-btn__label">{item.label}</span>
                  <WordSoundButton
                    text={item.label}
                    pairId={item.stickerId}
                    size="xs"
                    variant="soft"
                    testId={`ss-sticker-sound-${item.stickerId}`}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {dragState?.isDragging && (
        <div
          className={`ss-drag-ghost ${dragState.hoverSlotUid ? 'ss-drag-ghost--over' : ''}`}
          style={{ left: `${dragState.currentX}px`, top: `${dragState.currentY}px` }}
          aria-hidden="true"
        >
          <StickerCutoutCanvas
            imagePath={dragState.item.imagePath}
            alt={dragState.item.label}
            mode="cutout"
            size={84}
          />
        </div>
      )}

      {roundWon && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ss-win-title"
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
            <h2 id="ss-win-title">Great Job, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You finished all {deck.length} {theme.title} sticker scenes
              {mistakesCount === 0
                ? ' with every shadow matched cleanly!'
                : ` (${mistakesCount} shadow check${mistakesCount === 1 ? '' : 's'})!`}
            </p>
            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={startNewRound}
              >
                Decorate New Scenes
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={onChangeSetup}
              >
                Change Sticker Theme
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

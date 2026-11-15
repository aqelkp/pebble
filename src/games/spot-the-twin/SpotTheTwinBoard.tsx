import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession } from '../../learning/learningStore';
import { playWordAudio, preloadWordsAudio } from '../../utils/wordAudio';
import { WordIllustration } from '../letter-train/WordIllustration';
import {
  generateTwinRoundDeck,
  type SpotTheTwinConfig,
  type TwinCardSlotItem,
  type TwinRoundPair,
} from './twinEngine';
import { playTwinMatchSound, playTwinMissSound, playTwinRoundWinSound } from './twinSounds';

const TEACH_BEFORE_PAUSE_MS = 1800;

interface SpotTheTwinBoardProps {
  gameKey: number;
  config: SpotTheTwinConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange: (active: boolean) => void;
  onRequestHelp?: () => void;
  journeyContext?: JourneyBoardContext;
}

const CARD_SLOT_LAYOUTS: Record<number, readonly { xPct: number; yPct: number }[]> = {
  4: [
    { xPct: 30, yPct: 31 },
    { xPct: 70, yPct: 31 },
    { xPct: 31, yPct: 70 },
    { xPct: 70, yPct: 69 },
  ],
  5: [
    { xPct: 50, yPct: 50 },
    { xPct: 26, yPct: 27 },
    { xPct: 74, yPct: 27 },
    { xPct: 26, yPct: 73 },
    { xPct: 74, yPct: 73 },
  ],
  6: [
    { xPct: 50, yPct: 50 },
    { xPct: 50, yPct: 21 },
    { xPct: 78, yPct: 41 },
    { xPct: 67, yPct: 74 },
    { xPct: 33, yPct: 74 },
    { xPct: 22, yPct: 41 },
  ],
};

export function SpotTheTwinBoard({
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
}: SpotTheTwinBoardProps) {
  const [deck, setDeck] = useState<TwinRoundPair[]>(() => generateTwinRoundDeck(config));
  const [pairIndex, setPairIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'matched' | 'teaching' | 'won'>('idle');
  const [wrongUid, setWrongUid] = useState<string | null>(null);
  const [wrongWordLabel, setWrongWordLabel] = useState<string | null>(null);
  const [pauseActive, setPauseActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');
  const [banner, setBanner] = useState<{ tone: 'neutral' | 'success' | 'warn'; text: string }>({
    tone: 'neutral',
    text: 'Look at both round cards — tap the ONE picture that is on BOTH cards!',
  });
  const [movesCount, setMovesCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [cardDiameter, setCardDiameter] = useState(310);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);

  const currentPair = deck[pairIndex] ?? deck[0];

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const computeSize = () => {
      const rect = el.getBoundingClientRect();
      const availW = Math.max(220, rect.width - 28);
      const availH = Math.max(260, rect.height - 76);
      const isSideBySide = availW >= 690 && availH < 480;
      const maxDiameter = isSideBySide
        ? Math.min(340, Math.floor((availW - 96) / 2), availH)
        : Math.min(348, Math.floor((availH - 20) / 2), availW);
      setCardDiameter(Math.max(210, maxDiameter));
    };

    computeSize();
    const ro = new ResizeObserver(computeSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (deck.length === 0) return;
    const allWordIds = Array.from(
      new Set(
        deck.flatMap((pair) => [
          ...pair.leftCard.map((c) => c.word.id),
          ...pair.rightCard.map((c) => c.word.id),
        ]),
      ),
    );
    preloadWordsAudio(allWordIds);
  }, [deck]);

  useEffect(() => {
    onGameActiveChange(phase !== 'won');
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const resetDeck = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const fresh = generateTwinRoundDeck(config);
    setDeck(fresh);
    setPairIndex(0);
    setPhase('idle');
    setWrongUid(null);
    setWrongWordLabel(null);
    setPauseActive(false);
    setMovesCount(0);
    setMistakesCount(0);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
    setBanner({
      tone: 'neutral',
      text: 'Look at both round cards — tap the ONE picture that is on BOTH cards!',
    });
  }, [config]);

  useEffect(() => {
    resetDeck();
  }, [gameKey, resetDeck]);

  const handleItemTap = (item: TwinCardSlotItem) => {
    if (phase !== 'idle' || pauseActive || !currentPair) return;

    const nextMoves = movesCount + 1;
    setMovesCount(nextMoves);

    if (item.isTwin) {
      setPhase('matched');
      playTwinMatchSound(soundEnabled);
      if (soundEnabled) {
        window.setTimeout(() => {
          playWordAudio(currentPair.twinWord.id, currentPair.twinWord.word, soundEnabled);
        }, 140);
      }
      setConfettiMode(pairIndex + 1 >= deck.length ? 'win' : 'match');
      setConfettiKey((k) => k + 1);
      setBanner({
        tone: 'success',
        text: `Twin found: ${currentPair.twinWord.word}! Both cards share ${currentPair.twinWord.word}!`,
      });

      const isLast = pairIndex + 1 >= deck.length;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (isLast) {
          playTwinRoundWinSound(soundEnabled);
          setPhase('won');
          if (!loggedRef.current) {
            loggedRef.current = true;
            recordLearningSession({
              playerId: childProfile.id,
              gameId: 'spot-the-twin',
              mode: `${config.difficulty}-${config.roundSize}`,
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
          const nextIdx = pairIndex + 1;
          setPairIndex(nextIdx);
          setPhase('idle');
          setBanner({
            tone: 'neutral',
            text: `Pair ${nextIdx + 1} of ${deck.length}: Which picture appears on BOTH cards?`,
          });
        }
      }, 920);
      return;
    }

    // Teach-First, Pause-Second: highlight the tapped single item & explain before 2s pause
    const nextMistakes = mistakesCount + 1;
    setMistakesCount(nextMistakes);
    setPhase('teaching');
    setWrongUid(item.uid);
    setWrongWordLabel(item.word.word);
    playTwinMissSound(soundEnabled);
    setBanner({
      tone: 'warn',
      text: `Look closely at the other card — ${item.word.word} is only on one card!`,
    });

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setPauseActive(true);
    }, TEACH_BEFORE_PAUSE_MS);
  };

  const handleThinkAgainReady = useCallback(() => {
    setPauseActive(false);
    setWrongUid(null);
    setWrongWordLabel(null);
    setPhase('idle');
    setBanner({
      tone: 'neutral',
      text: 'Compare pictures one by one across both cards!',
    });
  }, []);

  const itemsCount = currentPair.leftCard.length;
  const positions = CARD_SLOT_LAYOUTS[itemsCount] ?? CARD_SLOT_LAYOUTS[4];
  const itemBtnSize = Math.round(cardDiameter * (itemsCount >= 6 ? 0.25 : itemsCount === 5 ? 0.265 : 0.295));
  const artSize = Math.round(itemBtnSize * 0.72);

  const renderCard = (
    items: TwinCardSlotItem[],
    side: 'top' | 'bottom',
    label: string,
  ) => (
    <section
      className={`stt-card stt-card--${side} ${
        phase === 'teaching' ? 'stt-card--compare' : ''
      }`}
      style={{ width: `${cardDiameter}px`, height: `${cardDiameter}px` }}
      aria-label={label}
      data-testid={`stt-card-${side}`}
    >
      {items.map((item, idx) => {
        const pos = positions[idx % positions.length];
        const isMatchedTwin = phase === 'matched' && item.isTwin;
        const isWrongPicked = phase === 'teaching' && wrongUid === item.uid;
        return (
          <button
            key={item.uid}
            type="button"
            data-testid={`stt-item-${side}-${item.word.id}`}
            data-word-id={item.word.id}
            data-is-twin={item.isTwin ? 'true' : 'false'}
            className={`stt-item-btn ${isMatchedTwin ? 'stt-item-btn--matched' : ''} ${
              isWrongPicked ? 'stt-item-btn--wrong' : ''
            }`}
            style={{
              left: `${pos.xPct}%`,
              top: `${pos.yPct}%`,
              width: `${itemBtnSize}px`,
              height: `${itemBtnSize}px`,
              transform: `translate(-50%, -50%) scale(${
                isMatchedTwin ? 1.15 : item.scale
              }) rotate(${item.rotationDeg}deg)`,
            }}
            onClick={() => handleItemTap(item)}
            disabled={phase !== 'idle' || pauseActive}
            aria-label={item.word.word}
          >
            <WordIllustration id={item.word.id} size={artSize} />
          </button>
        );
      })}
    </section>
  );

  return (
    <div className="game-screen stt-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <ThinkAgainOverlay
        open={pauseActive}
        title={`${wrongWordLabel ?? 'That Picture'} Is Not the Twin`}
        hint="Compare each picture across both cards until you spot the matching pair!"
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
              ? `Activity #${journeyContext.globalActivityNumber}: Spot the Twin`
              : 'Spot the Twin'}
          </span>
        </div>

        <div className="game-topbar__right">
          <span className="badge-pill badge-pill--coral">
            Pair {Math.min(pairIndex + 1, deck.length)} of {deck.length}
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

      <main className="stt-stage" ref={stageRef}>
        {renderCard(currentPair.leftCard, 'top', 'Top picture card')}
        <div className="stt-center-pill" aria-hidden="true">
          <span>
            {phase === 'matched'
              ? `${currentPair.twinWord.word}!`
              : '1 Picture Matches Both Cards'}
          </span>
        </div>
        {renderCard(currentPair.rightCard, 'bottom', 'Bottom picture card')}
      </main>

      {phase === 'won' && !journeyContext && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stt-win-title"
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
            <h2 id="stt-win-title">Great Job, {childProfile.name}!</h2>
            <p className="winner-subtitle">
              You spotted every matching twin across all {deck.length} pairs
              {mistakesCount === 0
                ? ' with eagle eyes and zero misses!'
                : ` (${mistakesCount} check${mistakesCount === 1 ? '' : 's'})!`}
            </p>
            <div className="winner-actions">
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={resetDeck}
              >
                Spot More Twins
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={onChangeSetup}
              >
                Change Difficulty
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

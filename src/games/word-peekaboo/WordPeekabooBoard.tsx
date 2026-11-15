import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { useStageSize } from '../../engine/useStageSize';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession, recordSkillAttempt } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import {
  PEEKABOO_WORDS,
  TARGETS_PER_BOARD,
  TILES_PER_BOARD,
  buildFreshBoardForCharacter,
  buildPeekabooSessionDeck,
  getPeekabooCharacterByPairId,
  getPeekabooWordSpec,
  isValidPeekabooWordId,
  recordPeekabooWordRead,
  type PeekabooCardSpec,
  type PeekabooTileSpec,
  type PeekabooWordId,
  type WordPeekabooConfig,
} from './peekabooData';
import {
  playCharacterFoundVoice,
  playCharacterIntroVoice,
  playCharacterRevealFanfare,
  playPeekabooWrongTap,
  playTargetWordOnlyVoice,
  playTilePeelChime,
  playWrongWordTeachVoice,
  preloadPeekabooCardAssets,
  stopPeekabooVoice,
} from './peekabooSounds';
import './WordPeekaboo.css';

interface WordPeekabooBoardProps {
  gameKey?: number | string;
  config: WordPeekabooConfig;
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
  | 'intro'
  | 'playing'
  | 'revealing-tile'
  | 'teach-mistake'
  | 'think-again'
  | 'character-found'
  | 'won';

interface PersistedPeekabooCard {
  pairId: string;
  tileWordIds: PeekabooWordId[];
  targetQueue: PeekabooWordId[];
}

interface PersistedPeekabooSession {
  version: 1;
  cards: PersistedPeekabooCard[];
  cardIndex: number;
  turnIndex: number;
  revealedIndices: number[];
  boardMistakes: number;
  currentTurnMistakes: number;
  totalMistakes: number;
  flawlessCount: number;
  wordsReadCount: number;
}

const SESSION_KEY = 'pebble.wordPeekaboo.v1';

function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function SerifCapitalI() {
  return (
    <span className="wpk-serif-i" aria-label="I">
      <svg viewBox="0 0 36 52" fill="none" aria-hidden="true">
        <path
          d="M6 7H30M6 45H30M18 7V45"
          stroke="currentColor"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// TODO(security): Pebble runs locally as a static PWA; all restored sessionStorage cards,
// word IDs, and indices are validated against strict allow-lists and array bounds before use.
function tryRestorePeekabooSession(config: WordPeekabooConfig): {
  deck: PeekabooCardSpec[];
  cardIndex: number;
  turnIndex: number;
  revealedIndices: number[];
  boardMistakes: number;
  currentTurnMistakes: number;
  totalMistakes: number;
  flawlessCount: number;
  wordsReadCount: number;
} | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedPeekabooSession>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.cards) ||
      parsed.cards.length !== config.roundLength ||
      typeof parsed.cardIndex !== 'number' ||
      !Number.isInteger(parsed.cardIndex) ||
      parsed.cardIndex < 0 ||
      parsed.cardIndex >= config.roundLength ||
      typeof parsed.turnIndex !== 'number' ||
      !Number.isInteger(parsed.turnIndex) ||
      parsed.turnIndex < 0 ||
      parsed.turnIndex >= TARGETS_PER_BOARD ||
      !Array.isArray(parsed.revealedIndices) ||
      typeof parsed.boardMistakes !== 'number' ||
      typeof parsed.currentTurnMistakes !== 'number' ||
      typeof parsed.totalMistakes !== 'number' ||
      typeof parsed.flawlessCount !== 'number' ||
      typeof parsed.wordsReadCount !== 'number'
    ) {
      return null;
    }

    const deck: PeekabooCardSpec[] = [];
    for (let i = 0; i < parsed.cards.length; i += 1) {
      const card = parsed.cards[i];
      if (!card || typeof card !== 'object') return null;
      const charSpec =
        typeof card.pairId === 'string' ? getPeekabooCharacterByPairId(card.pairId) : undefined;
      if (!charSpec) return null;
      if (
        !Array.isArray(card.tileWordIds) ||
        card.tileWordIds.length !== TILES_PER_BOARD ||
        !card.tileWordIds.every((id) => isValidPeekabooWordId(id))
      ) {
        return null;
      }
      if (
        !Array.isArray(card.targetQueue) ||
        card.targetQueue.length !== TARGETS_PER_BOARD ||
        !card.targetQueue.every((id) => isValidPeekabooWordId(id))
      ) {
        return null;
      }
      const targetSet = new Set<PeekabooWordId>(card.targetQueue);
      const tileSet = new Set<PeekabooWordId>(card.tileWordIds);
      if (tileSet.size !== TILES_PER_BOARD || targetSet.size !== TARGETS_PER_BOARD) return null;
      for (const tId of card.targetQueue) {
        if (!tileSet.has(tId)) return null;
      }

      const tiles: PeekabooTileSpec[] = card.tileWordIds.map((wordId, slotIndex) => {
        const spec = getPeekabooWordSpec(wordId);
        return {
          slotIndex,
          wordId,
          display: spec.display,
          kind: spec.kind,
          isTarget: targetSet.has(wordId),
        };
      });

      deck.push({
        cardUid: `${charSpec.pairId}-${i}-restored`,
        character: charSpec,
        tiles,
        targetQueue: [...card.targetQueue],
      });
    }

    const validRevealed = Array.from(
      new Set(
        parsed.revealedIndices.filter(
          (idx): idx is number =>
            typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && idx < TILES_PER_BOARD,
        ),
      ),
    );

    return {
      deck,
      cardIndex: parsed.cardIndex,
      turnIndex: parsed.turnIndex,
      revealedIndices: validRevealed,
      boardMistakes: Math.max(0, Math.min(999, Math.floor(parsed.boardMistakes))),
      currentTurnMistakes: Math.max(0, Math.min(99, Math.floor(parsed.currentTurnMistakes))),
      totalMistakes: Math.max(0, Math.min(999, Math.floor(parsed.totalMistakes))),
      flawlessCount: Math.max(0, Math.min(config.roundLength, Math.floor(parsed.flawlessCount))),
      wordsReadCount: Math.max(0, Math.min(999, Math.floor(parsed.wordsReadCount))),
    };
  } catch {
    return null;
  }
}

function savePeekabooSession(state: PersistedPeekabooSession): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearPeekabooSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function WordPeekabooBoard({
  config,
  childProfile,
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  onRequestHelp,
  onGameActiveChange,
  journeyContext,
}: WordPeekabooBoardProps) {
  const initialState = useMemo(() => {
    if (!journeyContext) {
      const restored = tryRestorePeekabooSession(config);
      if (restored) return restored;
    }
    return {
      deck: buildPeekabooSessionDeck(config),
      cardIndex: 0,
      turnIndex: 0,
      revealedIndices: [] as number[],
      boardMistakes: 0,
      currentTurnMistakes: 0,
      totalMistakes: 0,
      flawlessCount: 0,
      wordsReadCount: 0,
    };
  }, [config, journeyContext]);

  const [deck, setDeck] = useState<PeekabooCardSpec[]>(initialState.deck);
  const [cardIndex, setCardIndex] = useState<number>(initialState.cardIndex);
  const [turnIndex, setTurnIndex] = useState<number>(initialState.turnIndex);
  const [revealedIndices, setRevealedIndices] = useState<number[]>(initialState.revealedIndices);
  const [boardMistakes, setBoardMistakes] = useState<number>(initialState.boardMistakes);
  const [currentTurnMistakes, setCurrentTurnMistakes] = useState<number>(
    initialState.currentTurnMistakes,
  );
  const [totalMistakes, setTotalMistakes] = useState<number>(initialState.totalMistakes);
  const [flawlessCount, setFlawlessCount] = useState<number>(initialState.flawlessCount);
  const [wordsReadCount, setWordsReadCount] = useState<number>(initialState.wordsReadCount);

  const [phase, setPhase] = useState<BoardPhase>('intro');
  const [justMatchedSlot, setJustMatchedSlot] = useState<number | null>(null);
  const [wrongSlot, setWrongSlot] = useState<{ slotIndex: number; display: string } | null>(null);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiMode, setConfettiMode] = useState<'match' | 'win'>('match');

  const [stageRef, stageSize] = useStageSize<HTMLDivElement>();
  const tileTimerRef = useRef<number | null>(null);
  const decoyTimerRef = useRef<number | null>(null);
  const foundAudioTimerRef = useRef<number | null>(null);
  const teachTimerRef = useRef<number | null>(null);
  const teachSafetyRef = useRef<number | null>(null);
  const cancelAudioRef = useRef<(() => void) | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const roundLoggedRef = useRef<boolean>(false);
  const testedWordsRef = useRef<Set<PeekabooWordId>>(new Set());

  const currentCard = deck[cardIndex] ?? deck[0];
  const currentTargetId: PeekabooWordId =
    currentCard?.targetQueue[turnIndex] ?? currentCard?.targetQueue[0] ?? PEEKABOO_WORDS[0].id;
  const currentTargetSpec = getPeekabooWordSpec(currentTargetId);

  const revealedSet = useMemo(() => new Set(revealedIndices), [revealedIndices]);

  const clearPendingTimers = useCallback(() => {
    if (tileTimerRef.current !== null) {
      window.clearTimeout(tileTimerRef.current);
      tileTimerRef.current = null;
    }
    if (decoyTimerRef.current !== null) {
      window.clearTimeout(decoyTimerRef.current);
      decoyTimerRef.current = null;
    }
    if (foundAudioTimerRef.current !== null) {
      window.clearTimeout(foundAudioTimerRef.current);
      foundAudioTimerRef.current = null;
    }
    if (teachTimerRef.current !== null) {
      window.clearTimeout(teachTimerRef.current);
      teachTimerRef.current = null;
    }
    if (teachSafetyRef.current !== null) {
      window.clearTimeout(teachSafetyRef.current);
      teachSafetyRef.current = null;
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
      clearPeekabooSession();
      return;
    }
    savePeekabooSession({
      version: 1,
      cards: deck.map((c) => ({
        pairId: c.character.pairId,
        tileWordIds: c.tiles.map((t) => t.wordId),
        targetQueue: c.targetQueue,
      })),
      cardIndex,
      turnIndex,
      revealedIndices,
      boardMistakes,
      currentTurnMistakes,
      totalMistakes,
      flawlessCount,
      wordsReadCount,
    });
  }, [
    journeyContext,
    phase,
    deck,
    cardIndex,
    turnIndex,
    revealedIndices,
    boardMistakes,
    currentTurnMistakes,
    totalMistakes,
    flawlessCount,
    wordsReadCount,
  ]);

  // Preload current + next card audio & character art
  useEffect(() => {
    if (currentCard) {
      preloadPeekabooCardAssets(currentCard);
    }
    const nextCard = deck[cardIndex + 1];
    if (nextCard) {
      preloadPeekabooCardAssets(nextCard);
    }
  }, [cardIndex, currentCard, deck]);

  // Play "Help discover <Character>!" intro, then auto-speak ONLY the first target word
  useEffect(() => {
    if (phase !== 'intro' || !currentCard) return;

    let cancelled = false;
    const cancelIntro = playCharacterIntroVoice(
      currentCard.character.pairId,
      currentCard.character.name,
      soundEnabled,
      () => {
        if (cancelled) return;
        setPhase('playing');
        playTargetWordOnlyVoice(currentTargetId, currentTargetSpec.display, soundEnabled);
      },
    );

    return () => {
      cancelled = true;
      cancelIntro();
    };
    // Only re-run when entering 'intro' for a specific cardUid
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentCard?.cardUid]);

  useEffect(() => {
    return () => {
      onGameActiveChange?.(false);
      clearPendingTimers();
      stopPeekabooVoice();
    };
  }, [clearPendingTimers, onGameActiveChange]);

  const handleListenAgain = useCallback(() => {
    if (phase === 'character-found' && currentCard) {
      playCharacterFoundVoice(currentCard.character.pairId, currentCard.character.name, true);
      return;
    }
    if (phase === 'playing') {
      playTargetWordOnlyVoice(currentTargetId, currentTargetSpec.display, true);
    }
  }, [currentCard, currentTargetId, currentTargetSpec.display, phase]);

  const handleTileTap = useCallback(
    (tile: PeekabooTileSpec) => {
      if (phase !== 'playing' || revealedSet.has(tile.slotIndex) || !currentCard) return;

      if (tile.wordId === currentTargetId) {
        const cleanTurn = currentTurnMistakes === 0;
        const nextTurn = turnIndex + 1;

        testedWordsRef.current.add(currentTargetId);
        recordPeekabooWordRead(currentTargetId, cleanTurn);
        recordSkillAttempt({
          playerId: childProfile.id,
          gameId: 'word-peekaboo',
          conceptId: `word:${currentTargetId}`,
          conceptLabel: currentTargetSpec.display,
          skillType: 'sight_word_reading',
          correct: cleanTurn,
          attemptsTaken: 1 + currentTurnMistakes,
        });

        setWordsReadCount((c) => c + 1);
        setWrongSlot(null);
        setJustMatchedSlot(tile.slotIndex);
        setRevealedIndices((prev) =>
          prev.includes(tile.slotIndex) ? prev : [...prev, tile.slotIndex],
        );
        playTilePeelChime(turnIndex, soundEnabled);

        if (nextTurn >= TARGETS_PER_BOARD) {
          // 6/6 matched: pop remaining 2 decoy tiles cleanly so the full friend is uncovered!
          const boardWasFlawless = boardMistakes === 0;
          if (boardWasFlawless) {
            setFlawlessCount((c) => c + 1);
          }
          setPhase('character-found');
          setConfettiMode('match');
          setConfettiKey((k) => k + 1);
          playCharacterRevealFanfare(boardWasFlawless, soundEnabled);

          decoyTimerRef.current = window.setTimeout(() => {
            setJustMatchedSlot(null);
            setRevealedIndices(Array.from({ length: TILES_PER_BOARD }, (_, idx) => idx));
          }, 260);

          foundAudioTimerRef.current = window.setTimeout(() => {
            playCharacterFoundVoice(
              currentCard.character.pairId,
              currentCard.character.name,
              soundEnabled,
            );
          }, 380);
          return;
        }

        setPhase('revealing-tile');
        tileTimerRef.current = window.setTimeout(() => {
          const nextWordId = currentCard.targetQueue[nextTurn];
          const nextWordSpec = getPeekabooWordSpec(nextWordId);
          setJustMatchedSlot(null);
          setTurnIndex(nextTurn);
          setCurrentTurnMistakes(0);
          setPhase('playing');
          playTargetWordOnlyVoice(nextWordId, nextWordSpec.display, soundEnabled);
        }, 650);
        return;
      }

      // Wrong tile tapped -> Calm Playfulness Asymmetry + Teach-First, Pause-Second
      clearPendingTimers();
      setCurrentTurnMistakes((c) => c + 1);
      setBoardMistakes((c) => c + 1);
      setTotalMistakes((c) => c + 1);
      setWrongSlot({ slotIndex: tile.slotIndex, display: tile.display });
      setPhase('teach-mistake');
      playPeekabooWrongTap(soundEnabled);

      let audioFinished = !soundEnabled;
      let minTimerFinished = false;

      const maybeOpenThinkAgain = () => {
        if (audioFinished && minTimerFinished) {
          setPhase('think-again');
        }
      };

      teachTimerRef.current = window.setTimeout(() => {
        minTimerFinished = true;
        maybeOpenThinkAgain();
      }, 2100);

      teachSafetyRef.current = window.setTimeout(() => {
        audioFinished = true;
        minTimerFinished = true;
        setPhase((cur) => (cur === 'teach-mistake' ? 'think-again' : cur));
      }, 4200);

      cancelAudioRef.current = playWrongWordTeachVoice(
        tile.wordId,
        tile.display,
        currentTargetId,
        currentTargetSpec.display,
        soundEnabled,
        () => {
          if (teachSafetyRef.current !== null) {
            window.clearTimeout(teachSafetyRef.current);
            teachSafetyRef.current = null;
          }
          audioFinished = true;
          maybeOpenThinkAgain();
        },
      );
    },
    [
      boardMistakes,
      childProfile.id,
      clearPendingTimers,
      currentCard,
      currentTargetId,
      currentTargetSpec.display,
      currentTurnMistakes,
      phase,
      revealedSet,
      soundEnabled,
      turnIndex,
    ],
  );

  const handleResumeAfterThinkAgain = useCallback(() => {
    setWrongSlot(null);
    setPhase('playing');
    tileTimerRef.current = window.setTimeout(() => {
      playTargetWordOnlyVoice(currentTargetId, currentTargetSpec.display, soundEnabled);
    }, 220);
  }, [currentTargetId, currentTargetSpec.display, soundEnabled]);

  const handleRestartCurrentBoard = useCallback(() => {
    if (!currentCard) return;
    clearPendingTimers();
    stopPeekabooVoice();
    const freshCard = buildFreshBoardForCharacter(config.packId, currentCard.character, cardIndex);
    setDeck((prev) => prev.map((c, idx) => (idx === cardIndex ? freshCard : c)));
    setTurnIndex(0);
    setRevealedIndices([]);
    setBoardMistakes(0);
    setCurrentTurnMistakes(0);
    setJustMatchedSlot(null);
    setWrongSlot(null);
    setPhase('intro');
  }, [cardIndex, clearPendingTimers, config.packId, currentCard]);

  const finishWholeSession = useCallback(() => {
    clearPendingTimers();
    stopPeekabooVoice();
    setPhase('won');
    setConfettiMode('win');
    setConfettiKey((k) => k + 1);
    playCharacterRevealFanfare(totalMistakes === 0, soundEnabled);

    if (!roundLoggedRef.current) {
      roundLoggedRef.current = true;
      const totalAttempts = Math.max(1, wordsReadCount + totalMistakes);
      const conceptsTested = Array.from(testedWordsRef.current).map((w) => `word:${w}`);
      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'word-peekaboo',
        mode: `${config.packId}-${config.worldId}-${deck.length}`,
        totalAttempts,
        correctAttempts: Math.max(1, wordsReadCount),
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
    config.packId,
    config.worldId,
    deck.length,
    journeyContext,
    soundEnabled,
    totalMistakes,
    wordsReadCount,
  ]);

  const handleNextFriend = useCallback(() => {
    clearPendingTimers();
    stopPeekabooVoice();
    if (cardIndex + 1 >= deck.length) {
      finishWholeSession();
      return;
    }
    setCardIndex((idx) => idx + 1);
    setTurnIndex(0);
    setRevealedIndices([]);
    setBoardMistakes(0);
    setCurrentTurnMistakes(0);
    setJustMatchedSlot(null);
    setWrongSlot(null);
    setPhase('intro');
  }, [cardIndex, clearPendingTimers, deck.length, finishWholeSession]);

  const handlePlayAgain = useCallback(() => {
    clearPendingTimers();
    stopPeekabooVoice();
    clearPeekabooSession();
    roundLoggedRef.current = false;
    testedWordsRef.current.clear();
    startedAtRef.current = Date.now();
    setDeck(buildPeekabooSessionDeck(config));
    setCardIndex(0);
    setTurnIndex(0);
    setRevealedIndices([]);
    setBoardMistakes(0);
    setCurrentTurnMistakes(0);
    setTotalMistakes(0);
    setFlawlessCount(0);
    setWordsReadCount(0);
    setJustMatchedSlot(null);
    setWrongSlot(null);
    setPhase('intro');
  }, [clearPendingTimers, config]);

  const frameSize = stageSize.ready
    ? Math.max(240, Math.floor(Math.min(stageSize.width - 20, stageSize.height - 10, 560)))
    : 420;
  const wordFontSize = Math.max(26, Math.round(frameSize * 0.09));
  const isCharacterRevealed = phase === 'character-found' || phase === 'won';
  const sealCharacterCompletely = revealedIndices.length === 0 && !isCharacterRevealed;

  const hudHeadline = useMemo(() => {
    if (!currentCard) return 'Word Peekaboo';
    if (phase === 'intro') {
      return `Help discover ${currentCard.character.name}!`;
    }
    if (phase === 'teach-mistake' && wrongSlot) {
      return `That's "${wrongSlot.display}". Listen again!`;
    }
    if (isCharacterRevealed) {
      return `You found ${currentCard.character.name}!`;
    }
    return 'Listen carefully and tap the word!';
  }, [currentCard, isCharacterRevealed, phase, wrongSlot]);

  return (
    <div className="wpk-screen">
      <ConfettiBurst active={confettiKey > 0} mode={confettiMode} burstKey={confettiKey} />

      <header className="wpk-top-bar">
        <div className="wpk-top-bar__side">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            data-testid="peekaboo-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
              data-testid="peekaboo-setup-btn"
            >
              Setup
            </button>
          )}
        </div>

        <BrandLogo size="sm" />

        <div className="wpk-top-bar__side">
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

      <section
        className={`wpk-hud-card ${
          isCharacterRevealed ? 'is-found' : phase === 'teach-mistake' ? 'is-teach' : ''
        }`}
        aria-live="polite"
      >
        <div className="wpk-hud-card__player">
          <img
            src={getAvatarSrc(childProfile.avatar)}
            alt=""
            className="wpk-hud-card__avatar"
          />
          <div className="wpk-hud-card__text">
            <span className="wpk-hud-card__eyebrow">
              {currentCard?.character.themeTitle ?? 'Story World'} • Friend {cardIndex + 1} of{' '}
              {deck.length}
            </span>
            <span className="wpk-hud-card__headline" data-testid="peekaboo-hud-headline">
              {hudHeadline}
            </span>
          </div>
        </div>

        <div className="wpk-hud-card__right">
          <div
            className={`wpk-crown-badge ${boardMistakes > 0 ? 'is-dimmed' : ''}`}
            title={boardMistakes === 0 ? 'Zero-mistake Crown streak active' : 'Mistake made on this board'}
          >
            <CrownIcon size={18} />
            <span>{boardMistakes === 0 ? 'Perfect' : 'Keep Going'}</span>
          </div>
        </div>
      </section>

      <div className="wpk-listen-row">
        <button
          type="button"
          className={`wpk-listen-btn ${phase === 'intro' ? 'is-intro' : ''}`}
          disabled={phase !== 'playing' && phase !== 'character-found'}
          onClick={handleListenAgain}
          data-testid="peekaboo-listen-btn"
        >
          <SpeakerIcon />
          <span>
            {phase === 'intro'
              ? `Discovering ${currentCard?.character.name ?? 'Friend'}...`
              : isCharacterRevealed
                ? `Hear ${currentCard?.character.name ?? 'Friend'}`
                : 'Tap to Hear Word'}
          </span>
          <span className="wpk-listen-btn__count">
            {Math.min(TARGETS_PER_BOARD, turnIndex + (isCharacterRevealed ? 1 : 0))} /{' '}
            {TARGETS_PER_BOARD}
          </span>
        </button>
      </div>

      <div className="wpk-stage" ref={stageRef}>
        <div
          className={`wpk-mystery-frame ${isCharacterRevealed ? 'is-found' : ''}`}
          style={{ width: frameSize, height: frameSize }}
          data-testid="peekaboo-mystery-frame"
        >
          {currentCard && (
            <div className="wpk-character-backdrop">
              <img
                src={assetUrl(currentCard.character.imagePath)}
                alt={isCharacterRevealed ? currentCard.character.name : 'Hidden character'}
                className={`wpk-character-img ${sealCharacterCompletely ? 'is-sealed' : ''}`}
                data-testid="peekaboo-character-img"
              />
            </div>
          )}

          <div
            className="wpk-tile-grid"
            role="group"
            aria-label="Word peekaboo grid"
            data-testid="peekaboo-tile-grid"
          >
            {currentCard?.tiles.map((tile) => {
              const isRevealed = revealedSet.has(tile.slotIndex);
              const isJustMatched = justMatchedSlot === tile.slotIndex;
              const isWrong = wrongSlot?.slotIndex === tile.slotIndex && phase === 'teach-mistake';

              return (
                <div
                  key={`${currentCard.cardUid}-${tile.slotIndex}-${tile.wordId}`}
                  className={`wpk-cell ${isRevealed ? 'is-revealed' : ''}`}
                >
                  <button
                    type="button"
                    disabled={phase !== 'playing' || isRevealed}
                    className={`wpk-word-card ${isJustMatched ? 'is-just-matched' : ''} ${
                      isWrong ? 'is-wrong' : ''
                    }`}
                    style={{ fontSize: wordFontSize }}
                    data-testid={`peekaboo-tile-${tile.wordId}`}
                    data-word-id={tile.wordId}
                    data-revealed={isRevealed ? 'true' : 'false'}
                    onClick={() => handleTileTap(tile)}
                  >
                    <span className="wpk-word-label">
                      {tile.display === 'I' ? <SerifCapitalI /> : tile.display}
                    </span>
                    {isWrong && <span className="wpk-wrong-caption">That&apos;s {tile.display}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className={`wpk-footer-bar ${isCharacterRevealed ? 'is-found' : ''}`}>
        <div className="wpk-pebble-track" aria-label="Revealed word tiles">
          {Array.from({ length: TARGETS_PER_BOARD }, (_, idx) => {
            const isDone = idx < turnIndex || isCharacterRevealed;
            const isCur = idx === turnIndex && !isCharacterRevealed;
            return (
              <span
                key={idx}
                className={`wpk-pebble-dot ${isDone ? 'is-done' : isCur ? 'is-current' : ''}`}
              />
            );
          })}
        </div>

        {phase === 'character-found' && currentCard ? (
          <>
            <span className="wpk-footer-copy" data-testid="peekaboo-found-copy">
              Congratulations! You found {currentCard.character.name}!
            </span>
            <button
              type="button"
              className="wpk-next-btn"
              onClick={handleNextFriend}
              data-testid="peekaboo-next-btn"
            >
              {cardIndex + 1 >= deck.length ? 'Finish & Celebrate!' : 'Next Friend →'}
            </button>
          </>
        ) : (
          <span className="wpk-footer-copy">
            Discovering {currentCard?.character.name ?? 'a friend'}!
          </span>
        )}
      </footer>

      <ThinkAgainOverlay
        open={phase === 'think-again'}
        title="Take a calm look!"
        hint={
          wrongSlot
            ? `That was "${wrongSlot.display}". Listen carefully to the word and look at every letter!`
            : 'Take a breath and listen carefully to the word!'
        }
        readyLabel="Keep Trying"
        startAgainLabel="Start Again"
        soundEnabled={soundEnabled}
        durationSeconds={2}
        onReady={handleResumeAfterThinkAgain}
        onStartAgain={handleRestartCurrentBoard}
      />

      {phase === 'won' && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wpk-win-title"
        >
          <div className="winner-modal" data-testid="peekaboo-winner-modal">
            <div className="winner-crown-wrap">
              <CrownIcon size={36} />
              <div className="winner-avatar-halo">
                <img src={getAvatarSrc(childProfile.avatar)} alt={childProfile.name} />
              </div>
            </div>
            <h2 id="wpk-win-title">
              {flawlessCount === deck.length
                ? `Super Reader, ${childProfile.name}!`
                : `Great Job, ${childProfile.name}!`}
            </h2>
            <p className="winner-subtitle">
              You read {wordsReadCount} words and discovered{' '}
              {deck.length === 1 ? deck[0]?.character.name : `all ${deck.length} hidden friends`}!
            </p>

            <div className="wpk-win-gallery">
              {deck.map((card) => (
                <div key={card.cardUid} className="wpk-win-card">
                  <img src={assetUrl(card.character.imagePath)} alt={card.character.name} />
                  <span>{card.character.name}</span>
                </div>
              ))}
            </div>

            <div className="winner-actions">
              {journeyContext ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => journeyContext.onActivityComplete()}
                  data-testid="peekaboo-journey-continue-btn"
                >
                  Continue Adventure →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePlayAgain}
                    data-testid="peekaboo-play-again-btn"
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
                      data-testid="peekaboo-win-hub-btn"
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, PawPipIcon, PebbleMark } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { WinnerModal, type PlayerStanding } from '../../components/WinnerModal';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import {
  getThemeBoardSummary,
  loadMemoryStatsRuns,
  recordCompletedMemoryGame,
  type MemoryGameRun,
  type RecordCompletionOutcome,
} from './memoryStats';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import type { MemoryGameConfig } from './MemorySetup';
import { playFlipSound, playMatchSound, playMismatchSound, playWinSound } from './soundEffects';
import { buildDeck, getBoardSizeSpec, getThemeSpec, type DeckCard } from './themes';

interface MemoryBoardProps {
  gameKey: number;
  config: MemoryGameConfig;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange?: (active: boolean) => void;
  journeyContext?: JourneyBoardContext;
}

type TurnPhase = 'idle' | 'resolving-match' | 'resolving-mismatch' | 'finished';

const ACTIVE_GAME_STORAGE_KEY = 'pebble.memory.active.v1';

interface SavedMemoryGameState {
  gameKey: number;
  roundNumber: number;
  deck: DeckCard[];
  matchedPairIds: Record<string, true>;
  scores: Record<string, number>;
  playerAttempts: Record<string, number>;
  totalAttempts: number;
  currentPlayerIdx: number;
  phase: TurnPhase;
}

function loadSavedGameState(gameKey: number): SavedMemoryGameState | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<SavedMemoryGameState>;
    if (
      candidate.gameKey !== gameKey ||
      !Array.isArray(candidate.deck) ||
      candidate.deck.length === 0 ||
      typeof candidate.matchedPairIds !== 'object' ||
      candidate.matchedPairIds === null ||
      typeof candidate.scores !== 'object' ||
      candidate.scores === null ||
      typeof candidate.currentPlayerIdx !== 'number'
    ) {
      return null;
    }
    const restoredPhase: TurnPhase = candidate.phase === 'finished' ? 'finished' : 'idle';
    const roundNumber =
      typeof candidate.roundNumber === 'number' && Number.isFinite(candidate.roundNumber)
        ? Math.max(1, Math.floor(candidate.roundNumber))
        : 1;
    const totalAttempts =
      typeof candidate.totalAttempts === 'number' && Number.isFinite(candidate.totalAttempts)
        ? Math.max(0, Math.floor(candidate.totalAttempts))
        : 0;
    const playerAttempts =
      typeof candidate.playerAttempts === 'object' && candidate.playerAttempts !== null
        ? candidate.playerAttempts
        : {};

    return {
      gameKey,
      roundNumber,
      deck: candidate.deck,
      matchedPairIds: candidate.matchedPairIds,
      scores: candidate.scores,
      playerAttempts,
      totalAttempts,
      currentPlayerIdx: candidate.currentPlayerIdx,
      phase: restoredPhase,
    };
  } catch {
    return null;
  }
}

export function clearSavedMemoryGame(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

interface CardDimensions {
  width: number;
  height: number;
  gap: number;
}

function buildInitialZeroMap(players: FamilyProfile[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const player of players) {
    map[player.id] = 0;
  }
  return map;
}

export function MemoryBoard({
  gameKey,
  config,
  profiles,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onGameActiveChange,
  journeyContext,
}: MemoryBoardProps) {
  const theme = useMemo(() => getThemeSpec(config.themeId), [config.themeId]);
  const boardSize = useMemo(() => getBoardSizeSpec(config.boardSizeId), [config.boardSizeId]);

  const players = useMemo(() => {
    const selected = config.playerIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is FamilyProfile => p !== undefined);
    return selected.length > 0 ? selected : profiles.slice(0, 2);
  }, [config.playerIds, profiles]);

  const [savedState] = useState<SavedMemoryGameState | null>(() => loadSavedGameState(gameKey));

  const [roundNumber, setRoundNumber] = useState<number>(() => savedState?.roundNumber ?? 1);
  const [deck, setDeck] = useState<DeckCard[]>(
    () => savedState?.deck ?? buildDeck(config.themeId, config.boardSizeId),
  );
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Record<string, true>>(
    () => savedState?.matchedPairIds ?? {},
  );
  const [justMatchedPairId, setJustMatchedPairId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(
    () => savedState?.scores ?? buildInitialZeroMap(players),
  );
  const [playerAttempts, setPlayerAttempts] = useState<Record<string, number>>(
    () => savedState?.playerAttempts ?? buildInitialZeroMap(players),
  );
  const [totalAttempts, setTotalAttempts] = useState<number>(() => savedState?.totalAttempts ?? 0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(() => savedState?.currentPlayerIdx ?? 0);
  const [phase, setPhase] = useState<TurnPhase>(() => savedState?.phase ?? 'idle');
  const [matchBurstCount, setMatchBurstCount] = useState(0);
  const [nextPlayerName, setNextPlayerName] = useState<string | null>(null);

  const [statsRuns, setStatsRuns] = useState<MemoryGameRun[]>(() => loadMemoryStatsRuns());
  const [completionOutcome, setCompletionOutcome] = useState<RecordCompletionOutcome | null>(() => {
    if (savedState?.phase !== 'finished') return null;
    return recordCompletedMemoryGame({
      roundKey: `${gameKey}-${savedState.roundNumber}`,
      themeId: config.themeId,
      boardSizeId: config.boardSizeId,
      pairs: boardSize.pairs,
      totalAttempts: Math.max(boardSize.pairs, savedState.totalAttempts),
      playerStats: players.map((p) => ({
        playerId: p.id,
        attempts: savedState.playerAttempts[p.id] ?? 0,
        matches: savedState.scores[p.id] ?? 0,
      })),
    });
  });

  const currentThemeSummary = useMemo(
    () => getThemeBoardSummary(statsRuns, config.themeId, config.boardSizeId),
    [config.boardSizeId, config.themeId, statsRuns],
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [cardDims, setCardDims] = useState<CardDimensions>(() => ({
    width: boardSize.rows >= 6 ? 88 : 108,
    height: boardSize.rows >= 6 ? 123 : 151,
    gap: boardSize.rows >= 6 ? 8 : 11,
  }));

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPendingTimer();
  }, [clearPendingTimer]);

  const journeyOnCompleteRef = useRef(journeyContext?.onActivityComplete);
  journeyOnCompleteRef.current = journeyContext?.onActivityComplete;
  const journeyCompletedFiredRef = useRef(false);
  const isJourneyMode = Boolean(journeyContext);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'finished');
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    if (!isJourneyMode || phase !== 'finished' || journeyCompletedFiredRef.current) return;
    const timer = window.setTimeout(() => {
      if (journeyCompletedFiredRef.current) return;
      journeyCompletedFiredRef.current = true;
      journeyOnCompleteRef.current?.();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [isJourneyMode, phase]);

  useEffect(() => {
    try {
      const snapshot: SavedMemoryGameState = {
        gameKey,
        roundNumber,
        deck,
        matchedPairIds,
        scores,
        playerAttempts,
        totalAttempts,
        currentPlayerIdx,
        phase: phase === 'finished' ? 'finished' : 'idle',
      };
      window.sessionStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [
    currentPlayerIdx,
    deck,
    gameKey,
    matchedPairIds,
    phase,
    playerAttempts,
    roundNumber,
    scores,
    totalAttempts,
  ]);

  // Measure the card grid container dynamically so every tall 2.5:3.5 card fits cleanly inside 100dvh
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const computeSize = () => {
      const rect = element.getBoundingClientRect();
      const stageW = Math.max(240, rect.width - 4);
      const stageH = Math.max(240, rect.height - 4);
      const gap = boardSize.rows >= 6 ? 8 : boardSize.cols === 4 && boardSize.rows <= 4 ? 14 : 11;

      const maxWidthPerCard = (stageW - (boardSize.cols - 1) * gap) / boardSize.cols;
      const maxHeightFromWidth = maxWidthPerCard * (3.5 / 2.5);
      const maxHeightFromStage = (stageH - (boardSize.rows - 1) * gap) / boardSize.rows;

      const cardH = Math.max(64, Math.floor(Math.min(maxHeightFromWidth, maxHeightFromStage)));
      const cardW = Math.max(46, Math.floor(cardH * (2.5 / 3.5)));

      setCardDims({ width: cardW, height: cardH, gap });
    };

    computeSize();
    const observer = new ResizeObserver(() => computeSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [boardSize.cols, boardSize.rows]);

  const restartGame = useCallback(() => {
    clearPendingTimer();
    setRoundNumber((r) => r + 1);
    setDeck(buildDeck(config.themeId, config.boardSizeId));
    setFlippedIds([]);
    setMatchedPairIds({});
    setJustMatchedPairId(null);
    setScores(buildInitialZeroMap(players));
    setPlayerAttempts(buildInitialZeroMap(players));
    setTotalAttempts(0);
    setCurrentPlayerIdx(0);
    setPhase('idle');
    setNextPlayerName(null);
    setCompletionOutcome(null);
    setStatsRuns(loadMemoryStatsRuns());
  }, [clearPendingTimer, config.boardSizeId, config.themeId, players]);

  const activePlayer = players[currentPlayerIdx % players.length] ?? players[0];
  const matchedPairsCount = Object.keys(matchedPairIds).length;

  const handleCardClick = (clickedCard: DeckCard) => {
    if (phase !== 'idle') return;
    if (matchedPairIds[clickedCard.pairId]) return;
    if (flippedIds.includes(clickedCard.uid)) return;
    if (flippedIds.length >= 2) return;

    playFlipSound(soundEnabled);

    if (flippedIds.length === 0) {
      setFlippedIds([clickedCard.uid]);
      return;
    }

    const firstCard = deck.find((c) => c.uid === flippedIds[0]);
    if (!firstCard) return;

    const pairFlipped = [firstCard.uid, clickedCard.uid];
    const nextTotalAttempts = totalAttempts + 1;
    const nextPlayerAttempts = {
      ...playerAttempts,
      [activePlayer.id]: (playerAttempts[activePlayer.id] ?? 0) + 1,
    };

    setFlippedIds(pairFlipped);
    setTotalAttempts(nextTotalAttempts);
    setPlayerAttempts(nextPlayerAttempts);

    if (firstCard.pairId === clickedCard.pairId) {
      // Match found: +1 point and active player gets another turn!
      const nextMatched = { ...matchedPairIds, [clickedCard.pairId]: true as const };
      const totalMatchedNow = Object.keys(nextMatched).length;
      const nextScores = {
        ...scores,
        [activePlayer.id]: (scores[activePlayer.id] ?? 0) + 1,
      };

      setMatchedPairIds(nextMatched);
      setJustMatchedPairId(clickedCard.pairId);
      setScores(nextScores);
      setMatchBurstCount((c) => c + 1);
      setPhase('resolving-match');
      playMatchSound(soundEnabled);

      clearPendingTimer();
      if (totalMatchedNow >= boardSize.pairs) {
        const outcome = recordCompletedMemoryGame({
          roundKey: `${gameKey}-${roundNumber}`,
          themeId: config.themeId,
          boardSizeId: config.boardSizeId,
          pairs: boardSize.pairs,
          totalAttempts: nextTotalAttempts,
          playerStats: players.map((p) => ({
            playerId: p.id,
            attempts: nextPlayerAttempts[p.id] ?? 0,
            matches: nextScores[p.id] ?? 0,
          })),
        });
        setCompletionOutcome(outcome);
        setStatsRuns(loadMemoryStatsRuns());

        timeoutRef.current = window.setTimeout(() => {
          setFlippedIds([]);
          setJustMatchedPairId(null);
          setPhase('finished');
          playWinSound(soundEnabled);
        }, 680);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setFlippedIds([]);
          setJustMatchedPairId(null);
          setPhase('idle');
        }, 760);
      }
      return;
    }

    // Mismatch: pause briefly so players memorize cards, then advance turn
    const nextIdx = (currentPlayerIdx + 1) % players.length;
    setNextPlayerName(players[nextIdx]?.name ?? activePlayer.name);
    setPhase('resolving-mismatch');
    playMismatchSound(soundEnabled);

    clearPendingTimer();
    timeoutRef.current = window.setTimeout(() => {
      setFlippedIds([]);
      setCurrentPlayerIdx(nextIdx);
      setNextPlayerName(null);
      setPhase('idle');
    }, 950);
  };

  const standings: PlayerStanding[] = players.map((player) => ({
    profile: player,
    score: scores[player.id] ?? 0,
    attempts: playerAttempts[player.id] ?? 0,
  }));

  let bannerClass = 'status-banner';
  let bannerText =
    flippedIds.length === 1
      ? `${activePlayer.name}: Pick a second card!`
      : `${activePlayer.name}'s Turn — Pick any 2 cards`;

  if (phase === 'resolving-match') {
    bannerClass = 'status-banner status-banner--match';
    bannerText =
      matchedPairsCount >= boardSize.pairs
        ? `MATCH! +1 POINT — Finished in ${totalAttempts} attempts!`
        : `MATCH! +1 POINT — ${activePlayer.name} goes again!`;
  } else if (phase === 'resolving-mismatch') {
    bannerClass = 'status-banner status-banner--mismatch';
    bannerText =
      players.length > 1 && nextPlayerName
        ? `Not a match — ${nextPlayerName}'s turn next`
        : 'Not a match — Try another pair';
  }

  return (
    <div className="app-shell app-shell--board">
      <ConfettiBurst
        active={matchBurstCount > 0 && phase === 'resolving-match'}
        mode="match"
        burstKey={matchBurstCount}
      />

      {/* Compact Top Utility Bar */}
      <header className="top-bar" style={{ minHeight: 42 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            aria-label={journeyContext ? 'Back to Activity Book' : 'Back to Game Hub'}
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          <BrandLogo size="sm" />
        </div>

        <div className="top-bar__right">
          {journeyContext && (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          )}
          <span className="section-pill" aria-label={`Pairs matched ${matchedPairsCount} of ${boardSize.pairs}`}>
            Pairs: <strong>{matchedPairsCount}</strong>/{boardSize.pairs}
          </span>
          {!journeyContext && (
            <span
              className="section-pill section-pill--attempts"
              aria-label={
                currentThemeSummary.bestAttempts !== null
                  ? `Attempts ${totalAttempts}, best record ${currentThemeSummary.bestAttempts}`
                  : `Attempts ${totalAttempts}`
              }
            >
              Attempts: <strong>{totalAttempts}</strong>
              {currentThemeSummary.bestAttempts !== null && (
                <span className="section-pill__best"> • Best {currentThemeSummary.bestAttempts}</span>
              )}
            </span>
          )}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
          {!journeyContext && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
            >
              <span>Setup</span>
            </button>
          )}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={restartGame}
          >
            <span>Restart</span>
          </button>
        </div>
      </header>

      {/* Prominent Multi-Player Scoreboard HUD */}
      <section
        className={`scoreboard-hud scoreboard-hud--${players.length}`}
        aria-label="Scoreboard"
      >
        {players.map((player, index) => {
          const isTurn = index === currentPlayerIdx % players.length && phase !== 'finished';
          const isCelebrating = isTurn && phase === 'resolving-match';
          const score = scores[player.id] ?? 0;
          const tries = playerAttempts[player.id] ?? 0;

          return (
            <div
              key={player.id}
              className={`player-score-card ${isTurn ? 'player-score-card--active' : ''} ${
                isCelebrating ? 'player-score-card--celebrating' : ''
              }`}
            >
              <div className="player-score-card__identity">
                <img
                  className="player-score-card__avatar"
                  src={getAvatarSrc(player.avatar)}
                  alt=""
                />
                <div className="player-score-card__meta">
                  <span className="player-score-card__name">{player.name}</span>
                  <div className="player-score-card__badge-row">
                    {isCelebrating ? (
                      <span className="turn-badge turn-badge--match">
                        {players.length === 1 ? 'Match!' : '+1 Point!'}
                      </span>
                    ) : isTurn ? (
                      <span className="turn-badge">Your Turn</span>
                    ) : (
                      <span className="turn-badge turn-badge--idle">Waiting</span>
                    )}
                    {players.length <= 3 && (
                      <span className="player-tries-meta">
                        {tries} {tries === 1 ? 'attempt' : 'attempts'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="pts-tile"
                aria-label={
                  players.length === 1
                    ? `${score} of ${boardSize.pairs} pairs`
                    : `${player.name} ${score} points`
                }
              >
                <span className="pts-tile__value">
                  {players.length === 1 ? `${score}/${boardSize.pairs}` : score}
                </span>
                <span className="pts-tile__label">
                  {players.length === 1 ? 'PAIRS' : 'PTS'}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Fixed-Height Celebration / Turn Banner */}
      <div className={bannerClass} role="status" aria-live="polite">
        <span>{bannerText}</span>
      </div>

      {/* Full-Viewport Portrait Card Grid Stage */}
      <main ref={stageRef} className="board-stage">
        <div
          className="card-grid"
          style={{
            gridTemplateColumns: `repeat(${boardSize.cols}, ${cardDims.width}px)`,
            gap: `${cardDims.gap}px`,
          }}
        >
          {deck.map((card, index) => {
            const isMatched = Boolean(matchedPairIds[card.pairId]);
            const isFlipped = isMatched || flippedIds.includes(card.uid);
            const isJustMatched = justMatchedPairId === card.pairId;

            return (
              <button
                key={card.uid}
                type="button"
                className={`memory-card-btn ${isFlipped ? 'memory-card-btn--flipped' : ''} ${
                  isMatched ? 'memory-card-btn--matched' : ''
                } ${isJustMatched ? 'memory-card-btn--just-matched' : ''}`}
                style={{ width: cardDims.width, height: cardDims.height }}
                onClick={() => handleCardClick(card)}
                disabled={phase !== 'idle' || isMatched || flippedIds.includes(card.uid)}
                aria-label={
                  isFlipped ? `${card.label}${isMatched ? ' (matched)' : ''}` : `Hidden card ${index + 1}`
                }
                aria-pressed={isFlipped}
              >
                <div className="memory-card__inner">
                  {/* Face-down Pebble Card Back */}
                  <div className="memory-card__face memory-card__back">
                    <div className="memory-card__medallion">
                      <PebbleMark size={Math.max(20, Math.round(cardDims.width * 0.32))} />
                    </div>
                  </div>

                  {/* Face-up Crisp Playing Card */}
                  <div className="memory-card__face memory-card__front">
                    <PawPipIcon className="card-corner-pip card-corner-pip--tl" />
                    <img
                      className="memory-card__character"
                      src={card.imageSrc}
                      alt={card.label}
                      loading="eager"
                    />
                    <PawPipIcon className="card-corner-pip card-corner-pip--br" />
                    {isMatched && (
                      <span className="card-matched-check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {phase === 'finished' && !journeyContext && (
        <WinnerModal
          standings={standings}
          totalPairs={boardSize.pairs}
          themeTitle={theme.title}
          boardSizeLabel={boardSize.label}
          completionOutcome={completionOutcome}
          onPlayAgain={restartGame}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
}

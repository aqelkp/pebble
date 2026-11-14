import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo, PawPipIcon, PebbleMark } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { WinnerModal, type PlayerStanding } from '../../components/WinnerModal';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import type { MemoryGameConfig } from './MemorySetup';
import { playFlipSound, playMatchSound, playMismatchSound, playWinSound } from './soundEffects';
import { buildDeck, getBoardSizeSpec, getThemeSpec, type DeckCard } from './themes';

interface MemoryBoardProps {
  config: MemoryGameConfig;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
}

type TurnPhase = 'idle' | 'resolving-match' | 'resolving-mismatch' | 'finished';

interface CardDimensions {
  width: number;
  height: number;
  gap: number;
}

function buildInitialScores(players: FamilyProfile[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const player of players) {
    scores[player.id] = 0;
  }
  return scores;
}

export function MemoryBoard({
  config,
  profiles,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
}: MemoryBoardProps) {
  const theme = useMemo(() => getThemeSpec(config.themeId), [config.themeId]);
  const boardSize = useMemo(() => getBoardSizeSpec(config.boardSizeId), [config.boardSizeId]);

  const players = useMemo(() => {
    const selected = config.playerIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is FamilyProfile => p !== undefined);
    return selected.length > 0 ? selected : profiles.slice(0, 2);
  }, [config.playerIds, profiles]);

  const [deck, setDeck] = useState<DeckCard[]>(() => buildDeck(config.themeId, config.boardSizeId));
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Record<string, true>>({});
  const [justMatchedPairId, setJustMatchedPairId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() => buildInitialScores(players));
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [phase, setPhase] = useState<TurnPhase>('idle');
  const [matchBurstCount, setMatchBurstCount] = useState(0);
  const [nextPlayerName, setNextPlayerName] = useState<string | null>(null);

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

  // Measure the card grid container dynamically so every tall 2.5:3.5 card fits cleanly inside 100dvh
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const computeSize = () => {
      const rect = element.getBoundingClientRect();
      const stageW = Math.max(240, rect.width - 4);
      const stageH = Math.max(240, rect.height - 4);
      const gap = boardSize.rows >= 6 ? 8 : boardSize.cols === 4 && boardSize.rows === 4 ? 14 : 11;

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
    setDeck(buildDeck(config.themeId, config.boardSizeId));
    setFlippedIds([]);
    setMatchedPairIds({});
    setJustMatchedPairId(null);
    setScores(buildInitialScores(players));
    setCurrentPlayerIdx(0);
    setPhase('idle');
    setNextPlayerName(null);
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
    setFlippedIds(pairFlipped);

    if (firstCard.pairId === clickedCard.pairId) {
      // Match found: +1 point and active player gets another turn!
      const nextMatched = { ...matchedPairIds, [clickedCard.pairId]: true as const };
      const totalMatchedNow = Object.keys(nextMatched).length;

      setMatchedPairIds(nextMatched);
      setJustMatchedPairId(clickedCard.pairId);
      setScores((prev) => ({
        ...prev,
        [activePlayer.id]: (prev[activePlayer.id] ?? 0) + 1,
      }));
      setMatchBurstCount((c) => c + 1);
      setPhase('resolving-match');
      playMatchSound(soundEnabled);

      clearPendingTimer();
      if (totalMatchedNow >= boardSize.pairs) {
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
        ? `MATCH! +1 POINT — All ${boardSize.pairs} pairs found!`
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
            aria-label="Back to Game Hub"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
          <BrandLogo size="sm" />
        </div>

        <div className="top-bar__right">
          <span className="section-pill" aria-label={`Pairs matched ${matchedPairsCount} of ${boardSize.pairs}`}>
            Pairs: <strong>{matchedPairsCount}</strong>/{boardSize.pairs}
          </span>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onChangeSetup}
          >
            <span>Setup</span>
          </button>
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
                  {isCelebrating ? (
                    <span className="turn-badge turn-badge--match">+1 Point!</span>
                  ) : isTurn ? (
                    <span className="turn-badge">Your Turn</span>
                  ) : (
                    <span className="turn-badge turn-badge--idle">Waiting</span>
                  )}
                </div>
              </div>

              <div className="pts-tile" aria-label={`${player.name} ${score} points`}>
                <span className="pts-tile__value">{score}</span>
                <span className="pts-tile__label">PTS</span>
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

      {phase === 'finished' && (
        <WinnerModal
          standings={standings}
          totalPairs={boardSize.pairs}
          themeTitle={theme.title}
          onPlayAgain={restartGame}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}
    </div>
  );
}

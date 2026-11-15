import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { ThinkAgainOverlay } from '../../components/ThinkAgainOverlay';
import { WinnerModal, type PlayerStanding } from '../../components/WinnerModal';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { preloadWordsAudio } from '../../utils/wordAudio';
import { WordFunArt } from './WordFunArt';
import type { WordGameConfig } from './WordFunSetup';
import {
  buildLetterTiles,
  buildWordRoundDeck,
  getWordEntryById,
  getWordPackSpec,
  type LetterTile,
  type WordEntry,
} from './wordBank';
import {
  playHintChime,
  playLetterPlaceSound,
  playRoundWinSound,
  playWordCompleteSound,
  playWrongLetterSound,
  speakWordPrompt,
} from './wordSounds';

interface WordFunBoardProps {
  gameKey: number;
  config: WordGameConfig;
  profiles: FamilyProfile[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange?: (active: boolean) => void;
}

type WordPhase = 'idle' | 'resolving-word' | 'resolving-miss' | 'finished';

const ACTIVE_WORD_STORAGE_KEY = 'pebble.wordfun.active.v1';

interface SavedWordGameState {
  gameKey: number;
  wordIds: string[];
  wordIdx: number;
  tiles: LetterTile[];
  placedTileUids: (string | null)[];
  scores: Record<string, number>;
  currentPlayerIdx: number;
  phase: WordPhase;
}

function isValidLetterTile(value: unknown): value is LetterTile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<LetterTile>;
  return (
    typeof candidate.uid === 'string' &&
    candidate.uid.length <= 32 &&
    typeof candidate.letter === 'string' &&
    /^[A-Z]$/.test(candidate.letter)
  );
}

function loadSavedWordState(gameKey: number): {
  words: WordEntry[];
  wordIdx: number;
  tiles: LetterTile[];
  placedTileUids: (string | null)[];
  scores: Record<string, number>;
  currentPlayerIdx: number;
  phase: WordPhase;
} | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_WORD_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<SavedWordGameState>;
    if (
      candidate.gameKey !== gameKey ||
      !Array.isArray(candidate.wordIds) ||
      candidate.wordIds.length === 0 ||
      candidate.wordIds.length > 20 ||
      typeof candidate.wordIdx !== 'number' ||
      !Number.isFinite(candidate.wordIdx) ||
      candidate.wordIdx < 0 ||
      !Array.isArray(candidate.tiles) ||
      candidate.tiles.length !== 6 ||
      !candidate.tiles.every(isValidLetterTile) ||
      !Array.isArray(candidate.placedTileUids) ||
      candidate.placedTileUids.length !== 3 ||
      !candidate.placedTileUids.every((u) => u === null || typeof u === 'string') ||
      typeof candidate.scores !== 'object' ||
      candidate.scores === null ||
      typeof candidate.currentPlayerIdx !== 'number' ||
      !Number.isFinite(candidate.currentPlayerIdx)
    ) {
      return null;
    }

    const words: WordEntry[] = [];
    for (const id of candidate.wordIds) {
      if (typeof id !== 'string') return null;
      const entry = getWordEntryById(id);
      if (!entry) return null;
      words.push(entry);
    }

    const validTileUids = new Set(candidate.tiles.map((t) => t.uid));
    const safePlacedTileUids = candidate.placedTileUids.map((uid) =>
      uid !== null && validTileUids.has(uid) ? uid : null,
    );

    const safeScores: Record<string, number> = {};
    for (const [key, val] of Object.entries(candidate.scores)) {
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
        safeScores[key] = Math.floor(val);
      }
    }

    const boundedWordIdx = Math.min(words.length - 1, Math.floor(candidate.wordIdx));
    const restoredPhase: WordPhase = candidate.phase === 'finished' ? 'finished' : 'idle';

    return {
      words,
      wordIdx: boundedWordIdx,
      tiles: candidate.tiles,
      placedTileUids: safePlacedTileUids,
      scores: safeScores,
      currentPlayerIdx: Math.max(0, Math.floor(candidate.currentPlayerIdx)),
      phase: restoredPhase,
    };
  } catch {
    return null;
  }
}

export function clearSavedWordGame(): void {
  try {
    window.sessionStorage.removeItem(ACTIVE_WORD_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

interface StageMetrics {
  artSize: number;
  slotSize: number;
  tileWidth: number;
  tileHeight: number;
  compact: boolean;
}

function buildInitialScores(players: FamilyProfile[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const player of players) {
    scores[player.id] = 0;
  }
  return scores;
}

export function WordFunBoard({
  gameKey,
  config,
  profiles,
  soundEnabled,
  onToggleSound,
  onChangeSetup,
  onBackToHub,
  onGameActiveChange,
}: WordFunBoardProps) {
  const pack = useMemo(() => getWordPackSpec(config.packId), [config.packId]);

  const players = useMemo(() => {
    const selected = config.playerIds
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is FamilyProfile => p !== undefined);
    return selected.length > 0 ? selected : profiles.slice(0, 2);
  }, [config.playerIds, profiles]);

  const [savedState] = useState(() => loadSavedWordState(gameKey));

  const [words, setWords] = useState<WordEntry[]>(
    () => savedState?.words ?? buildWordRoundDeck(config.packId, config.roundSizeId),
  );
  const [wordIdx, setWordIdx] = useState<number>(() => savedState?.wordIdx ?? 0);
  const [tiles, setTiles] = useState<LetterTile[]>(
    () => savedState?.tiles ?? buildLetterTiles(words[0]?.word ?? 'CAT', 0),
  );
  const [placedTileUids, setPlacedTileUids] = useState<(string | null)[]>(
    () => savedState?.placedTileUids ?? [null, null, null],
  );
  const [scores, setScores] = useState<Record<string, number>>(
    () => savedState?.scores ?? buildInitialScores(players),
  );
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(
    () => savedState?.currentPlayerIdx ?? 0,
  );
  const [phase, setPhase] = useState<WordPhase>(() => savedState?.phase ?? 'idle');
  const [wrongTileUid, setWrongTileUid] = useState<string | null>(null);
  const [wrongLetter, setWrongLetter] = useState<string | null>(null);
  const [hintTileUid, setHintTileUid] = useState<string | null>(null);
  const [nextPlayerName, setNextPlayerName] = useState<string | null>(null);
  const [burstCount, setBurstCount] = useState<number>(0);
  const [thinkAgainHint, setThinkAgainHint] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const [metrics, setMetrics] = useState<StageMetrics>({
    artSize: 160,
    slotSize: 82,
    tileWidth: 128,
    tileHeight: 72,
    compact: false,
  });

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [clearPendingTimer]);

  useEffect(() => {
    onGameActiveChange?.(phase !== 'finished');
  }, [onGameActiveChange, phase]);

  useEffect(() => {
    try {
      const snapshot: SavedWordGameState = {
        gameKey,
        wordIds: words.map((w) => w.id),
        wordIdx,
        tiles,
        placedTileUids,
        scores,
        currentPlayerIdx,
        phase: phase === 'finished' ? 'finished' : 'idle',
      };
      window.sessionStorage.setItem(ACTIVE_WORD_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [currentPlayerIdx, gameKey, phase, placedTileUids, scores, tiles, wordIdx, words]);

  // Dynamically size illustration, slots, and 3x2 wooden tiles so 100% fits inside 100dvh
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const computeMetrics = () => {
      const rect = element.getBoundingClientRect();
      const stageW = Math.max(260, rect.width - 8);
      const stageH = Math.max(300, rect.height - 8);
      const compact = stageH < 560;

      const artSize = Math.max(82, Math.min(180, Math.floor(stageH * 0.23)));
      const slotSize = Math.max(
        54,
        Math.min(90, Math.floor(Math.min(stageH * 0.115, (stageW - 44) / 3.4))),
      );
      const tileHeight = Math.max(46, Math.min(76, Math.floor(stageH * 0.098)));
      const tileWidth = Math.max(
        80,
        Math.min(156, Math.floor((Math.min(stageW, 520) - 28) / 3)),
      );

      setMetrics({ artSize, slotSize, tileWidth, tileHeight, compact });
    };

    computeMetrics();
    const observer = new ResizeObserver(() => computeMetrics());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const restartGame = useCallback(() => {
    clearPendingTimer();
    const freshWords = buildWordRoundDeck(config.packId, config.roundSizeId);
    setWords(freshWords);
    setWordIdx(0);
    setTiles(buildLetterTiles(freshWords[0]?.word ?? 'CAT', 0));
    setPlacedTileUids([null, null, null]);
    setScores(buildInitialScores(players));
    setCurrentPlayerIdx(0);
    setPhase('idle');
    setWrongTileUid(null);
    setWrongLetter(null);
    setHintTileUid(null);
    setNextPlayerName(null);
  }, [clearPendingTimer, config.packId, config.roundSizeId, players]);

  const currentWord = words[wordIdx] ?? words[0];

  // Silently preload MP3 clips for the current round deck
  useEffect(() => {
    if (words.length === 0) return;
    preloadWordsAudio(words.map((w) => w.id));
  }, [words]);
  const activePlayer = players[currentPlayerIdx % players.length] ?? players[0];
  const nextEmptySlot = placedTileUids.findIndex((uid) => uid === null);
  const completedWordsCount =
    phase === 'finished'
      ? words.length
      : phase === 'resolving-word'
        ? wordIdx + 1
        : wordIdx;

  const handleTileTap = useCallback(
    (tile: LetterTile) => {
      if (phase !== 'idle' || !currentWord) return;
      if (placedTileUids.includes(tile.uid)) return;

      const slotIdx = placedTileUids.findIndex((uid) => uid === null);
      if (slotIdx === -1) return;

      const expectedLetter = currentWord.word[slotIdx];

      if (tile.letter === expectedLetter) {
        const updatedSlots = [...placedTileUids];
        updatedSlots[slotIdx] = tile.uid;
        setPlacedTileUids(updatedSlots);
        setWrongTileUid(null);
        setWrongLetter(null);
        setHintTileUid(null);

        if (slotIdx < 2) {
          playLetterPlaceSound(slotIdx, soundEnabled);
          return;
        }

        // All 3 letters placed — award +1 point!
        setScores((prev) => ({
          ...prev,
          [activePlayer.id]: (prev[activePlayer.id] ?? 0) + 1,
        }));
        setBurstCount((c) => c + 1);
        setPhase('resolving-word');
        playWordCompleteSound(soundEnabled);

        clearPendingTimer();
        const isLastWord = wordIdx + 1 >= words.length;
        if (isLastWord) {
          timeoutRef.current = window.setTimeout(() => {
            setPhase('finished');
            playRoundWinSound(soundEnabled);
          }, 920);
        } else {
          timeoutRef.current = window.setTimeout(() => {
            const nextWordIndex = wordIdx + 1;
            const nextWord = words[nextWordIndex];
            setWordIdx(nextWordIndex);
            setTiles(buildLetterTiles(nextWord?.word ?? 'CAT', nextWordIndex));
            setPlacedTileUids([null, null, null]);
            setCurrentPlayerIdx((idx) => (idx + 1) % players.length);
            setPhase('idle');
          }, 920);
        }
        return;
      }

      // Wrong letter tapped
      setWrongTileUid(tile.uid);
      setWrongLetter(tile.letter);
      setHintTileUid(null);
      playWrongLetterSound(soundEnabled);

      clearPendingTimer();
      if (players.length > 1) {
        const nextIdx = (currentPlayerIdx + 1) % players.length;
        setNextPlayerName(players[nextIdx]?.name ?? activePlayer.name);
        setPhase('resolving-miss');
        timeoutRef.current = window.setTimeout(() => {
          setWrongTileUid(null);
          setWrongLetter(null);
          setNextPlayerName(null);
          setCurrentPlayerIdx(nextIdx);
          setPhase('idle');
        }, 860);
      } else {
        setPhase('resolving-miss');
        setThinkAgainHint(
          `Not "${tile.letter}" — listen to the word and pick the next letter!`,
        );
      }
    },
    [
      activePlayer.id,
      activePlayer.name,
      clearPendingTimer,
      currentPlayerIdx,
      currentWord,
      phase,
      placedTileUids,
      players,
      soundEnabled,
      wordIdx,
      words,
    ],
  );

  // Allow keyboard A-Z input for accessibility and desktop/tablet keyboard play
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'idle') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      if (!/^[A-Z]$/.test(key)) return;
      const candidateTile = tiles.find(
        (t) => t.letter === key && !placedTileUids.includes(t.uid),
      );
      if (candidateTile) {
        event.preventDefault();
        handleTileTap(candidateTile);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTileTap, phase, placedTileUids, tiles]);

  const handleHint = () => {
    if (phase !== 'idle' || !currentWord || nextEmptySlot === -1) return;
    const neededLetter = currentWord.word[nextEmptySlot];
    const matchingTile = tiles.find(
      (t) => t.letter === neededLetter && !placedTileUids.includes(t.uid),
    );
    if (matchingTile) {
      setHintTileUid(matchingTile.uid);
      playHintChime(soundEnabled);
    }
  };

  const handleHearWord = () => {
    if (!currentWord) return;
    speakWordPrompt(currentWord.word, currentWord.clue, soundEnabled, currentWord.id);
  };

  const standings: PlayerStanding[] = players.map((player) => ({
    profile: player,
    score: scores[player.id] ?? 0,
  }));

  const lettersPlacedCount = placedTileUids.filter((u) => u !== null).length;
  let bannerClass = 'status-banner';
  let bannerText =
    lettersPlacedCount === 0
      ? `${activePlayer.name}'s Turn — Tap letters to spell the picture!`
      : `${activePlayer.name}: Nice! Pick letter ${lettersPlacedCount + 1} of 3`;

  if (phase === 'resolving-word' && currentWord) {
    bannerClass = 'status-banner status-banner--match';
    bannerText = `WORD COMPLETE! +1 POINT — ${currentWord.word}!`;
  } else if (phase === 'resolving-miss') {
    bannerClass = 'status-banner status-banner--mismatch';
    bannerText =
      players.length > 1 && nextPlayerName
        ? `Not "${wrongLetter ?? '?'}" — ${nextPlayerName}'s turn to help!`
        : `Not "${wrongLetter ?? '?'}" — Try another letter block!`;
  }

  return (
    <div className="app-shell app-shell--board">
      <ConfettiBurst
        active={burstCount > 0 && phase === 'resolving-word'}
        mode="match"
        burstKey={burstCount}
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
          <span
            className="section-pill"
            aria-label={`Words completed ${completedWordsCount} of ${words.length}`}
          >
            Words: <strong>{completedWordsCount}</strong>/{words.length}
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
          const isCelebrating = isTurn && phase === 'resolving-word';
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
                    <span className="turn-badge turn-badge--match">
                      {players.length === 1 ? 'Word Built!' : '+1 Point!'}
                    </span>
                  ) : isTurn ? (
                    <span className="turn-badge">Your Turn</span>
                  ) : (
                    <span className="turn-badge turn-badge--idle">Waiting</span>
                  )}
                </div>
              </div>

              <div
                className="pts-tile"
                aria-label={
                  players.length === 1
                    ? `${score} of ${words.length} words`
                    : `${player.name} ${score} points`
                }
              >
                <span className="pts-tile__value">
                  {players.length === 1 ? `${score}/${words.length}` : score}
                </span>
                <span className="pts-tile__label">
                  {players.length === 1 ? 'WORDS' : 'PTS'}
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

      {/* Full-Height Portrait Word Stage */}
      {currentWord && (
        <main ref={stageRef} className="board-stage wf-stage">
          <div className={`wf-stage__inner ${metrics.compact ? 'wf-stage__inner--compact' : ''}`}>
            {/* 1. Cozy Picture Clue Card */}
            <section
              className={`wf-clue-card ${
                phase === 'resolving-word' ? 'wf-clue-card--celebrating' : ''
              }`}
              aria-label={`Picture clue: ${currentWord.clue}`}
            >
              <div className="wf-clue-card__top">
                <span className="badge-pill badge-pill--honey">
                  Word {Math.min(words.length, wordIdx + 1)} of {words.length}
                </span>
                <div className="wf-clue-card__actions">
                  <button
                    type="button"
                    className="wf-helper-btn"
                    onClick={handleHearWord}
                    aria-label="Hear word clue"
                  >
                    <span aria-hidden="true">🔊</span>
                    <span>Hear Word</span>
                  </button>
                  {config.helperMode === 'sound-out' && (
                    <button
                      type="button"
                      className="wf-helper-btn wf-helper-btn--mint"
                      onClick={handleHint}
                      disabled={phase !== 'idle' || nextEmptySlot === -1}
                      aria-label="Highlight next letter"
                    >
                      <span>Hint</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="wf-clue-card__art">
                <WordFunArt id={currentWord.id} size={metrics.artSize} />
              </div>

              <p className="wf-clue-card__caption">{currentWord.clue}</p>
            </section>

            {/* 2. Three Rounded Word Slots */}
            <div className="wf-slots-row" role="group" aria-label="Three-letter word slots">
              {[0, 1, 2].map((slotIdx) => {
                const tileUid = placedTileUids[slotIdx];
                const placedTile = tileUid ? tiles.find((t) => t.uid === tileUid) : undefined;
                const isNextSlot = phase === 'idle' && slotIdx === nextEmptySlot;
                const isWordDone = phase === 'resolving-word';
                const guideLetter =
                  config.helperMode === 'letter-trace' ? currentWord.word[slotIdx] : null;

                return (
                  <div
                    key={slotIdx}
                    className={`wf-slot ${placedTile ? 'wf-slot--filled' : ''} ${
                      isNextSlot ? 'wf-slot--active' : ''
                    } ${isWordDone ? 'wf-slot--celebrating' : ''}`}
                    style={{
                      width: metrics.slotSize,
                      height: Math.round(metrics.slotSize * 1.06),
                    }}
                    aria-label={
                      placedTile
                        ? `Letter ${slotIdx + 1}: ${placedTile.letter}`
                        : `Empty letter slot ${slotIdx + 1}`
                    }
                  >
                    {placedTile ? (
                      <span className="wf-slot__letter">{placedTile.letter}</span>
                    ) : guideLetter ? (
                      <span className="wf-slot__ghost" aria-hidden="true">
                        {guideLetter}
                      </span>
                    ) : (
                      <span className="wf-slot__dot" aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. Tactile 3x2 Rounded Letter Block Tray */}
            <div className="wf-tiles-tray" role="group" aria-label="Letter blocks">
              {tiles.map((tile) => {
                const isUsed = placedTileUids.includes(tile.uid);
                const isWrong = wrongTileUid === tile.uid;
                const isHinted = hintTileUid === tile.uid && !isUsed;

                return (
                  <button
                    key={tile.uid}
                    type="button"
                    className={`wf-letter-btn ${isUsed ? 'wf-letter-btn--used' : ''} ${
                      isWrong ? 'wf-letter-btn--wrong' : ''
                    } ${isHinted ? 'wf-letter-btn--hint' : ''}`}
                    style={{
                      width: metrics.tileWidth,
                      height: metrics.tileHeight,
                    }}
                    disabled={phase !== 'idle' || isUsed}
                    onClick={() => handleTileTap(tile)}
                    aria-label={`Letter ${tile.letter}${isUsed ? ' (placed)' : ''}`}
                  >
                    <span className="wf-letter-btn__char">{tile.letter}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {phase === 'finished' && (
        <WinnerModal
          standings={standings}
          totalPairs={words.length}
          themeTitle={pack.title}
          unitLabel="words"
          onPlayAgain={restartGame}
          onChangeSetup={onChangeSetup}
          onBackToHub={onBackToHub}
        />
      )}

      <ThinkAgainOverlay
        open={thinkAgainHint !== null}
        hint={thinkAgainHint ?? undefined}
        soundEnabled={soundEnabled}
        onReady={() => {
          setThinkAgainHint(null);
          setWrongTileUid(null);
          setWrongLetter(null);
          setPhase('idle');
        }}
      />
    </div>
  );
}

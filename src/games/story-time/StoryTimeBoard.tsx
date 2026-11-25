import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfettiBurst } from '../../components/ConfettiBurst';
import { GameHelpButton } from '../../components/GameHelpButton';
import {
  SynchronizedReadAlong,
  useSynchronizedNarration,
} from '../../components/SynchronizedReadAlong';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import type { JourneyBoardContext } from '../../journey/journeyTypes';
import { recordLearningSession } from '../../learning/learningStore';
import { assetUrl } from '../../utils/assets';
import { preloadAudioPaths, stopAllSpokenAudio } from '../../utils/wordAudio';
import { getNextStoryBook, getStoryBook, resolveStoryWordAudioPath } from './storyBooks';
import { playPageTurnSound, playStoryCompleteChime } from './storySounds';
import { STORY_COMPLEXITY_META, type StoryBookId, type StoryTimeConfig } from './storyTypes';
import './StoryTimeBoard.css';

interface StoryTimeBoardProps {
  gameKey: number;
  config: StoryTimeConfig;
  childProfile: FamilyProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
  onGameActiveChange: (active: boolean) => void;
  onRequestHelp?: () => void;
  journeyContext?: JourneyBoardContext;
}

export function StoryTimeBoard({
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
}: StoryTimeBoardProps) {
  const [activeStoryId, setActiveStoryId] = useState<StoryBookId>(config.storyId);
  const [pageIndex, setPageIndex] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);

  const book = getStoryBook(activeStoryId);
  const totalPages = book.pages.length;
  const currentPage = book.pages[pageIndex] ?? book.pages[0];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;
  const tierMeta = STORY_COMPLEXITY_META[book.complexityTier];

  useEffect(() => {
    setActiveStoryId(config.storyId);
    setPageIndex(0);
    setStoryDone(false);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
  }, [config.storyId, gameKey]);

  useEffect(() => {
    onGameActiveChange(!storyDone);
  }, [onGameActiveChange, storyDone]);

  useEffect(() => {
    return () => {
      stopAllSpokenAudio();
    };
  }, []);

  // Preload next page illustration and narration audio for instant page turns
  useEffect(() => {
    const next = book.pages[pageIndex + 1];
    if (!next) return;
    const img = new Image();
    img.src = assetUrl(next.imagePath);
    preloadAudioPaths([next.audioPath]);
  }, [book.pages, pageIndex]);

  const narration = useSynchronizedNarration({
    audioPath: currentPage.audioPath,
    durationMs: currentPage.durationMs,
    words: currentPage.words,
    clipKey: `${gameKey}-${activeStoryId}-p${currentPage.pageNumber}`,
    soundEnabled: soundEnabled && !storyDone,
    autoPlay: config.autoPlayNarration && !storyDone,
  });

  const handleFinishStory = useCallback(() => {
    narration.stop();
    stopAllSpokenAudio();
    playStoryCompleteChime(soundEnabled);
    setConfettiKey((k) => k + 1);
    setStoryDone(true);

    if (!loggedRef.current) {
      loggedRef.current = true;
      recordLearningSession({
        playerId: childProfile.id,
        gameId: 'story-time',
        mode: `${book.id}-${book.complexityTier}`,
        totalAttempts: totalPages,
        correctAttempts: totalPages,
        mistakes: 0,
        flawless: true,
        durationMs: Math.max(1000, Date.now() - startedAtRef.current),
      });
    }

    if (journeyContext) {
      journeyContext.onActivityComplete();
    }
  }, [
    book.title,
    childProfile.id,
    journeyContext,
    narration,
    soundEnabled,
    tierMeta.shortBadge,
    totalPages,
  ]);

  const handlePrevPage = () => {
    if (isFirstPage) return;
    narration.stop();
    playPageTurnSound(soundEnabled);
    setPageIndex((i) => Math.max(0, i - 1));
  };

  const handleNextPage = () => {
    if (isLastPage) {
      handleFinishStory();
      return;
    }
    narration.stop();
    playPageTurnSound(soundEnabled);
    setPageIndex((i) => Math.min(totalPages - 1, i + 1));
  };

  const handleReadAgainBook = () => {
    setStoryDone(false);
    setPageIndex(0);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
  };

  const handleReadNextStory = () => {
    const nextBook = getNextStoryBook(activeStoryId);
    setActiveStoryId(nextBook.id);
    setStoryDone(false);
    setPageIndex(0);
    startedAtRef.current = Date.now();
    loggedRef.current = false;
  };

  const childDisplayName =
    childProfile.name && childProfile.name !== 'Child' ? childProfile.name : 'Reader';

  return (
    <div
      className="story-board-page"
      data-testid="story-time-board"
      style={{ '--story-accent': book.accentColor } as React.CSSProperties}
    >
      <ConfettiBurst active={confettiKey > 0} burstKey={confettiKey} mode="win" />

      <header className="top-bar story-top-bar">
        <button
          type="button"
          className="icon-pill-btn icon-pill-btn--compact"
          data-testid="story-board-back"
          onClick={journeyContext ? onBackToHub : onChangeSetup}
        >
          <span aria-hidden="true">←</span>
          <span>{journeyContext ? 'Book' : 'Stories'}</span>
        </button>

        <div className="story-header-center">
          <span className="story-header-title" data-testid="story-book-title">
            {book.title}
          </span>
          <div
            className="story-page-dots"
            aria-label={`Page ${currentPage.pageNumber} of ${totalPages}`}
            data-testid="story-page-indicator"
          >
            {book.pages.map((p, idx) => (
              <span
                key={p.pageNumber}
                className={`story-page-dot ${
                  idx === pageIndex ? 'is-current' : idx < pageIndex ? 'is-done' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="story-header-actions">
          {onRequestHelp ? <GameHelpButton onClick={onRequestHelp} /> : null}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Turn sound on'}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
          </button>
        </div>
      </header>

      <main className="story-stage">
        <div className="story-picture-frame" key={`${book.id}-${currentPage.pageNumber}`}>
          <img
            src={assetUrl(currentPage.imagePath)}
            alt={`Page ${currentPage.pageNumber} of ${book.title}`}
            className="story-picture-img"
            data-testid="story-page-image"
          />
          <span className="story-page-chip">
            Page {currentPage.pageNumber} of {totalPages}
          </span>
          <span className="story-tier-chip">{tierMeta.shortBadge}</span>
        </div>

        <section
          className="story-text-card"
          aria-label={`Story text for page ${currentPage.pageNumber}`}
        >
          <div className="story-text-meta">
            <span className="story-read-hint">
              {narration.isPlaying
                ? 'Listening & Reading Along…'
                : 'Tap any word to hear it!'}
            </span>
            <button
              type="button"
              className="story-replay-pill"
              data-testid="story-replay-page-btn"
              onClick={narration.replay}
              aria-label="Read this page again"
            >
              <span aria-hidden="true">🔊</span>
              <span>{narration.isPlaying ? 'Restart' : 'Read Again'}</span>
            </button>
          </div>

          <div className="story-text-body">
            <SynchronizedReadAlong
              words={currentPage.words}
              isPlaying={narration.isPlaying}
              isWaitingAudio={narration.isWaitingAudio}
              elapsedMs={narration.elapsedMs}
              soundEnabled={soundEnabled}
              resolveWordAudioPath={resolveStoryWordAudioPath}
              onWordTapStart={narration.stop}
              size="story"
            />
          </div>
        </section>

        <nav className="story-nav-dock" aria-label="Story page controls">
          <button
            type="button"
            className="btn-secondary story-nav-btn story-nav-btn--prev"
            data-testid="story-prev-page-btn"
            disabled={isFirstPage}
            onClick={handlePrevPage}
          >
            ← Back
          </button>

          <button
            type="button"
            className="btn-primary story-nav-btn story-nav-btn--next"
            data-testid="story-next-page-btn"
            onClick={handleNextPage}
          >
            {isLastPage ? 'Finish Story! →' : 'Next Page →'}
          </button>
        </nav>
      </main>

      {storyDone && !journeyContext ? (
        <div
          className="story-complete-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-complete-heading"
          data-testid="story-complete-modal"
        >
          <div className="story-complete-card">
            <div className="story-complete-cover">
              <img src={assetUrl(book.pages[totalPages - 1].imagePath)} alt={book.title} />
            </div>
            <span className="badge-pill badge-pill--mint">Story Complete!</span>
            <h2 id="story-complete-heading">Great Reading, {childDisplayName}!</h2>
            <p>
              You finished all {totalPages} pages of <strong>{book.title}</strong>!
            </p>
            <div className="story-complete-actions">
              <button
                type="button"
                className="btn-secondary"
                data-testid="story-read-again-btn"
                onClick={handleReadAgainBook}
              >
                Read Again
              </button>
              <button
                type="button"
                className="btn-primary"
                data-testid="story-next-book-btn"
                onClick={handleReadNextStory}
              >
                Next Story →
              </button>
            </div>
            <button
              type="button"
              className="story-complete-shelf-link"
              onClick={onChangeSetup}
            >
              Choose Another Story
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { CrownIcon, PebbleMark } from '../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import { getChapterSpec } from '../journey/curriculum';
import { preloadJourneyVoiceClip } from '../journey/voiceInstructions';
import {
  ACTIVITIES_PER_CHAPTER,
  TOTAL_CHAPTERS,
  type JourneyActivity,
  type JourneyProgressState,
} from '../journey/journeyTypes';
import { assetUrl } from '../utils/assets';

interface ActivityBookPageProps {
  childProfile: FamilyProfile;
  curriculum: JourneyActivity[];
  journeyState: JourneyProgressState;
  onStartActivity: (activity: JourneyActivity) => void;
  onOpenParentGate: () => void;
}

export function ActivityBookPage({
  childProfile,
  curriculum,
  journeyState,
  onStartActivity,
  onOpenParentGate,
}: ActivityBookPageProps) {
  const currentActivity =
    curriculum[journeyState.currentActivityIndex] ?? curriculum[0];

  const [viewedChapter, setViewedChapter] = useState<number>(
    currentActivity?.chapterNumber ?? 1,
  );

  useEffect(() => {
    if (currentActivity) {
      setViewedChapter(currentActivity.chapterNumber);
      preloadJourneyVoiceClip(currentActivity.voiceClipId);
    }
  }, [currentActivity?.chapterNumber, currentActivity?.voiceClipId]);

  const completedSet = useMemo(
    () => new Set<number>(journeyState.completedActivityIndices),
    [journeyState.completedActivityIndices],
  );

  const chapterSpec = useMemo(
    () => getChapterSpec(viewedChapter),
    [viewedChapter],
  );

  const chapterActivities = useMemo(() => {
    const startIdx = (viewedChapter - 1) * ACTIVITIES_PER_CHAPTER;
    return curriculum.slice(startIdx, startIdx + ACTIVITIES_PER_CHAPTER);
  }, [curriculum, viewedChapter]);

  const doneInChapter = useMemo(
    () =>
      chapterActivities.reduce(
        (acc, act) => (completedSet.has(act.index) ? acc + 1 : acc),
        0,
      ),
    [chapterActivities, completedSet],
  );

  const coveredInSelectedCount = useMemo(() => {
    const coveredSet = new Set(journeyState.coveredLetters);
    return journeyState.settings.selectedLetters.filter((letter) =>
      coveredSet.has(letter),
    ).length;
  }, [journeyState.coveredLetters, journeyState.settings.selectedLetters]);

  const isDefaultChildName =
    childProfile.name.trim().toLowerCase() === 'child';
  const subtitle = isDefaultChildName
    ? 'Welcome to Pebble! • Guided Learning Journey'
    : 'Guided Learning Journey • One fun step at a time';
  const chapterProgressPct = Math.round(
    (doneInChapter / ACTIVITIES_PER_CHAPTER) * 100,
  );
  const durationLabel =
    journeyState.settings.durationMode === 'short' ? '~2 min' : '~4 min';

  return (
    <div className="ab-shell">
      <header className="ab-header">
        <div className="ab-header__brand">
          <PebbleMark size={38} />
          <div className="ab-header__title-stack">
            <h1>{childProfile.name}&apos;s Activity Book</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="ab-header__actions">
          <div className="ab-child-chip" aria-label={`Active learner ${childProfile.name}`}>
            <img
              className="ab-child-chip__avatar"
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
            />
            <span>{childProfile.name}</span>
          </div>

          <button
            type="button"
            className="icon-pill-btn"
            onClick={onOpenParentGate}
            aria-label="Open Parent Settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="10" rx="2.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span>Parent</span>
          </button>
        </div>
      </header>

      <section className="ab-chapter-card" aria-label="Chapter progress">
        <div className="ab-chapter-card__top">
          <button
            type="button"
            className="ab-chapter-nav-btn"
            aria-label="Previous chapter"
            disabled={viewedChapter <= 1}
            onClick={() => setViewedChapter((ch) => Math.max(1, ch - 1))}
          >
            ‹
          </button>

          <div className="ab-chapter-card__meta">
            <div className="ab-chapter-card__kicker-row">
              <span className="section-pill section-pill--journey">
                Chapter {chapterSpec.chapterNumber} of {TOTAL_CHAPTERS}
              </span>
              <span className="ab-chapter-card__count">
                {doneInChapter} / {ACTIVITIES_PER_CHAPTER} completed
              </span>
            </div>
            <h2>{chapterSpec.title}</h2>
            <p>{chapterSpec.subtitle}</p>
          </div>

          <button
            type="button"
            className="ab-chapter-nav-btn"
            aria-label="Next chapter"
            disabled={viewedChapter >= TOTAL_CHAPTERS}
            onClick={() =>
              setViewedChapter((ch) => Math.min(TOTAL_CHAPTERS, ch + 1))
            }
          >
            ›
          </button>
        </div>

        <div className="ab-chapter-card__bottom">
          <div className="journey-progress-track" aria-hidden="true">
            <div
              className="journey-progress-fill"
              style={{ width: `${chapterProgressPct}%` }}
            />
          </div>
          <div className="ab-chapter-card__pills">
            <span className="badge-pill badge-pill--honey">
              <CrownIcon size={16} />
              <span>
                {journeyState.completedActivityIndices.length}{' '}
                {journeyState.completedActivityIndices.length === 1 ? 'Sticker' : 'Stickers'}
              </span>
            </span>
            <span className="badge-pill badge-pill--mint">
              A–Z Covered: {coveredInSelectedCount} /{' '}
              {journeyState.settings.selectedLetters.length}
            </span>
            <span className="badge-pill badge-pill--indigo">
              {journeyState.settings.enabledGames.length} Worlds Mix
            </span>
          </div>
        </div>
      </section>

      {currentActivity && (
        <section className="ab-hero-card" aria-label="Up Next activity">
          <div className="ab-hero-card__art">
            <img
              src={assetUrl(currentActivity.artPath)}
              alt={currentActivity.title}
            />
          </div>

          <div className="ab-hero-card__body">
            <div className="ab-hero-card__badges">
              <span className="badge-pill badge-pill--indigo">
                Activity #{currentActivity.activityNumber} • Up Next
              </span>
              {currentActivity.isNewGameIntro && (
                <span className="badge-pill badge-pill--coral" data-testid="hero-new-game-badge">
                  New Game! • Welcome Lesson
                </span>
              )}
              {currentActivity.isFunBreak && (
                <span className="badge-pill badge-pill--coral">Fun Break</span>
              )}
              <span className="badge-pill badge-pill--mint">
                {durationLabel}
              </span>
            </div>
            <h2>
              {currentActivity.title}: {currentActivity.subtitle}
            </h2>
            <p>{currentActivity.detailLine}</p>
            <button
              type="button"
              className="btn-primary ab-hero-card__cta"
              onClick={() => onStartActivity(currentActivity)}
            >
              Play Activity #{currentActivity.activityNumber} →
            </button>
          </div>
        </section>
      )}

      <section aria-label={`Chapter ${chapterSpec.chapterNumber} activities`}>
        <div className="ab-path-header">
          <h3>
            Chapter {chapterSpec.chapterNumber} Path ({ACTIVITIES_PER_CHAPTER} Mini-Lessons)
          </h3>
          <span>Complete one activity at a time to unlock the next</span>
        </div>

        <div className="ab-grid">
          {chapterActivities.map((act) => {
            const isDone = completedSet.has(act.index);
            const isCurrent = act.index === journeyState.currentActivityIndex;
            const isLocked = !isDone && !isCurrent;
            const statusClass = isCurrent
              ? 'ab-node--current'
              : isDone
                ? 'ab-node--done'
                : 'ab-node--locked';

            return (
              <button
                key={act.index}
                type="button"
                className={`ab-node ${statusClass} ${act.isFunBreak ? 'ab-node--fun' : ''}`}
                disabled={!isCurrent}
                aria-label={`Activity #${act.activityNumber}: ${act.title}, ${act.subtitle}${
                  act.isFunBreak ? ', fun break' : ''
                }${isDone ? ', completed' : isCurrent ? ', current activity' : ', locked'}`}
                onClick={() => {
                  if (isCurrent) {
                    onStartActivity(act);
                  }
                }}
              >
                <div className="ab-node__top">
                  <span className="ab-node__num">#{act.activityNumber}</span>
                  {act.isNewGameIntro && !isDone && (
                    <span className="ab-node__fun-tag">New!</span>
                  )}
                  {act.isFunBreak && !act.isNewGameIntro && !isDone && !isCurrent && (
                    <span className="ab-node__fun-tag">Fun</span>
                  )}
                  {isDone && (
                    <span className="ab-node__badge ab-node__badge--done" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  {isCurrent && (
                    <span className="ab-node__badge ab-node__badge--now">NOW</span>
                  )}
                  {isLocked && (
                    <span className="ab-node__badge ab-node__badge--locked" aria-hidden="true">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2.5" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="ab-node__art">
                  <img src={assetUrl(act.artPath)} alt="" />
                </div>

                <div className="ab-node__text">
                  <strong>{act.title}</strong>
                  <span>{act.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

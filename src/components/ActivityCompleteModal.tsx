import { useEffect } from 'react';
import type { FamilyProfile } from '../context/FamilyProfilesContext';
import { ACTIVITIES_PER_CHAPTER, type JourneyActivity } from '../journey/journeyTypes';
import { assetUrl } from '../utils/assets';
import { normalizeSpokenName, speakChildNamePhrase, stopChildNameTts } from '../utils/childNameTts';
import { CrownIcon } from './BrandLogo';
import { ConfettiBurst } from './ConfettiBurst';

interface ActivityCompleteModalProps {
  activity: JourneyActivity;
  nextActivity: JourneyActivity | null;
  completedInChapter: number;
  childProfile: FamilyProfile;
  soundEnabled?: boolean;
  speakChildName?: boolean;
  onNextActivity: () => void;
  onBackToBook: () => void;
}

export function ActivityCompleteModal({
  activity,
  nextActivity,
  completedInChapter,
  childProfile,
  soundEnabled = true,
  speakChildName = true,
  onNextActivity,
  onBackToBook,
}: ActivityCompleteModalProps) {
  const progressPct = Math.round((completedInChapter / ACTIVITIES_PER_CHAPTER) * 100);

  useEffect(() => {
    if (!soundEnabled) return;
    const spokenName = speakChildName ? normalizeSpokenName(childProfile.name) : null;
    if (spokenName) {
      return speakChildNamePhrase(`Awesome job, ${spokenName}!`, {
        enabled: true,
        soundEnabled: true,
      });
    }

    let audio: HTMLAudioElement | null = null;
    try {
      audio = new Audio(assetUrl('audio/ui/awesome-job.mp3'));
      audio.volume = 0.92;
      void audio.play().catch(() => {});
    } catch {
      audio = null;
    }

    return () => {
      stopChildNameTts();
      if (audio) {
        try {
          audio.pause();
          audio.removeAttribute('src');
        } catch {
          // Ignore audio cleanup errors
        }
      }
    };
  }, [activity.index, childProfile.name, soundEnabled, speakChildName]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-complete-title"
    >
      <ConfettiBurst active mode="win" burstKey={activity.index + 1} />
      <div className="winner-modal activity-complete-modal">
        <div className="activity-complete-sticker" aria-hidden="true">
          <CrownIcon size={48} />
        </div>

        <span className="badge-pill badge-pill--mint">
          Activity #{activity.activityNumber} Complete • Sticker Earned
        </span>

        <h2 id="activity-complete-title" style={{ marginTop: 10 }}>
          Awesome Job, {childProfile.name}!
        </h2>
        <p className="winner-subtitle">
          You finished <strong>{activity.title}</strong> ({activity.subtitle}).
        </p>

        <div className="activity-complete-progress">
          <div className="activity-complete-progress__row">
            <span>Chapter {activity.chapterNumber} Progress</span>
            <strong>
              {completedInChapter} / {ACTIVITIES_PER_CHAPTER} Activities
            </strong>
          </div>
          <div className="journey-progress-track" aria-hidden="true">
            <div className="journey-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {nextActivity ? (
          <div className="activity-next-preview">
            <img
              className="activity-next-preview__art"
              src={assetUrl(nextActivity.artPath)}
              alt={nextActivity.title}
            />
            <div className="activity-next-preview__text">
              <span className="activity-next-preview__kicker">
                Up Next • Activity #{nextActivity.activityNumber}
              </span>
              <strong>
                {nextActivity.title}: {nextActivity.subtitle}
              </strong>
              <span>{nextActivity.detailLine}</span>
            </div>
          </div>
        ) : (
          <div className="activity-next-preview">
            <div className="activity-next-preview__text">
              <span className="activity-next-preview__kicker">Activity Book Complete!</span>
              <strong>All 400 Activities Completed!</strong>
              <span>Celebrate with your family or jump to any chapter in Parent Settings.</span>
            </div>
          </div>
        )}

        <div className="winner-actions">
          {nextActivity && (
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={onNextActivity}
            >
              Next Activity (#{nextActivity.activityNumber}) →
            </button>
          )}
          <button
            type="button"
            className={nextActivity ? 'btn-secondary' : 'btn-primary'}
            style={{ width: '100%' }}
            onClick={onBackToBook}
          >
            Back to Activity Book
          </button>
        </div>
      </div>
    </div>
  );
}

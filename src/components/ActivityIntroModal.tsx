import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStationSpec } from '../games/letter-train/letterData';
import { WordIllustration } from '../games/letter-train/WordIllustration';
import { getThemeSpec } from '../games/memory-match/themes';
import { WordFunArt } from '../games/word-fun/WordFunArt';
import { ACTIVITIES_PER_CHAPTER, type JourneyActivity } from '../journey/journeyTypes';
import { getJourneyVoiceSpec } from '../journey/voiceInstructions';
import { assetUrl } from '../utils/assets';
import { stopAllSpokenAudio } from '../utils/wordAudio';
import { PebbleMark } from './BrandLogo';

interface ActivityIntroModalProps {
  activity: JourneyActivity;
  soundEnabled: boolean;
  waitForVoiceIntro: boolean;
  onConfirmStart: () => void;
  onCancel: () => void;
}

const MAX_WAIT_SAFETY_MS = 5000;

function ActivityPreviewStage({ activity }: { activity: JourneyActivity }) {
  if (activity.gameId === 'memory-match') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'paw-patrol');
    const sampleChar = theme.characters[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--memory" aria-hidden="true">
        <div className="intro-demo-card intro-demo-card--a">
          <div className="intro-demo-card__back">
            <PebbleMark size={30} />
          </div>
          <div className="intro-demo-card__front">
            <img src={assetUrl(sampleChar.imagePath)} alt="" />
          </div>
        </div>
        <div className="intro-demo-match-pill">Match!</div>
        <div className="intro-demo-card intro-demo-card--b">
          <div className="intro-demo-card__back">
            <PebbleMark size={30} />
          </div>
          <div className="intro-demo-card__front">
            <img src={assetUrl(sampleChar.imagePath)} alt="" />
          </div>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'letter-train') {
    const letter = activity.lettersCovered?.[0] ?? 'A';
    const station = getStationSpec(letter);
    const sampleWord = station.words[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--train" aria-hidden="true">
        <div className="intro-demo-word-chip">
          <WordIllustration id={sampleWord.id} size={64} />
          <span>{sampleWord.word}</span>
        </div>
        <span className="intro-demo-arrow">→</span>
        <div className="intro-demo-train-car">
          <span className="intro-demo-train-car__letter">{letter}</span>
          <span className="intro-demo-train-car__sub">Train Car</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'letter-river') {
    const letter = activity.lettersCovered?.[0] ?? 'E';
    const station = getStationSpec(letter);
    const sampleWord = station.words[0];
    return (
      <div className="intro-demo-stage intro-demo-stage--river" aria-hidden="true">
        <div className="intro-demo-fish-chip">
          <WordIllustration id={sampleWord.id} size={64} />
          <span>{sampleWord.word}</span>
        </div>
        <span className="intro-demo-arrow">→</span>
        <div className="intro-demo-bucket">
          <span className="intro-demo-bucket__letter">{letter}</span>
          <span className="intro-demo-bucket__sub">Bucket</span>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'picture-sudoku') {
    const theme = getThemeSpec(activity.previewThemeId ?? 'toy-story');
    const c1 = theme.characters[0];
    const c2 = theme.characters[1];
    return (
      <div className="intro-demo-stage intro-demo-stage--sudoku" aria-hidden="true">
        <div className="intro-demo-sudoku-grid">
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c1.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c2.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell">
            <img src={assetUrl(c2.imagePath)} alt="" />
          </div>
          <div className="intro-demo-sudoku-cell intro-demo-sudoku-cell--target">
            <img className="intro-demo-sudoku-drop" src={assetUrl(c1.imagePath)} alt="" />
          </div>
        </div>
      </div>
    );
  }

  if (activity.gameId === 'word-fun') {
    return (
      <div className="intro-demo-stage intro-demo-stage--word" aria-hidden="true">
        <WordFunArt id="cat" size={102} />
        <div className="intro-demo-word-tiles">
          <span className="intro-demo-tile intro-demo-tile--1">C</span>
          <span className="intro-demo-tile intro-demo-tile--2">A</span>
          <span className="intro-demo-tile intro-demo-tile--3">T</span>
        </div>
      </div>
    );
  }

  return (
    <div className="intro-demo-stage intro-demo-stage--safari" aria-hidden="true">
      <div className="intro-demo-safari-animals">
        <div className="intro-demo-animal intro-demo-animal--1">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>1</span>
        </div>
        <div className="intro-demo-animal intro-demo-animal--2">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>2</span>
        </div>
        <div className="intro-demo-animal intro-demo-animal--3">
          <img src={assetUrl('themes/lion-king/01-simba.png')} alt="" />
          <span>3</span>
        </div>
      </div>
      <span className="intro-demo-arrow">→</span>
      <div className="intro-demo-num-block">3</div>
    </div>
  );
}

export function ActivityIntroModal({
  activity,
  soundEnabled,
  waitForVoiceIntro,
  onConfirmStart,
  onCancel,
}: ActivityIntroModalProps) {
  const voiceSpec = useMemo(() => getJourneyVoiceSpec(activity.voiceClipId), [activity.voiceClipId]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(!waitForVoiceIntro);
  const [replayNonce, setReplayNonce] = useState(0);

  useEffect(() => {
    setUnlocked(!waitForVoiceIntro);
  }, [activity.index, waitForVoiceIntro]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore audio cleanup errors
      }
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    stopAllSpokenAudio();
    stopPlayback();

    const targetDurationMs = Math.min(MAX_WAIT_SAFETY_MS, Math.max(1200, voiceSpec.durationMs));
    let cancelled = false;
    let fallbackStartedAt: number | null = null;
    let usingAudioClock = false;

    setElapsedMs(0);
    setIsPlaying(true);

    const safetyUnlockTimer = window.setTimeout(() => {
      if (!cancelled) {
        setUnlocked(true);
      }
    }, targetDurationMs);

    const tick = () => {
      if (cancelled) return;
      let currentMs = 0;
      const el = audioRef.current;
      if (usingAudioClock && el && !el.paused) {
        currentMs = el.currentTime * 1000;
      } else {
        if (fallbackStartedAt === null) {
          fallbackStartedAt = performance.now();
        }
        currentMs = performance.now() - fallbackStartedAt;
      }

      setElapsedMs(currentMs);
      if (currentMs >= voiceSpec.durationMs) {
        setUnlocked(true);
        setIsPlaying(false);
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (soundEnabled && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(assetUrl(voiceSpec.audioPath));
        audio.preload = 'auto';
        audio.volume = 0.95;
        audioRef.current = audio;

        audio.addEventListener('ended', () => {
          if (cancelled) return;
          setElapsedMs(voiceSpec.durationMs);
          setUnlocked(true);
          setIsPlaying(false);
        });

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              if (!cancelled) {
                usingAudioClock = true;
              }
            })
            .catch(() => {
              if (!cancelled) {
                usingAudioClock = false;
                fallbackStartedAt = performance.now();
              }
            });
        } else {
          usingAudioClock = true;
        }
      } catch {
        fallbackStartedAt = performance.now();
      }
    } else {
      fallbackStartedAt = performance.now();
    }

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.clearTimeout(safetyUnlockTimer);
      stopPlayback();
    };
  }, [replayNonce, soundEnabled, stopPlayback, voiceSpec]);

  const remainingSeconds = Math.max(
    1,
    Math.ceil(Math.max(0, voiceSpec.durationMs - elapsedMs) / 1000),
  );

  return (
    <div
      className="intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-intro-title"
    >
      <div className="intro-shell">
        <header className="top-bar" style={{ minHeight: 42 }}>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={() => {
              stopPlayback();
              onCancel();
            }}
          >
            <span aria-hidden="true">←</span>
            <span>Activity Book</span>
          </button>

          <span className="badge-pill badge-pill--indigo">
            Chapter {activity.chapterNumber} • Activity {activity.numberInChapter} of{' '}
            {ACTIVITIES_PER_CHAPTER}
          </span>

          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={() => setReplayNonce((n) => n + 1)}
          >
            <span>{isPlaying ? 'Listening…' : 'Replay Voice'}</span>
          </button>
        </header>

        <main className="intro-card">
          <div className="intro-card__header">
            <span className="badge-pill badge-pill--mint">Get Ready • Watch & Listen</span>
            <h1 id="activity-intro-title">
              {activity.title}: {activity.subtitle}
            </h1>
            <p>{activity.detailLine}</p>
          </div>

          <ActivityPreviewStage activity={activity} />

          <section className="intro-karaoke-box" aria-label="Voice instruction captions">
            <span className="badge-pill badge-pill--honey">
              {soundEnabled ? 'Listen & Read Along' : 'Read Along (Muted)'}
            </span>
            <div className="intro-karaoke-words">
              {voiceSpec.words.map((item, idx) => {
                const isActive =
                  isPlaying && elapsedMs >= item.startMs && elapsedMs < item.endMs;
                const isSpoken = elapsedMs >= item.endMs || !isPlaying;
                return (
                  <span
                    key={`${item.word}-${idx}`}
                    className={`intro-word ${
                      isActive
                        ? 'intro-word--active'
                        : isSpoken
                          ? 'intro-word--spoken'
                          : 'intro-word--upcoming'
                    }`}
                  >
                    {item.word}
                  </span>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            className={unlocked ? 'btn-primary intro-start-btn' : 'intro-wait-btn'}
            disabled={!unlocked}
            onClick={() => {
              stopPlayback();
              onConfirmStart();
            }}
          >
            {unlocked ? (
              <span>Let&apos;s Play! →</span>
            ) : (
              <>
                <span className="intro-wait-ring" aria-hidden="true" />
                <span>Listening to instructions… (Starts in {remainingSeconds}s)</span>
              </>
            )}
          </button>
        </main>
      </div>
    </div>
  );
}

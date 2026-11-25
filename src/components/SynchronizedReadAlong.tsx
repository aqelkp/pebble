import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/assets';
import { playReadAlongText } from '../utils/readAlongAudio';
import { playRelativeAudioClip, stopAllSpokenAudio } from '../utils/wordAudio';
import './SynchronizedReadAlong.css';

export interface ReadAlongWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface UseSynchronizedNarrationOptions {
  /** Relative asset path under public/ (e.g. "audio/stories/sam-and-the-mud/page-1.mp3"). */
  audioPath: string;
  durationMs: number;
  words: readonly ReadAlongWordTiming[];
  /** Unique key that triggers fresh narration when changed (e.g. storyId + pageNumber). */
  clipKey: string;
  /** Whether sound playback is enabled globally. */
  soundEnabled: boolean;
  /** Automatically play when clipKey changes. Defaults to true. */
  autoPlay?: boolean;
  /** Optional callback invoked when full narration finishes. */
  onComplete?: () => void;
}

export interface SynchronizedNarrationState {
  isPlaying: boolean;
  isWaitingAudio: boolean;
  hasFinished: boolean;
  elapsedMs: number;
  activeWordIndex: number;
  replay: () => void;
  stop: () => void;
}

const AUDIO_START_TIMEOUT_MS = 2200;

export function useSynchronizedNarration({
  audioPath,
  durationMs,
  words,
  clipKey,
  soundEnabled,
  autoPlay = true,
  onComplete,
}: UseSynchronizedNarrationOptions): SynchronizedNarrationState {
  const [replayNonce, setReplayNonce] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaitingAudio, setIsWaitingAudio] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore audio reset error
      }
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsWaitingAudio(false);
  }, []);

  const replay = useCallback(() => {
    setReplayNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    stop();
    stopAllSpokenAudio();

    const shouldStart = autoPlay || replayNonce > 0;
    if (!shouldStart) {
      setElapsedMs(durationMs);
      setHasFinished(true);
      setIsPlaying(false);
      setIsWaitingAudio(false);
      return () => {
        stop();
      };
    }

    let cancelled = false;
    let clockMode: 'waiting-for-audio' | 'audio-playing' | 'fallback-timer' = soundEnabled
      ? 'waiting-for-audio'
      : 'fallback-timer';
    let fallbackStartedAt: number | null = soundEnabled ? null : performance.now();
    let audioStartTimeout: number | null = null;

    setElapsedMs(0);
    setHasFinished(false);
    setIsPlaying(true);
    setIsWaitingAudio(soundEnabled);

    const finishPlayback = () => {
      if (cancelled) return;
      if (audioStartTimeout !== null) {
        window.clearTimeout(audioStartTimeout);
        audioStartTimeout = null;
      }
      setElapsedMs(durationMs);
      setIsPlaying(false);
      setIsWaitingAudio(false);
      setHasFinished(true);
      onCompleteRef.current?.();
    };

    const switchToFallbackClock = () => {
      if (cancelled || clockMode === 'fallback-timer') return;
      clockMode = 'fallback-timer';
      fallbackStartedAt = performance.now();
      setIsWaitingAudio(false);
    };

    const tick = () => {
      if (cancelled) return;

      if (clockMode === 'waiting-for-audio') {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (clockMode === 'audio-playing') {
        const el = audioRef.current;
        if (el) {
          const mediaDurationMs =
            Number.isFinite(el.duration) && el.duration > 0.1
              ? el.duration * 1000
              : durationMs;
          const rawMs = el.currentTime * 1000;
          const normalizedMs = Math.min(
            durationMs,
            Math.max(0, (rawMs / mediaDurationMs) * durationMs),
          );
          setElapsedMs(normalizedMs);
          if (el.ended) {
            finishPlayback();
            return;
          }
          rafRef.current = window.requestAnimationFrame(tick);
          return;
        }
      }

      if (fallbackStartedAt === null) {
        fallbackStartedAt = performance.now();
      }
      const currentMs = performance.now() - fallbackStartedAt;
      setElapsedMs(currentMs);
      if (currentMs >= durationMs) {
        finishPlayback();
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (clockMode === 'waiting-for-audio') {
      try {
        const audio = new Audio(assetUrl(audioPath));
        audio.preload = 'auto';
        audio.volume = 0.96;
        audioRef.current = audio;

        const handleAudioStarted = () => {
          if (cancelled || clockMode === 'fallback-timer') return;
          if (audioStartTimeout !== null) {
            window.clearTimeout(audioStartTimeout);
            audioStartTimeout = null;
          }
          clockMode = 'audio-playing';
          setIsWaitingAudio(false);
        };

        audio.addEventListener('playing', handleAudioStarted);
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime > 0) handleAudioStarted();
        });
        audio.addEventListener('error', switchToFallbackClock);
        audio.addEventListener('ended', () => {
          if (cancelled || clockMode === 'fallback-timer') return;
          finishPlayback();
        });

        audioStartTimeout = window.setTimeout(() => {
          if (clockMode === 'waiting-for-audio') {
            switchToFallbackClock();
          }
        }, AUDIO_START_TIMEOUT_MS);

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(switchToFallbackClock);
        }
      } catch {
        switchToFallbackClock();
      }
    }

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (audioStartTimeout !== null) {
        window.clearTimeout(audioStartTimeout);
      }
      stop();
    };
  }, [audioPath, autoPlay, clipKey, durationMs, replayNonce, soundEnabled, stop]);

  let activeWordIndex = -1;
  if (isPlaying && !isWaitingAudio) {
    activeWordIndex = words.findIndex(
      (item) => elapsedMs >= item.startMs && elapsedMs < item.endMs,
    );
  }

  return {
    isPlaying,
    isWaitingAudio,
    hasFinished,
    elapsedMs,
    activeWordIndex,
    replay,
    stop,
  };
}

export interface SynchronizedReadAlongProps {
  words: readonly ReadAlongWordTiming[];
  isPlaying: boolean;
  isWaitingAudio: boolean;
  elapsedMs: number;
  soundEnabled: boolean;
  /** Optional custom resolver for single-word bundled audio clips (e.g. story word bank). */
  resolveWordAudioPath?: (cleanWord: string) => string | null;
  /** Called before speaking a tapped word so parent can pause full-page narration cleanly. */
  onWordTapStart?: () => void;
  size?: 'md' | 'lg' | 'story';
  className?: string;
}

export function SynchronizedReadAlong({
  words,
  isPlaying,
  isWaitingAudio,
  elapsedMs,
  soundEnabled,
  resolveWordAudioPath,
  onWordTapStart,
  size = 'story',
  className = '',
}: SynchronizedReadAlongProps) {
  const [tappedIdx, setTappedIdx] = useState<number | null>(null);
  const tapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  // Clear manual tap highlight whenever synchronized narration starts playing again
  useEffect(() => {
    if (isPlaying) {
      setTappedIdx(null);
    }
  }, [isPlaying]);

  const handleWordClick = (word: string, idx: number) => {
    onWordTapStart?.();
    setTappedIdx(idx);
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
    }
    tapTimerRef.current = window.setTimeout(() => setTappedIdx(null), 780);

    if (!soundEnabled) return;
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    const customPath = clean && resolveWordAudioPath ? resolveWordAudioPath(clean) : null;
    if (customPath) {
      playRelativeAudioClip(customPath, clean, true);
    } else {
      playReadAlongText(word, { phraseWord: true, enabled: true });
    }
  };

  return (
    <div
      className={`sra-words sra-words--${size} ${className}`.trim()}
      role="group"
      aria-label="Read along text. Tap any word to hear it."
      data-testid="synchronized-read-along"
    >
      {words.map((item, idx) => {
        const isNarratingActive =
          isPlaying && !isWaitingAudio && elapsedMs >= item.startMs && elapsedMs < item.endMs;
        const isSpoken = !isWaitingAudio && (elapsedMs >= item.endMs || !isPlaying);
        const isActive = tappedIdx === idx || isNarratingActive;

        return (
          <button
            key={`${idx}-${item.word}`}
            type="button"
            data-testid={`read-along-word-${idx}`}
            data-active={isActive ? 'true' : 'false'}
            className={`sra-word ${
              isActive
                ? 'sra-word--active'
                : isSpoken
                  ? 'sra-word--spoken'
                  : 'sra-word--upcoming'
            }`}
            aria-label={`Hear "${item.word.replace(/[^a-zA-Z0-9]/g, '') || item.word}"`}
            onClick={() => handleWordClick(item.word, idx)}
          >
            {item.word}
          </button>
        );
      })}
    </div>
  );
}

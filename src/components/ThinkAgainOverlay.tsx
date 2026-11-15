import { useEffect, useState } from 'react';
import { playThinkAgainVoice, preloadThinkAgainVoice } from '../utils/wordAudio';
import { PebbleMark } from './BrandLogo';

export interface ThinkAgainOverlayProps {
  open: boolean;
  hint?: string;
  soundEnabled?: boolean;
  durationSeconds?: number;
  onReady: () => void;
}

/**
 * Calm, full-screen pause overlay shown after a mistake so children
 * pause to think rather than spam-dragging or guessing without looking.
 * Intentionally low-key (zero funny animations, buzzers, or harsh red marks).
 */
export function ThinkAgainOverlay({
  open,
  hint,
  soundEnabled = true,
  durationSeconds = 2,
  onReady,
}: ThinkAgainOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    preloadThinkAgainVoice();
  }, []);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(durationSeconds);
      return;
    }

    playThinkAgainVoice(soundEnabled);
    setSecondsLeft(durationSeconds);
    if (durationSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [open, durationSeconds, soundEnabled]);

  if (!open) return null;

  const isWaiting = secondsLeft > 0;

  return (
    <div
      className="think-again-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="think-again-title"
    >
      <div className="think-again-card">
        <div className="think-again-card__mark" aria-hidden="true">
          <PebbleMark size={40} />
        </div>

        <h2 id="think-again-title" className="think-again-card__title">
          Hey, do you want to take some time to think again?
        </h2>

        {hint ? <p className="think-again-card__hint">{hint}</p> : null}

        <div className="think-again-card__meter" aria-hidden="true">
          <div
            className="think-again-card__meter-fill"
            style={{
              width: isWaiting ? `${((durationSeconds - secondsLeft) / durationSeconds) * 100}%` : '100%',
            }}
          />
        </div>

        <button
          type="button"
          className="btn-primary think-again-card__btn"
          disabled={isWaiting}
          onClick={onReady}
        >
          {isWaiting ? `Take a breath (${secondsLeft}s)…` : "I'm Ready!"}
        </button>
      </div>
    </div>
  );
}

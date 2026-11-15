import { useEffect, useRef } from 'react';

export interface UseGameLoopOptions {
  enabled?: boolean;
  /** Clamp frame delta seconds to prevent huge jumps after tab switches or pauses. */
  maxDeltaSeconds?: number;
}

/**
 * Shared 60fps requestAnimationFrame loop that keeps the callback fresh via a ref,
 * caps delta time, and resets timestamps cleanly on visibility changes.
 */
export function useGameLoop(
  onTick: (dtSeconds: number, elapsedSeconds: number) => void,
  options: UseGameLoopOptions = {},
): void {
  const { enabled = true, maxDeltaSeconds = 0.05 } = options;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let lastTs = performance.now();
    let elapsedSeconds = 0;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTs = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const step = (now: number) => {
      const rawDt = Math.max(0, (now - lastTs) / 1000);
      const dtSeconds = Math.min(maxDeltaSeconds, rawDt);
      lastTs = now;
      elapsedSeconds += dtSeconds;
      onTickRef.current(dtSeconds, elapsedSeconds);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, maxDeltaSeconds]);
}

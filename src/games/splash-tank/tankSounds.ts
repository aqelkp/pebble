import { getNumberAudioPath, preloadAudioPaths } from '../../utils/wordAudio';

let splashAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!splashAudioCtx) {
      splashAudioCtx = new AudioCtx();
    }
    if (splashAudioCtx.state === 'suspended') {
      void splashAudioCtx.resume();
    }
    return splashAudioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.08,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + startOffsetSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore Web Audio errors when restricted
  }
}

export function playSplashPourStart(enabled: boolean): void {
  if (!enabled) return;
  playTone(392, 0, 0.09, 'sine', 0.055);
  playTone(493.88, 0.06, 0.1, 'sine', 0.055);
}

export function playSplashExactChime(stepIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const baseScale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0];
  const base = baseScale[stepIndex % baseScale.length];
  playTone(base, 0, 0.14, 'triangle', 0.085);
  playTone(base * 1.25, 0.08, 0.16, 'triangle', 0.085);
  playTone(base * 1.5, 0.16, 0.24, 'triangle', 0.095);
  playTone(base * 2, 0.24, 0.28, 'sine', 0.075);
}

export function playSplashMistakeTap(enabled: boolean): void {
  if (!enabled) return;
  // Calm, low-key muted water drop — never a harsh buzzer or comical boing
  playTone(260, 0, 0.1, 'sine', 0.04);
  playTone(220, 0.08, 0.12, 'sine', 0.035);
}

export function playSplashRoundFanfare(flawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0, 0.15, 'triangle', 0.095);
  playTone(659.25, 0.1, 0.15, 'triangle', 0.095);
  playTone(783.99, 0.2, 0.18, 'triangle', 0.095);
  playTone(1046.5, 0.32, 0.36, 'triangle', 0.11);
  if (flawless) {
    playTone(1318.51, 0.45, 0.38, 'sine', 0.08);
  }
}

export function playSplashNumberVoice(
  num: number,
  enabled: boolean,
  onComplete?: () => void,
): () => void {
  if (typeof window === 'undefined') {
    onComplete?.();
    return () => {};
  }

  let settled = false;
  let timerId: number | null = null;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    onComplete?.();
  };

  if (!enabled || num < 0 || num > 30) {
    timerId = window.setTimeout(finish, 700);
    return () => {
      settled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }

  try {
    const audio = new Audio(
      `${import.meta.env.BASE_URL}${getNumberAudioPath(num)}`.replace(/\/{2,}/g, '/'),
    );
    audio.preload = 'auto';
    audio.volume = 0.95;

    audio.addEventListener('ended', () => {
      timerId = window.setTimeout(finish, 260);
    });
    audio.addEventListener('error', () => {
      timerId = window.setTimeout(finish, 700);
    });

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        timerId = window.setTimeout(finish, 700);
      });
    }
    timerId = window.setTimeout(finish, 2200);

    return () => {
      settled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      try {
        audio.pause();
      } catch {
        // Ignore pause error
      }
    };
  } catch {
    timerId = window.setTimeout(finish, 700);
    return () => {
      settled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }
}

export function preloadSplashAssets(): void {
  const paths: string[] = [];
  for (let n = 0; n <= 20; n += 1) {
    paths.push(getNumberAudioPath(n));
  }
  preloadAudioPaths(paths);
}

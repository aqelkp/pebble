import { playRelativeAudioClip, preloadAudioPaths } from '../../utils/wordAudio';

let wordHuntAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!wordHuntAudioCtx) {
      wordHuntAudioCtx = new AudioCtx();
    }
    if (wordHuntAudioCtx.state === 'suspended') {
      void wordHuntAudioCtx.resume();
    }
    return wordHuntAudioCtx;
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
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore Web Audio errors when restricted
  }
}

export function playCellStepTick(stepIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const notes = [440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99];
  const freq = notes[Math.max(0, stepIndex) % notes.length];
  playTone(freq, 0, 0.075, 'sine', 0.045);
}

export function playWordFoundChime(foundIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const baseScale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0];
  const base = baseScale[foundIndex % baseScale.length];
  playTone(base, 0, 0.14, 'triangle', 0.085);
  playTone(base * 1.25, 0.075, 0.16, 'triangle', 0.085);
  playTone(base * 1.5, 0.15, 0.24, 'triangle', 0.095);
  playTone(base * 2, 0.23, 0.26, 'sine', 0.07);
}

export function playWrongTraceTap(enabled: boolean): void {
  if (!enabled) return;
  // Calm, low-key muted tap — never a harsh buzzer or funny boing
  playTone(255, 0, 0.09, 'sine', 0.038);
  playTone(215, 0.075, 0.11, 'sine', 0.032);
}

export function playGridCompleteFanfare(flawless: boolean, enabled: boolean): void {
  if (!enabled) return;
  playTone(523.25, 0, 0.15, 'triangle', 0.095);
  playTone(659.25, 0.1, 0.15, 'triangle', 0.095);
  playTone(783.99, 0.2, 0.18, 'triangle', 0.095);
  playTone(1046.5, 0.31, 0.38, 'triangle', 0.11);
  if (flawless) {
    playTone(1318.51, 0.44, 0.36, 'sine', 0.08);
  }
}

export function playWordHuntWordVoice(
  audioId: string,
  fallbackWord: string,
  enabled: boolean,
): void {
  if (!enabled) return;
  playRelativeAudioClip(`audio/words/${audioId}.mp3`, fallbackWord.toLowerCase(), true);
}

export function preloadWordHuntAudio(audioIds: readonly string[]): void {
  const paths = audioIds.map((id) => `audio/words/${id}.mp3`);
  preloadAudioPaths(paths);
}

import { playWordAudio } from '../../utils/wordAudio';

let wordAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!wordAudioCtx) {
      wordAudioCtx = new AudioCtx();
    }
    if (wordAudioCtx.state === 'suspended') {
      void wordAudioCtx.resume();
    }
    return wordAudioCtx;
  } catch {
    return null;
  }
}

function playNote(
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.085,
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
    // Ignore autoplay blocks gracefully
  }
}

const SLOT_NOTES = [523.25, 659.25, 783.99] as const;

export function playLetterPlaceSound(slotIndex: number, enabled: boolean): void {
  if (!enabled) return;
  const freq = SLOT_NOTES[slotIndex] ?? 659.25;
  playNote(freq, 0, 0.14, 'triangle', 0.085);
}

export function playWordCompleteSound(enabled: boolean): void {
  if (!enabled) return;
  playNote(523.25, 0, 0.14, 'triangle', 0.09);
  playNote(659.25, 0.08, 0.16, 'triangle', 0.09);
  playNote(783.99, 0.16, 0.2, 'triangle', 0.095);
  playNote(1046.5, 0.25, 0.28, 'triangle', 0.1);
}

export function playWrongLetterSound(enabled: boolean): void {
  if (!enabled) return;
  playNote(329.63, 0, 0.11, 'sine', 0.05);
  playNote(277.18, 0.09, 0.13, 'sine', 0.05);
}

export function playHintChime(enabled: boolean): void {
  if (!enabled) return;
  playNote(587.33, 0, 0.11, 'sine', 0.06);
  playNote(783.99, 0.09, 0.15, 'sine', 0.06);
}

export function playRoundWinSound(enabled: boolean): void {
  if (!enabled) return;
  playNote(523.25, 0, 0.16, 'triangle', 0.1);
  playNote(659.25, 0.11, 0.16, 'triangle', 0.1);
  playNote(783.99, 0.22, 0.18, 'triangle', 0.1);
  playNote(1046.5, 0.34, 0.38, 'triangle', 0.11);
}

export function speakWordPrompt(
  word: string,
  clue: string,
  enabled: boolean,
  wordId?: string,
): void {
  playHintChime(enabled);
  if (!enabled) return;
  const safeWord = word.replace(/[^A-Z]/gi, '').toLowerCase();
  const safeClue = clue.replace(/[^a-zA-Z0-9 ,.-]/g, '');
  if (!safeWord) return;
  const resolvedId = wordId || safeWord;
  playWordAudio(resolvedId, `${safeWord}. ${safeClue}`, true);
}

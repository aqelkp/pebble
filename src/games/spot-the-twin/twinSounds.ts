let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
): void {
  const start = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playTwinMatchSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 587.33, 0, 0.1, 0.09, 'sine');
  playTone(ctx, 880, 0.07, 0.16, 0.1, 'triangle');
}

export function playTwinMissSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 300, 0, 0.13, 0.08, 'triangle');
  playTone(ctx, 245, 0.1, 0.17, 0.07, 'sine');
}

export function playTwinRoundWinSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 523.25, 0, 0.14, 0.09, 'sine');
  playTone(ctx, 659.25, 0.11, 0.14, 0.1, 'sine');
  playTone(ctx, 783.99, 0.22, 0.16, 0.1, 'sine');
  playTone(ctx, 1046.5, 0.34, 0.3, 0.12, 'triangle');
}

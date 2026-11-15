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

export function playRoadPickupSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 440, 0, 0.08, 0.07, 'sine');
}

export function playRoadSnapSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 523.25, 0, 0.11, 0.1, 'triangle');
  playTone(ctx, 659.25, 0.06, 0.14, 0.11, 'sine');
}

export function playRoadMismatchSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 310, 0, 0.14, 0.08, 'triangle');
  playTone(ctx, 260, 0.11, 0.18, 0.07, 'sine');
}

export function playRescueHonkFanfare(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  // Friendly two-tone car toot + happy finish chime
  playTone(ctx, 392.0, 0, 0.11, 0.09, 'triangle');
  playTone(ctx, 523.25, 0.13, 0.16, 0.1, 'triangle');
  playTone(ctx, 587.33, 0.45, 0.15, 0.1, 'sine');
  playTone(ctx, 659.25, 0.58, 0.15, 0.1, 'sine');
  playTone(ctx, 783.99, 0.72, 0.28, 0.12, 'sine');
}

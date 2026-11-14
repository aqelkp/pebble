import type { CSSProperties } from 'react';

interface ConfettiBurstProps {
  active: boolean;
  mode: 'match' | 'win';
  burstKey: number;
}

const PALETTE = ['#3BA99C', '#F27A5E', '#5B5BD6', '#F2B84B', '#72C9BE', '#8E8EE8'];

interface ParticleSpec {
  id: number;
  startX: number;
  startY: number;
  driftX: number;
  size: number;
  height: number;
  radius: string;
  color: string;
  duration: number;
  delay: number;
  spin: number;
}

function buildParticles(count: number, mode: 'match' | 'win'): ParticleSpec[] {
  const list: ParticleSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    const ratio = i / count;
    const isRibbon = i % 3 === 0;
    const isPebble = i % 3 === 1;
    list.push({
      id: i,
      startX: mode === 'win' ? 10 + ((i * 37) % 80) : 22 + ((i * 29) % 56),
      startY: mode === 'win' ? 6 + ((i * 11) % 24) : 14 + ((i * 7) % 18),
      driftX: ((i % 2 === 0 ? 1 : -1) * (28 + ((i * 19) % 90))),
      size: isRibbon ? 8 : isPebble ? 13 : 10,
      height: isRibbon ? 16 : isPebble ? 9 : 10,
      radius: isRibbon ? '4px' : isPebble ? '999px' : '50%',
      color: PALETTE[i % PALETTE.length],
      duration: mode === 'win' ? 1.55 + ratio * 0.65 : 1.05 + ratio * 0.35,
      delay: (i % 5) * 0.04,
      spin: (i % 2 === 0 ? 1 : -1) * (240 + (i % 4) * 90),
    });
  }
  return list;
}

const MATCH_PARTICLES = buildParticles(22, 'match');
const WIN_PARTICLES = buildParticles(42, 'win');

/**
 * Celebratory confetti overlay using only circles, rounded pebbles, and soft ribbons.
 */
export function ConfettiBurst({ active, mode, burstKey }: ConfettiBurstProps) {
  if (!active) return null;
  const particles = mode === 'win' ? WIN_PARTICLES : MATCH_PARTICLES;

  return (
    <div key={burstKey} className="confetti-layer" aria-hidden="true">
      {particles.map((item) => {
        const style = {
          '--start-x': `${item.startX}%`,
          '--start-y': `${item.startY}vh`,
          '--drift-x': `${item.driftX}px`,
          '--size': `${item.size}px`,
          '--height': `${item.height}px`,
          '--radius': item.radius,
          '--color': item.color,
          '--duration': `${item.duration}s`,
          '--delay': `${item.delay}s`,
          '--spin': `${item.spin}deg`,
        } as CSSProperties;
        return <span key={item.id} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}

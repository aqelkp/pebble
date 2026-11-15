import type { AdventureSkinId } from '../../curriculum/questEngine/questTypes';

interface AdventureWorldBannerProps {
  skinId: AdventureSkinId;
  stopIndex: number;
  totalStops: number;
  gateCelebrating: boolean;
  flawlessSoFar: boolean;
}

export const ADVENTURE_SKIN_META: Record<
  AdventureSkinId,
  {
    title: string;
    worldBadge: string;
    stepNoun: string;
    celebrationLine: string;
    finaleHeadline: string;
  }
> = {
  'mystery-express': {
    title: 'Mystery Express',
    worldBadge: 'Train Gate',
    stepNoun: 'Station',
    celebrationLine: 'Gate up! Choo-choo — onward to the next station!',
    finaleHeadline: 'All Stations Cleared!',
  },
  'pebble-creek': {
    title: 'Pebble Creek',
    worldBadge: 'River Stones',
    stepNoun: 'Stone',
    celebrationLine: 'Splash! Another stepping stone placed across the creek!',
    finaleHeadline: 'Across Pebble Creek!',
  },
  'cloud-balloon': {
    title: 'Cloud Balloon',
    worldBadge: 'Sky Climb',
    stepNoun: 'Cloud',
    celebrationLine: 'Whoosh! Rising higher into the sky!',
    finaleHeadline: 'Reached the Starry Sky!',
  },
  'treasure-keys': {
    title: 'Treasure Keys',
    worldBadge: 'Golden Locks',
    stepNoun: 'Key',
    celebrationLine: 'Click! Golden key unlocked!',
    finaleHeadline: 'Treasure Chest Unlocked!',
  },
};

export function AdventureWorldBanner({
  skinId,
  stopIndex,
  totalStops,
  gateCelebrating,
  flawlessSoFar,
}: AdventureWorldBannerProps) {
  const meta = ADVENTURE_SKIN_META[skinId];
  const completedCount = gateCelebrating
    ? Math.min(totalStops, stopIndex + 1)
    : stopIndex;
  const progressRatio = totalStops > 0 ? completedCount / totalStops : 0;

  return (
    <section className="quest-world-strip" aria-label={`${meta.title} progress`}>
      <div className="quest-world-strip__hud">
        <span className="quest-world-pill">
          {meta.stepNoun} {Math.min(totalStops, stopIndex + 1)} of {totalStops}
        </span>
        <span
          className={`quest-crown-pill ${flawlessSoFar ? '' : 'quest-crown-pill--dimmed'}`}
        >
          {flawlessSoFar ? 'Golden Crown Ready' : 'Keep Exploring'}
        </span>
      </div>

      {skinId === 'mystery-express' && (
        <svg width="100%" height="100%" viewBox="0 0 720 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="720" height="170" fill="#E8F5F1" />
          <path d="M0 118 Q180 62 360 114 T720 108 L720 170 L0 170 Z" fill="#BCE5DC" />
          <path d="M0 136 L720 136 L720 170 L0 170 Z" fill="#9ED6C9" />
          {/* Wooden sleepers & rails */}
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={18 + i * 40} y="142" width="16" height="12" rx="3" fill="#B68256" />
          ))}
          <rect x="0" y="139" width="720" height="6" fill="#6E778A" />

          {/* Station milestone posts */}
          {Array.from({ length: totalStops }, (_, idx) => {
            const sx = 120 + idx * (520 / Math.max(1, totalStops - 1));
            const done = idx < completedCount;
            return (
              <g key={idx} transform={`translate(${sx}, 96)`}>
                <rect x="-2" y="0" width="4" height="44" fill="#8C5A3C" />
                <circle cx="0" cy="0" r="11" fill={done ? '#3BA99C' : '#FFFFFF'} stroke="#3BA99C" strokeWidth="2.5" />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontFamily="Fredoka, sans-serif" fontSize="11" fontWeight="700" fill={done ? '#FFFFFF' : '#257D73'}>
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Locomotive position */}
          <g
            style={{
              transform: `translateX(${60 + progressRatio * 430}px)`,
              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Puffing steam circles */}
            <circle cx="28" cy="64" r="7" fill="#FFFFFF" opacity="0.85" />
            <circle cx="16" cy="52" r="10" fill="#FFFFFF" opacity="0.7" />
            {/* Train body */}
            <rect x="0" y="92" width="44" height="38" rx="8" fill="#F27A5E" />
            <rect x="10" y="100" width="18" height="14" rx="3" fill="#FFFDF7" />
            <rect x="40" y="102" width="42" height="28" rx="7" fill="#5B5BD6" />
            <rect x="58" y="80" width="14" height="24" rx="4" fill="#3BA99C" />
            <polygon points="82,130 96,130 82,114" fill="#F2B84B" />
            <circle cx="20" cy="134" r="10" fill="#2A3352" /><circle cx="20" cy="134" r="4" fill="#F2B84B" />
            <circle cx="52" cy="134" r="9" fill="#2A3352" /><circle cx="52" cy="134" r="4" fill="#F2B84B" />
            <circle cx="74" cy="134" r="9" fill="#2A3352" /><circle cx="74" cy="134" r="4" fill="#F2B84B" />
          </g>

          {/* Railway Puzzle Gate ahead of train */}
          {completedCount < totalStops && (
            <g
              transform={`translate(${175 + progressRatio * 430}, 122)`}
              style={{ transition: 'transform 450ms ease' }}
            >
              <g
                style={{
                  transformOrigin: '0px 0px',
                  transform: gateCelebrating ? 'rotate(-74deg)' : 'rotate(0deg)',
                  transition: 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <rect x="-56" y="-8" width="60" height="10" rx="5" fill="#F27A5E" />
                <rect x="-42" y="-8" width="12" height="10" fill="#FFFFFF" />
                <rect x="-18" y="-8" width="12" height="10" fill="#FFFFFF" />
              </g>
              <rect x="-7" y="-12" width="14" height="30" rx="4" fill="#C98E5B" />
              <circle cx="0" cy="-4" r="4" fill="#F2B84B" />
            </g>
          )}
        </svg>
      )}

      {skinId === 'pebble-creek' && (
        <svg width="100%" height="100%" viewBox="0 0 720 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="720" height="170" fill="#DFF5F2" />
          {/* Creek water */}
          <rect x="90" y="54" width="540" height="116" fill="#7BD5CA" />
          <path d="M120 88 Q200 78 280 88 T440 88 T600 88" stroke="#A7E8DF" strokeWidth="4" fill="none" />
          {/* Left & Right grassy banks */}
          <path d="M0 44 Q98 56 112 170 L0 170 Z" fill="#67C29C" />
          <path d="M720 44 Q622 56 608 170 L720 170 Z" fill="#67C29C" />

          {/* Stepping stones */}
          {Array.from({ length: totalStops }, (_, idx) => {
            const cx = 165 + idx * (390 / Math.max(1, totalStops - 1));
            const cy = idx % 2 === 0 ? 118 : 104;
            const placed = idx < completedCount;
            return (
              <g key={idx} transform={`translate(${cx}, ${cy})`}>
                <ellipse
                  cx="0"
                  cy="0"
                  rx="30"
                  ry="16"
                  fill={placed ? '#E9DFCE' : 'rgba(255,255,255,0.35)'}
                  stroke={placed ? '#A48D6F' : '#FFFFFF'}
                  strokeWidth="2.5"
                  strokeDasharray={placed ? undefined : '5 4'}
                />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontFamily="Fredoka, sans-serif" fontSize="13" fontWeight="700" fill={placed ? '#5A4A38' : '#1E6960'}>
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Friendly Fox Explorer */}
          <g
            style={{
              transform: `translate(${completedCount === 0 ? 58 : completedCount >= totalStops ? 648 : 165 + (completedCount - 1) * (390 / Math.max(1, totalStops - 1))}px, ${completedCount === 0 || completedCount >= totalStops ? 88 : (completedCount - 1) % 2 === 0 ? 86 : 72}px)`,
              transition: 'transform 480ms cubic-bezier(0.34, 1.4, 0.64, 1)',
            }}
          >
            <ellipse cx="-16" cy="18" rx="12" ry="7" transform="rotate(-25 -16 18)" fill="#F27A5E" />
            <ellipse cx="0" cy="16" rx="13" ry="15" fill="#F27A5E" />
            <circle cx="0" cy="-2" r="14" fill="#F27A5E" />
            <polygon points="-12,-10 -6,-24 0,-12" fill="#F27A5E" />
            <polygon points="12,-10 6,-24 0,-12" fill="#F27A5E" />
            <ellipse cx="0" cy="3" rx="9" ry="6" fill="#FFFDF7" />
            <circle cx="-5" cy="-3" r="2" fill="#1E2433" />
            <circle cx="5" cy="-3" r="2" fill="#1E2433" />
            <circle cx="0" cy="2" r="2.5" fill="#1E2433" />
          </g>
        </svg>
      )}

      {skinId === 'cloud-balloon' && (
        <svg width="100%" height="100%" viewBox="0 0 720 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="skyClimbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DCE4FF" />
              <stop offset="100%" stopColor="#EFF8F7" />
            </linearGradient>
          </defs>
          <rect width="720" height="170" fill="url(#skyClimbGrad)" />
          <path d="M460 170 A150 130 0 0 1 700 170" fill="none" stroke="#F9C5B8" strokeWidth="10" opacity="0.7" />
          <path d="M472 170 A138 118 0 0 1 688 170" fill="none" stroke="#F9E2A8" strokeWidth="10" opacity="0.7" />
          <path d="M484 170 A126 106 0 0 1 676 170" fill="none" stroke="#B6E8DE" strokeWidth="10" opacity="0.7" />

          {/* Fluffy clouds */}
          <g fill="#FFFFFF" opacity="0.9">
            <circle cx="90" cy="130" r="22" /><circle cx="116" cy="126" r="26" /><circle cx="144" cy="132" r="20" />
            <circle cx="560" cy="78" r="18" /><circle cx="584" cy="74" r="22" /><circle cx="608" cy="80" r="17" />
          </g>

          {/* Cloud altitude checkpoints */}
          {Array.from({ length: totalStops }, (_, idx) => {
            const cx = 150 + idx * (420 / Math.max(1, totalStops - 1));
            const cy = 132 - idx * 14;
            const reached = idx < completedCount;
            return (
              <g key={idx} transform={`translate(${cx}, ${cy})`}>
                <circle r="13" fill={reached ? '#5B5BD6' : '#FFFFFF'} stroke="#5B5BD6" strokeWidth="2.5" />
                <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontFamily="Fredoka, sans-serif" fontSize="12" fontWeight="700" fill={reached ? '#FFFFFF' : '#5B5BD6'}>
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Hot-air balloon */}
          <g
            style={{
              transform: `translate(${110 + progressRatio * 460}px, ${96 - progressRatio * 44}px)`,
              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <line x1="-8" y1="16" x2="-6" y2="30" stroke="#8C5A3C" strokeWidth="2" />
            <line x1="8" y1="16" x2="6" y2="30" stroke="#8C5A3C" strokeWidth="2" />
            <rect x="-10" y="30" width="20" height="14" rx="4" fill="#C98E5B" stroke="#8C5A3C" strokeWidth="2" />
            <circle cx="0" cy="-8" r="26" fill="#F27A5E" />
            <ellipse cx="0" cy="-8" rx="15" ry="26" fill="#F2B84B" />
            <ellipse cx="0" cy="-8" rx="6" ry="26" fill="#3BA99C" />
          </g>
        </svg>
      )}

      {skinId === 'treasure-keys' && (
        <svg width="100%" height="100%" viewBox="0 0 720 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="720" height="170" fill="#F4F0E4" />
          <path d="M0 124 Q360 98 720 124 L720 170 L0 170 Z" fill="#DCEFE9" />

          {/* Wooden Treasure Chest */}
          <g transform="translate(108, 52)">
            <rect x="0" y="28" width="112" height="64" rx="10" fill="#C98E5B" stroke="#8C5A3C" strokeWidth="3.5" />
            <path
              d="M0 30 Q56 0 112 30 Z"
              fill="#DFA26A"
              stroke="#8C5A3C"
              strokeWidth="3.5"
              style={{
                transformOrigin: '0px 30px',
                transform: completedCount >= totalStops ? 'rotate(-22deg)' : 'rotate(0deg)',
                transition: 'transform 420ms ease',
              }}
            />
            <rect x="44" y="34" width="24" height="26" rx="5" fill="#F2B84B" stroke="#B57C14" strokeWidth="2.5" />
            <circle cx="56" cy="45" r="4" fill="#5A3E1B" />
          </g>

          {/* Key slots */}
          {Array.from({ length: totalStops }, (_, idx) => {
            const kx = 290 + idx * (350 / Math.max(1, totalStops - 1));
            const unlocked = idx < completedCount;
            const colors = ['#3BA99C', '#F27A5E', '#5B5BD6', '#F2B84B', '#2E8B7D', '#E85349', '#4A6FA5', '#5B5BD6'];
            const keyColor = colors[idx % colors.length];
            return (
              <g key={idx} transform={`translate(${kx}, 102)`}>
                <rect
                  x="-22"
                  y="-30"
                  width="44"
                  height="60"
                  rx="12"
                  fill={unlocked ? '#FFFDF7' : 'rgba(255,255,255,0.55)'}
                  stroke={unlocked ? keyColor : '#C8C2B4'}
                  strokeWidth="2.5"
                />
                <circle cx="0" cy="-10" r="10" fill={unlocked ? keyColor : '#D5CFC2'} />
                <circle cx="0" cy="-10" r="3.5" fill="#FFFFFF" />
                <rect x="-3" y="0" width="6" height="18" rx="2" fill={unlocked ? keyColor : '#D5CFC2'} />
                <rect x="3" y="10" width="6" height="4" rx="1" fill={unlocked ? keyColor : '#D5CFC2'} />
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}

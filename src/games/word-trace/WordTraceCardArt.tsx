import { WordIllustration } from '../letter-train/WordIllustration';
import { WordFunArt } from '../word-fun/WordFunArt';
import type { SightWordId, WordTraceArtSpec } from './wordTraceEngine';

interface WordTraceCardArtProps {
  art: WordTraceArtSpec;
  size?: number;
}

const PEBBLE_COLORS = ['#3BA99C', '#F27A5E', '#5B5BD6', '#F2B84B'] as const;

function renderSightMiniArt(sightId: SightWordId) {
  switch (sightId) {
    case 'or':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#FEF5E1" />
          <circle cx="33" cy="48" r="14" fill="#F2B84B" stroke="#C8800E" strokeWidth="2.8" />
          <line x1="50" y1="26" x2="50" y2="74" stroke="#C7CDD8" strokeWidth="2.5" strokeDasharray="4 4" />
          <rect x="56" y="46" width="26" height="14" rx="7" fill="#8BB8E8" />
          <circle cx="66" cy="45" r="9" fill="#8BB8E8" />
          <circle cx="75" cy="48" r="7" fill="#8BB8E8" />
        </>
      );
    case 'be':
    case 'so':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#FDECE7" />
          <path
            d="M50 74 C26 58, 22 38, 35 29 C43 24, 50 31, 50 37 C50 31, 57 24, 65 29 C78 38, 74 58, 50 74 Z"
            fill="#F27A5E"
            stroke="#9B3D26"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="42" cy="45" r="2.6" fill="#FFFFFF" />
          <circle cx="58" cy="45" r="2.6" fill="#FFFFFF" />
          <path d="M44 53 Q50 58 56 53" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </>
      );
    case 'an':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#E4F6F3" />
          <path d="M50 28 C49 20, 53 17, 57 19" stroke="#6B4C35" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="60" cy="23" rx="8" ry="4.5" transform="rotate(-20 60 23)" fill="#3BA99C" />
          <path d="M50 30 C35 27, 25 38, 27 55 C29 71, 39 78, 50 75 C61 78, 71 71, 73 55 C75 38, 65 27, 50 30 Z" fill="#E85349" />
          <ellipse cx="38" cy="45" rx="4" ry="9" transform="rotate(16 38 45)" fill="#FF9A92" />
        </>
      );
    case 'no':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#ECEBFF" />
          <path d="M24 52 C24 33, 76 33, 76 52 Z" fill="#5B5BD6" stroke="#33338F" strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 52 V70 C50 76, 42 76, 42 70" stroke="#33338F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="27" r="3" fill="#F2B84B" />
        </>
      );
    case 'do':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#E4F6F3" />
          <circle cx="50" cy="50" r="26" fill="#3BA99C" stroke="#20685F" strokeWidth="3" />
          <path
            d="M38 51 L46 59 L63 41"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      );
    case 'am':
    case 'is':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#FEF5E1" />
          <circle cx="50" cy="50" r="26" fill="#F2B84B" stroke="#C8800E" strokeWidth="3" />
          <circle cx="41" cy="45" r="3.5" fill="#4D2E1A" />
          <circle cx="59" cy="45" r="3.5" fill="#4D2E1A" />
          <path d="M40 56 Q50 65 60 56" stroke="#4D2E1A" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </>
      );
    case 'up':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#ECEBFF" />
          <ellipse cx="50" cy="42" rx="18" ry="21" fill="#F27A5E" stroke="#9B3D26" strokeWidth="3" />
          <path d="M47 63 L53 63 L50 68 Z" fill="#F27A5E" />
          <path d="M50 68 Q46 76 52 82" stroke="#5C6478" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M50 30 L50 48 M43 37 L50 30 L57 37" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case 'go':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#E4F6F3" />
          <rect x="33" y="22" width="34" height="56" rx="14" fill="#2E3548" />
          <circle cx="50" cy="36" r="7" fill="#5C6478" />
          <circle cx="50" cy="62" r="9.5" fill="#3BA99C" stroke="#A6F0E6" strokeWidth="2.5" />
        </>
      );
    case 'in':
    case 'on':
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#FEF5E1" />
          <rect x="28" y="48" width="44" height="26" rx="6" fill="#D99B58" stroke="#7A4E22" strokeWidth="3" />
          <circle
            cx="50"
            cy={sightId === 'on' ? 35 : 52}
            r="12"
            fill="#5B5BD6"
            stroke="#FFFFFF"
            strokeWidth="2.6"
          />
        </>
      );
    default:
      return (
        <>
          <circle cx="50" cy="50" r="42" fill="#ECEBFF" />
          <ellipse cx="38" cy="54" rx="13" ry="11" fill="#3BA99C" />
          <ellipse cx="62" cy="54" rx="13" ry="11" fill="#F27A5E" />
          <circle cx="35" cy="52" r="2.2" fill="#1E2433" />
          <circle cx="65" cy="52" r="2.2" fill="#1E2433" />
          <path d="M35 56 Q38 59 41 56 M59 56 Q62 59 65 56" stroke="#1E2433" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      );
  }
}

function NumberCardArt({
  numeral,
  wordLabel,
  traceTarget,
  size,
}: {
  numeral: number;
  wordLabel: string;
  traceTarget: 'word' | 'digit';
  size: number;
}) {
  // Arrange up to 10 pebbles cleanly in a 2×5 ten-frame
  const pebbles = Array.from({ length: numeral }, (_, idx) => {
    const row = Math.floor(idx / 5);
    const col = idx % 5;
    const colsInThisRow = numeral <= 5 ? numeral : row === 0 ? 5 : numeral - 5;
    const rowWidth = (colsInThisRow - 1) * 15;
    const startX = 50 - rowWidth / 2;
    const cx = startX + col * 15;
    const cy = numeral <= 5 ? 69 : row === 0 ? 63 : 77;
    const color = PEBBLE_COLORS[idx % PEBBLE_COLORS.length];
    return { cx, cy, color, idx };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="24"
        fill="#FFFDF7"
        stroke="#E6DFCF"
        strokeWidth="3"
      />
      {traceTarget === 'word' ? (
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fontFamily="Fredoka, sans-serif"
          fontSize="36"
          fontWeight="700"
          fill="#5B5BD6"
        >
          {numeral}
        </text>
      ) : (
        <rect x="20" y="18" width="60" height="26" rx="13" fill="#ECEBFF" />
      )}
      {traceTarget === 'digit' && (
        <text
          x="50"
          y="36"
          textAnchor="middle"
          fontFamily="Fredoka, sans-serif"
          fontSize="16"
          fontWeight="700"
          fill="#4A4AB5"
        >
          {wordLabel.toUpperCase()}
        </text>
      )}
      {numeral === 0 ? (
        <g>
          <ellipse
            cx="50"
            cy="70"
            rx="22"
            ry="10"
            fill="none"
            stroke="#C7CDD8"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          <text
            x="50"
            y="73.5"
            textAnchor="middle"
            fontFamily="Google Sans, sans-serif"
            fontSize="9.5"
            fontWeight="500"
            fill="#7B8398"
          >
            0 pebbles
          </text>
        </g>
      ) : (
        pebbles.map((p) => (
          <ellipse
            key={p.idx}
            cx={p.cx}
            cy={p.cy}
            rx="6"
            ry="5"
            fill={p.color}
          />
        ))
      )}
    </svg>
  );
}

export function WordTraceCardArt({ art, size = 84 }: WordTraceCardArtProps) {
  if (art.kind === 'word-fun') {
    return <WordFunArt id={art.artId} size={size} />;
  }
  if (art.kind === 'word-illus') {
    return <WordIllustration id={art.artId} size={size} />;
  }
  if (art.kind === 'number-card') {
    return (
      <NumberCardArt
        numeral={art.numeral}
        wordLabel={art.wordLabel}
        traceTarget={art.traceTarget}
        size={size}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {renderSightMiniArt(art.sightId)}
    </svg>
  );
}

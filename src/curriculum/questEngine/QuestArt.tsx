import type { ReactNode } from 'react';
import {
  TappableReadAlongPhrase,
  WordSoundButton,
} from '../../components/WordSoundButton';
import { WordIllustration } from '../../games/letter-train/WordIllustration';
import { assetUrl } from '../../utils/assets';
import type { QuestArtSpec, QuestIconId } from './questTypes';

interface QuestArtProps {
  spec: QuestArtSpec;
  size?: number;
  solvedClipId?: string;
}

/**
 * Concrete K1 visual of ONE "10-Bundle": a cozy tied 2×5 ten-frame holding 10 countable pebbles
 * plus a bold "10" badge so a 4-year-old immediately sees WHY a bundle equals 10!
 */
export function TenPebbleBundleArt({
  compact = false,
  skipCountLabel,
}: {
  compact?: boolean;
  skipCountLabel?: string;
}) {
  const w = compact ? 38 : 44;
  const h = compact ? 66 : 74;
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
      title="1 bundle of 10 pebbles"
    >
      <svg width={w} height={h} viewBox="0 0 44 76" aria-hidden="true" style={{ display: 'block' }}>
        {/* Cozy Indigo ten-frame pouch */}
        <rect
          x="3"
          y="12"
          width="38"
          height="61"
          rx="10"
          fill="#ECEBFF"
          stroke="#5B5BD6"
          strokeWidth="2.8"
        />
        {/* Warm ribbon tie across middle */}
        <rect x="2" y="39" width="40" height="7" rx="3" fill="#5B5BD6" opacity="0.22" />
        {/* 2 columns × 5 rows = 10 countable pebbles */}
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1].map((col) => {
            const cx = col === 0 ? 15 : 29;
            const cy = 22 + row * 10.5;
            return (
              <g key={`${row}-${col}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="4.2"
                  fill="#5B5BD6"
                  stroke="#3E3EB0"
                  strokeWidth="1.2"
                />
                <circle cx={cx - 1.2} cy={cy - 1.2} r="1.1" fill="#FFFFFF" opacity="0.65" />
              </g>
            );
          }),
        )}
        {/* Top "10" pill badge */}
        <rect x="8" y="1" width="28" height="16" rx="8" fill="#5B5BD6" />
        <text
          x="22"
          y="9.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Fredoka, sans-serif"
          fontSize="11"
          fontWeight="700"
          fill="#FFFFFF"
        >
          10
        </text>
      </svg>
      {skipCountLabel && (
        <span
          className="font-display"
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#4343B5',
            background: '#ECEBFF',
            padding: '1px 6px',
            borderRadius: 999,
            lineHeight: 1.2,
          }}
        >
          {skipCountLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Concrete K1 visual of ONE single Coral river pebble with a "1" badge.
 */
export function OnePebbleArt({ compact = false }: { compact?: boolean }) {
  const s = compact ? 24 : 28;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <circle cx="14" cy="14" r="12" fill="#F27A5E" stroke="#C9583D" strokeWidth="2.2" />
      <ellipse cx="10" cy="9" rx="3.5" ry="2" transform="rotate(-25 10 9)" fill="#FFFFFF" opacity="0.45" />
      <text
        x="14"
        y="15"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Fredoka, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#FFFFFF"
      >
        1
      </text>
    </svg>
  );
}

function renderQuestIcon(id: QuestIconId): ReactNode {
  switch (id) {
    /* ================= 2D SHAPES ================= */
    case 'shape-circle':
      return (
        <>
          <circle cx="50" cy="50" r="34" fill="#3BA99C" stroke="#257D73" strokeWidth="4" />
          <ellipse cx="38" cy="36" rx="9" ry="5" transform="rotate(-30 38 36)" fill="#FFFFFF" opacity="0.45" />
        </>
      );
    case 'shape-square':
      return (
        <>
          <rect x="18" y="18" width="64" height="64" rx="5" fill="#5B5BD6" stroke="#4242B0" strokeWidth="4" />
          <rect x="26" y="26" width="18" height="8" rx="4" fill="#FFFFFF" opacity="0.4" />
        </>
      );
    case 'shape-rectangle':
      return (
        <>
          <rect x="10" y="27" width="80" height="46" rx="5" fill="#F27A5E" stroke="#D15B40" strokeWidth="4" />
          <rect x="18" y="34" width="24" height="7" rx="3.5" fill="#FFFFFF" opacity="0.42" />
        </>
      );
    case 'shape-triangle':
      return (
        <>
          <polygon
            points="50,14 86,80 14,80"
            fill="#F2B84B"
            stroke="#CE9326"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <line x1="47" y1="28" x2="31" y2="58" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
        </>
      );

    /* ================= 3D SHAPES ================= */
    case 'shape-sphere':
      return (
        <>
          <ellipse cx="52" cy="84" rx="26" ry="6" fill="#1E2433" opacity="0.12" />
          <circle cx="50" cy="48" r="33" fill="#258F83" />
          <circle cx="46" cy="44" r="28" fill="#3BA99C" />
          <ellipse cx="50" cy="48" rx="33" ry="11" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.6" />
          <ellipse cx="36" cy="32" rx="10" ry="6" transform="rotate(-28 36 32)" fill="#FFFFFF" opacity="0.65" />
        </>
      );
    case 'shape-cube':
      return (
        <>
          <polygon points="50,14 82,30 50,46 18,30" fill="#8585EC" stroke="#4242B0" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="18,30 50,46 50,84 18,68" fill="#5B5BD6" stroke="#4242B0" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50,46 82,30 82,68 50,84" fill="#4343B5" stroke="#4242B0" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      );
    case 'shape-cone':
      return (
        <>
          <ellipse cx="50" cy="82" rx="28" ry="8" fill="#1E2433" opacity="0.12" />
          <path d="M50 14 L20 74 A30 9 0 0 0 80 74 Z" fill="#F27A5E" stroke="#C9583D" strokeWidth="3" strokeLinejoin="round" />
          <path d="M50 14 L50 83 A30 9 0 0 0 80 74 Z" fill="#DA6448" opacity="0.55" />
          <ellipse cx="50" cy="74" rx="30" ry="8.5" fill="none" stroke="#C9583D" strokeWidth="2.5" strokeDasharray="4 4" />
        </>
      );
    case 'shape-cylinder':
      return (
        <>
          <path d="M24 28 L24 72 A26 9 0 0 0 76 72 L76 28 Z" fill="#F2B84B" stroke="#C98E22" strokeWidth="3" />
          <path d="M52 28 L52 80 A26 9 0 0 0 76 72 L76 28 Z" fill="#DFA235" opacity="0.45" />
          <ellipse cx="50" cy="28" rx="26" ry="9" fill="#FAD27D" stroke="#C98E22" strokeWidth="3" />
        </>
      );

    /* ================= EVERYDAY SHAPE OBJECTS ================= */
    case 'obj-clock':
      return (
        <>
          <circle cx="50" cy="50" r="34" fill="#FFFFFF" stroke="#5B5BD6" strokeWidth="6" />
          <circle cx="50" cy="22" r="2.5" fill="#5C6478" />
          <circle cx="78" cy="50" r="2.5" fill="#5C6478" />
          <circle cx="50" cy="78" r="2.5" fill="#5C6478" />
          <circle cx="22" cy="50" r="2.5" fill="#5C6478" />
          <line x1="50" y1="50" x2="50" y2="30" stroke="#1E2433" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="66" y2="50" stroke="#F27A5E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill="#5B5BD6" />
        </>
      );
    case 'obj-window':
      return (
        <>
          <rect x="20" y="20" width="60" height="60" rx="4" fill="#D9F3F0" stroke="#8C5A3C" strokeWidth="6" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#8C5A3C" strokeWidth="5" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#8C5A3C" strokeWidth="5" />
        </>
      );
    case 'obj-door':
      return (
        <>
          <rect x="28" y="12" width="44" height="76" rx="4" fill="#D97B48" stroke="#8C4A27" strokeWidth="4" />
          <rect x="35" y="20" width="30" height="24" rx="2" fill="#E89565" />
          <rect x="35" y="52" width="30" height="26" rx="2" fill="#E89565" />
          <circle cx="64" cy="50" r="4" fill="#F2B84B" />
        </>
      );
    case 'obj-pizza-slice':
      return (
        <>
          <polygon points="50,14 84,80 16,80" fill="#F7C95E" stroke="#D18A2E" strokeWidth="4" strokeLinejoin="round" />
          <path d="M14 80 Q50 88 86 80" stroke="#C97828" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="46" r="6" fill="#E85349" />
          <circle cx="38" cy="66" r="6" fill="#E85349" />
          <circle cx="61" cy="64" r="6" fill="#E85349" />
        </>
      );
    case 'obj-basketball':
      return (
        <>
          <circle cx="50" cy="50" r="33" fill="#F27A5E" stroke="#B84B32" strokeWidth="3.5" />
          <path d="M17 50 L83 50" stroke="#7A2E1D" strokeWidth="3" />
          <path d="M50 17 L50 83" stroke="#7A2E1D" strokeWidth="3" />
          <path d="M26 26 Q50 50 26 74" stroke="#7A2E1D" strokeWidth="3" fill="none" />
          <path d="M74 26 Q50 50 74 74" stroke="#7A2E1D" strokeWidth="3" fill="none" />
        </>
      );
    case 'obj-dice':
      return (
        <>
          <polygon points="50,15 80,30 50,45 20,30" fill="#FFFFFF" stroke="#5C6478" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="20,30 50,45 50,82 20,67" fill="#F3F1EC" stroke="#5C6478" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="50,45 80,30 80,67 50,82" fill="#E2DFD7" stroke="#5C6478" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="50" cy="30" r="3.5" fill="#F27A5E" />
          <circle cx="30" cy="48" r="3" fill="#1E2433" />
          <circle cx="40" cy="62" r="3" fill="#1E2433" />
          <circle cx="60" cy="48" r="3" fill="#1E2433" />
          <circle cx="65" cy="56" r="3" fill="#1E2433" />
          <circle cx="70" cy="64" r="3" fill="#1E2433" />
        </>
      );
    case 'obj-party-hat':
      return (
        <>
          <path d="M50 18 L22 78 Q50 88 78 78 Z" fill="#5B5BD6" stroke="#3F3FA8" strokeWidth="3" />
          <circle cx="50" cy="15" r="7" fill="#F2B84B" />
          <circle cx="44" cy="48" r="4.5" fill="#3BA99C" />
          <circle cx="58" cy="58" r="4.5" fill="#F27A5E" />
          <circle cx="36" cy="68" r="4.5" fill="#F2B84B" />
        </>
      );
    case 'obj-soup-can':
      return (
        <>
          <path d="M26 26 L26 74 A24 8 0 0 0 74 74 L74 26 Z" fill="#E85349" stroke="#A6352D" strokeWidth="3" />
          <rect x="26" y="42" width="48" height="20" fill="#FFFFFF" />
          <circle cx="50" cy="52" r="6" fill="#F2B84B" />
          <ellipse cx="50" cy="26" rx="24" ry="8" fill="#D5DCE6" stroke="#7E889B" strokeWidth="3" />
        </>
      );

    /* ================= PRE-MATH BEAKERS & COMPARISONS ================= */
    case 'beaker-empty':
    case 'beaker-quarter':
    case 'beaker-half':
    case 'beaker-full': {
      const fillTop =
        id === 'beaker-empty'
          ? 82
          : id === 'beaker-quarter'
            ? 67
            : id === 'beaker-half'
              ? 51
              : 24;
      const fillHeight = Math.max(0, 82 - fillTop);
      return (
        <>
          <rect x="26" y="18" width="48" height="66" rx="6" fill="#F4F8FA" stroke="#5C6478" strokeWidth="4" />
          {fillHeight > 0 && (
            <rect x="29" y={fillTop} width="42" height={fillHeight} rx="3" fill="#3BA99C" />
          )}
          <line x1="28" y1="35" x2="38" y2="35" stroke="#5C6478" strokeWidth="2.5" />
          <line x1="28" y1="51" x2="42" y2="51" stroke="#5C6478" strokeWidth="2.5" />
          <line x1="28" y1="67" x2="38" y2="67" stroke="#5C6478" strokeWidth="2.5" />
          <rect x="26" y="18" width="48" height="66" rx="6" fill="none" stroke="#5C6478" strokeWidth="4" />
        </>
      );
    }
    case 'cmp-heavy-rock':
      return (
        <>
          <path d="M16 72 L24 38 L48 24 L78 34 L86 68 L68 80 L28 80 Z" fill="#6E778A" stroke="#454D5E" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M32 42 L50 32 L68 40" stroke="#9AA3B5" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case 'cmp-light-feather':
      return (
        <>
          <path d="M22 78 Q46 46 78 20" stroke="#258F83" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M30 68 C22 44, 48 18, 78 20 C76 48, 52 72, 30 68 Z" fill="#7AD4C8" opacity="0.88" />
        </>
      );
    case 'cmp-tall-pine':
      return (
        <>
          <rect x="44" y="68" width="12" height="20" rx="2" fill="#8C5A3C" />
          <polygon points="50,10 74,40 26,40" fill="#2E8B7D" />
          <polygon points="50,26 78,56 22,56" fill="#3BA99C" />
          <polygon points="50,42 82,72 18,72" fill="#2E8B7D" />
        </>
      );
    case 'cmp-short-bush':
      return (
        <>
          <rect x="45" y="74" width="10" height="12" rx="2" fill="#8C5A3C" />
          <circle cx="36" cy="68" r="14" fill="#3BA99C" />
          <circle cx="64" cy="68" r="14" fill="#3BA99C" />
          <circle cx="50" cy="60" r="16" fill="#4BBCA9" />
          <circle cx="42" cy="64" r="3" fill="#F27A5E" />
          <circle cx="58" cy="68" r="3" fill="#F2B84B" />
        </>
      );
    case 'cmp-big-melon':
      return (
        <>
          <circle cx="50" cy="50" r="36" fill="#2E8B7D" />
          <path d="M34 17 Q26 50 34 83" stroke="#1E5E54" strokeWidth="5" fill="none" />
          <path d="M50 14 Q44 50 50 86" stroke="#1E5E54" strokeWidth="5" fill="none" />
          <path d="M66 17 Q74 50 66 83" stroke="#1E5E54" strokeWidth="5" fill="none" />
        </>
      );
    case 'cmp-small-berry':
      return (
        <>
          <circle cx="50" cy="56" r="13" fill="#E85349" />
          <path d="M44 43 L50 36 L56 43" stroke="#3BA99C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="46" cy="52" r="2.5" fill="#FFFFFF" opacity="0.6" />
        </>
      );

    /* ================= DIRECTIONS ================= */
    case 'dir-left':
    case 'dir-right':
    case 'dir-up':
    case 'dir-down': {
      const rot =
        id === 'dir-right'
          ? 0
          : id === 'dir-down'
            ? 90
            : id === 'dir-left'
              ? 180
              : -90;
      return (
        <g transform={`rotate(${rot} 50 50)`}>
          <circle cx="50" cy="50" r="36" fill="#ECEBFF" />
          <path
            d="M22 50 L68 50 M52 32 L72 50 L52 68"
            stroke="#5B5BD6"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      );
    }

    /* ================= TIMES OF DAY ================= */
    case 'time-morning':
      return (
        <>
          <rect x="12" y="16" width="76" height="68" rx="14" fill="#FFF3D6" />
          <circle cx="50" cy="64" r="18" fill="#F2B84B" />
          <path d="M12 64 Q50 54 88 64 L88 84 L12 84 Z" fill="#67C29C" />
          <g stroke="#F29F58" strokeWidth="3.5" strokeLinecap="round">
            <line x1="50" y1="36" x2="50" y2="26" />
            <line x1="30" y1="44" x2="22" y2="36" />
            <line x1="70" y1="44" x2="78" y2="36" />
          </g>
        </>
      );
    case 'time-afternoon':
      return (
        <>
          <rect x="12" y="16" width="76" height="68" rx="14" fill="#BCE8F7" />
          <circle cx="50" cy="36" r="15" fill="#F2B84B" />
          <path d="M12 72 Q50 66 88 72 L88 84 L12 84 Z" fill="#3BA99C" />
        </>
      );
    case 'time-evening':
      return (
        <>
          <rect x="12" y="16" width="76" height="68" rx="14" fill="#F9B895" />
          <rect x="12" y="16" width="76" height="26" rx="14" fill="#8C7AE6" opacity="0.55" />
          <circle cx="50" cy="66" r="15" fill="#F27A5E" />
          <rect x="12" y="68" width="76" height="16" rx="6" fill="#3D4663" />
        </>
      );
    case 'time-night':
      return (
        <>
          <rect x="12" y="16" width="76" height="68" rx="14" fill="#2A3352" />
          <path d="M56 28 A16 16 0 1 0 70 54 A13 13 0 1 1 56 28 Z" fill="#F7D774" />
          <circle cx="30" cy="34" r="2.5" fill="#FFFFFF" />
          <circle cx="40" cy="52" r="2" fill="#FFFFFF" />
          <circle cx="26" cy="62" r="2.2" fill="#F7D774" />
          <circle cx="72" cy="70" r="2" fill="#FFFFFF" />
        </>
      );

    /* ================= ALL ABOUT ME, SENSES & HABITS ================= */
    case 'sense-eyes':
      return (
        <>
          <ellipse cx="32" cy="50" rx="16" ry="12" fill="#FFFFFF" stroke="#1E2433" strokeWidth="3" />
          <circle cx="32" cy="50" r="6.5" fill="#5B5BD6" />
          <circle cx="32" cy="50" r="3" fill="#1E2433" />
          <ellipse cx="68" cy="50" rx="16" ry="12" fill="#FFFFFF" stroke="#1E2433" strokeWidth="3" />
          <circle cx="68" cy="50" r="6.5" fill="#5B5BD6" />
          <circle cx="68" cy="50" r="3" fill="#1E2433" />
          <path d="M18 34 Q32 26 46 34" stroke="#4A3528" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M54 34 Q68 26 82 34" stroke="#4A3528" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'sense-ears':
      return (
        <>
          <path d="M36 26 C56 16, 72 34, 66 56 C62 72, 46 80, 38 72 C34 68, 36 60, 42 60" fill="#F5C4A1" stroke="#B87D56" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 38 C54 34, 58 46, 52 56" stroke="#B87D56" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M74 36 Q82 50 74 64" stroke="#3BA99C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'sense-nose':
      return (
        <>
          <path d="M48 22 L40 58 C34 62, 34 72, 44 72 L58 72 C66 72, 66 62, 60 58 L52 22" fill="#F5C4A1" stroke="#B87D56" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="44" cy="67" r="3" fill="#8C5A3C" />
          <circle cx="56" cy="67" r="3" fill="#8C5A3C" />
        </>
      );
    case 'sense-tongue':
      return (
        <>
          <path d="M22 42 Q50 50 78 42 C76 66, 24 66, 22 42 Z" fill="#7A2E3A" />
          <path d="M36 45 L36 68 A14 14 0 0 0 64 68 L64 45 Z" fill="#F27A5E" stroke="#C9583D" strokeWidth="3" />
          <line x1="50" y1="46" x2="50" y2="68" stroke="#C9583D" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 'sense-hands':
      return (
        <>
          <rect x="32" y="46" width="36" height="34" rx="14" fill="#F5C4A1" stroke="#B87D56" strokeWidth="3" />
          <rect x="33" y="22" width="7" height="28" rx="3.5" fill="#F5C4A1" stroke="#B87D56" strokeWidth="2.5" />
          <rect x="42" y="18" width="7" height="32" rx="3.5" fill="#F5C4A1" stroke="#B87D56" strokeWidth="2.5" />
          <rect x="51" y="20" width="7" height="30" rx="3.5" fill="#F5C4A1" stroke="#B87D56" strokeWidth="2.5" />
          <rect x="60" y="26" width="7" height="24" rx="3.5" fill="#F5C4A1" stroke="#B87D56" strokeWidth="2.5" />
          <rect x="24" y="46" width="12" height="8" rx="4" transform="rotate(-28 24 46)" fill="#F5C4A1" stroke="#B87D56" strokeWidth="2.5" />
        </>
      );
    case 'body-knees':
      return (
        <>
          <rect x="30" y="16" width="14" height="64" rx="7" fill="#F5C4A1" />
          <rect x="56" y="16" width="14" height="64" rx="7" fill="#F5C4A1" />
          <circle cx="37" cy="48" r="8" fill="#F27A5E" opacity="0.45" />
          <circle cx="63" cy="48" r="8" fill="#F27A5E" opacity="0.45" />
          <rect x="28" y="14" width="44" height="18" rx="4" fill="#5B5BD6" />
        </>
      );
    case 'body-feet':
      return (
        <>
          <ellipse cx="35" cy="56" rx="12" ry="22" fill="#F5C4A1" stroke="#B87D56" strokeWidth="3" />
          <ellipse cx="65" cy="56" rx="12" ry="22" fill="#F5C4A1" stroke="#B87D56" strokeWidth="3" />
          <circle cx="29" cy="30" r="3.5" fill="#F5C4A1" />
          <circle cx="36" cy="29" r="3" fill="#F5C4A1" />
          <circle cx="42" cy="31" r="2.6" fill="#F5C4A1" />
          <circle cx="58" cy="31" r="2.6" fill="#F5C4A1" />
          <circle cx="64" cy="29" r="3" fill="#F5C4A1" />
          <circle cx="71" cy="30" r="3.5" fill="#F5C4A1" />
        </>
      );
    case 'body-shoulders':
      return (
        <>
          <circle cx="50" cy="28" r="13" fill="#F5C4A1" />
          <path d="M20 76 C20 52, 80 52, 80 76 Z" fill="#3BA99C" />
          <circle cx="27" cy="58" r="8" fill="#F2B84B" opacity="0.85" />
          <circle cx="73" cy="58" r="8" fill="#F2B84B" opacity="0.85" />
        </>
      );
    case 'stage-baby':
      return (
        <>
          <ellipse cx="50" cy="60" rx="22" ry="24" fill="#ECEBFF" stroke="#5B5BD6" strokeWidth="3" />
          <circle cx="50" cy="38" r="15" fill="#F5C4A1" />
          <path d="M47 23 Q53 18 54 25" stroke="#4A3528" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="45" cy="37" r="2.2" fill="#1E2433" />
          <circle cx="55" cy="37" r="2.2" fill="#1E2433" />
          <circle cx="50" cy="44" r="4" fill="#F27A5E" />
        </>
      );
    case 'stage-child':
      return (
        <>
          <rect x="34" y="48" width="32" height="34" rx="10" fill="#F2B84B" />
          <circle cx="50" cy="32" r="15" fill="#F5C4A1" />
          <path d="M35 28 Q50 14 65 28" fill="#4A3528" />
          <circle cx="45" cy="33" r="2.3" fill="#1E2433" />
          <circle cx="55" cy="33" r="2.3" fill="#1E2433" />
          <path d="M45 40 Q50 44 55 40" stroke="#1E2433" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'stage-adult':
      return (
        <>
          <rect x="28" y="44" width="44" height="42" rx="12" fill="#3BA99C" />
          <circle cx="50" cy="27" r="15" fill="#F5C4A1" />
          <path d="M34 25 Q50 10 66 25" fill="#3B2A20" />
          <circle cx="45" cy="28" r="2.3" fill="#1E2433" />
          <circle cx="55" cy="28" r="2.3" fill="#1E2433" />
          <path d="M45 35 Q50 38 55 35" stroke="#1E2433" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'stage-elder':
      return (
        <>
          <rect x="28" y="46" width="44" height="40" rx="12" fill="#5B5BD6" />
          <circle cx="50" cy="29" r="15" fill="#F5C4A1" />
          <path d="M34 26 Q50 11 66 26" fill="#D5DCE6" />
          <circle cx="44" cy="30" r="4.5" fill="none" stroke="#4A3528" strokeWidth="2" />
          <circle cx="56" cy="30" r="4.5" fill="none" stroke="#4A3528" strokeWidth="2" />
          <line x1="48.5" y1="30" x2="51.5" y2="30" stroke="#4A3528" strokeWidth="2" />
          <path d="M45 37 Q50 40 55 37" stroke="#1E2433" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    case 'habit-brush-teeth':
      return (
        <>
          <rect x="16" y="54" width="68" height="10" rx="5" fill="#3BA99C" />
          <rect x="60" y="40" width="20" height="14" rx="3" fill="#FFFFFF" stroke="#D5DCE6" strokeWidth="2" />
          <path d="M62 40 Q70 30 78 40" fill="#7AD4C8" />
        </>
      );
    case 'habit-wash-hands':
      return (
        <>
          <circle cx="50" cy="56" r="18" fill="#F5C4A1" />
          <circle cx="36" cy="40" r="9" fill="#BCE8F7" opacity="0.85" />
          <circle cx="62" cy="38" r="11" fill="#BCE8F7" opacity="0.85" />
          <circle cx="50" cy="28" r="7" fill="#E4F6F3" />
          <circle cx="64" cy="60" r="8" fill="#BCE8F7" opacity="0.85" />
        </>
      );
    case 'habit-sleep-well':
      return (
        <>
          <rect x="16" y="48" width="68" height="32" rx="8" fill="#5B5BD6" />
          <rect x="20" y="38" width="24" height="14" rx="6" fill="#FFFFFF" />
          <circle cx="32" cy="42" r="9" fill="#F5C4A1" />
          <text x="64" y="34" fontFamily="Fredoka, sans-serif" fontSize="16" fontWeight="700" fill="#5B5BD6">Zzz</text>
        </>
      );
    case 'habit-litter-no':
      return (
        <>
          <rect x="30" y="34" width="40" height="48" rx="5" fill="#3BA99C" />
          <rect x="26" y="26" width="48" height="8" rx="4" fill="#258F83" />
          <circle cx="50" cy="18" r="6" fill="#F2B84B" />
        </>
      );
    case 'food-healthy-plate':
      return (
        <>
          <circle cx="50" cy="52" r="34" fill="#FFFFFF" stroke="#D5DCE6" strokeWidth="4" />
          <circle cx="38" cy="44" r="11" fill="#E85349" />
          <circle cx="60" cy="44" r="11" fill="#3BA99C" />
          <rect x="38" y="60" width="24" height="10" rx="5" fill="#F2B84B" />
        </>
      );
    case 'food-candy-soda':
      return (
        <>
          <rect x="44" y="28" width="28" height="50" rx="5" fill="#E85349" />
          <path d="M58 28 L58 14 L68 14" stroke="#5B5BD6" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="60" r="12" fill="#F27A5E" />
          <polygon points="18,60 10,53 10,67" fill="#F2B84B" />
          <polygon points="42,60 50,53 50,67" fill="#F2B84B" />
        </>
      );
    case 'food-fries':
      return (
        <>
          <rect x="32" y="22" width="7" height="34" rx="3" fill="#F2B84B" />
          <rect x="42" y="16" width="7" height="40" rx="3" fill="#F7C95E" />
          <rect x="52" y="18" width="7" height="38" rx="3" fill="#F2B84B" />
          <rect x="62" y="24" width="7" height="32" rx="3" fill="#F7C95E" />
          <polygon points="26,44 74,44 68,82 32,82" fill="#E85349" />
        </>
      );

    /* ================= COMMUNITY HELPERS ================= */
    case 'helper-doctor':
      return (
        <>
          <rect x="26" y="48" width="48" height="36" rx="12" fill="#FFFFFF" stroke="#D5DCE6" strokeWidth="3" />
          <circle cx="50" cy="30" r="15" fill="#F5C4A1" />
          <path d="M38 48 L38 64 M62 48 L62 64" stroke="#3BA99C" strokeWidth="4" strokeLinecap="round" />
          <circle cx="62" cy="67" r="4.5" fill="#3BA99C" />
          <rect x="47" y="58" width="6" height="16" rx="1" fill="#E85349" />
          <rect x="42" y="63" width="16" height="6" rx="1" fill="#E85349" />
        </>
      );
    case 'helper-firefighter':
      return (
        <>
          <rect x="26" y="50" width="48" height="34" rx="12" fill="#E85349" />
          <rect x="26" y="64" width="48" height="7" fill="#F2B84B" />
          <circle cx="50" cy="34" r="14" fill="#F5C4A1" />
          <path d="M28 28 Q50 8 72 28 Z" fill="#E85349" />
          <rect x="45" y="16" width="10" height="8" rx="2" fill="#F2B84B" />
        </>
      );
    case 'helper-teacher':
      return (
        <>
          <rect x="16" y="18" width="68" height="42" rx="5" fill="#2E8B7D" stroke="#8C5A3C" strokeWidth="4" />
          <text x="26" y="45" fontFamily="Fredoka, sans-serif" fontSize="18" fontWeight="700" fill="#FFFFFF">ABC</text>
          <circle cx="66" cy="68" r="12" fill="#F5C4A1" />
          <rect x="54" y="78" width="24" height="10" rx="5" fill="#5B5BD6" />
        </>
      );
    case 'helper-chef':
      return (
        <>
          <rect x="28" y="52" width="44" height="32" rx="10" fill="#FFFFFF" stroke="#D5DCE6" strokeWidth="3" />
          <circle cx="50" cy="38" r="13" fill="#F5C4A1" />
          <circle cx="40" cy="18" r="9" fill="#FFFFFF" />
          <circle cx="50" cy="15" r="10" fill="#FFFFFF" />
          <circle cx="60" cy="18" r="9" fill="#FFFFFF" />
          <rect x="36" y="20" width="28" height="8" fill="#FFFFFF" />
        </>
      );
    case 'helper-farmer':
      return (
        <>
          <rect x="28" y="50" width="44" height="34" rx="10" fill="#3BA99C" />
          <circle cx="50" cy="34" r="14" fill="#F5C4A1" />
          <ellipse cx="50" cy="22" rx="24" ry="6" fill="#F2B84B" />
          <path d="M36 22 Q50 8 64 22 Z" fill="#E0A134" />
        </>
      );
    case 'helper-pilot':
      return (
        <>
          <rect x="28" y="50" width="44" height="34" rx="10" fill="#2A3352" />
          <circle cx="50" cy="34" r="14" fill="#F5C4A1" />
          <path d="M32 24 Q50 12 68 24 Z" fill="#2A3352" />
          <rect x="44" y="16" width="12" height="5" rx="2" fill="#F2B84B" />
        </>
      );
    case 'helper-postman':
      return (
        <>
          <rect x="28" y="48" width="44" height="36" rx="10" fill="#4A6FA5" />
          <circle cx="50" cy="32" r="13" fill="#F5C4A1" />
          <rect x="48" y="56" width="26" height="18" rx="3" fill="#FFFFFF" stroke="#F27A5E" strokeWidth="2.5" />
          <polyline points="48,57 61,66 74,57" fill="none" stroke="#F27A5E" strokeWidth="2.5" />
        </>
      );

    /* ================= LIFECYCLES & PLANTS ================= */
    case 'life-butterfly-egg':
      return (
        <>
          <ellipse cx="50" cy="54" rx="34" ry="20" transform="rotate(-15 50 54)" fill="#3BA99C" />
          <circle cx="44" cy="50" r="6" fill="#FFFDF7" stroke="#D5DCE6" strokeWidth="2" />
          <circle cx="56" cy="48" r="6" fill="#FFFDF7" stroke="#D5DCE6" strokeWidth="2" />
          <circle cx="50" cy="58" r="6" fill="#FFFDF7" stroke="#D5DCE6" strokeWidth="2" />
        </>
      );
    case 'life-caterpillar':
      return (
        <>
          <circle cx="72" cy="60" r="10" fill="#4BBCA9" />
          <circle cx="58" cy="56" r="11" fill="#3BA99C" />
          <circle cx="44" cy="60" r="11" fill="#4BBCA9" />
          <circle cx="28" cy="52" r="13" fill="#F27A5E" />
          <circle cx="24" cy="49" r="2.5" fill="#1E2433" />
          <path d="M24 39 L20 30 M30 39 L34 30" stroke="#4A3528" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 'life-chrysalis':
      return (
        <>
          <line x1="20" y1="22" x2="80" y2="22" stroke="#8C5A3C" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="22" x2="50" y2="34" stroke="#8C5A3C" strokeWidth="3" />
          <path d="M50 34 C36 42, 38 70, 50 82 C62 70, 64 42, 50 34 Z" fill="#2E8B7D" stroke="#1E5E54" strokeWidth="3" />
        </>
      );
    case 'life-butterfly':
      return (
        <>
          <ellipse cx="32" cy="38" rx="18" ry="15" fill="#F27A5E" />
          <ellipse cx="68" cy="38" rx="18" ry="15" fill="#F27A5E" />
          <ellipse cx="34" cy="64" rx="14" ry="12" fill="#F2B84B" />
          <ellipse cx="66" cy="64" rx="14" ry="12" fill="#F2B84B" />
          <rect x="46" y="28" width="8" height="46" rx="4" fill="#2A3352" />
          <path d="M48 28 Q40 16 34 18 M52 28 Q60 16 66 18" stroke="#2A3352" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'life-frog-spawn':
      return (
        <>
          <circle cx="50" cy="52" r="30" fill="#BCE8F7" />
          <circle cx="40" cy="44" r="7" fill="#FFFFFF" opacity="0.8" /><circle cx="40" cy="44" r="2.5" fill="#1E2433" />
          <circle cx="58" cy="46" r="7" fill="#FFFFFF" opacity="0.8" /><circle cx="58" cy="46" r="2.5" fill="#1E2433" />
          <circle cx="48" cy="60" r="7" fill="#FFFFFF" opacity="0.8" /><circle cx="48" cy="60" r="2.5" fill="#1E2433" />
        </>
      );
    case 'life-tadpole':
      return (
        <>
          <path d="M48 50 Q72 42 84 52 Q72 60 48 54 Z" fill="#2E8B7D" />
          <ellipse cx="36" cy="52" rx="16" ry="12" fill="#3BA99C" />
          <circle cx="28" cy="49" r="2.5" fill="#1E2433" />
        </>
      );
    case 'life-froglet':
      return (
        <>
          <path d="M54 52 Q74 46 82 54 Q72 60 54 56 Z" fill="#2E8B7D" />
          <ellipse cx="40" cy="52" rx="18" ry="13" fill="#3BA99C" />
          <path d="M46 62 L54 74 M30 62 L24 74" stroke="#2E8B7D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="30" cy="48" r="2.8" fill="#1E2433" />
        </>
      );
    case 'life-frog':
      return <WordIllustration id="frog" size={84} />;
    case 'life-seed':
      return (
        <>
          <rect x="14" y="54" width="72" height="30" rx="8" fill="#8C5A3C" />
          <ellipse cx="50" cy="64" rx="12" ry="8" transform="rotate(-20 50 64)" fill="#F2B84B" stroke="#C98E22" strokeWidth="2.5" />
        </>
      );
    case 'life-sprout':
      return (
        <>
          <rect x="14" y="64" width="72" height="20" rx="6" fill="#8C5A3C" />
          <path d="M50 66 L50 42" stroke="#3BA99C" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="40" cy="42" rx="10" ry="6" transform="rotate(-25 40 42)" fill="#4BBCA9" />
          <ellipse cx="60" cy="42" rx="10" ry="6" transform="rotate(25 60 42)" fill="#4BBCA9" />
        </>
      );
    case 'life-sapling':
      return (
        <>
          <rect x="14" y="68" width="72" height="16" rx="6" fill="#8C5A3C" />
          <path d="M50 70 L50 28" stroke="#2E8B7D" strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="38" cy="48" rx="12" ry="7" transform="rotate(-25 38 48)" fill="#3BA99C" />
          <ellipse cx="62" cy="44" rx="12" ry="7" transform="rotate(25 62 44)" fill="#3BA99C" />
          <ellipse cx="50" cy="26" rx="9" ry="12" fill="#4BBCA9" />
        </>
      );
    case 'life-fruit-tree':
      return (
        <>
          <rect x="43" y="54" width="14" height="30" rx="3" fill="#8C5A3C" />
          <circle cx="50" cy="38" r="26" fill="#3BA99C" />
          <circle cx="38" cy="34" r="5" fill="#E85349" />
          <circle cx="60" cy="30" r="5" fill="#E85349" />
          <circle cx="52" cy="48" r="5" fill="#E85349" />
        </>
      );
    case 'plant-roots':
      return (
        <>
          <rect x="14" y="48" width="72" height="36" rx="8" fill="#8C5A3C" />
          <line x1="50" y1="24" x2="50" y2="52" stroke="#3BA99C" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 52 L34 74 M50 54 L50 78 M50 52 L66 74 M42 63 L30 68 M58 63 L70 68" stroke="#F7D774" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'plant-stem':
      return (
        <>
          <line x1="50" y1="18" x2="50" y2="82" stroke="#3BA99C" strokeWidth="9" strokeLinecap="round" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="#F27A5E" strokeWidth="3.5" strokeDasharray="4 3" />
        </>
      );
    case 'plant-leaf':
      return <WordIllustration id="leaf" size={84} />;
    case 'plant-flower':
      return <WordIllustration id="flower" size={84} />;
    case 'plant-shrub':
      return (
        <>
          <circle cx="34" cy="62" r="16" fill="#2E8B7D" />
          <circle cx="66" cy="62" r="16" fill="#2E8B7D" />
          <circle cx="50" cy="52" r="20" fill="#3BA99C" />
          <circle cx="42" cy="52" r="4" fill="#F27A5E" />
          <circle cx="58" cy="58" r="4" fill="#F27A5E" />
        </>
      );
    case 'plant-climber':
      return (
        <>
          <line x1="50" y1="14" x2="50" y2="86" stroke="#A47148" strokeWidth="6" strokeLinecap="round" />
          <path d="M44 80 Q62 66 44 52 Q62 38 44 22" stroke="#3BA99C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="62" r="5" fill="#4BBCA9" />
          <circle cx="38" cy="46" r="5" fill="#4BBCA9" />
          <circle cx="60" cy="32" r="5" fill="#4BBCA9" />
        </>
      );
    case 'plant-cotton-shirt':
      return (
        <>
          <path d="M32 24 L20 38 L28 46 L34 40 L34 80 L66 80 L66 40 L72 46 L80 38 L68 24 Z" fill="#5B5BD6" />
        </>
      );
    case 'plant-wooden-chair':
      return (
        <>
          <rect x="30" y="18" width="8" height="64" rx="3" fill="#A47148" />
          <rect x="62" y="48" width="8" height="34" rx="3" fill="#A47148" />
          <rect x="30" y="46" width="40" height="8" rx="3" fill="#C98E5B" />
          <rect x="30" y="24" width="28" height="8" rx="3" fill="#C98E5B" />
        </>
      );

    /* ================= WORLD, TECH, 3Rs & SKY ================= */
    case 'world-recycle-bin':
      return (
        <>
          <polygon points="28,28 72,28 66,82 34,82" fill="#3BA99C" stroke="#257D73" strokeWidth="3" />
          <circle cx="50" cy="55" r="12" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="16 6" />
        </>
      );
    case 'world-reuse-bag':
      return (
        <>
          <rect x="26" y="34" width="48" height="48" rx="8" fill="#F2B84B" />
          <path d="M38 34 A12 12 0 0 1 62 34" stroke="#8C5A3C" strokeWidth="5" fill="none" />
          <ellipse cx="50" cy="58" rx="10" ry="6" transform="rotate(-25 50 58)" fill="#3BA99C" />
        </>
      );
    case 'world-save-water':
      return (
        <>
          <path d="M24 32 L54 32 L54 44" stroke="#6E778A" strokeWidth="8" strokeLinecap="round" fill="none" />
          <rect x="40" y="20" width="16" height="6" rx="3" fill="#F27A5E" />
          <path d="M54 54 C46 66, 48 76, 54 76 C60 76, 62 66, 54 54 Z" fill="#4BA3E3" />
        </>
      );
    case 'world-planets':
      return (
        <>
          <circle cx="28" cy="30" r="12" fill="#F2B84B" />
          <ellipse cx="62" cy="58" rx="26" ry="8" transform="rotate(-18 62 58)" fill="none" stroke="#F27A5E" strokeWidth="4" />
          <circle cx="62" cy="58" r="14" fill="#5B5BD6" />
        </>
      );
    case 'tech-tablet':
      return (
        <>
          <rect x="24" y="14" width="52" height="72" rx="8" fill="#2A3352" />
          <rect x="30" y="22" width="40" height="52" rx="4" fill="#BCE8F7" />
          <circle cx="50" cy="80" r="3" fill="#FFFFFF" />
        </>
      );
    case 'tech-fridge':
      return (
        <>
          <rect x="28" y="14" width="44" height="72" rx="6" fill="#E4F6F3" stroke="#3BA99C" strokeWidth="3.5" />
          <line x1="28" y1="42" x2="72" y2="42" stroke="#3BA99C" strokeWidth="3.5" />
          <line x1="35" y1="26" x2="35" y2="36" stroke="#257D73" strokeWidth="4" strokeLinecap="round" />
          <line x1="35" y1="50" x2="35" y2="66" stroke="#257D73" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'tech-washer':
      return (
        <>
          <rect x="22" y="16" width="56" height="68" rx="8" fill="#FFFFFF" stroke="#5C6478" strokeWidth="3.5" />
          <circle cx="50" cy="54" r="18" fill="#BCE8F7" stroke="#5B5BD6" strokeWidth="4" />
          <circle cx="64" cy="26" r="3" fill="#3BA99C" />
          <circle cx="54" cy="26" r="3" fill="#F27A5E" />
        </>
      );

    /* ================= SHORT CVC + SIGHT-WORD PHRASE SCENES ================= */
    case 'scene-cat-on-mat':
      return (
        <>
          <ellipse cx="50" cy="76" rx="36" ry="10" fill="#5B5BD6" />
          <circle cx="50" cy="50" r="18" fill="#F5AC6B" />
          <polygon points="36,38 34,22 46,32" fill="#F5AC6B" />
          <polygon points="64,38 66,22 54,32" fill="#F5AC6B" />
          <circle cx="44" cy="48" r="2.5" fill="#1E2433" />
          <circle cx="56" cy="48" r="2.5" fill="#1E2433" />
        </>
      );
    case 'scene-dog-in-box':
      return (
        <>
          <circle cx="50" cy="38" r="16" fill="#C98E5B" />
          <ellipse cx="34" cy="38" rx="5" ry="10" fill="#8C5A3C" />
          <ellipse cx="66" cy="38" rx="5" ry="10" fill="#8C5A3C" />
          <circle cx="45" cy="36" r="2.5" fill="#1E2433" />
          <circle cx="55" cy="36" r="2.5" fill="#1E2433" />
          <rect x="24" y="48" width="52" height="34" rx="4" fill="#DFA25F" stroke="#A46B32" strokeWidth="3" />
        </>
      );
    case 'scene-bug-on-log':
      return (
        <>
          <rect x="14" y="58" width="72" height="22" rx="10" fill="#8C5A3C" />
          <circle cx="80" cy="69" r="9" fill="#C99A72" />
          <circle cx="50" cy="46" r="13" fill="#E85349" />
          <circle cx="45" cy="44" r="2.5" fill="#1E2433" />
          <circle cx="55" cy="44" r="2.5" fill="#1E2433" />
          <circle cx="50" cy="34" r="7" fill="#1E2433" />
        </>
      );
    case 'scene-pig-in-mud':
      return (
        <>
          <ellipse cx="50" cy="74" rx="36" ry="11" fill="#7A5238" />
          <circle cx="50" cy="50" r="19" fill="#F7A8B8" />
          <ellipse cx="50" cy="54" rx="7" ry="5" fill="#F27A94" />
          <circle cx="44" cy="44" r="2.5" fill="#1E2433" />
          <circle cx="56" cy="44" r="2.5" fill="#1E2433" />
        </>
      );
    case 'scene-hen-in-pen':
      return (
        <>
          <circle cx="50" cy="48" r="18" fill="#FFFFFF" stroke="#D5DCE6" strokeWidth="2.5" />
          <path d="M46 28 Q50 20 54 28" fill="#E85349" stroke="#E85349" strokeWidth="4" strokeLinecap="round" />
          <polygon points="66,46 74,50 66,54" fill="#F2B84B" />
          <rect x="18" y="56" width="8" height="28" rx="2" fill="#C98E5B" />
          <rect x="46" y="56" width="8" height="28" rx="2" fill="#C98E5B" />
          <rect x="74" y="56" width="8" height="28" rx="2" fill="#C98E5B" />
          <rect x="14" y="64" width="72" height="6" rx="2" fill="#A46B32" />
        </>
      );
    case 'scene-red-bus':
      return (
        <>
          <rect x="14" y="28" width="72" height="42" rx="10" fill="#E85349" />
          <rect x="22" y="35" width="16" height="14" rx="3" fill="#E4F6F3" />
          <rect x="42" y="35" width="16" height="14" rx="3" fill="#E4F6F3" />
          <rect x="62" y="35" width="18" height="16" rx="3" fill="#E4F6F3" />
          <circle cx="30" cy="72" r="9" fill="#1E2433" /><circle cx="30" cy="72" r="4" fill="#FFFFFF" />
          <circle cx="70" cy="72" r="9" fill="#1E2433" /><circle cx="70" cy="72" r="4" fill="#FFFFFF" />
        </>
      );
    case 'scene-fox-in-den':
      return (
        <>
          <path d="M14 82 Q50 14 86 82 Z" fill="#6E778A" />
          <path d="M28 82 Q50 38 72 82 Z" fill="#2A3352" />
          <polygon points="50,74 36,54 64,54" fill="#F27A5E" />
          <circle cx="45" cy="60" r="2.2" fill="#FFFFFF" />
          <circle cx="55" cy="60" r="2.2" fill="#FFFFFF" />
        </>
      );
    case 'scene-cup-on-bed':
      return (
        <>
          <rect x="14" y="56" width="72" height="22" rx="6" fill="#5B5BD6" />
          <rect x="18" y="48" width="20" height="10" rx="5" fill="#FFFFFF" />
          <rect x="46" y="34" width="20" height="22" rx="4" fill="#F2B84B" />
          <path d="M66 38 A6 6 0 0 1 66 52" stroke="#F2B84B" strokeWidth="4" fill="none" />
        </>
      );
    case 'scene-fish-in-net':
      return (
        <>
          <circle cx="50" cy="48" r="26" fill="none" stroke="#8C5A3C" strokeWidth="4" />
          <line x1="30" y1="48" x2="70" y2="48" stroke="#C99A72" strokeWidth="2" />
          <line x1="50" y1="26" x2="50" y2="70" stroke="#C99A72" strokeWidth="2" />
          <ellipse cx="48" cy="48" rx="14" ry="9" fill="#F27A5E" />
          <polygon points="60,48 68,41 68,55" fill="#F27A5E" />
        </>
      );
    case 'scene-frog-on-pad':
      return (
        <>
          <ellipse cx="50" cy="72" rx="36" ry="12" fill="#2E8B7D" />
          <circle cx="50" cy="48" r="16" fill="#4BBCA9" />
          <circle cx="42" cy="34" r="5" fill="#4BBCA9" /><circle cx="42" cy="34" r="2.2" fill="#1E2433" />
          <circle cx="58" cy="34" r="5" fill="#4BBCA9" /><circle cx="58" cy="34" r="2.2" fill="#1E2433" />
        </>
      );
  }
}

export function QuestArt({ spec, size = 76, solvedClipId }: QuestArtProps) {
  switch (spec.kind) {
    case 'quest-icon':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{ display: 'block', flexShrink: 0 }}
        >
          {renderQuestIcon(spec.id)}
        </svg>
      );

    case 'word-art':
      return <WordIllustration id={spec.id} size={size} />;

    case 'theme-img':
      return (
        <img
          src={assetUrl(spec.path)}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: 'contain', display: 'block', borderRadius: 12 }}
        />
      );

    case 'numeral-badge':
      return (
        <div
          className="font-display"
          style={{
            minWidth: size,
            height: size,
            padding: '0 10px',
            borderRadius: 18,
            background: '#ECEBFF',
            border: `3px solid ${spec.accent ?? '#5B5BD6'}`,
            color: spec.accent ?? '#5B5BD6',
            fontSize: Math.round(size * 0.5),
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {spec.value}
        </div>
      );

    case 'word-card': {
      if (spec.text.trim().includes(' ')) {
        return (
          <TappableReadAlongPhrase
            phrase={spec.text}
            solvedClipId={solvedClipId}
            accent={spec.accent}
            highlightIndex={spec.highlightIndex}
          />
        );
      }
      const chars = spec.text.split('');
      return (
        <div
          className="font-display"
          data-testid="quest-word-card"
          style={{
            padding: '8px 12px 8px 18px',
            borderRadius: 16,
            background: '#FFFFFF',
            border: `2.5px solid ${spec.accent ?? '#5B5BD6'}`,
            fontSize: Math.max(22, Math.round(size * 0.36)),
            fontWeight: 700,
            letterSpacing: '0.03em',
            color: '#1E2433',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {chars.map((ch, idx) => (
              <span
                key={`${idx}-${ch}`}
                style={{
                  color: spec.highlightIndex === idx ? '#F27A5E' : '#1E2433',
                  textDecoration: spec.highlightIndex === idx ? 'underline' : 'none',
                }}
              >
                {ch}
              </span>
            ))}
          </span>
          <WordSoundButton
            text={spec.text}
            size="sm"
            variant="soft"
            testId="quest-word-card-sound"
          />
        </div>
      );
    }

    case 'tens-ones-preview':
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'stretch',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '6px 10px',
            borderRadius: 20,
            background: '#F8F6F1',
            border: '2px solid #E5E0D5',
          }}
        >
          {/* Left Mat: Tens Bundles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 16,
              background: '#FFFFFF',
              border: '2px solid #DCD8FF',
              minWidth: 112,
            }}
          >
            <span
              className="font-display"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5B5BD6' }}
            >
              Tens (count by 10)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {spec.tens > 0 ? (
                Array.from({ length: spec.tens }, (_, idx) => (
                  <TenPebbleBundleArt key={`t-${idx}`} compact />
                ))
              ) : (
                <span style={{ fontSize: '0.84rem', color: '#5C6478', fontWeight: 600 }}>
                  0 bundles
                </span>
              )}
            </div>
          </div>

          <span
            className="font-display"
            style={{
              alignSelf: 'center',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#5C6478',
            }}
            aria-hidden="true"
          >
            +
          </span>

          {/* Right Mat: Single Ones Pebbles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 16,
              background: '#FFFFFF',
              border: '2px solid #FAD5CB',
              minWidth: 104,
            }}
          >
            <span
              className="font-display"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D15B40' }}
            >
              Ones (count by 1)
            </span>
            {spec.ones > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(3, spec.ones)}, auto)`,
                  gap: 5,
                  alignItems: 'center',
                }}
              >
                {Array.from({ length: spec.ones }, (_, idx) => (
                  <OnePebbleArt key={`o-${idx}`} compact />
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.84rem', color: '#5C6478', fontWeight: 600 }}>
                0 ones
              </span>
            )}
          </div>
        </div>
      );

    case 'pattern-strip':
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 18,
            background: '#FFFFFF',
            border: '2px solid #E5E0D5',
          }}
        >
          {spec.tokens.map((tok, idx) => (
            <svg key={idx} width={38} height={38} viewBox="0 0 40 40" aria-hidden="true">
              {tok.shape === 'circle' && <circle cx="20" cy="20" r="16" fill={tok.color} />}
              {tok.shape === 'square' && <rect x="5" y="5" width="30" height="30" rx="5" fill={tok.color} />}
              {tok.shape === 'triangle' && <polygon points="20,4 36,35 4,35" fill={tok.color} />}
            </svg>
          ))}
          <div
            className="font-display"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '2.5px dashed #5B5BD6',
              background: '#ECEBFF',
              color: '#5B5BD6',
              fontWeight: 700,
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ?
          </div>
        </div>
      );

    case 'number-train-gap':
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {spec.items.map((item, idx) => {
            const isGap = item === '?';
            return (
              <div
                key={idx}
                className="font-display"
                style={{
                  minWidth: 54,
                  height: 48,
                  padding: '0 10px',
                  borderRadius: 14,
                  background: isGap ? '#ECEBFF' : '#FFFFFF',
                  border: isGap ? '2.5px dashed #5B5BD6' : '2.5px solid #3BA99C',
                  color: isGap ? '#5B5BD6' : '#1E2433',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      );
  }
}

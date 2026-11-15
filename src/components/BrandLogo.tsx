import type { CSSProperties } from 'react';

interface PebbleMarkProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Pebble brand mark: three organic stacked river pebbles
 * (Bottom: Warm Indigo #5B5BD6, Middle: Soft Coral #F27A5E, Top: Sage Mint #3BA99C).
 * Zero Google/Gemini icons, 4-dot marks, or 4-point sparkle stars.
 */
export function PebbleMark({ size = 34, className, style }: PebbleMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Bottom large indigo river stone */}
      <path
        d="M10 47.5C9.5 40.5 18 36 32.5 36.2C47.5 36.4 55 41 54.5 47.8C54 54.5 45.2 58 32 58C18.5 58 10.5 54 10 47.5Z"
        fill="#5B5BD6"
      />
      <ellipse cx="24" cy="43" rx="8" ry="2.4" fill="#FFFFFF" fillOpacity="0.2" />

      {/* Middle warm coral pebble */}
      <path
        d="M15.5 30.8C15.2 25 22.8 21.2 33 21.5C43.5 21.8 49.5 25.8 49 31.2C48.5 36.6 41.2 39.2 32.2 39.2C23.2 39.2 15.8 36.2 15.5 30.8Z"
        fill="#F27A5E"
      />
      <ellipse cx="26.5" cy="27" rx="6.2" ry="1.9" fill="#FFFFFF" fillOpacity="0.22" />

      {/* Top small sage mint pebble */}
      <path
        d="M21 15.2C21 10.5 26.2 7.5 32.8 7.5C39.6 7.5 44 10.8 43.8 15.4C43.6 20 38.6 22.4 32.4 22.4C26 22.4 21 19.6 21 15.2Z"
        fill="#3BA99C"
      />
      <ellipse cx="29" cy="12" rx="4.2" ry="1.5" fill="#FFFFFF" fillOpacity="0.24" />
    </svg>
  );
}

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export function BrandLogo({ size = 'md', subtitle }: BrandLogoProps) {
  const dimensions = size === 'sm' ? 28 : size === 'lg' ? 40 : 34;
  const fontSize = size === 'sm' ? '1.3rem' : size === 'lg' ? '1.85rem' : '1.55rem';

  return (
    <div className="pebble-brand-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <PebbleMark size={dimensions} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          className="font-display"
          style={{
            fontSize,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Pebble
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Rounded paw-print corner pip for face-up Memory Match cards.
 */
export function PawPipIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6.2" cy="8.8" r="2.1" />
      <circle cx="10.2" cy="5.8" r="2.1" />
      <circle cx="14.6" cy="5.8" r="2.1" />
      <circle cx="18.2" cy="8.8" r="2.1" />
      <path d="M12.2 10.6C8.8 10.6 6.8 13.5 7.2 16.4C7.5 18.4 9.5 19.6 12.2 19.6C14.9 19.6 16.9 18.4 17.2 16.4C17.6 13.5 15.6 10.6 12.2 10.6Z" />
    </svg>
  );
}

/**
 * Rounded golden crown SVG for Winner Announcement modal.
 */
export function CrownIcon({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 17L15.5 25.5L24 12L32.5 25.5L41 17L38 35C37.7 36.7 36.2 38 34.4 38H13.6C11.8 38 10.3 36.7 10 35L7 17Z"
        fill="#F2B84B"
        stroke="#D4951F"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="15" r="2.8" fill="#F2B84B" stroke="#D4951F" strokeWidth="1.8" />
      <circle cx="24" cy="10" r="3.2" fill="#F2B84B" stroke="#D4951F" strokeWidth="1.8" />
      <circle cx="41" cy="15" r="2.8" fill="#F2B84B" stroke="#D4951F" strokeWidth="1.8" />
    </svg>
  );
}

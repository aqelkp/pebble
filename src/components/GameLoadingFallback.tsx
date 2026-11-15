import { PebbleMark } from './BrandLogo';

/**
 * Calm Warm Alabaster Suspense fallback shown while a lazy game chunk loads.
 */
export function GameLoadingFallback() {
  return (
    <div
      className="app-shell app-shell--board"
      role="status"
      aria-live="polite"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <PebbleMark size={44} />
      <p
        className="font-display"
        style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}
      >
        Getting ready…
      </p>
    </div>
  );
}

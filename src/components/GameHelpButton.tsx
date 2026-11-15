interface GameHelpButtonProps {
  onClick?: () => void;
}

/**
 * Compact in-game Help trigger for all 8 game boards.
 * Opens ActivityIntroModal in "help" mode over the active game without resetting state.
 */
export function GameHelpButton({ onClick }: GameHelpButtonProps) {
  if (!onClick) return null;

  return (
    <button
      type="button"
      className="icon-pill-btn icon-pill-btn--compact game-help-btn"
      data-testid="game-help-btn"
      onClick={onClick}
      aria-label="How to play (read instructions)"
      title="How to play"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.5" />
        <path d="M9.5 9.25a2.6 2.6 0 0 1 5.05.85c0 1.6-2.55 2.15-2.55 3.65" />
        <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
      </svg>
      <span>Help</span>
    </button>
  );
}

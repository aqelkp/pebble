interface LeaveGameModalProps {
  open: boolean;
  headline: string;
  subtitle: string;
  keepPlayingLabel: string;
  leaveLabel: string;
  onKeepPlaying: () => void;
  onConfirmLeave: () => void;
}

/**
 * Shared PWA Back-guard confirmation modal displayed before leaving an active game
 * or Guided Activity Book round.
 */
export function LeaveGameModal({
  open,
  headline,
  subtitle,
  keepPlayingLabel,
  leaveLabel,
  onKeepPlaying,
  onConfirmLeave,
}: LeaveGameModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-game-headline"
    >
      <div className="winner-modal">
        <h2 id="leave-game-headline">{headline}</h2>
        <p className="winner-subtitle">{subtitle}</p>
        <div className="winner-actions">
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={onKeepPlaying}
          >
            {keepPlayingLabel}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={onConfirmLeave}
          >
            {leaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

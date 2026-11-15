import type { ReactNode } from 'react';
import { useStageSize, type StageDimensions } from '../engine';
import type { JourneyBoardContext } from '../journey/journeyTypes';
import { BrandLogo } from './BrandLogo';

interface GameStageProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToHub: () => void;
  onChangeSetup?: () => void;
  journeyContext?: JourneyBoardContext;
  title?: string;
  topRightExtra?: ReactNode;
  topSlot?: ReactNode;
  overlays?: ReactNode;
  stageClassName?: string;
  children: ReactNode | ((stageSize: StageDimensions) => ReactNode);
}

/**
 * Shared 100dvh portrait tablet game stage with Pebble's compact top utility bar,
 * Guided Activity Book badge support, and ResizeObserver-measured main stage.
 */
export function GameStage({
  soundEnabled,
  onToggleSound,
  onBackToHub,
  onChangeSetup,
  journeyContext,
  title,
  topRightExtra,
  topSlot,
  overlays,
  stageClassName,
  children,
}: GameStageProps) {
  const [stageRef, stageSize] = useStageSize<HTMLElement>();

  return (
    <div className="app-shell app-shell--board">
      {overlays}

      <header className="top-bar" style={{ minHeight: 42 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onBackToHub}
            aria-label={journeyContext ? 'Back to Activity Book' : 'Back to Game Hub'}
          >
            <span aria-hidden="true">←</span>
            <span>{journeyContext ? 'Activity Book' : 'Games'}</span>
          </button>
          {title ? (
            <span
              className="font-display"
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {title}
            </span>
          ) : (
            <BrandLogo size="sm" />
          )}
        </div>

        <div className="top-bar__right">
          {journeyContext && (
            <span className="section-pill section-pill--journey">
              Ch. {journeyContext.chapterNumber} • #{journeyContext.activityNumberInChapter}/
              {journeyContext.totalInChapter}
            </span>
          )}
          {topRightExtra}
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
          {!journeyContext && onChangeSetup && (
            <button
              type="button"
              className="icon-pill-btn icon-pill-btn--compact"
              onClick={onChangeSetup}
            >
              <span>Setup</span>
            </button>
          )}
        </div>
      </header>

      {topSlot}

      <main
        ref={stageRef}
        className={stageClassName ? `board-stage ${stageClassName}` : 'board-stage'}
      >
        {typeof children === 'function' ? children(stageSize) : children}
      </main>
    </div>
  );
}

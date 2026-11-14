import { useState } from 'react';
import { CrownIcon } from '../../components/BrandLogo';
import type { FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  getAllThemesSummaryForBoard,
  type MemoryGameRun,
  type ThemeBoardStatsSummary,
} from './memoryStats';
import {
  BOARD_SIZES,
  getBoardSizeSpec,
  getThemeSpec,
  type BoardSizeId,
  type ThemeId,
} from './themes';

interface MemoryRecordsModalProps {
  runs: readonly MemoryGameRun[];
  profiles: readonly FamilyProfile[];
  initialBoardSizeId: BoardSizeId;
  selectedThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId, boardSizeId: BoardSizeId) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

function formatRunPlayers(run: MemoryGameRun, profiles: readonly FamilyProfile[]): string {
  if (run.playerStats.length === 0) return '';
  const names = run.playerStats.map((stat) => {
    const found = profiles.find((p) => p.id === stat.playerId);
    return found ? found.name : 'Player';
  });
  return names.join(' & ');
}

function getImprovementBadge(summary: ThemeBoardStatsSummary): {
  label: string;
  tone: 'mint' | 'honey' | 'indigo';
} | null {
  if (summary.gamesPlayed < 2) return null;
  if (summary.improvementFromFirst !== null && summary.improvementFromFirst > 0) {
    return {
      label: `Improved by ${summary.improvementFromFirst} ${
        summary.improvementFromFirst === 1 ? 'attempt' : 'attempts'
      }`,
      tone: 'mint',
    };
  }
  if (summary.improvementFromPrevious !== null && summary.improvementFromPrevious > 0) {
    return {
      label: `${summary.improvementFromPrevious} fewer vs prev`,
      tone: 'mint',
    };
  }
  if (summary.lastAttempts !== null && summary.lastAttempts === summary.bestAttempts) {
    return {
      label: 'At Best Record',
      tone: 'honey',
    };
  }
  return {
    label: `${summary.gamesPlayed} games tracked`,
    tone: 'indigo',
  };
}

export function MemoryRecordsModal({
  runs,
  profiles,
  initialBoardSizeId,
  selectedThemeId,
  onSelectTheme,
  onResetRecords,
  onClose,
}: MemoryRecordsModalProps) {
  const [boardSizeId, setBoardSizeId] = useState<BoardSizeId>(initialBoardSizeId);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const activeSizeSpec = getBoardSizeSpec(boardSizeId);
  const summaries = getAllThemesSummaryForBoard(runs, boardSizeId);

  const playedSummaries = summaries
    .filter((s) => s.gamesPlayed > 0)
    .sort((a, b) => {
      if (a.themeId === selectedThemeId) return -1;
      if (b.themeId === selectedThemeId) return 1;
      return b.gamesPlayed - a.gamesPlayed;
    });
  const unplayedSummaries = summaries.filter((s) => s.gamesPlayed === 0);
  const orderedSummaries = [...playedSummaries, ...unplayedSummaries];

  const totalGamesInSize = summaries.reduce((acc, s) => acc + s.gamesPlayed, 0);
  const bestAcrossSize =
    playedSummaries.length > 0
      ? Math.min(
          ...playedSummaries
            .map((s) => s.bestAttempts)
            .filter((v): v is number => v !== null),
        )
      : null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="records-modal-headline"
    >
      <div className="records-modal">
        <div className="records-modal__header">
          <div>
            <h2 id="records-modal-headline">Attempts &amp; Best Records</h2>
            <p className="records-modal__sub">
              Fewer attempts to match all {activeSizeSpec.pairs} pairs means stronger memory!
            </p>
          </div>
          <button
            type="button"
            className="icon-pill-btn icon-pill-btn--compact"
            onClick={onClose}
            aria-label="Close records"
          >
            <span>Done</span>
          </button>
        </div>

        {/* Board Size Filter */}
        <div className="records-size-tabs" role="group" aria-label="Filter records by board layout">
          {BOARD_SIZES.map((size) => {
            const countForSize = runs.filter((r) => r.boardSizeId === size.id).length;
            const isActive = size.id === boardSizeId;
            return (
              <button
                key={size.id}
                type="button"
                className={`category-pill-btn ${isActive ? 'category-pill-btn--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => setBoardSizeId(size.id)}
              >
                {size.label} ({size.pairs} pairs){countForSize > 0 ? ` • ${countForSize}` : ''}
              </button>
            );
          })}
        </div>

        {/* Summary Tiles */}
        <div className="records-summary-grid">
          <div className="records-summary-tile">
            <span className="records-summary-tile__value">{totalGamesInSize}</span>
            <span className="records-summary-tile__label">Games Finished</span>
          </div>
          <div className="records-summary-tile">
            <span className="records-summary-tile__value">
              {playedSummaries.length}/{summaries.length}
            </span>
            <span className="records-summary-tile__label">Themes Played</span>
          </div>
          <div className="records-summary-tile records-summary-tile--highlight">
            <span className="records-summary-tile__value">
              {bestAcrossSize !== null ? bestAcrossSize : '—'}
            </span>
            <span className="records-summary-tile__label">Best Attempts</span>
          </div>
        </div>

        {/* Per-Theme Breakdown */}
        <div className="records-theme-list" aria-label="Records by theme">
          {orderedSummaries.map((summary) => {
            const theme = getThemeSpec(summary.themeId);
            const isSelected = summary.themeId === selectedThemeId;
            const badge = getImprovementBadge(summary);
            const latestRun =
              summary.recentRuns.length > 0
                ? summary.recentRuns[summary.recentRuns.length - 1]
                : null;
            const latestPlayersLabel = latestRun ? formatRunPlayers(latestRun, profiles) : '';

            return (
              <div
                key={summary.themeId}
                className={`records-theme-row ${
                  isSelected ? 'records-theme-row--selected' : ''
                } ${summary.gamesPlayed === 0 ? 'records-theme-row--empty' : ''}`}
              >
                <div className="records-theme-row__top">
                  <div className="records-theme-row__identity">
                    <img
                      className="records-theme-row__thumb"
                      src={assetUrl(theme.previewPaths[0])}
                      alt=""
                    />
                    <div className="records-theme-row__titles">
                      <div className="records-theme-row__title-line">
                        <span className="records-theme-row__name">{theme.title}</span>
                        {badge && (
                          <span className={`badge-pill badge-pill--${badge.tone}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <span className="records-theme-row__meta">
                        {summary.gamesPlayed === 0
                          ? `No ${activeSizeSpec.label} games finished yet`
                          : `${summary.gamesPlayed} ${
                              summary.gamesPlayed === 1 ? 'game' : 'games'
                            }${latestPlayersLabel ? ` • Last: ${latestPlayersLabel}` : ''}`}
                      </span>
                    </div>
                  </div>

                  {summary.gamesPlayed > 0 && summary.bestAttempts !== null ? (
                    <div className="records-theme-row__stats">
                      <div className="records-stat-chip records-stat-chip--best">
                        <div className="records-stat-chip__top">
                          <CrownIcon size={14} />
                          <strong>{summary.bestAttempts}</strong>
                        </div>
                        <span>BEST</span>
                      </div>
                      <div className="records-stat-chip">
                        <strong>{summary.lastAttempts}</strong>
                        <span>LAST</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="category-pill-btn"
                      onClick={() => onSelectTheme(summary.themeId, boardSizeId)}
                    >
                      Play {theme.title}
                    </button>
                  )}
                </div>

                {summary.recentRuns.length > 0 && (
                  <div className="records-theme-row__history">
                    <span className="records-history-label">Attempts history:</span>
                    <div className="attempts-trend-list">
                      {summary.recentRuns.map((run, idx) => {
                        const isBest = run.totalAttempts === summary.bestAttempts;
                        const isLatest = idx === summary.recentRuns.length - 1;
                        return (
                          <span key={run.id} className="attempts-trend-step">
                            {idx > 0 && (
                              <span className="attempts-trend-arrow" aria-hidden="true">
                                →
                              </span>
                            )}
                            <span
                              className={`attempts-trend-pill ${
                                isBest ? 'attempts-trend-pill--best' : ''
                              } ${isLatest ? 'attempts-trend-pill--latest' : ''}`}
                            >
                              {run.totalAttempts}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer with safe two-step Reset */}
        <div className="records-modal__footer">
          {runs.length > 0 ? (
            confirmingReset ? (
              <div className="records-reset-confirm">
                <span>Clear all saved attempt records?</span>
                <div className="records-reset-confirm__btns">
                  <button
                    type="button"
                    className="category-pill-btn category-pill-btn--danger"
                    onClick={() => {
                      onResetRecords();
                      setConfirmingReset(false);
                    }}
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    className="category-pill-btn"
                    onClick={() => setConfirmingReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="records-reset-link"
                onClick={() => setConfirmingReset(true)}
              >
                Reset Records
              </button>
            )
          ) : (
            <span className="records-empty-note">Saved locally on this device</span>
          )}

          <button type="button" className="btn-primary records-done-btn" onClick={onClose}>
            Back to Setup
          </button>
        </div>
      </div>
    </div>
  );
}

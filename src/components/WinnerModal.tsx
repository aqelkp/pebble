import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import type { RecordCompletionOutcome } from '../games/memory-match/memoryStats';
import { CrownIcon } from './BrandLogo';
import { ConfettiBurst } from './ConfettiBurst';

export interface PlayerStanding {
  profile: FamilyProfile;
  score: number;
  attempts?: number;
}

interface WinnerModalProps {
  standings: PlayerStanding[];
  totalPairs: number;
  themeTitle: string;
  boardSizeLabel?: string;
  completionOutcome?: RecordCompletionOutcome | null;
  unitLabel?: string;
  soloVerb?: string;
  onPlayAgain: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
}

const ORDINALS = ['1ST', '2ND', '3RD', '4TH'] as const;

function getOutcomeHeadlinePill(
  outcome: RecordCompletionOutcome,
  themeTitle: string,
): { text: string; variant: 'gold' | 'mint' | 'indigo'; showCrown?: boolean } {
  if (outcome.isNewBest && outcome.previousBestAttempts !== null) {
    const saved = outcome.previousBestAttempts - outcome.run.totalAttempts;
    return {
      text: `New Best Record! ${saved} fewer ${saved === 1 ? 'attempt' : 'attempts'}!`,
      variant: 'gold',
      showCrown: true,
    };
  }
  if (outcome.isFirstRecord) {
    return {
      text: `First ${themeTitle} Record Set!`,
      variant: 'mint',
    };
  }
  if (outcome.tiedBest) {
    return {
      text: 'Matched Best Record!',
      variant: 'gold',
      showCrown: true,
    };
  }
  if (outcome.improvementFromPrevious !== null && outcome.improvementFromPrevious > 0) {
    const diff = outcome.improvementFromPrevious;
    return {
      text: `Improving! ${diff} fewer ${diff === 1 ? 'attempt' : 'attempts'} than last game`,
      variant: 'mint',
    };
  }
  if (outcome.improvementFromFirst !== null && outcome.improvementFromFirst > 0) {
    const diff = outcome.improvementFromFirst;
    return {
      text: `Improved by ${diff} ${diff === 1 ? 'attempt' : 'attempts'} since Game 1!`,
      variant: 'mint',
    };
  }
  return {
    text: `${themeTitle} • Game #${outcome.gamesPlayed}`,
    variant: 'indigo',
  };
}

export function WinnerModal({
  standings,
  totalPairs,
  themeTitle,
  boardSizeLabel,
  completionOutcome,
  unitLabel = 'pairs',
  soloVerb = 'found',
  onPlayAgain,
  onChangeSetup,
  onBackToHub,
}: WinnerModalProps) {
  const sorted = [...standings].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter((entry) => entry.score === topScore);
  const isSolo = sorted.length === 1;
  const isTie = !isSolo && winners.length > 1;

  let headline = 'Game Complete!';
  let subtitle =
    unitLabel === 'pairs'
      ? `All ${totalPairs} ${themeTitle} pairs matched!`
      : `All ${totalPairs} ${themeTitle} ${unitLabel} completed!`;

  if (isSolo && winners[0]) {
    headline = `Great Job, ${winners[0].profile.name}!`;
    subtitle = completionOutcome
      ? `Finished all ${totalPairs} ${themeTitle} pairs in ${completionOutcome.run.totalAttempts} attempts!`
      : `You ${soloVerb} all ${totalPairs} ${themeTitle} ${unitLabel}!`;
  } else if (isTie) {
    headline = "It's a Tie!";
    const names = winners.map((w) => w.profile.name).join(' & ');
    subtitle = `${names} tied with ${topScore} ${topScore === 1 ? 'point' : 'points'}!`;
  } else if (winners[0]) {
    headline = `${winners[0].profile.name} Wins!`;
    subtitle = `Took the crown with ${topScore} ${topScore === 1 ? 'point' : 'points'} in ${themeTitle}!`;
  }

  const outcomePill = completionOutcome
    ? getOutcomeHeadlinePill(completionOutcome, themeTitle)
    : null;
  const matchAccuracy = completionOutcome
    ? Math.min(100, Math.round((totalPairs / Math.max(1, completionOutcome.run.totalAttempts)) * 100))
    : null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="winner-headline">
      <ConfettiBurst active mode="win" burstKey={999} />
      <div className="winner-modal">
        <div className="winner-crown-wrap">
          <CrownIcon size={40} />
          <div className="winner-avatars-row">
            {winners.map((winner) => (
              <div key={winner.profile.id} className="winner-avatar-halo">
                <img
                  src={getAvatarSrc(winner.profile.avatar)}
                  alt={winner.profile.name}
                />
              </div>
            ))}
          </div>
        </div>

        <h2 id="winner-headline">{headline}</h2>
        <p className="winner-subtitle">{subtitle}</p>

        {completionOutcome && outcomePill && (
          <section className="attempts-feedback-card" aria-label="Attempts and record summary">
            <div
              className={`attempts-celebration-pill attempts-celebration-pill--${outcomePill.variant}`}
            >
              {outcomePill.showCrown && <CrownIcon size={15} />}
              <span>{outcomePill.text}</span>
            </div>

            <div className="attempts-metrics-grid">
              <div className="attempts-metric-tile">
                <span className="attempts-metric-tile__value">
                  {completionOutcome.run.totalAttempts}
                </span>
                <span className="attempts-metric-tile__label">Attempts</span>
              </div>
              <div className="attempts-metric-tile attempts-metric-tile--best">
                <span className="attempts-metric-tile__value">
                  {completionOutcome.bestAttempts}
                </span>
                <span className="attempts-metric-tile__label">Best Record</span>
              </div>
              <div className="attempts-metric-tile">
                <span className="attempts-metric-tile__value">{matchAccuracy}%</span>
                <span className="attempts-metric-tile__label">Match Rate</span>
              </div>
            </div>

            {completionOutcome.recentRuns.length >= 2 && (
              <div className="attempts-trend-strip">
                <span className="attempts-trend-strip__label">
                  {themeTitle}
                  {boardSizeLabel ? ` (${boardSizeLabel})` : ''} attempts:
                </span>
                <div className="attempts-trend-list">
                  {completionOutcome.recentRuns.map((run, idx) => {
                    const isBest = run.totalAttempts === completionOutcome.bestAttempts;
                    const isLatest = idx === completionOutcome.recentRuns.length - 1;
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
          </section>
        )}

        <div className="standings-list" aria-label="Final Scoreboard">
          {sorted.map((entry, idx) => {
            const isTop = entry.score === topScore;
            const rankLabel = isTop ? '1ST' : ORDINALS[idx] ?? `${idx + 1}TH`;
            return (
              <div
                key={entry.profile.id}
                className={`standing-row ${isTop ? 'standing-row--winner' : ''}`}
              >
                <div className="standing-row__left">
                  <span className="standing-rank-pill">{rankLabel}</span>
                  <img
                    className="standing-row__avatar"
                    src={getAvatarSrc(entry.profile.avatar)}
                    alt={entry.profile.name}
                  />
                  <div className="standing-row__identity-text">
                    <span className="standing-row__name">{entry.profile.name}</span>
                    {entry.attempts !== undefined && (
                      <span className="standing-row__attempts">
                        {entry.attempts} {entry.attempts === 1 ? 'attempt' : 'attempts'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="standing-row__pts">
                  <strong>{entry.score}</strong>
                  <span>PTS</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="winner-actions">
          <button type="button" className="btn-primary" style={{ width: '100%' }} onClick={onPlayAgain}>
            Play Again
          </button>
          <div className="winner-actions__row">
            <button type="button" className="btn-secondary" onClick={onChangeSetup}>
              Change Setup
            </button>
            <button type="button" className="btn-secondary" onClick={onBackToHub}>
              Back to Games
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

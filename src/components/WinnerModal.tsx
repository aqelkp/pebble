import { getAvatarSrc, type FamilyProfile } from '../context/FamilyProfilesContext';
import { CrownIcon } from './BrandLogo';
import { ConfettiBurst } from './ConfettiBurst';

export interface PlayerStanding {
  profile: FamilyProfile;
  score: number;
}

interface WinnerModalProps {
  standings: PlayerStanding[];
  totalPairs: number;
  themeTitle: string;
  unitLabel?: string;
  soloVerb?: string;
  onPlayAgain: () => void;
  onChangeSetup: () => void;
  onBackToHub: () => void;
}

const ORDINALS = ['1ST', '2ND', '3RD', '4TH'] as const;

export function WinnerModal({
  standings,
  totalPairs,
  themeTitle,
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
    subtitle = `You ${soloVerb} all ${totalPairs} ${themeTitle} ${unitLabel}!`;
  } else if (isTie) {
    headline = "It's a Tie!";
    const names = winners.map((w) => w.profile.name).join(' & ');
    subtitle = `${names} tied with ${topScore} ${topScore === 1 ? 'point' : 'points'}!`;
  } else if (winners[0]) {
    headline = `${winners[0].profile.name} Wins!`;
    subtitle = `Took the crown with ${topScore} ${topScore === 1 ? 'point' : 'points'} in ${themeTitle}!`;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="winner-headline">
      <ConfettiBurst active mode="win" burstKey={999} />
      <div className="winner-modal">
        <div className="winner-crown-wrap">
          <CrownIcon size={46} />
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
                  <span className="standing-row__name">{entry.profile.name}</span>
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

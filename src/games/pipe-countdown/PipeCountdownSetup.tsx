import { useEffect, useMemo, useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  COUNTDOWN_MODES,
  getCountdownModeSpec,
  getDefaultPipeCountdownConfig,
  loadPipeCountdownMastery,
  type CountdownModeId,
  type CountdownRoundLength,
  type PipeCountdownConfig,
} from './countdownData';
import { preloadCountdownModeAssets } from './countdownSounds';
import './PipeCountdown.css';

interface PipeCountdownSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: PipeCountdownConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: PipeCountdownConfig) => void;
}

export function PipeCountdownSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: PipeCountdownSetupProps) {
  const defaults = getDefaultPipeCountdownConfig();
  const [modeId, setModeId] = useState<CountdownModeId>(initialConfig?.modeId ?? defaults.modeId);
  const [roundLength, setRoundLength] = useState<CountdownRoundLength>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );

  const mastery = useMemo(() => loadPipeCountdownMastery(), []);

  useEffect(() => {
    preloadCountdownModeAssets(modeId);
  }, [modeId]);

  const selectedMode = getCountdownModeSpec(modeId);

  const handleStart = () => {
    onStartGame({
      modeId,
      roundLength,
    });
  };

  return (
    <div className="app-shell pcd-setup-shell">
      <header className="top-bar" style={{ marginBottom: 10 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="countdown-setup-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
        </div>
        <BrandLogo size="sm" />
        <div className="top-bar__right">
          <button
            type="button"
            className="lt-solo-conductor-chip"
            onClick={onEditProfiles}
            aria-label={`Playing as ${childProfile.name}. Tap to edit profile`}
          >
            <img src={getAvatarSrc(childProfile.avatar)} alt="" />
            <span>{childProfile.name}</span>
          </button>
        </div>
      </header>

      <section className="setup-card-section pcd-setup-hero">
        <div className="pcd-setup-hero__art">
          <img src={assetUrl('hub/pipe-countdown.png')} alt="" />
        </div>
        <div className="pcd-setup-hero__copy">
          <h1>Pipe Countdown</h1>
          <p>
            Plug the stepped garden water pipe from the widest gap down to round valve cap 0 to
            spin the sunny fountain!
          </p>
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="pcd-modes-heading">
        <div className="setup-section-header">
          <h2 id="pcd-modes-heading">1. Choose Countdown Mode</h2>
          <span className="section-pill">
            {mastery.completedRepairs > 0
              ? `${mastery.completedRepairs} pipes fixed`
              : 'Biggest → 0'}
          </span>
        </div>

        <div className="pcd-mode-grid" role="radiogroup" aria-label="Countdown mode">
          {COUNTDOWN_MODES.map((mode) => {
            const selected = modeId === mode.id;
            const doneCount = mastery.modeCompletions[mode.id] ?? 0;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`pcd-mode-card ${selected ? 'is-selected' : ''}`}
                data-testid={`countdown-mode-${mode.id}`}
                onClick={() => setModeId(mode.id)}
              >
                <div className="pcd-mode-card__top">
                  <span className="pcd-mode-badge">{mode.badge}</span>
                  {doneCount > 0 && (
                    <span className="pcd-mode-done-pill">{doneCount} done</span>
                  )}
                </div>
                <strong className="pcd-mode-card__title">{mode.title}</strong>
                <span className="pcd-mode-card__sub">{mode.subtitle}</span>
                <div className="pcd-mode-strip" aria-hidden="true">
                  {mode.sampleStrip.map((token, idx) => (
                    <span
                      key={`${mode.id}-${idx}-${token}`}
                      className={`pcd-mode-strip__chip ${
                        token === '0' ? 'is-zero' : token === '?' ? 'is-mystery' : ''
                      }`}
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="pcd-length-heading">
        <div className="setup-section-header">
          <h2 id="pcd-length-heading">2. Pipe Repairs per Session</h2>
          <span className="section-pill">
            {roundLength === 1 ? 'Quick Repair' : `${roundLength} Garden Pipes`}
          </span>
        </div>

        <div className="pcd-len-row" role="radiogroup" aria-label="Repairs per session">
          {([
            { len: 1 as const, label: '1 Pipe Repair', sub: 'Quick fountain warm-up' },
            { len: 3 as const, label: '3 Pipe Repairs', sub: 'Recommended K1 practice' },
            { len: 5 as const, label: '5 Pipe Repairs', sub: 'Full countdown builder' },
          ]).map((opt) => {
            const selected = roundLength === opt.len;
            return (
              <button
                key={opt.len}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`pcd-len-btn ${selected ? 'is-selected' : ''}`}
                data-testid={`countdown-len-${opt.len}`}
                onClick={() => setRoundLength(opt.len)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {roundLength === 1 ? '1 Pipe Repair' : `${roundLength} Pipe Repairs`}
          </strong>
          <span>
            {selectedMode.title} • {selectedMode.badge}
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-pipe-countdown-btn"
          onClick={handleStart}
        >
          Start Countdown!
        </button>
      </footer>
    </div>
  );
}

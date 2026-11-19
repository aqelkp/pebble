import { useEffect, useMemo, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  getDefaultSplashTankConfig,
  getSplashModeSpec,
  loadSplashMastery,
  SPLASH_MODES,
  SPLASH_ROUND_LENGTHS,
  type SplashTankConfig,
  type SplashTankModeId,
  type SplashTankRoundLength,
} from './tankData';
import { preloadSplashAssets } from './tankSounds';
import './SplashTank.css';

interface SplashTankSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: SplashTankConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: SplashTankConfig) => void;
}

export function SplashTankSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: SplashTankSetupProps) {
  const defaults = getDefaultSplashTankConfig();
  const [modeId, setModeId] = useState<SplashTankModeId>(initialConfig?.modeId ?? defaults.modeId);
  const [roundLength, setRoundLength] = useState<SplashTankRoundLength>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );

  const mastery = useMemo(() => loadSplashMastery(), []);
  const selectedMode = getSplashModeSpec(modeId);

  useEffect(() => {
    preloadSplashAssets();
  }, []);

  const handleStart = () => {
    onStartGame({
      classLevel: selectedMode.classLevel,
      modeId,
      roundLength,
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onBackToHub}
            data-testid="splash-setup-back-btn"
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

      <section className="setup-card-section st-setup-hero">
        <div className="st-setup-hero__art">
          <img src={assetUrl('hub/splash-tank.png')} alt="" />
        </div>
        <div className="st-setup-hero__copy">
          <h1>Splash Tank</h1>
          <p>
            Look at the starting water level and the target flag! Pick or drag the right capacity
            bucket so the tank fills right to the target without spilling over.
          </p>
          {mastery.pipesFilled > 0 && (
            <div className="st-setup-stats-row">
              <span className="st-stat-chip">{mastery.pipesFilled} tanks filled</span>
              {mastery.firstTryFills > 0 && (
                <span className="st-stat-chip st-stat-chip--mint">
                  {mastery.firstTryFills} exact first-tries
                </span>
              )}
              {mastery.flawlessRounds > 0 && (
                <span className="st-stat-chip st-stat-chip--honey">
                  <CrownIcon size={14} />
                  <span>{mastery.flawlessRounds} Perfect</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="st-level-heading">
        <div className="setup-section-header">
          <h2 id="st-level-heading">1. Tank Height &amp; Level</h2>
          <span className="section-pill">
            {selectedMode.classBadge} • {selectedMode.rangeBadge}
          </span>
        </div>

        <div className="st-mode-grid" role="radiogroup" aria-label="Tank level">
          {SPLASH_MODES.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`st-mode-card ${selected ? 'is-selected' : ''}`}
                data-testid={`splash-mode-${mode.id}`}
                onClick={() => setModeId(mode.id)}
              >
                <div className="st-mode-card__top">
                  <span className="st-class-badge">{mode.classBadge}</span>
                  <span className="st-mode-sample">{mode.sampleEquation}</span>
                </div>
                <strong className="st-mode-card__title">{mode.title}</strong>
                <span className="st-mode-card__sub">{mode.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="st-length-heading">
        <div className="setup-section-header">
          <h2 id="st-length-heading">2. Round Length</h2>
          <span className="section-pill">{roundLength} Tanks</span>
        </div>

        <div className="st-length-row" role="radiogroup" aria-label="Round length">
          {SPLASH_ROUND_LENGTHS.map((item) => {
            const selected = roundLength === item.length;
            return (
              <button
                key={item.length}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`st-pill-card ${selected ? 'is-selected' : ''}`}
                data-testid={`splash-length-${item.length}`}
                onClick={() => setRoundLength(item.length)}
              >
                <strong>{item.label}</strong>
                <span>{item.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="setup-start-bar">
        <button
          type="button"
          className="btn-primary setup-start-btn"
          onClick={handleStart}
          data-testid="start-splash-tank-btn"
        >
          <span>Start Pouring</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

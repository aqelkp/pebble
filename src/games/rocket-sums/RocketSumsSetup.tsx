import { useEffect, useMemo, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  getDefaultRocketSumsConfig,
  getRocketModeSpec,
  loadRocketMastery,
  ROCKET_MODES,
  ROCKET_ROUND_LENGTHS,
  type RocketModeId,
  type RocketRoundLength,
  type RocketSumsConfig,
  type RocketVisualMode,
} from './rocketData';
import { preloadRocketAssets } from './rocketSounds';
import './RocketSums.css';

interface RocketSumsSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: RocketSumsConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: RocketSumsConfig) => void;
}

export function RocketSumsSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: RocketSumsSetupProps) {
  const defaults = getDefaultRocketSumsConfig();
  const [modeId, setModeId] = useState<RocketModeId>(initialConfig?.modeId ?? defaults.modeId);
  const [visualMode, setVisualMode] = useState<RocketVisualMode>(
    initialConfig?.visualMode ?? defaults.visualMode,
  );
  const [roundLength, setRoundLength] = useState<RocketRoundLength>(
    initialConfig?.roundLength ?? defaults.roundLength,
  );

  const mastery = useMemo(() => loadRocketMastery(), []);
  const selectedMode = getRocketModeSpec(modeId);

  useEffect(() => {
    preloadRocketAssets();
  }, []);

  const handleSelectMode = (nextModeId: RocketModeId) => {
    setModeId(nextModeId);
    const spec = getRocketModeSpec(nextModeId);
    if (!spec.supportsPictures) {
      setVisualMode('numbers-only');
    }
  };

  const handleStart = () => {
    onStartGame({
      classLevel: selectedMode.classLevel,
      modeId,
      visualMode: selectedMode.supportsPictures ? visualMode : 'numbers-only',
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
            data-testid="rocket-setup-back-btn"
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

      <section className="setup-card-section rs-setup-hero">
        <div className="rs-setup-hero__art">
          <img src={assetUrl('hub/rocket-sums.png')} alt="" />
        </div>
        <div className="rs-setup-hero__copy">
          <h1>Rocket Sums</h1>
          <p>
            Answer quick addition facts to fuel your rocket to the Moon! Fast answers earn a Turbo
            Boost; after 10 seconds we check in calmly and show a fresh problem.
          </p>
          {mastery.totalSolved > 0 && (
            <div className="rs-setup-stats-row">
              <span className="rs-stat-chip">{mastery.totalSolved} sums solved</span>
              {mastery.fastRecalls > 0 && (
                <span className="rs-stat-chip rs-stat-chip--mint">
                  {mastery.fastRecalls} fast recalls
                </span>
              )}
              {mastery.flawlessRounds > 0 && (
                <span className="rs-stat-chip rs-stat-chip--honey">
                  <CrownIcon size={14} />
                  <span>{mastery.flawlessRounds} Perfect</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="rs-level-heading">
        <div className="setup-section-header">
          <h2 id="rs-level-heading">1. Class Level &amp; Number Range</h2>
          <span className="section-pill">
            {selectedMode.classBadge} • {selectedMode.rangeBadge}
          </span>
        </div>

        <div className="rs-mode-grid" role="radiogroup" aria-label="Addition level">
          {ROCKET_MODES.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`rs-mode-card ${selected ? 'is-selected' : ''}`}
                data-testid={`rocket-mode-${mode.id}`}
                onClick={() => handleSelectMode(mode.id)}
              >
                <div className="rs-mode-card__top">
                  <span className="rs-class-badge">{mode.classBadge}</span>
                  <span className="rs-mode-sample">{mode.sampleEquation}</span>
                </div>
                <strong className="rs-mode-card__title">{mode.title}</strong>
                <span className="rs-mode-card__sub">{mode.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="rs-visual-heading">
        <div className="setup-section-header">
          <h2 id="rs-visual-heading">2. Visual Style &amp; Launches</h2>
          <span className="section-pill">{roundLength} Launches</span>
        </div>

        <div
          className="rs-option-row"
          role="radiogroup"
          aria-label="Visual style"
          style={{ marginBottom: 10 }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={visualMode === 'pictures-and-numbers'}
            disabled={!selectedMode.supportsPictures}
            className={`rs-pill-card ${visualMode === 'pictures-and-numbers' ? 'is-selected' : ''}`}
            data-testid="rocket-visual-pictures"
            onClick={() => setVisualMode('pictures-and-numbers')}
          >
            <strong>Pictures + Numbers</strong>
            <span>5 apples + 2 apples</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={visualMode === 'numbers-only'}
            className={`rs-pill-card ${visualMode === 'numbers-only' ? 'is-selected' : ''}`}
            data-testid="rocket-visual-numbers"
            onClick={() => setVisualMode('numbers-only')}
          >
            <strong>Pure Numbers</strong>
            <span>Fast mental recall (5 + 2)</span>
          </button>
        </div>

        <div
          className="rs-option-row rs-option-row--3"
          role="radiogroup"
          aria-label="Round length"
        >
          {ROCKET_ROUND_LENGTHS.map((opt) => {
            const selected = opt.length === roundLength;
            return (
              <button
                key={opt.length}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`rs-pill-card ${selected ? 'is-selected' : ''}`}
                data-testid={`rocket-length-${opt.length}`}
                onClick={() => setRoundLength(opt.length)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {selectedMode.classBadge}: {selectedMode.title} • {roundLength} Launches
          </strong>
          <span>Only correct answers move the rocket forward!</span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-rocket-sums-btn"
          onClick={handleStart}
        >
          Launch Rocket Sums!
        </button>
      </footer>
    </div>
  );
}

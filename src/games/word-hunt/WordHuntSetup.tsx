import { useEffect, useMemo, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  formatWordCase,
  getDefaultWordHuntConfig,
  getWordHuntGridSpec,
  getWordHuntPackSpec,
  loadWordHuntMastery,
  WORD_HUNT_GRID_SIZES,
  WORD_HUNT_PACKS,
  type WordHuntCaseMode,
  type WordHuntConfig,
  type WordHuntGridSize,
  type WordHuntPackId,
} from './wordHuntData';
import { preloadWordHuntAudio } from './wordHuntSounds';
import './WordHunt.css';

interface WordHuntSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: WordHuntConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: WordHuntConfig) => void;
}

export function WordHuntSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: WordHuntSetupProps) {
  const defaults = getDefaultWordHuntConfig();
  const [gridSize, setGridSize] = useState<WordHuntGridSize>(
    initialConfig?.gridSize ?? defaults.gridSize,
  );
  const [packId, setPackId] = useState<WordHuntPackId>(
    initialConfig?.packId ?? defaults.packId,
  );
  const [caseMode, setCaseMode] = useState<WordHuntCaseMode>(
    initialConfig?.caseMode ?? defaults.caseMode,
  );

  const mastery = useMemo(() => loadWordHuntMastery(), []);
  const selectedGrid = getWordHuntGridSpec(gridSize);
  const selectedPack = getWordHuntPackSpec(packId);

  useEffect(() => {
    preloadWordHuntAudio(['cat', 'dog', 'sun', 'the', 'see', 'cup']);
  }, []);

  const handleStart = () => {
    onStartGame({
      gridSize,
      packId,
      caseMode,
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
            data-testid="word-hunt-setup-back-btn"
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

      <section className="setup-card-section wh-setup-hero">
        <div className="wh-setup-hero__art">
          <img src={assetUrl('hub/word-hunt.png')} alt="" />
        </div>
        <div className="wh-setup-hero__copy">
          <h1>Word Hunt</h1>
          <p>
            Scan the letter grid to spot hidden words! Swipe across the letters or tap the first
            and last letter to highlight each word in the Word Bank.
          </p>
          {mastery.gridsCompleted > 0 && (
            <div className="wh-setup-stats-row">
              <span className="wh-stat-chip">{mastery.wordsFound} words found</span>
              <span className="wh-stat-chip wh-stat-chip--mint">
                {mastery.gridsCompleted} {mastery.gridsCompleted === 1 ? 'grid' : 'grids'} solved
              </span>
              {mastery.flawlessGrids > 0 && (
                <span className="wh-stat-chip wh-stat-chip--honey">
                  <CrownIcon size={14} />
                  <span>{mastery.flawlessGrids} Perfect</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="wh-grid-heading">
        <div className="setup-section-header">
          <h2 id="wh-grid-heading">1. Grid Size</h2>
          <span className="section-pill">
            {selectedGrid.badge} • {selectedGrid.directionHint}
          </span>
        </div>

        <div className="wh-grid-size-row" role="radiogroup" aria-label="Grid Size">
          {WORD_HUNT_GRID_SIZES.map((spec) => {
            const active = spec.id === gridSize;
            return (
              <button
                key={spec.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`wh-choice-card ${active ? 'is-selected' : ''}`}
                onClick={() => setGridSize(spec.id)}
                data-testid={`wh-size-${spec.id}`}
              >
                <div className="wh-choice-card__top">
                  <strong>{spec.label}</strong>
                  <span className="wh-choice-badge">{spec.badge}</span>
                </div>
                <span className="wh-choice-card__desc">{spec.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="wh-pack-heading">
        <div className="setup-section-header">
          <h2 id="wh-pack-heading">2. Word Pack</h2>
          <span className="section-pill">{selectedPack.title}</span>
        </div>

        <div className="wh-pack-grid" role="radiogroup" aria-label="Word Pack">
          {WORD_HUNT_PACKS.map((pack) => {
            const active = pack.id === packId;
            return (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`wh-pack-card ${active ? 'is-selected' : ''}`}
                onClick={() => setPackId(pack.id)}
                data-testid={`wh-pack-${pack.id}`}
              >
                <div className="wh-pack-card__header">
                  <span
                    className="wh-pack-dot"
                    style={{ backgroundColor: pack.accentColor }}
                    aria-hidden="true"
                  />
                  <strong>{pack.title}</strong>
                </div>
                <span className="wh-pack-card__sub">{pack.subtitle}</span>
                <div className="wh-pack-samples">
                  {pack.sampleWords.map((w) => (
                    <span key={w} className="wh-sample-chip">
                      {formatWordCase(w, caseMode)}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section wh-case-section" aria-labelledby="wh-case-heading">
        <div className="wh-case-row">
          <div>
            <h2 id="wh-case-heading" style={{ margin: 0, fontSize: '1rem' }}>
              3. Letter Style
            </h2>
            <p className="wh-case-sub">Choose uppercase or lowercase grid tiles</p>
          </div>
          <div className="wh-case-toggle" role="radiogroup" aria-label="Letter Style">
            <button
              type="button"
              role="radio"
              aria-checked={caseMode === 'upper'}
              className={`wh-case-btn ${caseMode === 'upper' ? 'is-selected' : ''}`}
              onClick={() => setCaseMode('upper')}
              data-testid="wh-case-upper"
            >
              ABC
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={caseMode === 'lower'}
              className={`wh-case-btn ${caseMode === 'lower' ? 'is-selected' : ''}`}
              onClick={() => setCaseMode('lower')}
              data-testid="wh-case-lower"
            >
              abc
            </button>
          </div>
        </div>
      </section>

      <div className="setup-cta-bar">
        <button
          type="button"
          className="btn-primary wh-start-btn"
          onClick={handleStart}
          data-testid="word-hunt-start-btn"
        >
          <span>Start Word Hunt</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

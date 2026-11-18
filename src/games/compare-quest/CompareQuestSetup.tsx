import { useEffect, useMemo, useState } from 'react';
import { BrandLogo, CrownIcon } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  buildCompareRoundDeck,
  COMPARE_MODES,
  COMPARE_ROUND_SIZES,
  getCompareModeSpec,
  getDefaultCompareQuestConfig,
  loadCompareMastery,
  type CompareModeId,
  type CompareQuestConfig,
  type CompareRoundSize,
} from './compareData';
import { preloadCompareRoundAssets } from './compareSounds';
import './CompareQuest.css';

interface CompareQuestSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: CompareQuestConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: CompareQuestConfig) => void;
}

export function CompareQuestSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: CompareQuestSetupProps) {
  const defaults = getDefaultCompareQuestConfig();
  const [modeId, setModeId] = useState<CompareModeId>(initialConfig?.modeId ?? defaults.modeId);
  const [roundSize, setRoundSize] = useState<CompareRoundSize>(
    initialConfig?.roundSize ?? defaults.roundSize,
  );

  const mastery = useMemo(() => loadCompareMastery(), []);

  useEffect(() => {
    const sampleDeck = buildCompareRoundDeck({ modeId, roundSize });
    preloadCompareRoundAssets(sampleDeck);
  }, [modeId, roundSize]);

  const selectedMode = getCompareModeSpec(modeId);

  const handleStart = () => {
    onStartGame({
      modeId,
      roundSize,
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
            data-testid="compare-setup-back-btn"
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

      <section className="setup-card-section cq-setup-hero">
        <div className="cq-setup-hero__art">
          <img src={assetUrl('hub/compare-quest.png')} alt="" />
        </div>
        <div className="cq-setup-hero__copy">
          <h1>Compare Quest</h1>
          <p>
            Compare baskets, sticks &amp; towers, juice jugs, and workbook numbers (0–10) — tap,
            drag, or write <strong>&gt;</strong>, <strong>=</strong>, or <strong>&lt;</strong> in
            the center box!
          </p>
          {mastery.roundsCompleted > 0 && (
            <div className="cq-setup-stats-row">
              <span className="cq-stat-chip">
                {mastery.totalSolved} comparisons solved
              </span>
              {mastery.flawlessRounds > 0 && (
                <span className="cq-stat-chip cq-stat-chip--honey">
                  <CrownIcon size={14} />
                  <span>
                    {mastery.flawlessRounds} Perfect{' '}
                    {mastery.flawlessRounds === 1 ? 'Crown' : 'Crowns'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="cq-modes-heading">
        <div className="setup-section-header">
          <h2 id="cq-modes-heading">1. Choose Comparison World</h2>
          <span className="section-pill">{selectedMode.rangeBadge}</span>
        </div>

        <div className="cq-mode-grid" role="radiogroup" aria-label="Comparison mode">
          {COMPARE_MODES.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`cq-mode-card ${mode.id === 'mix' ? 'cq-mode-card--wide' : ''} ${
                  selected ? 'is-selected' : ''
                }`}
                data-testid={`compare-mode-${mode.id}`}
                onClick={() => setModeId(mode.id)}
              >
                <div className="cq-mode-card__top">
                  <span className="cq-mode-badge">{mode.rangeBadge}</span>
                  <span className="cq-mode-sample">{mode.sampleEquation}</span>
                </div>
                <strong className="cq-mode-card__title">
                  {mode.title}
                  {mode.id === 'mix' ? ' (Recommended)' : ''}
                </strong>
                <span className="cq-mode-card__sub">{mode.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="cq-size-heading">
        <div className="setup-section-header">
          <h2 id="cq-size-heading">2. Round Length</h2>
          <span className="section-pill">{roundSize} prompts</span>
        </div>

        <div className="cq-round-size-grid" role="radiogroup" aria-label="Round length">
          {COMPARE_ROUND_SIZES.map((opt) => {
            const selected = opt.size === roundSize;
            return (
              <button
                key={opt.size}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`cq-size-btn ${selected ? 'is-selected' : ''}`}
                data-testid={`compare-size-${opt.size}`}
                onClick={() => setRoundSize(opt.size)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.subtitle}</span>
              </button>
            );
          })}
        </div>

        <div className="cq-notebook-preview" aria-label="Symbol guide">
          <span className="cq-notebook-preview__item">
            <span>Less than</span>
            <span className="cq-notebook-preview__sym">&lt;</span>
          </span>
          <span className="cq-notebook-preview__item">
            <span>Greater than</span>
            <span className="cq-notebook-preview__sym">&gt;</span>
          </span>
          <span className="cq-notebook-preview__item">
            <span>Equal to</span>
            <span className="cq-notebook-preview__sym">=</span>
          </span>
        </div>
      </section>

      <footer className="setup-launch-bar">
        <div className="setup-launch-summary">
          <strong>
            {selectedMode.title} • {roundSize} Prompts
          </strong>
          <span>Wide open side points toward the bigger side!</span>
        </div>
        <button
          type="button"
          className="btn-primary"
          data-testid="start-compare-quest-btn"
          onClick={handleStart}
        >
          Start Compare Quest!
        </button>
      </footer>
    </div>
  );
}

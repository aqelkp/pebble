import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  DEFAULT_SAFARI_LENGTH_ID,
  DEFAULT_SAFARI_MODE_ID,
  getSafariLengthSpec,
  getSafariModeSpec,
  SAFARI_LENGTHS,
  SAFARI_MODES,
  type SafariLengthId,
  type SafariModeId,
} from './safariData';

export interface SafariGameConfig {
  modeId: SafariModeId;
  lengthId: SafariLengthId;
  playerIds: string[];
}

interface SafariSetupProps {
  profiles: FamilyProfile[];
  initialConfig?: SafariGameConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: SafariGameConfig) => void;
}

export function SafariSetup({
  profiles,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: SafariSetupProps) {
  const [modeId, setModeId] = useState<SafariModeId>(
    initialConfig?.modeId ?? DEFAULT_SAFARI_MODE_ID,
  );
  const [lengthId, setLengthId] = useState<SafariLengthId>(
    initialConfig?.lengthId ?? DEFAULT_SAFARI_LENGTH_ID,
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    const existing = initialConfig?.playerIds.filter((id) =>
      profiles.some((p) => p.id === id),
    );
    if (existing && existing.length >= 1) return existing.slice(0, 4);
    return profiles.slice(0, 2).map((p) => p.id);
  });
  const [playerHint, setPlayerHint] = useState<string | null>(null);

  const togglePlayer = (profileId: string) => {
    setPlayerHint(null);
    setSelectedPlayerIds((prev) => {
      if (prev.includes(profileId)) {
        if (prev.length === 1) {
          setPlayerHint('Pick at least 1 explorer to start the safari.');
          return prev;
        }
        return prev.filter((id) => id !== profileId);
      }
      if (prev.length >= 4) {
        setPlayerHint('Up to 4 players can join one Number Safari game.');
        return prev;
      }
      return [...prev, profileId];
    });
  };

  const orderedSelectedProfiles = profiles.filter((p) => selectedPlayerIds.includes(p.id));
  const selectedMode = getSafariModeSpec(modeId);
  const selectedLength = getSafariLengthSpec(lengthId);

  const handleStart = () => {
    const activeIds =
      orderedSelectedProfiles.length > 0
        ? orderedSelectedProfiles.map((p) => p.id)
        : profiles.slice(0, 2).map((p) => p.id);

    onStartGame({
      modeId,
      lengthId,
      playerIds: activeIds,
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar" style={{ marginBottom: 12 }}>
        <div className="top-bar__left">
          <button type="button" className="icon-pill-btn" onClick={onBackToHub}>
            <span aria-hidden="true">←</span>
            <span>Games</span>
          </button>
        </div>
        <BrandLogo size="sm" />
        <div className="top-bar__right">
          <button type="button" className="icon-pill-btn" onClick={onEditProfiles}>
            <span>Edit Names</span>
          </button>
        </div>
      </header>

      <div className="page-title-block" style={{ marginTop: 4, marginBottom: 12 }}>
        <h1>Number Safari Setup</h1>
        <p>Choose a counting trail, safari length, and family explorers.</p>
      </div>

      {/* 1. Counting Mode Selector */}
      <section className="setup-card-section" aria-labelledby="safari-mode-heading">
        <div className="setup-section-header">
          <h2 id="safari-mode-heading">1. Counting Trail</h2>
          <span className="section-pill">Tap-to-count friendly</span>
        </div>
        <div className="safari-mode-grid">
          {SAFARI_MODES.map((mode) => {
            const isSelected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                className={`safari-mode-card ${isSelected ? 'safari-mode-card--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setModeId(mode.id)}
              >
                <div className="safari-mode-card__top">
                  <span className="badge-pill badge-pill--mint">{mode.rangeBadge}</span>
                  {mode.isDefault ? (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  ) : (
                    <span className="badge-pill badge-pill--muted">{mode.ageHint}</span>
                  )}
                </div>

                <div className="theme-preview-pair safari-mode-card__art">
                  <img src={assetUrl(mode.previewPaths[0])} alt="" />
                  <img src={assetUrl(mode.previewPaths[1])} alt="" />
                </div>

                <span className="safari-mode-card__title">{mode.title}</span>
                <span className="safari-mode-card__sub">{mode.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Trail Length Selector */}
      <section className="setup-card-section" aria-labelledby="safari-length-heading">
        <div className="setup-section-header">
          <h2 id="safari-length-heading">2. Safari Stops</h2>
          <span className="section-pill">Portrait tablet tuned</span>
        </div>
        <div className="board-size-grid">
          {SAFARI_LENGTHS.map((length) => {
            const isSelected = length.id === lengthId;
            return (
              <button
                key={length.id}
                type="button"
                className={`size-option-btn ${isSelected ? 'size-option-btn--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setLengthId(length.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="size-option-btn__dims">{length.label}</span>
                  {length.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{length.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Player Selector */}
      <section className="setup-card-section" aria-labelledby="safari-players-heading">
        <div className="setup-section-header">
          <h2 id="safari-players-heading">3. Explorers (1–4)</h2>
          <span className="section-pill">{orderedSelectedProfiles.length} selected</span>
        </div>
        <div className="player-toggle-grid">
          {profiles.map((profile) => {
            const isSelected = selectedPlayerIds.includes(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                className={`player-toggle-chip ${isSelected ? 'player-toggle-chip--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => togglePlayer(profile.id)}
              >
                <img
                  className="player-toggle-chip__avatar"
                  src={getAvatarSrc(profile.avatar)}
                  alt=""
                />
                <span className="player-toggle-chip__name">{profile.name}</span>
                <span className="player-toggle-chip__check" aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
        {playerHint && (
          <div className="inline-feedback-banner inline-feedback-banner--warning">
            {playerHint}
          </div>
        )}
      </section>

      {/* Primary Action */}
      <div className="setup-footer">
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', maxWidth: 420 }}
          onClick={handleStart}
        >
          Start Safari
        </button>
        <div className="setup-summary-line">
          {selectedMode.title} ({selectedMode.rangeBadge}) • {selectedLength.label} •{' '}
          {orderedSelectedProfiles.map((p) => p.name).join(' & ')}
        </div>
      </div>
    </div>
  );
}

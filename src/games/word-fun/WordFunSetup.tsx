import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { WordFunArt } from './WordFunArt';
import {
  DEFAULT_WORD_HELPER_MODE,
  DEFAULT_WORD_PACK_ID,
  DEFAULT_WORD_ROUND_SIZE_ID,
  WORD_HELPER_MODES,
  WORD_PACKS,
  WORD_ROUND_SIZES,
  getWordPackSpec,
  getWordRoundSizeSpec,
  isValidWordHelperMode,
  isValidWordPackId,
  isValidWordRoundSizeId,
  type WordHelperMode,
  type WordPackId,
  type WordRoundSizeId,
} from './wordBank';

export interface WordGameConfig {
  packId: WordPackId;
  roundSizeId: WordRoundSizeId;
  helperMode: WordHelperMode;
  playerIds: string[];
}

export function isValidWordGameConfig(value: unknown): value is WordGameConfig {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WordGameConfig>;
  return (
    isValidWordPackId(c.packId) &&
    isValidWordRoundSizeId(c.roundSizeId) &&
    isValidWordHelperMode(c.helperMode) &&
    Array.isArray(c.playerIds) &&
    c.playerIds.length >= 1 &&
    c.playerIds.length <= 4 &&
    c.playerIds.every((id) => typeof id === 'string')
  );
}

interface WordFunSetupProps {
  profiles: FamilyProfile[];
  initialConfig?: WordGameConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: WordGameConfig) => void;
}

export function WordFunSetup({
  profiles,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: WordFunSetupProps) {
  const [packId, setPackId] = useState<WordPackId>(
    initialConfig?.packId ?? DEFAULT_WORD_PACK_ID,
  );
  const [roundSizeId, setRoundSizeId] = useState<WordRoundSizeId>(
    initialConfig?.roundSizeId ?? DEFAULT_WORD_ROUND_SIZE_ID,
  );
  const [helperMode, setHelperMode] = useState<WordHelperMode>(
    initialConfig?.helperMode ?? DEFAULT_WORD_HELPER_MODE,
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
          setPlayerHint('Pick at least 1 player to start Word Fun.');
          return prev;
        }
        return prev.filter((id) => id !== profileId);
      }
      if (prev.length >= 4) {
        setPlayerHint('Up to 4 players can join one Word Fun round.');
        return prev;
      }
      return [...prev, profileId];
    });
  };

  const orderedSelectedProfiles = profiles.filter((p) => selectedPlayerIds.includes(p.id));
  const selectedPack = getWordPackSpec(packId);
  const selectedSize = getWordRoundSizeSpec(roundSizeId);
  const selectedHelper =
    WORD_HELPER_MODES.find((m) => m.id === helperMode) ?? WORD_HELPER_MODES[0];

  const handleStart = () => {
    const activeIds =
      orderedSelectedProfiles.length > 0
        ? orderedSelectedProfiles.map((p) => p.id)
        : profiles.slice(0, 2).map((p) => p.id);

    onStartGame({
      packId,
      roundSizeId,
      helperMode,
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

      <div className="page-title-block" style={{ marginTop: 4, marginBottom: 10 }}>
        <h1>Word Fun Setup</h1>
        <p>Pick a cozy first-words pack, round length, and family players.</p>
      </div>

      {/* 1. Word Pack Selector */}
      <section className="setup-card-section" aria-labelledby="setup-wordpack-heading">
        <div className="setup-section-header">
          <h2 id="setup-wordpack-heading">1. Choose a Word Pack</h2>
          <span className="section-pill">Three-letter phonics</span>
        </div>
        <div className="theme-selector-grid">
          {WORD_PACKS.map((pack) => {
            const isSelected = pack.id === packId;
            return (
              <button
                key={pack.id}
                type="button"
                className={`theme-option-card ${isSelected ? 'theme-option-card--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setPackId(pack.id)}
              >
                <div className="theme-preview-pair">
                  <span className="wf-pack-preview-badge">
                    <WordFunArt id={pack.previewIds[0]} size={40} />
                  </span>
                  <span className="wf-pack-preview-badge">
                    <WordFunArt id={pack.previewIds[1]} size={40} />
                  </span>
                </div>
                <span className="theme-option-card__title">{pack.title}</span>
                <span className="theme-option-card__sub">{pack.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Round Length & Letter Mode */}
      <section className="setup-card-section" aria-labelledby="setup-round-heading">
        <div className="setup-section-header">
          <h2 id="setup-round-heading">2. Round &amp; Letter Mode</h2>
          <div className="category-filter-pills" role="group" aria-label="Letter helper mode">
            {WORD_HELPER_MODES.map((mode) => {
              const active = mode.id === helperMode;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`category-pill-btn ${active ? 'category-pill-btn--active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setHelperMode(mode.id)}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="board-size-grid">
          {WORD_ROUND_SIZES.map((size) => {
            const isSelected = size.id === roundSizeId;
            return (
              <button
                key={size.id}
                type="button"
                className={`size-option-btn ${isSelected ? 'size-option-btn--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setRoundSizeId(size.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="size-option-btn__dims">{size.label}</span>
                  {size.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{size.description}</span>
              </button>
            );
          })}
        </div>
        <p className="wf-helper-caption">{selectedHelper.description}</p>
      </section>

      {/* 3. Player Selector */}
      <section className="setup-card-section" aria-labelledby="setup-word-players-heading">
        <div className="setup-section-header">
          <h2 id="setup-word-players-heading">3. Players (1–4)</h2>
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

      <div className="setup-footer">
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', maxWidth: 420 }}
          onClick={handleStart}
        >
          Start Game
        </button>
        <div className="setup-summary-line">
          {selectedPack.title} • {selectedSize.label} • {selectedHelper.label} •{' '}
          {orderedSelectedProfiles.map((p) => p.name).join(' & ')}
        </div>
      </div>
    </div>
  );
}

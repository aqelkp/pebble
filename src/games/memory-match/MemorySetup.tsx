import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  BOARD_SIZES,
  CARD_THEMES,
  DEFAULT_BOARD_SIZE_ID,
  DEFAULT_THEME_ID,
  getBoardSizeSpec,
  getThemeSpec,
  type BoardSizeId,
  type ThemeId,
} from './themes';

export interface MemoryGameConfig {
  themeId: ThemeId;
  boardSizeId: BoardSizeId;
  playerIds: string[];
}

interface MemorySetupProps {
  profiles: FamilyProfile[];
  initialConfig?: MemoryGameConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: MemoryGameConfig) => void;
}

export function MemorySetup({
  profiles,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: MemorySetupProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialConfig?.themeId ?? DEFAULT_THEME_ID);
  const [boardSizeId, setBoardSizeId] = useState<BoardSizeId>(
    initialConfig?.boardSizeId ?? DEFAULT_BOARD_SIZE_ID,
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
          setPlayerHint('Pick at least 1 player to start the game.');
          return prev;
        }
        return prev.filter((id) => id !== profileId);
      }
      if (prev.length >= 4) {
        setPlayerHint('Up to 4 players can join one Memory Match game.');
        return prev;
      }
      return [...prev, profileId];
    });
  };

  // Preserve family order from profiles when starting the turn queue
  const orderedSelectedProfiles = profiles.filter((p) => selectedPlayerIds.includes(p.id));
  const selectedTheme = getThemeSpec(themeId);
  const selectedSize = getBoardSizeSpec(boardSizeId);

  const handleStart = () => {
    const activeIds =
      orderedSelectedProfiles.length > 0
        ? orderedSelectedProfiles.map((p) => p.id)
        : profiles.slice(0, 2).map((p) => p.id);

    onStartGame({
      themeId,
      boardSizeId,
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

      <div className="page-title-block" style={{ marginTop: 6, marginBottom: 14 }}>
        <h1>Memory Match Setup</h1>
        <p>Pick your favorite characters, card layout, and family players.</p>
      </div>

      {/* 1. Theme Selector */}
      <section className="setup-card-section" aria-labelledby="setup-theme-heading">
        <div className="setup-section-header">
          <h2 id="setup-theme-heading">1. Character Theme</h2>
          <span className="section-pill">16 pairs ready</span>
        </div>
        <div className="theme-selector-grid">
          {CARD_THEMES.map((theme) => {
            const isSelected = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-option-card ${isSelected ? 'theme-option-card--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setThemeId(theme.id)}
              >
                <div className="theme-preview-pair">
                  <img src={assetUrl(theme.previewPaths[0])} alt="" />
                  <img src={assetUrl(theme.previewPaths[1])} alt="" />
                </div>
                <span className="theme-option-card__title">{theme.title}</span>
                <span className="theme-option-card__sub">{theme.subtitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Board Size Selector (4x5 Default) */}
      <section className="setup-card-section" aria-labelledby="setup-size-heading">
        <div className="setup-section-header">
          <h2 id="setup-size-heading">2. Board Layout</h2>
          <span className="section-pill">Portrait tablet tuned</span>
        </div>
        <div className="board-size-grid">
          {BOARD_SIZES.map((size) => {
            const isSelected = size.id === boardSizeId;
            return (
              <button
                key={size.id}
                type="button"
                className={`size-option-btn ${isSelected ? 'size-option-btn--selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setBoardSizeId(size.id)}
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
      </section>

      {/* 3. Player Selector */}
      <section className="setup-card-section" aria-labelledby="setup-players-heading">
        <div className="setup-section-header">
          <h2 id="setup-players-heading">3. Players (1–4)</h2>
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
          Start Game
        </button>
        <div className="setup-summary-line">
          {selectedTheme.title} • {selectedSize.label} ({selectedSize.pairs} pairs) •{' '}
          {orderedSelectedProfiles.map((p) => p.name).join(' & ')}
        </div>
      </div>
    </div>
  );
}

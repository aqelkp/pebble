import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { getAvatarSrc, type FamilyProfile } from '../../context/FamilyProfilesContext';
import { assetUrl } from '../../utils/assets';
import {
  CARD_THEMES,
  DEFAULT_THEME_ID,
  getThemeSpec,
  type ThemeId,
} from '../memory-match/themes';
import {
  DEFAULT_SUDOKU_SIZE,
  SUDOKU_SIZES,
  getSudokuSizeSpec,
  type SudokuSize,
} from './sudokuEngine';

export interface PictureSudokuConfig {
  themeId: ThemeId;
  size: SudokuSize;
}

export function getDefaultPictureSudokuConfig(): PictureSudokuConfig {
  return {
    themeId: DEFAULT_THEME_ID,
    size: DEFAULT_SUDOKU_SIZE,
  };
}

export function isValidPictureSudokuConfig(value: unknown): value is PictureSudokuConfig {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PictureSudokuConfig>;
  const validSize = candidate.size === 3 || candidate.size === 4 || candidate.size === 5;
  const validTheme =
    typeof candidate.themeId === 'string' &&
    CARD_THEMES.some((theme) => theme.id === candidate.themeId);
  return validSize && validTheme;
}

interface PictureSudokuSetupProps {
  childProfile: FamilyProfile;
  initialConfig?: PictureSudokuConfig | null;
  onBackToHub: () => void;
  onEditProfiles: () => void;
  onStartGame: (config: PictureSudokuConfig) => void;
}

type CategoryFilter = 'all' | 'stories' | 'world';

export function PictureSudokuSetup({
  childProfile,
  initialConfig,
  onBackToHub,
  onEditProfiles,
  onStartGame,
}: PictureSudokuSetupProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialConfig?.themeId ?? DEFAULT_THEME_ID);
  const [size, setSize] = useState<SudokuSize>(initialConfig?.size ?? DEFAULT_SUDOKU_SIZE);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const selectedTheme = getThemeSpec(themeId);
  const selectedSize = getSudokuSizeSpec(size);
  const storiesCount = CARD_THEMES.filter((t) => t.category === 'stories').length;
  const worldCount = CARD_THEMES.filter((t) => t.category === 'world').length;
  const visibleThemes =
    categoryFilter === 'all'
      ? CARD_THEMES
      : CARD_THEMES.filter((t) => t.category === categoryFilter);

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
          <button
            type="button"
            className="icon-pill-btn"
            onClick={onEditProfiles}
            aria-label="Edit player profile"
          >
            <img
              src={getAvatarSrc(childProfile.avatar)}
              alt=""
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span>{childProfile.name}</span>
          </button>
        </div>
      </header>

      <div className="page-title-block" style={{ marginTop: 4, marginBottom: 10 }}>
        <h1>Picture Sudoku Setup</h1>
        <p>Pick a grid size and picture theme—every row and column has each picture once!</p>
      </div>

      {/* 1. Grid Size Selector */}
      <section className="setup-card-section" aria-labelledby="sudoku-size-heading">
        <div className="setup-section-header">
          <h2 id="sudoku-size-heading">1. Choose Grid Size</h2>
          <span className="section-pill">{selectedSize.label}</span>
        </div>

        <div className="board-size-grid">
          {SUDOKU_SIZES.map((spec) => {
            const selected = spec.size === size;
            return (
              <button
                key={spec.size}
                type="button"
                className={`size-option-btn ${selected ? 'size-option-btn--selected' : ''}`}
                onClick={() => setSize(spec.size)}
                aria-pressed={selected}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="size-option-btn__dims">{spec.label}</span>
                  {spec.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{spec.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Theme Selector */}
      <section className="setup-card-section" aria-labelledby="sudoku-theme-heading">
        <div className="setup-section-header">
          <h2 id="sudoku-theme-heading">2. Choose Picture Theme</h2>
          <div className="category-filter-pills" role="group" aria-label="Theme categories">
            <button
              type="button"
              aria-pressed={categoryFilter === 'all'}
              className={`category-pill-btn ${
                categoryFilter === 'all' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('all')}
            >
              All ({CARD_THEMES.length})
            </button>
            <button
              type="button"
              aria-pressed={categoryFilter === 'stories'}
              className={`category-pill-btn ${
                categoryFilter === 'stories' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('stories')}
            >
              Stories ({storiesCount})
            </button>
            <button
              type="button"
              aria-pressed={categoryFilter === 'world'}
              className={`category-pill-btn ${
                categoryFilter === 'world' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('world')}
            >
              World &amp; Sports ({worldCount})
            </button>
          </div>
        </div>

        <div className="theme-selector-grid">
          {visibleThemes.map((theme) => {
            const selected = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                className={`theme-option-card ${selected ? 'theme-option-card--selected' : ''}`}
                onClick={() => setThemeId(theme.id)}
                aria-pressed={selected}
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

      <div className="setup-cta-bar">
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={() => onStartGame({ themeId, size })}
        >
          Start {selectedSize.label} {selectedTheme.title} Sudoku
        </button>
      </div>
    </div>
  );
}

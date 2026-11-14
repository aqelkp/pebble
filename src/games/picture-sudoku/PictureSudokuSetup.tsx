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

      <div className="setup-page">
        <section className="setup-section">
          <div className="setup-section__head">
            <div>
              <h2>1. Choose Grid Size</h2>
              <p>Every row and column has each picture once—no repeats!</p>
            </div>
            <span className="section-pill">{selectedSize.label}</span>
          </div>

          <div className="size-grid">
            {SUDOKU_SIZES.map((spec) => {
              const selected = spec.size === size;
              return (
                <button
                  key={spec.size}
                  type="button"
                  className={`size-option ${selected ? 'size-option--selected' : ''}`}
                  onClick={() => setSize(spec.size)}
                  aria-pressed={selected}
                >
                  <div className="size-option__title">
                    {spec.label}
                    {spec.isDefault && <span className="size-option__badge">Default</span>}
                  </div>
                  <div className="size-option__desc">{spec.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="setup-section">
          <div className="setup-section__head">
            <div>
              <h2>2. Choose Picture Theme</h2>
              <p>Pick a favorite group of related pictures for the puzzle.</p>
            </div>
            <span className="section-pill">{selectedTheme.title}</span>
          </div>

          <div className="category-filter-row" role="tablist" aria-label="Theme categories">
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'all'}
              className={`category-pill-btn ${
                categoryFilter === 'all' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('all')}
            >
              All ({CARD_THEMES.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'stories'}
              className={`category-pill-btn ${
                categoryFilter === 'stories' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('stories')}
            >
              Stories ({storiesCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={categoryFilter === 'world'}
              className={`category-pill-btn ${
                categoryFilter === 'world' ? 'category-pill-btn--active' : ''
              }`}
              onClick={() => setCategoryFilter('world')}
            >
              World &amp; Sports ({worldCount})
            </button>
          </div>

          <div className="theme-grid">
            {visibleThemes.map((theme) => {
              const selected = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-option ${selected ? 'theme-option--selected' : ''}`}
                  onClick={() => setThemeId(theme.id)}
                  aria-pressed={selected}
                >
                  <div className="theme-option__preview">
                    {theme.previewPaths.map((path) => (
                      <img key={path} src={assetUrl(path)} alt="" />
                    ))}
                  </div>
                  <div className="theme-option__meta">
                    <div className="theme-option__title">{theme.title}</div>
                    <div className="theme-option__sub">{theme.subtitle}</div>
                  </div>
                  {selected && (
                    <span className="theme-option__check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="setup-footer">
          <button
            type="button"
            className="btn-primary setup-footer__cta"
            onClick={() => onStartGame({ themeId, size })}
          >
            Start {selectedSize.label} {selectedTheme.title} Sudoku
          </button>
        </div>
      </div>
    </div>
  );
}

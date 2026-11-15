import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import {
  CARD_THEMES,
  DEFAULT_THEME_ID,
  type ThemeCategory,
  type ThemeId,
} from '../memory-match/themes';
import { assetUrl } from '../../utils/assets';
import {
  JIGSAW_ROUND_OPTIONS,
  JIGSAW_SIZE_SPECS,
  type JigsawGridSize,
  type JigsawRoundSize,
  type StickerJigsawConfig,
} from './jigsawEngine';

interface StickerJigsawSetupProps {
  onBackToHub: () => void;
  onStartGame: (config: StickerJigsawConfig) => void;
  initialConfig?: StickerJigsawConfig;
}

export function StickerJigsawSetup({
  onBackToHub,
  onStartGame,
  initialConfig,
}: StickerJigsawSetupProps) {
  const [size, setSize] = useState<JigsawGridSize>(initialConfig?.size ?? '2x2');
  const [roundSize, setRoundSize] = useState<JigsawRoundSize>(
    initialConfig?.roundSize ?? '3-puzzles',
  );
  const [themeId, setThemeId] = useState<ThemeId>(initialConfig?.themeId ?? DEFAULT_THEME_ID);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ThemeCategory>('all');

  const storiesCount = CARD_THEMES.filter((t) => t.category === 'stories').length;
  const worldCount = CARD_THEMES.filter((t) => t.category === 'world').length;
  const visibleThemes =
    categoryFilter === 'all'
      ? CARD_THEMES
      : CARD_THEMES.filter((t) => t.category === categoryFilter);

  const selectedTheme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
  const selectedSize = JIGSAW_SIZE_SPECS.find((s) => s.id === size) ?? JIGSAW_SIZE_SPECS[0];

  return (
    <div className="setup-screen">
      <div className="setup-topbar">
        <button type="button" className="btn-secondary" onClick={onBackToHub}>
          ← Games
        </button>
        <BrandLogo size="md" subtitle="Sticker Jigsaw Setup" />
      </div>

      <section className="setup-card-section" aria-labelledby="sj-size-heading">
        <div className="setup-section-header">
          <h2 id="sj-size-heading">1. Puzzle Pieces</h2>
        </div>

        <div className="board-size-grid">
          {JIGSAW_SIZE_SPECS.map((spec) => {
            const active = size === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setSize(spec.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
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

      <section className="setup-card-section" aria-labelledby="sj-round-heading">
        <div className="setup-section-header">
          <h2 id="sj-round-heading">2. Stickers to Build</h2>
        </div>

        <div className="board-size-grid">
          {JIGSAW_ROUND_OPTIONS.map((opt) => {
            const active = roundSize === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setRoundSize(opt.id)}
                aria-pressed={active}
              >
                <div className="size-option-btn__top">
                  <span className="size-option-btn__dims">{opt.label}</span>
                  {opt.isDefault && (
                    <span className="badge-pill badge-pill--indigo">Default</span>
                  )}
                </div>
                <span className="size-option-btn__meta">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="setup-card-section" aria-labelledby="sj-theme-heading">
        <div className="setup-section-header">
          <h2 id="sj-theme-heading">3. Choose Sticker Theme</h2>
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
          onClick={() => onStartGame({ size, roundSize, themeId })}
        >
          Build {selectedSize.label} {selectedTheme.title} Stickers
        </button>
      </div>
    </div>
  );
}

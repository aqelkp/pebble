import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { assetUrl } from '../../utils/assets';
import { CARD_THEMES, DEFAULT_THEME_ID, type ThemeId } from '../memory-match/themes';
import {
  STICKER_COUNT_OPTIONS,
  STICKER_ROUND_OPTIONS,
  type StickerCountOption,
  type StickerRoundSize,
  type StickerSceneConfig,
} from './sceneEngine';

interface StickerSceneSetupProps {
  onBackToHub: () => void;
  onStartGame: (config: StickerSceneConfig) => void;
  initialConfig?: StickerSceneConfig;
}

export function StickerSceneSetup({
  onBackToHub,
  onStartGame,
  initialConfig,
}: StickerSceneSetupProps) {
  const [stickerCount, setStickerCount] = useState<StickerCountOption>(
    initialConfig?.stickerCount ?? 4,
  );
  const [roundSize, setRoundSize] = useState<StickerRoundSize>(
    initialConfig?.roundSize ?? '2-scenes',
  );
  const [themeId, setThemeId] = useState<ThemeId>(initialConfig?.themeId ?? DEFAULT_THEME_ID);

  const selectedTheme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];

  return (
    <div className="setup-screen">
      <div className="setup-topbar">
        <button type="button" className="btn-secondary" onClick={onBackToHub}>
          ← Games
        </button>
        <BrandLogo size="md" subtitle="Sticker Scene Setup" />
      </div>

      <section className="setup-card-section" aria-labelledby="ss-count-heading">
        <div className="setup-section-header">
          <h2 id="ss-count-heading">1. Stickers per Scene</h2>
        </div>

        <div className="board-size-grid">
          {STICKER_COUNT_OPTIONS.map((opt) => {
            const active = stickerCount === opt.count;
            return (
              <button
                key={opt.count}
                type="button"
                className={`size-option-btn ${active ? 'size-option-btn--selected' : ''}`}
                onClick={() => setStickerCount(opt.count)}
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

      <section className="setup-card-section" aria-labelledby="ss-round-heading">
        <div className="setup-section-header">
          <h2 id="ss-round-heading">2. How Many Scenes?</h2>
        </div>

        <div className="board-size-grid">
          {STICKER_ROUND_OPTIONS.map((opt) => {
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

      <section className="setup-card-section" aria-labelledby="ss-theme-heading">
        <div className="setup-section-header">
          <h2 id="ss-theme-heading">3. Choose Sticker Pack</h2>
        </div>

        <div className="theme-selector-grid">
          {CARD_THEMES.map((theme) => {
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
          onClick={() => onStartGame({ stickerCount, roundSize, themeId })}
        >
          Start {selectedTheme.title} Stickers
        </button>
      </div>
    </div>
  );
}
